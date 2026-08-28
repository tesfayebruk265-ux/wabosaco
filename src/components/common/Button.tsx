import React from 'react';
import { ButtonVariant, ButtonSize } from '../../types/ui';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const sizeClasses: Record<ButtonSize, string> = {
      sm: 'text-[12px] px-3 py-1 gap-1.5 font-medium rounded-lg min-h-[32px]',
      md: 'text-[13px] px-4 py-1.5 gap-2 font-medium rounded-lg min-h-[38px] max-h-[40px]',
      lg: 'text-[14px] px-5 py-2 gap-2.5 font-semibold rounded-lg min-h-[44px]',
    };

    const variantClasses: Record<ButtonVariant, string> = {
      primary:
        'bg-[#2E7D32] hover:bg-[#1B5E20] active:bg-[#0F3812] text-white shadow-xs focus:ring-[#2E7D32] focus:ring-offset-2 border-0',
      secondary:
        'bg-white hover:bg-[#E8F5E9] active:bg-[#C8E6C9] text-[#111827] border border-[#E5E7EB] shadow-xs focus:ring-[#2E7D32] dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800',
      destructive:
        'bg-[#DC2626] hover:bg-[#B91C1C] active:bg-[#991B1B] text-white shadow-xs focus:ring-[#DC2626] border-0',
      outline:
        'bg-transparent hover:bg-[#E8F5E9] active:bg-[#C8E6C9] text-[#2E7D32] border border-[#2E7D32] focus:ring-[#2E7D32] dark:text-emerald-400 dark:border-emerald-500 dark:hover:bg-emerald-950/40',
      ghost:
        'bg-transparent hover:bg-[#E8F5E9] active:bg-[#C8E6C9] text-[#6B7280] hover:text-[#111827] focus:ring-[#2E7D32] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
      success:
        'bg-[#16A34A] hover:bg-[#15803D] active:bg-[#14532D] text-white shadow-xs focus:ring-[#16A34A] border-0',
      dark:
        'bg-[#1E293B] hover:bg-slate-800 active:bg-slate-950 text-white border border-slate-700 hover:border-slate-500 shadow-md focus:ring-slate-500',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none whitespace-nowrap cursor-pointer',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-[18px] h-[18px] animate-spin flex-shrink-0" />}
        {!isLoading && leftIcon && <span className="flex-shrink-0 text-current [&>svg]:w-[18px] [&>svg]:h-[18px]">{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="flex-shrink-0 text-current [&>svg]:w-[18px] [&>svg]:h-[18px]">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
