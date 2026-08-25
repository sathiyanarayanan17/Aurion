"""
Aurion - Historical Data Generator
Generates months of synthetic telemetry with labeled failure events for model training.
Runs simulation in accelerated time (minutes of compute = months of simulated data).
"""

import json
import time
import random
import logging
import os
from pathlib import Path
from typing import List, Dict, Tuple

import numpy as np
import pandas as pd

# Add parent simulator path
import sys
sys.path.insert(0, str(Path(__file__).parent.parent / "simulator"))

from charger import Charger, ChargerProfile
from fleet import Fleet
from fault_injector import FaultInjector, DegradationPattern

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("aurion.data_generator")


# Charger profiles
PROFILES = [
    ChargerProfile("tata_50kw", 50, (380, 420), (0, 125), (35, 55), ["CCS2"], 0.02),
    ChargerProfile("statiq_30kw", 30, (220, 240), (0, 80), (30, 50), ["Type2"], 0.03),
    ChargerProfile("chargenova_150kw", 150, (750, 850), (0, 200), (40, 65), ["CCS2"], 0.015),
]


def generate_training_data(
    num_chargers: int = 30,
    simulation_days: int = 180,
    faults_per_charger: int = 4,
    output_dir: str = "data",
    tick_interval: int = 30,  # seconds between readings (30s for training, 5s for real-time)
):
    """
    Generate labeled training data for the predictive model.
    
    Creates:
    - Raw telemetry CSV (millions of rows)
    - Fault events CSV (labeled with exact failure times)
    - Feature-engineered training dataset (aggregated features per charger per day)
    
    Args:
        num_chargers: Number of chargers to simulate
        simulation_days: Days of simulated history
        faults_per_charger: Average number of fault events per charger
        output_dir: Where to save generated data
        tick_interval: Seconds between telemetry readings
    """
    os.makedirs(output_dir, exist_ok=True)

    logger.info(f"Generating {simulation_days} days of data for {num_chargers} chargers...")
    logger.info(f"Expected faults: ~{num_chargers * faults_per_charger} total")

    # Create chargers
    chargers: List[Charger] = []
    for i in range(num_chargers):
        profile = random.choice(PROFILES)
        charger_id = f"AUR-SIM-{i+1:03d}"
        lat = 12.0 + random.uniform(0, 17)
        lng = 72.0 + random.uniform(0, 12)
        charger = Charger(charger_id, profile, (lat, lng))
        chargers.append(charger)

    # Schedule faults
    total_faults = num_chargers * faults_per_charger
    fault_events: List[Dict] = []
    total_ticks = (simulation_days * 86400) // tick_interval
    start_time = time.time() - (simulation_days * 86400)

    # Pre-schedule fault injection times
    scheduled_faults: List[Tuple[int, int, str]] = []  # (tick_number, charger_index, fault_type)
    fault_types = ["thermal_runaway", "connector_degradation", "power_instability", "firmware_crash"]

    for _ in range(total_faults):
        tick = random.randint(int(total_ticks * 0.05), int(total_ticks * 0.95))
        charger_idx = random.randint(0, num_chargers - 1)
        fault_type = random.choice(fault_types)
        scheduled_faults.append((tick, charger_idx, fault_type))

    scheduled_faults.sort(key=lambda x: x[0])

    # Run simulation
    telemetry_rows = []
    current_time = start_time
    fault_idx = 0
    active_faults = {}  # charger_idx -> (fault_type, start_tick)

    for tick in range(total_ticks):
        # Inject scheduled faults
        while fault_idx < len(scheduled_faults) and scheduled_faults[fault_idx][0] <= tick:
            _, c_idx, f_type = scheduled_faults[fault_idx]
            if c_idx not in active_faults and not chargers[c_idx].fault_active:
                chargers[c_idx].inject_fault(f_type, current_time)
                active_faults[c_idx] = (f_type, tick)
                fault_events.append({
                    "charger_id": chargers[c_idx].charger_id,
                    "fault_type": f_type,
                    "fault_start_time": current_time,
                    "fault_start_tick": tick,
                })
            fault_idx += 1

        # Clean up resolved faults
        resolved = []
        for c_idx, (f_type, f_start_tick) in active_faults.items():
            if not chargers[c_idx].fault_active:
                resolved.append(c_idx)
                # Update fault event with end time
                for fe in reversed(fault_events):
                    if fe["charger_id"] == chargers[c_idx].charger_id and "fault_end_time" not in fe:
                        fe["fault_end_time"] = current_time
                        fe["fault_end_tick"] = tick
                        break
        for c_idx in resolved:
            del active_faults[c_idx]

        # Generate telemetry for all chargers
        for i, charger in enumerate(chargers):
            telemetry = charger.tick(current_time)
            row = telemetry.to_dict()
            row["tick"] = tick
            row["sim_day"] = tick * tick_interval // 86400
            telemetry_rows.append(row)

        current_time += tick_interval

        # Progress logging
        if tick % 10000 == 0:
            progress = (tick / total_ticks) * 100
            logger.info(f"Progress: {progress:.1f}% ({tick}/{total_ticks} ticks, "
                        f"{len(telemetry_rows)} rows, {len(fault_events)} faults)")

    # Save raw telemetry
    logger.info(f"Saving {len(telemetry_rows)} telemetry rows...")
    df_telemetry = pd.DataFrame(telemetry_rows)
    telemetry_path = os.path.join(output_dir, "telemetry_raw.parquet")
    df_telemetry.to_parquet(telemetry_path, index=False, compression="snappy")
    logger.info(f"Saved telemetry to {telemetry_path} ({os.path.getsize(telemetry_path) / 1e6:.1f} MB)")

    # Save fault events
    df_faults = pd.DataFrame(fault_events)
    faults_path = os.path.join(output_dir, "fault_events.csv")
    df_faults.to_csv(faults_path, index=False)
    logger.info(f"Saved {len(fault_events)} fault events to {faults_path}")

    # Generate aggregated features
    logger.info("Computing aggregated features...")
    features_df = compute_daily_features(df_telemetry, df_faults, tick_interval)
    features_path = os.path.join(output_dir, "training_features.parquet")
    features_df.to_parquet(features_path, index=False, compression="snappy")
    logger.info(f"Saved {len(features_df)} feature rows to {features_path}")

    return telemetry_path, faults_path, features_path


