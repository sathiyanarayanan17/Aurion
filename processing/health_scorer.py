"""
Aurion - Health Score Processor
Consumes telemetry from Kafka, computes real-time health scores using sliding windows.
"""

import json
import time
import logging
from collections import defaultdict, deque
from typing import Dict, List, Optional

import numpy as np
from kafka import KafkaConsumer, KafkaProducer

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("aurion.health_scorer")


class SlidingWindow:
    """Time-based sliding window for a single metric."""

    def __init__(self, window_seconds: int):
        self.window_seconds = window_seconds
        self.data = deque()  # (timestamp, value)

    def add(self, timestamp: float, value: float):
        self.data.append((timestamp, value))
        self._evict(timestamp)

    def _evict(self, current_time: float):
        cutoff = current_time - self.window_seconds
        while self.data and self.data[0][0] < cutoff:
            self.data.popleft()

    def values(self) -> List[float]:
        return [v for _, v in self.data]

    def mean(self) -> float:
        vals = self.values()
        return np.mean(vals) if vals else 0.0

    def std(self) -> float:
        vals = self.values()
        return np.std(vals) if len(vals) > 1 else 0.0

    def slope(self) -> float:
        """Linear regression slope (trend)."""
        vals = self.values()
        if len(vals) < 3:
            return 0.0
        x = np.arange(len(vals))
        try:
            coeffs = np.polyfit(x, vals, 1)
            return coeffs[0]
        except (np.linalg.LinAlgError, ValueError):
            return 0.0

    def max(self) -> float:
        vals = self.values()
        return np.max(vals) if vals else 0.0

    def min(self) -> float:
        vals = self.values()
        return np.min(vals) if vals else 0.0

    def count(self) -> int:
        return len(self.data)

    def count_above(self, threshold: float) -> int:
        return sum(1 for _, v in self.data if v > threshold)


class ChargerHealthState:
    """Maintains sliding windows for a single charger's health computation."""

    def __init__(self):
        # Short windows (for immediate alerts)
        self.temperature_10m = SlidingWindow(600)      # 10 minutes
        self.voltage_15m = SlidingWindow(900)          # 15 minutes
        self.current_10m = SlidingWindow(600)          # 10 minutes
        self.connection_drops_1h = SlidingWindow(3600) # 1 hour

        # Medium windows (for trend analysis)
        self.temperature_1h = SlidingWindow(3600)      # 1 hour
        self.voltage_1h = SlidingWindow(3600)          # 1 hour
        self.power_1h = SlidingWindow(3600)            # 1 hour

        # Long windows (for session analysis)
        self.session_outcomes_24h = SlidingWindow(86400)  # 24 hours (1=success, 0=failure)
        self.error_count_6h = SlidingWindow(21600)        # 6 hours

        # State tracking
        self.last_connector_status = "available"
        self.last_state = "idle"
        self.health_score = 100.0
        self.risk_level = "LOW"
        self.last_update = 0.0

    def update(self, telemetry: dict):
        """Process a new telemetry reading."""
        ts = telemetry["timestamp"]
        self.last_update = ts

        # Update temperature windows
        temp = telemetry["temperature"]
        self.temperature_10m.add(ts, temp)
        self.temperature_1h.add(ts, temp)

        # Update voltage windows
        voltage = telemetry["voltage"]
        self.voltage_15m.add(ts, voltage)
        self.voltage_1h.add(ts, voltage)

        # Update current
        current = telemetry["current"]
        self.current_10m.add(ts, current)

        # Update power
        power = telemetry.get("power_kw", 0)
        self.power_1h.add(ts, power)

        # Track connection drops
        new_status = telemetry["connector_status"]
        if self.last_connector_status == "connected_charging" and new_status in ("faulted", "offline", "available"):
            # Unexpected disconnect during charging
            if new_status != "available" or telemetry.get("soc_percent", 100) < 80:
                self.connection_drops_1h.add(ts, 1.0)
        self.last_connector_status = new_status

        # Track session outcomes
        new_state = telemetry["state"]
        if self.last_state == "charging" and new_state != "charging":
            if new_state == "faulted":
                self.session_outcomes_24h.add(ts, 0.0)  # Failed session
            else:
                self.session_outcomes_24h.add(ts, 1.0)  # Successful session
        self.last_state = new_state

        # Track errors
        errors = telemetry.get("error_codes", [])
        if errors:
            self.error_count_6h.add(ts, len(errors))

    def compute_health_score(self) -> dict:
        """
        Compute composite health score (0-100).
        Returns score breakdown for transparency.
        """
        components = {}

        # 1. Temperature anomaly score (0-25 points of penalty)
        temp_slope = self.temperature_10m.slope()
        temp_max = self.temperature_10m.max()
        temp_anomaly = 0.0
        if temp_slope > 0.5:  # Rising fast
            temp_anomaly += min(15, temp_slope * 5)
        if temp_max > 75:  # Absolute threshold
            temp_anomaly += min(10, (temp_max - 75) * 2)
        components["temperature_penalty"] = min(25, temp_anomaly)

        # 2. Voltage instability score (0-25 points of penalty)
        voltage_std = self.voltage_15m.std()
        voltage_penalty = 0.0
        if voltage_std > 5:
            voltage_penalty = min(25, (voltage_std - 5) * 2.5)
        components["voltage_penalty"] = voltage_penalty

        # 3. Session failure rate (0-20 points of penalty)
        session_vals = self.session_outcomes_24h.values()
        if len(session_vals) >= 3:
            failure_rate = 1.0 - np.mean(session_vals)
            session_penalty = failure_rate * 20
        else:
            session_penalty = 0.0
        components["session_failure_penalty"] = session_penalty

        # 4. Connection drop score (0-15 points of penalty)
        drop_count = self.connection_drops_1h.count()
        connection_penalty = min(15, drop_count * 5)
        components["connection_penalty"] = connection_penalty

        # 5. Error frequency (0-15 points of penalty)
        error_sum = sum(self.error_count_6h.values())
        error_penalty = min(15, error_sum * 2)
        components["error_penalty"] = error_penalty

        # Compute final score
        total_penalty = sum(components.values())
        self.health_score = max(0, min(100, 100 - total_penalty))

        # Determine risk level
        if self.health_score >= 80:
            self.risk_level = "LOW"
        elif self.health_score >= 60:
            self.risk_level = "MEDIUM"
        elif self.health_score >= 30:
            self.risk_level = "HIGH"
        else:
            self.risk_level = "CRITICAL"

        return {
            "health_score": round(self.health_score, 1),
            "risk_level": self.risk_level,
            "components": {k: round(v, 2) for k, v in components.items()},
            "metrics": {
                "temp_slope_10m": round(self.temperature_10m.slope(), 3),
                "temp_max_10m": round(self.temperature_10m.max(), 1),
                "voltage_std_15m": round(self.voltage_15m.std(), 2),
                "drops_1h": self.connection_drops_1h.count(),
                "error_count_6h": sum(self.error_count_6h.values()),
            }
        }


