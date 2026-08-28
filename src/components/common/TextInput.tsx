import React from 'react';
import { cn } from '../../utils/cn';

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  success?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  required?: boolean;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      className,
      id,
      label,
      helperText,
      error,
      success,
      leftElement,
      rightElement,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-[12.5px] font-semibold text-[#111827] dark:text-slate-200 select-none flex items-center justify-between">
            <span>
              {label} {required && <span className="text-[#DC2626] font-bold">*</span>}
            </span>
          </label>
        )}
        <div className="relative flex items-center w-full">
          {leftElement && (
            <div className="absolute left-3 flex items-center pointer-events-none text-slate-400 [&>svg]:w-4 [&>svg]:h-4">
              {leftElement}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(
              'w-full bg-white dark:bg-slate-900 border text-[13px] text-[#111827] dark:text-white rounded-lg px-3 py-2 h-[42px] min-h-[42px] max-h-[44px] transition-all duration-150 placeholder:text-slate-400',
              'focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/20 focus:border-[#2E7D32]',
              'disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed',
              leftElement ? 'pl-9' : '',
              rightElement ? 'pr-9' : '',
              error
                ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20 text-[#DC2626] dark:text-rose-300'
                : success
                ? 'border-[#16A34A] focus:border-[#16A34A] focus:ring-[#16A34A]/20'
                : 'border-[#E5E7EB] dark:border-slate-700',
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3.5 flex items-center text-slate-400 [&>svg]:w-5 [&>svg]:h-5">
              {rightElement}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-[13px] text-[#DC2626] dark:text-rose-400 font-medium leading-normal">{error}</p>
        ) : success ? (
          <p className="text-[13px] text-[#16A34A] dark:text-emerald-400 font-medium leading-normal">{success}</p>
        ) : helperText ? (
          <p className="text-[13px] text-[#6B7280] dark:text-slate-400 leading-normal">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

TextInput.displayName = 'TextInput';
