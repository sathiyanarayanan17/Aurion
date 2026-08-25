import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { ArrowLeft, Thermometer, Zap, Activity, AlertTriangle, Clock } from 'lucide-react'

interface ChargerDetailProps {
  chargerId: string
  onClose: () => void
}

interface ChargerInfo {
  charger_id: string
  health: any
  telemetry: any
  prediction: any
}

export function ChargerDetail({ chargerId, onClose }: ChargerDetailProps) {
  const [chargerInfo, setChargerInfo] = useState<ChargerInfo | null>(null)
  const [telemetryHistory, setTelemetryHistory] = useState<any[]>([])

  useEffect(() => {
    fetchChargerDetail()
    const interval = setInterval(fetchChargerDetail, 5000)
    return () => clearInterval(interval)
  }, [chargerId])

  async function fetchChargerDetail() {
    try {
      const res = await fetch(`/api/chargers/${chargerId}`)
      const data = await res.json()
      setChargerInfo(data)

      // Add to telemetry history for graphs
      if (data.telemetry) {
        setTelemetryHistory(prev => {
          const updated = [...prev, {
            time: new Date().toLocaleTimeString(),
            temperature: data.telemetry.temperature,
            voltage: data.telemetry.voltage,
            current: data.telemetry.current,
            power_kw: data.telemetry.power_kw,
          }]
          return updated.slice(-60) // Keep last 60 points
        })
      }
    } catch (e) {
      console.error('Failed to fetch charger detail:', e)
    }
  }

  if (!chargerInfo) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full" />
      </div>
    )
  }

  const { health, telemetry, prediction } = chargerInfo
  const healthScore = health?.health_score ?? 100
  const riskLevel = health?.risk_level ?? 'LOW'

  const riskColors: Record<string, string> = {
    LOW: 'text-green-400 bg-green-900/30',
    MEDIUM: 'text-amber-400 bg-amber-900/30',
    HIGH: 'text-orange-400 bg-orange-900/30',
    CRITICAL: 'text-red-400 bg-red-900/30',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold">{chargerId}</h2>
          <p className="text-slate-400 text-sm">
            {telemetry?.profile} • {telemetry?.state}
          </p>
        </div>
        <span className={`ml-auto px-4 py-2 rounded-lg font-bold text-lg ${riskColors[riskLevel]}`}>
          {healthScore}% Health
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Thermometer className="w-5 h-5 text-red-400" />}
          label="Temperature"
          value={`${telemetry?.temperature?.toFixed(1) ?? '--'}°C`}
          sublabel={health?.components?.temperature_penalty > 5 ? 'Above normal' : 'Normal'}
          alert={health?.components?.temperature_penalty > 10}
        />
        <StatCard
          icon={<Zap className="w-5 h-5 text-yellow-400" />}
          label="Voltage"
          value={`${telemetry?.voltage?.toFixed(1) ?? '--'} V`}
          sublabel={`Std: ${health?.metrics?.voltage_std_15m?.toFixed(1) ?? '--'}`}
          alert={health?.components?.voltage_penalty > 10}
        />
        <StatCard
          icon={<Activity className="w-5 h-5 text-cyan-400" />}
          label="Power Output"
          value={`${telemetry?.power_kw?.toFixed(1) ?? '--'} kW`}
          sublabel={telemetry?.state === 'charging' ? 'Active session' : 'Idle'}
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-purple-400" />}
          label="Days to Failure"
          value={prediction?.model_outputs?.xgb_days_to_failure?.toFixed(0) ?? '--'}
          sublabel={`Confidence: ${prediction?.confidence ?? 'N/A'}`}
          alert={prediction?.model_outputs?.xgb_days_to_failure < 7}
        />
      </div>

      {/* Prediction Panel */}
      {prediction && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Prediction Analysis
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <PredictionMetric
              label="Ensemble Score"
              value={prediction.ensemble_failure_score}
              format="percent"
            />
            <PredictionMetric
              label="XGBoost Prob"
              value={prediction.model_outputs?.xgb_failure_probability}
              format="percent"
            />
            <PredictionMetric
              label="Anomaly Score"
              value={prediction.model_outputs?.anomaly_score}
              format="percent"
            />
            <PredictionMetric
              label="LSTM Prob"
              value={prediction.model_outputs?.lstm_failure_probability}
              format="percent"
            />
          </div>
          <p className="mt-4 text-sm text-slate-300">
            <strong>Recommended:</strong> {prediction.recommended_action}
          </p>
        </div>
      )}

      {/* Telemetry Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title="Temperature (°C)" color="#ef4444">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={telemetryHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
              <Area type="monotone" dataKey="temperature" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Voltage (V)" color="#eab308">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={telemetryHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
              <Line type="monotone" dataKey="voltage" stroke="#eab308" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Current (A)" color="#06b6d4">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={telemetryHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
              <Area type="monotone" dataKey="current" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Power (kW)" color="#8b5cf6">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={telemetryHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
              <Area type="monotone" dataKey="power_kw" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, sublabel, alert }: any) {
  return (
    <div className={`bg-slate-800 rounded-xl p-4 border ${alert ? 'border-red-500/50' : 'border-slate-700'}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-slate-400 text-sm">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{sublabel}</p>
    </div>
  )
}

function PredictionMetric({ label, value, format }: any) {
  const displayValue = value != null
    ? format === 'percent' ? `${(value * 100).toFixed(1)}%` : value.toFixed(2)
    : 'N/A'

  const color = value != null && value > 0.6 ? 'text-red-400' : value > 0.3 ? 'text-amber-400' : 'text-green-400'

  return (
    <div className="text-center">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{displayValue}</p>
    </div>
  )
}

function ChartCard({ title, color, children }: any) {
  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <h4 className="text-sm font-medium text-slate-300 mb-3" style={{ color }}>
        {title}
      </h4>
      {children}
    </div>
  )
}
