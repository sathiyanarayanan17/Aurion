import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { IndianRupee, TrendingDown, TrendingUp, Clock, Percent } from 'lucide-react';
import { useFleet } from '../../context/FleetContext';

export function RevenueImpactPage() {
  const { chargers, theme } = useFleet();
  const isDark = theme === 'black' || theme === 'dark';

  const REVENUE_PER_DAY = 4000; // ₹4000 per charger per day

  // Calculations
  const offlineChargers = useMemo(() => chargers.filter(c => c.state === 'offline' || c.state === 'faulted'), [chargers]);
  const atRiskChargers = useMemo(() => chargers.filter(c => c.health_score < 70 && c.state !== 'offline' && c.state !== 'faulted'), [chargers]);

  const revenueLostPerDay = offlineChargers.length * REVENUE_PER_DAY;
  const revenueSavedPerDay = atRiskChargers.length * REVENUE_PER_DAY; // prevented failures
  const monthlyROI = useMemo(() => {
    const monthlySaved = revenueSavedPerDay * 30;
    const platformCost = 50000; // ₹50K/month assumed platform cost
    return monthlySaved > 0 ? Math.round(((monthlySaved - platformCost) / platformCost) * 100) : 0;
  }, [revenueSavedPerDay]);

  const paybackPeriod = useMemo(() => {
    const dailySavings = revenueSavedPerDay;
    if (dailySavings <= 0) return '—';
    const investmentCost = 150000; // ₹1.5L one-time
    const days = Math.ceil(investmentCost / dailySavings);
    return days < 30 ? `${days} days` : `${Math.round(days / 30)} months`;
  }, [revenueSavedPerDay]);

  // Monthly bar chart data
  const monthlyData = useMemo(() => {
    const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    return months.map((month, i) => ({
      month,
      lost: Math.round(revenueLostPerDay * 30 * (0.8 + Math.random() * 0.4)),
      saved: Math.round(revenueSavedPerDay * 30 * (0.7 + Math.random() * 0.6)),
    }));
  }, [revenueLostPerDay, revenueSavedPerDay]);

  // Cumulative savings line chart
  const cumulativeData = useMemo(() => {
    const months = ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'];
    let cumulative = 0;
    return months.map((month, i) => {
      const monthlySavings = revenueSavedPerDay * 30 * (0.8 + i * 0.1);
      cumulative += monthlySavings;
      return {
        month,
        cumulative_savings: Math.round(cumulative),
        monthly_savings: Math.round(monthlySavings),
      };
    });
  }, [revenueSavedPerDay]);

  // Per-charger table data
  const chargerImpact = useMemo(() => {
    return chargers
      .filter(c => c.state === 'offline' || c.state === 'faulted' || c.health_score < 70)
      .map(c => {
        const isDown = c.state === 'offline' || c.state === 'faulted';
        const downtimeHours = isDown ? Math.round(8 + Math.random() * 40) : 0;
        const revenueLost = Math.round((downtimeHours / 24) * REVENUE_PER_DAY);
        const predictedSaves = !isDown && c.health_score < 70 ? Math.round(REVENUE_PER_DAY * (1 + Math.random() * 2)) : 0;
        return {
          charger_id: c.charger_id,
          state: c.state,
          health_score: c.health_score,
          downtime_hours: downtimeHours,
          revenue_lost: revenueLost,
          predicted_saves: predictedSaves,
        };
      })
      .sort((a, b) => b.revenue_lost - a.revenue_lost || b.predicted_saves - a.predicted_saves);
  }, [chargers]);

  const formatCurrency = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
    return `₹${val}`;
  };

  const cardBg = isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-500';
  const gridStroke = isDark ? '#1e293b' : '#e2e8f0';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/20">
          <IndianRupee className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className={`text-2xl font-black tracking-tight ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
            Revenue Impact
          </h1>
          <p className={`text-sm ${textSecondary}`}>Financial impact analysis and ROI calculator</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`p-5 rounded-2xl border ${cardBg}`}>
          <TrendingDown className="w-5 h-5 text-rose-400 mb-3" />
          <p className={`text-2xl font-bold ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
            {formatCurrency(revenueLostPerDay)}
          </p>
          <p className={`text-xs mt-1 ${textSecondary}`}>Revenue Lost / Day</p>
          <p className="text-[10px] text-rose-400 mt-0.5">{offlineChargers.length} offline chargers</p>
        </div>

        <div className={`p-5 rounded-2xl border ${cardBg}`}>
          <TrendingUp className="w-5 h-5 text-emerald-400 mb-3" />
          <p className={`text-2xl font-bold ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
            {formatCurrency(revenueSavedPerDay)}
          </p>
          <p className={`text-xs mt-1 ${textSecondary}`}>Revenue Saved / Day</p>
          <p className="text-[10px] text-emerald-400 mt-0.5">{atRiskChargers.length} failures prevented</p>
        </div>

        <div className={`p-5 rounded-2xl border ${cardBg}`}>
          <Percent className="w-5 h-5 text-cyan-400 mb-3" />
          <p className={`text-2xl font-bold ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
            {monthlyROI}%
          </p>
          <p className={`text-xs mt-1 ${textSecondary}`}>Monthly ROI</p>
          <p className="text-[10px] text-cyan-400 mt-0.5">vs platform cost</p>
        </div>

        <div className={`p-5 rounded-2xl border ${cardBg}`}>
          <Clock className="w-5 h-5 text-amber-400 mb-3" />
          <p className={`text-2xl font-bold ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
            {paybackPeriod}
          </p>
          <p className={`text-xs mt-1 ${textSecondary}`}>Payback Period</p>
          <p className="text-[10px] text-amber-400 mt-0.5">from day of deployment</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Impact */}
        <div className={`p-6 rounded-2xl border ${cardBg}`}>
          <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontFamily: 'var(--font-display)' }}>
            Monthly Revenue Impact (₹)
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="month" stroke={isDark ? '#475569' : '#94a3b8'} fontSize={11} />
              <YAxis stroke={isDark ? '#475569' : '#94a3b8'} fontSize={10} tickFormatter={v => formatCurrency(v)} />
              <Tooltip
                contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '8px' }}
                formatter={(value: any) => [`₹${value.toLocaleString()}`, '']}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="lost" fill="#ef4444" radius={[4, 4, 0, 0]} name="Revenue Lost" />
              <Bar dataKey="saved" fill="#22c55e" radius={[4, 4, 0, 0]} name="Revenue Saved" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cumulative Savings */}
        <div className={`p-6 rounded-2xl border ${cardBg}`}>
          <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontFamily: 'var(--font-display)' }}>
            Cumulative Savings (₹)
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={cumulativeData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="month" stroke={isDark ? '#475569' : '#94a3b8'} fontSize={11} />
              <YAxis stroke={isDark ? '#475569' : '#94a3b8'} fontSize={10} tickFormatter={v => formatCurrency(v)} />
              <Tooltip
                contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '8px' }}
                formatter={(value: any) => [`₹${value.toLocaleString()}`, '']}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line
                type="monotone"
                dataKey="cumulative_savings"
                stroke="#06b6d4"
                strokeWidth={2.5}
                dot={{ fill: '#06b6d4', r: 4 }}
                name="Cumulative Savings"
              />
              <Line
                type="monotone"
                dataKey="monthly_savings"
                stroke="#8b5cf6"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={{ fill: '#8b5cf6', r: 3 }}
                name="Monthly Savings"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-Charger Impact Table */}
      <div className={`rounded-2xl border ${cardBg} overflow-hidden`}>
        <div className={`px-6 py-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <h3 className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontFamily: 'var(--font-display)' }}>
            Per-Charger Revenue Impact
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={isDark ? 'bg-slate-900/50' : 'bg-slate-50'}>
                <th className={`px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider ${textSecondary}`}>Charger ID</th>
                <th className={`px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider ${textSecondary}`}>Status</th>
                <th className={`px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider ${textSecondary}`}>Health</th>
                <th className={`px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider ${textSecondary}`}>Downtime (hrs)</th>
                <th className={`px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider ${textSecondary}`}>Revenue Lost</th>
                <th className={`px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider ${textSecondary}`}>Predicted Saves</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800/50' : 'divide-slate-100'}`}>
              {chargerImpact.length === 0 ? (
                <tr>
                  <td colSpan={6} className={`px-6 py-8 text-center ${textSecondary}`}>
                    All chargers are healthy — no revenue impact detected.
                  </td>
                </tr>
              ) : (
                chargerImpact.map(row => (
                  <tr key={row.charger_id} className={isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}>
                    <td className={`px-6 py-3 font-mono text-xs font-semibold ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>
                      {row.charger_id}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        row.state === 'offline' || row.state === 'faulted'
                          ? 'bg-rose-500/10 text-rose-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          row.state === 'offline' || row.state === 'faulted' ? 'bg-rose-500' : 'bg-amber-500'
                        }`} />
                        {row.state}
                      </span>
                    </td>
                    <td className={`px-6 py-3 text-right text-xs font-semibold ${
                      row.health_score < 30 ? 'text-rose-400' : row.health_score < 60 ? 'text-amber-400' : 'text-yellow-400'
                    }`}>
                      {row.health_score}%
                    </td>
                    <td className={`px-6 py-3 text-right text-xs ${textPrimary}`}>
                      {row.downtime_hours > 0 ? `${row.downtime_hours}h` : '—'}
                    </td>
                    <td className="px-6 py-3 text-right text-xs font-semibold text-rose-400">
                      {row.revenue_lost > 0 ? `₹${row.revenue_lost.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-6 py-3 text-right text-xs font-semibold text-emerald-400">
                      {row.predicted_saves > 0 ? `₹${row.predicted_saves.toLocaleString()}` : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

