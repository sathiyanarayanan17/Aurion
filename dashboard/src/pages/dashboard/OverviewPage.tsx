import { useFleet } from '../../context/FleetContext';
import { useNavigate } from 'react-router-dom';
import { Activity, Zap, AlertTriangle, Server, ArrowUpRight, ThermometerSun, MapPin, Brain, Shield, Gauge, TrendingUp } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';

export function OverviewPage() {
  const { overview, chargers, alerts, theme } = useFleet();
  const navigate = useNavigate();
  const isDark = theme === 'black' || theme === 'dark';

  const avgHealth = overview?.average_health_score ?? 0;
  const totalPower = chargers.reduce((sum, c) => sum + c.power_kw, 0);
  const activeChargers = chargers.filter(c => c.state === 'charging').length;
  const worstChargers = [...chargers].sort((a, b) => a.health_score - b.health_score).slice(0, 6);

  const riskData = [
    { name: 'Healthy', value: overview?.risk_distribution?.LOW ?? 0, color: '#22c55e' },
    { name: 'Medium', value: overview?.risk_distribution?.MEDIUM ?? 0, color: '#f59e0b' },
    { name: 'High', value: overview?.risk_distribution?.HIGH ?? 0, color: '#f97316' },
    { name: 'Critical', value: overview?.risk_distribution?.CRITICAL ?? 0, color: '#ef4444' },
  ].filter(r => r.value > 0);

  const sparkline = Array.from({ length: 30 }, (_, i) => ({ v: avgHealth - 5 + Math.sin(i * 0.4) * 4 + Math.random() * 2 }));
  const powerTrend = Array.from({ length: 24 }, (_, i) => ({ h: `${i}:00`, kw: 200 + Math.sin(i * 0.3) * 80 + Math.random() * 40 }));
  const tempDistribution = Array.from({ length: 8 }, (_, i) => ({ range: `${25 + i * 5}-${30 + i * 5}`, count: Math.floor(Math.random() * 8) + 1 }));

  const cardBg = isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-black/[0.06] shadow-sm';
  const cardHover = isDark ? 'hover:border-white/[0.12] hover:bg-white/[0.04]' : 'hover:border-black/[0.12] hover:shadow-md';
  const subtleText = isDark ? 'text-slate-500' : 'text-slate-400';
  const labelText = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-5">
      {/* Page Title */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-black tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Fleet Overview
          </h1>
          <p className={`text-sm mt-0.5 ${subtleText}`}>{chargers.length} chargers • {activeChargers} active • {alerts.length} alerts</p>
        </div>
        <div className={`text-[11px] ${subtleText} flex items-center gap-3`}>
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Real-time
          </span>
        </div>
      </div>

      {/* Row 1: Big Health + 4 Small Metrics */}
      <div className="grid grid-cols-12 gap-4">
        {/* Big Health Score */}
        <div className={`col-span-12 lg:col-span-3 row-span-2 p-6 rounded-2xl border ${cardBg} ${cardHover} transition-all flex flex-col justify-between`}>
          <div>
            <div className={`flex items-center gap-2 text-xs font-medium mb-4 ${subtleText}`}>
              <Activity className="w-3.5 h-3.5" />
              FLEET HEALTH INDEX
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-7xl font-black tabular-nums leading-none" style={{ fontFamily: 'var(--font-display)' }}>
                {avgHealth.toFixed(0)}
              </span>
              <span className={`text-xl font-medium ${subtleText}`}>%</span>
            </div>
            <p className={`text-sm font-semibold mt-3 ${avgHealth > 80 ? 'text-emerald-400' : avgHealth > 50 ? 'text-amber-400' : 'text-red-400'}`}>
              {overview?.fleet_health_status ?? 'Calculating...'}
            </p>
          </div>
          <div className="mt-6 h-20">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkline}>
                <Area type="monotone" dataKey="v" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.08} strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Metric: Active */}
        <div className={`col-span-6 lg:col-span-2 p-5 rounded-2xl border ${cardBg} ${cardHover} transition-all`}>
          <Server className="w-4 h-4 text-emerald-400 mb-3" />
          <p className="text-4xl font-bold tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>{activeChargers}</p>
          <p className={`text-[11px] mt-1 ${subtleText}`}>Charging now</p>
          <div className="mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] text-emerald-400 font-medium">+3 vs 1h ago</span>
          </div>
        </div>

        {/* Metric: Power */}
        <div className={`col-span-6 lg:col-span-2 p-5 rounded-2xl border ${cardBg} ${cardHover} transition-all`}>
          <Zap className="w-4 h-4 text-amber-400 mb-3" />
          <p className="text-4xl font-bold tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>{(totalPower / 1000).toFixed(1)}</p>
          <p className={`text-[11px] mt-1 ${subtleText}`}>MW total output</p>
          <div className="mt-2 flex items-center gap-1">
            <Gauge className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] text-amber-400 font-medium">{((totalPower / (chargers.length * 150)) * 100).toFixed(0)}% capacity</span>
          </div>
        </div>

        {/* Metric: Alerts */}
        <div className={`col-span-6 lg:col-span-2 p-5 rounded-2xl border ${cardBg} ${cardHover} transition-all`}>
          <AlertTriangle className="w-4 h-4 text-red-400 mb-3" />
          <p className="text-4xl font-bold tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>{alerts.length}</p>
          <p className={`text-[11px] mt-1 ${subtleText}`}>Active alerts</p>
          <div className="mt-2 flex items-center gap-1">
            <Shield className="w-3 h-3 text-red-400" />
            <span className="text-[10px] text-red-400 font-medium">{overview?.chargers_needing_attention ?? 0} at risk</span>
          </div>
        </div>

        {/* Metric: ML Models */}
        <div className={`col-span-6 lg:col-span-3 p-5 rounded-2xl border ${cardBg} ${cardHover} transition-all`}>
          <Brain className="w-4 h-4 text-violet-400 mb-3" />
          <p className="text-4xl font-bold tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>5</p>
          <p className={`text-[11px] mt-1 ${subtleText}`}>ML models active</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {['XGB', 'LSTM', 'TCN', 'Iso', 'Ens'].map(m => (
              <span key={m} className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${isDark ? 'bg-violet-500/10 text-violet-400' : 'bg-violet-100 text-violet-600'}`}>{m}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Charts + Actions */}
      <div className="grid grid-cols-12 gap-4">
        {/* Power Trend */}
        <div className={`col-span-12 lg:col-span-5 p-5 rounded-2xl border ${cardBg}`}>
          <p className={`text-[11px] font-medium mb-3 ${subtleText}`}>POWER OUTPUT (24H TREND)</p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={powerTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
              <XAxis dataKey="h" stroke={isDark ? '#475569' : '#94a3b8'} fontSize={9} interval={5} />
              <YAxis stroke={isDark ? '#475569' : '#94a3b8'} fontSize={9} />
              <Tooltip contentStyle={{ background: isDark ? '#0f172a' : '#fff', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '8px', fontSize: '11px' }} />
              <Area type="monotone" dataKey="kw" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.06} strokeWidth={1.5} dot={false} name="kW" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Donut + Legend */}
        <div className={`col-span-12 md:col-span-6 lg:col-span-3 p-5 rounded-2xl border ${cardBg}`}>
          <p className={`text-[11px] font-medium mb-3 ${subtleText}`}>RISK DISTRIBUTION</p>
          <div className="flex items-center gap-5">
            <div className="w-[100px] h-[100px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={riskData} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={46} strokeWidth={0}>
                    {riskData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 text-[11px]">
              {riskData.map(r => (
                <div key={r.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: r.color }} />
                  <span className={labelText}>{r.name}</span>
                  <span className="font-bold ml-auto">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Temperature Distribution */}
        <div className={`col-span-12 md:col-span-6 lg:col-span-4 p-5 rounded-2xl border ${cardBg}`}>
          <p className={`text-[11px] font-medium mb-3 ${subtleText}`}>TEMPERATURE DISTRIBUTION (°C)</p>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={tempDistribution}>
              <XAxis dataKey="range" stroke={isDark ? '#475569' : '#94a3b8'} fontSize={9} />
              <YAxis stroke={isDark ? '#475569' : '#94a3b8'} fontSize={9} />
              <Tooltip contentStyle={{ background: isDark ? '#0f172a' : '#fff', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '8px', fontSize: '11px' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Chargers">
                {tempDistribution.map((_, i) => <Cell key={i} fill={i > 5 ? '#ef4444' : i > 3 ? '#f59e0b' : '#22c55e'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Charger List + Alerts + Map */}
      <div className="grid grid-cols-12 gap-4">
        {/* Needs Attention */}
        <div className={`col-span-12 lg:col-span-4 p-5 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between mb-3">
            <p className={`text-[11px] font-medium ${subtleText}`}>⚠ NEEDS ATTENTION</p>
            <button onClick={() => navigate('/dashboard/fleet')} className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5">
              All <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {worstChargers.map(c => (
              <button
                key={c.charger_id}
                onClick={() => navigate(`/dashboard/charger/${c.charger_id}`)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left ${isDark ? 'bg-white/[0.01] border-white/[0.04] hover:border-white/[0.1] hover:bg-white/[0.03]' : 'bg-slate-50 border-slate-100 hover:border-slate-200 hover:bg-slate-100'}`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold ${
                  c.risk_level === 'CRITICAL' ? 'bg-red-500/10 text-red-400' :
                  c.risk_level === 'HIGH' ? 'bg-orange-500/10 text-orange-400' :
                  c.risk_level === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-green-500/10 text-green-400'
                }`}>
                  {c.health_score}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold truncate">{c.charger_id}</p>
                  <p className={`text-[10px] truncate ${subtleText}`}>{(c.location as any)?.city || '—'} • {c.state}</p>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
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

        {/* Latest Alerts */}
        <div className={`col-span-12 lg:col-span-3 p-5 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between mb-3">
            <p className={`text-[11px] font-medium ${subtleText}`}>🔔 RECENT ALERTS</p>
            <button onClick={() => navigate('/dashboard/alerts')} className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5">
              All <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2.5">
            {alerts.slice(0, 5).map((alert, i) => (
              <div key={alert.id || i} className={`flex items-start gap-2.5 p-2 rounded-lg ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}>
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                  alert.severity === 'CRITICAL' ? 'bg-red-400' : alert.severity === 'HIGH' ? 'bg-orange-400' : 'bg-amber-400'
                }`} />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium truncate">{alert.alert_type}</p>
                  <p className={`text-[10px] ${subtleText}`}>{alert.charger_id} • {new Date(alert.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <p className={`text-[11px] py-6 text-center ${subtleText}`}>No active alerts — all clear ✓</p>
            )}
          </div>
        </div>

        {/* Network Map Preview */}
        <div
          onClick={() => navigate('/dashboard/map')}
          className={`col-span-12 lg:col-span-5 h-[280px] rounded-2xl border cursor-pointer transition-all relative overflow-hidden group ${cardBg} ${cardHover}`}
        >
          <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-br from-cyan-950/20 via-transparent to-violet-950/10' : 'bg-gradient-to-br from-cyan-50/50 via-transparent to-violet-50/30'}`} />
          {/* Charger dots */}
          <div className="absolute inset-0 p-8">
            {chargers.map(c => {
              const x = ((c.location as any)?.lng ? ((c.location as any).lng - 68) / 29 * 100 : 50);
              const y = ((c.location as any)?.lat ? (1 - ((c.location as any).lat - 8) / 27) * 100 : 50);
              const color = c.risk_level === 'CRITICAL' ? '#ef4444' : c.risk_level === 'HIGH' ? '#f97316' : c.risk_level === 'MEDIUM' ? '#f59e0b' : '#22c55e';
              return (
                <div
                  key={c.charger_id}
                  className="absolute w-3 h-3 rounded-full transition-transform group-hover:scale-150 duration-500"
                  style={{ left: `${x}%`, top: `${y}%`, backgroundColor: color, boxShadow: `0 0 12px ${color}50` }}
                  title={c.charger_id}
                />
              );
            })}
          </div>
          {/* Labels */}
          <div className="absolute top-5 left-5">
            <p className={`text-[11px] font-medium ${subtleText}`}>NETWORK MAP</p>
            <p className="text-[22px] font-black mt-1" style={{ fontFamily: 'var(--font-display)' }}>{chargers.length} Stations</p>
          </div>
          <div className="absolute bottom-4 right-5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] text-cyan-400 font-medium group-hover:underline">Expand map →</span>
          </div>
          {/* Legend */}
          <div className="absolute bottom-4 left-5 flex items-center gap-3">
            {[{c: '#22c55e', l: 'Low'}, {c: '#f59e0b', l: 'Med'}, {c: '#f97316', l: 'High'}, {c: '#ef4444', l: 'Crit'}].map(item => (
              <div key={item.l} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.c }} />
                <span className={`text-[9px] ${subtleText}`}>{item.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
