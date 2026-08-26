import React from 'react';
import { AlertItem } from '../../types';
import { useFleet } from '../../context/FleetContext';
import {
  AlertTriangle,
  Clock,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Flame,
  ZapOff,
  ShieldAlert
} from 'lucide-react';

interface AlertCardProps {
  alert: AlertItem;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert }) => {
  const { selectCharger, acknowledgeAlert, chargers } = useFleet();

  const charger = chargers.find(c => c.charger_id === alert.charger_id);
  const city = charger?.location.city || 'Station';

  const getSeverityStyle = () => {
    switch (alert.severity) {
      case 'CRITICAL':
        return {
          border: 'border-rose-500/40 hover:border-rose-500/70',
          bg: 'bg-slate-900/90 hover:bg-slate-900',
          badgeBg: 'bg-rose-500/15 border-rose-500/40 text-rose-400',
          dot: 'bg-rose-500',
          icon: ShieldAlert,
          glow: 'shadow-[0_0_15px_rgba(244,63,94,0.15)]'
        };
      case 'HIGH':
        return {
          border: 'border-amber-500/40 hover:border-amber-500/70',
          bg: 'bg-slate-900/90 hover:bg-slate-900',
          badgeBg: 'bg-amber-500/15 border-amber-500/40 text-amber-400',
          dot: 'bg-amber-500',
          icon: AlertTriangle,
          glow: 'shadow-[0_0_12px_rgba(245,158,11,0.1)]'
        };
      case 'MEDIUM':
      default:
        return {
          border: 'border-amber-400/30 hover:border-amber-400/60',
          bg: 'bg-slate-900/80 hover:bg-slate-900',
          badgeBg: 'bg-amber-400/15 border-amber-400/30 text-amber-300',
          dot: 'bg-amber-400',
          icon: AlertTriangle,
          glow: ''
        };
    }
  };

  const style = getSeverityStyle();
  const IconComponent = style.icon;

  const formattedTime = new Date(alert.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div
      className={`rounded-2xl border p-5 transition-all backdrop-blur-xl ${style.border} ${style.bg} ${style.glow}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        {/* Left Severity & Charger */}
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${style.badgeBg}`}>
            <IconComponent className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => selectCharger(alert.charger_id)}
                className="font-mono font-bold text-sm text-white hover:text-cyan-400 transition-colors flex items-center gap-1.5"
              >
                <span>{alert.charger_id}</span>
                <span className="text-xs font-normal text-slate-400">({city})</span>
              </button>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style.badgeBg}`}>
                <span className="relative flex h-1.5 w-1.5">
                  {alert.severity === 'CRITICAL' && (
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${style.dot}`} />
                  )}
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${style.dot}`} />
                </span>
                <span>{alert.severity}</span>
              </span>
            </div>

            <h4 className="text-sm font-bold text-slate-100 mt-0.5">
              {alert.alert_type}
            </h4>
          </div>
        </div>

        {/* Right Timestamp & Health Score */}
        <div className="flex items-center gap-3 text-right">
          <div className="hidden sm:block">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Health Score</span>
            <span
              className={`text-sm font-mono font-extrabold ${
                alert.health_score < 30 ? 'text-rose-400' : alert.health_score < 60 ? 'text-orange-400' : 'text-amber-400'
              }`}
            >
              {alert.health_score} / 100
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
            <Clock className="h-3 w-3" />
            <span>{formattedTime}</span>
          </div>
        </div>
      </div>

      {/* Alert Description Details */}
      <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 mb-3">
        {alert.details}
      </p>

      {/* Penalties Tags & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Penalties */}
        <div className="flex flex-wrap items-center gap-1.5">
          {alert.penalties?.temperature_penalty && (
            <span className="rounded-md bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-rose-300">
              Temp -{alert.penalties.temperature_penalty}
            </span>
          )}
          {alert.penalties?.voltage_penalty && (
            <span className="rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300">
              Volt -{alert.penalties.voltage_penalty}
            </span>
          )}
          {alert.penalties?.connection_penalty && (
            <span className="rounded-md bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-300">
              Conn -{alert.penalties.connection_penalty}
            </span>
          )}
          {alert.penalties?.session_failure_penalty && (
            <span className="rounded-md bg-orange-500/15 border border-orange-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-orange-300">
              Drops -{alert.penalties.session_failure_penalty}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => acknowledgeAlert(alert.id)}
            className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Acknowledge</span>
          </button>

          <button
            onClick={() => selectCharger(alert.charger_id)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-cyan-500/20 hover:from-cyan-600 hover:to-blue-700 transition-all"
          >
            <span>Investigate</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
