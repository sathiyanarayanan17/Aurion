import { useState } from 'react';
import { useFleet } from '../../context/FleetContext';
import { FileDown, FileText, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ExportFormat = 'CSV' | 'JSON' | 'PDF';

interface RecentReport {
  id: string;
  name: string;
  type: 'Weekly' | 'Monthly' | 'Fleet Export' | 'Alerts Export';
  date: string;
  format: ExportFormat;
}

const MOCK_REPORTS: RecentReport[] = [
  { id: 'rpt-1', name: 'Weekly Fleet Report', type: 'Weekly', date: '2026-08-25', format: 'PDF' },
  { id: 'rpt-2', name: 'Monthly Performance Report', type: 'Monthly', date: '2026-08-01', format: 'PDF' },
  { id: 'rpt-3', name: 'Fleet Data Export', type: 'Fleet Export', date: '2026-08-20', format: 'CSV' },
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = ['2024', '2025', '2026'];

export function ExportPage() {
  const { theme, chargers, alerts } = useFleet();
  const isDark = theme === 'black' || theme === 'dark';

  const [format, setFormat] = useState<ExportFormat>('CSV');
  const [selectedMonth, setSelectedMonth] = useState('August');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [toast, setToast] = useState<string | null>(null);
  const [recentReports] = useState<RecentReport[]>(MOCK_REPORTS);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleGenerateWeekly = () => {
    showToast('✓ Weekly report generated successfully');
  };

  const handleGenerateMonthly = () => {
    showToast('✓ Monthly report generated successfully');
  };

  const handleExportFleet = () => {
    showToast(`✓ Fleet data exported as ${format} (${chargers.length} chargers)`);
  };

  const handleExportAlerts = () => {
    showToast(`✓ Alerts exported as ${format} (${alerts.length} alerts)`);
  };

  const cardBg = isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-500';
  const textMuted = isDark ? 'text-slate-500' : 'text-slate-400';
  const inputBg = isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900';
  const tableBorder = isDark ? 'border-slate-800' : 'border-slate-200';

  return (
    <div className="space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 px-5 py-3 rounded-xl bg-emerald-500 text-white text-sm font-medium shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div>
        <h1 className={`text-2xl font-black tracking-tight ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
          Reports & Export
        </h1>
        <p className={`text-sm mt-1 ${textSecondary}`}>Generate reports and export fleet data</p>
      </div>

      {/* Date Range & Format */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-5 rounded-2xl border ${cardBg}`}
      >
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-cyan-400" />
          <h3 className={`font-semibold text-sm ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
            Export Settings
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className={`text-xs font-medium ${textSecondary}`}>Month</label>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className={`mt-1 block px-3 py-2 rounded-lg border text-sm ${inputBg} focus:outline-none`}
            >
              {MONTHS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={`text-xs font-medium ${textSecondary}`}>Year</label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className={`mt-1 block px-3 py-2 rounded-lg border text-sm ${inputBg} focus:outline-none`}
            >
              {YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={`text-xs font-medium ${textSecondary}`}>Format</label>
            <div className="flex gap-2 mt-1">
              {(['CSV', 'JSON', 'PDF'] as ExportFormat[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                    format === f
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                      : isDark ? 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600' : 'bg-slate-100 text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={`p-5 rounded-2xl border ${cardBg} flex flex-col justify-between`}
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-violet-400" />
              <h3 className={`font-semibold text-sm ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
                Weekly Report
              </h3>
            </div>
            <p className={`text-xs ${textMuted} mb-4`}>Fleet performance summary for the past 7 days</p>
          </div>
          <button
            onClick={handleGenerateWeekly}
            className="w-full px-4 py-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/30 text-sm font-medium hover:bg-violet-500/20 transition-colors"
          >
            Generate Weekly Report
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`p-5 rounded-2xl border ${cardBg} flex flex-col justify-between`}
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <h3 className={`font-semibold text-sm ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
                Monthly Report
              </h3>
            </div>
            <p className={`text-xs ${textMuted} mb-4`}>Comprehensive monthly analysis with trends</p>
          </div>
          <button
            onClick={handleGenerateMonthly}
            className="w-full px-4 py-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 text-sm font-medium hover:bg-amber-500/20 transition-colors"
          >
            Generate Monthly Report
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={`p-5 rounded-2xl border ${cardBg} flex flex-col justify-between`}
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FileDown className="w-5 h-5 text-cyan-400" />
              <h3 className={`font-semibold text-sm ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
                Export Fleet Data
              </h3>
            </div>
            <p className={`text-xs ${textMuted} mb-4`}>All charger telemetry & health data ({chargers.length} chargers)</p>
          </div>
          <button
            onClick={handleExportFleet}
            className="w-full px-4 py-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-sm font-medium hover:bg-cyan-500/20 transition-colors"
          >
            Export Fleet ({format})
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`p-5 rounded-2xl border ${cardBg} flex flex-col justify-between`}
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FileDown className="w-5 h-5 text-red-400" />
              <h3 className={`font-semibold text-sm ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
                Export Alerts
              </h3>
            </div>
            <p className={`text-xs ${textMuted} mb-4`}>All alert history & acknowledged events ({alerts.length} alerts)</p>
          </div>
          <button
            onClick={handleExportAlerts}
            className="w-full px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 text-sm font-medium hover:bg-red-500/20 transition-colors"
          >
            Export Alerts ({format})
          </button>
        </motion.div>
      </div>

      {/* Report Preview */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className={`p-5 rounded-2xl border ${cardBg}`}
      >
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-5 h-5 text-emerald-400" />
          <h3 className={`font-semibold text-sm ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
            Report Preview
          </h3>
        </div>
        <p className={`text-xs ${textSecondary} mb-3`}>
          {selectedMonth} {selectedYear} report will include:
        </p>
        <ul className={`space-y-2 text-sm ${textSecondary}`}>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            Fleet-wide health score trends & risk distribution
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            Per-charger telemetry summary (temp, voltage, current, power)
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            SLA compliance & uptime metrics
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            Alert frequency & resolution times
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            Maintenance schedule & predicted failures
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            Revenue impact analysis & cost projections
          </li>
        </ul>
      </motion.div>

      {/* Recent Reports */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`rounded-2xl border overflow-hidden ${cardBg}`}
      >
        <div className="p-5 border-b" style={{ borderColor: isDark ? '#1e293b' : '#e2e8f0' }}>
          <h3 className={`text-sm font-semibold ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
            Recently Generated Reports
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${tableBorder}`}>
                <th className={`text-left px-5 py-3 font-medium ${textSecondary}`}>Report Name</th>
                <th className={`text-left px-5 py-3 font-medium ${textSecondary}`}>Type</th>
                <th className={`text-left px-5 py-3 font-medium ${textSecondary}`}>Date</th>
                <th className={`text-left px-5 py-3 font-medium ${textSecondary}`}>Format</th>
              </tr>
            </thead>
            <tbody>
              {recentReports.map(report => (
                <tr key={report.id} className={`border-b ${tableBorder} hover:${isDark ? 'bg-slate-900/50' : 'bg-slate-50'} transition-colors`}>
                  <td className={`px-5 py-3 ${textPrimary}`}>{report.name}</td>
                  <td className={`px-5 py-3`}>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                      isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {report.type}
                    </span>
                  </td>
                  <td className={`px-5 py-3 font-mono text-xs ${textMuted}`}>{report.date}</td>
                  <td className={`px-5 py-3`}>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                      report.format === 'PDF'
                        ? isDark ? 'bg-violet-500/10 text-violet-400' : 'bg-violet-50 text-violet-600'
                        : report.format === 'CSV'
                        ? isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-600'
                        : isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {report.format}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
