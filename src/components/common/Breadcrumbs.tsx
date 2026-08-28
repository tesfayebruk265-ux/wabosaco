import React from 'react';
import { BreadcrumbItem } from '../../types/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate?: (href: string) => void;
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, onNavigate, className }) => {
  return (
    <nav className={cn('flex items-center text-[14px] text-slate-500 dark:text-slate-400', className)} aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1.5 flex-wrap">
        <li className="inline-flex items-center">
          <button
            type="button"
            onClick={() => onNavigate?.('/')}
            className="inline-flex items-center text-slate-400 hover:text-[#2E7D32] dark:hover:text-emerald-400 transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5 mr-1" />
            <span>Home</span>
          </button>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="inline-flex items-center space-x-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              {isLast || !item.href ? (
                <span className="font-semibold text-[#111827] dark:text-white truncate max-w-sm">{item.label}</span>
              ) : (
                <button
                  type="button"
                  onClick={() => item.href && onNavigate?.(item.href)}
                  className="hover:text-[#2E7D32] dark:hover:text-emerald-400 font-medium transition-colors truncate max-w-sm cursor-pointer"
                >
                  {item.label}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
