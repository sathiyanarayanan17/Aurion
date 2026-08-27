import { useMemo } from 'react';
import { useFleet } from '../../context/FleetContext';
import { Shield, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';

const SLA_TARGET = 99.5;
const HOURS_IN_MONTH = 30 * 24; // 720 hours

// Generate mock daily uptime data for last 30 days
function generateDailyUptime(): { day: string; uptime: number }[] {
  const data: { day: string; uptime: number }[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    // Hover around 97-99.5%
    const uptime = 97 + Math.random() * 2.5;
    data.push({ day: dayStr, uptime: Math.round(uptime * 100) / 100 });
  }
  return data;
}

export function SLAPage() {
  const { theme, chargers } = useFleet();
  const isDark = theme === 'black' || theme === 'dark';

  const dailyUptimeData = useMemo(() => generateDailyUptime(), []);

  // Calculate per-charger SLA data
  const chargerSlaData = useMemo(() => {
    return chargers.map(charger => {
      const isDown = charger.state === 'faulted' || charger.state === 'offline';
      // Simulate: if currently down, assume ~2-8% downtime; otherwise 0-1%
      const downtimePercent = isDown
        ? 2 + Math.random() * 6
        : Math.random() * 1;
      const uptimePercent = 100 - downtimePercent;
      const downtimeHours = Math.round((downtimePercent / 100) * HOURS_IN_MONTH * 10) / 10;
      const breaches = uptimePercent < SLA_TARGET ? Math.ceil(Math.random() * 3) : 0;
      const metSla = uptimePercent >= SLA_TARGET;

      return {
        charger_id: charger.charger_id,
        uptime_percent: Math.round(uptimePercent * 100) / 100,
        downtime_hours: downtimeHours,
        breaches,
        met_sla: metSla,
      };
    });
  }, [chargers]);

  // Fleet-wide metrics
  const fleetUptime = useMemo(() => {
    if (chargerSlaData.length === 0) return 0;
    const avg = chargerSlaData.reduce((sum, c) => sum + c.uptime_percent, 0) / chargerSlaData.length;
    return Math.round(avg * 100) / 100;
  }, [chargerSlaData]);

  const chargersMeetingSla = chargerSlaData.filter(c => c.met_sla).length;
  const slaBreaches = chargerSlaData.filter(c => !c.met_sla).length;
  const avgDowntime = useMemo(() => {
    if (chargerSlaData.length === 0) return 0;
    const avg = chargerSlaData.reduce((sum, c) => sum + c.downtime_hours, 0) / chargerSlaData.length;
    return Math.round(avg * 10) / 10;
  }, [chargerSlaData]);

  const cardBg = isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-500';
  const textMuted = isDark ? 'text-slate-500' : 'text-slate-400';
  const tableBorder = isDark ? 'border-slate-800' : 'border-slate-200';
  const tableRowHover = isDark ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-black tracking-tight ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
          SLA Monitoring
        </h1>
        <p className={`text-sm mt-1 ${textSecondary}`}>
          Target: {SLA_TARGET}% uptime per charger per month
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className={`p-5 rounded-2xl border ${cardBg}`}
        >
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span className={`text-xs font-medium ${textSecondary}`}>Current Month Uptime</span>
          </div>
          <p className={`text-2xl font-black ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
            {fleetUptime}%
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={`p-5 rounded-2xl border ${cardBg}`}
        >
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className={`text-xs font-medium ${textSecondary}`}>Chargers Meeting SLA</span>
          </div>
          <p className={`text-2xl font-black ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
            {chargersMeetingSla}/{chargers.length}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`p-5 rounded-2xl border ${cardBg}`}
        >
          <div className="flex items-center gap-3 mb-3">
            <XCircle className="w-5 h-5 text-red-400" />
            <span className={`text-xs font-medium ${textSecondary}`}>SLA Breaches</span>
          </div>
          <p className={`text-2xl font-black ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
            {slaBreaches}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={`p-5 rounded-2xl border ${cardBg}`}
        >
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-5 h-5 text-amber-400" />
            <span className={`text-xs font-medium ${textSecondary}`}>Avg Downtime Hours</span>
          </div>
          <p className={`text-2xl font-black ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
            {avgDowntime}h
          </p>
        </motion.div>
      </div>

      {/* Fleet-wide SLA Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`p-5 rounded-2xl border ${cardBg}`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className={`text-sm font-medium ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
            Fleet-wide SLA vs Target
          </span>
          <span className={`text-sm font-mono ${fleetUptime >= SLA_TARGET ? 'text-emerald-400' : 'text-red-400'}`}>
            {fleetUptime}% / {SLA_TARGET}%
          </span>
        </div>
        <div className={`relative w-full h-4 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              fleetUptime >= SLA_TARGET ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
            style={{ width: `${Math.min(100, (fleetUptime / 100) * 100)}%` }}
          />
          {/* Target marker */}
          <div
            className="absolute top-0 h-full w-0.5 bg-red-400"
            style={{ left: `${SLA_TARGET}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className={`text-xs ${textMuted}`}>0%</span>
          <span className="text-xs text-red-400">Target: {SLA_TARGET}%</span>
          <span className={`text-xs ${textMuted}`}>100%</span>
        </div>
      </motion.div>

      {/* Daily Uptime Line Chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className={`p-5 rounded-2xl border ${cardBg}`}
      >
        <h3 className={`text-sm font-semibold mb-4 ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
          Daily Fleet Uptime (Last 30 Days)
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyUptimeData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
              <XAxis
                dataKey="day"
                tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                domain={[95, 100]}
                tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  background: isDark ? '#1e293b' : '#ffffff',
                  border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  color: isDark ? '#f1f5f9' : '#1e293b',
                }}
                formatter={(value: any) => [`${value}%`, 'Uptime']}
              />
              <ReferenceLine
                y={SLA_TARGET}
                stroke="#ef4444"
                strokeDasharray="5 5"
                label={{ value: 'SLA Target', fill: '#ef4444', fontSize: 10, position: 'right' }}
              />
              <Line
                type="monotone"
                dataKey="uptime"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#06b6d4' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Per-Charger SLA Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`rounded-2xl border overflow-hidden ${cardBg}`}
      >
        <div className="p-5 border-b" style={{ borderColor: isDark ? '#1e293b' : '#e2e8f0' }}>
          <h3 className={`text-sm font-semibold ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
            Per-Charger SLA Status
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${tableBorder}`}>
                <th className={`text-left px-5 py-3 font-medium ${textSecondary}`}>Charger ID</th>
                <th className={`text-left px-5 py-3 font-medium ${textSecondary}`}>Uptime %</th>
                <th className={`text-left px-5 py-3 font-medium ${textSecondary}`}>Downtime (hrs)</th>
                <th className={`text-left px-5 py-3 font-medium ${textSecondary}`}>Breaches</th>
                <th className={`text-left px-5 py-3 font-medium ${textSecondary}`}>Status</th>
              </tr>
            </thead>
            <tbody>
              {chargerSlaData.map(row => (
                <tr key={row.charger_id} className={`border-b ${tableBorder} ${tableRowHover} transition-colors`}>
                  <td className={`px-5 py-3 font-mono text-xs ${textPrimary}`}>{row.charger_id}</td>
                  <td className={`px-5 py-3 ${textPrimary}`}>
                    <span className={row.uptime_percent >= SLA_TARGET ? 'text-emerald-400' : 'text-red-400'}>
                      {row.uptime_percent}%
                    </span>
                  </td>
                  <td className={`px-5 py-3 ${textPrimary}`}>{row.downtime_hours}h</td>
                  <td className={`px-5 py-3 ${textPrimary}`}>{row.breaches}</td>
                  <td className="px-5 py-3">
                    {row.met_sla ? (
                      <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> Met
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-red-400 text-xs font-medium">
                        <XCircle className="w-3.5 h-3.5" /> Breached
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

