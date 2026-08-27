# Architecture Decision Records — Aurion Predictive Maintenance Platform

This document captures the key architectural decisions made during the design and development of the Aurion platform, along with context and rationale.

---

## ADR-001: MQTT over HTTP for Charger Telemetry Ingestion

**Status:** Accepted  
**Date:** 2026-08-15

### Context

Aurion needs to ingest real-time telemetry from EV chargers (IoT devices). The protocol must handle intermittent connectivity, constrained hardware, and high-frequency data streams (1 msg/5s per charger).

### Decision

Use **MQTT with QoS 1** (at-least-once delivery) as the ingestion protocol between chargers and the platform.

### Reasons

- **OCPP standard alignment** — The Open Charge Point Protocol (OCPP 2.0.1) natively supports MQTT and WebSocket transports. Using MQTT keeps us compatible with real charger firmware.
- **Lightweight for constrained devices** — MQTT's minimal packet overhead (~2 bytes header) is ideal for embedded charger controllers with limited bandwidth.
- **Built-in reconnection** — MQTT clients handle connection drops and automatic reconnection, critical for chargers on cellular networks.
- **Last Will and Testament (LWT)** — Enables immediate detection of chargers going offline without explicit polling.
- **Bi-directional communication** — Allows the platform to publish commands back to chargers (e.g., throttle power, trigger diagnostics).

### Alternatives Considered

| Alternative | Why Not |
|---|---|
| HTTP polling | Too much overhead per message; 5-second polling at scale wastes bandwidth and CPU |
| gRPC streaming | Not an IoT standard; requires HTTP/2 which many charger firmwares don't support |
| Raw WebSocket | No built-in QoS guarantees, no LWT, requires custom reconnection logic |

---

## ADR-002: Apache Kafka Between MQTT and Processing

**Status:** Accepted  
**Date:** 2026-08-15

### Context

Once telemetry arrives via MQTT, it needs to reach multiple downstream consumers (health scoring, ML inference, dashboards, storage). We need a durable, ordered, and decoupled message backbone.

### Decision

Use **Apache Kafka** as the message backbone between the MQTT broker and all downstream processing services.

### Reasons

- **Durable storage with replay** — Kafka retains messages for configurable periods. This enables replaying historical telemetry for model retraining without a separate data pipeline.
- **Ordered per partition** — Using charger_id as partition key guarantees per-charger ordering, essential for time-series processing.
- **Decouples producers from consumers** — MQTT bridge writes to Kafka once; multiple consumer groups read independently at their own pace.
- **Handles backpressure** — If a consumer falls behind (e.g., during model retraining), Kafka buffers without impacting upstream ingestion.
- **Multiple consumer groups** — Health scoring, ML inference, archival storage, and dashboards each consume independently without interfering.

### Alternatives Considered

| Alternative | Why Not |
|---|---|
| Direct MQTT subscription | No durability — if a consumer is down, messages are lost; no replay for retraining |
| Redis Streams | Less mature ecosystem, limited retention, not designed for high-throughput replay |
| RabbitMQ | Designed for task queues, not event streaming; no efficient replay mechanism |

---

## ADR-003: Ensemble over Single Model for Failure Prediction

**Status:** Accepted  
**Date:** 2026-08-16

### Context

We need to predict charger failures 1–7 days in advance with limited (synthetic) training data. A single model may miss different failure patterns or produce excessive false positives.

### Decision

Use a **5-model ensemble** combining:
1. **XGBoost Classifier** — Binary classification (fails within 7 days)
2. **XGBoost Regressor** — Days until failure estimation
3. **BiLSTM** — Temporal sequence patterns
4. **TCN (Temporal Convolutional Network)** — Long-range temporal dependencies
5. **Isolation Forest** — Unsupervised anomaly detection

### Reasons

- **Different models capture different patterns:**
  - XGBoost excels at tabular/engineered features (temperature stats, voltage variance)
  - BiLSTM captures sequential temporal patterns (gradual degradation curves)
  - TCN captures long-range dependencies without vanishing gradients
  - Isolation Forest detects novel anomalies without labeled data
