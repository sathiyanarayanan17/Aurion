import React from 'react';
import { useFleet } from '../../context/FleetContext';
import { MetricCard } from '../common/MetricCard';
import { RiskBadge } from '../common/RiskBadge';
import { HealthGauge } from '../common/HealthGauge';
import { PredictionPanel } from './PredictionPanel';
import { TelemetryCharts } from './TelemetryCharts';
import {
  ArrowLeft,
  Flame,
  Zap,
  Thermometer,
  Gauge,
  Clock,
  Calendar,
  AlertTriangle,
  MapPin,
  RotateCcw
} from 'lucide-react';

export const ChargerDetail: React.FC = () => {
  const {
    selectedChargerId,
    selectedChargerDetail,
    telemetryHistory,
    clearSelectedCharger,
    openFaultModal,
    injectFault
  } = useFleet();

  if (!selectedChargerDetail || !selectedChargerId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-6">
        <p className="text-sm text-slate-400">No charger selected.</p>
        <button
          onClick={clearSelectedCharger}
          className="mt-3 flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-600"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Map View</span>
        </button>
      </div>
    );
  }

  const { health, telemetry, prediction, profile, location, days_since_maintenance } = selectedChargerDetail;
  const isCritical = health.risk_level === 'CRITICAL';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Navigation & Station Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-4">
          <button
            onClick={clearSelectedCharger}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all shadow-sm"
            title="Back to Overview"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                {selectedChargerId}
              </h1>
              <RiskBadge level={health.risk_level} size="md" withPulse={isCritical} />
              <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-bold uppercase font-mono tracking-wider text-cyan-400 border border-slate-700">
                {telemetry.state}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1.5">
              <span className="flex items-center gap-1 font-semibold text-slate-300">
                <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                {location?.city} ({location?.address})
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-cyan-400 font-mono font-medium">{profile}</span>
              <span className="text-slate-600">|</span>
              <span className="flex items-center gap-1 font-mono">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Maintained {days_since_maintenance}d ago
              </span>
            </div>
          </div>
        </div>

        {/* Health Gauge & Actions */}
        <div className="flex items-center gap-4">
          <HealthGauge score={health.health_score} size={84} strokeWidth={8} />

          <div className="flex flex-col gap-2">
            <button
              onClick={() => openFaultModal(selectedChargerId)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-500/20 hover:from-rose-600 hover:to-amber-600 transition-all"
            >
              <Flame className="h-3.5 w-3.5" />
              <span>Simulate Fault</span>
            </button>
            {isCritical && (
              <button
                onClick={() => injectFault(selectedChargerId, 'normal_recovery')}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/25 transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Service & Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Module Temperature"
          value={`${telemetry.temperature}°C`}
          subtitle={`Max 10m: ${health.metrics.temp_max_10m}°C | Slope: +${health.metrics.temp_slope_10m}°C/m`}
          icon={Thermometer}
          iconColor={telemetry.temperature > 60 ? 'text-rose-400' : 'text-slate-300'}
          iconBg={telemetry.temperature > 60 ? 'bg-rose-500/15 border-rose-500/30' : 'bg-slate-800/80 border-slate-700'}
          pulse={telemetry.temperature > 60}
          trend={{
            value: telemetry.temperature > 60 ? 'Thermal Warning' : 'Safe Operating Zone',
            isPositive: telemetry.temperature <= 60
          }}
        />

        <MetricCard
          title="DC Bus Voltage"
          value={`${telemetry.voltage} V`}
          subtitle={`Std Dev 15m: ${health.metrics.voltage_std_15m}V | Grid: 400V Nominal`}
          icon={Gauge}
          iconColor="text-purple-400"
          iconBg="bg-purple-500/15 border-purple-500/30"
          trend={{
            value: health.metrics.voltage_std_15m > 10 ? 'High Variance' : 'Stable Waveform',
            isPositive: health.metrics.voltage_std_15m <= 10
          }}
        />

        <MetricCard
          title="Instantaneous Power"
          value={`${telemetry.power_kw} kW`}
          subtitle={`Current: ${telemetry.current}A | Energy: ${telemetry.energy_delivered_kwh} kWh`}
          icon={Zap}
          iconColor="text-cyan-400"
          iconBg="bg-cyan-500/15 border-cyan-500/30"
          trend={{
            value: telemetry.state === 'charging' ? `Active SoC ${telemetry.soc_percent}%` : 'Idle Standby',
            isPositive: true
          }}
        />

        <MetricCard
          title="Predicted Days to Failure"
          value={`${prediction.model_outputs.xgb_days_to_failure.toFixed(1)} Days`}
          subtitle={`XGBoost Model (Confidence ${(prediction.confidence * 100).toFixed(0)}%)`}
          icon={Clock}
          iconColor={prediction.model_outputs.xgb_days_to_failure < 14 ? 'text-rose-400' : 'text-emerald-400'}
          iconBg={prediction.model_outputs.xgb_days_to_failure < 14 ? 'bg-rose-500/15 border-rose-500/30' : 'bg-emerald-500/15 border-emerald-500/30'}
          pulse={prediction.model_outputs.xgb_days_to_failure < 7}
          trend={{
            value: prediction.model_outputs.xgb_days_to_failure < 14 ? 'Urgent Maintenance' : 'Optimal Lifespan',
            isPositive: prediction.model_outputs.xgb_days_to_failure >= 14
          }}
        />
      </div>

      {/* Active Fault Codes Banner */}
      {telemetry.error_codes.length > 0 && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400 mb-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Active Diagnostics Error Codes Logged</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {telemetry.error_codes.map((code) => (
              <span
                key={code}
                className="rounded-lg bg-rose-500/20 border border-rose-500/40 px-3 py-1 font-mono text-xs font-bold text-rose-300"
              >
                {code}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ML Prediction & Diagnostic Panel */}
      <PredictionPanel
        prediction={prediction}
        components={health.components}
        metrics={health.metrics}
      />

      {/* Real-time Telemetry Charts */}
      <TelemetryCharts history={telemetryHistory} />
    </div>
  );
};
