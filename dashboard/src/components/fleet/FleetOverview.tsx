import React, { useMemo } from 'react';
import { useFleet } from '../../context/FleetContext';
import { MetricCard } from '../common/MetricCard';
import { ChargerTable } from './ChargerTable';
import {
  Zap,
  ShieldAlert,
  Activity,
  Cpu,
  BarChart3,
  Flame,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid
} from 'recharts';

export const FleetOverview: React.FC = () => {
  const { chargers, overview, openFaultModal, selectCharger } = useFleet();

  const totalChargers = chargers.length;
  const chargingCount = chargers.filter(c => c.state === 'charging').length;
  const idleCount = chargers.filter(c => c.state === 'idle').length;
  const faultedCount = chargers.filter(c => c.state === 'faulted').length;

  const criticalCount = chargers.filter(c => c.risk_level === 'CRITICAL').length;
  const highCount = chargers.filter(c => c.risk_level === 'HIGH').length;
  const mediumCount = chargers.filter(c => c.risk_level === 'MEDIUM').length;
  const lowCount = chargers.filter(c => c.risk_level === 'LOW').length;

  const totalPower = Math.round(chargers.reduce((sum, c) => sum + c.power_kw, 0) * 10) / 10;
  const avgHealth = overview?.average_health_score || Math.round(chargers.reduce((s, c) => s + c.health_score, 0) / (totalChargers || 1));

  // Compute Health Score Distribution (5 brackets)
  const healthDistributionData = useMemo(() => {
    const buckets = [
      { range: '0-20', count: 0, color: '#f43f5e', label: 'Critical' },
      { range: '21-40', count: 0, color: '#f97316', label: 'High Risk' },
      { range: '41-60', count: 0, color: '#f59e0b', label: 'Elevated' },
      { range: '61-80', count: 0, color: '#06b6d4', label: 'Moderate' },
      { range: '81-100', count: 0, color: '#10b981', label: 'Healthy' }
    ];

    chargers.forEach((c) => {
      const s = c.health_score;
      if (s <= 20) buckets[0].count++;
      else if (s <= 40) buckets[1].count++;
      else if (s <= 60) buckets[2].count++;
      else if (s <= 80) buckets[3].count++;
      else buckets[4].count++;
    });

    return buckets;
  }, [chargers]);

  const worstChargers = useMemo(() => {
    return [...chargers].sort((a, b) => a.health_score - b.health_score).slice(0, 4);
  }, [chargers]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">
              Fleet Health Telemetry Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            National EV Charger Infrastructure
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1">
            Continuous real-time predictive failure monitoring across 20 high-power EV charging hubs in India.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openFaultModal()}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-500/25 hover:from-rose-600 hover:to-amber-600 transition-all"
          >
            <Flame className="h-4 w-4" />
            <span>Simulate Fault Anomaly</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Fleet Chargers"
          value={totalChargers}
          subtitle={`${chargingCount} Charging | ${idleCount} Idle | ${faultedCount} Faulted`}
          icon={Cpu}
          iconColor="text-cyan-400"
          iconBg="bg-cyan-500/15 border-cyan-500/30"
          trend={{ value: '100% Online Grid', isPositive: true }}
        />

        <MetricCard
          title="Average Fleet Health"
          value={`${avgHealth} / 100`}
          subtitle={overview?.fleet_health_status || 'Operational'}
          icon={Activity}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/15 border-emerald-500/30"
          trend={{ value: '+1.4% 24h', isPositive: true }}
          highlight={true}
        />

        <MetricCard
          title="Attention Required"
          value={criticalCount + highCount}
          subtitle={`${criticalCount} Critical | ${highCount} High Risk`}
          icon={ShieldAlert}
          iconColor="text-rose-400"
          iconBg="bg-rose-500/15 border-rose-500/30"
          pulse={criticalCount > 0}
          trend={{
            value: `${criticalCount} Critical Action`,
            isPositive: criticalCount === 0
          }}
        />

        <MetricCard
          title="Live Power Delivery"
          value={`${totalPower} kW`}
          subtitle={`${chargingCount} Stations Delivering Energy`}
          icon={Zap}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/15 border-amber-500/30"
          trend={{ value: '4.8 MWh Today', isPositive: true }}
        />
      </div>

      {/* Analytics Visualizations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Score Distribution Chart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-xl shadow-xl lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-cyan-400" />
                <span>Health Score Distribution Histogram</span>
              </h3>
              <p className="text-xs text-slate-400">
                Number of charging stations categorized by health score ranges
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
              N = 20 Stations
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={healthDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis
                  dataKey="range"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#f8fafc'
                  }}
                  formatter={(value: any, _name: any, props: any) => [
                    `${value} Stations (${props.payload.label})`,
                    'Count'
                  ]}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {healthDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Breakdown Panel */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-400" />
                <span>Fleet Risk Breakdown</span>
              </h3>
              <span className="text-xs font-mono font-bold text-slate-300">
                {totalChargers} Nodes
              </span>
            </div>

            <div className="space-y-4">
              {/* Low Risk */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-emerald-400">LOW RISK (HEALTHY)</span>
                  <span className="font-mono text-slate-300">
                    {lowCount} ({Math.round((lowCount / totalChargers) * 100)}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${(lowCount / totalChargers) * 100}%` }}
                  />
                </div>
              </div>

              {/* Medium Risk */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-amber-400">MEDIUM RISK (MONITOR)</span>
                  <span className="font-mono text-slate-300">
                    {mediumCount} ({Math.round((mediumCount / totalChargers) * 100)}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${(mediumCount / totalChargers) * 100}%` }}
                  />
                </div>
              </div>

              {/* High Risk */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-orange-400">HIGH RISK (ATTENTION)</span>
                  <span className="font-mono text-slate-300">
                    {highCount} ({Math.round((highCount / totalChargers) * 100)}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full transition-all"
                    style={{ width: `${(highCount / totalChargers) * 100}%` }}
                  />
                </div>
              </div>

              {/* Critical Risk */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-rose-400">CRITICAL (INTERVENTION)</span>
                  <span className="font-mono text-slate-300">
                    {criticalCount} ({Math.round((criticalCount / totalChargers) * 100)}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all shadow-[0_0_10px_rgba(244,63,94,0.6)]"
                    style={{ width: `${(criticalCount / totalChargers) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">Predictive Anomaly Status:</span>
            <span
              className={`text-xs font-bold font-mono px-2 py-0.5 rounded border ${
                criticalCount > 0
                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/40'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
              }`}
            >
              {criticalCount > 0 ? 'ANOMALIES ACTIVE' : 'NOMINAL GRID'}
            </span>
          </div>
        </div>
      </div>

      {/* Priority Action Queue */}
      {worstChargers.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400" />
              <span>Priority Action Queue (Lowest Health Scores)</span>
            </h3>
            <span className="text-xs text-slate-400">Click station card to drill down</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {worstChargers.map((c) => (
              <div
                key={c.charger_id}
                onClick={() => selectCharger(c.charger_id)}
                className="cursor-pointer rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 hover:border-cyan-500/50 hover:bg-slate-900 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-xs text-slate-100 group-hover:text-cyan-400 transition-colors">
                    {c.charger_id}
                  </span>
                  <span
                    className={`text-xs font-mono font-extrabold px-2 py-0.5 rounded ${
                      c.health_score < 30
                        ? 'bg-rose-500/20 text-rose-400'
                        : c.health_score < 60
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {c.health_score}/100
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-semibold">{c.location.city}</p>
                <p className="text-[11px] text-slate-400 truncate mb-2">{c.profile}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5">
                  <span>Temp: {c.temperature}&deg;C</span>
                  <span className="uppercase text-cyan-400 font-bold">{c.state}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Master Charger Table */}
      <ChargerTable chargers={chargers} />
    </div>
  );
};
