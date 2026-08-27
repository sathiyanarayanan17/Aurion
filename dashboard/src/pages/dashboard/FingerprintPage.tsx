import { useState, useMemo } from 'react';
import { useFleet } from '../../context/FleetContext';
import { Fingerprint, Scan, Activity, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

type FaultSignature = 'thermal_runaway' | 'connector_degradation' | 'power_instability' | 'firmware_crash';

interface SignatureInfo {
  id: FaultSignature;
  label: string;
  description: string;
  accentFrom: string;
  accentTo: string;
  fillColor: string;
  strokeColor: string;
  bgClass: string;
  borderClass: string;
}

const SIGNATURES: SignatureInfo[] = [
  {
    id: 'thermal_runaway',
    label: 'Thermal Runaway',
    description: 'Rising temperature slope with voltage dip',
    accentFrom: 'from-red-500',
    accentTo: 'to-red-700',
    fillColor: 'rgba(239, 68, 68, 0.2)',
    strokeColor: '#ef4444',
    bgClass: 'bg-red-500/5',
    borderClass: 'border-red-500/20',
  },
  {
    id: 'connector_degradation',
    label: 'Connector Degradation',
    description: 'Intermittent current drops (spiky pattern)',
    accentFrom: 'from-amber-500',
    accentTo: 'to-amber-700',
    fillColor: 'rgba(245, 158, 11, 0.2)',
    strokeColor: '#f59e0b',
    bgClass: 'bg-amber-500/5',
    borderClass: 'border-amber-500/20',
  },
  {
    id: 'power_instability',
    label: 'Power Instability',
    description: 'High voltage variance (noisy sine wave)',
    accentFrom: 'from-blue-500',
    accentTo: 'to-blue-700',
    fillColor: 'rgba(59, 130, 246, 0.2)',
    strokeColor: '#3b82f6',
    bgClass: 'bg-blue-500/5',
    borderClass: 'border-blue-500/20',
  },
  {
    id: 'firmware_crash',
    label: 'Firmware Crash',
    description: 'Sudden flatline after erratic readings',
    accentFrom: 'from-purple-500',
    accentTo: 'to-purple-700',
    fillColor: 'rgba(168, 85, 247, 0.2)',
    strokeColor: '#a855f7',
    bgClass: 'bg-purple-500/5',
    borderClass: 'border-purple-500/20',
  },
];

function generateSignatureData(type: FaultSignature): { value: number }[] {
  const points: { value: number }[] = [];
  for (let i = 0; i < 50; i++) {
    let val: number;
    switch (type) {
      case 'thermal_runaway':
        // Rising slope with dip near end
        val = 20 + (i / 50) * 60 + Math.random() * 5;
        if (i > 38) val -= (i - 38) * 3; // voltage dip
        break;
      case 'connector_degradation':
        // Spiky pattern — intermittent drops
        val = 50 + Math.random() * 10;
        if (i % 7 === 0 || i % 11 === 0) val -= 25 + Math.random() * 15; // sudden drops
        break;
      case 'power_instability':
        // Noisy sine wave
        val = 50 + Math.sin(i * 0.4) * 20 + (Math.random() - 0.5) * 25;
        break;
      case 'firmware_crash':
        // Erratic then flatline
        if (i < 30) {
          val = 50 + (Math.random() - 0.5) * 40;
        } else {
          val = 5 + Math.random() * 2; // flatline
        }
        break;
    }
    points.push({ value: Math.max(0, val) });
  }
  return points;
}

function computeMatchScores(chargerTemp: number, chargerVoltage: number, chargerCurrent: number): Record<FaultSignature, number> {
  // Simple heuristic-based matching
  const tempScore = Math.min(100, Math.max(0, (chargerTemp - 30) * 2.5)); // Higher temp → thermal match
  const voltageVariance = Math.abs(chargerVoltage - 400); // deviation from nominal
  const currentDrop = chargerCurrent < 5 ? 60 : 0;

  const thermal = Math.min(99, Math.round(tempScore * 0.8 + Math.random() * 10));
  const connector = Math.min(99, Math.round(currentDrop + voltageVariance * 0.2 + Math.random() * 15));
  const power = Math.min(99, Math.round(voltageVariance * 0.8 + Math.random() * 12));
  const firmware = Math.min(99, Math.round(15 + Math.random() * 20));

  return {
    thermal_runaway: thermal,
    connector_degradation: connector,
    power_instability: power,
    firmware_crash: firmware,
  };
}

function getRecommendation(topMatch: FaultSignature): string {
  switch (topMatch) {
    case 'thermal_runaway': return 'Check cooling system and thermal paste. Reduce charging power.';
    case 'connector_degradation': return 'Inspect connector pins for corrosion. Schedule connector replacement.';
    case 'power_instability': return 'Check grid connection and power electronics. Test capacitors.';
    case 'firmware_crash': return 'Update firmware to latest version. Check memory utilization.';
  }
}

export function FingerprintPage() {
  const { chargers, theme } = useFleet();
  const isDark = theme === 'black' || theme === 'dark';

  const [selectedChargerId, setSelectedChargerId] = useState<string>(chargers[0]?.charger_id || '');

  const signatureData = useMemo(() => {
    return SIGNATURES.map(sig => ({
      ...sig,
      data: generateSignatureData(sig.id),
    }));
  }, []);

  const matchResult = useMemo(() => {
    const charger = chargers.find(c => c.charger_id === selectedChargerId);
    if (!charger) return null;

    const scores = computeMatchScores(charger.temperature, charger.voltage, charger.current);
    const entries = Object.entries(scores) as [FaultSignature, number][];
    entries.sort((a, b) => b[1] - a[1]);

    const topMatch = entries[0];
    return {
      scores,
      topMatch: topMatch[0],
      topScore: topMatch[1],
      recommendation: getRecommendation(topMatch[0]),
      charger,
    };
  }, [selectedChargerId, chargers]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Fingerprint className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Degradation Fingerprints</h1>
          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Identify failure patterns by matching telemetry signatures
          </p>
        </div>
      </motion.div>

      {/* Fingerprint Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {signatureData.map((sig, idx) => (
          <motion.div
            key={sig.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className={`rounded-xl border overflow-hidden ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-black/[0.06]'}`}
          >
            {/* Accent gradient bar */}
            <div className={`h-1 bg-gradient-to-r ${sig.accentFrom} ${sig.accentTo}`} />

            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" style={{ color: sig.strokeColor }} />
                <h3 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {sig.label}
                </h3>
              </div>
              <p className={`text-[10px] leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {sig.description}
              </p>

              {/* Sparkline */}
              <div className="h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sig.data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                    <YAxis hide domain={[0, 'auto']} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={sig.strokeColor}
                      fill={sig.fillColor}
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Match score if charger selected */}
              {matchResult && (
                <div className={`flex items-center justify-between pt-2 border-t ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
                  <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Match</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-16 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-black/[0.06]'}`}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${matchResult.scores[sig.id]}%`,
                          backgroundColor: sig.strokeColor,
                        }}
                      />
                    </div>
                    <span className={`text-[10px] font-bold ${matchResult.topMatch === sig.id ? 'text-emerald-400' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {matchResult.scores[sig.id]}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Match Analysis Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className={`rounded-2xl border p-6 space-y-5 ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-black/[0.06]'}`}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Scan className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
            <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: 'var(--font-display)' }}>
              Match Analysis
            </h2>
          </div>

          {/* Charger Selector */}
          <select
            value={selectedChargerId}
            onChange={(e) => setSelectedChargerId(e.target.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border outline-none transition-colors ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white' : 'bg-white border-black/[0.08] text-slate-900'}`}
          >
            {chargers.map(c => (
              <option key={c.charger_id} value={c.charger_id} className={isDark ? 'bg-[#0a0a1a]' : 'bg-white'}>
                {c.charger_id} — {c.location.city || 'Unknown'}
              </option>
            ))}
          </select>
        </div>

        {matchResult && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Diagnosis */}
            <div className={`rounded-xl border p-4 space-y-3 ${isDark ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-emerald-50 border-emerald-200'}`}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className={`text-xs font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Diagnosis</span>
              </div>
              <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {matchResult.topScore}% match to{' '}
                <span className="text-emerald-400">{matchResult.topMatch.replace(/_/g, ' ')}</span> pattern.
              </p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Recommended action: {matchResult.recommendation}
              </p>
            </div>

            {/* Charger Info */}
            <div className={`rounded-xl border p-4 space-y-3 ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'}`}>
              <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Charger Telemetry — {matchResult.charger.charger_id}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className={`text-[10px] block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Temperature</span>
                  <span className={`text-sm font-bold ${matchResult.charger.temperature > 55 ? 'text-red-400' : isDark ? 'text-white' : 'text-slate-900'}`}>
                    {matchResult.charger.temperature.toFixed(1)}°C
                  </span>
                </div>
                <div>
                  <span className={`text-[10px] block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Voltage</span>
                  <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {matchResult.charger.voltage.toFixed(1)} V
                  </span>
                </div>
                <div>
                  <span className={`text-[10px] block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Current</span>
                  <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {matchResult.charger.current.toFixed(1)} A
                  </span>
                </div>
                <div>
                  <span className={`text-[10px] block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Health Score</span>
                  <span className={`text-sm font-bold ${matchResult.charger.health_score < 50 ? 'text-red-400' : matchResult.charger.health_score < 75 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                    {matchResult.charger.health_score}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All match scores breakdown */}
        {matchResult && (
          <div className="space-y-2">
            <h4 className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              All Pattern Scores
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SIGNATURES.map(sig => (
                <div
                  key={sig.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${matchResult.topMatch === sig.id ? (isDark ? sig.bgClass + ' ' + sig.borderClass : sig.bgClass + ' ' + sig.borderClass) : (isDark ? 'bg-white/[0.02] border-white/[0.04]' : 'bg-slate-50 border-slate-100')}`}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sig.strokeColor }} />
                  <span className={`text-xs flex-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{sig.label}</span>
                  <span className={`text-xs font-bold ${matchResult.topMatch === sig.id ? 'text-emerald-400' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {matchResult.scores[sig.id]}%
                  </span>
                  {matchResult.topMatch === sig.id && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">BEST</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
