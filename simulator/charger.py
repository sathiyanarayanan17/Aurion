"""
Aurion - Single Charger State Machine
Models a realistic EV charger with states: idle, charging, faulted, offline
Emits telemetry readings every tick.
"""

import random
import time
import math
from enum import Enum
from dataclasses import dataclass, field
from typing import Optional

import numpy as np


class ChargerState(Enum):
    IDLE = "idle"
    CHARGING = "charging"
    FAULTED = "faulted"
    OFFLINE = "offline"
    DEGRADED = "degraded"


@dataclass
class ChargerProfile:
    name: str
    power_rating_kw: float
    voltage_range: tuple
    current_range: tuple
    normal_temperature_range: tuple
    connector_types: list
    failure_rate_per_day: float


@dataclass
class ChargerTelemetry:
    charger_id: str
    timestamp: float
    voltage: float
    current: float
    temperature: float
    power_kw: float
    connector_status: str
    state: str
    session_id: Optional[str]
    energy_delivered_kwh: float
    error_codes: list
    soc_percent: Optional[float]  # State of charge if in session

    def to_dict(self) -> dict:
        return {
            "charger_id": self.charger_id,
            "timestamp": self.timestamp,
            "voltage": round(self.voltage, 2),
            "current": round(self.current, 2),
            "temperature": round(self.temperature, 2),
            "power_kw": round(self.power_kw, 2),
            "connector_status": self.connector_status,
            "state": self.state,
            "session_id": self.session_id,
            "energy_delivered_kwh": round(self.energy_delivered_kwh, 3),
            "error_codes": self.error_codes,
            "soc_percent": round(self.soc_percent, 1) if self.soc_percent else None,
        }


