import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { CloudRain, Thermometer, Wind, Droplets, Sun, AlertTriangle } from 'lucide-react';
import { useFleet } from '../../context/FleetContext';

interface CityWeather {
  city: string;
  condition: string;
  icon: typeof CloudRain;
  humidity: number;
  temperature: number;
  failureMultiplier: number;
  description: string;
}

const cityWeatherData: CityWeather[] = [
  { city: 'Mumbai', condition: 'Monsoon', icon: CloudRain, humidity: 88, temperature: 31, failureMultiplier: 2.3, description: 'Heavy rainfall & high humidity' },
  { city: 'Delhi', condition: 'Heat Wave', icon: Thermometer, humidity: 25, temperature: 46, failureMultiplier: 2.1, description: 'Extreme temperatures 46°C+' },
  { city: 'Chennai', condition: 'Cyclone Season', icon: Wind, humidity: 82, temperature: 33, failureMultiplier: 1.9, description: 'Strong winds & storm surges' },
  { city: 'Kochi', condition: 'Heavy Rainfall', icon: Droplets, humidity: 91, temperature: 28, failureMultiplier: 2.0, description: 'Continuous downpour, flooding risk' },
  { city: 'Jaipur', condition: 'Dust Storm', icon: Wind, humidity: 18, temperature: 43, failureMultiplier: 1.7, description: 'Sand & particulate matter ingress' },
];

const seasonData = [
  { season: 'Summer', failure_rate: 18, fill: '#f59e0b' },
  { season: 'Monsoon', failure_rate: 32, fill: '#3b82f6' },
  { season: 'Winter', failure_rate: 8, fill: '#06b6d4' },
  { season: 'Post-Monsoon', failure_rate: 14, fill: '#8b5cf6' },
];

const insights = [
  { text: 'Coastal chargers fail 2.3x more during monsoon due to salt fog corrosion on connectors', icon: Droplets, color: 'text-blue-400' },
  { text: 'Heat waves increase thermal failures by 180% — electronics exceed safe operating limits', icon: Thermometer, color: 'text-red-400' },
  { text: 'Dust storms correlate with connector issues — particulate ingress damages pins', icon: Wind, color: 'text-amber-400' },
];

