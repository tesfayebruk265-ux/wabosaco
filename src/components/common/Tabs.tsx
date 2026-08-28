import React from 'react';
import { cn } from '../../utils/cn';

export interface TabItem {
  id: string;
  label: string;
  count?: number | string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'underline' | 'pills';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  className,
}) => {
  if (variant === 'pills') {
    return (
      <div className={cn('flex items-center gap-1.5 p-1 bg-[#F1F5F9] dark:bg-slate-800 rounded-[14px] border border-[#E5E7EB] dark:border-slate-700', className)}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              disabled={tab.disabled}
              onClick={() => onChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-[14px] font-semibold rounded-[10px] min-h-[40px] transition-all duration-200 select-none cursor-pointer',
                isActive
                  ? 'bg-white dark:bg-[#1E293B] text-[#2E7D32] dark:text-emerald-400 shadow-xs'
                  : 'text-[#6B7280] dark:text-slate-300 hover:text-[#111827] dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700',
                tab.disabled ? 'opacity-40 cursor-not-allowed' : ''
              )}
            >
              {tab.icon && <span className="[&>svg]:w-4 [&>svg]:h-4">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'text-[12px] px-2 py-0.5 rounded-full font-bold',
                    isActive ? 'bg-[#E8F5E9] dark:bg-emerald-950 text-[#1B5E20] dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-700 text-[#6B7280] dark:text-slate-300'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('border-b border-[#E5E7EB] dark:border-slate-800', className)}>
      <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              disabled={tab.disabled}
              onClick={() => onChange(tab.id)}
              className={cn(
                'flex items-center gap-2 py-3 px-1 border-b-2 font-semibold text-[15px] transition-all duration-200 whitespace-nowrap select-none cursor-pointer',
                isActive
                  ? 'border-[#2E7D32] text-[#2E7D32] dark:text-emerald-400'
                  : 'border-transparent text-[#6B7280] dark:text-slate-400 hover:text-[#111827] dark:hover:text-slate-100 hover:border-slate-300',
                tab.disabled ? 'opacity-40 cursor-not-allowed' : ''
              )}
            >
              {tab.icon && <span className="[&>svg]:w-4 [&>svg]:h-4">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'text-[12px] px-2 py-0.5 rounded-full font-bold',
                    isActive ? 'bg-[#E8F5E9] text-[#1B5E20] dark:bg-emerald-950 dark:text-emerald-300' : 'bg-[#F1F5F9] dark:bg-slate-800 text-[#6B7280] dark:text-slate-300'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