class Charger:
    """Simulates a single EV charger with realistic state transitions and telemetry."""

    def __init__(self, charger_id: str, profile: ChargerProfile, location: tuple = None):
        self.charger_id = charger_id
        self.profile = profile
        self.location = location or (
            18.5 + random.uniform(0, 2),  # Latitude (India range)
            72.8 + random.uniform(0, 5),  # Longitude (India range)
        )

        # State
        self.state = ChargerState.IDLE
        self.session_id: Optional[str] = None
        self.session_start_time: Optional[float] = None
        self.energy_delivered_kwh = 0.0
        self.soc_percent: Optional[float] = None

        # Telemetry values
        self.voltage = np.mean(profile.voltage_range)
        self.current = 0.0
        self.temperature = np.mean(profile.normal_temperature_range)
        self.base_temperature = self.temperature

        # Fault state
        self.fault_active = False
        self.fault_type: Optional[str] = None
        self.fault_start_time: Optional[float] = None
        self.fault_progress = 0.0  # 0 to 1

        # Metrics
        self.total_sessions = 0
        self.failed_sessions = 0
        self.uptime_start = time.time()
        self.last_maintenance = time.time()
        self.days_since_maintenance = 0

        # Internal clock
        self.tick_count = 0

    def tick(self, current_time: float) -> ChargerTelemetry:
        """Advance charger state by one time step and return telemetry."""
        self.tick_count += 1
        self.days_since_maintenance = (current_time - self.last_maintenance) / 86400

        # State transitions
        if not self.fault_active:
            self._normal_state_transition(current_time)
        else:
            self._fault_progression(current_time)

        # Generate telemetry readings
        self._update_readings(current_time)

        return ChargerTelemetry(
            charger_id=self.charger_id,
            timestamp=current_time,
            voltage=self.voltage,
            current=self.current,
            temperature=self.temperature,
            power_kw=self.voltage * self.current / 1000,
            connector_status=self._connector_status(),
            state=self.state.value,
            session_id=self.session_id,
            energy_delivered_kwh=self.energy_delivered_kwh,
            error_codes=self._get_error_codes(),
            soc_percent=self.soc_percent,
        )

    def _normal_state_transition(self, current_time: float):
        """Handle transitions between idle and charging."""
        if self.state == ChargerState.IDLE:
            # Probability of a new session starting (higher during day hours)
            hour = (current_time % 86400) / 3600
            day_factor = 1.5 if 8 <= hour <= 22 else 0.3
            if random.random() < 0.02 * day_factor:  # ~1 session every few minutes
                self._start_session(current_time)

        elif self.state == ChargerState.CHARGING:
            # Session duration: 20-90 minutes typically
            elapsed = current_time - self.session_start_time
            # SOC-based completion
            if self.soc_percent and self.soc_percent >= 95:
                self._end_session(current_time, success=True)
            elif elapsed > random.gauss(3600, 900):  # ~60 min avg
                self._end_session(current_time, success=True)

        elif self.state == ChargerState.FAULTED:
            # Auto-recover after some time (simulates remote restart)
            if random.random() < 0.005:
                self.state = ChargerState.IDLE
                self.fault_active = False

    def _start_session(self, current_time: float):
        """Begin a charging session."""
        self.state = ChargerState.CHARGING
        self.session_id = f"sess-{self.charger_id}-{int(current_time)}"
        self.session_start_time = current_time
        self.energy_delivered_kwh = 0.0
        self.soc_percent = random.uniform(10, 50)  # Vehicle arrives with 10-50% SOC
        self.total_sessions += 1

    def _end_session(self, current_time: float, success: bool = True):
        """End a charging session."""
        if not success:
            self.failed_sessions += 1
        self.state = ChargerState.IDLE
        self.session_id = None
        self.session_start_time = None
        self.soc_percent = None

    def _update_readings(self, current_time: float):
        """Update voltage, current, temperature based on current state."""
        v_min, v_max = self.profile.voltage_range
        c_min, c_max = self.profile.current_range
        t_min, t_max = self.profile.normal_temperature_range

        if self.state == ChargerState.CHARGING:
            # Voltage with small noise
            self.voltage = np.mean([v_min, v_max]) + random.gauss(0, (v_max - v_min) * 0.01)
            # Current ramps based on SOC (tapers as SOC increases)
            soc_factor = 1.0 - (self.soc_percent / 100) ** 2 if self.soc_percent else 0.8
            self.current = c_max * soc_factor * random.uniform(0.85, 1.0)
            # Temperature rises during charging
            target_temp = t_max + (self.current / c_max) * 10
            self.temperature += (target_temp - self.temperature) * 0.05 + random.gauss(0, 0.3)
            # Energy and SOC
            power_kw = self.voltage * self.current / 1000
            self.energy_delivered_kwh += power_kw * (5 / 3600)  # 5 second intervals
            if self.soc_percent is not None:
                # Assume 60 kWh battery
                self.soc_percent += (power_kw * (5 / 3600)) / 60 * 100

        elif self.state == ChargerState.IDLE:
            self.voltage = np.mean([v_min, v_max]) + random.gauss(0, 1)
            self.current = 0.0
            # Cool down toward ambient
            ambient = t_min - 5
            self.temperature += (ambient - self.temperature) * 0.02 + random.gauss(0, 0.1)

        elif self.state == ChargerState.FAULTED:
            self.voltage = random.uniform(v_min * 0.7, v_min)
            self.current = 0.0
            self.temperature += random.gauss(0, 0.5)

        elif self.state == ChargerState.OFFLINE:
            self.voltage = 0.0
            self.current = 0.0

        # Clamp values
        self.voltage = max(0, self.voltage)
        self.current = max(0, self.current)
        self.temperature = max(15, min(120, self.temperature))

    def inject_fault(self, fault_type: str, current_time: float):
        """Inject a fault scenario into this charger."""
        self.fault_active = True
        self.fault_type = fault_type
        self.fault_start_time = current_time
        self.fault_progress = 0.0

    def _fault_progression(self, current_time: float):
        """Progress an active fault scenario."""
        elapsed = current_time - self.fault_start_time

        if self.fault_type == "thermal_runaway":
            self.fault_progress = min(1.0, elapsed / 1800)  # 30 min to full failure
            self.temperature += 1.5 * self.fault_progress + random.gauss(0, 0.5)
            self.voltage *= (1 + random.uniform(-0.05, 0.05) * self.fault_progress)
            if self.fault_progress >= 1.0:
                self.state = ChargerState.FAULTED
                self._end_session(current_time, success=False)

        elif self.fault_type == "connector_degradation":
            self.fault_progress = min(1.0, elapsed / 3600)  # 60 min
            drop_prob = 0.05 + 0.75 * self.fault_progress
            if random.random() < drop_prob:
                self.current *= 0.3
                if random.random() < drop_prob * 0.5:
                    self.state = ChargerState.FAULTED
                    self._end_session(current_time, success=False)

        elif self.fault_type == "power_instability":
            self.fault_progress = min(1.0, elapsed / 2700)  # 45 min
            self.voltage += random.gauss(0, 15 * self.fault_progress)
            if random.random() < 0.1 * self.fault_progress:
                self.voltage *= 0.6  # Brownout
            if self.fault_progress >= 1.0:
                self.state = ChargerState.FAULTED

        elif self.fault_type == "firmware_crash":
            self.fault_progress = min(1.0, elapsed / 600)  # 10 min
            if elapsed > 120:  # After 2 min of erratic readings
                self.state = ChargerState.OFFLINE
                self._end_session(current_time, success=False)
            else:
                self.voltage += random.gauss(0, 20)
                self.current += random.gauss(0, 10)

    def _connector_status(self) -> str:
        if self.state == ChargerState.CHARGING:
            return "connected_charging"
        elif self.state == ChargerState.IDLE:
            return "available"
        elif self.state == ChargerState.FAULTED:
            return "faulted"
        else:
            return "offline"

    def _get_error_codes(self) -> list:
        codes = []
        if self.fault_active:
            if self.fault_type == "thermal_runaway":
                codes.append("E001_OVER_TEMP")
            elif self.fault_type == "connector_degradation":
                codes.append("E002_CONN_FAULT")
            elif self.fault_type == "power_instability":
                codes.append("E003_VOLTAGE_FAULT")
            elif self.fault_type == "firmware_crash":
                codes.append("E004_FW_ERROR")
        if self.temperature > 80:
            codes.append("W001_HIGH_TEMP")
        return codes

    def reset(self):
        """Simulate maintenance reset."""
        self.state = ChargerState.IDLE
        self.fault_active = False
        self.fault_type = None
        self.temperature = self.base_temperature
        self.last_maintenance = time.time()
        self.days_since_maintenance = 0
