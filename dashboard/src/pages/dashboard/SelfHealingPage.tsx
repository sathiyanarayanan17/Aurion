import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Cpu, RefreshCw, Power, CheckCircle2, XCircle, Clock, Shield } from 'lucide-react';
import { useFleet } from '../../context/FleetContext';

type ActionStatus = 'Executed' | 'Pending' | 'Failed';
type ActionType = 'Power De-rating' | 'Firmware Restart' | 'Cooldown Pause' | 'Load Balancing' | 'Scheduled OTA Update';

interface HealingAction {
  id: string;
  charger_id: string;
  action_type: ActionType;
  trigger_reason: string;
  timestamp: string;
  status: ActionStatus;
  outcome: string;
}

const mockActions: HealingAction[] = [
  { id: 'HA-001', charger_id: 'CHG-MUM-004', action_type: 'Power De-rating', trigger_reason: 'Temperature exceeded 70°C threshold', timestamp: '2026-08-27T10:12:00', status: 'Executed', outcome: 'Temperature reduced from 72°C to 55°C' },
  { id: 'HA-002', charger_id: 'CHG-DEL-012', action_type: 'Firmware Restart', trigger_reason: 'Communication timeout (>30s)', timestamp: '2026-08-27T09:45:00', status: 'Executed', outcome: 'Charger back online in 8 seconds' },
  { id: 'HA-003', charger_id: 'CHG-BLR-007', action_type: 'Cooldown Pause', trigger_reason: 'Thermal runaway risk detected', timestamp: '2026-08-27T09:30:00', status: 'Executed', outcome: 'Charging paused 12 min, temp normalized to 48°C' },
  { id: 'HA-004', charger_id: 'CHG-CHN-019', action_type: 'Load Balancing', trigger_reason: 'Power draw exceeded 95% capacity', timestamp: '2026-08-27T09:15:00', status: 'Executed', outcome: 'Sessions redistributed to CHG-CHN-020, CHG-CHN-021' },
  { id: 'HA-005', charger_id: 'CHG-HYD-003', action_type: 'Scheduled OTA Update', trigger_reason: 'Firmware v2.4.1 available (security patch)', timestamp: '2026-08-27T08:00:00', status: 'Executed', outcome: 'Firmware updated during idle window (2am-4am)' },
  { id: 'HA-006', charger_id: 'CHG-PUN-008', action_type: 'Power De-rating', trigger_reason: 'Voltage fluctuation detected (>10%)', timestamp: '2026-08-27T07:45:00', status: 'Executed', outcome: 'Output reduced to 60kW, voltage stabilized' },
  { id: 'HA-007', charger_id: 'CHG-KOL-002', action_type: 'Firmware Restart', trigger_reason: 'Watchdog timer expired', timestamp: '2026-08-27T07:20:00', status: 'Failed', outcome: 'Restart failed — hardware fault escalated to maintenance' },
  { id: 'HA-008', charger_id: 'CHG-JAI-015', action_type: 'Cooldown Pause', trigger_reason: 'Ambient temp + load thermal compound', timestamp: '2026-08-27T06:50:00', status: 'Pending', outcome: 'Awaiting current session completion to initiate pause' },
  { id: 'HA-009', charger_id: 'CHG-MUM-011', action_type: 'Load Balancing', trigger_reason: 'Grid demand peak detected (6-10pm)', timestamp: '2026-08-27T06:30:00', status: 'Executed', outcome: '3 sessions shifted to off-peak recommended chargers' },
  { id: 'HA-010', charger_id: 'CHG-DEL-005', action_type: 'Scheduled OTA Update', trigger_reason: 'Firmware v2.4.1 available', timestamp: '2026-08-27T05:00:00', status: 'Pending', outcome: 'Scheduled for next idle window tonight' },
];

const policyRules = [
  { condition: 'IF temperature > 68°C for 3+ minutes', action: 'THEN reduce output power by 40% and notify operator', priority: 'Critical' },
  { condition: 'IF communication lost for > 30 seconds', action: 'THEN initiate firmware soft-restart (max 2 retries)', priority: 'High' },
  { condition: 'IF power draw > 95% rated capacity', action: 'THEN redirect new sessions to nearest available charger', priority: 'Medium' },
  { condition: 'IF idle for > 4 hours AND OTA update pending', action: 'THEN apply firmware update with automatic rollback on failure', priority: 'Low' },
];

