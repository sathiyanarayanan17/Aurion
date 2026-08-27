import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { Hourglass, TrendingDown, Calendar, AlertTriangle } from 'lucide-react';
import { useFleet } from '../../context/FleetContext';

export function AgingPage() {
  const { chargers, theme } = useFleet();
  const isDark = theme === 'black' || theme === 'dark';

  // Calculate RUL for each charger
  const chargerRUL = useMemo(() => {
    return chargers.map(c => {
      const rawRUL = 100 - c.days_since_maintenance * 0.5 - (100 - c.health_score) * 0.8;
      const rulMonths = Math.max(6, Math.min(60, Math.round(rawRUL * 0.6)));
      const depreciationRate = Math.round((100 - c.health_score) / Math.max(1, c.days_since_maintenance) * 100) / 100;
      const replacementDate = new Date();
      replacementDate.setMonth(replacementDate.getMonth() + rulMonths);
      return {
        charger_id: c.charger_id,
        health_score: c.health_score,
        days_since_maintenance: c.days_since_maintenance,
        rul_months: rulMonths,
        replacement_date: replacementDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        depreciation_rate: depreciationRate,
        city: c.location.city || 'Unknown',
      };
    }).sort((a, b) => a.rul_months - b.rul_months);
  }, [chargers]);

  // RUL bands for fleet-wide bar chart
  const rulBands = useMemo(() => {
    const bands = [
      { band: '0-6 mo', min: 0, max: 6, count: 0, fill: '#ef4444' },
      { band: '6-12 mo', min: 6, max: 12, count: 0, fill: '#f59e0b' },
      { band: '12-24 mo', min: 12, max: 24, count: 0, fill: '#eab308' },
      { band: '24-36 mo', min: 24, max: 36, count: 0, fill: '#22c55e' },
      { band: '36+ mo', min: 36, max: 999, count: 0, fill: '#06b6d4' },
    ];
    chargerRUL.forEach(c => {
      const band = bands.find(b => c.rul_months >= b.min && c.rul_months < b.max);
      if (band) band.count++;
    });
    return bands;
  }, [chargerRUL]);

  // Depreciation curve (projected health over 24 months)
  const depreciationCurve = useMemo(() => {
    const avgHealth = chargers.length > 0
      ? Math.round(chargers.reduce((s, c) => s + c.health_score, 0) / chargers.length)
      : 75;
    const data = [];
    for (let month = 0; month <= 24; month++) {
      const decline = month * 1.8 + (month > 12 ? (month - 12) * 0.7 : 0);
      data.push({
        month: `M${month}`,
        health: Math.max(20, Math.round(avgHealth - decline)),
        critical_threshold: 40,
      });
    }
    return data;
  }, [chargers]);

  // CapEx planning
  const capexData = useMemo(() => {
    const within6 = chargerRUL.filter(c => c.rul_months < 12);
    const costPerCharger = 8.5; // ₹ lakhs
    return {
      count: within6.length,
      estimatedCost: Math.round(within6.length * costPerCharger * 10) / 10,
      chargers: within6.slice(0, 5),
    };
  }, [chargerRUL]);

  const cardBg = isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-500';
  const gridStroke = isDark ? '#1e293b' : '#e2e8f0';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20">
          <Hourglass className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className={`text-2xl font-black tracking-tight ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
            Charger Aging & RUL
          </h1>
          <p className={`text-sm ${textSecondary}`}>Remaining useful life estimation and replacement planning</p>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`p-5 rounded-2xl border ${cardBg}`}>
          <Hourglass className="w-5 h-5 text-amber-400 mb-3" />
          <p className={`text-2xl font-bold ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
            {chargerRUL.length > 0 ? Math.round(chargerRUL.reduce((s, c) => s + c.rul_months, 0) / chargerRUL.length) : 0} mo
          </p>
          <p className={`text-xs mt-1 ${textSecondary}`}>Avg Fleet RUL</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={`p-5 rounded-2xl border ${cardBg}`}>
          <AlertTriangle className="w-5 h-5 text-red-400 mb-3" />
          <p className={`text-2xl font-bold text-red-400`} style={{ fontFamily: 'var(--font-display)' }}>
            {chargerRUL.filter(c => c.rul_months < 12).length}
          </p>
          <p className={`text-xs mt-1 ${textSecondary}`}>End-of-Life (&lt;12 mo)</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`p-5 rounded-2xl border ${cardBg}`}>
          <TrendingDown className="w-5 h-5 text-orange-400 mb-3" />
          <p className={`text-2xl font-bold ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
            {chargerRUL.length > 0 ? (chargerRUL.reduce((s, c) => s + c.depreciation_rate, 0) / chargerRUL.length).toFixed(2) : 0}%/d
          </p>
          <p className={`text-xs mt-1 ${textSecondary}`}>Avg Depreciation Rate</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className={`p-5 rounded-2xl border ${cardBg}`}>
          <Calendar className="w-5 h-5 text-cyan-400 mb-3" />
          <p className={`text-2xl font-bold ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
            ₹{capexData.estimatedCost}L
          </p>
          <p className={`text-xs mt-1 ${textSecondary}`}>CapEx (next 12 months)</p>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Depreciation Curve */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`p-6 rounded-2xl border ${cardBg}`}
        >
          <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontFamily: 'var(--font-display)' }}>
            Projected Fleet Health Decline (24 months)
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={depreciationCurve} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
              <defs>
                <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="month" stroke={isDark ? '#475569' : '#94a3b8'} fontSize={10} />
              <YAxis stroke={isDark ? '#475569' : '#94a3b8'} fontSize={11} domain={[0, 100]} unit="%" />
              <Tooltip
                contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '8px', fontSize: '12px' }}
                formatter={(value: any, name: any) => [
                  name === 'health' ? `${value}%` : `${value}%`,
                  name === 'health' ? 'Projected Health' : 'Critical Threshold',
                ]}
              />
              <Area
                type="monotone"
                dataKey="health"
                stroke="#06b6d4"
                strokeWidth={2.5}
                fill="url(#healthGradient)"
              />
              <Area
                type="monotone"
                dataKey="critical_threshold"
                stroke="#ef4444"
                strokeWidth={1}
                strokeDasharray="4 4"
                fill="none"
              />
            </AreaChart>
          </ResponsiveContainer>
          <p className={`text-[10px] mt-2 ${textSecondary}`}>
            Dashed red line = critical health threshold (40%). Below this, charger requires replacement.
          </p>
        </motion.div>

        {/* RUL Bands */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`p-6 rounded-2xl border ${cardBg}`}
        >
          <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontFamily: 'var(--font-display)' }}>
            Fleet by Remaining Useful Life
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={rulBands} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="band" stroke={isDark ? '#475569' : '#94a3b8'} fontSize={11} />
              <YAxis stroke={isDark ? '#475569' : '#94a3b8'} fontSize={11} />
              <Tooltip
                contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '8px', fontSize: '12px' }}
                formatter={(value: any) => [`${value} chargers`, 'Count']}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {rulBands.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* CapEx Planning */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={`p-6 rounded-2xl border ${isDark ? 'border-red-500/20 bg-red-950/10' : 'border-red-200 bg-red-50/50'}`}
      >
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <h3 className={`text-sm font-semibold ${isDark ? 'text-red-300' : 'text-red-700'}`} style={{ fontFamily: 'var(--font-display)' }}>
            CapEx Planning — Replacement Required
          </h3>
        </div>
        <p className={`text-sm mb-4 ${isDark ? 'text-red-200/70' : 'text-red-600/80'}`}>
          <span className="font-bold">{capexData.count} chargers</span> need replacement within 12 months.
          Estimated cost: <span className="font-bold">₹{capexData.estimatedCost} lakhs</span> (at ₹8.5L per unit).
        </p>
      </motion.div>

      {/* Per-Charger Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className={`rounded-2xl border ${cardBg} overflow-hidden`}
      >
        <div className={`px-6 py-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <h3 className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontFamily: 'var(--font-display)' }}>
            Charger Aging Details
          </h3>
        </div>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className={`sticky top-0 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
              <tr>
                <th className={`px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider ${textSecondary}`}>Charger ID</th>
                <th className={`px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider ${textSecondary}`}>Health</th>
                <th className={`px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider ${textSecondary}`}>RUL (months)</th>
                <th className={`px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider ${textSecondary}`}>Replacement</th>
                <th className={`px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider ${textSecondary}`}>Depreciation</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800/50' : 'divide-slate-100'}`}>
              {chargerRUL.slice(0, 15).map(c => (
                <tr
                  key={c.charger_id}
                  className={`${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'} ${c.rul_months < 12 ? (isDark ? 'bg-red-950/20' : 'bg-red-50/50') : ''}`}
                >
                  <td className={`px-6 py-3 font-mono text-xs font-semibold ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>
                    {c.charger_id}
                  </td>
                  <td className={`px-6 py-3 text-right text-xs font-semibold ${
                    c.health_score < 40 ? 'text-red-400' : c.health_score < 70 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {c.health_score}%
                  </td>
                  <td className={`px-6 py-3 text-right text-xs font-bold ${c.rul_months < 12 ? 'text-red-400' : textPrimary}`}>
                    {c.rul_months} mo
                  </td>
                  <td className={`px-6 py-3 text-right text-xs ${textSecondary}`}>
                    {c.replacement_date}
                  </td>
                  <td className={`px-6 py-3 text-right text-xs ${textSecondary}`}>
                    {c.depreciation_rate}%/day
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

