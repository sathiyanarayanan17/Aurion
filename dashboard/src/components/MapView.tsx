import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet'
import type { ChargerData } from '../App'

interface MapViewProps {
  chargers: ChargerData[]
  onChargerClick: (id: string) => void
}

const RISK_COLORS: Record<string, string> = {
  LOW: '#22c55e',      // green
  MEDIUM: '#f59e0b',   // amber
  HIGH: '#f97316',     // orange
  CRITICAL: '#ef4444', // red
}

const INDIA_CENTER: [number, number] = [20.5937, 78.9629]

export function MapView({ chargers, onChargerClick }: MapViewProps) {
  return (
    <div className="h-[calc(100vh-140px)] rounded-xl overflow-hidden border border-slate-700">
      <MapContainer
        center={INDIA_CENTER}
        zoom={5}
        className="h-full w-full"
        style={{ background: '#0f172a' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {chargers.map((charger) => (
          <CircleMarker
            key={charger.charger_id}
            center={[charger.lat, charger.lng]}
            radius={charger.risk_level === 'CRITICAL' ? 12 : charger.risk_level === 'HIGH' ? 10 : 8}
            fillColor={RISK_COLORS[charger.risk_level] || RISK_COLORS.LOW}
            fillOpacity={0.8}
            stroke={true}
            color={RISK_COLORS[charger.risk_level] || RISK_COLORS.LOW}
            weight={2}
            opacity={charger.risk_level === 'CRITICAL' ? 1 : 0.6}
            eventHandlers={{
              click: () => onChargerClick(charger.charger_id),
            }}
          >
            <Tooltip direction="top" offset={[0, -10]}>
              <div className="text-xs">
                <strong>{charger.charger_id}</strong>
                <br />
                Health: {charger.health_score}% | {charger.risk_level}
                <br />
                State: {charger.state} | {charger.power_kw?.toFixed(1)} kW
              </div>
            </Tooltip>

            <Popup>
              <div className="text-sm">
                <h3 className="font-bold text-base mb-1">{charger.charger_id}</h3>
                <table className="text-xs">
                  <tbody>
                    <tr>
                      <td className="pr-2 text-gray-500">Health:</td>
                      <td className="font-medium">{charger.health_score}%</td>
                    </tr>
                    <tr>
                      <td className="pr-2 text-gray-500">Risk:</td>
                      <td className="font-medium">{charger.risk_level}</td>
                    </tr>
                    <tr>
                      <td className="pr-2 text-gray-500">State:</td>
                      <td>{charger.state}</td>
                    </tr>
                    <tr>
                      <td className="pr-2 text-gray-500">Power:</td>
                      <td>{charger.power_kw?.toFixed(1)} kW</td>
                    </tr>
                    <tr>
                      <td className="pr-2 text-gray-500">Type:</td>
                      <td>{charger.profile}</td>
                    </tr>
                  </tbody>
                </table>
                <button
                  className="mt-2 px-3 py-1 bg-cyan-600 text-white text-xs rounded hover:bg-cyan-700"
                  onClick={() => onChargerClick(charger.charger_id)}
                >
                  View Details →
                </button>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}
