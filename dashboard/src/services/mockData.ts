import type {
  ChargerSummary,
  ChargerDetailData,
  AlertItem,
  FleetOverviewData,
  TelemetryHistoryPoint
} from '../types';

export const INITIAL_CHARGERS: ChargerSummary[] = [
  {
    charger_id: 'AUR-MUM-001',
    health_score: 94,
    risk_level: 'LOW',
    state: 'charging',
    temperature: 36.2,
    voltage: 401.5,
    current: 175.2,
    power_kw: 70.3,
    location: { lat: 19.0760, lng: 72.8777, city: 'Mumbai', address: 'BKC EV Hub, Bandra East' },
    profile: 'Ultra-Fast 350kW Dual CCS',
    days_since_maintenance: 12
  },
  {
    charger_id: 'AUR-DEL-002',
    health_score: 28,
    risk_level: 'CRITICAL',
    state: 'faulted',
    temperature: 68.4,
    voltage: 368.2,
    current: 24.1,
    power_kw: 8.8,
    location: { lat: 28.7041, lng: 77.1025, city: 'Delhi', address: 'Connaught Place Grid Station' },
    profile: 'DC Fast 150kW CCS2',
    days_since_maintenance: 74
  },
  {
    charger_id: 'AUR-BLR-003',
    health_score: 88,
    risk_level: 'LOW',
    state: 'charging',
    temperature: 39.1,
    voltage: 399.8,
    current: 280.4,
    power_kw: 112.1,
    location: { lat: 12.9716, lng: 77.5946, city: 'Bangalore', address: 'Electronic City Phase 1' },
    profile: 'Ultra-Fast 350kW Liquid-Cooled',
    days_since_maintenance: 18
  },
  {
    charger_id: 'AUR-MAA-004',
    health_score: 72,
    risk_level: 'MEDIUM',
    state: 'charging',
    temperature: 44.8,
    voltage: 392.4,
    current: 152.0,
    power_kw: 59.6,
    location: { lat: 13.0827, lng: 80.2707, city: 'Chennai', address: 'OMR Tech Corridor Station' },
    profile: 'DC Fast 120kW Dual Gun',
    days_since_maintenance: 36
  },
  {
    charger_id: 'AUR-HYD-005',
    health_score: 85,
    risk_level: 'LOW',
    state: 'idle',
    temperature: 32.5,
    voltage: 400.2,
    current: 0.0,
    power_kw: 0.0,
    location: { lat: 17.3850, lng: 78.4867, city: 'Hyderabad', address: 'HITEC City Metro Hub' },
    profile: 'Ultra-Fast 240kW CCS2',
    days_since_maintenance: 22
  },
  {
    charger_id: 'AUR-PUN-006',
    health_score: 41,
    risk_level: 'HIGH',
    state: 'charging',
    temperature: 56.7,
    voltage: 379.1,
    current: 110.3,
    power_kw: 41.8,
    location: { lat: 18.5204, lng: 73.8567, city: 'Pune', address: 'Hinjawadi IT Park Bay 3' },
    profile: 'DC Fast 60kW Combo',
    days_since_maintenance: 58
  },
  {
    charger_id: 'AUR-CCU-007',
    health_score: 78,
    risk_level: 'MEDIUM',
    state: 'charging',
    temperature: 42.1,
    voltage: 395.6,
    current: 190.2,
    power_kw: 75.2,
    location: { lat: 22.5726, lng: 88.3639, city: 'Kolkata', address: 'Salt Lake Sector V Station' },
    profile: 'DC Fast 120kW Dual Port',
    days_since_maintenance: 29
  },
  {
    charger_id: 'AUR-AMD-008',
    health_score: 91,
    risk_level: 'LOW',
    state: 'charging',
    temperature: 35.8,
    voltage: 403.0,
    current: 245.8,
    power_kw: 99.0,
    location: { lat: 23.0225, lng: 72.5714, city: 'Ahmedabad', address: 'SG Highway Fast Hub' },
    profile: 'DC Fast 150kW High Voltage',
    days_since_maintenance: 15
  },
  {
    charger_id: 'AUR-JAI-009',
    health_score: 52,
    risk_level: 'HIGH',
    state: 'charging',
    temperature: 53.2,
    voltage: 384.5,
    current: 130.4,
    power_kw: 50.1,
    location: { lat: 26.9124, lng: 75.7873, city: 'Jaipur', address: 'MI Road Central Plaza' },
    profile: 'DC Fast 60kW Standard',
    days_since_maintenance: 49
  },
  {
    charger_id: 'AUR-LKO-010',
    health_score: 83,
    risk_level: 'LOW',
    state: 'idle',
    temperature: 31.0,
    voltage: 401.0,
    current: 0.0,
    power_kw: 0.0,
    location: { lat: 26.8467, lng: 80.9462, city: 'Lucknow', address: 'Gomti Nagar Express Hub' },
    profile: 'DC Fast 120kW Dual CCS',
    days_since_maintenance: 24
  },
  {
    charger_id: 'AUR-COK-011',
    health_score: 96,
    risk_level: 'LOW',
    state: 'charging',
    temperature: 33.4,
    voltage: 402.8,
    current: 310.0,
    power_kw: 124.8,
    location: { lat: 9.9312, lng: 76.2673, city: 'Kochi', address: 'MG Road Marine Bay' },
    profile: 'Ultra-Fast 200kW CCS2',
    days_since_maintenance: 8
  },
  {
    charger_id: 'AUR-IXC-012',
    health_score: 89,
    risk_level: 'LOW',
    state: 'charging',
    temperature: 34.2,
    voltage: 400.9,
    current: 215.6,
    power_kw: 86.4,
    location: { lat: 30.7333, lng: 76.7794, city: 'Chandigarh', address: 'Sector 17 Commercial Bay' },
    profile: 'DC Fast 150kW Supercharger',
    days_since_maintenance: 19
  },
  {
    charger_id: 'AUR-CJB-013',
    health_score: 64,
    risk_level: 'MEDIUM',
    state: 'charging',
    temperature: 46.5,
    voltage: 390.1,
    current: 120.0,
    power_kw: 46.8,
    location: { lat: 11.0168, lng: 76.9558, city: 'Coimbatore', address: 'Avinashi Road Express' },
    profile: 'DC Fast 60kW Commercial',
    days_since_maintenance: 41
  },
  {
    charger_id: 'AUR-NAG-014',
    health_score: 22,
    risk_level: 'CRITICAL',
    state: 'faulted',
    temperature: 71.3,
    voltage: 362.4,
    current: 12.0,
    power_kw: 4.3,
    location: { lat: 21.1458, lng: 79.0882, city: 'Nagpur', address: 'MIHAN Logistics Junction' },
    profile: 'Ultra-Fast 350kW Hub',
    days_since_maintenance: 82
  },
  {
    charger_id: 'AUR-GGN-015',
    health_score: 93,
    risk_level: 'LOW',
    state: 'charging',
    temperature: 37.1,
    voltage: 402.0,
    current: 340.5,
    power_kw: 136.8,
    location: { lat: 28.4595, lng: 77.0266, city: 'Gurgaon', address: 'Cyber City Fleet Terminal' },
    profile: 'Ultra-Fast 350kW Fleet Hub',
    days_since_maintenance: 10
  },
  {
    charger_id: 'AUR-NDA-016',
    health_score: 75,
    risk_level: 'MEDIUM',
    state: 'charging',
    temperature: 43.9,
    voltage: 394.0,
    current: 185.0,
    power_kw: 72.8,
    location: { lat: 28.5355, lng: 77.3910, city: 'Noida', address: 'Sector 62 Expressway Station' },
    profile: 'DC Fast 150kW Dual Gun',
    days_since_maintenance: 31
  },
  {
    charger_id: 'AUR-MYS-017',
    health_score: 87,
    risk_level: 'LOW',
    state: 'idle',
    temperature: 30.8,
    voltage: 400.0,
    current: 0.0,
    power_kw: 0.0,
    location: { lat: 12.2958, lng: 76.6394, city: 'Mysore', address: 'Hebbal Industrial Station' },
    profile: 'DC Fast 60kW Commercial',
    days_since_maintenance: 20
  },
  {
    charger_id: 'AUR-VTZ-018',
    health_score: 48,
    risk_level: 'HIGH',
    state: 'charging',
    temperature: 54.9,
    voltage: 382.0,
    current: 140.2,
    power_kw: 53.5,
    location: { lat: 17.6868, lng: 83.2185, city: 'Vizag', address: 'Beach Road Port Terminal' },
    profile: 'DC Fast 120kW Coastal Hub',
    days_since_maintenance: 53
  },
  {
    charger_id: 'AUR-IDR-019',
    health_score: 81,
    risk_level: 'LOW',
    state: 'charging',
    temperature: 38.0,
    voltage: 398.5,
    current: 210.0,
    power_kw: 83.6,
    location: { lat: 22.7196, lng: 75.8577, city: 'Indore', address: 'Vijay Nagar Square' },
    profile: 'DC Fast 150kW Express',
    days_since_maintenance: 25
  },
  {
    charger_id: 'AUR-BHO-020',
    health_score: 70,
    risk_level: 'MEDIUM',
    state: 'idle',
    temperature: 33.1,
    voltage: 397.8,
    current: 0.0,
    power_kw: 0.0,
    location: { lat: 23.2599, lng: 77.4126, city: 'Bhopal', address: 'MP Nagar Zone II' },
    profile: 'DC Fast 60kW Standard',
    days_since_maintenance: 38
  }
];

