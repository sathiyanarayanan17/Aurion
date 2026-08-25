"""
Aurion - Predictive Maintenance Model Training
Trains a multi-model ensemble for charger failure prediction.

Models:
1. XGBoost classifier - fails_within_7_days (primary)
2. XGBoost regressor - days_until_failure (secondary)
3. LSTM sequence model - temporal pattern recognition (heavy model)
4. Isolation Forest - anomaly detection (unsupervised)

The ensemble combines all four for robust predictions.
"""

import os
import json
import logging
import pickle
from pathlib import Path
from typing import Dict, Tuple, Optional

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler, RobustScaler
from sklearn.metrics import (
    classification_report, confusion_matrix, roc_auc_score,
    precision_recall_curve, average_precision_score,
    mean_absolute_error, mean_squared_error, r2_score
)
from sklearn.ensemble import IsolationForest
import xgboost as xgb

# Deep learning imports
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, callbacks

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("aurion.train_model")


# Features used for training (must match feature_engineering output)
FEATURE_COLUMNS = [
    "temp_mean", "temp_max", "temp_min", "temp_std", "temp_range",
    "temp_spikes_above_75", "temp_spikes_above_85",
    "voltage_mean", "voltage_std", "voltage_min", "voltage_max",
    "voltage_range", "voltage_cv",
    "current_mean", "current_max", "current_std",
    "power_mean", "power_max", "energy_total_kwh",
    "num_readings", "charging_ratio", "faulted_ratio",
    "idle_ratio", "offline_ratio",
    "has_errors", "error_reading_ratio",
]

# Additional temporal features computed during training
TEMPORAL_FEATURES = [
    "temp_mean_3d_avg", "temp_mean_7d_avg", "temp_std_3d_avg",
    "voltage_std_3d_avg", "voltage_std_7d_avg",
    "error_ratio_3d_avg", "error_ratio_7d_avg",
    "temp_trend_7d", "voltage_trend_7d",
    "charging_ratio_7d_avg",
]


