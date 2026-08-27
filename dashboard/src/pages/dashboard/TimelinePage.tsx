import { useState, useMemo } from 'react';
import { useFleet } from '../../context/FleetContext';
import { Clock, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';

type SegmentStatus = 'normal' | 'degrading' | 'warning' | 'failure';

interface TimelineEvent {
  start: number; // hours from beginning
  end: number;
  status: SegmentStatus;
  description: string;
}

const STATUS_COLORS: Record<SegmentStatus, string> = {
  normal: '#22c55e',
  degrading: '#eab308',
  warning: '#f97316',
  failure: '#ef4444',
};

const STATUS_LABELS: Record<SegmentStatus, string> = {
  normal: 'Normal',
  degrading: 'Degrading',
  warning: 'Warning',
  failure: 'Failure',
};

function generateTimelineEvents(chargerId: string): TimelineEvent[] {
  // Generate deterministic-ish events based on charger_id
  const hash = chargerId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const seed = hash % 5;

  const templates: TimelineEvent[][] = [
    // Pattern 0: Mostly healthy with brief degradation
    [
      { start: 0, end: 48, status: 'normal', description: 'Stable operation, all metrics within bounds' },
      { start: 48, end: 56, status: 'degrading', description: 'Temperature rising above baseline (+5°C)' },
      { start: 56, end: 72, status: 'normal', description: 'Temperature returned to baseline after load reduction' },
      { start: 72, end: 80, status: 'degrading', description: 'Voltage fluctuations detected (±8V)' },
      { start: 80, end: 88, status: 'warning', description: 'High voltage deviation (±15V), session interrupted' },
      { start: 88, end: 168, status: 'normal', description: 'Post-maintenance: metrics stabilized' },
    ],
    // Pattern 1: Progressive degradation to failure
    [
      { start: 0, end: 36, status: 'normal', description: 'Normal charging operation' },
      { start: 36, end: 60, status: 'degrading', description: 'Gradual temperature increase detected' },
      { start: 60, end: 84, status: 'warning', description: 'Temperature exceeding safe threshold (55°C)' },
      { start: 84, end: 96, status: 'failure', description: 'Thermal shutdown triggered, charger offline' },
      { start: 96, end: 120, status: 'warning', description: 'Recovery phase, limited operation' },
      { start: 120, end: 168, status: 'normal', description: 'Full recovery after maintenance' },
    ],
    // Pattern 2: Intermittent issues
    [
      { start: 0, end: 24, status: 'normal', description: 'Stable overnight charging' },
      { start: 24, end: 32, status: 'warning', description: 'Connection drops detected (3 in 8h)' },
      { start: 32, end: 72, status: 'normal', description: 'Stable after connector check' },
      { start: 72, end: 80, status: 'degrading', description: 'Error code E-204: minor sensor drift' },
      { start: 80, end: 96, status: 'normal', description: 'Sensor recalibrated' },
      { start: 96, end: 108, status: 'warning', description: 'High current draw during fast charge' },
      { start: 108, end: 168, status: 'normal', description: 'Operating within parameters' },
    ],
    // Pattern 3: Healthy charger
    [
      { start: 0, end: 60, status: 'normal', description: 'Excellent performance, all metrics green' },
      { start: 60, end: 68, status: 'degrading', description: 'Minor fluctuation during peak load' },
      { start: 68, end: 168, status: 'normal', description: 'Returned to optimal operation' },
    ],
    // Pattern 4: Critical scenario
    [
      { start: 0, end: 12, status: 'normal', description: 'Initial stable period' },
      { start: 12, end: 36, status: 'degrading', description: 'Increasing error rate (5 errors/hour)' },
      { start: 36, end: 48, status: 'warning', description: 'Error rate critical, performance degraded' },
      { start: 48, end: 72, status: 'failure', description: 'System fault: isolation failure detected' },
      { start: 72, end: 96, status: 'failure', description: 'Awaiting field technician dispatch' },
      { start: 96, end: 120, status: 'warning', description: 'Repair in progress, partial restoration' },
      { start: 120, end: 144, status: 'degrading', description: 'Post-repair burn-in testing' },
      { start: 144, end: 168, status: 'normal', description: 'Full service restored' },
    ],
  ];

  return templates[seed];
}

export function TimelinePage() {
  const { chargers, theme } = useFleet();
  const [selectedChargerId, setSelectedChargerId] = useState<string>(
    chargers[0]?.charger_id || ''
  );
  const [hoveredEvent, setHoveredEvent] = useState<TimelineEvent | null>(null);

  const events = useMemo(
    () => generateTimelineEvents(selectedChargerId),
    [selectedChargerId]
  );

  const TOTAL_HOURS = 168; // 7 days
  // Current time marker: simulate we're about 140 hours into the 7 day window
  const currentHour = 140;

  const summaryStats = useMemo(() => {
    let normal = 0, degraded = 0, warning = 0, failure = 0;
    events.forEach(e => {
      const duration = e.end - e.start;
      switch (e.status) {
        case 'normal': normal += duration; break;
        case 'degrading': degraded += duration; break;
        case 'warning': warning += duration; break;
        case 'failure': failure += duration; break;
      }
    });
    return { normal, degraded, warning, failure };
  }, [events]);

  const isDark = theme !== 'light';
  const borderColor = isDark ? 'border-slate-800' : 'border-slate-200';
  const cardBg = isDark ? 'bg-slate-950/50' : 'bg-white';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const textMuted = isDark ? 'text-slate-500' : 'text-slate-500';

  const dayLabels = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-black tracking-tight ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
            Anomaly Timeline
          </h1>
          <p className={`${textSecondary} text-sm mt-1`}>7-day operational status timeline per charger</p>
        </div>
        <div className="flex items-center gap-3">
          <CalendarDays className="w-5 h-5 text-cyan-400" />
          <select
            value={selectedChargerId}
            onChange={(e) => setSelectedChargerId(e.target.value)}
            className={`px-4 py-2 rounded-xl border ${borderColor} ${cardBg} ${textPrimary} text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50`}
          >
            {chargers.map((c) => (
              <option key={c.charger_id} value={c.charger_id}>
                {c.charger_id} — {c.location.city || 'Unknown'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-4 rounded-2xl border ${borderColor} ${cardBg}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className={`text-xs ${textMuted}`}>Normal</span>
          </div>
          <p className={`text-xl font-bold ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
            {summaryStats.normal}h
          </p>
          <p className={`text-xs ${textMuted}`}>{Math.round((summaryStats.normal / TOTAL_HOURS) * 100)}% of time</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className={`p-4 rounded-2xl border ${borderColor} ${cardBg}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className={`text-xs ${textMuted}`}>Degraded</span>
          </div>
          <p className={`text-xl font-bold ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
            {summaryStats.degraded}h
          </p>
          <p className={`text-xs ${textMuted}`}>{Math.round((summaryStats.degraded / TOTAL_HOURS) * 100)}% of time</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className={`p-4 rounded-2xl border ${borderColor} ${cardBg}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className={`text-xs ${textMuted}`}>Warning</span>
          </div>
          <p className={`text-xl font-bold ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
            {summaryStats.warning}h
          </p>
          <p className={`text-xs ${textMuted}`}>{Math.round((summaryStats.warning / TOTAL_HOURS) * 100)}% of time</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className={`p-4 rounded-2xl border ${borderColor} ${cardBg}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className={`text-xs ${textMuted}`}>Failure</span>
          </div>
          <p className={`text-xl font-bold ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
            {summaryStats.failure}h
          </p>
          <p className={`text-xs ${textMuted}`}>{Math.round((summaryStats.failure / TOTAL_HOURS) * 100)}% of time</p>
        </motion.div>
      </div>

      {/* Timeline Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`p-6 rounded-2xl border ${borderColor} ${cardBg}`}
      >
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-4 h-4 text-cyan-400" />
          <h3 className={`text-sm font-semibold ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
            Operational Status — Last 7 Days
          </h3>
        </div>

        {/* Day markers */}
        <div className="relative mb-2">
          <div className="flex justify-between">
            {dayLabels.map((label, i) => (
              <span key={i} className={`text-[10px] ${textMuted}`} style={{ width: `${100 / 7}%`, textAlign: 'center' }}>
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Timeline bar */}
        <div className="relative h-14 rounded-xl overflow-hidden border border-slate-700/50">
          {/* Segments */}
          <div className="absolute inset-0 flex">
            {events.map((event, idx) => {
              const widthPercent = ((event.end - event.start) / TOTAL_HOURS) * 100;
              const leftPercent = (event.start / TOTAL_HOURS) * 100;
              return (
                <div
                  key={idx}
                  className="absolute top-0 bottom-0 cursor-pointer transition-opacity hover:opacity-80"
                  style={{
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                    backgroundColor: STATUS_COLORS[event.status],
                  }}
                  onMouseEnter={() => setHoveredEvent(event)}
                  onMouseLeave={() => setHoveredEvent(null)}
                />
              );
            })}
          </div>

          {/* Current time marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
            style={{ left: `${(currentHour / TOTAL_HOURS) * 100}%` }}
          >
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-red-500 rounded text-[9px] text-white font-medium whitespace-nowrap">
              Now
            </div>
          </div>

          {/* Day separators */}
          {[24, 48, 72, 96, 120, 144].map(hour => (
            <div
              key={hour}
              className="absolute top-0 bottom-0 w-px opacity-30"
              style={{ left: `${(hour / TOTAL_HOURS) * 100}%`, backgroundColor: isDark ? '#475569' : '#94a3b8' }}
            />
          ))}
        </div>

        {/* Hover tooltip */}
        {hoveredEvent && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 p-4 rounded-xl border ${borderColor} ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[hoveredEvent.status] }} />
              <span className={`text-sm font-semibold ${textPrimary}`}>
                {STATUS_LABELS[hoveredEvent.status]}
              </span>
              <span className={`text-xs ${textMuted} ml-auto`}>
                Hour {hoveredEvent.start} – {hoveredEvent.end} ({hoveredEvent.end - hoveredEvent.start}h duration)
              </span>
            </div>
            <p className={`text-sm ${textSecondary}`}>{hoveredEvent.description}</p>
          </motion.div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 flex-wrap">
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: STATUS_COLORS[key as SegmentStatus] }} />
              <span className={`text-xs ${textMuted}`}>{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 ml-4">
            <div className="w-2.5 h-0.5 bg-red-500" />
            <span className={`text-xs ${textMuted}`}>Current Time</span>
          </div>
        </div>
      </motion.div>

      {/* Events List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className={`p-6 rounded-2xl border ${borderColor} ${cardBg}`}
      >
        <h3 className={`text-sm font-semibold ${textPrimary} mb-4`} style={{ fontFamily: 'var(--font-display)' }}>
          Event Log
        </h3>
        <div className="space-y-2">
          {events.map((event, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 p-3 rounded-xl border ${borderColor} transition-colors hover:bg-slate-800/30`}
            >
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[event.status] }} />
              <span className={`text-xs font-mono ${textMuted} w-24 flex-shrink-0`}>
                h{event.start}–h{event.end}
              </span>
              <span className={`text-xs font-medium w-16 flex-shrink-0 ${
                event.status === 'normal' ? 'text-green-400' :
                event.status === 'degrading' ? 'text-yellow-400' :
                event.status === 'warning' ? 'text-orange-400' : 'text-red-400'
              }`}>
                {STATUS_LABELS[event.status]}
              </span>
              <span className={`text-xs ${textSecondary} truncate`}>{event.description}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
