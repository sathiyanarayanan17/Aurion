import type {
  ChargerSummary,
  ChargerDetailData,
  AlertItem,
  FleetOverviewData,
  MapMarkerData,
  FaultType,
  FaultInjectionResponse
} from '../types';
import {
  INITIAL_CHARGERS,
  INITIAL_ALERTS,
  getFleetOverviewFromChargers,
  generateChargerDetail
} from './mockData';

let simulationChargers: ChargerSummary[] = JSON.parse(JSON.stringify(INITIAL_CHARGERS));
let simulationAlerts: AlertItem[] = JSON.parse(JSON.stringify(INITIAL_ALERTS));

export const apiService = {
  async getFleetOverview(): Promise<FleetOverviewData> {
    try {
      const res = await fetch('/api/fleet/overview', { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Backend not running, use simulation
    }
    return getFleetOverviewFromChargers(simulationChargers, simulationAlerts.length);
  },

  async getChargers(): Promise<{ chargers: ChargerSummary[]; total: number }> {
    try {
      const res = await fetch('/api/chargers', { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Backend not running, use simulation
    }
    return {
      chargers: simulationChargers,
      total: simulationChargers.length
    };
  },

  async getChargerById(chargerId: string): Promise<ChargerDetailData> {
    try {
      const res = await fetch(`/api/chargers/${encodeURIComponent(chargerId)}`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Backend not running, use simulation
    }
    const charger = simulationChargers.find(c => c.charger_id === chargerId) || simulationChargers[0];
    return generateChargerDetail(charger);
  },

  async getAlerts(): Promise<{ alerts: AlertItem[]; total: number }> {
    try {
      const res = await fetch('/api/alerts', { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Backend not running, use simulation
    }
    return {
      alerts: simulationAlerts,
      total: simulationAlerts.length
    };
  },

  async getMapData(): Promise<{ markers: MapMarkerData[]; total: number }> {
    try {
      const res = await fetch('/api/map/data', { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Backend not running, use simulation
    }
    const markers: MapMarkerData[] = simulationChargers.map(c => ({
      charger_id: c.charger_id,
      lat: c.location.lat,
      lng: c.location.lng,
      health_score: c.health_score,
      risk_level: c.risk_level,
      state: c.state,
      power_kw: c.power_kw,
      profile: c.profile,
      city: c.location.city
    }));
    return {
      markers,
      total: markers.length
    };
  },

  async injectFault(chargerId: string, faultType: FaultType): Promise<FaultInjectionResponse> {
    try {
      const res = await fetch(`/api/faults/inject?charger_id=${encodeURIComponent(chargerId)}&fault_type=${encodeURIComponent(faultType)}`, {
        method: 'POST',
        signal: AbortSignal.timeout(2000)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Backend not running, execute simulation fault injection
    }

    const charger = simulationChargers.find(c => c.charger_id === chargerId);
    if (charger) {
      if (faultType === 'thermal_runaway') {
        charger.health_score = Math.max(12, charger.health_score - 45);
        charger.risk_level = 'CRITICAL';
        charger.temperature = Math.min(84.2, charger.temperature + 26.5);
        charger.state = 'faulted';
        
        simulationAlerts.unshift({
          id: `ALT-${Date.now().toString().slice(-4)}`,
          charger_id: chargerId,
          timestamp: new Date().toISOString(),
          alert_type: 'Thermal Runaway Fault Injected',
          severity: 'CRITICAL',
          health_score: charger.health_score,
          details: `IGBT junction thermal runaway triggered for ${chargerId}. Temp spiked to ${charger.temperature} deg C. Protection interlock engaged.`,
          penalties: { temperature_penalty: 38, voltage_penalty: 16, session_failure_penalty: 12, connection_penalty: 4, error_penalty: 4 }
        });
      } else if (faultType === 'voltage_sag') {
        charger.health_score = Math.max(20, charger.health_score - 35);
        charger.risk_level = 'CRITICAL';
        charger.voltage = 352.0;
        
        simulationAlerts.unshift({
          id: `ALT-${Date.now().toString().slice(-4)}`,
          charger_id: chargerId,
          timestamp: new Date().toISOString(),
          alert_type: 'Severe Voltage Sag Fault Injected',
          severity: 'CRITICAL',
          health_score: charger.health_score,
          details: `DC bus voltage dropped below 355V for ${chargerId}. High harmonic ripple detected.`,
          penalties: { temperature_penalty: 12, voltage_penalty: 32, session_failure_penalty: 8, connection_penalty: 4, error_penalty: 3 }
        });
      } else if (faultType === 'connector_overheat') {
        charger.health_score = Math.max(38, charger.health_score - 28);
        charger.risk_level = 'HIGH';
        charger.temperature = 58.0;
        charger.power_kw = Math.min(charger.power_kw, 35.0);

        simulationAlerts.unshift({
          id: `ALT-${Date.now().toString().slice(-4)}`,
          charger_id: chargerId,
          timestamp: new Date().toISOString(),
          alert_type: 'Connector Pin Thermal Warning',
          severity: 'HIGH',
          health_score: charger.health_score,
          details: `Pin contact resistance elevated. Power de-rated to ${charger.power_kw} kW on ${chargerId}.`,
          penalties: { temperature_penalty: 20, voltage_penalty: 10, session_failure_penalty: 6, connection_penalty: 8, error_penalty: 2 }
        });
      } else if (faultType === 'isolation_fault') {
        charger.health_score = Math.max(18, charger.health_score - 40);
        charger.risk_level = 'CRITICAL';
        charger.state = 'faulted';

        simulationAlerts.unshift({
          id: `ALT-${Date.now().toString().slice(-4)}`,
          charger_id: chargerId,
          timestamp: new Date().toISOString(),
          alert_type: 'DC Isolation Resistance Failure',
          severity: 'CRITICAL',
          health_score: charger.health_score,
          details: `Chassis ground isolation dropped below safety limits (<100 kOhm) for ${chargerId}. Contactors opened.`,
          penalties: { temperature_penalty: 14, voltage_penalty: 26, session_failure_penalty: 14, connection_penalty: 6, error_penalty: 5 }
        });
      } else if (faultType === 'communication_drop') {
        charger.health_score = Math.max(50, charger.health_score - 18);
        charger.risk_level = 'MEDIUM';
        
        simulationAlerts.unshift({
          id: `ALT-${Date.now().toString().slice(-4)}`,
          charger_id: chargerId,
          timestamp: new Date().toISOString(),
          alert_type: 'OCPP Communication Packet Loss',
          severity: 'MEDIUM',
          health_score: charger.health_score,
          details: `Telemetry heartbeat packets dropped (>5 consecutive retries) for ${chargerId}.`,
          penalties: { temperature_penalty: 4, voltage_penalty: 4, session_failure_penalty: 4, connection_penalty: 10, error_penalty: 2 }
        });
      } else if (faultType === 'normal_recovery') {
        charger.health_score = 95;
        charger.risk_level = 'LOW';
        charger.state = 'charging';
        charger.temperature = 36.5;
        charger.voltage = 401.0;
        charger.current = 180.0;
        charger.power_kw = 72.2;
        charger.days_since_maintenance = 0;
      }
    }

    return {
      status: 'scheduled',
      charger_id: chargerId,
      fault_type: faultType,
      message: `Fault ${faultType} applied successfully to ${chargerId}`
    };
  },

  getSimulationChargers() {
    return simulationChargers;
  },

  getSimulationAlerts() {
    return simulationAlerts;
  },

  updateSimulationCharger(id: string, updates: Partial<ChargerSummary>) {
    const idx = simulationChargers.findIndex(c => c.charger_id === id);
    if (idx !== -1) {
      simulationChargers[idx] = { ...simulationChargers[idx], ...updates };
    }
  }
};
