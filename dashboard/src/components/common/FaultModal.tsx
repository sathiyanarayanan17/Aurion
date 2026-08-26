import React, { useState } from 'react';
import { useFleet } from '../../context/FleetContext';
import { FaultType } from '../../types';
import {
  Flame,
  ZapOff,
  PlugZap,
  ShieldAlert,
  WifiOff,
  RotateCcw,
  X,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

interface FaultOption {
  type: FaultType;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  impact: string;
}

const FAULT_OPTIONS: FaultOption[] = [
  {
    type: 'thermal_runaway',
    title: 'Thermal Runaway Spike',
    description: 'Forces IGBT junction over-temperature (>68 deg C) with steep thermal gradient.',
    icon: Flame,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20',
    impact: 'Health Score -45 | Risk CRITICAL | Triggers Emergency Cooling Alert'
  },
  {
    type: 'voltage_sag',
    title: 'DC Bus Voltage Sag',
    description: 'Introduces DC capacitor bank degradation and grid phase harmonic instability.',
    icon: ZapOff,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20',
    impact: 'Health Score -35 | Voltage Drops to 352V | High Standard Deviation'
  },
  {
    type: 'connector_overheat',
    title: 'Connector Pin Wear & Resistance',
    description: 'Simulates micro-oxidation on CC1/CC2 contact pins causing localized thermal elevation.',
    icon: PlugZap,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20',
    impact: 'Health Score -28 | Power Throttled to 35 kW | Risk HIGH'
  },
  {
    type: 'isolation_fault',
    title: 'DC Isolation Resistance Failure',
    description: 'Chassis ground isolation drops below 100 kOhm safety threshold due to moisture/salinity.',
    icon: ShieldAlert,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20',
    impact: 'Health Score -40 | Contactor Safety Trip | State FAULTED'
  },
  {
    type: 'communication_drop',
    title: 'OCPP Telemetry Packet Loss',
    description: 'Intermittent 4G cellular dropout causing dropped telemetry and heartbeat retry spikes.',
    icon: WifiOff,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/30 hover:bg-cyan-500/20',
    impact: 'Health Score -18 | Connection Penalty Spikes | Risk MEDIUM'
  },
  {
    type: 'normal_recovery',
    title: 'Technician Reset & Servicing',
    description: 'Simulates certified on-site maintenance, component replacement, and firmware calibration.',
    icon: RotateCcw,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20',
    impact: 'Health Score Restored to 95 | Risk LOW | Clear All Active Faults'
  }
];

export const FaultModal: React.FC = () => {
  const {
    isFaultModalOpen,
    closeFaultModal,
    faultModalChargerId,
    chargers,
    injectFault
  } = useFleet();

  const [selectedChargerId, setSelectedChargerId] = useState<string>(
    faultModalChargerId || chargers[0]?.charger_id || 'AUR-MUM-001'
  );
  const [selectedFault, setSelectedFault] = useState<FaultType>('thermal_runaway');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isFaultModalOpen) return null;

  const currentSelectedId = selectedChargerId || faultModalChargerId || chargers[0]?.charger_id;

  const handleExecute = async () => {
    setIsSubmitting(true);
    try {
      await injectFault(currentSelectedId, selectedFault);
      setSuccessMessage(`Fault sequence "${selectedFault}" executed on ${currentSelectedId}`);
      setTimeout(() => {
        setSuccessMessage(null);
        closeFaultModal();
      }, 1200);
    } catch {
      // Error handling
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Fault Injection Studio</h2>
              <p className="text-xs text-slate-400">
                Trigger predictive failure anomalies to test real-time ML detection and alert dispatch
              </p>
            </div>
          </div>
          <button
            onClick={closeFaultModal}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-4">
          {/* Target Charger Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Select Target EV Charger
            </label>
            <select
              value={currentSelectedId}
              onChange={(e) => setSelectedChargerId(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-sm font-mono font-medium text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              {chargers.map((c) => (
                <option key={c.charger_id} value={c.charger_id}>
                  {c.charger_id} - {c.location.city} ({c.profile}) [Health: {c.health_score} | {c.risk_level}]
                </option>
              ))}
            </select>
          </div>

          {/* Fault Type Options Grid */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Select Anomaly Scenario
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {FAULT_OPTIONS.map((f) => {
                const IconComponent = f.icon;
                const isSelected = selectedFault === f.type;
                return (
                  <button
                    key={f.type}
                    type="button"
                    onClick={() => setSelectedFault(f.type)}
                    className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${f.bg} ${
                      isSelected
                        ? 'ring-2 ring-cyan-400 border-transparent shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                        : 'border-slate-800/80 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className={`p-1.5 rounded-lg ${f.color}`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-semibold text-slate-100">{f.title}</span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                      {f.description}
                    </p>
                    <div className="mt-auto text-[11px] font-mono text-slate-300 bg-slate-950/40 px-2 py-1 rounded border border-slate-800">
                      {f.impact}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Success Feedback */}
          {successMessage && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 p-3 text-xs text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={closeFaultModal}
            className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleExecute}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-rose-500/20 hover:from-rose-600 hover:to-amber-600 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Injecting Scenario...</span>
            ) : (
              <span>Execute Fault Injection</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
