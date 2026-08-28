import React from 'react';
import { ButtonVariant, ButtonSize } from '../../types/ui';
import { cn } from '../../utils/cn';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  'aria-label': string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, icon, variant = 'ghost', size = 'md', ...props }, ref) => {
    const sizeClasses = {
      sm: 'w-[44px] h-[44px] p-2.5 rounded-[14px] min-w-[44px] min-h-[44px] [&>svg]:w-[18px] [&>svg]:h-[18px]',
      md: 'w-[50px] h-[50px] p-3 rounded-[14px] min-w-[50px] min-h-[50px] [&>svg]:w-[20px] [&>svg]:h-[20px]',
      lg: 'w-[56px] h-[56px] p-3.5 rounded-[14px] min-w-[56px] min-h-[56px] [&>svg]:w-[22px] [&>svg]:h-[22px]',
    };

    const variantClasses: Record<ButtonVariant, string> = {
      primary: 'bg-[#2E7D32] hover:bg-[#1B5E20] active:bg-[#0F3812] text-white shadow-xs',
      secondary: 'bg-white hover:bg-[#E8F5E9] active:bg-[#C8E6C9] text-[#111827] border border-[#E5E7EB] shadow-xs dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800',
      destructive: 'bg-[#FEF2F2] text-[#DC2626] hover:bg-rose-100 active:bg-rose-200 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300',
      outline: 'border border-[#E5E7EB] text-[#111827] hover:bg-[#E8F5E9] hover:text-[#2E7D32] active:bg-[#C8E6C9] dark:border-slate-700 dark:text-slate-200',
      ghost: 'text-[#6B7280] hover:text-[#111827] hover:bg-[#E8F5E9] active:bg-[#C8E6C9] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
      success: 'bg-[#E8F5E9] text-[#1B5E20] hover:bg-[#C8E6C9] border border-[#A5D6A7] dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      dark: 'bg-[#1E293B] hover:bg-slate-800 active:bg-slate-950 text-white border border-slate-700',
    };

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {icon}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
