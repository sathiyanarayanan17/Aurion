import { useState } from 'react';
import { useFleet } from '../../context/FleetContext';
import { Bell, Monitor, Palette, Database, Shield } from 'lucide-react';

export function SettingsPage() {
  const { theme, setTheme } = useFleet();
  const [alertThreshold, setAlertThreshold] = useState(60);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [autoMaintenance, setAutoMaintenance] = useState(true);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Configure your monitoring preferences</p>
      </div>

      {/* Appearance */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950/50 space-y-4">
        <div className="flex items-center gap-3">
          <Palette className="w-5 h-5 text-violet-400" />
          <h3 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Appearance</h3>
        </div>
        <div className="flex gap-3">
          {(['black', 'dark', 'light'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium capitalize transition-all ${theme === t ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950/50 space-y-4">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-amber-400" />
          <h3 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Notifications</h3>
        </div>
        <ToggleRow label="Email notifications" description="Get alerts sent to your email" checked={emailNotifications} onChange={setEmailNotifications} />
        <ToggleRow label="SMS notifications" description="Critical alerts via SMS" checked={smsNotifications} onChange={setSmsNotifications} />
        <ToggleRow label="Auto-schedule maintenance" description="Automatically create work orders for predicted failures" checked={autoMaintenance} onChange={setAutoMaintenance} />
      </div>

      {/* Alert Threshold */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950/50 space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-red-400" />
          <h3 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Alert Thresholds</h3>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Health score alert threshold</span>
            <span className="text-sm font-bold text-white">{alertThreshold}%</span>
          </div>
          <input
            type="range"
            min={20}
            max={80}
            value={alertThreshold}
            onChange={(e) => setAlertThreshold(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          <div className="flex justify-between text-xs text-slate-600 mt-1">
            <span>Aggressive (20%)</span>
            <span>Conservative (80%)</span>
          </div>
        </div>
      </div>

      {/* Data */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950/50 space-y-4">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-cyan-400" />
          <h3 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Data & API</h3>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-slate-800">
            <span className="text-slate-400">Backend API</span>
            <span className="text-slate-300 font-mono text-xs">http://localhost:8000</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-800">
            <span className="text-slate-400">WebSocket</span>
            <span className="text-slate-300 font-mono text-xs">ws://localhost:8000/ws/live</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-800">
            <span className="text-slate-400">Telemetry interval</span>
            <span className="text-slate-300">5 seconds</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-400">ML models</span>
            <span className="text-slate-300">XGBoost, LSTM, TCN, IsoForest, Ensemble</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-slate-200">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-cyan-500' : 'bg-slate-700'}`}
      >
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}
