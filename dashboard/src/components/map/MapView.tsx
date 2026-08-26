import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useFleet } from '../../context/FleetContext';
import { RiskBadge } from '../common/RiskBadge';
import type { RiskLevel, ChargerState } from '../../types';
import {
  Search,
  Flame,
  ArrowRight,
  Layers,
  Crosshair
} from 'lucide-react';

const MapController: React.FC<{ center: [number, number]; zoom?: number }> = ({ center, zoom = 5 }) => {
  const map = useMap();
  React.useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
};

const createCustomMarkerIcon = (healthScore: number, riskLevel: RiskLevel, state: ChargerState) => {
  let color = '#10b981';
  let glowColor = 'rgba(16, 185, 129, 0.6)';
  let pulseClass = '';

  if (riskLevel === 'CRITICAL') {
    color = '#f43f5e';
    glowColor = 'rgba(244, 63, 94, 0.8)';
    pulseClass = 'animate-ping';
  } else if (riskLevel === 'HIGH') {
    color = '#f97316';
    glowColor = 'rgba(249, 115, 22, 0.7)';
    pulseClass = 'animate-pulse';
  } else if (riskLevel === 'MEDIUM') {
    color = '#f59e0b';
    glowColor = 'rgba(245, 158, 11, 0.5)';
  }

  const isCharging = state === 'charging';

  const html = `
    <div class="relative flex items-center justify-center cursor-pointer group" style="width: 38px; height: 38px;">
      ${
        riskLevel === 'CRITICAL' || riskLevel === 'HIGH'
          ? `<span class="absolute inset-0 rounded-full ${pulseClass}" style="background-color: ${glowColor}; opacity: 0.6;"></span>`
          : ''
      }
      <div class="relative flex items-center justify-center rounded-full border-2 transition-transform group-hover:scale-125"
           style="width: 32px; height: 32px; background-color: #0f172a; border-color: ${color}; box-shadow: 0 0 14px ${glowColor};">
        <span class="text-[10px] font-black font-mono" style="color: ${color};">
          ${healthScore}
        </span>
      </div>
      ${
        isCharging
          ? `<span class="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-cyan-500 text-[8px] text-black font-bold shadow-sm">⚡</span>`
          : ''
      }
    </div>
  `;

  return L.divIcon({
    html,
    className: 'aurion-custom-marker',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20]
  });
};

