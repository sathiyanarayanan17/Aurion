import type { ChargerData } from '../App'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'
import { TrendingDown, TrendingUp, Activity } from 'lucide-react'

interface FleetOverviewProps {
  chargers: ChargerData[]
  stats: any
  onChargerClick: (id: string) => void
}

export function FleetOverview({ chargers, stats, onChargerClick }: FleetOverviewProps) {
  // Sort chargers by health score (worst first)
  const sortedChargers = [...chargers].sort((a, b) => a.health_score - b.health_score)
  const worstChargers = sortedChargers.slice(0, 10)

  // Health distribution for chart
  const distribution = [
    { range: '0-20', count: chargers.filter(c => c.health_score <= 20).length, color: '#ef4444' },
    { range: '21-40', count: chargers.filter(c => c.health_score > 20 && c.health_score <= 40).length, color: '#f97316' },
    { range: '41-60', count: chargers.filter(c => c.health_score > 40 && c.health_score <= 60).length, color: '#f59e0b' },
    { range: '61-80', count: chargers.filter(c => c.health_score > 60 && c.health_score <= 80).length, color: '#22c55e' },
    { range: '81-100', count: chargers.filter(c => c.health_score > 80).length, color: '#06b6d4' },
  ]

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Chargers"
          value={stats?.total_chargers ?? chargers.length}
          icon={<Activity className="w-5 h-5 text-cyan-400" />}
        />
        <SummaryCard
          title="Avg Health Score"
          value={`${stats?.average_health_score?.toFixed(1) ?? '--'}%`}
          icon={stats?.average_health_score > 70 
            ? <TrendingUp className="w-5 h-5 text-green-400" />
            : <TrendingDown className="w-5 h-5 text-red-400" />
          }
        />
        <SummaryCard
          title="Need Attention"
          value={stats?.chargers_needing_attention ?? 0}
          icon={<TrendingDown className="w-5 h-5 text-orange-400" />}
          highlight={stats?.chargers_needing_attention > 0}
        />
        <SummaryCard
          title="Fleet Status"
          value={stats?.fleet_health_status ?? 'UNKNOWN'}
          icon={<Activity className="w-5 h-5 text-purple-400" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Health Distribution Chart */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold mb-4">Health Score Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={distribution}>
              <XAxis dataKey="range" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {distribution.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold mb-4">Risk Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(stats?.risk_distribution ?? {}).map(([level, count]) => {
              const total = chargers.length || 1
              const percent = ((count as number) / total) * 100
              const colors: Record<string, string> = {
                LOW: 'bg-green-500',
                MEDIUM: 'bg-amber-500',
                HIGH: 'bg-orange-500',
                CRITICAL: 'bg-red-500',
              }
              return (
                <div key={level} className="flex items-center gap-3">
                  <span className="text-sm text-slate-400 w-20">{level}</span>
                  <div className="flex-1 bg-slate-700 rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors[level]}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-10 text-right">{count as number}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Worst Performing Chargers Table */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold mb-4">Chargers Needing Attention</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="text-left py-3 px-2">Charger ID</th>
                <th className="text-left py-3 px-2">Health</th>
                <th className="text-left py-3 px-2">Risk</th>
                <th className="text-left py-3 px-2">State</th>
                <th className="text-left py-3 px-2">Power</th>
                <th className="text-left py-3 px-2">Type</th>
                <th className="text-right py-3 px-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {worstChargers.map(charger => {
                const riskColors: Record<string, string> = {
                  LOW: 'text-green-400',
                  MEDIUM: 'text-amber-400',
                  HIGH: 'text-orange-400',
                  CRITICAL: 'text-red-400',
                }
                return (
                  <tr key={charger.charger_id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-3 px-2 font-medium">{charger.charger_id}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-700 rounded-full h-2">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${charger.health_score}%`,
                              backgroundColor: charger.health_score > 60 ? '#22c55e' : charger.health_score > 30 ? '#f59e0b' : '#ef4444'
                            }}
                          />
                        </div>
                        <span className="text-xs">{charger.health_score}%</span>
                      </div>
                    </td>
                    <td className={`py-3 px-2 font-medium ${riskColors[charger.risk_level]}`}>
                      {charger.risk_level}
                    </td>
                    <td className="py-3 px-2 text-slate-300">{charger.state}</td>
                    <td className="py-3 px-2">{charger.power_kw?.toFixed(1)} kW</td>
                    <td className="py-3 px-2 text-slate-400">{charger.profile}</td>
                    <td className="py-3 px-2 text-right">
                      <button
                        onClick={() => onChargerClick(charger.charger_id)}
                        className="px-3 py-1 bg-cyan-600/20 text-cyan-400 text-xs rounded hover:bg-cyan-600/40 transition-colors"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ title, value, icon, highlight }: any) {
  return (
    <div className={`bg-slate-800 rounded-xl p-5 border ${highlight ? 'border-orange-500/50' : 'border-slate-700'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-sm">{title}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}