- **Ensemble reduces false positives** — Requiring agreement among models increases precision without sacrificing recall.
- **Graceful degradation** — If one model fails or produces garbage, the ensemble still functions with remaining models.
- **Weighted combination allows tuning** — Operators can adjust model weights based on their risk tolerance (e.g., weight anomaly detection higher for safety-critical sites).

### Alternatives Considered

| Alternative | Why Not |
|---|---|
| Single XGBoost | Misses temporal patterns; can't capture degradation curves |
| Pure LSTM | Needs more labeled data than we have; prone to overfitting on small datasets |
| Rule-based only | No learning capability; cannot adapt to new failure modes; high maintenance |

---

## ADR-004: Sliding Windows for Real-Time Health Scoring

**Status:** Accepted  
**Date:** 2026-08-16

### Context

The platform must compute a real-time health score for each charger without storing the entire telemetry history in memory. The scoring must be responsive (detect anomalies quickly) while also capturing longer-term trends.

### Decision

Use **time-based sliding windows** at four scales: **10 minutes, 1 hour, 6 hours, and 24 hours**.

### Reasons

- **Bounded memory usage** — Each window stores only data within its time range, preventing unbounded memory growth regardless of charger uptime.
- **Multi-scale pattern detection:**
  - 10-minute window: Catches sudden spikes and acute anomalies
  - 1-hour window: Detects sustained abnormal behavior
  - 6-hour window: Captures session-level patterns
  - 24-hour window: Identifies daily trends and slow degradation
- **Composable** — Different metrics can use different window sizes (temperature spike = 10min, voltage drift = 6h).
- **No database dependency for real-time path** — Health scoring operates entirely in-memory, achieving sub-millisecond latency.

### Alternatives Considered

| Alternative | Why Not |
|---|---|
| Database queries | Too slow for real-time scoring (10ms+ per query vs sub-ms in-memory) |
| Fixed-size windows (N samples) | Miss time correlation; a window of 100 samples means different durations at different telemetry rates |
| Exponential moving averages | Less interpretable; harder to explain to operators why a score changed |

---

## ADR-005: Simulated Data is Acceptable for Development

**Status:** Accepted  
**Date:** 2026-08-14

### Context

We have no access to real OCPP charger telemetry data during development. We need data to build, validate, and test the entire pipeline end-to-end.

### Decision

Build a **realistic charger simulator with fault injection** and use its output for development, model training, and pipeline validation.

### Reasons

- **Industry standard practice** — Simulated data is the norm for IoT and predictive maintenance projects during development. Major vendors (Siemens, GE, PTC) use simulation extensively.
- **Controlled fault scenarios** — We can inject specific failure modes (thermal runaway, connector degradation, power module aging, communication faults) with exact labels for supervised training.
- **Enables model training with labeled data** — Real-world failures are rare and unlabeled. Simulation provides the labeled fault events needed for supervised learning.
- **Validates full pipeline end-to-end** — Every component from ingestion to alerting can be tested with realistic data flowing through.
- **Same data schema as real chargers** — When real OCPP data becomes available, it follows the same schema and requires no pipeline changes.

### How the Simulator is Realistic

| Aspect | Implementation |
|---|---|
| Voltage/Current ranges | Based on actual CCS2 Combined Charging System specification (200–1000V DC, 0–500A) |
| Thermal dynamics | Models heat accumulation, dissipation, ambient effects with realistic time constants |
| Session patterns | Day/night usage cycles, random session durations matching real-world distributions |
| Fault patterns | Based on published EV charger failure mode research and FMEA analysis |
| Connector wear | Modeled as gradual degradation with probabilistic failure onset |

---

## Document History

| Date | ADR | Change |
|---|---|---|
| 2026-08-14 | ADR-005 | Initial decision on simulated data |
| 2026-08-15 | ADR-001, ADR-002 | Protocol and streaming decisions |
| 2026-08-16 | ADR-003, ADR-004 | ML and scoring architecture decisions |
