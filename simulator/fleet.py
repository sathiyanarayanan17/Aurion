"""
Aurion - Fleet Simulator
Spawns multiple chargers and runs them in parallel, publishing telemetry.
"""

import time
import random
import yaml
import json
import logging
from pathlib import Path
from typing import List

from charger import Charger, ChargerProfile

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("aurion.fleet")


# Indian city locations for realistic charger placement
INDIAN_LOCATIONS = [
    ("Mumbai", 19.0760, 72.8777),
    ("Delhi", 28.6139, 77.2090),
    ("Bangalore", 12.9716, 77.5946),
    ("Chennai", 13.0827, 80.2707),
    ("Hyderabad", 17.3850, 78.4867),
    ("Pune", 18.5204, 73.8567),
    ("Kolkata", 22.5726, 88.3639),
    ("Ahmedabad", 23.0225, 72.5714),
    ("Jaipur", 26.9124, 75.7873),
    ("Lucknow", 26.8467, 80.9462),
    ("Kochi", 9.9312, 76.2673),
    ("Chandigarh", 30.7333, 76.7794),
    ("Coimbatore", 11.0168, 76.9558),
    ("Nagpur", 21.1458, 79.0882),
    ("Gurgaon", 28.4595, 77.0266),
    ("Noida", 28.5355, 77.3910),
    ("Mysore", 12.2958, 76.6394),
    ("Vizag", 17.6868, 83.2185),
    ("Indore", 22.7196, 75.8577),
    ("Bhopal", 23.2599, 77.4126),
]


class Fleet:
    """Manages a fleet of simulated chargers."""

    def __init__(self, config_path: str = "config.yaml"):
        with open(config_path, "r") as f:
            self.config = yaml.safe_load(f)

        self.chargers: List[Charger] = []
        self.profiles: List[ChargerProfile] = []
        self._build_profiles()
        self._build_fleet()

    def _build_profiles(self):
        """Build charger profiles from config."""
        for p in self.config["charger_profiles"]:
            profile = ChargerProfile(
                name=p["name"],
                power_rating_kw=p["power_rating_kw"],
                voltage_range=tuple(p["voltage_range"]),
                current_range=tuple(p["current_range"]),
                normal_temperature_range=tuple(p["normal_temperature_range"]),
                connector_types=p["connector_types"],
                failure_rate_per_day=p["failure_rate_per_day"],
            )
            self.profiles.append(profile)

    def _build_fleet(self):
        """Create charger instances spread across Indian cities."""
        num_chargers = self.config["fleet"]["num_chargers"]

        for i in range(num_chargers):
            profile = random.choice(self.profiles)
            city_name, lat, lng = INDIAN_LOCATIONS[i % len(INDIAN_LOCATIONS)]

            # Add some randomness to location within city
            location = (
                lat + random.uniform(-0.05, 0.05),
                lng + random.uniform(-0.05, 0.05),
            )

            charger_id = f"AUR-{city_name[:3].upper()}-{i+1:03d}"
            charger = Charger(charger_id, profile, location)
            self.chargers.append(charger)

        logger.info(f"Fleet initialized with {len(self.chargers)} chargers across {min(num_chargers, len(INDIAN_LOCATIONS))} cities")

    def tick_all(self, current_time: float) -> List[dict]:
        """Advance all chargers by one time step."""
        telemetry_batch = []
        for charger in self.chargers:
            telemetry = charger.tick(current_time)
            data = telemetry.to_dict()
            data["location"] = {
                "lat": charger.location[0],
                "lng": charger.location[1],
            }
            data["profile"] = charger.profile.name
            data["days_since_maintenance"] = round(charger.days_since_maintenance, 1)
            telemetry_batch.append(data)
        return telemetry_batch

    def get_charger(self, charger_id: str) -> Charger:
        """Get a specific charger by ID."""
        for c in self.chargers:
            if c.charger_id == charger_id:
                return c
        raise ValueError(f"Charger {charger_id} not found")

    def get_fleet_status(self) -> dict:
        """Get summary of fleet status."""
        states = {}
        for c in self.chargers:
            state = c.state.value
            states[state] = states.get(state, 0) + 1
        return {
            "total_chargers": len(self.chargers),
            "states": states,
            "total_sessions": sum(c.total_sessions for c in self.chargers),
            "total_failed_sessions": sum(c.failed_sessions for c in self.chargers),
        }


if __name__ == "__main__":
    # Quick test - run fleet without MQTT
    fleet = Fleet()
    current_time = time.time()

    for i in range(10):
        batch = fleet.tick_all(current_time)
        current_time += 5
        print(f"\nTick {i+1}: {fleet.get_fleet_status()}")
        # Print first charger's data
        print(f"  Sample: {json.dumps(batch[0], indent=2)}")
