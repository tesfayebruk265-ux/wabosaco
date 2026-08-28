import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import { cn } from '../../utils/cn';

export interface CurrencyDisplayProps {
  amount: number | null | undefined;
  currency?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  colored?: boolean; // Green for positive, Red for negative
  showSign?: boolean;
  tabular?: boolean;
  className?: string;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  size = 'md',
  colored = false,
  showSign = false,
  tabular = true,
  className,
}) => {
  const val = amount || 0;
  const isPositive = val > 0;
  const isNegative = val < 0;

  const sizeClasses = {
    xs: 'text-[14px] font-semibold',
    sm: 'text-[16px] font-bold',
    md: 'text-[18px] font-bold',
    lg: 'text-[24px] font-bold tracking-tight',
    xl: 'text-[34px] font-bold tracking-tight',
    hero: 'text-[46px] font-bold tracking-tight leading-tight',
  };

  let colorClass = 'text-[#0F172A] dark:text-white';
  if (colored) {
    if (isPositive) colorClass = 'text-[#16A34A] dark:text-emerald-400';
    else if (isNegative) colorClass = 'text-[#EF4444] dark:text-rose-400';
  }

  const sign = showSign && isPositive ? '+' : '';

  return (
    <span
      className={cn(
        sizeClasses[size],
        colorClass,
        tabular ? 'tabular-nums' : '',
        className
      )}
    >
      {sign}
      {formatCurrency(val)}
    </span>
  );
};
