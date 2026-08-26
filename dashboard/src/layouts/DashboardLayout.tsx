import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useFleet } from '../context/FleetContext';
import { FaultModal } from '../components/common/FaultModal';
import {
  Activity, LayoutDashboard, Map, Server, Bell, BarChart3, Settings,
  LogOut, Flame, Wifi, WifiOff, Search, Command
} from 'lucide-react';
import { useState, useEffect } from 'react';

export function DashboardLayout() {
  const { alerts, chargers, isWsConnected, openFaultModal, activeTab, selectedChargerId } = useFleet();
  const navigate = useNavigate();
  const location = useLocation();

  // Sync context-based navigation with router
  useEffect(() => {
    if (activeTab === 'detail' && selectedChargerId && !location.pathname.includes('/charger/')) {
      navigate(`/dashboard/charger/${selectedChargerId}`);
    }
  }, [activeTab, selectedChargerId, navigate, location.pathname]);

  const criticalCount = chargers.filter(c => c.risk_level === 'CRITICAL').length;
  const highCount = chargers.filter(c => c.risk_level === 'HIGH').length;
  const alertCount = alerts.length;

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Overview', end: true },
    { to: '/dashboard/map', icon: Map, label: 'Map' },
    { to: '/dashboard/fleet', icon: Server, label: 'Fleet' },
    { to: '/dashboard/alerts', icon: Bell, label: 'Alerts', badge: alertCount },
    { to: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  ];

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Top Navigation Bar — Full Width */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-white/[0.06] bg-black/70 backdrop-blur-2xl">
        <div className="h-full max-w-[1800px] mx-auto px-5 flex items-center justify-between">
          {/* Left: Brand + Nav */}
          <div className="flex items-center gap-6">
            {/* Brand */}
            <div className="flex items-center gap-2.5 pr-6 border-r border-white/[0.06]">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-black tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Aurion</span>
            </div>

            {/* Nav Pills */}
            <nav className="flex items-center gap-0.5">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                      isActive
                        ? 'bg-white/[0.08] text-white'
                        : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]'
                    }`
                  }
                >
                  <item.icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {/* Live Status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04]">
              {isWsConnected ? (
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
              )}
              <span className="text-[11px] text-slate-400 font-medium">
                {isWsConnected ? 'Live' : 'Offline'}
              </span>
            </div>

            {/* Critical badge */}
            {criticalCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 border border-red-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-[11px] text-red-400 font-bold">{criticalCount} Critical</span>
              </div>
            )}

            {/* Fault inject */}
            <button
              onClick={() => openFaultModal()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-orange-400 bg-orange-500/5 border border-orange-500/10 hover:bg-orange-500/10 transition-colors"
            >
              <Flame className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Inject</span>
            </button>

            {/* Settings */}
            <NavLink
              to="/dashboard/settings"
              className={({ isActive }) =>
                `p-2 rounded-lg transition-colors ${isActive ? 'bg-white/[0.08] text-white' : 'text-slate-500 hover:text-white hover:bg-white/[0.04]'}`
              }
            >
              <Settings className="w-4 h-4" />
            </NavLink>

            {/* Profile */}
            <button onClick={() => navigate('/')} className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-[10px] font-bold ml-1">
              OP
            </button>
          </div>
        </div>
      </header>

      {/* Main Content — Full Width with Edge-to-Edge Feel */}
      <main className="pt-14 min-h-screen">
        <div className="max-w-[1800px] mx-auto px-5 py-6">
          <Outlet />
        </div>
      </main>

      {/* Fault Modal */}
      <FaultModal />
    </div>
  );
}
