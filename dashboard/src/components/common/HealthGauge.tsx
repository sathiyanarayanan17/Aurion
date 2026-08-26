import React from 'react';

interface HealthGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

export const HealthGauge: React.FC<HealthGaugeProps> = ({
  score,
  size = 110,
  strokeWidth = 10,
  showLabel = true
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Use a 270-degree arc for a modern gauge look
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s < 30) return { stroke: '#f43f5e', glow: 'rgba(244, 63, 94, 0.4)', text: 'text-rose-400' };
    if (s < 60) return { stroke: '#f97316', glow: 'rgba(249, 115, 22, 0.4)', text: 'text-orange-400' };
    if (s < 75) return { stroke: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)', text: 'text-amber-400' };
    return { stroke: '#10b981', glow: 'rgba(16, 185, 129, 0.4)', text: 'text-emerald-400' };
  };

  const { stroke, glow, text } = getColor(score);

  return (
    <div className="flex flex-col items-center justify-center relative select-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          className="text-slate-700/40 dark:text-slate-800"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Animated Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          style={{
            filter: `drop-shadow(0 0 6px ${glow})`,
            transition: 'stroke-dashoffset 0.8s ease-in-out, stroke 0.5s ease'
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className={`text-2xl font-bold font-mono tracking-tight leading-none ${text}`}>
          {score}
        </span>
        {showLabel && (
          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mt-0.5">
            Health
          </span>
        )}
      </div>
    </div>
  );
};
