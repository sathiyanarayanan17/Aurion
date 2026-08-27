import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFleet } from '../../context/FleetContext';
import { Play, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DemoStep {
  delay: number;
  route: string;
  toast: string;
}

const DEMO_STEPS: DemoStep[] = [
  { delay: 0, route: '/dashboard/map', toast: 'Welcome to Aurion. This is your fleet of 20 EV chargers across India.' },
  { delay: 5000, route: '/dashboard', toast: 'The overview shows real-time health metrics. All chargers are currently healthy.' },
  { delay: 9000, route: '', toast: '⚡ Injecting thermal runaway fault into AUR-DEL-002 in Delhi...' },
  { delay: 13000, route: '/dashboard/alerts', toast: '🔔 Alert fired! Our ML ensemble detected the anomaly.' },
  { delay: 17000, route: '/dashboard/cascade', toast: '💥 The cascade simulator shows how nearby chargers get overloaded.' },
  { delay: 21000, route: '/dashboard/healing', toast: '🤖 Self-healing engaged: auto power de-rating to prevent damage.' },
  { delay: 25000, route: '/dashboard/fingerprint', toast: '🔍 Fingerprint analysis: 92% match to thermal_runaway signature.' },
  { delay: 29000, route: '/dashboard', toast: '✅ Demo complete! Explore the 21 pages yourself. Press Ctrl+K to search.' },
];

const TOTAL_DURATION = 33000; // 29s last step + 4s toast display

export function GuidedDemo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const startTimeRef = useRef<number>(0);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [progress, setProgress] = useState(0);

  const navigate = useNavigate();
  const { injectFault, theme } = useFleet();

  const isDark = theme === 'black' || theme === 'dark';

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
  }, []);

  const showStepToast = useCallback((message: string) => {
    setShowToast(false);
    // Small delay to allow exit animation
    setTimeout(() => {
      setToastMessage(message);
      setShowToast(true);
    }, 100);
    // Auto-dismiss after 4s
    const dismissTimeout = setTimeout(() => {
      setShowToast(false);
    }, 4000);
    timeoutsRef.current.push(dismissTimeout);
  }, []);

  const startDemo = useCallback(() => {
    setIsPlaying(true);
    setCurrentStep(0);
    setProgress(0);
    startTimeRef.current = Date.now();

    // Progress bar updater
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setProgress(Math.min((elapsed / TOTAL_DURATION) * 100, 100));
    }, 100);

    DEMO_STEPS.forEach((step, index) => {
      const timeout = setTimeout(() => {
        setCurrentStep(index + 1);

        // Navigate if route specified
        if (step.route) {
          navigate(step.route);
        }

        // Step 3 (index 2) injects the fault
        if (index === 2) {
          injectFault('AUR-DEL-002', 'thermal_runaway');
        }

        // Show toast
        showStepToast(step.toast);

        // End demo after last step toast
        if (index === DEMO_STEPS.length - 1) {
          const endTimeout = setTimeout(() => {
            setIsPlaying(false);
            setProgress(100);
            setTimeout(() => setProgress(0), 500);
          }, 4000);
          timeoutsRef.current.push(endTimeout);
        }
      }, step.delay);
      timeoutsRef.current.push(timeout);
    });
  }, [navigate, injectFault, showStepToast]);

  const stopDemo = useCallback(() => {
    clearAllTimeouts();
    setIsPlaying(false);
    setShowToast(false);
    setCurrentStep(0);
    setProgress(0);
  }, [clearAllTimeouts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearAllTimeouts();
  }, [clearAllTimeouts]);

  return (
    <>
      {/* Narration Toast - Top Center */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] max-w-lg w-[90vw]"
          >
            <div className={`px-5 py-3.5 rounded-xl border shadow-2xl backdrop-blur-2xl ${
              isDark
                ? 'bg-[#0c0c1d]/95 border-white/[0.1] shadow-black/60'
                : 'bg-white/95 border-black/[0.08] shadow-black/15'
            }`}>
              <p className={`text-sm font-medium leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                {toastMessage}
              </p>
              {/* Step indicator */}
              <div className="flex items-center gap-1.5 mt-2">
                {DEMO_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i < currentStep
                        ? 'w-3 bg-cyan-400'
                        : i === currentStep
                          ? 'w-3 bg-cyan-400/50'
                          : `w-2 ${isDark ? 'bg-white/10' : 'bg-black/10'}`
                    }`}
                  />
                ))}
                <span className={`ml-2 text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {currentStep}/{DEMO_STEPS.length}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Demo Button - Bottom Right, above stats bar */}
      <div className="fixed bottom-20 right-6 z-50">
        <AnimatePresence mode="wait">
          {isPlaying ? (
            <motion.div
              key="playing"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-end gap-2"
            >
              {/* Progress bar */}
              <div className={`w-40 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>

              {/* Stop button */}
              <button
                onClick={stopDemo}
                className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg ${
                  isDark
                    ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 shadow-red-500/10'
                    : 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 shadow-red-500/10'
                }`}
              >
                <Square className="w-4 h-4" />
                <span>Stop Demo</span>
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="idle"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={startDemo}
              className="group relative"
            >
              {/* Gradient border effect */}
              <div className="absolute -inset-[2px] bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 rounded-xl opacity-70 group-hover:opacity-100 transition-opacity animate-pulse" />

              {/* Button content */}
              <div className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isDark
                  ? 'bg-[#0a0a1a] text-white'
                  : 'bg-white text-slate-800'
              }`}>
                <Play className="w-4 h-4 text-cyan-400" />
                <span>Watch Demo</span>
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
