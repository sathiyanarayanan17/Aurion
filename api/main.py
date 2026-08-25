"""
Aurion - FastAPI Backend
Serves real-time health scores, predictions, and alerts via REST + WebSocket.
"""

import json
import asyncio
import logging
from typing import Dict, List, Optional
from datetime import datetime

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from kafka import KafkaConsumer
import threading

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("aurion.api")


# In-memory state (in production: Redis or Postgres)
charger_health: Dict[str, dict] = {}
charger_latest_telemetry: Dict[str, dict] = {}
charger_predictions: Dict[str, dict] = {}
alerts_buffer: List[dict] = []  # Last N alerts
MAX_ALERTS = 200
connected_ws_clients: List[WebSocket] = []


def kafka_health_consumer():
    """Background thread consuming health scores from Kafka."""
    try:
        consumer = KafkaConsumer(
            "charger.health",
            bootstrap_servers="localhost:9092",
            value_deserializer=lambda m: json.loads(m.decode("utf-8")),
            auto_offset_reset="latest",
            group_id="aurion-api-health",
        )
        for message in consumer:
            data = message.value
            charger_id = data.get("charger_id")
            if charger_id:
                charger_health[charger_id] = data
    except Exception as e:
        logger.error(f"Kafka health consumer error: {e}")


def kafka_telemetry_consumer():
    """Background thread consuming latest telemetry."""
    try:
        consumer = KafkaConsumer(
            "telemetry.raw",
            bootstrap_servers="localhost:9092",
            value_deserializer=lambda m: json.loads(m.decode("utf-8")),
            auto_offset_reset="latest",
            group_id="aurion-api-telemetry",
        )
        for message in consumer:
            data = message.value
            charger_id = data.get("charger_id")
            if charger_id:
                charger_latest_telemetry[charger_id] = data
    except Exception as e:
        logger.error(f"Kafka telemetry consumer error: {e}")


def kafka_alerts_consumer():
    """Background thread consuming alerts."""
    try:
        consumer = KafkaConsumer(
            "charger.alerts",
            bootstrap_servers="localhost:9092",
            value_deserializer=lambda m: json.loads(m.decode("utf-8")),
            auto_offset_reset="latest",
            group_id="aurion-api-alerts",
        )
        for message in consumer:
            data = message.value
            alerts_buffer.append(data)
            if len(alerts_buffer) > MAX_ALERTS:
                alerts_buffer.pop(0)
            # Push to WebSocket clients
            asyncio.run(broadcast_alert(data))
    except Exception as e:
        logger.error(f"Kafka alerts consumer error: {e}")


async def broadcast_alert(alert: dict):
    """Push alert to all connected WebSocket clients."""
    dead_clients = []
    for ws in connected_ws_clients:
        try:
            await ws.send_json({"type": "alert", "data": alert})
        except Exception:
            dead_clients.append(ws)
    for ws in dead_clients:
        connected_ws_clients.remove(ws)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start Kafka consumers on startup."""
    # Start background consumers
    threads = [
        threading.Thread(target=kafka_health_consumer, daemon=True),
        threading.Thread(target=kafka_telemetry_consumer, daemon=True),
        threading.Thread(target=kafka_alerts_consumer, daemon=True),
    ]
    for t in threads:
        t.start()
    logger.info("Kafka consumers started")
    yield
    logger.info("Shutting down")


app = FastAPI(
    title="Aurion API",
    description="Real-time predictive maintenance platform for EV charging stations",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============ REST Endpoints ============

@app.get("/")
async def root():
    return {
        "name": "Aurion",
        "description": "Predictive EV Charger Health Platform",
        "version": "1.0.0",
        "status": "running",
        "chargers_tracked": len(charger_health),
    }


@app.get("/api/fleet/overview")
async def fleet_overview():
    """Get high-level fleet health overview."""
    total = len(charger_health)
    if total == 0:
        return {"total_chargers": 0, "status": "no_data"}
    
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
    }


@app.get("/api/chargers")
async def list_chargers(
    risk_level: Optional[str] = Query(None, description="Filter by risk level"),
    sort_by: str = Query("health_score", description="Sort field"),
    limit: int = Query(50, le=200),
):
    """List all chargers with current health status."""
    chargers = []
    
    for charger_id, health in charger_health.items():
        telemetry = charger_latest_telemetry.get(charger_id, {})
        prediction = charger_predictions.get(charger_id, {})
        
        charger_info = {
            "charger_id": charger_id,
            "health_score": health.get("health_score", 100),
            "risk_level": health.get("risk_level", "LOW"),
            "state": telemetry.get("state", "unknown"),
            "temperature": telemetry.get("temperature"),
            "voltage": telemetry.get("voltage"),
            "power_kw": telemetry.get("power_kw"),
            "location": telemetry.get("location"),
            "profile": telemetry.get("profile"),
            "prediction": prediction.get("ensemble_failure_score"),
            "days_to_failure": prediction.get("model_outputs", {}).get("xgb_days_to_failure"),
            "last_update": health.get("timestamp"),
        }
        
        if risk_level and health.get("risk_level") != risk_level:
            continue
        chargers.append(charger_info)
    
    # Sort
    reverse = sort_by == "health_score"
    chargers.sort(key=lambda x: x.get(sort_by, 0) or 0, reverse=not reverse)
    
    return {"chargers": chargers[:limit], "total": len(chargers)}


@app.get("/api/chargers/{charger_id}")
async def get_charger_detail(charger_id: str):
    """Get detailed info for a specific charger."""
    health = charger_health.get(charger_id)
    telemetry = charger_latest_telemetry.get(charger_id)
    prediction = charger_predictions.get(charger_id)
    
    if not health and not telemetry:
        raise HTTPException(status_code=404, detail=f"Charger {charger_id} not found")
    
    return {
        "charger_id": charger_id,
        "health": health,
        "telemetry": telemetry,
        "prediction": prediction,
    }


@app.get("/api/alerts")
async def get_alerts(
    severity: Optional[str] = Query(None),
    charger_id: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
):
    """Get recent alerts."""
    filtered = alerts_buffer
    
    if severity:
        filtered = [a for a in filtered if a.get("severity") == severity]
    if charger_id:
        filtered = [a for a in filtered if a.get("charger_id") == charger_id]
    
    return {"alerts": filtered[-limit:], "total": len(filtered)}


@app.get("/api/map/data")
async def get_map_data():
    """Get charger data formatted for map visualization."""
    markers = []
    
    for charger_id, telemetry in charger_latest_telemetry.items():
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


# ============ WebSocket ============

@app.websocket("/ws/live")
async def websocket_endpoint(ws: WebSocket):
    """Real-time WebSocket feed for dashboard."""
    await ws.accept()
    connected_ws_clients.append(ws)
    logger.info(f"WebSocket client connected. Total: {len(connected_ws_clients)}")
    
    try:
        while True:
            # Send periodic health updates
            await asyncio.sleep(5)
            
            # Send fleet summary
            overview = {
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
            await ws.send_json(overview)
            
    except WebSocketDisconnect:
        connected_ws_clients.remove(ws)
        logger.info(f"WebSocket client disconnected. Total: {len(connected_ws_clients)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
