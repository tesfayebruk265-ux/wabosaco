import React from 'react';
import { BadgeVariant } from '../../types/ui';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  size = 'md',
  icon,
  children,
  ...props
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    primary: 'bg-[#E8F5E9] text-[#1B5E20] border-[#C8E6C9] dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    secondary: 'bg-[#F1F5F9] text-[#374151] border-[#E5E7EB] dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    success: 'bg-[#E8F5E9] text-[#1B5E20] border-[#A5D6A7] dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    warning: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A] dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    error: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA] dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    info: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE] dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    neutral: 'bg-[#F8FAFC] text-[#6B7280] border-[#E5E7EB] dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  };

  const sizeStyles = {
    sm: 'text-[12px] px-2.5 py-0.5 font-semibold gap-1.5',
    md: 'text-[13px] px-3 py-1 font-semibold gap-1.5',
    lg: 'text-[14px] px-3.5 py-1.5 font-semibold gap-2',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border leading-normal select-none whitespace-nowrap transition-colors',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {icon && <span className="flex-shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

export interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, size = 'md' }) => {
  const s = status.toUpperCase().replace(/\s+/g, '_');

  let variant: BadgeVariant = 'neutral';
  let label = status.replace(/_/g, ' ');

  if (['ACTIVE', 'APPROVED', 'COMPLETED', 'DISBURSED', 'POSTED', 'VERIFIED', 'SETTLED', 'CLOSED_SETTLED'].includes(s)) {
    variant = 'success';
  } else if (['PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'DRAFT', 'LOCKED', 'WAITING'].includes(s)) {
    variant = 'warning';
  } else if (['PROCESSING', 'IN_PROGRESS', 'OPEN'].includes(s)) {
    variant = 'info';
  } else if (['OVERDUE', 'REJECTED', 'TERMINATED', 'SUSPENDED', 'FAILED', 'REVERSED', 'CANCELLED', 'DEFAULTED'].includes(s)) {
    variant = 'error';
  } else if (['DORMANT', 'CLOSED', 'INACTIVE'].includes(s)) {
    variant = 'neutral';
  } else if (['TIME_DEPOSIT', 'REGULAR', 'VOLUNTARY'].includes(s)) {
    variant = 'primary';
  }

  // Capitalize nicely
  const displayLabel = label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();

  return (
    <Badge variant={variant} size={size} className={className}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-0.5 opacity-80" />
      {displayLabel}
    </Badge>
  );
};
