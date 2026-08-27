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
  Legend,
} from 'recharts';
import { BatteryCharging, Leaf, DollarSign, Clock, Zap, TrendingDown } from 'lucide-react';
import { useFleet } from '../../context/FleetContext';

// Grid pricing over 24 hours
const hourlyPricing = Array.from({ length: 24 }, (_, hour) => {
  let price: number;
  let category: string;
  if (hour >= 0 && hour < 6) {
    price = 4;
    category = 'Off-Peak';
  } else if (hour >= 18 && hour < 22) {
    price = 12;
    category = 'Peak';
  } else {
    price = 7;
    category = 'Normal';
  }
  // Recommended load inversely correlates with price
  const recommendedLoad = price === 4 ? 85 : price === 12 ? 20 : 55;
  const currentLoad = 50 + Math.random() * 30; // current unoptimized load
  return {
    hour: `${hour.toString().padStart(2, '0')}:00`,
    price,
    category,
    recommended_load: recommendedLoad,
    current_load: Math.round(currentLoad),
  };
});

// Current vs Optimized comparison
const comparisonData = [
  { period: 'Off-Peak\n(12am-6am)', current: 18000, optimized: 42000 },
  { period: 'Normal\n(6am-6pm)', current: 85000, optimized: 65000 },
  { period: 'Peak\n(6pm-10pm)', current: 52000, optimized: 12000 },
  { period: 'Late Night\n(10pm-12am)', current: 15000, optimized: 28000 },
];

