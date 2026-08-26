import { MapView } from '../../components/map/MapView';

export function MapPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Network Map</h1>
        <p className="text-slate-400 text-sm mt-1">Live geographic view of all chargers</p>
      </div>
      <MapView />
    </div>
  );
}
