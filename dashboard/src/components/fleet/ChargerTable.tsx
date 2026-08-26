import React, { useState, useMemo } from 'react';
import type { ChargerSummary, ChargerState } from '../../types';
import { RiskBadge } from '../common/RiskBadge';
import { useFleet } from '../../context/FleetContext';
import {
  ArrowUpDown,
  Search,
  Flame,
  ExternalLink
} from 'lucide-react';

interface ChargerTableProps {
  chargers: ChargerSummary[];
}

type SortField = 'charger_id' | 'city' | 'health_score' | 'risk_level' | 'state' | 'temperature' | 'voltage' | 'power_kw' | 'days_since_maintenance';
type SortOrder = 'asc' | 'desc';

export const ChargerTable: React.FC<ChargerTableProps> = ({ chargers }) => {
  const { selectCharger, openFaultModal } = useFleet();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [stateFilter, setStateFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('health_score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedChargers = useMemo(() => {
    return chargers
      .filter((c) => {
        const matchRisk = riskFilter === 'ALL' || c.risk_level === riskFilter;
        const matchState = stateFilter === 'ALL' || c.state === stateFilter;
        const matchSearch =
          searchQuery === '' ||
          c.charger_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.location.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.profile.toLowerCase().includes(searchQuery.toLowerCase());

        return matchRisk && matchState && matchSearch;
      })
      .sort((a, b) => {
        let valA: any = a[sortField as keyof ChargerSummary];
        let valB: any = b[sortField as keyof ChargerSummary];

        if (sortField === 'city') {
          valA = a.location.city || '';
          valB = b.location.city || '';
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [chargers, searchQuery, riskFilter, stateFilter, sortField, sortOrder]);

  const getStateStyle = (state: ChargerState) => {
    switch (state) {
      case 'charging':
        return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
      case 'idle':
        return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
      case 'faulted':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      case 'offline':
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getHealthBarColor = (score: number) => {
    if (score < 30) return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]';
    if (score < 60) return 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]';
    if (score < 75) return 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]';
    return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-xl overflow-hidden">
      {/* Table Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 p-5">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>Fleet Station Telemetry Ledger</span>
            <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-mono text-cyan-400 border border-slate-700">
              {filteredAndSortedChargers.length} / {chargers.length}
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Real-time status, health diagnostics, and predictive failure tracking across 20 nodes
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search station or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-52 rounded-xl border border-slate-700 bg-slate-950/80 py-2 pl-9 pr-3 text-xs font-mono text-slate-100 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs font-semibold text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </select>

          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs font-semibold text-slate-200 focus:border-cyan-500 focus:outline-none uppercase"
          >
            <option value="ALL">All States</option>
            <option value="charging">Charging</option>
            <option value="idle">Idle</option>
            <option value="faulted">Faulted</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th scope="col" className="px-4 py-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('charger_id')}>
                <div className="flex items-center gap-1.5">
                  <span>Station ID</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th scope="col" className="px-4 py-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('city')}>
                <div className="flex items-center gap-1.5">
                  <span>Location</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th scope="col" className="px-4 py-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('health_score')}>
                <div className="flex items-center gap-1.5">
                  <span>Health Score</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th scope="col" className="px-4 py-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('risk_level')}>
                <div className="flex items-center gap-1.5">
                  <span>Risk Level</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th scope="col" className="px-4 py-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('state')}>
                <div className="flex items-center gap-1.5">
                  <span>State</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th scope="col" className="px-4 py-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('power_kw')}>
                <div className="flex items-center gap-1.5">
                  <span>Power (kW)</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th scope="col" className="px-4 py-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('temperature')}>
                <div className="flex items-center gap-1.5">
                  <span>Temp (&deg;C)</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th scope="col" className="px-4 py-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('voltage')}>
                <div className="flex items-center gap-1.5">
                  <span>Voltage (V)</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th scope="col" className="px-4 py-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('days_since_maintenance')}>
                <div className="flex items-center gap-1.5">
                  <span>Maint. Age</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {filteredAndSortedChargers.map((c) => (
              <tr
                key={c.charger_id}
                onClick={() => selectCharger(c.charger_id)}
                className="cursor-pointer hover:bg-slate-800/50 transition-colors group"
              >
                <td className="px-4 py-3.5 font-mono font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-400" />
                    <span>{c.charger_id}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-sans block truncate max-w-[150px]">
                    {c.profile}
                  </span>
                </td>

                <td className="px-4 py-3.5">
                  <span className="font-semibold text-slate-200">{c.location.city}</span>
                  <span className="text-[10px] text-slate-400 block truncate max-w-[160px]">
                    {c.location.address}
                  </span>
                </td>

                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 text-right font-mono font-extrabold text-sm text-slate-100">
                      {c.health_score}
                    </span>
                    <div className="h-2 w-20 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${getHealthBarColor(c.health_score)}`}
                        style={{ width: `${c.health_score}%` }}
                      />
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3.5">
                  <RiskBadge level={c.risk_level} size="sm" />
                </td>

                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${getStateStyle(
                      c.state
                    )}`}
                  >
                    {c.state}
                  </span>
                </td>

                <td className="px-4 py-3.5 font-mono font-semibold text-cyan-400">
                  {c.power_kw} kW
                </td>

                <td className={`px-4 py-3.5 font-mono font-semibold ${c.temperature > 60 ? 'text-rose-400' : 'text-slate-200'}`}>
                  {c.temperature}&deg;C
                </td>

                <td className="px-4 py-3.5 font-mono text-slate-300">
                  {c.voltage} V
                </td>

                <td className="px-4 py-3.5 font-mono text-slate-400">
                  {c.days_since_maintenance}d ago
                </td>

                <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => selectCharger(c.charger_id)}
                      className="rounded-lg bg-cyan-500/10 border border-cyan-500/30 p-1.5 text-cyan-400 hover:bg-cyan-500 hover:text-white transition-all"
                      title="Inspect Charger"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => openFaultModal(c.charger_id)}
                      className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-1.5 text-rose-400 hover:bg-rose-500 hover:text-white transition-all"
                      title="Inject Fault"
                    >
                      <Flame className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
