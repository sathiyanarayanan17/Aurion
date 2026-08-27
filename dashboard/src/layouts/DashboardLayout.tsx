import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useFleet } from '../context/FleetContext';
import { FaultModal } from '../components/common/FaultModal';
import { GuidedDemo } from '../components/common/GuidedDemo';
import { CommandPalette } from '../components/common/CommandPalette';
import { NotificationCenter } from '../components/common/NotificationCenter';
import {
  Activity, LayoutDashboard, Map, Server, Bell, BarChart3, Settings,
  LogOut, Flame, Wifi, WifiOff, Sun, Moon, Clock, ChevronDown,
  IndianRupee, Wrench, Brain, GitCompare, Play, Filter, Shield, FileDown,
  MessageSquare, GitBranch, Fingerprint, CloudRain, Bot, Hourglass, BatteryCharging
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export function DashboardLayout() {
  const { alerts, chargers, isWsConnected, openFaultModal, activeTab, selectedChargerId, theme, setTheme } = useFleet();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync context-based navigation with router
  useEffect(() => {
    if (activeTab === 'detail' && selectedChargerId && !location.pathname.includes('/charger/')) {
      navigate(`/dashboard/charger/${selectedChargerId}`);
    }
  }, [activeTab, selectedChargerId, navigate, location.pathname]);

  const criticalCount = chargers.filter(c => c.risk_level === 'CRITICAL').length;
  const highCount = chargers.filter(c => c.risk_level === 'HIGH').length;
  const alertCount = alerts.length;
  const activeChargers = chargers.filter(c => c.state === 'charging').length;

  const isDark = theme === 'black' || theme === 'dark';

  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close More dropdown on outside click or Escape
  useEffect(() => {
    if (!moreOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [moreOpen]);

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Overview', end: true },
    { to: '/dashboard/map', icon: Map, label: 'Map' },
    { to: '/dashboard/fleet', icon: Server, label: 'Fleet' },
    { to: '/dashboard/alerts', icon: Bell, label: 'Alerts', badge: alertCount },
    { to: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  ];

  const moreItems = [
    { to: '/dashboard/revenue', icon: IndianRupee, label: 'Revenue Impact' },
    { to: '/dashboard/maintenance', icon: Wrench, label: 'Maintenance' },
    { to: '/dashboard/explainability', icon: Brain, label: 'Explainability' },
    { to: '/dashboard/compare', icon: GitCompare, label: 'Compare' },
    { to: '/dashboard/timeline', icon: Clock, label: 'Timeline' },
    { to: '/dashboard/replay', icon: Play, label: 'Data Replay' },
    { to: '/dashboard/rules', icon: Filter, label: 'Alert Rules' },
    { to: '/dashboard/sla', icon: Shield, label: 'SLA Monitor' },
    { to: '/dashboard/export', icon: FileDown, label: 'Export' },
    { to: '/dashboard/query', icon: MessageSquare, label: 'Fleet Query' },
    { to: '/dashboard/cascade', icon: GitBranch, label: 'Cascade Sim' },
    { to: '/dashboard/fingerprint', icon: Fingerprint, label: 'Fingerprints' },
    { to: '/dashboard/weather', icon: CloudRain, label: 'Weather' },
    { to: '/dashboard/healing', icon: Bot, label: 'Self-Healing' },
    { to: '/dashboard/aging', icon: Hourglass, label: 'Aging & RUL' },
    { to: '/dashboard/energy', icon: BatteryCharging, label: 'Energy' },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#060611] text-white' : 'bg-[#f4f4f8] text-slate-900'}`} style={{ fontFamily: 'var(--font-sans)' }}>

      {/* Floating Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Gradient orbs */}
        <div className={`absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full blur-[150px] ${isDark ? 'bg-cyan-900/15' : 'bg-cyan-200/30'}`} />
        <div className={`absolute top-1/2 -left-60 w-[500px] h-[500px] rounded-full blur-[130px] ${isDark ? 'bg-violet-900/10' : 'bg-violet-200/20'}`} />
        <div className={`absolute -bottom-40 right-1/3 w-[400px] h-[400px] rounded-full blur-[120px] ${isDark ? 'bg-blue-900/10' : 'bg-blue-200/20'}`} />

        {/* Grid pattern */}
        <div className={`absolute inset-0 ${isDark ? 'opacity-[0.03]' : 'opacity-[0.04]'}`}
          style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
      </div>

      {/* Top Navigation Bar */}
      <header className={`fixed top-0 left-0 right-0 z-50 h-14 border-b backdrop-blur-2xl ${isDark ? 'border-white/[0.06] bg-[#060611]/80' : 'border-black/[0.06] bg-white/80'}`}>
        <div className="h-full w-full px-6 flex items-center justify-between">
          {/* Left: Brand + Nav */}
          <div className="flex items-center gap-5">
            {/* Brand — Clickable to landing */}
            <Link to="/" className="flex items-center gap-2.5 pr-5 border-r border-current/10 group">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-shadow">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-black tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Aurion</span>
            </Link>

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
                        ? isDark ? 'bg-white/[0.08] text-white' : 'bg-black/[0.06] text-black'
                        : isDark ? 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]' : 'text-slate-500 hover:text-slate-800 hover:bg-black/[0.03]'
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

              {/* More Dropdown */}
              <div className="relative" ref={moreRef}>
                <button
                  onClick={() => setMoreOpen(!moreOpen)}
                  className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                    moreOpen || moreItems.some(item => location.pathname === item.to)
                      ? isDark ? 'bg-white/[0.08] text-white' : 'bg-black/[0.06] text-black'
                      : isDark ? 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]' : 'text-slate-500 hover:text-slate-800 hover:bg-black/[0.03]'
                  }`}
                >
                  <span>More</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Panel */}
                {moreOpen && (
                  <div className={`absolute top-full left-0 mt-2 w-56 rounded-xl border p-2 backdrop-blur-2xl shadow-2xl z-[100] ${isDark ? 'bg-[#0a0a1a]/95 border-white/[0.08] shadow-black/50' : 'bg-white/95 border-black/[0.08] shadow-black/10'}`}>
                    {moreItems.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMoreOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                            isActive
                              ? isDark ? 'bg-white/[0.08] text-white' : 'bg-black/[0.06] text-black'
                              : isDark ? 'text-slate-400 hover:text-white hover:bg-white/[0.05]' : 'text-slate-500 hover:text-black hover:bg-black/[0.04]'
                          }`
                        }
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Right: Status + Actions */}
          <div className="flex items-center gap-2.5">
            {/* Live clock */}
            <div className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              <Clock className="w-3 h-3" />
              {currentTime.toLocaleTimeString()}
            </div>

            {/* Live indicator */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md ${isDark ? 'bg-white/[0.04]' : 'bg-black/[0.03]'}`}>
              {isWsConnected ? (
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
              )}
              <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {isWsConnected ? `${activeChargers} active` : 'Offline'}
              </span>
            </div>

            {/* Critical badge */}
            {criticalCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 border border-red-500/20 animate-pulse">
                <span className="text-[11px] text-red-400 font-bold">{criticalCount} Critical</span>
              </div>
            )}

            {highCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-500/10 border border-orange-500/20">
                <span className="text-[11px] text-orange-400 font-bold">{highCount} High</span>
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

            {/* Notification Center */}
            <NotificationCenter />

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'black')}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/[0.06]' : 'text-slate-500 hover:text-black hover:bg-black/[0.05]'}`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Settings */}
            <NavLink
              to="/dashboard/settings"
              className={({ isActive }) =>
                `p-2 rounded-lg transition-colors ${isActive ? (isDark ? 'bg-white/[0.08] text-white' : 'bg-black/[0.06] text-black') : (isDark ? 'text-slate-500 hover:text-white hover:bg-white/[0.04]' : 'text-slate-500 hover:text-black hover:bg-black/[0.03]')}`
              }
            >
              <Settings className="w-4 h-4" />
            </NavLink>

            {/* Profile */}
            <button onClick={() => navigate('/')} className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white ml-1 hover:shadow-lg hover:shadow-cyan-500/30 transition-shadow">
              OP
            </button>
          </div>
        </div>
      </header>

      {/* Main Content — TRUE Full Width */}
      <main className="pt-14 min-h-screen relative z-10">
        <div className="w-full px-6 py-6">
          <Outlet />
        </div>
      </main>

      {/* Floating Stats Bar — Bottom */}
      <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 px-5 py-2.5 rounded-2xl border backdrop-blur-2xl shadow-2xl ${isDark ? 'bg-[#0a0a1a]/90 border-white/[0.06] shadow-black/50' : 'bg-white/90 border-black/[0.06] shadow-black/10'}`}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{chargers.length} Stations</span>
        </div>
        <div className={`w-px h-4 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
        <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{activeChargers} Charging</span>
        <div className={`w-px h-4 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
        <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{(chargers.reduce((s, c) => s + c.power_kw, 0) / 1000).toFixed(1)} MW</span>
        <div className={`w-px h-4 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
        <span className={`text-[11px] font-medium ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>97.4% Uptime</span>
      </div>

      {/* Guided Demo */}
      <GuidedDemo />

      {/* Fault Modal */}
      <FaultModal />

      {/* Command Palette */}
      <CommandPalette />
    </div>
  );
}
