import React from 'react';
import { RiskLevel } from '../../types';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  withPulse?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, size = 'md', withPulse = false }) => {
  const getStyle = () => {
    switch (level) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-500/15 border-rose-500/40 text-rose-400',
          dot: 'bg-rose-500',
          glow: 'shadow-[0_0_12px_rgba(244,63,94,0.4)]'
        };
      case 'HIGH':
        return {
          bg: 'bg-amber-500/15 border-amber-500/40 text-amber-400',
          dot: 'bg-amber-500',
          glow: 'shadow-[0_0_12px_rgba(245,158,11,0.3)]'
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-400/15 border-amber-400/30 text-amber-300',
          dot: 'bg-amber-400',
          glow: 'shadow-[0_0_8px_rgba(251,191,36,0.2)]'
        };
      case 'LOW':
      default:
        return {
          bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
          dot: 'bg-emerald-500',
          glow: 'shadow-[0_0_10px_rgba(16,185,129,0.25)]'
        };
    }
  };

  const style = getStyle();
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs font-semibold px-2.5 py-1',
    lg: 'text-sm font-semibold px-3.5 py-1.5'
  }[size];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border backdrop-blur-md transition-all ${style.bg} ${sizeClasses} ${level === 'CRITICAL' ? style.glow : ''}`}>
      <span className="relative flex h-2 w-2">
        {(withPulse || level === 'CRITICAL') && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${style.dot}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${style.dot}`} />
      </span>
      <span className="tracking-wide uppercase">{level}</span>
    </span>
  );
};
