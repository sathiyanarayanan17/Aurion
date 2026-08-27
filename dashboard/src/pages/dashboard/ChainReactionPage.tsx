import { useState, useCallback, useEffect, useRef } from 'react';
import { useFleet } from '../../context/FleetContext';
import { GitBranch, Zap, AlertTriangle, RotateCcw, Play, CircleDot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChargerSummary } from '../../types';

type NodeStatus = 'normal' | 'failed' | 'overloaded' | 'degraded';

interface CascadeNode {
  charger: ChargerSummary;
  status: NodeStatus;
  x: number;
  y: number;
  delay: number;
}

interface CascadeStats {
  initialFailure: string | null;
  depth: number;
  affected: number;
  revenueLoss: number;
}

function getRiskNodeColor(risk: string, status: NodeStatus, isDark: boolean): string {
  if (status === 'failed') return 'bg-red-500 shadow-red-500/50 shadow-lg';
  if (status === 'overloaded') return 'bg-orange-500 shadow-orange-500/40 shadow-lg';
  if (status === 'degraded') return 'bg-yellow-500 shadow-yellow-500/30 shadow-md';

  switch (risk) {
    case 'CRITICAL': return isDark ? 'bg-red-500/30 border-red-500/50' : 'bg-red-100 border-red-300';
    case 'HIGH': return isDark ? 'bg-orange-500/20 border-orange-500/40' : 'bg-orange-100 border-orange-300';
    case 'MEDIUM': return isDark ? 'bg-yellow-500/20 border-yellow-500/40' : 'bg-yellow-100 border-yellow-300';
    default: return isDark ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-emerald-100 border-emerald-300';
  }
}

