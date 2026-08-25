# Aurion

**Real-time predictive maintenance platform for EV charging stations.**

Aurion ingests live telemetry from charging stations, detects failures before they happen, predicts maintenance windows, and displays live network health on an interactive map.

## Architecture

```
┌─────────────────┐     ┌───────────┐     ┌────────────┐     ┌────────────────┐
│  Charger Fleet  │────▶│ Mosquitto │────▶│   Kafka    │────▶│ Health Scorer  │
│  (Simulator)    │MQTT │  (Broker) │     │ (Streaming)│     │ (Processing)   │
└─────────────────┘     └───────────┘     └────────────┘     └────────┬───────┘
                                                │                      │
                                                ▼                      ▼
                                         ┌────────────┐     ┌──────────────────┐
                                         │ Predictor  │     │   FastAPI + WS   │
                                         │ (Ensemble) │────▶│   (REST + Live)  │
                                         └────────────┘     └────────┬─────────┘
                                                                     │
                                                              ┌──────▼──────┐
                                                              │  Dashboard  │
                                                              │ (React Map) │
                                                              └─────────────┘
```

## Models (Ensemble)

| Model | Purpose | Type |
|-------|---------|------|
| XGBoost Classifier | Failure within 7 days | Supervised |
| XGBoost Regressor | Days until failure | Supervised |
| Bidirectional LSTM + Attention | Temporal pattern detection | Deep Learning |
| Temporal Convolutional Network | Alternative temporal model | Deep Learning |
| Isolation Forest | Anomaly detection | Unsupervised |

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Python 3.10+
- Node.js 18+

### 1. Start Infrastructure
```bash
docker-compose up -d
```

### 2. Generate Data & Train Models
```bash
cd prediction
pip install -r requirements.txt
python data_generator.py --chargers 30 --days 180
python train_model.py --data-dir data --model-dir model
```

Or use the one-command script:
```bash
python scripts/seed_and_train.py
```

### 3. Start Services

**Terminal 1 - Simulator:**
```bash
cd simulator
pip install -r requirements.txt
python mqtt_publisher.py --config config.yaml
```

**Terminal 2 - MQTT→Kafka Bridge:**
```bash
cd ingestion
pip install -r requirements.txt
python mqtt_to_kafka.py
```

**Terminal 3 - Health Scorer:**
```bash
cd processing
pip install -r requirements.txt
python health_scorer.py
```

**Terminal 4 - API Server:**
```bash
cd api
pip install -r requirements.txt
python main.py
```

**Terminal 5 - Dashboard:**
```bash
cd dashboard
npm install
npm run dev
```

### 4. Open Dashboard
Visit `http://localhost:3000`

## Live Demo (Fault Injection)

Run the demo script to inject a fault scenario during a presentation:
```bash
scripts\demo_fault_scenario.bat
```

Watch the charger's health score drop in real-time on the dashboard.

## Project Structure

```
aurion/
├── simulator/          # IoT charger fleet simulation (MQTT)
├── ingestion/          # MQTT → Kafka bridge
├── processing/         # Real-time health scoring (Kafka Streams)
├── prediction/         # ML models (XGBoost, LSTM, TCN, Isolation Forest)
├── api/                # FastAPI backend (REST + WebSocket)
├── dashboard/          # React + Leaflet + Recharts frontend
├── scripts/            # Demo & setup scripts
├── config/             # Service configurations
└── docker-compose.yml  # Infrastructure (Mosquitto, Kafka, Postgres, Redis)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| IoT Protocol | MQTT (Mosquitto) |
| Streaming | Apache Kafka |
| Processing | Python (sliding windows) |
| ML/DL | XGBoost, TensorFlow/Keras (LSTM, TCN), scikit-learn |
| API | FastAPI + WebSocket |
| Frontend | React, Leaflet (maps), Recharts (graphs), Tailwind CSS |
| Infrastructure | Docker, PostgreSQL, Redis |

## Business Context

- **Customer:** EV charging network operators (Tata Power, Statiq, ChargeZone)
- **Problem:** Chargers fail silently → lost revenue + stranded drivers
- **Solution:** Predictive health monitoring → proactive maintenance
- **Model:** SaaS subscription per charger monitored
- **Moat:** Data network effects (more chargers → better predictions)

---

Built by [Your Name] | 2026