export const INITIAL_ALERTS: AlertItem[] = [
  {
    id: 'ALT-1001',
    charger_id: 'AUR-DEL-002',
    timestamp: '2026-08-26T08:48:12Z',
    alert_type: 'Thermal Runaway & Cooling Pump Degradation',
    severity: 'CRITICAL',
    health_score: 28,
    details: 'Internal IGBT junction temperature exceeded 68 deg C with high slope (+2.4 C/min). Immediate cooling subsystem inspection advised.',
    penalties: {
      temperature_penalty: 35,
      voltage_penalty: 18,
      session_failure_penalty: 12,
      connection_penalty: 4,
      error_penalty: 3
    }
  },
  {
    id: 'ALT-1002',
    charger_id: 'AUR-NAG-014',
    timestamp: '2026-08-26T08:35:40Z',
    alert_type: 'Severe Voltage Sag & DC Bus Distortion',
    severity: 'CRITICAL',
    health_score: 22,
    details: 'DC bus voltage dropped below 365V under nominal load. Standard deviation exceeds 18.2V over 15 minutes window.',
    penalties: {
      temperature_penalty: 32,
      voltage_penalty: 28,
      session_failure_penalty: 10,
      connection_penalty: 5,
      error_penalty: 3
    }
  },
  {
    id: 'ALT-1003',
    charger_id: 'AUR-PUN-006',
    timestamp: '2026-08-26T08:12:15Z',
    alert_type: 'High Connector Pin Contact Resistance',
    severity: 'HIGH',
    health_score: 41,
    details: 'Thermal disparity detected across CC1/CC2 pins. Power delivery constrained to 41.8 kW to prevent connector welding.',
    penalties: {
      temperature_penalty: 24,
      voltage_penalty: 15,
      session_failure_penalty: 8,
      connection_penalty: 8,
      error_penalty: 4
    }
  },
  {
    id: 'ALT-1004',
    charger_id: 'AUR-VTZ-018',
    timestamp: '2026-08-26T07:54:02Z',
    alert_type: 'Isolation Resistance Degradation (Coastal Salinity)',
    severity: 'HIGH',
    health_score: 48,
    details: 'Isolation resistance dropped below 250 kOhm. Humidity sensor reads 88% with salt fog deposition indicator.',
    penalties: {
      temperature_penalty: 18,
      voltage_penalty: 14,
      session_failure_penalty: 6,
      connection_penalty: 10,
      error_penalty: 4
    }
  },
  {
    id: 'ALT-1005',
    charger_id: 'AUR-JAI-009',
    timestamp: '2026-08-26T07:22:18Z',
    alert_type: 'Coolant Flow Rate Variance',
    severity: 'HIGH',
    health_score: 52,
    details: 'Auxiliary cooling fan RPM variance (+18%) indicating potential air intake filter clogging during ambient heat surge.',
    penalties: {
      temperature_penalty: 22,
      voltage_penalty: 10,
      session_failure_penalty: 8,
      connection_penalty: 4,
      error_penalty: 4
    }
  },
  {
    id: 'ALT-1006',
    charger_id: 'AUR-CJB-013',
    timestamp: '2026-08-26T06:45:00Z',
    alert_type: 'Periodic Communication Packet Drop',
    severity: 'MEDIUM',
    health_score: 64,
    details: 'OCPP 2.0.1 heartbeat latency spiked to 4.2s. 3 retry events logged during high cellular network traffic.',
    penalties: {
      temperature_penalty: 12,
      voltage_penalty: 8,
      session_failure_penalty: 4,
      connection_penalty: 8,
      error_penalty: 4
    }
  },
  {
    id: 'ALT-1007',
    charger_id: 'AUR-BHO-020',
    timestamp: '2026-08-26T05:30:11Z',
    alert_type: 'Grid Voltage Fluctuation Tolerance Warning',
    severity: 'MEDIUM',
    health_score: 70,
    details: 'Grid harmonic distortion THD measured at 4.8%. Within operational limits but approaching warning threshold.',
    penalties: {
      temperature_penalty: 8,
      voltage_penalty: 12,
      session_failure_penalty: 4,
      connection_penalty: 3,
      error_penalty: 3
    }
  }
];

