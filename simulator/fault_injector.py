"""
Aurion - Fault Injector
Injects realistic degradation patterns into chargers for training data generation
and live demo scenarios.
"""

import random
import time
import logging
from typing import List, Optional

from charger import Charger

logger = logging.getLogger("aurion.fault_injector")


class FaultInjector:
    """Manages fault injection across the fleet for simulation and demo."""

    FAULT_TYPES = ["thermal_runaway", "connector_degradation", "power_instability", "firmware_crash"]

    def __init__(self, chargers: List[Charger]):
        self.chargers = chargers
        self.scheduled_faults = []  # (time, charger_id, fault_type)
        self.active_faults = []  # (charger_id, fault_type, start_time)

    def schedule_random_faults(self, simulation_duration_hours: float, faults_per_hour: float = 0.5):
        """
        Schedule random faults throughout a simulation run.
        Used for generating training data with known fault labels.
        """
        total_seconds = simulation_duration_hours * 3600
        num_faults = int(simulation_duration_hours * faults_per_hour)
        current_time = time.time()

        for _ in range(num_faults):
            fault_time = current_time + random.uniform(0, total_seconds)
            charger = random.choice(self.chargers)
            fault_type = random.choice(self.FAULT_TYPES)
            self.scheduled_faults.append((fault_time, charger.charger_id, fault_type))

        self.scheduled_faults.sort(key=lambda x: x[0])
        logger.info(f"Scheduled {num_faults} faults over {simulation_duration_hours} hours")

    def schedule_demo_scenario(self, charger_id: str, fault_type: str, delay_seconds: float = 0):
        """Schedule a specific fault for a live demo."""
        fault_time = time.time() + delay_seconds
        self.scheduled_faults.append((fault_time, charger_id, fault_type))
        logger.info(f"Demo fault scheduled: {fault_type} on {charger_id} in {delay_seconds}s")

    def check_and_inject(self, current_time: float) -> List[dict]:
        """
        Check if any scheduled faults should fire.
        Call this every tick.
        Returns list of newly injected fault events (for labeling).
        """
        injected = []
        remaining = []

        for fault_time, charger_id, fault_type in self.scheduled_faults:
            if current_time >= fault_time:
                # Find and inject
                charger = self._find_charger(charger_id)
                if charger and not charger.fault_active:
                    charger.inject_fault(fault_type, current_time)
                    self.active_faults.append((charger_id, fault_type, current_time))
                    injected.append({
                        "charger_id": charger_id,
                        "fault_type": fault_type,
                        "injection_time": current_time,
                    })
                    logger.info(f"FAULT INJECTED: {fault_type} on {charger_id}")
            else:
                remaining.append((fault_time, charger_id, fault_type))

        self.scheduled_faults = remaining
        return injected

    def get_active_faults(self) -> List[dict]:
        """Return currently active faults."""
        return [
            {"charger_id": cid, "fault_type": ft, "start_time": st}
            for cid, ft, st in self.active_faults
        ]

    def _find_charger(self, charger_id: str) -> Optional[Charger]:
        for c in self.chargers:
            if c.charger_id == charger_id:
                return c
        return None


class DegradationPattern:
    """
    Models slow degradation over days/weeks for training data.
    Unlike sudden faults, this simulates gradual wear.
    """

    def __init__(self, charger: Charger, pattern_type: str, duration_days: float):
        self.charger = charger
        self.pattern_type = pattern_type
        self.duration_days = duration_days
        self.start_time: Optional[float] = None
        self.progress = 0.0

    def start(self, current_time: float):
        self.start_time = current_time

    def apply(self, current_time: float):
        """Apply gradual degradation. Call every tick."""
        if self.start_time is None:
            return

        elapsed_days = (current_time - self.start_time) / 86400
        self.progress = min(1.0, elapsed_days / self.duration_days)

        if self.pattern_type == "aging_thermal":
            # Baseline temperature slowly rises over weeks
            self.charger.base_temperature += 0.001 * self.progress

        elif self.pattern_type == "connector_wear":
            # Increasing probability of session failures
            if self.charger.state.value == "charging":
                if random.random() < 0.01 * self.progress:
                    self.charger.current *= 0.7

        elif self.pattern_type == "capacitor_degradation":
            # Voltage ripple increases over time
            ripple = 5 * self.progress
            self.charger.voltage += random.gauss(0, ripple)

    @property
    def is_complete(self) -> bool:
        return self.progress >= 1.0
