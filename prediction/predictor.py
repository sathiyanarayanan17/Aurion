"""
Aurion - Real-time Failure Predictor
Loads trained ensemble and runs inference on live telemetry features.
"""

import json
import logging
import pickle
import os
from typing import Dict, Optional, Tuple

import numpy as np
import pandas as pd
import xgboost as xgb
from collections import defaultdict, deque

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("aurion.predictor")


class EnsemblePredictor:
    """
    Ensemble predictor combining:
    - XGBoost Classifier (probability of failure in 7 days)
    - XGBoost Regressor (estimated days until failure)
    - Isolation Forest (anomaly score)
    - LSTM (temporal pattern score, if available)
    """

    def __init__(self, model_dir: str = "model"):
        self.model_dir = model_dir
        self.models_loaded = False

        # Models
        self.xgb_clf = None
        self.xgb_reg = None
        self.iso_forest = None
        self.lstm_model = None
        self.scaler = None
        self.seq_scaler = None
        self.feature_config = None

        # Per-charger feature history (for temporal features + LSTM sequences)
        self.charger_history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=30))

        self._load_models()

    def _load_models(self):
        """Load all trained models from disk."""
        try:
            # Feature config
            config_path = os.path.join(self.model_dir, "feature_config.json")
            with open(config_path, "r") as f:
                self.feature_config = json.load(f)

            # XGBoost Classifier
            self.xgb_clf = xgb.XGBClassifier()
            self.xgb_clf.load_model(os.path.join(self.model_dir, "xgb_classifier.json"))

            # XGBoost Regressor
            self.xgb_reg = xgb.XGBRegressor()
            self.xgb_reg.load_model(os.path.join(self.model_dir, "xgb_regressor.json"))

            # Isolation Forest
            with open(os.path.join(self.model_dir, "isolation_forest.pkl"), "rb") as f:
                self.iso_forest = pickle.load(f)

            # Feature scaler
            with open(os.path.join(self.model_dir, "feature_scaler.pkl"), "rb") as f:
                self.scaler = pickle.load(f)

            # LSTM (optional)
            lstm_path = os.path.join(self.model_dir, "lstm_failure_predictor.keras")
            if os.path.exists(lstm_path):
                import tensorflow as tf
                self.lstm_model = tf.keras.models.load_model(lstm_path)
                with open(os.path.join(self.model_dir, "seq_scaler.pkl"), "rb") as f:
                    self.seq_scaler = pickle.load(f)
                logger.info("LSTM model loaded.")

            self.models_loaded = True
            logger.info("All models loaded successfully.")

        except FileNotFoundError as e:
            logger.error(f"Model file not found: {e}. Run train_model.py first.")
        except Exception as e:
            logger.error(f"Error loading models: {e}")

    def predict(self, charger_id: str, features: Dict[str, float]) -> Dict:
        """
        Run ensemble prediction for a single charger.
        
        Args:
            charger_id: Charger identifier
            features: Dictionary of current feature values
            
        Returns:
            Prediction result with failure probability, estimated days, anomaly score
        """
        if not self.models_loaded:
            return {"error": "Models not loaded"}

        feature_cols = self.feature_config["feature_columns"]

        # Build feature vector
        feature_vector = np.array([[features.get(col, 0.0) for col in feature_cols]])
        feature_vector = np.nan_to_num(feature_vector, nan=0.0)

        # Scale features
        feature_scaled = self.scaler.transform(feature_vector)

        # Store in history for temporal/LSTM features
        self.charger_history[charger_id].append(feature_scaled[0])

        # XGBoost Classifier - failure probability
        failure_prob = float(self.xgb_clf.predict_proba(feature_scaled)[:, 1][0])

        # XGBoost Regressor - days until failure
        days_to_failure = float(self.xgb_reg.predict(feature_scaled)[0])
        days_to_failure = max(0, min(30, days_to_failure))

        # Isolation Forest - anomaly score
        anomaly_score = float(self.iso_forest.decision_function(feature_scaled)[0])
        # Convert to 0-1 range (lower = more anomalous)
        anomaly_normalized = max(0, min(1, (anomaly_score + 0.5)))  # Rough normalization
        is_anomaly = self.iso_forest.predict(feature_scaled)[0] == -1

        # LSTM prediction (if enough history)
        lstm_prob = None
        seq_length = self.feature_config.get("sequence_length", 14)
        history = self.charger_history[charger_id]

        if self.lstm_model and len(history) >= seq_length:
            sequence = np.array(list(history))[-seq_length:]
            # Scale for LSTM
            if self.seq_scaler:
                seq_flat = sequence.reshape(-1, sequence.shape[-1])
                seq_flat = self.seq_scaler.transform(seq_flat)
                sequence = seq_flat.reshape(1, seq_length, -1)
            else:
                sequence = sequence.reshape(1, seq_length, -1)

            lstm_prob = float(self.lstm_model.predict(sequence, verbose=0)[0][0])

        # Ensemble score (weighted combination)
        weights = {"xgb": 0.4, "lstm": 0.35, "anomaly": 0.15, "reg": 0.10}

        if lstm_prob is not None:
            ensemble_score = (
                weights["xgb"] * failure_prob +
                weights["lstm"] * lstm_prob +
                weights["anomaly"] * (1 - anomaly_normalized) +
                weights["reg"] * max(0, (7 - days_to_failure) / 7)
            )
        else:
            # Without LSTM, redistribute weight
            ensemble_score = (
                0.55 * failure_prob +
                0.25 * (1 - anomaly_normalized) +
                0.20 * max(0, (7 - days_to_failure) / 7)
            )

        # Determine risk category
        if ensemble_score >= 0.8:
            risk_category = "CRITICAL"
            action = "Immediate maintenance required"
        elif ensemble_score >= 0.6:
            risk_category = "HIGH"
            action = "Schedule maintenance within 48 hours"
        elif ensemble_score >= 0.35:
            risk_category = "MEDIUM"
            action = "Monitor closely, plan maintenance this week"
        else:
            risk_category = "LOW"
            action = "Normal operation"

        return {
            "charger_id": charger_id,
            "ensemble_failure_score": round(ensemble_score, 4),
            "risk_category": risk_category,
            "recommended_action": action,
            "model_outputs": {
                "xgb_failure_probability": round(failure_prob, 4),
                "xgb_days_to_failure": round(days_to_failure, 1),
                "anomaly_score": round(anomaly_normalized, 4),
                "is_anomaly": bool(is_anomaly),
                "lstm_failure_probability": round(lstm_prob, 4) if lstm_prob else None,
            },
            "confidence": self._compute_confidence(history, lstm_prob),
        }

    def _compute_confidence(self, history: deque, lstm_available: bool) -> str:
        """Estimate prediction confidence based on available data."""
        if len(history) >= 14 and lstm_available:
            return "HIGH"
        elif len(history) >= 7:
            return "MEDIUM"
        else:
            return "LOW"

    def batch_predict(self, charger_features: Dict[str, Dict[str, float]]) -> Dict[str, Dict]:
        """Run predictions for multiple chargers."""
        results = {}
        for charger_id, features in charger_features.items():
            results[charger_id] = self.predict(charger_id, features)
        return results