class HealthScorer:
    """
    Kafka consumer that computes rolling health scores per charger.
    Publishes scores to a downstream Kafka topic.
    """

    def __init__(
        self,
        kafka_bootstrap: str = "localhost:9092",
        input_topic: str = "telemetry.raw",
        output_topic: str = "charger.health",
        alerts_topic: str = "charger.alerts",
        group_id: str = "aurion-health-scorer",
    ):
        self.input_topic = input_topic
        self.output_topic = output_topic
        self.alerts_topic = alerts_topic

        # Kafka consumer
        self.consumer = KafkaConsumer(
            input_topic,
            bootstrap_servers=kafka_bootstrap,
            group_id=group_id,
            value_deserializer=lambda m: json.loads(m.decode("utf-8")),
            auto_offset_reset="latest",
            enable_auto_commit=True,
        )

        # Kafka producer for outputs
        self.producer = KafkaProducer(
            bootstrap_servers=kafka_bootstrap,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            key_serializer=lambda k: k.encode("utf-8") if k else None,
        )

        # Per-charger state
        self.charger_states: Dict[str, ChargerHealthState] = defaultdict(ChargerHealthState)
        self.score_interval = 30  # Recompute scores every 30 seconds
        self.last_score_time: Dict[str, float] = {}

    def run(self):
        """Main processing loop."""
        logger.info(f"Health scorer started. Consuming from '{self.input_topic}'")
        message_count = 0

        try:
            for message in self.consumer:
                telemetry = message.value
                charger_id = telemetry.get("charger_id")

                if not charger_id:
                    continue

                # Update state
                state = self.charger_states[charger_id]
                state.update(telemetry)
                message_count += 1

                # Periodic score computation
                ts = telemetry["timestamp"]
                last_scored = self.last_score_time.get(charger_id, 0)

                if ts - last_scored >= self.score_interval:
                    self.last_score_time[charger_id] = ts
                    score_result = state.compute_health_score()

                    # Publish health score
                    health_event = {
                        "charger_id": charger_id,
                        "timestamp": ts,
                        **score_result,
                    }
                    self.producer.send(self.output_topic, key=charger_id, value=health_event)

                    # Check for alerts
                    if score_result["risk_level"] in ("HIGH", "CRITICAL"):
                        alert = {
                            "charger_id": charger_id,
                            "timestamp": ts,
                            "alert_type": "health_degradation",
                            "severity": score_result["risk_level"],
                            "health_score": score_result["health_score"],
                            "details": score_result["components"],
                        }
                        self.producer.send(self.alerts_topic, key=charger_id, value=alert)
                        logger.warning(f"ALERT [{score_result['risk_level']}] {charger_id}: "
                                       f"score={score_result['health_score']}")

                if message_count % 500 == 0:
                    logger.info(f"Processed {message_count} messages, "
                                f"tracking {len(self.charger_states)} chargers")

        except KeyboardInterrupt:
            logger.info("Health scorer stopped by user")
        finally:
            self.consumer.close()
            self.producer.close()


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Aurion Health Score Processor")
    parser.add_argument("--kafka-bootstrap", default="localhost:9092")
    parser.add_argument("--input-topic", default="telemetry.raw")
    parser.add_argument("--output-topic", default="charger.health")
    args = parser.parse_args()

    scorer = HealthScorer(
        kafka_bootstrap=args.kafka_bootstrap,
        input_topic=args.input_topic,
        output_topic=args.output_topic,
    )
    scorer.run()


if __name__ == "__main__":
    main()
