import React from 'react';
import { useFleet } from '../../context/FleetContext';
import {
  Activity,
  Map as MapIcon,
  LayoutDashboard,
  Bell,
  Cpu,
  Flame,
  Moon,
  Sun,
  Monitor
} from 'lucide-react';
import { ThemeMode } from '../../types';

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    selectedChargerId,
    chargers,
    alerts,
    theme,
    setTheme,
    openFaultModal,
    isWsConnected
  } = useFleet();

  const criticalCount = chargers.filter(c => c.risk_level === 'CRITICAL').length;
  const highCount = chargers.filter(c => c.risk_level === 'HIGH').length;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-[0_0_15px_rgba(6,182,212,0.35)]">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>
                AURION
              </span>
              <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-bold font-mono tracking-widest text-cyan-400 border border-cyan-500/30">
                PRO 2.0
              </span>
            </div>
            <p className="text-[11px] font-medium tracking-tight text-slate-400 hidden sm:block">
              Predictive EV Charger Health Platform
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 rounded-xl bg-slate-900/80 p-1 border border-slate-800">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'map'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <MapIcon className="h-3.5 w-3.5" />
            <span>Map View</span>
          </button>

          <button
            onClick={() => setActiveTab('fleet')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'fleet'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>Fleet Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`relative flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'alerts'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Bell className="h-3.5 w-3.5" />
            <span>Alerts Feed</span>
            {alerts.length > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {alerts.length}
              </span>
            )}
          </button>

          {selectedChargerId && (
            <button
              onClick={() => setActiveTab('detail')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'detail'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Cpu className="h-3.5 w-3.5" />
              <span className="font-mono">{selectedChargerId}</span>
            </button>
          )}
        </nav>

        {/* Status Indicators & Actions */}
        <div className="flex items-center gap-2.5">
          {/* Live Telemetry Pill */}
          <div className="hidden lg:flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/90 px-3 py-1 text-xs">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isWsConnected ? 'bg-cyan-400' : 'bg-emerald-400'}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isWsConnected ? 'bg-cyan-500' : 'bg-emerald-500'}`} />
            </span>
            <span className="font-medium text-slate-300">
              {isWsConnected ? 'WebSocket Live' : 'Live Telemetry'}
            </span>
          </div>

          {/* Critical Risk Pill */}
          {criticalCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
              </span>
              <span>{criticalCount} Critical</span>
            </div>
          )}

          {/* Fault Inject Button */}
          <button
            onClick={() => openFaultModal()}
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-gradient-to-r from-rose-500/20 to-amber-500/20 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:border-rose-500/70 hover:bg-rose-500/30 transition-all shadow-[0_0_12px_rgba(244,63,94,0.15)]"
          >
            <Flame className="h-3.5 w-3.5 text-rose-400" />
            <span className="hidden sm:inline">Inject Fault</span>
          </button>

          {/* Theme Switcher */}
          <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900/90 p-0.5">
            <button
              title="Pitch Black Theme (OLED)"
              onClick={() => setTheme('black')}
              className={`rounded-lg p-1.5 text-xs transition-colors ${
                theme === 'black' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Moon className="h-3.5 w-3.5" />
            </button>
            <button
              title="Dark Slate Theme"
              onClick={() => setTheme('dark')}
              className={`rounded-lg p-1.5 text-xs transition-colors ${
                theme === 'dark' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
            </button>
            <button
              title="Light Theme"
              onClick={() => setTheme('light')}
              className={`rounded-lg p-1.5 text-xs transition-colors ${
                theme === 'light' ? 'bg-slate-200 text-slate-900' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sun className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
