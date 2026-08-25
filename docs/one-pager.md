# Aurion — Product One-Pager

## The Problem

India's EV charging network is scaling rapidly (30,000+ chargers deployed by 2026), but operators have **zero predictive visibility** into charger health. A charger fails silently — bad connector, firmware crash, power fluctuation — and the operator discovers it only when a customer complains. This means:

- **Lost revenue:** An offline 50kW charger loses ₹3,000–5,000/day in missed sessions
- **Stranded drivers:** Failed chargers destroy user trust and slow EV adoption
- **Reactive maintenance:** Operators dispatch technicians after failures, not before

No existing solution in India provides real-time predictive health monitoring for EV chargers.

---

## The Solution: Aurion

A real-time predictive maintenance platform that monitors EV chargers' vital signs and **predicts failures before they happen**.

### How It Works

1. **Ingest** — Real-time telemetry from chargers (voltage, current, temperature, session events) via MQTT/OCPP
2. **Detect** — Streaming health scoring identifies degradation in progress (rising temperature + connection drops = imminent failure)
3. **Predict** — Ensemble ML model (XGBoost + LSTM + TCN + Isolation Forest) estimates days-until-failure per charger
4. **Act** — Operators see live network health on a map, get proactive maintenance alerts, and prevent failures

---

## Technology

| Layer | Tech | Why |
|-------|------|-----|
| IoT Protocol | MQTT (OCPP-J) | Industry standard for EV chargers |
| Streaming | Apache Kafka | Durable, replayable event streams |
| Health Scoring | Python + Sliding Windows | Real-time composite health metrics |
| Prediction | XGBoost + BiLSTM + TCN + Isolation Forest | Ensemble covers supervised + temporal + anomaly |
| API | FastAPI + WebSocket | REST + real-time push |
| Dashboard | React + Leaflet + Recharts | Interactive map + telemetry graphs |

---

## Business Model

**SaaS — per charger per month.**

| Tier | Price/Charger/Month | Target |
|------|--------------------:|--------|
| Monitor | ₹200 | Small operators (<50 chargers) |
| Predict | ₹500 | Mid-size networks (50–500) |
| Enterprise | Custom | Large operators (Tata Power, BPCL) |

**Unit economics:** At ₹500/charger/month monitoring 1,000 chargers = ₹5L MRR = ₹60L ARR from a single mid-size operator.

---

## Market

- India targets 46,000 EV charging stations by 2030 (FAME-II policy)
- Operators: Tata Power, Statiq, ChargeZone, BPCL, HPCL, Ather Grid, Jio-BP
- Adjacent markets: Fleet operators (BluSmart, Lithium Urban), mall/office park hosts
- Global reference: Samsara (fleet monitoring) is valued at $18B using similar per-asset SaaS model

---

## Competitive Moat

1. **Data network effect** — More chargers monitored → better prediction model → more operators sign up
2. **Time-series history** — First mover accumulates failure pattern data that competitors can't replicate
3. **India-specific** — Tuned for Indian grid conditions (voltage fluctuations, monsoon effects, dust)

---

## Current Status

✅ Full working prototype built:
- 20-charger fleet simulation with realistic telemetry
- Real-time streaming health scoring pipeline
- Trained 5-model ensemble (XGBoost classifier/regressor, BiLSTM with attention, TCN, Isolation Forest)
- Interactive dashboard with map view, charger drill-down, and live alerts
- Fault injection for live demo scenarios

---

## Team & Ask

**Built by:** [Your Name] — Full-stack engineer with interest in IoT, ML, and energy systems.

**Looking for:**
- First pilot partner: A charging operator willing to share OCPP telemetry for 3 months
- Feedback on problem validation from fleet/energy industry operators

---

*"I noticed EV charging operators have almost no predictive visibility into charger health, so I built Aurion — a real-time telemetry pipeline with streaming health scoring and a predictive maintenance model, framed as a monitoring SaaS for charging network operators."*
