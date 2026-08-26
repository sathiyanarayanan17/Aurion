import { useFleet } from '../../context/FleetContext';
import { useNavigate } from 'react-router-dom';
import { Activity, Zap, AlertTriangle, Server, ArrowUpRight, ThermometerSun, MapPin } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function OverviewPage() {
  const { overview, chargers, alerts } = useFleet();
  const navigate = useNavigate();

  const avgHealth = overview?.average_health_score ?? 0;
  const totalPower = chargers.reduce((sum, c) => sum + c.power_kw, 0);
  const activeChargers = chargers.filter(c => c.state === 'charging').length;
  const criticalChargers = chargers.filter(c => c.risk_level === 'CRITICAL');
  const highChargers = chargers.filter(c => c.risk_level === 'HIGH');
  const worstChargers = [...chargers].sort((a, b) => a.health_score - b.health_score).slice(0, 6);

  const riskData = [
    { name: 'LOW', value: overview?.risk_distribution?.LOW ?? 0, color: '#22c55e' },
    { name: 'MEDIUM', value: overview?.risk_distribution?.MEDIUM ?? 0, color: '#f59e0b' },
    { name: 'HIGH', value: overview?.risk_distribution?.HIGH ?? 0, color: '#f97316' },
    { name: 'CRITICAL', value: overview?.risk_distribution?.CRITICAL ?? 0, color: '#ef4444' },
  ].filter(r => r.value > 0);

  // Sparkline data
  const sparkline = Array.from({ length: 20 }, (_, i) => ({ v: avgHealth - 5 + Math.sin(i * 0.5) * 4 + Math.random() * 2 }));

  return (
    <div className="space-y-5">
      {/* Page Title Row */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[26px] font-black tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Fleet Overview
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{chargers.length} chargers across {new Set(chargers.map(c => (c.location as any)?.city)).size || 20} cities</p>
        </div>
        <div className="text-[11px] text-slate-600">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Bento Grid — Asymmetric Layout */}
      <div className="grid grid-cols-12 gap-4 auto-rows-[minmax(0,1fr)]">

        {/* Big Health Card — Spans 4 cols, 2 rows */}
        <div className="col-span-12 md:col-span-4 row-span-2 p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-4">
              <Activity className="w-3.5 h-3.5" />
              FLEET HEALTH
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>
                {avgHealth.toFixed(0)}
              </span>
              <span className="text-2xl text-slate-500 font-medium">/ 100</span>
            </div>
            <p className={`text-sm font-medium mt-2 ${avgHealth > 80 ? 'text-emerald-400' : avgHealth > 50 ? 'text-amber-400' : 'text-red-400'}`}>
              {overview?.fleet_health_status ?? 'Calculating...'}
            </p>
          </div>
          {/* Sparkline */}
          <div className="mt-4 h-16">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkline}>
                <Area type="monotone" dataKey="v" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.08} strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active Chargers */}
        <div className="col-span-6 md:col-span-2 p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <Server className="w-4 h-4 text-emerald-400 mb-3" />
          <p className="text-3xl font-bold tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>{activeChargers}</p>
          <p className="text-[11px] text-slate-500 mt-1">Charging now</p>
        </div>

        {/* Total Power */}
        <div className="col-span-6 md:col-span-2 p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <Zap className="w-4 h-4 text-amber-400 mb-3" />
          <p className="text-3xl font-bold tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>{(totalPower / 1000).toFixed(1)}</p>
          <p className="text-[11px] text-slate-500 mt-1">MW output</p>
        </div>

        {/* Alerts */}
        <div className="col-span-6 md:col-span-2 p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <AlertTriangle className="w-4 h-4 text-red-400 mb-3" />
          <p className="text-3xl font-bold tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>{alerts.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Active alerts</p>
        </div>

        {/* Uptime */}
        <div className="col-span-6 md:col-span-2 p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <ThermometerSun className="w-4 h-4 text-violet-400 mb-3" />
          <p className="text-3xl font-bold tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>97.4</p>
          <p className="text-[11px] text-slate-500 mt-1">% Uptime</p>
        </div>

        {/* Risk Donut — Compact */}
        <div className="col-span-12 md:col-span-3 p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <p className="text-[11px] text-slate-500 font-medium mb-3">RISK DISTRIBUTION</p>
          <div className="flex items-center gap-4">
            <div className="w-[90px] h-[90px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={riskData} dataKey="value" cx="50%" cy="50%" innerRadius={28} outerRadius={42} strokeWidth={0}>
                    {riskData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 text-[11px]">
              {riskData.map(r => (
                <div key={r.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: r.color }} />
                  <span className="text-slate-400">{r.name}</span>
                  <span className="font-bold text-white ml-auto">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Critical/High Chargers — Quick Action List */}
        <div className="col-span-12 md:col-span-5 p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] text-slate-500 font-medium">NEEDS ATTENTION</p>
            <button onClick={() => navigate('/dashboard/fleet')} className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5">
              All <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {worstChargers.slice(0, 4).map(c => (
              <button
                key={c.charger_id}
                onClick={() => navigate(`/dashboard/charger/${c.charger_id}`)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.1] hover:bg-white/[0.04] transition-all text-left"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold ${
                  c.risk_level === 'CRITICAL' ? 'bg-red-500/10 text-red-400' :
                  c.risk_level === 'HIGH' ? 'bg-orange-500/10 text-orange-400' :
                  c.risk_level === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-green-500/10 text-green-400'
                }`}>
                  {c.health_score}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-slate-200 truncate">{c.charger_id}</p>
                  <p className="text-[10px] text-slate-500 truncate">{(c.location as any)?.city || 'Unknown'} • {c.profile}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  c.risk_level === 'CRITICAL' ? 'bg-red-500/10 text-red-400' :
                  c.risk_level === 'HIGH' ? 'bg-orange-500/10 text-orange-400' :
                  'bg-amber-500/10 text-amber-400'
                }`}>
                  {c.risk_level}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Alerts — Compact */}
        <div className="col-span-12 md:col-span-4 p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] text-slate-500 font-medium">LATEST ALERTS</p>
            <button onClick={() => navigate('/dashboard/alerts')} className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5">
              All <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {alerts.slice(0, 4).map((alert, i) => (
              <div key={alert.id || i} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white/[0.02]">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                  alert.severity === 'CRITICAL' ? 'bg-red-400' : alert.severity === 'HIGH' ? 'bg-orange-400' : 'bg-amber-400'
                }`} />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-slate-300 truncate">{alert.alert_type}</p>
                  <p className="text-[10px] text-slate-600">{alert.charger_id} • {new Date(alert.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <p className="text-[11px] text-slate-600 py-4 text-center">No active alerts</p>
            )}
          </div>
        </div>

        {/* Quick Map Preview */}
        <div
          onClick={() => navigate('/dashboard/map')}
          className="col-span-12 md:col-span-8 h-[200px] rounded-2xl border border-white/[0.06] bg-white/[0.02] cursor-pointer hover:border-white/[0.1] transition-colors relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/20 via-transparent to-violet-950/10" />
          {/* Scatter plot of charger locations as dots */}
          <div className="absolute inset-0 p-6">
            {chargers.map(c => {
              // Normalize lat/lng to position within box (India roughly 8-35N, 68-97E)
              const x = ((c.location as any)?.lng ? ((c.location as any).lng - 68) / 29 * 100 : 50);
              const y = ((c.location as any)?.lat ? (1 - ((c.location as any).lat - 8) / 27) * 100 : 50);
              const color = c.risk_level === 'CRITICAL' ? '#ef4444' : c.risk_level === 'HIGH' ? '#f97316' : c.risk_level === 'MEDIUM' ? '#f59e0b' : '#22c55e';
              return (
                <div
                  key={c.charger_id}
                  className="absolute w-2.5 h-2.5 rounded-full transition-transform group-hover:scale-125"
                  style={{ left: `${x}%`, top: `${y}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}40` }}
                />
              );
            })}
          </div>
          {/* Label */}
          <div className="absolute bottom-4 left-5 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[11px] text-slate-500 font-medium">Network map — click to expand</span>
          </div>
          <div className="absolute top-4 right-4 text-[10px] text-slate-600">
            {chargers.length} stations
          </div>
        </div>
      </div>
    </div>
  );
}
