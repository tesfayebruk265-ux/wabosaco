import React from 'react';
import { CurrencyDisplay } from './CurrencyDisplay';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface DebitCreditDisplayProps {
  type: 'DEBIT' | 'CREDIT';
  amount: number;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const DebitCreditDisplay: React.FC<DebitCreditDisplayProps> = ({
  type,
  amount,
  showIcon = true,
  size = 'md',
  className,
}) => {
  const isCredit = type === 'CREDIT';

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      {showIcon && (
        <span
          className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
            isCredit ? 'bg-[#DCFCE7] text-[#15803D] dark:bg-emerald-950 dark:text-emerald-300' : 'bg-[#FEE2E2] text-[#B91C1C] dark:bg-rose-950 dark:text-rose-300'
          )}
        >
          {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
        </span>
      )}
      <CurrencyDisplay
        amount={amount}
        size={size}
        className={isCredit ? 'text-[#15803D] dark:text-emerald-400' : 'text-[#0F172A] dark:text-slate-200'}
        showSign={isCredit}
      />
    </div>
  );
};

export interface InterestRateDisplayProps {
  rate: number; // e.g. 6.0 or 13.5
  period?: 'p.a.' | 'monthly';
  className?: string;
}

export const InterestRateDisplay: React.FC<InterestRateDisplayProps> = ({
  rate,
  period = 'p.a.',
  className,
}) => {
  return (
    <span className={cn('inline-flex items-baseline gap-1 font-bold text-[#0F172A] dark:text-white tabular-nums text-[17px]', className)}>
      <span>{rate.toFixed(1)}%</span>
      <span className="text-[14px] font-medium text-[#475569] dark:text-slate-400 uppercase">{period}</span>
    </span>
  );
};
