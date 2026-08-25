import { useState, useEffect } from 'react'
import { MapView } from './components/MapView'
import { FleetOverview } from './components/FleetOverview'
import { ChargerDetail } from './components/ChargerDetail'
import { AlertsFeed } from './components/AlertsFeed'
import { useWebSocket } from './hooks/useWebSocket'
import { Activity, Map, Bell, BarChart3 } from 'lucide-react'

export interface ChargerData {
  charger_id: string
  lat: number
  lng: number
  health_score: number
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  state: string
  power_kw: number
  profile: string
}

export interface Alert {
  charger_id: string
  timestamp: number
  alert_type: string
  severity: string
  health_score: number
  details: Record<string, number>
}

type View = 'map' | 'fleet' | 'alerts'

function App() {
  const [view, setView] = useState<View>('map')
  const [chargers, setChargers] = useState<ChargerData[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [selectedCharger, setSelectedCharger] = useState<string | null>(null)
  const [fleetStats, setFleetStats] = useState<any>(null)

  const { lastMessage } = useWebSocket('ws://localhost:8000/ws/live')

  // Fetch initial data
  useEffect(() => {
    fetchMapData()
    fetchAlerts()
    fetchFleetOverview()
    const interval = setInterval(() => {
      fetchMapData()
      fetchFleetOverview()
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return
    if (lastMessage.type === 'alert') {
      setAlerts(prev => [...prev.slice(-199), lastMessage.data])
    } else if (lastMessage.type === 'fleet_update') {
      // Update charger health scores from live data
      setChargers(prev =>
        prev.map(c => ({
          ...c,
          health_score: lastMessage.data.health_scores?.[c.charger_id] ?? c.health_score,
        }))
      )
    }
  }, [lastMessage])

  async function fetchMapData() {
    try {
      const res = await fetch('/api/map/data')
      const data = await res.json()
      setChargers(data.markers || [])
    } catch (e) {
      console.error('Failed to fetch map data:', e)
    }
  }

  async function fetchAlerts() {
    try {
      const res = await fetch('/api/alerts?limit=50')
      const data = await res.json()
      setAlerts(data.alerts || [])
    } catch (e) {
      console.error('Failed to fetch alerts:', e)
    }
  }

  async function fetchFleetOverview() {
    try {
      const res = await fetch('/api/fleet/overview')
      const data = await res.json()
      setFleetStats(data)
    } catch (e) {
      console.error('Failed to fetch fleet overview:', e)
    }
  }

  const criticalCount = chargers.filter(c => c.risk_level === 'CRITICAL').length
  const highCount = chargers.filter(c => c.risk_level === 'HIGH').length

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Aurion</h1>
            <span className="text-sm text-slate-400 ml-2">EV Charger Health Platform</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Status pills */}
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-green-900/50 text-green-300 text-xs rounded-full font-medium">
                {chargers.length} Chargers
              </span>
              {criticalCount > 0 && (
                <span className="px-3 py-1 bg-red-900/50 text-red-300 text-xs rounded-full font-medium animate-pulse">
                  {criticalCount} Critical
                </span>
              )}
              {highCount > 0 && (
                <span className="px-3 py-1 bg-orange-900/50 text-orange-300 text-xs rounded-full font-medium">
                  {highCount} High Risk
                </span>
              )}
            </div>

            {/* Nav buttons */}
            <nav className="flex gap-1 bg-slate-700/50 rounded-lg p-1">
              <button
                onClick={() => setView('map')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  view === 'map' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Map className="w-4 h-4" /> Map
              </button>
              <button
                onClick={() => setView('fleet')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  view === 'fleet' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4" /> Fleet
              </button>
              <button
                onClick={() => setView('alerts')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  view === 'alerts' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Bell className="w-4 h-4" /> Alerts
                {alerts.length > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {alerts.length > 99 ? '99+' : alerts.length}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {selectedCharger ? (
          <ChargerDetail
            chargerId={selectedCharger}
            onClose={() => setSelectedCharger(null)}
          />
        ) : (
          <>
            {view === 'map' && (
              <MapView
                chargers={chargers}
                onChargerClick={(id) => setSelectedCharger(id)}
              />
            )}
            {view === 'fleet' && (
              <FleetOverview
                chargers={chargers}
                stats={fleetStats}
                onChargerClick={(id) => setSelectedCharger(id)}
              />
            )}
            {view === 'alerts' && <AlertsFeed alerts={alerts} />}
          </>
        )}
      </main>
    </div>
  )
}

export default App
