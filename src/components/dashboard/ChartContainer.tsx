import React from 'react';
import { cn } from '../../utils/cn';

export interface ChartContainerProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  action,
  children,
  className,
}) => {
  return (
    <div className={cn('flex flex-col bg-white dark:bg-[#1E293B] rounded-[18px] border border-[#E5E7EB] dark:border-slate-700 p-8 shadow-[0_1px_3px_0_rgba(0,0,0,0.03),0_1px_2px_-1px_rgba(0,0,0,0.03)] transition-all duration-200 hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.05)]', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#E5E7EB] dark:border-slate-700/80 mb-6">
        <div>
          <h4 className="text-[18px] font-semibold text-[#111827] dark:text-white tracking-tight">{title}</h4>
          {subtitle && <p className="text-[14px] text-[#6B7280] dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="flex items-center gap-2.5">{action}</div>}
      </div>
      <div className="flex-1 w-full min-h-[260px] flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};
