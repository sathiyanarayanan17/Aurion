"""
Aurion - MQTT to Kafka Bridge
Subscribes to MQTT topics and publishes to Kafka for durable streaming.
"""

import json
import logging
import signal
import sys

import paho.mqtt.client as mqtt
from kafka import KafkaProducer

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("aurion.ingestion")


class MQTTKafkaBridge:
    """Bridges MQTT telemetry to Kafka topics."""

    def __init__(
        self,
        mqtt_host: str = "localhost",
        mqtt_port: int = 1883,
        kafka_bootstrap: str = "localhost:9092",
        mqtt_topic: str = "aurion/telemetry/#",
        kafka_topic_raw: str = "telemetry.raw",
        kafka_topic_faults: str = "telemetry.faults",
    ):
        self.mqtt_host = mqtt_host
        self.mqtt_port = mqtt_port
        self.mqtt_topic = mqtt_topic
        self.kafka_topic_raw = kafka_topic_raw
        self.kafka_topic_faults = kafka_topic_faults

        # Kafka producer
        self.producer = KafkaProducer(
            bootstrap_servers=kafka_bootstrap,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            key_serializer=lambda k: k.encode("utf-8") if k else None,
            acks="all",
            retries=3,
            batch_size=16384,
            linger_ms=10,
        )

        # MQTT client
        self.mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="aurion-kafka-bridge", protocol=mqtt.MQTTv311)
        self.mqtt_client.on_connect = self._on_connect
        self.mqtt_client.on_message = self._on_message
        self.mqtt_client.on_disconnect = self._on_disconnect

        self.message_count = 0
        self.running = False

    def _on_connect(self, client, userdata, flags, reason_code, properties):
        if reason_code == 0:
            logger.info(f"Connected to MQTT broker, subscribing to {self.mqtt_topic}")
            client.subscribe(self.mqtt_topic, qos=1)
        else:
            logger.error(f"MQTT connection failed: {reason_code}")

    def _on_disconnect(self, client, userdata, flags, reason_code, properties):
        logger.warning(f"MQTT disconnected (rc={reason_code})")

    def _on_message(self, client, userdata, msg):
        """Route MQTT messages to appropriate Kafka topics."""
        try:
            topic = msg.topic
            payload = json.loads(msg.payload.decode("utf-8"))

            if "/faults" in topic:
                # Fault events go to faults topic
                self.producer.send(
                    self.kafka_topic_faults,
                    key=payload.get("charger_id"),
                    value=payload,
                )
            elif "/all" in topic:
                # Batch telemetry - send individual records
                if isinstance(payload, list):
                    for record in payload:
                        self.producer.send(
                            self.kafka_topic_raw,
                            key=record.get("charger_id"),
                            value=record,
                        )
                        self.message_count += 1
                else:
                    self.producer.send(
                        self.kafka_topic_raw,
                        key=payload.get("charger_id"),
                        value=payload,
                    )
                    self.message_count += 1
            else:
                # Individual charger telemetry
                self.producer.send(
                    self.kafka_topic_raw,
                    key=payload.get("charger_id"),
                    value=payload,
                )
                self.message_count += 1

            if self.message_count % 100 == 0:
                logger.info(f"Bridged {self.message_count} messages to Kafka")

        except Exception as e:
            logger.error(f"Error processing message: {e}")

    def run(self):
        """Start the bridge."""
        self.running = True
        logger.info(f"Starting MQTT→Kafka bridge: {self.mqtt_host}:{self.mqtt_port} → Kafka")

        self.mqtt_client.connect(self.mqtt_host, self.mqtt_port, keepalive=60)
        self.mqtt_client.loop_forever()

    def stop(self):
        """Graceful shutdown."""
        self.running = False
        self.mqtt_client.loop_stop()
        self.mqtt_client.disconnect()
        self.producer.flush()
        self.producer.close()
        logger.info(f"Bridge stopped. Total messages bridged: {self.message_count}")


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Aurion MQTT to Kafka Bridge")
    parser.add_argument("--mqtt-host", default="localhost")
    parser.add_argument("--mqtt-port", type=int, default=1883)
    parser.add_argument("--kafka-bootstrap", default="localhost:9092")
    args = parser.parse_args()

    bridge = MQTTKafkaBridge(
        mqtt_host=args.mqtt_host,
        mqtt_port=args.mqtt_port,
        kafka_bootstrap=args.kafka_bootstrap,
    )

    def signal_handler(sig, frame):
        bridge.stop()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    bridge.run()


if __name__ == "__main__":
    main()