export function SelfHealingPage() {
  const { theme } = useFleet();
  const isDark = theme === 'black' || theme === 'dark';
  const [autonomousMode, setAutonomousMode] = useState(true);

  const stats = useMemo(() => {
    const executed = mockActions.filter(a => a.status === 'Executed').length;
    const failed = mockActions.filter(a => a.status === 'Failed').length;
    return {
      totalToday: mockActions.length,
      failuresPrevented: executed,
      avgResponseTime: '2.3s',
      successRate: Math.round((executed / (executed + failed)) * 100),
    };
  }, []);

  const cardBg = isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-500';

  const statusColors: Record<ActionStatus, string> = {
    Executed: 'bg-emerald-500/10 text-emerald-400',
    Pending: 'bg-amber-500/10 text-amber-400',
    Failed: 'bg-red-500/10 text-red-400',
  };

  const statusDot: Record<ActionStatus, string> = {
    Executed: 'bg-emerald-500',
    Pending: 'bg-amber-500',
    Failed: 'bg-red-500',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-500 to-purple-500 shadow-lg shadow-violet-500/20">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className={`text-2xl font-black tracking-tight ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
              Self-Healing Actions
            </h1>
            <p className={`text-sm ${textSecondary}`}>Autonomous actions taken to prevent failures</p>
          </div>
        </div>

        {/* Autonomous Mode Toggle */}
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${cardBg}`}>
          <span className={`text-xs font-medium ${textSecondary}`}>Autonomous Mode</span>
          <button
            onClick={() => setAutonomousMode(!autonomousMode)}
            className={`relative w-11 h-6 rounded-full transition-colors ${autonomousMode ? 'bg-emerald-500' : isDark ? 'bg-slate-700' : 'bg-slate-300'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${autonomousMode ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
          </button>
          <span className={`text-xs font-bold ${autonomousMode ? 'text-emerald-400' : 'text-slate-500'}`}>
            {autonomousMode ? 'ON' : 'OFF'}
          </span>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`p-5 rounded-2xl border ${cardBg}`}>
          <Cpu className="w-5 h-5 text-violet-400 mb-3" />
          <p className={`text-2xl font-bold ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>{stats.totalToday}</p>
          <p className={`text-xs mt-1 ${textSecondary}`}>Actions Today</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={`p-5 rounded-2xl border ${cardBg}`}>
          <Shield className="w-5 h-5 text-emerald-400 mb-3" />
          <p className={`text-2xl font-bold ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>{stats.failuresPrevented}</p>
          <p className={`text-xs mt-1 ${textSecondary}`}>Failures Prevented</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`p-5 rounded-2xl border ${cardBg}`}>
          <Clock className="w-5 h-5 text-cyan-400 mb-3" />
          <p className={`text-2xl font-bold ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>{stats.avgResponseTime}</p>
          <p className={`text-xs mt-1 ${textSecondary}`}>Avg Response Time</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className={`p-5 rounded-2xl border ${cardBg}`}>
          <CheckCircle2 className="w-5 h-5 text-green-400 mb-3" />
          <p className={`text-2xl font-bold ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>{stats.successRate}%</p>
          <p className={`text-xs mt-1 ${textSecondary}`}>Success Rate</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline View */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`lg:col-span-1 p-6 rounded-2xl border ${cardBg}`}
        >
          <h3 className={`text-sm font-semibold mb-5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontFamily: 'var(--font-display)' }}>
            Action Timeline
          </h3>
          <div className="relative space-y-0">
            {/* Vertical line */}
            <div className={`absolute left-[7px] top-2 bottom-2 w-px ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
            {mockActions.slice(0, 7).map((action, i) => (
              <div key={action.id} className="relative flex items-start gap-3 pb-5 last:pb-0">
                {/* Dot */}
                <div className={`relative z-10 w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 mt-0.5 ${
                  action.status === 'Executed' ? 'bg-emerald-500 border-emerald-400' :
                  action.status === 'Failed' ? 'bg-red-500 border-red-400' :
                  'bg-amber-500 border-amber-400'
                }`} />
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${textPrimary}`}>{action.action_type}</p>
                  <p className={`text-[10px] ${textSecondary} truncate`}>{action.charger_id}</p>
                  <p className={`text-[10px] ${textSecondary}`}>
                    {new Date(action.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Action Log Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`lg:col-span-2 rounded-2xl border ${cardBg} overflow-hidden`}
        >
          <div className={`px-6 py-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <h3 className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontFamily: 'var(--font-display)' }}>
              Action Log
            </h3>
          </div>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className={`sticky top-0 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
                <tr>
                  <th className={`px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider ${textSecondary}`}>Action</th>
                  <th className={`px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider ${textSecondary}`}>Charger</th>
                  <th className={`px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider ${textSecondary}`}>Trigger</th>
                  <th className={`px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider ${textSecondary}`}>Status</th>
                  <th className={`px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider ${textSecondary}`}>Outcome</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800/50' : 'divide-slate-100'}`}>
                {mockActions.map(action => (
                  <tr key={action.id} className={isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}>
                    <td className={`px-4 py-3 text-xs font-medium ${textPrimary}`}>{action.action_type}</td>
                    <td className={`px-4 py-3 font-mono text-xs ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>{action.charger_id}</td>
                    <td className={`px-4 py-3 text-[11px] max-w-[200px] truncate ${textSecondary}`}>{action.trigger_reason}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColors[action.status]}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusDot[action.status]}`} />
                        {action.status}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-[11px] max-w-[220px] truncate ${textSecondary}`}>{action.outcome}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Policy Rules */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={`p-6 rounded-2xl border ${cardBg}`}
      >
        <div className="flex items-center gap-2 mb-5">
          <RefreshCw className="w-4 h-4 text-violet-400" />
          <h3 className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontFamily: 'var(--font-display)' }}>
            Autonomous Policy Rules
          </h3>
        </div>
        <div className="space-y-3">
          {policyRules.map((rule, i) => (
            <div
              key={i}
              className={`flex items-start gap-4 p-4 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-900/30' : 'border-slate-100 bg-slate-50/50'}`}
            >
              <div className={`flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                rule.priority === 'Critical' ? 'bg-red-500/10 text-red-400' :
                rule.priority === 'High' ? 'bg-orange-500/10 text-orange-400' :
                rule.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400' :
                'bg-slate-500/10 text-slate-400'
              }`}>
                {rule.priority}
              </div>
              <div className="flex-1">
                <p className={`text-xs font-semibold ${textPrimary}`}>{rule.condition}</p>
                <p className={`text-[11px] mt-1 ${textSecondary}`}>{rule.action}</p>
              </div>
              <Power className={`w-4 h-4 flex-shrink-0 ${autonomousMode ? 'text-emerald-400' : 'text-slate-600'}`} />
            </div>
          ))}
        </div>
        {!autonomousMode && (
          <div className={`mt-4 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5`}>
            <p className="text-xs text-amber-400 font-medium">⚠️ Autonomous mode is OFF — actions require manual approval</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
