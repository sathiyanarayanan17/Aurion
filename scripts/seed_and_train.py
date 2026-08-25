"""
Aurion - Seed Historical Data & Train Models
One-command script to generate training data and train all models.
Run this before starting the platform for the first time.
"""

import subprocess
import sys
import os

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    prediction_dir = os.path.join(base_dir, "prediction")
    
    print("=" * 60)
    print("  AURION - Data Generation & Model Training Pipeline")
    print("=" * 60)
    print()
    
    # Step 1: Generate synthetic data
    print("[1/2] Generating 180 days of synthetic telemetry data...")
    print("       (30 chargers, ~4 faults per charger)")
    print()
    
    result = subprocess.run(
        [sys.executable, "data_generator.py", 
         "--chargers", "30", 
         "--days", "180", 
         "--faults-per-charger", "4",
         "--output", "data"],
        cwd=prediction_dir,
        capture_output=False,
    )
    
    if result.returncode != 0:
        print("ERROR: Data generation failed!")
        return
    
    print()
    print("[2/2] Training ensemble models (XGBoost + LSTM + TCN + Isolation Forest)...")
    print("       This may take 5-15 minutes depending on your hardware.")
    print()
    
    result = subprocess.run(
        [sys.executable, "train_model.py",
         "--data-dir", "data",
         "--model-dir", "model",
         "--sequence-length", "14"],
        cwd=prediction_dir,
        capture_output=False,
    )
    
    if result.returncode != 0:
        print("ERROR: Model training failed!")
        return
    
    print()
    print("=" * 60)
    print("  ✓ Setup complete! Models saved to prediction/model/")
    print("  ✓ You can now run the full platform with docker-compose up")
    print("=" * 60)


if __name__ == "__main__":
    main()
