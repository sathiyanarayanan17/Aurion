import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useFleet } from '../../context/FleetContext';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { Play, Pause, RotateCcw, FastForward } from 'lucide-react';
import { motion } from 'framer-motion';

interface ReplayDataPoint {
  index: number;
  time: string;
  temperature: number;
  voltage: number;
  timestamp: number;
}

// Generate 100 data points simulating a degradation event:
// Phase 1 (0-40): Normal operation ~35°C
// Phase 2 (40-70): Gradual increase to ~55°C
// Phase 3 (70-90): Rapid spike to ~72°C
// Phase 4 (90-100): Failure / thermal shutdown
function generateDegradationData(): ReplayDataPoint[] {
  const startTime = new Date('2026-08-25T08:00:00').getTime();
  const intervalMs = 5 * 60 * 1000; // 5 minutes per data point

  return Array.from({ length: 100 }, (_, i) => {
    let temperature: number;
    let voltage: number;

    if (i < 40) {
      // Normal phase
      temperature = 34 + Math.random() * 3;
      voltage = 398 + Math.random() * 6;
    } else if (i < 70) {
      // Degradation phase
      const progress = (i - 40) / 30;
      temperature = 37 + progress * 18 + Math.random() * 2;
      voltage = 400 - progress * 12 + Math.random() * 4;
    } else if (i < 90) {
      // Rapid spike phase
      const progress = (i - 70) / 20;
      temperature = 55 + progress * 17 + Math.random() * 3;
      voltage = 388 - progress * 25 + Math.random() * 5;
    } else {
      // Failure phase
      temperature = 70 + Math.random() * 5;
      voltage = 360 - Math.random() * 15;
    }

    const ts = startTime + i * intervalMs;
    const date = new Date(ts);
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return {
      index: i,
      time,
      temperature: Math.round(temperature * 10) / 10,
      voltage: Math.round(voltage * 10) / 10,
      timestamp: ts,
    };
  });
}

type Speed = 1 | 5 | 10 | 50;

