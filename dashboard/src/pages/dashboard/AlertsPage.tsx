import { AlertsFeed } from '../../components/alerts/AlertsFeed';

export function AlertsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Alerts & Incidents</h1>
        <p className="text-slate-400 text-sm mt-1">Real-time alerts from your charging network</p>
      </div>
      <AlertsFeed />
    </div>
  );
}