def compute_daily_features(
    df_telemetry: pd.DataFrame,
    df_faults: pd.DataFrame,
    tick_interval: int,
) -> pd.DataFrame:
    """
    Compute daily aggregated features per charger for model training.
    Also computes the label: days_until_next_failure.
    """
    # Create day column
    df_telemetry["day"] = df_telemetry["sim_day"]
    
    # Build fault lookup: for each charger, sorted list of failure days
    fault_days = {}
    if not df_faults.empty and "fault_start_tick" in df_faults.columns:
        for _, row in df_faults.iterrows():
            cid = row["charger_id"]
            fault_day = row["fault_start_tick"] * tick_interval // 86400
            if cid not in fault_days:
                fault_days[cid] = []
            fault_days[cid].append(fault_day)
    
    for cid in fault_days:
        fault_days[cid] = sorted(fault_days[cid])

    # Aggregate features per charger per day
    feature_rows = []
    
    grouped = df_telemetry.groupby(["charger_id", "day"])
    
    for (charger_id, day), group in grouped:
        row = {
            "charger_id": charger_id,
            "day": day,
            
            # Temperature features
            "temp_mean": group["temperature"].mean(),
            "temp_max": group["temperature"].max(),
            "temp_min": group["temperature"].min(),
            "temp_std": group["temperature"].std(),
            "temp_range": group["temperature"].max() - group["temperature"].min(),
            "temp_spikes_above_75": (group["temperature"] > 75).sum(),
            "temp_spikes_above_85": (group["temperature"] > 85).sum(),
            
            # Voltage features
            "voltage_mean": group["voltage"].mean(),
            "voltage_std": group["voltage"].std(),
            "voltage_min": group["voltage"].min(),
            "voltage_max": group["voltage"].max(),
            "voltage_range": group["voltage"].max() - group["voltage"].min(),
            "voltage_cv": group["voltage"].std() / (group["voltage"].mean() + 1e-6),
            
            # Current features
            "current_mean": group["current"].mean(),
            "current_max": group["current"].max(),
            "current_std": group["current"].std(),
            
            # Power features
            "power_mean": group["power_kw"].mean(),
            "power_max": group["power_kw"].max(),
            "energy_total_kwh": group["energy_delivered_kwh"].max(),
            
            # Session features
            "num_readings": len(group),
            "charging_ratio": (group["state"] == "charging").mean(),
            "faulted_ratio": (group["state"] == "faulted").mean(),
            "idle_ratio": (group["state"] == "idle").mean(),
            "offline_ratio": (group["state"] == "offline").mean(),
            
            # Error features
            "has_errors": (group["error_codes"].apply(len) > 0).sum(),
            "error_reading_ratio": (group["error_codes"].apply(len) > 0).mean(),
        }
        
        # Compute label: days until next failure
        cid_faults = fault_days.get(charger_id, [])
        future_faults = [fd for fd in cid_faults if fd > day]
        if future_faults:
            row["days_until_failure"] = future_faults[0] - day
            row["fails_within_7_days"] = 1 if (future_faults[0] - day) <= 7 else 0
            row["fails_within_14_days"] = 1 if (future_faults[0] - day) <= 14 else 0
        else:
            row["days_until_failure"] = 999  # No known future failure
            row["fails_within_7_days"] = 0
            row["fails_within_14_days"] = 0
        
        feature_rows.append(row)

    return pd.DataFrame(feature_rows)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Generate Aurion Training Data")
    parser.add_argument("--chargers", type=int, default=30, help="Number of chargers")
    parser.add_argument("--days", type=int, default=180, help="Days of simulation")
    parser.add_argument("--faults-per-charger", type=int, default=4, help="Avg faults per charger")
    parser.add_argument("--output", default="data", help="Output directory")
    parser.add_argument("--tick-interval", type=int, default=30, help="Seconds between readings")
    args = parser.parse_args()

    generate_training_data(
        num_chargers=args.chargers,
        simulation_days=args.days,
        faults_per_charger=args.faults_per_charger,
        output_dir=args.output,
        tick_interval=args.tick_interval,
    )
    logger.info("Data generation complete!")
