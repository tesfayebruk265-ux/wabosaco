import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface StatisticsCardProps {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  trend?: {
    value: number | string;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  subtitle?: string;
  badge?: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning';
  className?: string;
}

export const StatisticsCard: React.FC<StatisticsCardProps> = ({
  title,
  value,
  icon,
  trend,
  subtitle,
  badge,
  variant = 'default',
  className,
}) => {
  const variantStyles = {
    default: 'bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-800',
    primary: 'bg-white dark:bg-[#1E293B] border-emerald-200 dark:border-emerald-800/80',
    success: 'bg-white dark:bg-[#1E293B] border-emerald-200 dark:border-emerald-800/80',
    warning: 'bg-white dark:bg-[#1E293B] border-amber-200 dark:border-amber-800/80',
  };

  const iconBgStyles = {
    default: 'bg-slate-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700',
    primary: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    success: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
  };

  return (
    <div
      className={cn(
        'flex flex-col justify-between p-4 sm:p-4.5 rounded-lg border shadow-xs transition-all duration-150 hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-700 group min-h-[115px] max-h-[128px]',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-tight truncate">
            {title}
          </span>
          <div className="text-[22px] sm:text-[24px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight mt-0.5 tabular-nums">
            {value}
          </div>
        </div>
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-2xs group-hover:scale-105 transition-transform [&>svg]:w-4.5 [&>svg]:h-4.5', iconBgStyles[variant])}>
          {icon}
        </div>
      </div>

      {(trend || subtitle || badge) && (
        <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[12px]">
          {trend ? (
            <div className="flex items-center gap-1.5 font-medium truncate">
              <span
                className={cn(
                  'inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full',
                  trend.direction === 'up'
                    ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    : trend.direction === 'down'
                    ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                )}
              >
                {trend.direction === 'up' && <ArrowUpRight className="w-3 h-3 mr-0.5" />}
                {trend.direction === 'down' && <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                {trend.direction === 'neutral' && <Minus className="w-3 h-3 mr-0.5" />}
                {trend.value}
              </span>
              {trend.label && <span className="text-slate-500 dark:text-slate-400 text-[11.5px] truncate">{trend.label}</span>}
            </div>
          ) : subtitle ? (
            <span className="text-slate-500 dark:text-slate-400 text-[11.5px] font-medium truncate">{subtitle}</span>
          ) : null}

          {badge && <div className="shrink-0">{badge}</div>}
        </div>
      )}
    </div>
  );
};

export interface DashboardSectionProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({
  title,
  description,
  action,
  children,
  className,
}) => {
  return (
    <section className={cn('space-y-4', className)}>
      {(title || action) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
          <div>
            {title && <h2 className="text-[20px] sm:text-[24px] font-semibold text-[#111827] dark:text-white tracking-tight">{title}</h2>}
            {description && <p className="text-[14px] text-[#6B7280] dark:text-slate-400">{description}</p>}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
};
