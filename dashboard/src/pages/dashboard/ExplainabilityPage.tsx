import { useState, useMemo } from 'react';
import { useFleet } from '../../context/FleetContext';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, Cell, ReferenceLine } from 'recharts';
import { Brain, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

interface ShapValue {
  feature: string;
  label: string;
  value: number;
}

const BASE_SHAP_VALUES: ShapValue[] = [
  { feature: 'temperature_trend', label: 'Temperature Trend', value: 0.35 },
  { feature: 'voltage_std', label: 'Voltage Std Dev', value: 0.22 },
  { feature: 'error_count', label: 'Error Count', value: 0.18 },
  { feature: 'days_since_maintenance', label: 'Days Since Maintenance', value: 0.15 },
  { feature: 'session_failure_rate', label: 'Session Failure Rate', value: 0.12 },
  { feature: 'current_std', label: 'Current Std Dev', value: -0.05 },
  { feature: 'power_mean', label: 'Mean Power Output', value: -0.08 },
  { feature: 'charging_ratio', label: 'Charging Ratio', value: -0.12 },
];

function generateShapForCharger(chargerId: string): ShapValue[] {
  // Add slight variation per charger based on charger_id hash
  const hash = chargerId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const variation = (hash % 20 - 10) / 100;
  return BASE_SHAP_VALUES.map(sv => ({
    ...sv,
    value: Math.round((sv.value + variation * Math.sign(sv.value)) * 100) / 100,
  }));
}

function generateExplanation(shapValues: ShapValue[], chargerId: string): string {
  const topPositive = shapValues
    .filter(s => s.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  const topNegative = shapValues
    .filter(s => s.value < 0)
    .sort((a, b) => a.value - b.value)
    .slice(0, 2);

  const riskFactors = topPositive
    .map(s => `${s.label} (contribution: +${s.value.toFixed(2)})`)
    .join(', ');

  const protectiveFactors = topNegative
    .map(s => `${s.label} (contribution: ${s.value.toFixed(2)})`)
    .join(', ');

  return `Charger ${chargerId} is flagged primarily due to: ${riskFactors}. These features are pushing the model's prediction toward a failure state. However, ${protectiveFactors} are acting as protective factors, indicating some operational stability. The dominant risk driver is ${topPositive[0]?.label.toLowerCase()}, suggesting thermal management should be investigated first.`;
}

export function ExplainabilityPage() {
  const { chargers, theme } = useFleet();
  const [selectedChargerId, setSelectedChargerId] = useState<string>(
    chargers[0]?.charger_id || ''
  );

  const shapValues = useMemo(() => {
    if (!selectedChargerId) return BASE_SHAP_VALUES;
    return generateShapForCharger(selectedChargerId);
  }, [selectedChargerId]);

  const sortedShap = useMemo(
    () => [...shapValues].sort((a, b) => Math.abs(b.value) - Math.abs(a.value)),
    [shapValues]
  );

  const explanation = useMemo(
    () => generateExplanation(shapValues, selectedChargerId),
    [shapValues, selectedChargerId]
  );

  const isDark = theme !== 'light';
  const borderColor = isDark ? 'border-slate-800' : 'border-slate-200';
  const cardBg = isDark ? 'bg-slate-950/50' : 'bg-white';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const textMuted = isDark ? 'text-slate-500' : 'text-slate-500';
  const gridStroke = isDark ? '#1e293b' : '#e2e8f0';
  const axisStroke = isDark ? '#475569' : '#94a3b8';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-black tracking-tight ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
            ML Explainability
          </h1>
          <p className={`${textSecondary} text-sm mt-1`}>SHAP-based feature importance analysis for predictive model</p>
        </div>

        {/* Charger Selector */}
        <div className="flex items-center gap-3">
          <Brain className="w-5 h-5 text-violet-400" />
          <select
            value={selectedChargerId}
            onChange={(e) => setSelectedChargerId(e.target.value)}
            className={`px-4 py-2 rounded-xl border ${borderColor} ${cardBg} ${textPrimary} text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50`}
          >
            {chargers.map((c) => (
              <option key={c.charger_id} value={c.charger_id}>
                {c.charger_id} — {c.location.city || 'Unknown'} ({c.risk_level})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SHAP Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`p-6 rounded-2xl border ${borderColor} ${cardBg}`}
      >
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-4 h-4 text-violet-400" />
          <h3 className={`text-sm font-semibold ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
            Feature Importance (SHAP Values)
          </h3>
        </div>
        <p className={`text-xs ${textMuted} mb-6`}>
          Positive values push prediction toward failure · Negative values push toward healthy
        </p>

        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={sortedShap} layout="vertical" margin={{ left: 140, right: 40, top: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
            <XAxis
              type="number"
              stroke={axisStroke}
              fontSize={10}
              domain={[-0.2, 0.4]}
              tickFormatter={(v: number) => v.toFixed(2)}
            />
            <YAxis
              type="category"
              dataKey="label"
              stroke={axisStroke}
              fontSize={11}
              width={130}
              tick={{ fill: isDark ? '#cbd5e1' : '#334155' }}
            />
            <Tooltip
              contentStyle={{
                background: isDark ? '#0f172a' : '#ffffff',
                border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                borderRadius: '8px',
              }}
              formatter={(value: any) => [value.toFixed(3), 'SHAP Value']}
              labelStyle={{ color: isDark ? '#e2e8f0' : '#1e293b' }}
            />
            <ReferenceLine x={0} stroke={axisStroke} strokeDasharray="3 3" />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
              {sortedShap.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.value >= 0 ? '#ef4444' : '#06b6d4'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-red-500" />
            <span className={`text-xs ${textMuted}`}>Pushes toward failure</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-cyan-500" />
            <span className={`text-xs ${textMuted}`}>Pushes toward healthy</span>
          </div>
        </div>
      </motion.div>

      {/* Explanation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className={`p-6 rounded-2xl border ${borderColor} ${cardBg}`}
      >
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <h3 className={`text-sm font-semibold ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
            Why is this charger flagged?
          </h3>
        </div>
        <p className={`text-sm leading-relaxed ${textSecondary}`}>
          {explanation}
        </p>

        {/* Feature breakdown cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {shapValues
            .filter(s => s.value > 0)
            .sort((a, b) => b.value - a.value)
            .slice(0, 4)
            .map((sv) => (
              <div
                key={sv.feature}
                className={`p-3 rounded-xl border ${isDark ? 'border-red-900/30 bg-red-950/20' : 'border-red-200 bg-red-50'}`}
              >
                <p className={`text-xs ${textMuted} truncate`}>{sv.label}</p>
                <p className="text-lg font-bold text-red-400 mt-1" style={{ fontFamily: 'var(--font-display)' }}>
                  +{sv.value.toFixed(2)}
                </p>
              </div>
            ))}
        </div>
      </motion.div>
    </div>
  );
}

