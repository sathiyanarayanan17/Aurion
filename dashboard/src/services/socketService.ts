import type { AlertItem, ChargerSummary } from '../types';
import { apiService } from './apiService';

type FleetUpdateCallback = (data: { health_scores: Record<string, number>; timestamp: string }) => void;
type AlertCallback = (alert: AlertItem) => void;
type ConnectionStatusCallback = (connected: boolean) => void;

class SocketService {
  private ws: WebSocket | null = null;
  private fleetSubscribers: Set<FleetUpdateCallback> = new Set();
  private alertSubscribers: Set<AlertCallback> = new Set();
  private statusSubscribers: Set<ConnectionStatusCallback> = new Set();
  private simulationInterval: number | null = null;
  private isConnected: boolean = false;
  private reconnectTimeout: number | null = null;

  init() {
    this.connect();
    this.startSimulationTicker();
  }

  connect() {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/live`;
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.notifyStatus(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'fleet_update' && payload.data) {
            this.fleetSubscribers.forEach(cb => cb(payload.data));
          } else if (payload.type === 'alert' && payload.data) {
            const alertData: AlertItem = {
              id: `ALT-${Date.now().toString().slice(-4)}`,
              charger_id: payload.data.charger_id,
              timestamp: payload.data.timestamp || new Date().toISOString(),
              alert_type: payload.data.alert_type || 'System Health Anomaly',
              severity: payload.data.severity || 'HIGH',
              health_score: payload.data.health_score || 50,
              details: payload.data.details || 'Telemetry parameter deviated from baseline profile.'
            };
            this.alertSubscribers.forEach(cb => cb(alertData));
          }
        } catch {
          // parse error
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.notifyStatus(false);
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.isConnected = false;
        this.notifyStatus(false);
      };
    } catch {
      this.isConnected = false;
      this.notifyStatus(false);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) return;
    this.reconnectTimeout = window.setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, 10000);
  }

  private notifyStatus(connected: boolean) {
    this.statusSubscribers.forEach(cb => cb(connected));
  }

  private startSimulationTicker() {
    if (this.simulationInterval) return;

    this.simulationInterval = window.setInterval(() => {
      const chargers = apiService.getSimulationChargers();
      const healthScores: Record<string, number> = {};

      chargers.forEach((c: ChargerSummary) => {
        if (c.state === 'charging') {
          const tempDelta = (Math.random() - 0.48) * 0.4;
          const voltDelta = (Math.random() - 0.5) * 0.8;
          const currDelta = (Math.random() - 0.5) * 1.5;

          c.temperature = Math.round((c.temperature + tempDelta) * 10) / 10;
          c.voltage = Math.round((c.voltage + voltDelta) * 10) / 10;
          c.current = Math.max(0, Math.round((c.current + currDelta) * 10) / 10);
          c.power_kw = Math.round(((c.voltage * c.current) / 1000) * 10) / 10;
        }

        healthScores[c.charger_id] = c.health_score;
      });

      const updatePayload = {
        health_scores: healthScores,
        timestamp: new Date().toISOString()
      };

      this.fleetSubscribers.forEach(cb => cb(updatePayload));
    }, 5000);
  }

  subscribeFleetUpdate(cb: FleetUpdateCallback) {
    this.fleetSubscribers.add(cb);
    return () => {
      this.fleetSubscribers.delete(cb);
    };
  }

  subscribeAlerts(cb: AlertCallback) {
    this.alertSubscribers.add(cb);
    return () => {
      this.alertSubscribers.delete(cb);
    };
  }

  subscribeStatus(cb: ConnectionStatusCallback) {
    this.statusSubscribers.add(cb);
    cb(this.isConnected);
    return () => {
      this.statusSubscribers.delete(cb);
    };
  }

  destroy() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.fleetSubscribers.clear();
    this.alertSubscribers.clear();
    this.statusSubscribers.clear();
  }
}

export const socketService = new SocketService();
