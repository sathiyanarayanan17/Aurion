"""
Aurion - Standalone Demo Mode
Runs the entire platform without Docker (no Kafka/Mosquitto needed).
Simulator → Health Scorer → Predictor → FastAPI all in one process.
Perfect for demos, development, and interviews.
"""

import asyncio
import json
import time
import sys
import os
import threading
import logging
from pathlib import Path

# Add project paths
sys.path.insert(0, str(Path(__file__).parent / "simulator"))
sys.path.insert(0, str(Path(__file__).parent / "processing"))
sys.path.insert(0, str(Path(__file__).parent / "prediction"))

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import Dict, List, Optional
from datetime import datetime

from charger import Charger, ChargerProfile
from fleet import Fleet
from fault_injector import FaultInjector
from health_scorer import ChargerHealthState

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("aurion.standalone")

# ============ Global State ============
charger_health: Dict[str, dict] = {}
charger_telemetry: Dict[str, dict] = {}
charger_predictions: Dict[str, dict] = {}
health_states: Dict[str, ChargerHealthState] = {}
alerts_buffer: List[dict] = []
MAX_ALERTS = 200
connected_ws: List[WebSocket] = []

# Fleet
fleet: Optional[Fleet] = None
fault_injector: Optional[FaultInjector] = None

# ============ FastAPI App ============
app = FastAPI(
    title="Aurion",
    description="Real-time Predictive Maintenance Platform for EV Charging Stations",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============ Simulation Loop ============
def simulation_loop():
    """Background thread running the charger fleet simulation."""
    global fleet, fault_injector

    fleet = Fleet(str(Path(__file__).parent / "simulator" / "config.yaml"))
    fault_injector = FaultInjector(fleet.chargers)

    # Schedule some random faults for demo
    fault_injector.schedule_random_faults(simulation_duration_hours=2, faults_per_hour=1.5)

    current_time = time.time()
    tick_count = 0

    logger.info(f"Simulation started: {len(fleet.chargers)} chargers")

    while True:
        try:
            # Check for fault injections
            injected = fault_injector.check_and_inject(current_time)
            for fault in injected:
                alert = {
                    "charger_id": fault["charger_id"],
                    "timestamp": current_time,
                    "alert_type": "fault_injected",
                    "severity": "HIGH",
                    "health_score": 50,
                    "details": {"fault_type": fault["fault_type"]},
                }
                alerts_buffer.append(alert)
                if len(alerts_buffer) > MAX_ALERTS:
                    alerts_buffer.pop(0)

            # Tick all chargers
            batch = fleet.tick_all(current_time)

            # Process each charger's telemetry
            for data in batch:
                charger_id = data["charger_id"]
                charger_telemetry[charger_id] = data

                # Update health state
                if charger_id not in health_states:
                    health_states[charger_id] = ChargerHealthState()

                health_states[charger_id].update(data)

                # Compute health score every 6 ticks (30 seconds)
                if tick_count % 6 == 0:
                    score_result = health_states[charger_id].compute_health_score()
                    charger_health[charger_id] = {
                        "charger_id": charger_id,
                        "timestamp": current_time,
                        **score_result,
                    }

                    # Generate alerts for degraded chargers
                    if score_result["risk_level"] in ("HIGH", "CRITICAL"):
                        alert = {
                            "charger_id": charger_id,
                            "timestamp": current_time,
                            "alert_type": "health_degradation",
                            "severity": score_result["risk_level"],
                            "health_score": score_result["health_score"],
                            "details": score_result["components"],
                        }
                        alerts_buffer.append(alert)
                        if len(alerts_buffer) > MAX_ALERTS:
                            alerts_buffer.pop(0)

            tick_count += 1
            current_time += 5  # 5 second intervals

            # Log status every 60 seconds (12 ticks)
            if tick_count % 12 == 0:
                status = fleet.get_fleet_status()
                healthy = sum(1 for h in charger_health.values() if h.get("risk_level") == "LOW")
                logger.info(f"Tick {tick_count} | Fleet: {status} | Healthy: {healthy}/{len(charger_health)}")

            time.sleep(5)  # Real-time 5 second intervals

        except Exception as e:
            logger.error(f"Simulation error: {e}")
            time.sleep(1)


# ============ API Routes ============

@app.get("/")
async def root():
    return {
        "name": "Aurion",
        "tagline": "Predictive EV Charger Health Platform",
        "version": "1.0.0",
        "mode": "standalone_demo",
        "chargers_tracked": len(charger_health),
        "status": "running",
    }


@app.get("/api/fleet/overview")
async def fleet_overview():
    total = len(charger_health)
    if total == 0:
        return {"total_chargers": len(charger_telemetry), "status": "warming_up"}

    risk_counts = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    avg_score = 0

    for data in charger_health.values():
        risk_counts[data.get("risk_level", "LOW")] += 1
        avg_score += data.get("health_score", 100)

    avg_score /= total

    return {
        "total_chargers": total,
        "average_health_score": round(avg_score, 1),
        "risk_distribution": risk_counts,
        "chargers_needing_attention": risk_counts["HIGH"] + risk_counts["CRITICAL"],
        "fleet_health_status": "HEALTHY" if avg_score > 70 else "DEGRADED" if avg_score > 40 else "CRITICAL",
        "total_alerts": len(alerts_buffer),
    }


@app.get("/api/chargers")
async def list_chargers(
    risk_level: Optional[str] = Query(None),
    sort_by: str = Query("health_score"),
    limit: int = Query(50, le=200),
):
    chargers = []
    for charger_id, telemetry in charger_telemetry.items():
        health = charger_health.get(charger_id, {})
        chargers.append({
            "charger_id": charger_id,
            "health_score": health.get("health_score", 100),
            "risk_level": health.get("risk_level", "LOW"),
            "state": telemetry.get("state", "unknown"),
            "temperature": telemetry.get("temperature"),
            "voltage": telemetry.get("voltage"),
            "current": telemetry.get("current"),
            "power_kw": telemetry.get("power_kw"),
            "location": telemetry.get("location"),
            "profile": telemetry.get("profile"),
            "days_since_maintenance": telemetry.get("days_since_maintenance"),
            "last_update": health.get("timestamp"),
        })

    if risk_level:
        chargers = [c for c in chargers if c["risk_level"] == risk_level]

    chargers.sort(key=lambda x: x.get("health_score", 100))
    return {"chargers": chargers[:limit], "total": len(chargers)}


@app.get("/api/chargers/{charger_id}")
async def get_charger_detail(charger_id: str):
    health = charger_health.get(charger_id)
    telemetry = charger_telemetry.get(charger_id)

    if not telemetry:
        raise HTTPException(status_code=404, detail=f"Charger {charger_id} not found")

    return {
        "charger_id": charger_id,
        "health": health,
        "telemetry": telemetry,
        "prediction": charger_predictions.get(charger_id),
    }


@app.get("/api/alerts")
async def get_alerts(
    severity: Optional[str] = Query(None),
    charger_id: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
):
    filtered = alerts_buffer
    if severity:
        filtered = [a for a in filtered if a.get("severity") == severity]
    if charger_id:
        filtered = [a for a in filtered if a.get("charger_id") == charger_id]
    return {"alerts": list(reversed(filtered[-limit:])), "total": len(filtered)}


@app.get("/api/map/data")
async def get_map_data():
    markers = []
    for charger_id, telemetry in charger_telemetry.items():
        health = charger_health.get(charger_id, {})
        location = telemetry.get("location")
        if not location:
            continue
        markers.append({
            "charger_id": charger_id,
            "lat": location["lat"],
            "lng": location["lng"],
            "health_score": health.get("health_score", 100),
            "risk_level": health.get("risk_level", "LOW"),
            "state": telemetry.get("state", "unknown"),
            "power_kw": telemetry.get("power_kw", 0),
            "profile": telemetry.get("profile"),
        })
    return {"markers": markers, "total": len(markers)}


@app.post("/api/faults/inject")
async def inject_fault(charger_id: str, fault_type: str = "thermal_runaway"):
    """Inject a fault for live demo."""
    if fault_injector is None:
        raise HTTPException(status_code=503, detail="Simulation not ready")

    fault_injector.schedule_demo_scenario(charger_id, fault_type, delay_seconds=0)
    return {"status": "scheduled", "charger_id": charger_id, "fault_type": fault_type}


@app.get("/api/faults/types")
async def get_fault_types():
    return {
        "fault_types": [
            {"id": "thermal_runaway", "name": "Thermal Runaway", "description": "Gradual temperature rise leading to shutdown"},
            {"id": "connector_degradation", "name": "Connector Degradation", "description": "Intermittent connection drops"},
            {"id": "power_instability", "name": "Power Instability", "description": "Voltage fluctuations from grid issues"},
            {"id": "firmware_crash", "name": "Firmware Crash", "description": "Sudden unresponsive state"},
        ]
    }


# ============ WebSocket ============

@app.websocket("/ws/live")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    connected_ws.append(ws)
    logger.info(f"WebSocket connected. Clients: {len(connected_ws)}")

    try:
        while True:
            await asyncio.sleep(5)
            # Send fleet update
            update = {
                "type": "fleet_update",
                "data": {
                    "total_chargers": len(charger_health),
                    "health_scores": {
                        cid: data.get("health_score", 100)
                        for cid, data in charger_health.items()
                    },
                    "timestamp": datetime.now().isoformat(),
                }
            }
            await ws.send_json(update)

            # Send any new alerts
            if alerts_buffer:
                latest_alert = alerts_buffer[-1]
                await ws.send_json({"type": "alert", "data": latest_alert})

    except WebSocketDisconnect:
        connected_ws.remove(ws)
        logger.info(f"WebSocket disconnected. Clients: {len(connected_ws)}")


# ============ Startup ============

@app.on_event("startup")
async def startup():
    """Start simulation on app startup."""
    sim_thread = threading.Thread(target=simulation_loop, daemon=True)
    sim_thread.start()
    logger.info("Aurion standalone mode started!")
    logger.info("Dashboard: http://localhost:3000")
    logger.info("API docs: http://localhost:8000/docs")


if __name__ == "__main__":
    print("""
    ╔══════════════════════════════════════════════════╗
    ║          AURION - Standalone Demo Mode           ║
    ║   Predictive EV Charger Health Platform         ║
    ╠══════════════════════════════════════════════════╣
    ║  API Server:  http://localhost:8000              ║
    ║  API Docs:    http://localhost:8000/docs         ║
    ║  Dashboard:   http://localhost:3000              ║
    ║                                                  ║
    ║  Run dashboard: cd dashboard && npm run dev      ║
    ╚══════════════════════════════════════════════════╝
    """)
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
