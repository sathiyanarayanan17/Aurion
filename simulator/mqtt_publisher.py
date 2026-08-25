"""
Aurion - MQTT Publisher
Publishes fleet telemetry to MQTT broker (Mosquitto).
"""

import json
import time
import logging
import signal
import sys

import paho.mqtt.client as mqtt
import yaml

from fleet import Fleet
from fault_injector import FaultInjector

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("aurion.publisher")


class MQTTPublisher:
    """Publishes charger telemetry to MQTT broker."""

    def __init__(self, config_path: str = "config.yaml"):
        with open(config_path, "r") as f:
            self.config = yaml.safe_load(f)

        mqtt_config = self.config["mqtt"]
        self.broker_host = mqtt_config["broker_host"]
        self.broker_port = mqtt_config["broker_port"]
        self.topic_prefix = mqtt_config["topic_prefix"]
        self.publish_interval = self.config["fleet"]["publish_interval_seconds"]

        # MQTT client (v2 API)
        self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="aurion-fleet-simulator", protocol=mqtt.MQTTv311)
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect

        # Fleet
        self.fleet = Fleet(config_path)
        self.fault_injector = FaultInjector(self.fleet.chargers)

        # Control
        self.running = False

    def _on_connect(self, client, userdata, flags, reason_code, properties):
        if reason_code == 0:
            logger.info(f"Connected to MQTT broker at {self.broker_host}:{self.broker_port}")
        else:
            logger.error(f"MQTT connection failed with code: {reason_code}")

    def _on_disconnect(self, client, userdata, flags, reason_code, properties):
        logger.warning(f"Disconnected from MQTT broker (rc={reason_code})")

    def connect(self):
        """Connect to MQTT broker."""
        try:
            self.client.connect(self.broker_host, self.broker_port, keepalive=60)
            self.client.loop_start()
        except Exception as e:
            logger.error(f"Failed to connect to MQTT broker: {e}")
            raise

    def publish_telemetry(self, telemetry_batch: list):
        """Publish a batch of telemetry to MQTT topics."""
        for data in telemetry_batch:
            charger_id = data["charger_id"]
            # Per-charger topic
            topic = f"{self.topic_prefix}/{charger_id}"
            payload = json.dumps(data)
            self.client.publish(topic, payload, qos=1)

        # Also publish to aggregate topic
        aggregate_topic = f"{self.topic_prefix}/all"
        self.client.publish(aggregate_topic, json.dumps(telemetry_batch), qos=0)

    def run(self, duration_seconds: float = None, inject_faults: bool = True):
        """
        Run the simulation loop.
        
        Args:
            duration_seconds: How long to run (None = forever)
            inject_faults: Whether to randomly inject faults
        """
        self.connect()
        self.running = True

        # Schedule some faults if requested
        if inject_faults:
            sim_hours = (duration_seconds or 3600) / 3600
            self.fault_injector.schedule_random_faults(sim_hours, faults_per_hour=1.0)

        start_time = time.time()
        current_time = start_time
        tick_count = 0

        logger.info(f"Starting simulation: {len(self.fleet.chargers)} chargers, "
                    f"interval={self.publish_interval}s, faults={'enabled' if inject_faults else 'disabled'}")

        try:
            while self.running:
                # Check duration
                if duration_seconds and (time.time() - start_time) >= duration_seconds:
                    logger.info("Simulation duration reached. Stopping.")
                    break

                # Inject faults if scheduled
                injected = self.fault_injector.check_and_inject(current_time)
                for fault in injected:
                    fault_topic = f"{self.topic_prefix}/faults"
                    self.client.publish(fault_topic, json.dumps(fault), qos=1)

                # Generate and publish telemetry
                batch = self.fleet.tick_all(current_time)
                self.publish_telemetry(batch)

                tick_count += 1
                if tick_count % 12 == 0:  # Log every minute
                    status = self.fleet.get_fleet_status()
                    logger.info(f"Tick {tick_count} | {status}")

                # Wait for next interval
                current_time += self.publish_interval
                time.sleep(self.publish_interval)

        except KeyboardInterrupt:
            logger.info("Simulation interrupted by user")
        finally:
            self.stop()

    def stop(self):
        """Clean shutdown."""
        self.running = False
        self.client.loop_stop()
        self.client.disconnect()
        logger.info("Simulator stopped")


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Aurion Fleet Simulator")
    parser.add_argument("--config", default="config.yaml", help="Path to config file")
    parser.add_argument("--duration", type=int, default=None, help="Simulation duration in seconds")
    parser.add_argument("--no-faults", action="store_true", help="Disable fault injection")
    args = parser.parse_args()

    publisher = MQTTPublisher(config_path=args.config)

    # Handle graceful shutdown
    def signal_handler(sig, frame):
        logger.info("Shutdown signal received")
        publisher.stop()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    publisher.run(duration_seconds=args.duration, inject_faults=not args.no_faults)


if __name__ == "__main__":
    main()
