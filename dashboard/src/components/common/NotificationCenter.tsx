import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, X, Check, Filter } from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import type { AlertItem } from '../../types';

interface Notification {
  id: string;
  charger_id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  timestamp: string;
  read: boolean;
}

type FilterTab = 'All' | 'Critical' | 'High' | 'Medium';

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All');
  const panelRef = useRef<HTMLDivElement>(null);

  const { alerts, theme } = useFleet();
  const isDark = theme === 'black' || theme === 'dark';

  // Sync alerts to notifications
  useEffect(() => {
    const mapped: Notification[] = alerts.map((alert: AlertItem) => ({
      id: alert.id,
      charger_id: alert.charger_id,
      title: alert.details || alert.alert_type,
      severity: alert.severity,
      timestamp: alert.timestamp,
      read: false,
    }));
    setNotifications(prev => {
      const existingIds = new Set(prev.map(n => n.id));
      const newOnes = mapped.filter(m => !existingIds.has(m.id));
      // Preserve read state for existing ones
      const updated = mapped.map(m => {
        const existing = prev.find(p => p.id === m.id);
        return existing ? { ...m, read: existing.read } : m;
      });
      return updated;
    });
  }, [alerts]);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKey);
    }
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const filtered = notifications.filter(n => {
    if (activeFilter === 'All') return true;
    return n.severity === activeFilter.toUpperCase();
  });

  const severityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-rose-500';
      case 'HIGH': return 'bg-amber-500';
      case 'MEDIUM': return 'bg-yellow-400';
      default: return 'bg-slate-400';
    }
  };

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return d.toLocaleDateString();
  };

  const filterTabs: FilterTab[] = ['All', 'Critical', 'High', 'Medium'];

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center justify-center rounded-xl p-2 transition-colors ${
          isDark
            ? 'text-slate-400 hover:text-white hover:bg-white/5'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-lg shadow-rose-500/30">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`absolute right-0 top-12 z-[90] w-[380px] rounded-2xl border shadow-2xl ${
              isDark
                ? 'border-white/[0.08] bg-[#0a0a1a]/98 backdrop-blur-2xl shadow-black/50'
                : 'border-slate-200 bg-white shadow-slate-200/50'
            }`}
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className={`flex items-center justify-between border-b px-4 py-3 ${
              isDark ? 'border-white/[0.06]' : 'border-slate-100'
            }`}>
              <div className="flex items-center gap-2">
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: 'var(--font-display)' }}>
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <button
                onClick={markAllAsRead}
                className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors ${
                  isDark
                    ? 'text-cyan-400 hover:bg-cyan-500/10'
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Check className="h-3 w-3" />
                Mark all read
              </button>
            </div>

            {/* Filter Tabs */}
            <div className={`flex items-center gap-1 border-b px-4 py-2 ${
              isDark ? 'border-white/[0.06]' : 'border-slate-100'
            }`}>
              {filterTabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    activeFilter === tab
                      ? isDark
                        ? 'bg-white/10 text-white'
                        : 'bg-slate-900 text-white'
                      : isDark
                        ? 'text-slate-500 hover:text-slate-300'
                        : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Notification List */}
            <div className="max-h-[400px] overflow-y-auto">
              {filtered.length === 0 ? (
                <div className={`px-4 py-10 text-center text-sm ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                  No notifications
                </div>
              ) : (
                filtered.map(notification => (
                  <div
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={`group flex items-start gap-3 border-b px-4 py-3 transition-colors cursor-pointer ${
                      isDark
                        ? `border-white/[0.04] ${notification.read ? 'opacity-60' : ''} hover:bg-white/[0.03]`
                        : `border-slate-50 ${notification.read ? 'opacity-60' : ''} hover:bg-slate-50`
                    }`}
                  >
                    {/* Severity Dot */}
                    <div className="mt-1.5 flex-shrink-0">
                      <div className={`h-2.5 w-2.5 rounded-full ${severityColor(notification.severity)} ${
                        !notification.read ? 'ring-2 ring-offset-1 ring-offset-transparent' : ''
                      } ${
                        notification.severity === 'CRITICAL' && !notification.read
                          ? 'ring-rose-500/30 animate-pulse'
                          : notification.severity === 'HIGH' && !notification.read
                            ? 'ring-amber-500/30'
                            : 'ring-transparent'
                      }`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {notification.title}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className={`text-[10px] font-mono ${isDark ? 'text-cyan-400/70' : 'text-blue-600'}`}>
                          {notification.charger_id}
                        </span>
                        <span className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                          {formatTimestamp(notification.timestamp)}
                        </span>
                      </div>
                    </div>

                    {/* Dismiss */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissNotification(notification.id);
                      }}
                      className={`flex-shrink-0 rounded-lg p-1 opacity-0 transition-opacity group-hover:opacity-100 ${
                        isDark ? 'text-slate-500 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
