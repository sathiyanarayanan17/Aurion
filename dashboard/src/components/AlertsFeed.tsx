import type { Alert } from '../App'
import { AlertTriangle, AlertCircle, Info } from 'lucide-react'

interface AlertsFeedProps {
  alerts: Alert[]
}

export function AlertsFeed({ alerts }: AlertsFeedProps) {
  const sortedAlerts = [...alerts].reverse() // Newest first

  const severityConfig: Record<string, { icon: any; color: string; bg: string }> = {
    CRITICAL: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-900/20 border-red-800/50' },
    HIGH: { icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-900/20 border-orange-800/50' },
    MEDIUM: { icon: Info, color: 'text-amber-400', bg: 'bg-amber-900/20 border-amber-800/50' },
    LOW: { icon: Info, color: 'text-slate-400', bg: 'bg-slate-800 border-slate-700' },
  }

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg">No alerts yet</p>
        <p className="text-sm">Alerts will appear here when charger health degrades</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Live Alerts</h2>
        <span className="text-sm text-slate-400">{alerts.length} total</span>
      </div>

      <div className="space-y-3">
        {sortedAlerts.map((alert, idx) => {
          const config = severityConfig[alert.severity] || severityConfig.LOW
          const Icon = config.icon
          const time = alert.timestamp
            ? new Date(alert.timestamp * 1000).toLocaleTimeString()
            : '--'

          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border ${config.bg} transition-all hover:scale-[1.01]`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 mt-0.5 ${config.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{alert.charger_id}</span>
                    <span className="text-xs text-slate-400">{time}</span>
                  </div>
                  <p className="text-sm text-slate-300 mt-1">
                    Health dropped to <strong>{alert.health_score}%</strong> — {alert.severity} risk
                  </p>
                  {alert.details && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Object.entries(alert.details)
                        .filter(([_, v]) => (v as number) > 2)
                        .map(([key, value]) => (
                          <span
                            key={key}
                            className="px-2 py-0.5 bg-slate-700/50 rounded text-xs text-slate-300"
                          >
                            {key.replace(/_/g, ' ')}: {(value as number).toFixed(1)}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold ${config.color}`}>
                  {alert.severity}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
