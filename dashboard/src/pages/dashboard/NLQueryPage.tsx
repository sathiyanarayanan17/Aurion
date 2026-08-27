import { useState, useEffect, useRef, useCallback } from 'react';
import { useFleet } from '../../context/FleetContext';
import { Sparkles, MessageSquare, Search, Zap, ThermometerSun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChargerSummary } from '../../types';

const SUGGESTION_CHIPS = [
  'Show critical chargers',
  'Hottest chargers',
  'Chargers in Mumbai',
  'Offline stations',
  'Worst performing this week',
];

interface QueryResult {
  query: string;
  answer: string;
  chargers: ChargerSummary[];
}

function parseQuery(query: string, chargers: ChargerSummary[]): QueryResult {
  const q = query.toLowerCase().trim();
  let filtered = [...chargers];
  let answerParts: string[] = [];

  // City filter
  const cities = [...new Set(chargers.map(c => c.location.city).filter(Boolean))] as string[];
  const matchedCity = cities.find(city => q.includes(city.toLowerCase()));
  if (matchedCity) {
    filtered = filtered.filter(c => c.location.city?.toLowerCase() === matchedCity.toLowerCase());
    answerParts.push(`in ${matchedCity}`);
  }

  // State filter
  if (q.includes('idle')) {
    filtered = filtered.filter(c => c.state === 'idle');
    answerParts.push('that are idle');
  } else if (q.includes('charging')) {
    filtered = filtered.filter(c => c.state === 'charging');
    answerParts.push('currently charging');
  } else if (q.includes('offline')) {
    filtered = filtered.filter(c => c.state === 'offline');
    answerParts.push('that are offline');
  } else if (q.includes('faulted') || q.includes('fault')) {
    filtered = filtered.filter(c => c.state === 'faulted');
    answerParts.push('in faulted state');
  }

  // Risk filter
  if (q.includes('critical')) {
    filtered = filtered.filter(c => c.risk_level === 'CRITICAL');
    answerParts.push('with CRITICAL risk');
  } else if (q.includes('high risk') || q.includes('high-risk')) {
    filtered = filtered.filter(c => c.risk_level === 'HIGH' || c.risk_level === 'CRITICAL');
    answerParts.push('with HIGH or CRITICAL risk');
  }

  // Temperature sort/filter
  if (q.includes('hot') || q.includes('temperature') || q.includes('hottest') || q.includes('thermal')) {
    filtered = filtered.sort((a, b) => b.temperature - a.temperature);
    const hotOnes = filtered.filter(c => c.temperature > 50);
    if (hotOnes.length > 0) {
      answerParts.push(`with temperatures above 50°C`);
    } else {
      answerParts.push('sorted by temperature (highest first)');
    }
  }

  // Worst / failing
  if (q.includes('worst') || q.includes('failing') || q.includes('worst performing')) {
    filtered = filtered.sort((a, b) => a.health_score - b.health_score);
    answerParts.push('sorted by worst health score');
  }

  // Build answer
  let answer: string;
  if (filtered.length === 0) {
    answer = 'No chargers found matching your query. Try a different search.';
  } else {
    const prefix = `Found ${filtered.length} charger${filtered.length !== 1 ? 's' : ''}`;
    answer = answerParts.length > 0
      ? `${prefix} ${answerParts.join(', ')}.`
      : `${prefix} in your fleet.`;
  }

  return { query, answer, chargers: filtered.slice(0, 20) };
}

function getRiskColor(risk: string, isDark: boolean) {
  switch (risk) {
    case 'CRITICAL': return 'text-red-400 bg-red-500/10 border-red-500/20';
    case 'HIGH': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    case 'MEDIUM': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    default: return isDark ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20';
  }
}

function getStateIcon(state: string) {
  switch (state) {
    case 'charging': return <Zap className="w-3.5 h-3.5 text-cyan-400" />;
    case 'faulted': return <ThermometerSun className="w-3.5 h-3.5 text-red-400" />;
    default: return null;
  }
}

