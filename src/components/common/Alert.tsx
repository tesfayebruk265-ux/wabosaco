import React from 'react';
import { AlertVariant } from '../../types/ui';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  onDismiss?: () => void;
  action?: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  className,
  variant = 'info',
  title,
  children,
  onDismiss,
  action,
  ...props
}) => {
  const styles: Record<AlertVariant, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
    info: {
      bg: 'bg-[#EFF6FF] dark:bg-blue-950/50',
      border: 'border-[#BFDBFE] dark:border-blue-800',
      text: 'text-[#1D4ED8] dark:text-blue-100',
      icon: <Info className="w-5 h-5 text-[#2563EB] flex-shrink-0" />,
    },
    success: {
      bg: 'bg-[#E8F5E9] dark:bg-emerald-950/50',
      border: 'border-[#A5D6A7] dark:border-emerald-800',
      text: 'text-[#1B5E20] dark:text-emerald-100',
      icon: <CheckCircle2 className="w-5 h-5 text-[#2E7D32] flex-shrink-0" />,
    },
    warning: {
      bg: 'bg-[#FFFBEB] dark:bg-amber-950/50',
      border: 'border-[#FDE68A] dark:border-amber-800',
      text: 'text-[#B45309] dark:text-amber-100',
      icon: <AlertTriangle className="w-5 h-5 text-[#F59E0B] flex-shrink-0" />,
    },
    error: {
      bg: 'bg-[#FEF2F2] dark:bg-rose-950/50',
      border: 'border-[#FECACA] dark:border-rose-800',
      text: 'text-[#B91C1C] dark:text-rose-100',
      icon: <AlertCircle className="w-5 h-5 text-[#DC2626] flex-shrink-0" />,
    },
  };

  const current = styles[variant];

  return (
    <div
      role="alert"
      className={cn('flex items-start justify-between p-4 sm:p-5 rounded-[14px] border transition-all', current.bg, current.border, current.text, className)}
      {...props}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{current.icon}</div>
        <div className="flex flex-col gap-0.5">
          {title && <h4 className="text-[15px] font-semibold tracking-tight">{title}</h4>}
          <div className="text-[14px] leading-relaxed opacity-95">{children}</div>
          {action && <div className="mt-2.5">{action}</div>}
        </div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 -mr-1 -mt-1 rounded-lg transition-colors cursor-pointer"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