def add_temporal_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add rolling/lag features that capture trends over time."""
    df = df.sort_values(["charger_id", "day"]).copy()
    
    for charger_id in df["charger_id"].unique():
        mask = df["charger_id"] == charger_id
        charger_data = df.loc[mask].copy()
        
        # 3-day and 7-day rolling averages
        df.loc[mask, "temp_mean_3d_avg"] = charger_data["temp_mean"].rolling(3, min_periods=1).mean().values
        df.loc[mask, "temp_mean_7d_avg"] = charger_data["temp_mean"].rolling(7, min_periods=1).mean().values
        df.loc[mask, "temp_std_3d_avg"] = charger_data["temp_std"].rolling(3, min_periods=1).mean().values
        df.loc[mask, "voltage_std_3d_avg"] = charger_data["voltage_std"].rolling(3, min_periods=1).mean().values
        df.loc[mask, "voltage_std_7d_avg"] = charger_data["voltage_std"].rolling(7, min_periods=1).mean().values
        df.loc[mask, "error_ratio_3d_avg"] = charger_data["error_reading_ratio"].rolling(3, min_periods=1).mean().values
        df.loc[mask, "error_ratio_7d_avg"] = charger_data["error_reading_ratio"].rolling(7, min_periods=1).mean().values
        df.loc[mask, "charging_ratio_7d_avg"] = charger_data["charging_ratio"].rolling(7, min_periods=1).mean().values
        
        # Trends (slope over last 7 days)
        df.loc[mask, "temp_trend_7d"] = charger_data["temp_mean"].rolling(7, min_periods=3).apply(
            lambda x: np.polyfit(range(len(x)), x, 1)[0] if len(x) >= 3 else 0, raw=False
        ).values
        df.loc[mask, "voltage_trend_7d"] = charger_data["voltage_std"].rolling(7, min_periods=3).apply(
            lambda x: np.polyfit(range(len(x)), x, 1)[0] if len(x) >= 3 else 0, raw=False
        ).values
    
    # Fill NaN from rolling operations
    df[TEMPORAL_FEATURES] = df[TEMPORAL_FEATURES].fillna(0)
    
    return df


def prepare_sequences(df: pd.DataFrame, sequence_length: int = 14) -> Tuple[np.ndarray, np.ndarray]:
    """
    Prepare sequential data for LSTM model.
    Creates sequences of `sequence_length` days for each charger.
    """
    all_features = FEATURE_COLUMNS + TEMPORAL_FEATURES
    sequences = []
    labels = []
    
    for charger_id in df["charger_id"].unique():
        charger_data = df[df["charger_id"] == charger_id].sort_values("day")
        
        if len(charger_data) < sequence_length:
            continue
            
        feature_values = charger_data[all_features].values
        label_values = charger_data["fails_within_7_days"].values
        
        for i in range(sequence_length, len(charger_data)):
            seq = feature_values[i - sequence_length:i]
            label = label_values[i]
            sequences.append(seq)
            labels.append(label)
    
    return np.array(sequences), np.array(labels)


def build_lstm_model(input_shape: Tuple[int, int]) -> keras.Model:
    """
    Build a Bidirectional LSTM with attention for temporal pattern recognition.
    This is the 'heavy' model that captures long-range dependencies.
    """
    inputs = keras.Input(shape=input_shape)
    
    # Bidirectional LSTM layers
    x = layers.Bidirectional(layers.LSTM(128, return_sequences=True, dropout=0.2, recurrent_dropout=0.1))(inputs)
    x = layers.BatchNormalization()(x)
    
    x = layers.Bidirectional(layers.LSTM(64, return_sequences=True, dropout=0.2, recurrent_dropout=0.1))(x)
    x = layers.BatchNormalization()(x)
    
    # Self-attention mechanism
    attention = layers.Dense(1, activation='tanh')(x)
    attention = layers.Flatten()(attention)
    attention = layers.Activation('softmax')(attention)
    attention = layers.RepeatVector(128)(attention)  # 64*2 for bidirectional
    attention = layers.Permute([2, 1])(attention)
    
    # Apply attention
    x = layers.Multiply()([x, attention])
    x = layers.Lambda(lambda z: tf.reduce_sum(z, axis=1))(x)
    
    # Dense layers
    x = layers.Dense(64, activation='relu')(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(32, activation='relu')(x)
    x = layers.Dropout(0.2)(x)
    
    # Output
    outputs = layers.Dense(1, activation='sigmoid')(x)
    
    model = keras.Model(inputs=inputs, outputs=outputs)
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='binary_crossentropy',
        metrics=['accuracy', keras.metrics.AUC(name='auc'), keras.metrics.Precision(), keras.metrics.Recall()]
    )
    
    return model


def build_tcn_model(input_shape: Tuple[int, int]) -> keras.Model:
    """
    Temporal Convolutional Network - alternative heavy model.
    Faster training than LSTM, often better for longer sequences.
    """
    inputs = keras.Input(shape=input_shape)
    
    # Causal convolution blocks with dilated convolutions
    x = inputs
    filters = 64
    
    for dilation_rate in [1, 2, 4, 8]:
        residual = x
        
        # Dilated causal convolution
        x = layers.Conv1D(filters, kernel_size=3, dilation_rate=dilation_rate, 
                         padding='causal', activation='relu')(x)
        x = layers.BatchNormalization()(x)
        x = layers.Dropout(0.2)(x)
        
        x = layers.Conv1D(filters, kernel_size=3, dilation_rate=dilation_rate,
                         padding='causal', activation='relu')(x)
        x = layers.BatchNormalization()(x)
        x = layers.Dropout(0.2)(x)
        
        # Residual connection
        if residual.shape[-1] != filters:
            residual = layers.Conv1D(filters, 1, padding='same')(residual)
        x = layers.Add()([x, residual])
    
    # Global pooling and output
    x = layers.GlobalAveragePooling1D()(x)
    x = layers.Dense(64, activation='relu')(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(32, activation='relu')(x)
    outputs = layers.Dense(1, activation='sigmoid')(x)
    
    model = keras.Model(inputs=inputs, outputs=outputs)
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='binary_crossentropy',
        metrics=['accuracy', keras.metrics.AUC(name='auc')]
    )
    
    return model


def train_xgboost_classifier(X_train, y_train, X_val, y_val) -> xgb.XGBClassifier:
    """Train XGBoost binary classifier for fails_within_7_days."""
    
    # Handle class imbalance
    pos_count = y_train.sum()
    neg_count = len(y_train) - pos_count
    scale_pos_weight = neg_count / max(pos_count, 1)
    
    model = xgb.XGBClassifier(
        n_estimators=500,
        max_depth=8,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=5,
        gamma=0.1,
        reg_alpha=0.1,
        reg_lambda=1.0,
        scale_pos_weight=scale_pos_weight,
        eval_metric="auc",
        early_stopping_rounds=30,
        random_state=42,
        use_label_encoder=False,
        tree_method="hist",  # Fast histogram-based method
    )
    
    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=50,
    )
    
    return model


def train_xgboost_regressor(X_train, y_train, X_val, y_val) -> xgb.XGBRegressor:
    """Train XGBoost regressor for days_until_failure."""
    
    # Cap at 30 days for regression (beyond that is "healthy")
    y_train_capped = np.minimum(y_train, 30)
    y_val_capped = np.minimum(y_val, 30)
    
    model = xgb.XGBRegressor(
        n_estimators=400,
        max_depth=7,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=5,
        reg_alpha=0.1,
        reg_lambda=1.0,
        eval_metric="mae",
        early_stopping_rounds=30,
        random_state=42,
        tree_method="hist",
    )
    
    model.fit(
        X_train, y_train_capped,
        eval_set=[(X_val, y_val_capped)],
        verbose=50,
    )
    
    return model


def train_isolation_forest(X_train) -> IsolationForest:
    """Train Isolation Forest for anomaly detection (unsupervised)."""
    model = IsolationForest(
        n_estimators=200,
        max_samples='auto',
        contamination=0.05,  # Expect ~5% anomalies
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train)
    return model


def train_all_models(data_dir: str = "data", model_dir: str = "model", sequence_length: int = 14):
    """
    Full training pipeline - trains all models in the ensemble.
    """
    os.makedirs(model_dir, exist_ok=True)
    
    # Load data
    features_path = os.path.join(data_dir, "training_features.parquet")
    if not os.path.exists(features_path):
        logger.error(f"Training data not found at {features_path}. Run data_generator.py first.")
        return
    
    logger.info("Loading training data...")
    df = pd.read_parquet(features_path)
    logger.info(f"Loaded {len(df)} rows, {df['charger_id'].nunique()} chargers, "
                f"{df['day'].max()} days")
    
    # Add temporal features
    logger.info("Computing temporal features...")
    df = add_temporal_features(df)
    
    # Prepare features
    all_feature_cols = FEATURE_COLUMNS + TEMPORAL_FEATURES
    X = df[all_feature_cols].values
    y_class = df["fails_within_7_days"].values
    y_reg = df["days_until_failure"].values
    
    # Handle missing values
    X = np.nan_to_num(X, nan=0.0, posinf=0.0, neginf=0.0)
    
    # Scale features
    scaler = RobustScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Train/test split (time-aware: use later days as test)
    split_day = int(df["day"].max() * 0.8)
    train_mask = df["day"] <= split_day
    test_mask = df["day"] > split_day
    
    X_train, X_test = X_scaled[train_mask], X_scaled[test_mask]
    y_train_class, y_test_class = y_class[train_mask], y_class[test_mask]
    y_train_reg, y_test_reg = y_reg[train_mask], y_reg[test_mask]
    
    # Further split train into train/val for early stopping
    X_train_fit, X_val, y_train_fit_class, y_val_class = train_test_split(
        X_train, y_train_class, test_size=0.15, stratify=y_train_class, random_state=42
    )
    _, _, y_train_fit_reg, y_val_reg = train_test_split(
        X_train, y_train_reg, test_size=0.15, stratify=y_train_class, random_state=42
    )
    
    logger.info(f"Train: {len(X_train_fit)}, Val: {len(X_val)}, Test: {len(X_test)}")
    logger.info(f"Class balance - Train: {y_train_fit_class.mean():.3f} positive, "
                f"Test: {y_test_class.mean():.3f} positive")
    
    # ============ MODEL 1: XGBoost Classifier ============
    logger.info("\n" + "="*60)
    logger.info("Training XGBoost Classifier (fails_within_7_days)...")
    logger.info("="*60)
    
    xgb_clf = train_xgboost_classifier(X_train_fit, y_train_fit_class, X_val, y_val_class)
    
    # Evaluate
    y_pred_proba = xgb_clf.predict_proba(X_test)[:, 1]
    y_pred = (y_pred_proba >= 0.5).astype(int)
    
    logger.info("\nXGBoost Classifier Results:")
    logger.info(f"ROC-AUC: {roc_auc_score(y_test_class, y_pred_proba):.4f}")
    logger.info(f"Average Precision: {average_precision_score(y_test_class, y_pred_proba):.4f}")
    logger.info(f"\n{classification_report(y_test_class, y_pred, target_names=['Healthy', 'Failing'])}")
    
    # Feature importance
    importance = dict(zip(all_feature_cols, xgb_clf.feature_importances_))
    top_features = sorted(importance.items(), key=lambda x: x[1], reverse=True)[:10]
    logger.info("Top 10 features:")
    for feat, imp in top_features:
        logger.info(f"  {feat}: {imp:.4f}")
    
    # ============ MODEL 2: XGBoost Regressor ============
    logger.info("\n" + "="*60)
    logger.info("Training XGBoost Regressor (days_until_failure)...")
    logger.info("="*60)
    
    xgb_reg = train_xgboost_regressor(X_train_fit, y_train_fit_reg, X_val, y_val_reg)
    
    # Evaluate
    y_pred_reg = xgb_reg.predict(X_test)
    y_test_reg_capped = np.minimum(y_test_reg, 30)
    
    logger.info("\nXGBoost Regressor Results:")
    logger.info(f"MAE: {mean_absolute_error(y_test_reg_capped, y_pred_reg):.2f} days")
    logger.info(f"RMSE: {np.sqrt(mean_squared_error(y_test_reg_capped, y_pred_reg)):.2f} days")
    logger.info(f"R²: {r2_score(y_test_reg_capped, y_pred_reg):.4f}")
    
    # ============ MODEL 3: Isolation Forest ============
    logger.info("\n" + "="*60)
    logger.info("Training Isolation Forest (anomaly detection)...")
    logger.info("="*60)
    
    iso_forest = train_isolation_forest(X_train)
    
    # Evaluate (anomaly scores should correlate with actual failures)
    anomaly_scores = iso_forest.decision_function(X_test)
    # Lower score = more anomalous
    anomaly_auc = roc_auc_score(y_test_class, -anomaly_scores)
    logger.info(f"Isolation Forest AUC (anomaly vs failure): {anomaly_auc:.4f}")
    
    # ============ MODEL 4: LSTM (Heavy Model) ============
    logger.info("\n" + "="*60)
    logger.info("Training Bidirectional LSTM with Attention...")
    logger.info("="*60)
    
    # Prepare sequences
    logger.info(f"Preparing sequences (length={sequence_length})...")
    X_seq, y_seq = prepare_sequences(df[train_mask.values].reset_index(drop=True), sequence_length)
    X_seq_test, y_seq_test = prepare_sequences(df[test_mask.values].reset_index(drop=True), sequence_length)
    
    if len(X_seq) > 0 and len(X_seq_test) > 0:
        # Scale sequences
        n_samples, seq_len, n_features = X_seq.shape
        X_seq_flat = X_seq.reshape(-1, n_features)
        seq_scaler = StandardScaler()
        X_seq_flat = seq_scaler.fit_transform(X_seq_flat)
        X_seq = X_seq_flat.reshape(n_samples, seq_len, n_features)
        
        X_seq_test_flat = X_seq_test.reshape(-1, n_features)
        X_seq_test_flat = seq_scaler.transform(X_seq_test_flat)
        X_seq_test = X_seq_test_flat.reshape(X_seq_test.shape[0], seq_len, n_features)
        
        # Split train/val
        X_seq_train, X_seq_val, y_seq_train, y_seq_val = train_test_split(
            X_seq, y_seq, test_size=0.15, stratify=y_seq, random_state=42
        )
        
        logger.info(f"Sequence shapes - Train: {X_seq_train.shape}, Val: {X_seq_val.shape}, Test: {X_seq_test.shape}")
        
        # Handle class imbalance with class weights
        pos_weight = (len(y_seq_train) - y_seq_train.sum()) / max(y_seq_train.sum(), 1)
        class_weights = {0: 1.0, 1: pos_weight}
        
        # Build and train LSTM
        lstm_model = build_lstm_model(input_shape=(sequence_length, n_features))
        lstm_model.summary(print_fn=logger.info)
        
        lstm_callbacks = [
            callbacks.EarlyStopping(monitor='val_auc', patience=15, mode='max', restore_best_weights=True),
            callbacks.ReduceLROnPlateau(monitor='val_auc', factor=0.5, patience=5, mode='max'),
            callbacks.ModelCheckpoint(
                os.path.join(model_dir, "lstm_best.keras"),
                monitor='val_auc', mode='max', save_best_only=True
            ),
        ]
        
        history = lstm_model.fit(
            X_seq_train, y_seq_train,
            validation_data=(X_seq_val, y_seq_val),
            epochs=100,
            batch_size=64,
            class_weight=class_weights,
            callbacks=lstm_callbacks,
            verbose=1,
        )
        
        # Evaluate LSTM
        y_lstm_pred = lstm_model.predict(X_seq_test).flatten()
        lstm_auc = roc_auc_score(y_seq_test, y_lstm_pred)
        logger.info(f"\nLSTM Results:")
        logger.info(f"ROC-AUC: {lstm_auc:.4f}")
        logger.info(f"Average Precision: {average_precision_score(y_seq_test, y_lstm_pred):.4f}")
        
        # Save LSTM
        lstm_model.save(os.path.join(model_dir, "lstm_failure_predictor.keras"))
        
        # Save sequence scaler
        with open(os.path.join(model_dir, "seq_scaler.pkl"), "wb") as f:
            pickle.dump(seq_scaler, f)
        
        logger.info("LSTM model saved.")
    else:
        logger.warning("Not enough sequential data for LSTM training. Skipping.")
        lstm_model = None
    
    # ============ MODEL 5: TCN (Alternative Heavy Model) ============
    logger.info("\n" + "="*60)
    logger.info("Training Temporal Convolutional Network...")
    logger.info("="*60)
    
    if len(X_seq) > 0:
        tcn_model = build_tcn_model(input_shape=(sequence_length, n_features))
        
        tcn_callbacks = [
            callbacks.EarlyStopping(monitor='val_auc', patience=10, mode='max', restore_best_weights=True),
            callbacks.ReduceLROnPlateau(monitor='val_auc', factor=0.5, patience=5, mode='max'),
        ]
        
        tcn_model.fit(
            X_seq_train, y_seq_train,
            validation_data=(X_seq_val, y_seq_val),
            epochs=80,
            batch_size=64,
            class_weight=class_weights,
            callbacks=tcn_callbacks,
            verbose=1,
        )
        
        y_tcn_pred = tcn_model.predict(X_seq_test).flatten()
        tcn_auc = roc_auc_score(y_seq_test, y_tcn_pred)
        logger.info(f"TCN ROC-AUC: {tcn_auc:.4f}")
        
        tcn_model.save(os.path.join(model_dir, "tcn_failure_predictor.keras"))
        logger.info("TCN model saved.")
    
    # ============ SAVE ALL MODELS ============
    logger.info("\n" + "="*60)
    logger.info("Saving models and artifacts...")
    logger.info("="*60)
    
    # Save XGBoost models
    xgb_clf.save_model(os.path.join(model_dir, "xgb_classifier.json"))
    xgb_reg.save_model(os.path.join(model_dir, "xgb_regressor.json"))
    
    # Save Isolation Forest
    with open(os.path.join(model_dir, "isolation_forest.pkl"), "wb") as f:
        pickle.dump(iso_forest, f)
    
    # Save scaler
    with open(os.path.join(model_dir, "feature_scaler.pkl"), "wb") as f:
        pickle.dump(scaler, f)
    
    # Save feature columns
    with open(os.path.join(model_dir, "feature_config.json"), "w") as f:
        json.dump({
            "feature_columns": all_feature_cols,
            "sequence_length": sequence_length,
            "training_stats": {
                "total_samples": len(df),
                "positive_ratio": float(y_class.mean()),
                "train_size": int(train_mask.sum()),
                "test_size": int(test_mask.sum()),
            },
            "model_performance": {
                "xgb_classifier_auc": float(roc_auc_score(y_test_class, y_pred_proba)),
                "xgb_regressor_mae": float(mean_absolute_error(y_test_reg_capped, y_pred_reg)),
                "isolation_forest_auc": float(anomaly_auc),
                "lstm_auc": float(lstm_auc) if lstm_model else None,
            },
            "top_features": [{"name": n, "importance": float(i)} for n, i in top_features],
        }, f, indent=2)
    
    logger.info(f"\nAll models saved to {model_dir}/")
    logger.info("Training complete!")
    
    return {
        "xgb_classifier": xgb_clf,
        "xgb_regressor": xgb_reg,
        "isolation_forest": iso_forest,
        "lstm_model": lstm_model,
        "scaler": scaler,
    }


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Train Aurion Predictive Models")
    parser.add_argument("--data-dir", default="data", help="Directory with training data")
    parser.add_argument("--model-dir", default="model", help="Directory to save models")
    parser.add_argument("--sequence-length", type=int, default=14, help="LSTM sequence length (days)")
    args = parser.parse_args()

    train_all_models(
        data_dir=args.data_dir,
        model_dir=args.model_dir,
        sequence_length=args.sequence_length,
    )