export function NLQueryPage() {
  const { chargers, theme } = useFleet();
  const isDark = theme === 'black' || theme === 'dark';

  const [input, setInput] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [displayedAnswer, setDisplayedAnswer] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Typing animation
  useEffect(() => {
    if (!result) return;
    setIsTyping(true);
    setDisplayedAnswer('');
    let idx = 0;
    const fullText = result.answer;

    if (typingRef.current) clearInterval(typingRef.current);

    typingRef.current = setInterval(() => {
      idx++;
      setDisplayedAnswer(fullText.slice(0, idx));
      if (idx >= fullText.length) {
        if (typingRef.current) clearInterval(typingRef.current);
        setIsTyping(false);
      }
    }, 20);

    return () => {
      if (typingRef.current) clearInterval(typingRef.current);
    };
  }, [result]);

  const handleSubmit = useCallback((queryText?: string) => {
    const q = (queryText || input).trim();
    if (!q) return;

    const parsed = parseQuery(q, chargers);
    setResult(parsed);
    setHistory(prev => {
      const updated = [q, ...prev.filter(h => h !== q)].slice(0, 5);
      return updated;
    });
    if (!queryText) setInput('');
  }, [input, chargers]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Fleet Query</h1>
          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Ask natural language questions about your charger fleet
          </p>
        </div>
      </motion.div>

      {/* Query Input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`relative rounded-2xl border backdrop-blur-xl overflow-hidden ${isDark ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-white border-black/[0.06]'}`}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your fleet... e.g. Which chargers in Delhi are running hot?"
          rows={3}
          className={`w-full resize-none px-5 pt-5 pb-14 text-sm bg-transparent outline-none placeholder:text-slate-500 ${isDark ? 'text-white' : 'text-slate-900'}`}
          style={{ fontFamily: 'var(--font-sans)' }}
        />
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <button
            onClick={() => handleSubmit()}
            disabled={!input.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Query</span>
          </button>
        </div>
        <div className="absolute bottom-3 left-5">
          <Search className={`w-4 h-4 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
        </div>
      </motion.div>

      {/* Suggestion Chips (when input is empty and no result) */}
      {!input && !result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-2"
        >
          {SUGGESTION_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => {
                setInput(chip);
                handleSubmit(chip);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all hover:scale-[1.02] ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-slate-300 hover:bg-white/[0.08] hover:text-white' : 'bg-white border-black/[0.06] text-slate-600 hover:bg-black/[0.03] hover:text-black'}`}
            >
              {chip}
            </button>
          ))}
        </motion.div>
      )}

      {/* Query History */}
      {history.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap gap-2 items-center"
        >
          <span className={`text-[11px] font-medium uppercase tracking-wider ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Recent:</span>
          {history.map((h, i) => (
            <button
              key={`${h}-${i}`}
              onClick={() => {
                setInput(h);
                handleSubmit(h);
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-all ${isDark ? 'bg-cyan-500/5 border-cyan-500/10 text-cyan-400 hover:bg-cyan-500/10' : 'bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100'}`}
            >
              {h}
            </button>
          ))}
        </motion.div>
      )}

      {/* Result Section */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={result.query}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* AI Answer */}
            <div className={`rounded-xl border p-4 ${isDark ? 'bg-violet-500/5 border-violet-500/10' : 'bg-violet-50 border-violet-200'}`}>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {displayedAnswer}
                    {isTyping && <span className="inline-block w-0.5 h-4 ml-0.5 bg-violet-400 animate-pulse" />}
                  </p>
                </div>
              </div>
            </div>

            {/* Result Cards */}
            {result.chargers.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {result.chargers.map((charger, i) => (
                  <motion.div
                    key={charger.charger_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`rounded-xl border p-4 transition-all hover:scale-[1.01] ${isDark ? 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]' : 'bg-white border-black/[0.06] hover:border-black/[0.1]'}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getStateIcon(charger.state)}
                        <span className={`text-xs font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {charger.charger_id}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRiskColor(charger.risk_level, isDark)}`}>
                        {charger.risk_level}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Health</span>
                        <span className={`text-[11px] font-semibold ${charger.health_score < 50 ? 'text-red-400' : charger.health_score < 75 ? 'text-yellow-400' : isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          {charger.health_score}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Temperature</span>
                        <span className={`text-[11px] font-semibold ${charger.temperature > 55 ? 'text-red-400' : isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          {charger.temperature.toFixed(1)}°C
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Power</span>
                        <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          {charger.power_kw.toFixed(1)} kW
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Location</span>
                        <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {charger.location.city || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>State</span>
                        <span className={`text-[11px] font-medium capitalize ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {charger.state}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