if __name__ == "__main__":
    # Test with dummy features
    predictor = EnsemblePredictor(model_dir="model")

    if predictor.models_loaded:
        dummy_features = {
            "temp_mean": 55.0,
            "temp_max": 78.0,
            "temp_min": 42.0,
            "temp_std": 8.5,
            "temp_range": 36.0,
            "temp_spikes_above_75": 5,
            "temp_spikes_above_85": 1,
            "voltage_mean": 400.0,
            "voltage_std": 12.0,
            "voltage_min": 375.0,
            "voltage_max": 425.0,
            "voltage_range": 50.0,
            "voltage_cv": 0.03,
            "current_mean": 85.0,
            "current_max": 120.0,
            "current_std": 15.0,
            "power_mean": 34.0,
            "power_max": 48.0,
            "energy_total_kwh": 150.0,
            "num_readings": 2880,
            "charging_ratio": 0.6,
            "faulted_ratio": 0.02,
            "idle_ratio": 0.35,
            "offline_ratio": 0.03,
            "has_errors": 8,
            "error_reading_ratio": 0.05,
            "temp_mean_3d_avg": 53.0,
            "temp_mean_7d_avg": 50.0,
            "temp_std_3d_avg": 7.0,
            "voltage_std_3d_avg": 10.0,
            "voltage_std_7d_avg": 8.0,
            "error_ratio_3d_avg": 0.04,
            "error_ratio_7d_avg": 0.03,
            "temp_trend_7d": 1.2,
            "voltage_trend_7d": 0.8,
            "charging_ratio_7d_avg": 0.55,
        }

        result = predictor.predict("AUR-MUM-001", dummy_features)
        print(json.dumps(result, indent=2))
