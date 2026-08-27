import React, { useState, useMemo, useCallback } from 'react';
import { ClipboardList, Calendar, Wrench, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFleet } from '../../context/FleetContext';

type WorkOrderStatus = 'Open' | 'In Progress' | 'Resolved';
type WorkOrderPriority = 'Critical' | 'High' | 'Medium';

interface WorkOrder {
  id: string;
  charger_id: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  created_date: string;
  assigned_to: string;
  predicted_failure_date: string;
  health_score: number;
}

const STATUS_CYCLE: WorkOrderStatus[] = ['Open', 'In Progress', 'Resolved'];

const TECHNICIANS = ['Arjun K.', 'Priya S.', 'Ravi M.', 'Neha T.', 'Vikram D.'];

export function MaintenancePage() {
  const { chargers, theme } = useFleet();
  const isDark = theme === 'black' || theme === 'dark';

  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Generate work orders from chargers with health_score < 70
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => {
    const atRisk = chargers.filter(c => c.health_score < 70);
    return atRisk.map((c, i) => {
      const priority: WorkOrderPriority = c.health_score < 30 ? 'Critical' : c.health_score < 50 ? 'High' : 'Medium';
      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 7));

      const failureDate = new Date();
      failureDate.setDate(failureDate.getDate() + Math.floor(Math.random() * 14) + 1);

      const statuses: WorkOrderStatus[] = ['Open', 'In Progress', 'Resolved'];
      const status = statuses[Math.floor(Math.random() * 3)];

      return {
        id: `WO-${String(1001 + i).padStart(4, '0')}`,
        charger_id: c.charger_id,
        priority,
        status,
        created_date: createdDate.toISOString().split('T')[0],
        assigned_to: TECHNICIANS[i % TECHNICIANS.length],
        predicted_failure_date: failureDate.toISOString().split('T')[0],
        health_score: c.health_score,
      };
    });
  });

  // Re-generate if chargers change
  useMemo(() => {
    const atRisk = chargers.filter(c => c.health_score < 70);
    if (atRisk.length > 0 && workOrders.length === 0) {
      const newOrders = atRisk.map((c, i) => {
        const priority: WorkOrderPriority = c.health_score < 30 ? 'Critical' : c.health_score < 50 ? 'High' : 'Medium';
        const createdDate = new Date();
        createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 7));
        const failureDate = new Date();
        failureDate.setDate(failureDate.getDate() + Math.floor(Math.random() * 14) + 1);
        return {
          id: `WO-${String(1001 + i).padStart(4, '0')}`,
          charger_id: c.charger_id,
          priority,
          status: 'Open' as WorkOrderStatus,
          created_date: createdDate.toISOString().split('T')[0],
          assigned_to: TECHNICIANS[i % TECHNICIANS.length],
          predicted_failure_date: failureDate.toISOString().split('T')[0],
          health_score: c.health_score,
        };
      });
      setWorkOrders(newOrders);
    }
  }, [chargers]);

  const toggleStatus = useCallback((orderId: string) => {
    setWorkOrders(prev =>
      prev.map(wo => {
        if (wo.id !== orderId) return wo;
        const currentIdx = STATUS_CYCLE.indexOf(wo.status);
        const nextIdx = (currentIdx + 1) % STATUS_CYCLE.length;
        return { ...wo, status: STATUS_CYCLE[nextIdx] };
      })
    );
  }, []);

  // Stats
  const stats = useMemo(() => {
    const open = workOrders.filter(w => w.status === 'Open').length;
    const inProgress = workOrders.filter(w => w.status === 'In Progress').length;
    const resolved = workOrders.filter(w => w.status === 'Resolved').length;
    return { open, inProgress, resolved, avgResolution: '2.4 days' };
  }, [workOrders]);

  // Calendar logic
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: { date: number | null; events: WorkOrder[] }[] = [];

    // Padding for first week
    for (let i = 0; i < firstDay; i++) {
      days.push({ date: null, events: [] });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const events = workOrders.filter(wo => wo.predicted_failure_date === dateStr);
      days.push({ date: d, events });
    }

    return days;
  }, [currentMonth, workOrders]);

  const monthLabel = currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const prevMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  const priorityColor = (priority: WorkOrderPriority) => {
    switch (priority) {
      case 'Critical': return { dot: 'bg-rose-500', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
      case 'High': return { dot: 'bg-amber-500', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
      case 'Medium': return { dot: 'bg-yellow-400', badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' };
    }
  };

  const statusColor = (status: WorkOrderStatus) => {
    switch (status) {
      case 'Open': return isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200';
      case 'In Progress': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Resolved': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  const cardBg = isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 shadow-lg shadow-orange-500/20">
          <Wrench className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className={`text-2xl font-black tracking-tight ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
            Predictive Maintenance
          </h1>
          <p className={`text-sm ${textSecondary}`}>Calendar, work orders & predicted failures</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-5 rounded-2xl border ${cardBg}`}>
          <ClipboardList className="w-5 h-5 text-slate-400 mb-3" />
          <p className={`text-2xl font-bold ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>{stats.open}</p>
          <p className={`text-xs mt-1 ${textSecondary}`}>Open Orders</p>
        </div>
        <div className={`p-5 rounded-2xl border ${cardBg}`}>
          <Wrench className="w-5 h-5 text-blue-400 mb-3" />
          <p className={`text-2xl font-bold ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>{stats.inProgress}</p>
          <p className={`text-xs mt-1 ${textSecondary}`}>In Progress</p>
        </div>
        <div className={`p-5 rounded-2xl border ${cardBg}`}>
          <Calendar className="w-5 h-5 text-emerald-400 mb-3" />
          <p className={`text-2xl font-bold ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>{stats.resolved}</p>
          <p className={`text-xs mt-1 ${textSecondary}`}>Resolved This Month</p>
        </div>
        <div className={`p-5 rounded-2xl border ${cardBg}`}>
          <Calendar className="w-5 h-5 text-amber-400 mb-3" />
          <p className={`text-2xl font-bold ${textPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>{stats.avgResolution}</p>
          <p className={`text-xs mt-1 ${textSecondary}`}>Avg Resolution Time</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className={`lg:col-span-1 p-5 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontFamily: 'var(--font-display)' }}>
              {monthLabel}
            </h3>
            <div className="flex items-center gap-1">
              <button onClick={prevMonth} className={`rounded-lg p-1 ${isDark ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={nextMonth} className={`rounded-lg p-1 ${isDark ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} className={`text-center text-[10px] font-bold uppercase ${textSecondary}`}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              const isToday = day.date === new Date().getDate() &&
                currentMonth.getMonth() === new Date().getMonth() &&
                currentMonth.getFullYear() === new Date().getFullYear();

              return (
                <div
                  key={i}
                  className={`relative flex flex-col items-center justify-center rounded-lg py-2 text-xs ${
                    day.date === null
                      ? ''
                      : isToday
                        ? isDark ? 'bg-cyan-500/10 text-cyan-400 font-bold' : 'bg-blue-50 text-blue-600 font-bold'
                        : isDark ? 'text-slate-400 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {day.date}
                  {day.events.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {day.events.slice(0, 3).map((ev, j) => (
                        <div key={j} className={`h-1.5 w-1.5 rounded-full ${priorityColor(ev.priority).dot}`} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className={`mt-4 flex items-center gap-3 text-[10px] ${textSecondary}`}>
            <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-rose-500" />Critical</div>
            <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-amber-500" />High</div>
            <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-yellow-400" />Medium</div>
          </div>
        </div>

        {/* Work Orders List */}
        <div className={`lg:col-span-2 rounded-2xl border ${cardBg} overflow-hidden`}>
          <div className={`px-6 py-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <h3 className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontFamily: 'var(--font-display)' }}>
              Work Orders ({workOrders.length})
            </h3>
          </div>

          <div className="max-h-[480px] overflow-y-auto divide-y divide-slate-800/30">
            {workOrders.length === 0 ? (
              <div className={`px-6 py-10 text-center text-sm ${textSecondary}`}>
                No work orders — all chargers are healthy!
              </div>
            ) : (
              workOrders.map(wo => (
                <div
                  key={wo.id}
                  className={`flex items-center gap-4 px-6 py-3 transition-colors ${
                    isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Priority dot */}
                  <div className={`h-3 w-3 rounded-full flex-shrink-0 ${priorityColor(wo.priority).dot}`} />

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${textPrimary}`}>{wo.id}</span>
                      <span className={`text-[10px] font-mono ${isDark ? 'text-cyan-400/70' : 'text-blue-600'}`}>
                        {wo.charger_id}
                      </span>
                    </div>
                    <div className={`flex items-center gap-2 mt-0.5 text-[10px] ${textSecondary}`}>
                      <span>Assigned: {wo.assigned_to}</span>
                      <span>•</span>
                      <span>Created: {wo.created_date}</span>
                      <span>•</span>
                      <span>Failure predicted: {wo.predicted_failure_date}</span>
                    </div>
                  </div>

                  {/* Priority badge */}
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${priorityColor(wo.priority).badge}`}>
                    {wo.priority}
                  </span>

                  {/* Status toggle */}
                  <button
                    onClick={() => toggleStatus(wo.id)}
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold transition-colors cursor-pointer ${statusColor(wo.status)}`}
                    title="Click to cycle status"
                  >
                    {wo.status}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
