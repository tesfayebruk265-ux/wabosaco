import React from 'react';
import { cn } from '../../utils/cn';

export interface TextareaInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
}

export const TextareaInput = React.forwardRef<HTMLTextAreaElement, TextareaInputProps>(
  ({ className, id, label, helperText, error, required, disabled, rows = 3, ...props }, ref) => {
    const textareaId = id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full flex flex-col gap-2">
        {label && (
          <label htmlFor={textareaId} className="text-[18px] font-medium text-[#0F172A] dark:text-slate-200 select-none">
            {label} {required && <span className="text-[#EF4444] font-bold">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          rows={rows}
          className={cn(
            'w-full bg-white dark:bg-slate-900 border text-[18px] text-[#0F172A] dark:text-white rounded-[12px] p-4 transition-all placeholder:text-[#475569]/60',
            'focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]',
            'disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed',
            error ? 'border-[#EF4444] text-[#EF4444] dark:text-rose-200' : 'border-[#E2E8F0] dark:border-slate-700',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-[15px] text-[#EF4444] dark:text-rose-400 font-medium leading-normal">{error}</p>
        ) : helperText ? (
          <p className="text-[15px] text-[#475569] dark:text-slate-400 leading-normal">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

TextareaInput.displayName = 'TextareaInput';
