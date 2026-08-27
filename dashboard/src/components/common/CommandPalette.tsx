import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Command, Zap, MapPin, LayoutDashboard, Settings, BarChart3, Bell, Map, Users, Flame, Sun, Download } from 'lucide-react';
import { useFleet } from '../../context/FleetContext';

interface CommandItem {
  id: string;
  label: string;
  category: 'Chargers' | 'Pages' | 'Actions';
  icon: React.ReactNode;
  action: () => void;
  keywords?: string;
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const { chargers, openFaultModal, setTheme, theme } = useFleet();

  // Register global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const commands = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [];

    // Chargers
    chargers.forEach(c => {
      items.push({
        id: `charger-${c.charger_id}`,
        label: `${c.charger_id} — ${c.location.city || 'Unknown'}`,
        category: 'Chargers',
        icon: <Zap className="h-4 w-4 text-cyan-400" />,
        action: () => {
          navigate(`/dashboard/charger/${c.charger_id}`);
          setIsOpen(false);
        },
        keywords: `${c.charger_id} ${c.location.city || ''} ${c.state}`.toLowerCase(),
      });
    });

    // Pages
    const pages: { label: string; path: string; icon: React.ReactNode }[] = [
      { label: 'Overview', path: '/dashboard', icon: <LayoutDashboard className="h-4 w-4 text-blue-400" /> },
      { label: 'Map', path: '/dashboard/map', icon: <Map className="h-4 w-4 text-green-400" /> },
      { label: 'Fleet', path: '/dashboard/fleet', icon: <Users className="h-4 w-4 text-violet-400" /> },
      { label: 'Alerts', path: '/dashboard/alerts', icon: <Bell className="h-4 w-4 text-rose-400" /> },
      { label: 'Analytics', path: '/dashboard/analytics', icon: <BarChart3 className="h-4 w-4 text-amber-400" /> },
      { label: 'Revenue Impact', path: '/dashboard/revenue', icon: <BarChart3 className="h-4 w-4 text-emerald-400" /> },
      { label: 'Maintenance', path: '/dashboard/maintenance', icon: <Settings className="h-4 w-4 text-orange-400" /> },
      { label: 'Settings', path: '/dashboard/settings', icon: <Settings className="h-4 w-4 text-slate-400" /> },
    ];

    pages.forEach(p => {
      items.push({
        id: `page-${p.label}`,
        label: p.label,
        category: 'Pages',
        icon: p.icon,
        action: () => {
          navigate(p.path);
          setIsOpen(false);
        },
        keywords: p.label.toLowerCase(),
      });
    });

    // Actions
    items.push({
      id: 'action-fault',
      label: 'Inject Fault',
      category: 'Actions',
      icon: <Flame className="h-4 w-4 text-rose-400" />,
      action: () => {
        openFaultModal();
        setIsOpen(false);
      },
      keywords: 'inject fault simulate',
    });

    items.push({
      id: 'action-theme',
      label: 'Toggle Theme',
      category: 'Actions',
      icon: <Sun className="h-4 w-4 text-yellow-400" />,
      action: () => {
        const nextTheme = theme === 'black' ? 'dark' : theme === 'dark' ? 'light' : 'black';
        setTheme(nextTheme);
        setIsOpen(false);
      },
      keywords: 'toggle theme dark light mode',
    });

    items.push({
      id: 'action-export',
      label: 'Export Data',
      category: 'Actions',
      icon: <Download className="h-4 w-4 text-cyan-400" />,
      action: () => {
        const data = JSON.stringify(chargers, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'aurion-fleet-export.json';
        a.click();
        URL.revokeObjectURL(url);
        setIsOpen(false);
      },
      keywords: 'export download data json',
    });

    return items;
  }, [chargers, navigate, openFaultModal, setTheme, theme]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      item => item.label.toLowerCase().includes(q) || item.keywords?.includes(q)
    );
  }, [commands, query]);

  const grouped = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filtered.forEach(item => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [filtered]);

  const flatFiltered = useMemo(() => filtered, [filtered]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % flatFiltered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + flatFiltered.length) % flatFiltered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatFiltered[activeIndex]) {
          flatFiltered[activeIndex].action();
        }
      }
    },
    [flatFiltered, activeIndex]
  );

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  // Reset active index when query changes
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Palette */}
          <motion.div
            className="relative w-full max-w-xl rounded-2xl border border-white/[0.08] bg-[#0a0a1a]/95 backdrop-blur-2xl shadow-2xl shadow-black/50"
            initial={{ scale: 0.95, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
              <Search className="h-5 w-5 text-slate-500" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search chargers, pages, or actions..."
                className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
                style={{ fontFamily: 'var(--font-sans)' }}
              />
              <kbd className="hidden sm:flex items-center gap-0.5 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                <Command className="h-2.5 w-2.5" />K
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
              {flatFiltered.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-500">
                  No results found for "{query}"
                </div>
              ) : (
                Object.entries(grouped).map(([category, items]) => (
                  <div key={category} className="mb-2">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                      {category}
                    </div>
                    {items.map(item => {
                      const idx = flatFiltered.indexOf(item);
                      return (
                        <button
                          key={item.id}
                          data-index={idx}
                          onClick={item.action}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                            idx === activeIndex
                              ? 'bg-white/[0.06] text-white'
                              : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                          }`}
                        >
                          {item.icon}
                          <span className="flex-1 truncate">{item.label}</span>
                          {idx === activeIndex && (
                            <span className="text-[10px] text-slate-600">↵</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-2 text-[10px] text-slate-600">
              <div className="flex items-center gap-3">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
                <span>Esc Close</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{chargers.length} chargers</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
