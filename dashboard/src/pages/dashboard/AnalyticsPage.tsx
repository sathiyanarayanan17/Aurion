import { useFleet } from '../../context/FleetContext';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, Area, AreaChart } from 'recharts';
import { Brain, TrendingUp, Clock, Target } from 'lucide-react';

export function AnalyticsPage() {
  const { chargers, alerts } = useFleet();

  // Generate mock trend data
  const healthTrend = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    avg_health: 75 + Math.sin(i * 0.3) * 8 + Math.random() * 4,
    alerts: Math.floor(Math.random() * 3),
  }));

  const modelPerformance = [
    { model: 'XGBoost', accuracy: 92, precision: 89, recall: 94 },
    { model: 'LSTM', accuracy: 88, precision: 85, recall: 91 },
    { model: 'TCN', accuracy: 87, precision: 86, recall: 88 },
    { model: 'IsoForest', accuracy: 84, precision: 82, recall: 86 },
    { model: 'Ensemble', accuracy: 95, precision: 93, recall: 96 },
  ];

  const maintenanceSavings = [
    { month: 'Mar', reactive: 45000, proactive: 12000 },
    { month: 'Apr', reactive: 52000, proactive: 15000 },
    { month: 'May', reactive: 38000, proactive: 10000 },
    { month: 'Jun', reactive: 61000, proactive: 18000 },
    { month: 'Jul', reactive: 48000, proactive: 11000 },
    { month: 'Aug', reactive: 55000, proactive: 14000 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Analytics & Insights</h1>
        <p className="text-slate-400 text-sm mt-1">ML model performance and fleet health trends</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/50">
          <Brain className="w-5 h-5 text-violet-400 mb-3" />
          <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>95%</p>
          <p className="text-xs text-slate-500 mt-1">Ensemble Accuracy</p>
        </div>
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/50">
          <Target className="w-5 h-5 text-cyan-400 mb-3" />
          <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>3.2 days</p>
          <p className="text-xs text-slate-500 mt-1">Avg Prediction Lead</p>
        </div>
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/50">
          <TrendingUp className="w-5 h-5 text-green-400 mb-3" />
          <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>₹2.4L</p>
          <p className="text-xs text-slate-500 mt-1">Monthly Savings</p>
        </div>
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/50">
          <Clock className="w-5 h-5 text-amber-400 mb-3" />
          <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>97.4%</p>
          <p className="text-xs text-slate-500 mt-1">Network Uptime</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health Trend */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950/50">
          <h3 className="text-sm font-semibold text-slate-300 mb-4" style={{ fontFamily: 'var(--font-display)' }}>Fleet Health (24h)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={healthTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" stroke="#475569" fontSize={10} />
              <YAxis stroke="#475569" fontSize={10} domain={[60, 100]} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="avg_health" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Model Performance */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950/50">
          <h3 className="text-sm font-semibold text-slate-300 mb-4" style={{ fontFamily: 'var(--font-display)' }}>Model Performance (%)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={modelPerformance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" stroke="#475569" fontSize={10} domain={[70, 100]} />
              <YAxis type="category" dataKey="model" stroke="#475569" fontSize={11} width={70} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} />
              <Bar dataKey="accuracy" fill="#06b6d4" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Maintenance Savings */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950/50 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-300 mb-4" style={{ fontFamily: 'var(--font-display)' }}>Maintenance Cost: Reactive vs Proactive (₹)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={maintenanceSavings}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#475569" fontSize={11} />
              <YAxis stroke="#475569" fontSize={10} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} />
              <Bar dataKey="reactive" fill="#ef4444" radius={[4, 4, 0, 0]} name="Reactive (without Aurion)" />
              <Bar dataKey="proactive" fill="#22c55e" radius={[4, 4, 0, 0]} name="Proactive (with Aurion)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
