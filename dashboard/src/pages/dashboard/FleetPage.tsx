import { FleetOverview } from '../../components/fleet/FleetOverview';

export function FleetPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Fleet Management</h1>
        <p className="text-slate-400 text-sm mt-1">Monitor and manage all chargers in your network</p>
      </div>
      <FleetOverview />
    </div>
  );
}
