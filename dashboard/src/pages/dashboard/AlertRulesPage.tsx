import { useState } from 'react';
import { useFleet } from '../../context/FleetContext';
import { Filter, Plus, ToggleRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Metric = 'temperature' | 'voltage' | 'current' | 'power_kw' | 'health_score';
type Operator = '>' | '<' | '>=' | '<=' | '==';
type Severity = 'Critical' | 'High' | 'Medium';

interface RuleCondition {
  metric: Metric;
  operator: Operator;
  threshold: number;
}

interface AlertRule {
  id: string;
  name: string;
  conditions: RuleCondition[];
  severity: Severity;
  cooldown_minutes: number;
  enabled: boolean;
}

const MOCK_RULES: AlertRule[] = [
  {
    id: 'rule-1',
    name: 'Overheating Alert',
    conditions: [{ metric: 'temperature', operator: '>', threshold: 55 }],
    severity: 'Critical',
    cooldown_minutes: 15,
    enabled: true,
  },
  {
    id: 'rule-2',
    name: 'Low Voltage Warning',
    conditions: [{ metric: 'voltage', operator: '<', threshold: 370 }],
    severity: 'High',
    cooldown_minutes: 30,
    enabled: true,
  },
  {
    id: 'rule-3',
    name: 'High Current Draw',
    conditions: [{ metric: 'current', operator: '>', threshold: 120 }],
    severity: 'Medium',
    cooldown_minutes: 60,
    enabled: false,
  },
  {
    id: 'rule-4',
    name: 'Critical Health Degradation',
    conditions: [
      { metric: 'health_score', operator: '<', threshold: 30 },
      { metric: 'temperature', operator: '>', threshold: 50 },
    ],
    severity: 'Critical',
    cooldown_minutes: 10,
    enabled: true,
  },
  {
    id: 'rule-5',
    name: 'Power Spike Detection',
    conditions: [{ metric: 'power_kw', operator: '>', threshold: 150 }],
    severity: 'High',
    cooldown_minutes: 20,
    enabled: true,
  },
];

const METRICS: Metric[] = ['temperature', 'voltage', 'current', 'power_kw', 'health_score'];
const OPERATORS: Operator[] = ['>', '<', '>=', '<=', '=='];
const SEVERITIES: Severity[] = ['Critical', 'High', 'Medium'];

function metricLabel(m: Metric): string {
  const labels: Record<Metric, string> = {
    temperature: 'Temperature (°C)',
    voltage: 'Voltage (V)',
    current: 'Current (A)',
    power_kw: 'Power (kW)',
    health_score: 'Health Score',
  };
  return labels[m];
}

function severityColor(s: Severity, isDark: boolean): string {
  if (s === 'Critical') return 'text-red-400';
  if (s === 'High') return isDark ? 'text-amber-400' : 'text-amber-600';
  return isDark ? 'text-blue-400' : 'text-blue-600';
}

function severityBg(s: Severity, isDark: boolean): string {
  if (s === 'Critical') return isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200';
  if (s === 'High') return isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200';
  return isDark ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200';
}

export function AlertRulesPage() {
  const { theme, chargers } = useFleet();
  const isDark = theme === 'black' || theme === 'dark';

  const [rules, setRules] = useState<AlertRule[]>(MOCK_RULES);
  const [showForm, setShowForm] = useState(false);
  const [testResult, setTestResult] = useState<{ ruleId: string; count: number } | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formConditions, setFormConditions] = useState<RuleCondition[]>([
    { metric: 'temperature', operator: '>', threshold: 50 },
  ]);
  const [formSeverity, setFormSeverity] = useState<Severity>('Medium');
  const [formCooldown, setFormCooldown] = useState(30);

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const testRule = (rule: AlertRule) => {
    const matchCount = chargers.filter(charger => {
      return rule.conditions.every(cond => {
        const value = charger[cond.metric as keyof typeof charger] as number;
        switch (cond.operator) {
          case '>': return value > cond.threshold;
          case '<': return value < cond.threshold;
          case '>=': return value >= cond.threshold;
          case '<=': return value <= cond.threshold;
          case '==': return value === cond.threshold;
          default: return false;
        }
      });
    }).length;
    setTestResult({ ruleId: rule.id, count: matchCount });
    setTimeout(() => setTestResult(null), 4000);
  };

  const addCondition = () => {
    setFormConditions(prev => [...prev, { metric: 'temperature', operator: '>', threshold: 50 }]);
  };

  const removeCondition = (idx: number) => {
    setFormConditions(prev => prev.filter((_, i) => i !== idx));
  };

  const updateCondition = (idx: number, field: keyof RuleCondition, value: string | number) => {
    setFormConditions(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };

  const submitRule = () => {
    if (!formName.trim()) return;
    const newRule: AlertRule = {
      id: `rule-${Date.now()}`,
      name: formName,
      conditions: formConditions,
      severity: formSeverity,
      cooldown_minutes: formCooldown,
      enabled: true,
    };
    setRules(prev => [...prev, newRule]);
    setShowForm(false);
    setFormName('');
    setFormConditions([{ metric: 'temperature', operator: '>', threshold: 50 }]);
    setFormSeverity('Medium');
    setFormCooldown(30);
  };

  const cardBg = isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-500';
  const textMuted = isDark ? 'text-slate-500' : 'text-slate-400';
  const inputBg = isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-black tracking-tight ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
            Alert Rules Engine
          </h1>
          <p className={`text-sm mt-1 ${textSecondary}`}>Define custom alert rules for your fleet</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 text-white font-medium text-sm hover:bg-cyan-400 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Rule
        </button>
      </div>

      {/* Add Rule Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className={`p-6 rounded-2xl border ${cardBg} space-y-5`}>
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-cyan-400" />
                <h3 className={`font-semibold ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>New Rule</h3>
              </div>

              {/* Rule Name */}
              <div>
                <label className={`text-sm font-medium ${textSecondary}`}>Rule Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. Overheating Alert"
                  className={`mt-1 w-full px-4 py-2.5 rounded-xl border text-sm ${inputBg} focus:outline-none focus:ring-2 focus:ring-cyan-500/50`}
                />
              </div>

              {/* Conditions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className={`text-sm font-medium ${textSecondary}`}>Conditions</label>
                  <button
                    onClick={addCondition}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    + Add Condition
                  </button>
                </div>
                {formConditions.map((cond, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {idx > 0 && <span className={`text-xs font-bold ${textMuted}`}>AND</span>}
                    <select
                      value={cond.metric}
                      onChange={e => updateCondition(idx, 'metric', e.target.value)}
                      className={`px-3 py-2 rounded-lg border text-sm ${inputBg} focus:outline-none`}
                    >
                      {METRICS.map(m => (
                        <option key={m} value={m}>{metricLabel(m)}</option>
                      ))}
                    </select>
                    <select
                      value={cond.operator}
                      onChange={e => updateCondition(idx, 'operator', e.target.value)}
                      className={`px-3 py-2 rounded-lg border text-sm font-mono ${inputBg} focus:outline-none`}
                    >
                      {OPERATORS.map(op => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={cond.threshold}
                      onChange={e => updateCondition(idx, 'threshold', Number(e.target.value))}
                      className={`w-24 px-3 py-2 rounded-lg border text-sm ${inputBg} focus:outline-none`}
                    />
                    {formConditions.length > 1 && (
                      <button
                        onClick={() => removeCondition(idx)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Severity & Cooldown */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-sm font-medium ${textSecondary}`}>Severity</label>
                  <div className="flex gap-2 mt-2">
                    {SEVERITIES.map(s => (
                      <button
                        key={s}
                        onClick={() => setFormSeverity(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          formSeverity === s
                            ? severityBg(s, isDark) + ' ' + severityColor(s, isDark)
                            : isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={`text-sm font-medium ${textSecondary}`}>Cooldown (minutes)</label>
                  <input
                    type="number"
                    value={formCooldown}
                    onChange={e => setFormCooldown(Number(e.target.value))}
                    className={`mt-2 w-full px-4 py-2 rounded-xl border text-sm ${inputBg} focus:outline-none focus:ring-2 focus:ring-cyan-500/50`}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={submitRule}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 text-white font-medium text-sm hover:bg-cyan-400 transition-colors"
                >
                  Create Rule
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className={`px-5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                    isDark ? 'border-slate-700 text-slate-400 hover:text-white' : 'border-slate-300 text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rules List */}
      <div className="space-y-3">
        {rules.map((rule, i) => (
          <motion.div
            key={rule.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`p-5 rounded-2xl border ${cardBg} ${!rule.enabled ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <h3 className={`font-semibold text-sm ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
                    {rule.name}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${severityBg(rule.severity, isDark)} ${severityColor(rule.severity, isDark)}`}>
                    {rule.severity}
                  </span>
                </div>

                {/* Conditions */}
                <div className="flex flex-wrap items-center gap-2">
                  {rule.conditions.map((cond, idx) => (
                    <span key={idx} className="flex items-center gap-1">
                      {idx > 0 && <span className={`text-xs font-bold ${textMuted}`}>AND</span>}
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-mono ${
                        isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {cond.metric} {cond.operator} {cond.threshold}
                      </span>
                    </span>
                  ))}
                </div>

                <p className={`text-xs ${textMuted}`}>Cooldown: {rule.cooldown_minutes} min</p>

                {/* Test Result */}
                <AnimatePresence>
                  {testResult?.ruleId === rule.id && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-cyan-400 font-medium"
                    >
                      ⚡ {testResult.count} charger{testResult.count !== 1 ? 's' : ''} would match this rule
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 ml-4">
                <button
                  onClick={() => testRule(rule)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    isDark ? 'border-slate-700 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30' : 'border-slate-200 text-slate-500 hover:text-cyan-600 hover:border-cyan-300'
                  }`}
                >
                  Test
                </button>
                <button
                  onClick={() => toggleRule(rule.id)}
                  className="relative"
                  aria-label={rule.enabled ? 'Disable rule' : 'Enable rule'}
                >
                  <ToggleRight className={`w-7 h-7 transition-colors ${
                    rule.enabled ? 'text-cyan-400' : isDark ? 'text-slate-600' : 'text-slate-300'
                  }`} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