export function getFleetOverviewFromChargers(chargers: ChargerSummary[], alertsCount: number): FleetOverviewData {
  const total = chargers.length;
  const avgHealth = Math.round(chargers.reduce((acc, c) => acc + c.health_score, 0) / (total || 1));
  const low = chargers.filter(c => c.risk_level === 'LOW').length;
  const med = chargers.filter(c => c.risk_level === 'MEDIUM').length;
  const high = chargers.filter(c => c.risk_level === 'HIGH').length;
  const crit = chargers.filter(c => c.risk_level === 'CRITICAL').length;
  const needingAttention = high + crit;
  const totalPower = Math.round(chargers.reduce((acc, c) => acc + c.power_kw, 0) * 10) / 10;
  
  let status = 'Optimal';
  if (crit > 0) status = 'Critical Risk Detected';
  else if (high > 0) status = 'Attention Needed';
  else if (med > 2) status = 'Degraded';

  return {
    total_chargers: total,
    average_health_score: avgHealth,
    risk_distribution: {
      LOW: low,
      MEDIUM: med,
      HIGH: high,
      CRITICAL: crit
    },
    chargers_needing_attention: needingAttention,
    fleet_health_status: status,
    total_alerts: alertsCount,
    total_power_kw: totalPower,
    uptime_percentage: 97.4
  };
}