export function WeatherPage() {
  const { chargers, theme } = useFleet();
  const isDark = theme === 'black' || theme === 'dark';

  // Generate scatter data: temp vs failure rate correlation
  const scatterData = useMemo(() => {
    const points = [];
    for (let i = 0; i < 30; i++) {
      const temp = 20 + Math.random() * 30;
      const baseFailure = (temp - 20) * 0.8 + Math.random() * 8;
      points.push({
        temperature: Math.round(temp * 10) / 10,
        failure_rate: Math.round(Math.max(2, baseFailure) * 10) / 10,
      });
    }
    return points.sort((a, b) => a.temperature - b.temperature);
  }, []);

  // Weather risk zone chargers
  const weatherRiskChargers = useMemo(() => {
    return chargers
      .filter(c => c.temperature > 55 || c.health_score < 60)
      .slice(0, 6)
      .map(c => ({
        charger_id: c.charger_id,
        city: c.location.city || 'Unknown',
        temperature: c.temperature,
        risk: c.temperature > 65 ? 'CRITICAL' : c.temperature > 55 ? 'HIGH' : 'MEDIUM',
      }));
  }, [chargers]);

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
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/20">
          <CloudRain className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className={`text-2xl font-black tracking-tight ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
            Weather Correlation
          </h1>
          <p className={`text-sm ${textSecondary}`}>Weather-aware failure prediction for Indian cities</p>
        </div>
      </motion.div>

      {/* City Weather Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cityWeatherData.map((city, i) => (
          <motion.div
            key={city.city}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`p-4 rounded-2xl border ${cardBg}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <city.icon className={`w-5 h-5 ${city.failureMultiplier > 2 ? 'text-red-400' : 'text-amber-400'}`} />
              <span className={`text-sm font-bold ${textPrimary}`}>{city.city}</span>
            </div>
            <p className={`text-xs ${textSecondary} mb-1`}>{city.condition}</p>
            <p className={`text-[10px] ${textSecondary} mb-3`}>{city.description}</p>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] ${textSecondary}`}>{city.humidity}% humidity</span>
              <span className={`text-lg font-black ${city.failureMultiplier > 2 ? 'text-red-400' : 'text-amber-400'}`} style={{ fontFamily: 'var(--font-display)' }}>
                {city.failureMultiplier}x
              </span>
            </div>
            <p className={`text-[9px] mt-1 ${textSecondary}`}>failure multiplier</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scatter: Temperature vs Failure Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`p-6 rounded-2xl border ${cardBg}`}
        >
          <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontFamily: 'var(--font-display)' }}>
            Ambient Temperature vs Failure Rate
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis
                type="number"
                dataKey="temperature"
                name="Temperature"
                unit="°C"
                stroke={isDark ? '#475569' : '#94a3b8'}
                fontSize={11}
              />
              <YAxis
                type="number"
                dataKey="failure_rate"
                name="Failure Rate"
                unit="%"
                stroke={isDark ? '#475569' : '#94a3b8'}
                fontSize={11}
              />
              <Tooltip
                contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '8px', fontSize: '12px' }}
                formatter={(value: any, name: any) => [
                  name === 'Temperature' ? `${value}°C` : `${value}%`,
                  name,
                ]}
              />
              <Scatter data={scatterData} fill="#06b6d4">
                {scatterData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.temperature > 40 ? '#ef4444' : entry.temperature > 30 ? '#f59e0b' : '#06b6d4'}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <p className={`text-[10px] mt-2 ${textSecondary}`}>
            Positive correlation: higher ambient temperatures significantly increase failure probability
          </p>
        </motion.div>

        {/* Bar: Failure Rate by Season */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`p-6 rounded-2xl border ${cardBg}`}
        >
          <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontFamily: 'var(--font-display)' }}>
            Failure Rate by Season (%)
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={seasonData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="season" stroke={isDark ? '#475569' : '#94a3b8'} fontSize={11} />
              <YAxis stroke={isDark ? '#475569' : '#94a3b8'} fontSize={11} unit="%" />
              <Tooltip
                contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '8px', fontSize: '12px' }}
                formatter={(value: any) => [`${value}%`, 'Failure Rate']}
              />
              <Bar dataKey="failure_rate" radius={[6, 6, 0, 0]}>
                {seasonData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className={`text-[10px] mt-2 ${textSecondary}`}>
            Monsoon season shows 4x higher failure rate compared to winter
          </p>
        </motion.div>
      </div>

      {/* Insight Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className={`p-4 rounded-2xl border ${cardBg} flex items-start gap-3`}
          >
            <insight.icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${insight.color}`} />
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {insight.text}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Weather Risk Zone Chargers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className={`rounded-2xl border ${cardBg} overflow-hidden`}
      >
        <div className={`px-6 py-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'} flex items-center gap-2`}>
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h3 className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontFamily: 'var(--font-display)' }}>
            Chargers in Weather Risk Zones
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={isDark ? 'bg-slate-900/50' : 'bg-slate-50'}>
                <th className={`px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider ${textSecondary}`}>Charger ID</th>
                <th className={`px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider ${textSecondary}`}>City</th>
                <th className={`px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider ${textSecondary}`}>Temperature</th>
                <th className={`px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider ${textSecondary}`}>Risk Level</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800/50' : 'divide-slate-100'}`}>
              {weatherRiskChargers.length === 0 ? (
                <tr>
                  <td colSpan={4} className={`px-6 py-8 text-center ${textSecondary}`}>
                    No chargers currently in weather risk zones.
                  </td>
                </tr>
              ) : (
                weatherRiskChargers.map(c => (
                  <tr key={c.charger_id} className={isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}>
                    <td className={`px-6 py-3 font-mono text-xs font-semibold ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>
                      {c.charger_id}
                    </td>
                    <td className={`px-6 py-3 text-xs ${textPrimary}`}>{c.city}</td>
                    <td className={`px-6 py-3 text-right text-xs font-semibold ${c.temperature > 65 ? 'text-red-400' : 'text-amber-400'}`}>
                      {c.temperature}°C
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        c.risk === 'CRITICAL' ? 'bg-red-500/10 text-red-400' :
                        c.risk === 'HIGH' ? 'bg-orange-500/10 text-orange-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          c.risk === 'CRITICAL' ? 'bg-red-500' : c.risk === 'HIGH' ? 'bg-orange-500' : 'bg-amber-500'
                        }`} />
                        {c.risk}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

