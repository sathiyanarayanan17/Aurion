export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ChargerState = 'idle' | 'charging' | 'faulted' | 'offline';
export type ConnectorStatus = 'connected' | 'available' | 'faulted' | 'disconnected';
export type ThemeMode = 'black' | 'dark' | 'light';

export interface LocationCoordinates {
  lat: number;
  lng: number;
  city?: string;
  address?: string;
}

export interface ChargerSummary {
  charger_id: string;
  health_score: number; // 0-100
  risk_level: RiskLevel;
  state: ChargerState;
  temperature: number;
  voltage: number;
  current: number;
  power_kw: number;
  location: LocationCoordinates;
  profile: string;
  days_since_maintenance: number;
}

export interface FleetOverviewData {
  total_chargers: number;
  average_health_score: number;
  risk_distribution: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
  chargers_needing_attention: number;
  fleet_health_status: string;
  total_alerts: number;
  total_power_kw?: number;
  uptime_percentage?: number;
}

export interface HealthComponents {
  temperature_penalty: number;
  voltage_penalty: number;
  session_failure_penalty: number;
  connection_penalty: number;
  error_penalty: number;
}

export interface HealthMetrics {
  temp_slope_10m: number;
  temp_max_10m: number;
  voltage_std_15m: number;
  drops_1h: number;
  error_count_6h: number;
}

export interface ChargerHealth {
  health_score: number;
  risk_level: RiskLevel;
  components: HealthComponents;
  metrics: HealthMetrics;
}

export interface TelemetryData {
  voltage: number;
  current: number;
  temperature: number;
  power_kw: number;
  state: ChargerState;
  connector_status: ConnectorStatus;
  energy_delivered_kwh: number;
  soc_percent: number;
  error_codes: string[];
  timestamp?: string;
}

export interface ModelOutputs {
  xgb_failure_probability: number;
  xgb_days_to_failure: number;
  anomaly_score: number;
  is_anomaly: boolean;
  lstm_failure_probability: number;
}

export interface MLPrediction {
  ensemble_failure_score: number;
  risk_category: RiskLevel;
  recommended_action: string;
  model_outputs: ModelOutputs;
  confidence: number;
}

export interface ChargerDetailData {
  charger_id: string;
  health: ChargerHealth;
  telemetry: TelemetryData;
  prediction: MLPrediction;
  profile?: string;
  location?: LocationCoordinates;
  days_since_maintenance?: number;
}

export interface AlertItem {
  id: string;
  charger_id: string;
  timestamp: string;
  alert_type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  health_score: number;
  details: string;
  penalties?: Partial<HealthComponents>;
}

export interface MapMarkerData {
  charger_id: string;
  lat: number;
  lng: number;
  health_score: number;
  risk_level: RiskLevel;
  state: ChargerState;
  power_kw: number;
  profile: string;
  city?: string;
}

export interface TelemetryHistoryPoint {
  time: string;
  timestamp: number;
  temperature: number;
  voltage: number;
  current: number;
  power_kw: number;
  safe_temp_limit: number;
  nominal_voltage: number;
}

export type FaultType = 
  | 'thermal_runaway'
  | 'voltage_sag'
  | 'connector_overheat'
  | 'isolation_fault'
  | 'communication_drop'
  | 'normal_recovery';

export interface FaultInjectionResponse {
  status: string;
  charger_id: string;
  fault_type: string;
  message?: string;
}
