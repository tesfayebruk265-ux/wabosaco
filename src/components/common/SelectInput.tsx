import React from 'react';
import { cn } from '../../utils/cn';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  helperText?: string;
  error?: string;
  required?: boolean;
}

export const SelectInput = React.forwardRef<HTMLSelectElement, SelectInputProps>(
  ({ className, id, label, options, helperText, error, required, disabled, ...props }, ref) => {
    const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full flex flex-col gap-1">
        {label && (
          <label htmlFor={selectId} className="text-[12.5px] font-semibold text-[#111827] dark:text-slate-200 select-none">
            {label} {required && <span className="text-[#DC2626] font-bold">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={cn(
            'w-full bg-white dark:bg-slate-900 border text-[13px] text-[#111827] dark:text-white rounded-lg px-3 py-2 h-[42px] min-h-[42px] max-h-[44px] transition-all duration-150 cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/20 focus:border-[#2E7D32]',
            'disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed',
            error ? 'border-[#DC2626] text-[#DC2626] dark:text-rose-300' : 'border-[#E5E7EB] dark:border-slate-700',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled} className="text-[13px] py-1.5 bg-white dark:bg-slate-900 text-[#111827] dark:text-white">
              {opt.label}
            </option>
          ))}
        </select>
        {error ? (
          <p className="text-[13px] text-[#DC2626] dark:text-rose-400 font-medium leading-normal">{error}</p>
        ) : helperText ? (
          <p className="text-[13px] text-[#6B7280] dark:text-slate-400 leading-normal">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

SelectInput.displayName = 'SelectInput';
