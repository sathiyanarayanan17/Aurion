import React from 'react';
import type { TelemetryHistoryPoint } from '../../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { Thermometer, Zap, Gauge, Activity, Clock } from 'lucide-react';

interface TelemetryChartsProps {
  history: TelemetryHistoryPoint[];
}

export const TelemetryCharts: React.FC<TelemetryChartsProps> = ({ history }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Real-Time Telemetry Oscilloscope (5s Streaming)
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span>Live 20-Point Window</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Temperature */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Thermometer className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">IGBT Junction & Module Temperature</h4>
                <p className="text-[10px] text-slate-400">Thermal safe ceiling at 60.0&deg;C</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
              {history[history.length - 1]?.temperature || 0}&deg;C
            </span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} domain={[20, 90]} tickLine={false} />
                <ReferenceLine y={60} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'Safe Limit 60C', fill: '#f43f5e', fontSize: 10, position: 'insideTopRight' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '11px', color: '#f8fafc' }}
                  formatter={(val: any) => [`${val} °C`, 'Temperature']}
                />
                <Area type="monotone" dataKey="temperature" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#tempGradient)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Voltage */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Gauge className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">DC Bus Voltage Stability</h4>
                <p className="text-[10px] text-slate-400">Nominal 400.0 V Grid Reference</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
              {history[history.length - 1]?.voltage || 0} V
            </span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="voltGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c084fc" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#c084fc" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} domain={[340, 420]} tickLine={false} />
                <ReferenceLine y={400} stroke="#c084fc" strokeDasharray="4 4" label={{ value: 'Nominal 400V', fill: '#c084fc', fontSize: 10, position: 'insideTopRight' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '11px', color: '#f8fafc' }}
                  formatter={(val: any) => [`${val} V`, 'DC Voltage']}
                />
                <Area type="monotone" dataKey="voltage" stroke="#c084fc" strokeWidth={2} fillOpacity={1} fill="url(#voltGradient)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Current */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">DC Charging Current Output</h4>
                <p className="text-[10px] text-slate-400">Load profile across active session</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
              {history[history.length - 1]?.current || 0} A
            </span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="currGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '11px', color: '#f8fafc' }}
                  formatter={(val: any) => [`${val} A`, 'Current']}
                />
                <Area type="monotone" dataKey="current" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#currGradient)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Power Output */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Real-Time Power Delivery (kW)</h4>
                <p className="text-[10px] text-slate-400">Calculated instantaneous delivery</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
              {history[history.length - 1]?.power_kw || 0} kW
            </span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="pwrGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '11px', color: '#f8fafc' }}
                  formatter={(val: any) => [`${val} kW`, 'Power Output']}
                />
                <Area type="monotone" dataKey="power_kw" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#pwrGradient)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
