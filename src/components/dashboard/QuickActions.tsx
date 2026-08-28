import React from 'react';
import { cn } from '../../utils/cn';

export interface QuickActionItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: 'primary' | 'success' | 'warning' | 'info';
  disabled?: boolean;
}

export interface QuickActionsProps {
  title?: string;
  actions: QuickActionItem[];
  className?: string;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  title = 'One-Touch Operations',
  actions,
  className,
}) => {
  const colorMap = {
    primary: 'bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border-emerald-200 dark:border-emerald-800',
    success: 'bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-50/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 border-amber-200 dark:border-amber-800',
    info: 'bg-sky-50/70 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 border-sky-200 dark:border-sky-800',
  };

  return (
    <div className={cn('flex flex-col bg-white dark:bg-[#1E293B] rounded-lg border border-slate-200 dark:border-slate-800 p-4 sm:p-4.5 shadow-xs transition-all duration-150', className)}>
      {title && (
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800 mb-3">
          <h4 className="text-[13px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">{title}</h4>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {actions.map((act) => (
          <button
            key={act.id}
            type="button"
            disabled={act.disabled}
            onClick={act.onClick}
            className={cn(
              'flex flex-col items-center text-center p-3 rounded-lg border transition-all duration-150 select-none group focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer',
              colorMap[act.color || 'primary'],
              act.disabled ? 'opacity-40 cursor-not-allowed' : ''
            )}
          >
            <div className="w-8 h-8 rounded-md bg-white dark:bg-slate-800 flex items-center justify-center shadow-2xs mb-1.5 group-hover:scale-105 transition-transform [&>svg]:w-4.5 [&>svg]:h-4.5 text-emerald-600">
              {act.icon}
            </div>
            <span className="text-[12.5px] font-bold leading-tight text-slate-900 dark:text-white">{act.label}</span>
            {act.description && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5 leading-tight truncate max-w-full">{act.description}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
