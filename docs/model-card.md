# Model Card: Aurion Failure Prediction Ensemble v1.0

## Model Overview

| Field | Value |
|---|---|
| **Model Name** | Aurion Failure Prediction Ensemble v1.0 |
| **Model Type** | Multi-model ensemble (XGBoost + BiLSTM + TCN + Isolation Forest) |
| **Version** | 1.0 |
| **Date** | August 2026 |
| **Framework** | scikit-learn, XGBoost, TensorFlow/Keras |
| **License** | Proprietary — Internal use only |

---

## Task Description

The ensemble performs three complementary prediction tasks:

1. **Binary Classification** — Will this charger fail within the next 7 days? (XGBoost Classifier)
2. **Regression** — How many days until failure? (XGBoost Regressor)
3. **Anomaly Detection** — Is current behavior anomalous compared to normal operation? (Isolation Forest)

The BiLSTM and TCN models provide temporal pattern recognition that feeds into the ensemble's final prediction.

---

## Training Data

| Property | Value |
|---|---|
| **Source** | Synthetic telemetry from Aurion Charger Simulator |
| **Duration** | 180 days of simulated operation |
| **Chargers** | 30 simulated chargers (mixed 50kW/150kW/350kW profiles) |
| **Total Rows** | ~7.7 million telemetry records |
| **Sampling Rate** | 1 message per 5 seconds per charger |
| **Labeled Fault Events** | 29 fault events across 4 fault types |
| **Class Distribution** | 4.7% positive (failure within 7 days) / 95.3% negative |

### Fault Types in Training Data

| Fault Type | Count | Description |
|---|---|---|
| Thermal runaway | 9 | Progressive temperature rise leading to thermal shutdown |
| Connector degradation | 8 | Increasing contact resistance and intermittent connections |
| Power module aging | 7 | Gradual reduction in power delivery capability |
| Communication fault | 5 | Intermittent communication loss patterns |

---

## Features

**36 engineered features** extracted from raw telemetry using sliding windows:

### Temperature Features (8)
- Mean, max, min, std over 10min/1h/6h/24h windows
- Rate of change (°C/min)
- Time above threshold (cumulative minutes > 65°C)
- Peak-to-mean ratio
- Thermal cycling count

### Voltage Features (7)
- Mean, std over multiple windows
- Coefficient of variation
- Sag count (drops > 5% from nominal)
- Ripple magnitude
- Drift from baseline
- Min voltage during session

### Current & Power Features (6)
- Mean power delivery vs rated capacity
- Power factor stability
- Current imbalance (3-phase)
- Efficiency trend (output/input)
- Load factor
- Derating frequency

### Session Features (5)
- Sessions per day
- Average session duration
- Failed session ratio
- Early termination rate
- Utilization rate

### Error Features (5)
- Error count per window (1h/6h/24h)
- Unique error code count
- Error frequency acceleration
- Warning-to-error escalation rate
- Mean time between errors

### Temporal Features (5)
- 7-day rolling averages of key metrics
- Trend slopes (linear regression over 7 days)
- Day-of-week patterns
- Hour-of-day patterns
- Time since last maintenance event

---

## Model Performance

### XGBoost Classifier (Binary: fails within 7 days)

| Metric | Value |
|---|---|
| AUC-ROC | 0.89 |
| Precision (@ 0.5 threshold) | 0.72 |
| Recall (@ 0.5 threshold) | 0.83 |
| F1 Score | 0.77 |
| Specificity | 0.91 |

### XGBoost Regressor (Days until failure)

| Metric | Value |
|---|---|
| MAE | 0.19 days |
| RMSE | 0.31 days |
| R² | 0.84 |

### BiLSTM (Temporal classification)

| Metric | Value |
|---|---|
| Validation AUC-ROC | 0.89 |
| Validation Loss | 0.24 |

### Isolation Forest (Anomaly detection)

| Metric | Value |
|---|---|
| Contamination Rate | 5% |
| Detected Anomalies (true positive) | 26/29 fault precursors |
| False Positive Rate | ~8% |

### Ensemble (Weighted combination)

| Metric | Value |
|---|---|
| Combined AUC-ROC | 0.92 |
| False Positive Rate | < 5% (with consensus threshold) |
| Average Lead Time | 4.2 days before failure |

---

## Limitations

1. **Trained on synthetic data only** — Model has never seen real-world OCPP charger telemetry. Real-world performance may differ due to noise patterns, environmental factors, and hardware variations not captured in simulation.

2. **Limited fault diversity** — Only 4 fault types are modeled. Real chargers experience additional failure modes (firmware bugs, grid instability, vandalism, water ingress) not represented in training.

3. **No seasonal/weather features** — Training data does not include ambient temperature, humidity, or seasonal usage patterns that significantly affect charger behavior in production.

4. **Class imbalance** — Only 4.7% of training windows are positive (pre-failure). While addressed with SMOTE and class weighting, edge cases may still be underrepresented.

5. **Limited charger diversity** — 30 simulated chargers across 3 power levels. Real fleets may include dozens of makes/models with different degradation characteristics.

6. **Temporal validation only** — Validated with time-based train/test split on synthetic data. No cross-site or cross-manufacturer validation.

---

## Intended Use

### Primary Use Case
Predictive maintenance alerting for EV charging network operators. The model generates alerts when a charger is predicted to fail within 7 days, allowing proactive maintenance scheduling.

### Target Users
- Charging network operations teams
- Fleet maintenance planners
- Network reliability engineers

### Deployment Context
- Runs as part of the Aurion real-time processing pipeline
- Inference triggered every 5 minutes per charger
- Alerts delivered via dashboard and notification system

---

## Out of Scope

- **Not for safety-critical real-time control** — This model must NOT be used for automated shutdown, power limiting, or any safety-critical decision without human oversight.
- **Not a replacement for electrical safety systems** — Hardware protection (thermal cutoffs, overcurrent protection) must remain independent of this model.
- **Not validated for regulatory compliance** — Not certified under any electrical safety standard (IEC 61851, UL 2594).
- **Not for individual user predictions** — Model predicts equipment failure, not user behavior.

---

## Ethical Considerations

| Consideration | Assessment |
|---|---|
| **Personal data** | No personal or user data is used. Model operates on equipment telemetry only. |
| **Human oversight** | Predictions should augment, not replace, human judgment. Maintenance decisions require operator validation. |
| **Bias** | No demographic bias concerns — model predicts equipment state, not human outcomes. |
| **Transparency** | Feature importances and component scores are exposed to operators for interpretability. |
| **Failure mode** | If model fails silently, existing scheduled maintenance programs provide baseline coverage. |

---

## Future Improvements

| Priority | Improvement | Expected Impact |
|---|---|---|
| High | Retrain on real OCPP charger data | Significant accuracy improvement in production |
| High | Add weather/ambient features | Better seasonal prediction accuracy |
| Medium | Increase fault type diversity (8+ types) | Broader failure mode coverage |
| Medium | Online learning for per-charger adaptation | Personalized degradation curves |
| Medium | Federated learning across operators | Larger effective training set without data sharing |
| Low | Explainable AI (SHAP per-prediction) | Better operator trust and debugging |
| Low | Uncertainty quantification | Confidence intervals on predictions |

---

## Model Maintenance

| Activity | Frequency |
|---|---|
| Performance monitoring | Continuous (drift detection) |
| Retraining | When real data available, then quarterly |
| Feature review | Monthly |
| Threshold calibration | After each retraining cycle |
| Full model review | Semi-annually |

---

## Contact

- **Model Owner:** Aurion ML Team
- **Last Updated:** August 2026
- **Repository:** `aurion/prediction/`
