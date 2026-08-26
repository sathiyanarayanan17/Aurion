import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  highlight?: boolean;
  pulse?: boolean;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-cyan-400',
  iconBg = 'bg-cyan-500/10 border-cyan-500/20',
  trend,
  highlight = false,
  pulse = false,
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl border p-5 transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.99]' : ''
      } ${
        highlight
          ? 'bg-slate-900/90 dark:bg-slate-900/90 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
          : 'bg-slate-900/60 dark:bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
      } backdrop-blur-xl group`}
    >
      {/* Background ambient gradient glow */}
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-cyan-500/5 blur-2xl transition-all group-hover:bg-cyan-500/10" />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl lg:text-3xl font-extrabold tracking-tight font-mono text-slate-100">
              {value}
            </h3>
            {trend && (
              <span
                className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                  trend.isPositive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}
              >
                {trend.value}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-400/90 font-medium">
              {subtitle}
            </p>
          )}
        </div>

        <div className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${iconBg} ${iconColor} transition-transform group-hover:scale-110 shadow-sm`}>
          {pulse && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
            </span>
          )}
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};
