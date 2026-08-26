import React, { useState, useMemo } from 'react';
import { useFleet } from '../../context/FleetContext';
import { AlertCard } from './AlertCard';
import {
  Bell,
  Search,
  Filter,
  Flame,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';

export const AlertsFeed: React.FC = () => {
  const { alerts, openFaultModal } = useFleet();
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;
  const highCount = alerts.filter(a => a.severity === 'HIGH').length;
  const mediumCount = alerts.filter(a => a.severity === 'MEDIUM').length;

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      const matchSeverity = severityFilter === 'ALL' || a.severity === severityFilter;
      const matchSearch =
        searchQuery === '' ||
        a.charger_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.alert_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.details.toLowerCase().includes(searchQuery.toLowerCase());

      return matchSeverity && matchSearch;
    });
  }, [alerts, severityFilter, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Feed Header & Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Live Anomaly & Fault Feed
              </h1>
              <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-mono font-bold text-rose-400 border border-rose-500/40">
                {alerts.length} Active
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Real-time failure events, thermal triggers, and degradation warnings prioritized by severity
            </p>
          </div>
        </div>

        <button
          onClick={() => openFaultModal()}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-500/25 hover:from-rose-600 hover:to-amber-600 transition-all"
        >
          <Flame className="h-4 w-4" />
          <span>Inject Test Fault</span>
        </button>
      </div>

      {/* Filter Toolbar & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-xl">
        {/* Severity Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSeverityFilter('ALL')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
              severityFilter === 'ALL'
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            All Severities ({alerts.length})
          </button>

          <button
            onClick={() => setSeverityFilter('CRITICAL')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
              severityFilter === 'CRITICAL'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                : 'text-rose-400 hover:bg-rose-500/10'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span>Critical ({criticalCount})</span>
          </button>

          <button
            onClick={() => setSeverityFilter('HIGH')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
              severityFilter === 'HIGH'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                : 'text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>High ({highCount})</span>
          </button>

          <button
            onClick={() => setSeverityFilter('MEDIUM')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
              severityFilter === 'MEDIUM'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-amber-300 hover:bg-amber-400/10'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span>Medium ({mediumCount})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search alerts, charger ID, or issue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 rounded-xl border border-slate-700 bg-slate-950/80 py-2 pl-9 pr-3 text-xs font-mono text-slate-100 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Alerts Feed List */}
      <div className="space-y-3">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-2" />
            <h3 className="text-base font-bold text-slate-200">No Active Anomalies Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              All EV charging stations matching current filters are operating within nominal baseline parameters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
