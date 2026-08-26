import React from 'react';
import type { MLPrediction, HealthComponents, HealthMetrics } from '../../types';
import {
  BrainCircuit,
  Gauge,
  Sliders,
  Sparkles
} from 'lucide-react';

interface PredictionPanelProps {
  prediction: MLPrediction;
  components: HealthComponents;
  metrics: HealthMetrics;
}

export const PredictionPanel: React.FC<PredictionPanelProps> = ({
  prediction,
  components,
  metrics
}) => {
  const {
    ensemble_failure_score,
    risk_category,
    recommended_action,
    model_outputs,
    confidence
  } = prediction;

  const getScoreColor = (score: number) => {
    if (score < 0.3) {
      return {
        text: 'text-emerald-400',
        bg: 'bg-emerald-500/15 border-emerald-500/30',
        bar: 'bg-emerald-500',
        glow: 'shadow-[0_0_12px_rgba(16,185,129,0.35)]'
      };
    }
    if (score <= 0.6) {
      return {
        text: 'text-amber-400',
        bg: 'bg-amber-500/15 border-amber-500/30',
        bar: 'bg-amber-400',
        glow: 'shadow-[0_0_12px_rgba(245,158,11,0.35)]'
      };
    }
    return {
      text: 'text-rose-400',
      bg: 'bg-rose-500/15 border-rose-500/30',
      bar: 'bg-rose-500',
      glow: 'shadow-[0_0_15px_rgba(244,63,94,0.45)]'
    };
  };

  const ensembleStyle = getScoreColor(ensemble_failure_score);
  const xgbStyle = getScoreColor(model_outputs.xgb_failure_probability);
  const anomalyStyle = getScoreColor(model_outputs.anomaly_score);
  const lstmStyle = getScoreColor(model_outputs.lstm_failure_probability);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-xl shadow-xl space-y-6">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>ML Predictive Maintenance Diagnostics</span>
              <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-400 border border-cyan-500/30">
                Confidence {(confidence * 100).toFixed(0)}%
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Multi-model ensemble combining XGBoost degradation curves, LSTM temporal sequence, and Isolation Forest
            </p>
          </div>
        </div>

        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${ensembleStyle.bg}`}>
          <span className="text-xs font-semibold text-slate-300">Ensemble Risk:</span>
          <span className={`text-xs font-bold font-mono uppercase ${ensembleStyle.text}`}>
            {risk_category}
          </span>
        </div>
      </div>

      {/* Ensemble Score & Individual Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Primary Ensemble Card */}
        <div className={`rounded-xl border p-4 flex flex-col justify-between ${ensembleStyle.bg} ${ensembleStyle.glow}`}>
          <div>
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
              <span className="font-semibold uppercase tracking-wider">Ensemble Failure Score</span>
              <Gauge className="h-4 w-4 text-slate-400" />
            </div>
            <div className="text-3xl font-black font-mono tracking-tight text-white my-1">
              {ensemble_failure_score.toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-300 font-medium">
              Scale 0.00 (Healthy) to 1.00 (Imminent Failure)
            </p>
          </div>
          <div className="mt-3">
            <div className="h-2 rounded-full bg-slate-950/60 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${ensembleStyle.bar}`}
                style={{ width: `${ensemble_failure_score * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* XGBoost Model */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-mono font-semibold">XGBoost Classifier</span>
              <span className={`text-xs font-bold font-mono ${xgbStyle.text}`}>
                {(model_outputs.xgb_failure_probability * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-xl font-bold font-mono text-slate-100">
                {model_outputs.xgb_days_to_failure.toFixed(1)}
              </span>
              <span className="text-xs text-slate-400 font-medium">days to failure</span>
            </div>
            <p className="text-[10px] text-slate-400">Gradient boosted trees over historical cycles</p>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full ${xgbStyle.bar}`}
              style={{ width: `${model_outputs.xgb_failure_probability * 100}%` }}
            />
          </div>
        </div>

        {/* Isolation Forest Anomaly */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-mono font-semibold">Anomaly Detector</span>
              <span className={`text-xs font-bold font-mono ${anomalyStyle.text}`}>
                {model_outputs.is_anomaly ? 'ANOMALOUS' : 'NORMAL'}
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-slate-100 my-1">
              {model_outputs.anomaly_score.toFixed(2)}
            </div>
            <p className="text-[10px] text-slate-400">Unsupervised isolation score of telemetry state</p>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full ${anomalyStyle.bar}`}
              style={{ width: `${model_outputs.anomaly_score * 100}%` }}
            />
          </div>
        </div>

        {/* LSTM Temporal Sequence */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-mono font-semibold">LSTM RNN Sequence</span>
              <span className={`text-xs font-bold font-mono ${lstmStyle.text}`}>
                {(model_outputs.lstm_failure_probability * 100).toFixed(0)}%
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-slate-100 my-1">
              {model_outputs.lstm_failure_probability.toFixed(2)}
            </div>
            <p className="text-[10px] text-slate-400">Recurrent neural net on 6h telemetry sequence</p>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full ${lstmStyle.bar}`}
              style={{ width: `${model_outputs.lstm_failure_probability * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* AI Recommended Action Callout */}
      <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
              AI Prescriptive Maintenance Recommendation
            </h4>
            <p className="text-sm font-medium text-slate-200 mt-1 leading-relaxed">
              {recommended_action}
            </p>
          </div>
        </div>
      </div>

      {/* Component Penalty Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Sliders className="h-3.5 w-3.5 text-cyan-400" />
            <span>Health Component Penalty Drivers (Deductions from 100)</span>
          </h4>
          <span className="text-xs text-slate-400 font-mono">
            Total Penalty: {Object.values(components).reduce((a, b) => a + b, 0)} pts
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Temperature</span>
              <span className="font-mono font-bold text-rose-400">-{components.temperature_penalty}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden mb-2">
              <div
                className="h-full bg-rose-500 rounded-full"
                style={{ width: `${Math.min(100, components.temperature_penalty * 2.5)}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Slope: +{metrics.temp_slope_10m}&deg;C/m
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Voltage Stability</span>
              <span className="font-mono font-bold text-amber-400">-{components.voltage_penalty}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden mb-2">
              <div
                className="h-full bg-amber-400 rounded-full"
                style={{ width: `${Math.min(100, components.voltage_penalty * 2.5)}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Std 15m: {metrics.voltage_std_15m}V
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Session Drops</span>
              <span className="font-mono font-bold text-orange-400">-{components.session_failure_penalty}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden mb-2">
              <div
                className="h-full bg-orange-500 rounded-full"
                style={{ width: `${Math.min(100, components.session_failure_penalty * 4)}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Drops 1h: {metrics.drops_1h}
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Connector Wear</span>
              <span className="font-mono font-bold text-cyan-400">-{components.connection_penalty}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden mb-2">
              <div
                className="h-full bg-cyan-400 rounded-full"
                style={{ width: `${Math.min(100, components.connection_penalty * 5)}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Contact Pins Normal
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Error Logs</span>
              <span className="font-mono font-bold text-purple-400">-{components.error_penalty}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden mb-2">
              <div
                className="h-full bg-purple-400 rounded-full"
                style={{ width: `${Math.min(100, components.error_penalty * 5)}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Errors 6h: {metrics.error_count_6h}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