export function ChainReactionPage() {
  const { chargers, theme } = useFleet();
  const isDark = theme === 'black' || theme === 'dark';

  const [nodes, setNodes] = useState<CascadeNode[]>([]);
  const [cascadeStats, setCascadeStats] = useState<CascadeStats>({
    initialFailure: null,
    depth: 0,
    affected: 0,
    revenueLoss: 0,
  });
  const [isSimulating, setIsSimulating] = useState(false);
  const [rippleLines, setRippleLines] = useState<{ from: number; to: number; active: boolean }[]>([]);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Group chargers by city and create positioned nodes
  useEffect(() => {
    if (chargers.length === 0) return;

    const cities = [...new Set(chargers.map(c => c.location.city || 'Unknown'))];
    const positioned: CascadeNode[] = [];

    cities.forEach((city, cityIdx) => {
      const cityChargers = chargers.filter(c => (c.location.city || 'Unknown') === city);
      const clusterCenterX = 100 + (cityIdx % 3) * 280;
      const clusterCenterY = 80 + Math.floor(cityIdx / 3) * 250;

      cityChargers.forEach((charger, i) => {
        const angle = (i / cityChargers.length) * 2 * Math.PI;
        const radius = 60 + (i % 2) * 30;
        const x = clusterCenterX + Math.cos(angle) * radius;
        const y = clusterCenterY + Math.sin(angle) * radius;

        positioned.push({
          charger,
          status: 'normal',
          x,
          y,
          delay: 0,
        });
      });
    });

    setNodes(positioned);
  }, [chargers]);

  const clearCascade = useCallback(() => {
    timeoutsRef.current.forEach(t => clearTimeout(t));
    timeoutsRef.current = [];
    setNodes(prev => prev.map(n => ({ ...n, status: 'normal', delay: 0 })));
    setCascadeStats({ initialFailure: null, depth: 0, affected: 0, revenueLoss: 0 });
    setRippleLines([]);
    setIsSimulating(false);
  }, []);

  const simulateCascade = useCallback((nodeIndex: number) => {
    if (isSimulating) return;
    clearCascade();
    setIsSimulating(true);

    const targetNode = nodes[nodeIndex];
    if (!targetNode) return;

    // Step 1: Fail the clicked node immediately
    setNodes(prev => {
      const updated = [...prev];
      updated[nodeIndex] = { ...updated[nodeIndex], status: 'failed', delay: 0 };
      return updated;
    });

    setCascadeStats({
      initialFailure: targetNode.charger.charger_id,
      depth: 1,
      affected: 1,
      revenueLoss: targetNode.charger.power_kw * 2.5,
    });

    // Find 2-3 nearby nodes (same city or closest distance)
    const sameCity = nodes
      .map((n, i) => ({ n, i }))
      .filter(({ n, i }) => i !== nodeIndex && (n.charger.location.city === targetNode.charger.location.city))
      .slice(0, 3);

    // Step 2: Overload nearby after 1s
    const t1 = setTimeout(() => {
      const overloadedIndices = sameCity.map(s => s.i);
      setNodes(prev => {
        const updated = [...prev];
        overloadedIndices.forEach(idx => {
          updated[idx] = { ...updated[idx], status: 'overloaded', delay: 1 };
        });
        return updated;
      });

      setRippleLines(overloadedIndices.map(to => ({ from: nodeIndex, to, active: true })));

      setCascadeStats(prev => ({
        ...prev,
        depth: 2,
        affected: 1 + overloadedIndices.length,
        revenueLoss: prev.revenueLoss + overloadedIndices.length * 1.8 * 2.5,
      }));

      // Step 3: Degrade secondary nodes after 2s
      const t2 = setTimeout(() => {
        // Find nodes adjacent to overloaded ones
        const secondaryTargets = nodes
          .map((n, i) => ({ n, i }))
          .filter(({ i }) => i !== nodeIndex && !overloadedIndices.includes(i))
          .filter(({ n }) => {
            return sameCity.some(s =>
              Math.abs(n.x - s.n.x) < 120 && Math.abs(n.y - s.n.y) < 120
            );
          })
          .slice(0, 3);

        const degradedIndices = secondaryTargets.map(s => s.i);

        setNodes(prev => {
          const updated = [...prev];
          degradedIndices.forEach(idx => {
            updated[idx] = { ...updated[idx], status: 'degraded', delay: 2 };
          });
          return updated;
        });

        setRippleLines(prev => [
          ...prev,
          ...degradedIndices.map(to => ({
            from: overloadedIndices[0] ?? nodeIndex,
            to,
            active: true,
          })),
        ]);

        setCascadeStats(prev => ({
          ...prev,
          depth: 3,
          affected: prev.affected + degradedIndices.length,
          revenueLoss: prev.revenueLoss + degradedIndices.length * 1.2 * 2.5,
        }));

        setIsSimulating(false);
      }, 1000);

      timeoutsRef.current.push(t2);
    }, 1000);

    timeoutsRef.current.push(t1);
  }, [nodes, isSimulating, clearCascade]);

  const autoSimulate = useCallback(() => {
    if (nodes.length === 0) return;
    const randomIdx = Math.floor(Math.random() * nodes.length);
    simulateCascade(randomIdx);
  }, [nodes, simulateCascade]);

  // Determine container size based on nodes
  const containerWidth = Math.max(800, ...nodes.map(n => n.x + 60));
  const containerHeight = Math.max(500, ...nodes.map(n => n.y + 60));

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/20">
            <GitBranch className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Cascade Simulator</h1>
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Visualize failure chain reactions across your fleet
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={autoSimulate}
            disabled={isSimulating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-600 text-white text-xs font-semibold shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all disabled:opacity-40"
          >
            <Play className="w-3.5 h-3.5" />
            Auto-simulate
          </button>
          <button
            onClick={clearCascade}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${isDark ? 'border-white/[0.08] text-slate-300 hover:bg-white/[0.05]' : 'border-black/[0.08] text-slate-600 hover:bg-black/[0.03]'}`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </motion.div>

      {/* Explanation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className={`rounded-xl border p-4 flex items-start gap-3 ${isDark ? 'bg-orange-500/5 border-orange-500/10' : 'bg-orange-50 border-orange-200'}`}
      >
        <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
        <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          When a charger goes offline, nearby stations absorb its demand, causing thermal stress and accelerated wear. Click any node to simulate a failure and observe the cascade effect.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Network Graph */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={`xl:col-span-3 rounded-2xl border overflow-hidden ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-black/[0.06]'}`}
        >
          <div className="overflow-auto" style={{ maxHeight: '600px' }}>
            <div className="relative" style={{ width: containerWidth, height: containerHeight, minWidth: '100%' }}>
              {/* SVG for ripple lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ width: containerWidth, height: containerHeight }}>
                <AnimatePresence>
                  {rippleLines.map((line, i) => {
                    const fromNode = nodes[line.from];
                    const toNode = nodes[line.to];
                    if (!fromNode || !toNode) return null;
                    return (
                      <motion.line
                        key={`${line.from}-${line.to}-${i}`}
                        x1={fromNode.x + 20}
                        y1={fromNode.y + 20}
                        x2={toNode.x + 20}
                        y2={toNode.y + 20}
                        stroke={isDark ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.6)'}
                        strokeWidth={2}
                        strokeDasharray="6 4"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                      />
                    );
                  })}
                </AnimatePresence>
              </svg>

              {/* City Labels */}
              {[...new Set(chargers.map(c => c.location.city || 'Unknown'))].map((city, idx) => {
                const cityNodes = nodes.filter(n => (n.charger.location.city || 'Unknown') === city);
                if (cityNodes.length === 0) return null;
                const avgX = cityNodes.reduce((s, n) => s + n.x, 0) / cityNodes.length;
                const minY = Math.min(...cityNodes.map(n => n.y));

                return (
                  <div
                    key={city}
                    className={`absolute text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-600' : 'text-slate-300'}`}
                    style={{ left: avgX - 20, top: minY - 30 }}
                  >
                    {city}
                  </div>
                );
              })}

              {/* Nodes */}
              {nodes.map((node, i) => (
                <motion.button
                  key={node.charger.charger_id}
                  className={`absolute w-10 h-10 rounded-full border-2 flex items-center justify-center cursor-pointer z-10 transition-all ${getRiskNodeColor(node.charger.risk_level, node.status, isDark)} ${node.status === 'failed' ? 'animate-pulse' : ''}`}
                  style={{ left: node.x, top: node.y }}
                  onClick={() => simulateCascade(i)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  title={`${node.charger.charger_id} — ${node.charger.risk_level} — ${node.status}`}
                >
                  {node.status === 'failed' ? (
                    <Zap className="w-4 h-4 text-white" />
                  ) : node.status === 'overloaded' ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <CircleDot className="w-3.5 h-3.5" />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Stats Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {/* Cascade Stats */}
          <div className={`rounded-xl border p-4 space-y-4 ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-black/[0.06]'}`}>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: 'var(--font-display)' }}>
              Cascade Analysis
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Initial Failure</span>
                <span className={`text-xs font-bold font-mono ${cascadeStats.initialFailure ? 'text-red-400' : isDark ? 'text-slate-600' : 'text-slate-300'}`}>
                  {cascadeStats.initialFailure || '—'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Cascade Depth</span>
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {cascadeStats.depth}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Chargers Affected</span>
                <span className={`text-xs font-bold ${cascadeStats.affected > 3 ? 'text-red-400' : isDark ? 'text-white' : 'text-slate-900'}`}>
                  {cascadeStats.affected}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Est. Revenue Loss</span>
                <span className={`text-xs font-bold text-orange-400`}>
                  ₹{cascadeStats.revenueLoss.toFixed(0)}/hr
                </span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className={`rounded-xl border p-4 space-y-2.5 ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-black/[0.06]'}`}>
            <h3 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Legend</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Failed (source)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Overloaded</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Degraded</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full border-2 ${isDark ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-emerald-100 border-emerald-300'}`} />
                <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Healthy</span>
              </div>
            </div>
          </div>

          {/* Node count by city */}
          <div className={`rounded-xl border p-4 space-y-2.5 ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-black/[0.06]'}`}>
            <h3 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Clusters</h3>
            <div className="space-y-1.5">
              {[...new Set(chargers.map(c => c.location.city || 'Unknown'))].map(city => (
                <div key={city} className="flex justify-between items-center">
                  <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{city}</span>
                  <span className={`text-[11px] font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {chargers.filter(c => (c.location.city || 'Unknown') === city).length}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