export function EnergyPage() {
  const { chargers, theme } = useFleet();
  const isDark = theme === 'black' || theme === 'dark';

  // Per-charger schedule recommendation
  const chargerSchedule = useMemo(() => {
    return chargers.slice(0, 10).map(c => {
      const peakUsage = Math.round(30 + Math.random() * 50);
      const shift = peakUsage > 60 ? 'Shift 40% to off-peak' : peakUsage > 40 ? 'Shift 25% to off-peak' : 'Optimal';
      const monthlySavings = Math.round(peakUsage * 45 + Math.random() * 2000);
      return {
        charger_id: c.charger_id,
        peak_usage: peakUsage,
        recommended_shift: shift,
        monthly_savings: monthlySavings,
        city: c.location.city || 'Unknown',
      };
    }).sort((a, b) => b.monthly_savings - a.monthly_savings);
  }, [chargers]);

  // Green score calculation
  const greenScore = useMemo(() => {
    const avgPeakUsage = chargerSchedule.length > 0
      ? chargerSchedule.reduce((s, c) => s + c.peak_usage, 0) / chargerSchedule.length
      : 50;
    if (avgPeakUsage < 30) return { grade: 'A', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', label: 'Excellent' };
    if (avgPeakUsage < 45) return { grade: 'B', color: 'text-green-400', bgColor: 'bg-green-500/10', label: 'Good' };
    if (avgPeakUsage < 60) return { grade: 'C', color: 'text-amber-400', bgColor: 'bg-amber-500/10', label: 'Average' };
    if (avgPeakUsage < 75) return { grade: 'D', color: 'text-orange-400', bgColor: 'bg-orange-500/10', label: 'Below Average' };
    return { grade: 'F', color: 'text-red-400', bgColor: 'bg-red-500/10', label: 'Poor' };
  }, [chargerSchedule]);

  const totalMonthlySavings = useMemo(() => {
    return chargerSchedule.reduce((s, c) => s + c.monthly_savings, 0);
  }, [chargerSchedule]);

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
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-green-500 to-emerald-500 shadow-lg shadow-green-500/20">
          <BatteryCharging className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className={`text-2xl font-black tracking-tight ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
            Energy Arbitrage
          </h1>
          <p className={`text-sm ${textSecondary}`}>Load optimization & grid pricing intelligence</p>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`p-5 rounded-2xl border ${cardBg}`}>
          <DollarSign className="w-5 h-5 text-emerald-400 mb-3" />
          <p className={`text-2xl font-bold ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>₹18,000</p>
          <p className={`text-xs mt-1 ${textSecondary}`}>Monthly Savings Potential</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={`p-5 rounded-2xl border ${cardBg}`}>
          <TrendingDown className="w-5 h-5 text-cyan-400 mb-3" />
          <p className={`text-2xl font-bold ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>15%</p>
          <p className={`text-xs mt-1 ${textSecondary}`}>Thermal Stress Reduction</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`p-5 rounded-2xl border ${cardBg}`}>
          <Clock className="w-5 h-5 text-violet-400 mb-3" />
          <p className={`text-2xl font-bold ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>+8 mo</p>
          <p className={`text-xs mt-1 ${textSecondary}`}>Life Extension (off-peak)</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className={`p-5 rounded-2xl border ${cardBg}`}>
          <Zap className="w-5 h-5 text-amber-400 mb-3" />
          <p className={`text-2xl font-bold ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>₹4-12</p>
          <p className={`text-xs mt-1 ${textSecondary}`}>Grid Price Range/kWh</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={`p-5 rounded-2xl border ${greenScore.bgColor} border-current/10`}>
          <Leaf className={`w-5 h-5 ${greenScore.color} mb-3`} />
          <p className={`text-4xl font-black ${greenScore.color}`} style={{ fontFamily: 'var(--font-display)' }}>{greenScore.grade}</p>
          <p className={`text-xs mt-1 ${textSecondary}`}>Green Score ({greenScore.label})</p>
        </motion.div>
      </div>

      {/* Main Chart: Price vs Recommended Load */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className={`p-6 rounded-2xl border ${cardBg}`}
      >
        <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontFamily: 'var(--font-display)' }}>
          24h Grid Price vs Recommended Charging Load
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={hourlyPricing} margin={{ top: 10, right: 30, bottom: 10, left: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="loadGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="hour" stroke={isDark ? '#475569' : '#94a3b8'} fontSize={10} interval={2} />
            <YAxis yAxisId="left" stroke={isDark ? '#475569' : '#94a3b8'} fontSize={11} label={{ value: '₹/kWh', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
            <YAxis yAxisId="right" orientation="right" stroke={isDark ? '#475569' : '#94a3b8'} fontSize={11} label={{ value: 'Load %', angle: 90, position: 'insideRight', style: { fontSize: 10 } }} />
            <Tooltip
              contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '8px', fontSize: '12px' }}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Area yAxisId="left" type="stepAfter" dataKey="price" stroke="#f59e0b" strokeWidth={2} fill="url(#priceGradient)" name="Grid Price (₹/kWh)" />
            <Area yAxisId="right" type="monotone" dataKey="recommended_load" stroke="#22c55e" strokeWidth={2} fill="url(#loadGradient)" name="Recommended Load (%)" />
          </AreaChart>
        </ResponsiveContainer>
        <p className={`text-[10px] mt-2 ${textSecondary}`}>
          Off-peak (12am-6am): ₹4/kWh • Normal: ₹7/kWh • Peak (6pm-10pm): ₹12/kWh
        </p>
      </motion.div>

      {/* Insights + Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Insight Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`p-6 rounded-2xl border ${isDark ? 'border-emerald-500/20 bg-emerald-950/10' : 'border-emerald-200 bg-emerald-50/50'}`}
        >
          <div className="flex items-center gap-2 mb-4">
            <Leaf className="w-5 h-5 text-emerald-400" />
            <h3 className={`text-sm font-semibold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`} style={{ fontFamily: 'var(--font-display)' }}>
              Optimization Insights
            </h3>
          </div>
          <div className="space-y-4">
            <div className={`p-3 rounded-lg ${isDark ? 'bg-emerald-950/30 border border-emerald-500/10' : 'bg-emerald-100/50'}`}>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-emerald-200' : 'text-emerald-700'}`}>
                <span className="font-bold">💰 Cost Savings:</span> Shifting 30% of charging to off-peak saves ₹18,000/month and reduces thermal stress by 15%.
              </p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-emerald-950/30 border border-emerald-500/10' : 'bg-emerald-100/50'}`}>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-emerald-200' : 'text-emerald-700'}`}>
                <span className="font-bold">🔋 Wear Reduction:</span> Off-peak charging at lower power (30kW vs 150kW) extends charger life by 8 months on average.
              </p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-emerald-950/30 border border-emerald-500/10' : 'bg-emerald-100/50'}`}>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-emerald-200' : 'text-emerald-700'}`}>
                <span className="font-bold">⚡ Grid Impact:</span> Distributing load to off-peak reduces grid strain and qualifies for ToD tariff benefits.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Current vs Optimized Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className={`p-6 rounded-2xl border ${cardBg}`}
        >
          <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontFamily: 'var(--font-display)' }}>
            Current vs Optimized Energy Cost (₹/month)
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={comparisonData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="period" stroke={isDark ? '#475569' : '#94a3b8'} fontSize={10} />
              <YAxis stroke={isDark ? '#475569' : '#94a3b8'} fontSize={10} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip
                contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '8px', fontSize: '12px' }}
                formatter={(value: any) => [`₹${value.toLocaleString()}`, '']}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="current" fill="#ef4444" radius={[4, 4, 0, 0]} name="Current" />
              <Bar dataKey="optimized" fill="#22c55e" radius={[4, 4, 0, 0]} name="Optimized" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Per-Charger Schedule Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={`rounded-2xl border ${cardBg} overflow-hidden`}
      >
        <div className={`px-6 py-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <h3 className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontFamily: 'var(--font-display)' }}>
            Per-Charger Schedule Recommendation
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={isDark ? 'bg-slate-900/50' : 'bg-slate-50'}>
                <th className={`px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider ${textSecondary}`}>Charger ID</th>
                <th className={`px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider ${textSecondary}`}>City</th>
                <th className={`px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider ${textSecondary}`}>Peak Usage %</th>
                <th className={`px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider ${textSecondary}`}>Recommendation</th>
                <th className={`px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider ${textSecondary}`}>Monthly Savings</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800/50' : 'divide-slate-100'}`}>
              {chargerSchedule.map(c => (
                <tr key={c.charger_id} className={isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}>
                  <td className={`px-6 py-3 font-mono text-xs font-semibold ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>
                    {c.charger_id}
                  </td>
                  <td className={`px-6 py-3 text-xs ${textPrimary}`}>{c.city}</td>
                  <td className={`px-6 py-3 text-right text-xs font-semibold ${
                    c.peak_usage > 60 ? 'text-red-400' : c.peak_usage > 40 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {c.peak_usage}%
                  </td>
                  <td className={`px-6 py-3 text-xs ${textSecondary}`}>
                    {c.recommended_shift === 'Optimal' ? (
                      <span className="text-emerald-400 font-medium">✓ Optimal</span>
                    ) : (
                      c.recommended_shift
                    )}
                  </td>
                  <td className="px-6 py-3 text-right text-xs font-semibold text-emerald-400">
                    ₹{c.monthly_savings.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className={isDark ? 'bg-slate-900/50' : 'bg-slate-50'}>
                <td colSpan={4} className={`px-6 py-3 text-xs font-bold ${textPrimary}`}>Total Fleet Savings</td>
                <td className="px-6 py-3 text-right text-sm font-black text-emerald-400">
                  ₹{totalMonthlySavings.toLocaleString()}/mo
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
