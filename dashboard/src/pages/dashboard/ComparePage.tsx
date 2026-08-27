import { useState, useMemo } from 'react';
import { useFleet } from '../../context/FleetContext';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer,
  CartesianGrid, Tooltip, Legend, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { GitCompare, Radar as RadarIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ChargerSummary } from '../../types';

const COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#22c55e'];

function generateTelemetryHistory(charger: ChargerSummary, points: number) {
  return Array.from({ length: points }, (_, i) => ({
    point: i + 1,
    temperature: charger.temperature + (Math.random() - 0.5) * 8,
    voltage: charger.voltage + (Math.random() - 0.5) * 15,
    power_kw: charger.power_kw + (Math.random() - 0.5) * 5,
  }));
}

function normalizeMetrics(charger: ChargerSummary) {
  return {
    charger_id: charger.charger_id,
    health: charger.health_score,
    temp_safety: Math.max(0, 100 - ((charger.temperature - 25) / 35) * 100),
    voltage_stability: Math.min(100, (charger.voltage / 420) * 100),
    power_efficiency: Math.min(100, (charger.power_kw / 60) * 100),
    maintenance_freshness: Math.max(0, 100 - (charger.days_since_maintenance / 90) * 100),
  };
}

export function ComparePage() {
  const { chargers, theme } = useFleet();
  const [selectedIds, setSelectedIds] = useState<string[]>(
    chargers.slice(0, 2).map(c => c.charger_id)
  );

  const selectedChargers = useMemo(
    () => chargers.filter(c => selectedIds.includes(c.charger_id)),
    [chargers, selectedIds]
  );

  const telemetryData = useMemo(() => {
    if (selectedChargers.length === 0) return [];
    const histories = selectedChargers.map(c => generateTelemetryHistory(c, 20));
    return Array.from({ length: 20 }, (_, i) => {
      const point: Record<string, number | string> = { point: i + 1 };
      selectedChargers.forEach((c, idx) => {
        point[`${c.charger_id}_temp`] = Math.round(histories[idx][i].temperature * 10) / 10;
        point[`${c.charger_id}_volt`] = Math.round(histories[idx][i].voltage * 10) / 10;
      });
      return point;
    });
  }, [selectedChargers]);

  const radarData = useMemo(() => {
    const metrics = selectedChargers.map(normalizeMetrics);
    const dimensions = ['health', 'temp_safety', 'voltage_stability', 'power_efficiency', 'maintenance_freshness'] as const;
    const labels: Record<string, string> = {
      health: 'Health Score',
      temp_safety: 'Temp Safety',
      voltage_stability: 'Voltage Stability',
      power_efficiency: 'Power Efficiency',
      maintenance_freshness: 'Maintenance Freshness',
    };
    return dimensions.map(dim => {
      const entry: Record<string, string | number> = { metric: labels[dim] };
      metrics.forEach(m => {
        entry[m.charger_id] = Math.round(m[dim]);
      });
      return entry;
    });
  }, [selectedChargers]);

  const cityAggregation = useMemo(() => {
    const cities: Record<string, { total: number; count: number }> = {};
    chargers.forEach(c => {
      const city = c.location.city || 'Unknown';
      if (!cities[city]) cities[city] = { total: 0, count: 0 };
      cities[city].total += c.health_score;
      cities[city].count += 1;
    });
    return Object.entries(cities).map(([city, data]) => ({
      city,
      avg_health: Math.round(data.total / data.count),
      count: data.count,
    }));
  }, [chargers]);

  const toggleCharger = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return [...prev.slice(1), id];
      return [...prev, id];
    });
  };

  const isDark = theme !== 'light';
  const borderColor = isDark ? 'border-slate-800' : 'border-slate-200';
  const cardBg = isDark ? 'bg-slate-950/50' : 'bg-white';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const textMuted = isDark ? 'text-slate-500' : 'text-slate-500';
  const gridStroke = isDark ? '#1e293b' : '#e2e8f0';
  const axisStroke = isDark ? '#475569' : '#94a3b8';

  const riskColors: Record<string, string> = {
    LOW: 'text-green-400',
    MEDIUM: 'text-amber-400',
    HIGH: 'text-orange-400',
    CRITICAL: 'text-red-400',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-black tracking-tight ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
            Comparative Analysis
          </h1>
          <p className={`${textSecondary} text-sm mt-1`}>Compare charger metrics side-by-side</p>
        </div>
        <div className="flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-cyan-400" />
          <span className={`text-xs ${textMuted}`}>Select 2-3 chargers</span>
        </div>
      </div>

      {/* Charger Selector */}
      <div className={`p-4 rounded-2xl border ${borderColor} ${cardBg}`}>
        <div className="flex flex-wrap gap-2">
          {chargers.map((c, idx) => (
            <button
              key={c.charger_id}
              onClick={() => toggleCharger(c.charger_id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedIds.includes(c.charger_id)
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                  : `border ${borderColor} ${textSecondary} hover:border-cyan-500/30`
              }`}
            >
              {c.charger_id}
              {selectedIds.includes(c.charger_id) && (
                <span className="ml-1.5 inline-block w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[selectedIds.indexOf(c.charger_id)] }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Side-by-side Comparison Cards */}
      {selectedChargers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {selectedChargers.map((c, idx) => (
            <div key={c.charger_id} className={`p-5 rounded-2xl border ${borderColor} ${cardBg}`}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                <h4 className={`text-sm font-bold ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
                  {c.charger_id}
                </h4>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between">
                  <span className={`text-xs ${textMuted}`}>Health Score</span>
                  <span className={`text-xs font-bold ${textPrimary}`}>{c.health_score}%</span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-xs ${textMuted}`}>Temperature</span>
                  <span className={`text-xs font-bold ${textPrimary}`}>{c.temperature}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-xs ${textMuted}`}>Voltage</span>
                  <span className={`text-xs font-bold ${textPrimary}`}>{c.voltage}V</span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-xs ${textMuted}`}>Power</span>
                  <span className={`text-xs font-bold ${textPrimary}`}>{c.power_kw} kW</span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-xs ${textMuted}`}>Risk Level</span>
                  <span className={`text-xs font-bold ${riskColors[c.risk_level]}`}>{c.risk_level}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-xs ${textMuted}`}>Days Since Maint.</span>
                  <span className={`text-xs font-bold ${textPrimary}`}>{c.days_since_maintenance}d</span>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overlaid Temperature Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className={`p-6 rounded-2xl border ${borderColor} ${cardBg}`}
        >
          <h3 className={`text-sm font-semibold ${textPrimary} mb-4`} style={{ fontFamily: 'var(--font-display)' }}>
            Temperature Comparison
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={telemetryData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="point" stroke={axisStroke} fontSize={10} />
              <YAxis stroke={axisStroke} fontSize={10} />
              <Tooltip contentStyle={{ background: isDark ? '#0f172a' : '#fff', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '8px' }} />
              <Legend />
              {selectedChargers.map((c, idx) => (
                <Line
                  key={c.charger_id}
                  type="monotone"
                  dataKey={`${c.charger_id}_temp`}
                  stroke={COLORS[idx]}
                  strokeWidth={2}
                  dot={false}
                  name={`${c.charger_id} (°C)`}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Overlaid Voltage Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className={`p-6 rounded-2xl border ${borderColor} ${cardBg}`}
        >
          <h3 className={`text-sm font-semibold ${textPrimary} mb-4`} style={{ fontFamily: 'var(--font-display)' }}>
            Voltage Comparison
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={telemetryData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="point" stroke={axisStroke} fontSize={10} />
              <YAxis stroke={axisStroke} fontSize={10} />
              <Tooltip contentStyle={{ background: isDark ? '#0f172a' : '#fff', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '8px' }} />
              <Legend />
              {selectedChargers.map((c, idx) => (
                <Line
                  key={c.charger_id}
                  type="monotone"
                  dataKey={`${c.charger_id}_volt`}
                  stroke={COLORS[idx]}
                  strokeWidth={2}
                  dot={false}
                  name={`${c.charger_id} (V)`}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Radar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className={`p-6 rounded-2xl border ${borderColor} ${cardBg}`}
        >
          <div className="flex items-center gap-2 mb-4">
            <RadarIcon className="w-4 h-4 text-violet-400" />
            <h3 className={`text-sm font-semibold ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
              Normalized Metrics Radar
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={gridStroke} />
              <PolarAngleAxis dataKey="metric" stroke={axisStroke} fontSize={10} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke={axisStroke} fontSize={9} />
              {selectedChargers.map((c, idx) => (
                <Radar
                  key={c.charger_id}
                  name={c.charger_id}
                  dataKey={c.charger_id}
                  stroke={COLORS[idx]}
                  fill={COLORS[idx]}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              ))}
              <Legend />
              <Tooltip contentStyle={{ background: isDark ? '#0f172a' : '#fff', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '8px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* City-wise Health Aggregation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className={`p-6 rounded-2xl border ${borderColor} ${cardBg}`}
        >
          <h3 className={`text-sm font-semibold ${textPrimary} mb-4`} style={{ fontFamily: 'var(--font-display)' }}>
            City-wise Average Health
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={cityAggregation}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="city" stroke={axisStroke} fontSize={11} />
              <YAxis stroke={axisStroke} fontSize={10} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: isDark ? '#0f172a' : '#fff', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '8px' }}
                formatter={(value: any, name: any) => [
                  name === 'avg_health' ? `${value}%` : value,
                  name === 'avg_health' ? 'Avg Health' : 'Chargers'
                ]}
              />
              <Bar dataKey="avg_health" fill="#06b6d4" radius={[4, 4, 0, 0]} barSize={32} name="avg_health" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}