export const MapView: React.FC = () => {
  const {
    chargers,
    selectCharger,
    openFaultModal,
    theme,
    overview
  } = useFleet();

  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [stateFilter, setStateFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([21.5937, 78.9629]);
  const [mapZoom, setMapZoom] = useState<number>(5);

  const filteredChargers = useMemo(() => {
    return chargers.filter((c) => {
      const matchRisk = riskFilter === 'ALL' || c.risk_level === riskFilter;
      const matchState = stateFilter === 'ALL' || c.state === stateFilter;
      const matchQuery =
        searchQuery === '' ||
        c.charger_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.location.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.profile.toLowerCase().includes(searchQuery.toLowerCase());

      return matchRisk && matchState && matchQuery;
    });
  }, [chargers, riskFilter, stateFilter, searchQuery]);

  const tileUrl =
    theme === 'light'
      ? 'https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png';

  const handleFocusCritical = () => {
    const critical = chargers.find(c => c.risk_level === 'CRITICAL');
    if (critical) {
      setMapCenter([critical.location.lat, critical.location.lng]);
      setMapZoom(8);
    }
  };

  const handleResetMap = () => {
    setMapCenter([21.5937, 78.9629]);
    setMapZoom(5);
    setRiskFilter('ALL');
    setStateFilter('ALL');
    setSearchQuery('');
  };

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden bg-slate-950">
      {/* Top Floating Filter & Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left Search & Filters */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto bg-slate-900/90 p-2 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-xl">
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search station or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 sm:w-60 rounded-xl border border-slate-700/80 bg-slate-950/80 py-1.5 pl-8 pr-3 text-xs text-slate-100 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden md:inline">
              Risk:
            </span>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((risk) => (
              <button
                key={risk}
                onClick={() => setRiskFilter(risk)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                  riskFilter === risk
                    ? risk === 'CRITICAL'
                      ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30'
                      : risk === 'HIGH'
                      ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                      : risk === 'LOW'
                      ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                      : 'bg-cyan-500 text-white shadow-sm shadow-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {risk}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 border-l border-slate-800 pl-2 hidden lg:flex">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              State:
            </span>
            {['ALL', 'charging', 'idle', 'faulted'].map((st) => (
              <button
                key={st}
                onClick={() => setStateFilter(st)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider transition-all ${
                  stateFilter === st
                    ? 'bg-slate-700 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Right Map Actions */}
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/90 p-2 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-xl">
          <button
            onClick={handleFocusCritical}
            className="flex items-center gap-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 px-3 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/25 transition-all"
            title="Focus Critical Stations"
          >
            <Crosshair className="h-3.5 w-3.5" />
            <span>Focus Critical</span>
          </button>

          <button
            onClick={handleResetMap}
            className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            title="Reset Map View"
          >
            Reset View
          </button>
        </div>
      </div>

      {/* Floating Bottom-Left Fleet HUD */}
      <div className="absolute bottom-6 left-6 z-[1000] hidden sm:flex flex-col gap-2 pointer-events-auto bg-slate-900/95 p-4 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-xl min-w-[280px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            India Grid Overview
          </span>
          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            {filteredChargers.length} / {chargers.length} Active
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-400">Avg Fleet Health</p>
            <p className="text-xl font-extrabold font-mono text-emerald-400">
              {overview?.average_health_score || 82}%
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-400">Total Live Power</p>
            <p className="text-xl font-extrabold font-mono text-cyan-400">
              {overview?.total_power_kw || 1145.6} kW
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> 75-100
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-400" /> 60-74
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-orange-500" /> 30-59
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-500" /> 0-29
          </span>
        </div>
      </div>

      {/* Leaflet Map */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
        attributionControl={false}
      >
        <MapController center={mapCenter} zoom={mapZoom} />

        <TileLayer
          url={tileUrl}
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          maxZoom={18}
        />

        {filteredChargers.map((c) => {
          const markerIcon = createCustomMarkerIcon(c.health_score, c.risk_level, c.state);
          return (
            <Marker
              key={c.charger_id}
              position={[c.location.lat, c.location.lng]}
              icon={markerIcon}
            >
              <Popup className="aurion-leaflet-popup">
                <div className="w-72 p-1 font-sans text-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-2 mb-2.5">
                    <div>
                      <h4 className="text-sm font-bold font-mono text-white flex items-center gap-1.5">
                        {c.charger_id}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {c.location.city} - {c.location.address}
                      </p>
                    </div>
                    <RiskBadge level={c.risk_level} size="sm" />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-300 mb-3 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <span className="font-medium text-cyan-400">{c.profile}</span>
                    <span className="uppercase font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">
                      {c.state}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center mb-3">
                    <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                      <span className="text-[9px] uppercase text-slate-400 block">Health</span>
                      <span className="text-xs font-bold font-mono text-emerald-400">
                        {c.health_score}/100
                      </span>
                    </div>
                    <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                      <span className="text-[9px] uppercase text-slate-400 block">Power</span>
                      <span className="text-xs font-bold font-mono text-cyan-400">
                        {c.power_kw} kW
                      </span>
                    </div>
                    <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                      <span className="text-[9px] uppercase text-slate-400 block">Temp</span>
                      <span className={`text-xs font-bold font-mono ${c.temperature > 60 ? 'text-rose-400' : 'text-slate-200'}`}>
                        {c.temperature}&deg;C
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => selectCharger(c.charger_id)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-cyan-500/25 hover:from-cyan-600 hover:to-blue-700 transition-all"
                    >
                      <span>Inspect Telemetry</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => openFaultModal(c.charger_id)}
                      title="Inject Fault"
                      className="flex items-center justify-center rounded-xl border border-rose-500/40 bg-rose-500/15 p-1.5 text-rose-400 hover:bg-rose-500/30 transition-all"
                    >
                      <Flame className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