export function generateChargerDetail(charger: ChargerSummary): ChargerDetailData {
  const isCritical = charger.risk_level === 'CRITICAL';
  const isHigh = charger.risk_level === 'HIGH';
  const isMed = charger.risk_level === 'MEDIUM';

  let ensembleScore = 0.08;
  let xgbProb = 0.09;
  let xgbDays = 145;
  let anomalyScore = 0.04;
  let lstmProb = 0.06;
  let confidence = 0.94;
  let action = 'Routine preventive maintenance on regular schedule. No action required.';
  
  let tempPenalty = 2;
  let voltPenalty = 2;
  let sessionPenalty = 1;
  let connPenalty = 1;
  let errorPenalty = 0;

  if (isCritical) {
    ensembleScore = 0.88;
    xgbProb = 0.91;
    xgbDays = 3.2;
    anomalyScore = 0.84;
    lstmProb = 0.89;
    confidence = 0.96;
    action = 'Immediate on-site intervention required. Inspect IGBT cooling assembly and recalibrate DC bus capacitor bank within 24h.';
    tempPenalty = 35;
    voltPenalty = 25;
    sessionPenalty = 12;
    connPenalty = 4;
    errorPenalty = 4;
  } else if (isHigh) {
    ensembleScore = 0.65;
    xgbProb = 0.62;
    xgbDays = 11.5;
    anomalyScore = 0.58;
    lstmProb = 0.69;
    confidence = 0.91;
    action = 'Schedule technician inspection within 48h. Check connector contact pins for oxidation and verify airflow filter clearance.';
    tempPenalty = 22;
    voltPenalty = 15;
    sessionPenalty = 8;
    connPenalty = 6;
    errorPenalty = 3;
  } else if (isMed) {
    ensembleScore = 0.38;
    xgbProb = 0.35;
    xgbDays = 34.0;
    anomalyScore = 0.31;
    lstmProb = 0.40;
    confidence = 0.88;
    action = 'Monitor thermal gradient during peak charge curves. Run diagnostic self-test during next scheduled maintenance window.';
    tempPenalty = 12;
    voltPenalty = 8;
    sessionPenalty = 4;
    connPenalty = 3;
    errorPenalty = 1;
  }

  return {
    charger_id: charger.charger_id,
    profile: charger.profile,
    location: charger.location,
    days_since_maintenance: charger.days_since_maintenance,
    health: {
      health_score: charger.health_score,
      risk_level: charger.risk_level,
      components: {
        temperature_penalty: tempPenalty,
        voltage_penalty: voltPenalty,
        session_failure_penalty: sessionPenalty,
        connection_penalty: connPenalty,
        error_penalty: errorPenalty
      },
      metrics: {
        temp_slope_10m: isCritical ? 2.8 : isHigh ? 1.4 : 0.2,
        temp_max_10m: Math.round((charger.temperature + 4.2) * 10) / 10,
        voltage_std_15m: isCritical ? 19.4 : isHigh ? 8.6 : 1.2,
        drops_1h: isCritical ? 5 : isHigh ? 2 : 0,
        error_count_6h: isCritical ? 14 : isHigh ? 4 : 0
      }
    },
    telemetry: {
      voltage: charger.voltage,
      current: charger.current,
      temperature: charger.temperature,
      power_kw: charger.power_kw,
      state: charger.state,
      connector_status: charger.state === 'charging' ? 'connected' : charger.state === 'faulted' ? 'faulted' : 'available',
      energy_delivered_kwh: Math.round(charger.power_kw * 4.2 * 10) / 10,
      soc_percent: charger.state === 'charging' ? 68 : 0,
      error_codes: isCritical ? ['E-704_OVERTEMP_TRIP', 'E-302_VOLT_UNBALANCE'] : isHigh ? ['W-502_PIN_RESISTANCE'] : []
    },
    prediction: {
      ensemble_failure_score: ensembleScore,
      risk_category: charger.risk_level,
      recommended_action: action,
      model_outputs: {
        xgb_failure_probability: xgbProb,
        xgb_days_to_failure: xgbDays,
        anomaly_score: anomalyScore,
        is_anomaly: isCritical || isHigh,
        lstm_failure_probability: lstmProb
      },
      confidence: confidence
    }
  };
}

export function generateTelemetryHistory(charger: ChargerSummary, count: number = 20): TelemetryHistoryPoint[] {
  const points: TelemetryHistoryPoint[] = [];
  const now = Date.now();
  const stepMs = 5000;

  for (let i = count - 1; i >= 0; i--) {
    const t = new Date(now - i * stepMs);
    const timeStr = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    const noise = (Math.sin(i * 0.8) + (Math.random() - 0.5) * 0.5);
    const temp = Math.round((charger.temperature + noise * 1.5) * 10) / 10;
    const volt = Math.round((charger.voltage + noise * 3.0) * 10) / 10;
    const curr = charger.state === 'charging' ? Math.max(0, Math.round((charger.current + noise * 6) * 10) / 10) : 0;
    const pwr = Math.round(((volt * curr) / 1000) * 10) / 10;

    points.push({
      time: timeStr,
      timestamp: t.getTime(),
      temperature: temp,
      voltage: volt,
      current: curr,
      power_kw: pwr,
      safe_temp_limit: 60.0,
      nominal_voltage: 400.0
    });
  }

  return points;
}