export function DataReplayPage() {
  const { theme } = useFleet();
  const [data] = useState<ReplayDataPoint[]>(() => generateDegradationData());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const [alertThreshold, setAlertThreshold] = useState(55);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const visibleData = useMemo(
    () => data.slice(0, currentIndex + 1),
    [data, currentIndex]
  );

  const currentPoint = data[currentIndex];

  const alertFiredAt = useMemo(() => {
    const point = data.find(d => d.temperature >= alertThreshold);
    return point ? point.index : null;
  }, [data, alertThreshold]);

  const startReplay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const pauseReplay = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const resetReplay = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex(0);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      const baseInterval = 200; // ms per tick at 1x
      const interval = baseInterval / speed;

      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= data.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, interval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, speed, data.length]);

  const isDark = theme !== 'light';
  const borderColor = isDark ? 'border-slate-800' : 'border-slate-200';
  const cardBg = isDark ? 'bg-slate-950/50' : 'bg-white';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const textMuted = isDark ? 'text-slate-500' : 'text-slate-500';
  const gridStroke = isDark ? '#1e293b' : '#e2e8f0';
  const axisStroke = isDark ? '#475569' : '#94a3b8';

  const progressPercent = (currentIndex / (data.length - 1)) * 100;

  const speeds: Speed[] = [1, 5, 10, 50];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-black tracking-tight ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
          Data Replay Mode
        </h1>
        <p className={`${textSecondary} text-sm mt-1`}>
          Replay historical telemetry — simulating a thermal degradation event
        </p>
      </div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-5 rounded-2xl border ${borderColor} ${cardBg}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Playback controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={isPlaying ? pauseReplay : startReplay}
              className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button
              onClick={resetReplay}
              className={`p-2.5 rounded-xl border ${borderColor} ${textSecondary} hover:text-cyan-300 transition-colors`}
              aria-label="Reset"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* Speed selector */}
          <div className="flex items-center gap-2">
            <FastForward className="w-4 h-4 text-violet-400" />
            <span className={`text-xs ${textMuted} mr-1`}>Speed:</span>
            {speeds.map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  speed === s
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/50'
                    : `border ${borderColor} ${textSecondary} hover:border-violet-500/30`
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Current timestamp */}
          <div className="sm:ml-auto text-right">
            <p className={`text-xs ${textMuted}`}>Current Time</p>
            <p className={`text-sm font-mono font-bold ${textPrimary}`}>
              {currentPoint?.time || '--:--'}
            </p>
            <p className={`text-xs ${textMuted}`}>Point {currentIndex + 1}/100</p>
          </div>
        </div>

        {/* Timeline scrubber */}
        <div className="mt-4">
          <div className="relative h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="absolute left-0 top-0 bottom-0 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-100"
              style={{ width: `${progressPercent}%` }}
            />
            {/* Alert fired marker */}
            {alertFiredAt !== null && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500"
                style={{ left: `${(alertFiredAt / (data.length - 1)) * 100}%` }}
                title={`Alert would fire at point ${alertFiredAt + 1}`}
              />
            )}
          </div>
          <input
            type="range"
            min={0}
            max={data.length - 1}
            value={currentIndex}
            onChange={(e) => {
              setCurrentIndex(parseInt(e.target.value));
              setIsPlaying(false);
            }}
            className="w-full mt-1 opacity-0 h-4 cursor-pointer absolute"
            style={{ marginTop: '-12px', position: 'relative' }}
            aria-label="Timeline scrubber"
          />
        </div>
      </motion.div>

      {/* Live Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temperature Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`p-6 rounded-2xl border ${borderColor} ${cardBg}`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-semibold ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
              Temperature (°C)
            </h3>
            <span className={`text-lg font-bold ${
              (currentPoint?.temperature || 0) > alertThreshold ? 'text-red-400' : 'text-cyan-400'
            }`} style={{ fontFamily: 'var(--font-display)' }}>
              {currentPoint?.temperature || 0}°C
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={visibleData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="time" stroke={axisStroke} fontSize={9} interval="preserveStartEnd" />
              <YAxis stroke={axisStroke} fontSize={10} domain={[25, 80]} />
              <Tooltip contentStyle={{ background: isDark ? '#0f172a' : '#fff', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '8px' }} />
              <ReferenceLine y={alertThreshold} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Threshold', position: 'right', fill: '#ef4444', fontSize: 10 }} />
              <Line
                type="monotone"
                dataKey="temperature"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Voltage Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={`p-6 rounded-2xl border ${borderColor} ${cardBg}`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-semibold ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
              Voltage (V)
            </h3>
            <span className={`text-lg font-bold text-cyan-400`} style={{ fontFamily: 'var(--font-display)' }}>
              {currentPoint?.voltage || 0}V
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={visibleData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="time" stroke={axisStroke} fontSize={9} interval="preserveStartEnd" />
              <YAxis stroke={axisStroke} fontSize={10} domain={[340, 410]} />
              <Tooltip contentStyle={{ background: isDark ? '#0f172a' : '#fff', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '8px' }} />
              <Line
                type="monotone"
                dataKey="voltage"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* What-If Threshold Slider */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`p-6 rounded-2xl border ${borderColor} ${cardBg}`}
      >
        <h3 className={`text-sm font-semibold ${textPrimary} mb-4`} style={{ fontFamily: 'var(--font-display)' }}>
          What-If Analysis: Alert Threshold
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs ${textMuted}`}>Temperature Alert Threshold</span>
              <span className={`text-sm font-bold ${textPrimary}`}>{alertThreshold}°C</span>
            </div>
            <input
              type="range"
              min={35}
              max={70}
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(parseInt(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #06b6d4 ${((alertThreshold - 35) / 35) * 100}%, ${isDark ? '#1e293b' : '#e2e8f0'} ${((alertThreshold - 35) / 35) * 100}%)`,
              }}
              aria-label="Alert threshold temperature"
            />
            <div className="flex justify-between mt-1">
              <span className={`text-[10px] ${textMuted}`}>35°C (Sensitive)</span>
              <span className={`text-[10px] ${textMuted}`}>70°C (Permissive)</span>
            </div>
          </div>
          <div className={`p-4 rounded-xl border ${borderColor} ${isDark ? 'bg-slate-900' : 'bg-slate-50'} min-w-[200px]`}>
            {alertFiredAt !== null ? (
              <>
                <p className={`text-xs ${textMuted}`}>Alert would fire at</p>
                <p className="text-lg font-bold text-red-400" style={{ fontFamily: 'var(--font-display)' }}>
                  Point {alertFiredAt + 1}
                </p>
                <p className={`text-xs ${textMuted}`}>
                  {data[alertFiredAt]?.time} — {data[alertFiredAt]?.temperature}°C
                </p>
                <p className={`text-xs mt-1 ${
                  alertFiredAt < 50 ? 'text-green-400' : alertFiredAt < 75 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {alertFiredAt < 50 ? '✓ Early detection' : alertFiredAt < 75 ? '⚠ Moderate detection' : '✗ Late detection'}
                </p>
              </>
            ) : (
              <>
                <p className={`text-xs ${textMuted}`}>Alert status</p>
                <p className="text-sm font-bold text-green-400">Never triggered</p>
                <p className={`text-xs ${textMuted}`}>Threshold too high for this event</p>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
