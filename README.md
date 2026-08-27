# Aurion

[![CI](https://github.com/sathiyanarayanan17/Aurion/actions/workflows/ci.yml/badge.svg)](https://github.com/sathiyanarayanan17/Aurion/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-5%20passing-brightgreen)](prediction/tests/)
[![Pages](https://img.shields.io/badge/dashboard-21%20pages-blue)](dashboard/)
[![Models](https://img.shields.io/badge/ML%20models-5%20ensemble-purple)](prediction/)

**Real-time predictive maintenance platform for EV charging stations.**

Aurion ingests live telemetry from charging stations, detects failures before they happen using a 5-model ML ensemble, and helps operators maintain 99.9% uptime across their entire fleet.

> *"I noticed EV charging operators have almost no predictive visibility into charger health, so I built Aurion — a real-time telemetry pipeline with streaming health scoring and a predictive maintenance model, framed as a monitoring SaaS for charging network operators."*

## Live Demo

▶ **[Open Dashboard](http://localhost:5173)** | 📖 **[API Docs](http://localhost:8000/docs)**

Press `Ctrl+K` for command palette. Click **"Watch Demo"** button for a guided walkthrough.

## Architecture

```
┌─────────────────┐     ┌───────────┐     ┌────────────┐     ┌────────────────┐
│  Charger Fleet  │────▶│ Mosquitto │────▶│   Kafka    │────▶│ Health Scorer  │
│  (20 Stations)  │MQTT │  (Broker) │     │ (Streaming)│     │ (Sliding Wins) │
└─────────────────┘     └───────────┘     └────────────┘     └────────┬───────┘
                                                │                      │
                                                ▼                      ▼
                                         ┌────────────┐     ┌──────────────────┐
                                         │ ML Ensemble│     │   FastAPI + WS   │
                                         │ (5 Models) │────▶│   (REST + Live)  │
                                         └────────────┘     └────────┬─────────┘
                                                                     │
                                                              ┌──────▼──────┐
                                                              │  Dashboard  │
                                                              │ (21 Pages)  │
                                                              └─────────────┘
```

## ML Ensemble (5 Models)

| Model | Purpose | Architecture |
|-------|---------|-------------|
| XGBoost Classifier | Failure within 7 days | 500 trees, depth 8 |
| XGBoost Regressor | Days until failure | 400 trees, depth 7 |
| Bidirectional LSTM + Attention | Temporal patterns | 345K params, 14-day sequences |
| Temporal Convolutional Network | Long-range dependencies | Dilated causal convolutions |
| Isolation Forest | Anomaly detection | 200 estimators, unsupervised |

📄 **[Model Card](docs/model-card.md)** | 📐 **[Architecture Decisions](docs/architecture-decisions.md)**

## Novel Features

| Feature | What Makes It Unique |
|---------|---------------------|
| 🧠 **Natural Language Query** | Ask "Which chargers in Delhi are hot?" — get filtered results |
| 💥 **Failure Cascade Simulator** | Click a charger → watch failure propagate through network |
| 🔍 **Degradation Fingerprinting** | Identify failure TYPE from signal patterns, not just failure occurrence |
| 🌧️ **Weather-Aware Prediction** | Monsoon/heat wave correlations with Indian city failure rates |
| 🤖 **Self-Healing Actions** | Auto power de-rating, firmware restart, load balancing |
| ⏳ **Charger Aging (RUL)** | Remaining useful life in months, CapEx replacement planning |
| ⚡ **Energy Arbitrage** | Optimize charging schedule vs grid pricing to reduce wear |
| 🎬 **Guided Demo Mode** | One-click auto-narrated walkthrough of the entire platform |

## All 21 Dashboard Pages

| Page | Route | Description |
|------|-------|-------------|
| Overview | `/dashboard` | Bento grid with live metrics |
| Network Map | `/dashboard/map` | India map with risk-colored markers |
| Fleet Management | `/dashboard/fleet` | Sortable charger table |
| Alerts | `/dashboard/alerts` | Real-time severity-coded alerts |
| Analytics | `/dashboard/analytics` | ML model performance, cost savings |
| Revenue Impact | `/dashboard/revenue` | ₹ lost/saved calculator |
| Maintenance | `/dashboard/maintenance` | Calendar + auto work orders |
| Explainability | `/dashboard/explainability` | SHAP feature importance |
| Compare | `/dashboard/compare` | Side-by-side + radar chart |
| Timeline | `/dashboard/timeline` | 7-day anomaly visualization |
| Data Replay | `/dashboard/replay` | Replay incidents at 1x-50x speed |
| Alert Rules | `/dashboard/rules` | Visual IF/THEN rule builder |
| SLA Monitor | `/dashboard/sla` | Uptime tracking vs contract |
| Export | `/dashboard/export` | CSV/JSON/PDF report generation |
| NL Query | `/dashboard/query` | Natural language fleet search |
| Cascade Sim | `/dashboard/cascade` | Failure chain reaction |
| Fingerprints | `/dashboard/fingerprint` | Fault signature matching |
| Weather | `/dashboard/weather` | Climate correlation analysis |
| Self-Healing | `/dashboard/healing` | Autonomous action log |
| Aging/RUL | `/dashboard/aging` | Remaining useful life model |
| Energy | `/dashboard/energy` | Grid pricing optimization |

## Quick Start

```bash
# One-command start (no Docker needed)
start.bat

# Or manually:
python run_standalone.py          # Backend (port 8000)
cd dashboard && npm run dev       # Frontend (port 5173)
```

### Full Pipeline (with Docker)
```bash
docker-compose up -d                    # Mosquitto + Kafka + Postgres + Redis
python scripts/seed_and_train.py        # Generate data + train models
python simulator/mqtt_publisher.py      # Start charger simulation
python ingestion/mqtt_to_kafka.py       # Bridge MQTT → Kafka
python processing/health_scorer.py      # Real-time health scoring
python api/main.py                      # API server
cd dashboard && npm run dev             # Dashboard
```

## Tests

```bash
python -m pytest prediction/tests/ -v   # 5 tests, all passing
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| IoT Protocol | MQTT (OCPP-J compatible) |
| Streaming | Apache Kafka |
| Processing | Python (sliding window algorithms) |
| ML/DL | XGBoost, TensorFlow/Keras (LSTM, TCN), scikit-learn |
| API | FastAPI + WebSocket |
| Frontend | React 19, TypeScript, Tailwind CSS v4, Recharts, Leaflet |
| Infrastructure | Docker, PostgreSQL, Redis |
| CI/CD | GitHub Actions |
| Deployment | Vercel (frontend) |

## Business Context

- **Customer:** EV charging network operators (Tata Power, Statiq, ChargeZone, BPCL)
- **Problem:** Chargers fail silently → ₹4,000+/day lost revenue per offline charger
- **Solution:** Predict failures days in advance → proactive maintenance
- **Model:** SaaS at ₹500/charger/month
- **Moat:** Data network effects — more chargers → better predictions

📄 **[Product One-Pager](docs/one-pager.md)**

## Project Structure

```
aurion/
├── simulator/          # IoT charger fleet simulation (MQTT)
├── ingestion/          # MQTT → Kafka bridge
├── processing/         # Real-time health scoring
├── prediction/         # ML models + training + tests
├── api/                # FastAPI backend (REST + WebSocket)
├── dashboard/          # React 19 + TypeScript (21 pages)
├── docs/               # ADRs, model card, one-pager
├── scripts/            # Demo & setup scripts
├── .github/workflows/  # CI/CD pipeline
├── docker-compose.yml  # Infrastructure
├── vercel.json         # Deployment config
└── run_standalone.py   # One-command demo mode
```

---

Built by **Sathiyanarayanan S** | 2026
