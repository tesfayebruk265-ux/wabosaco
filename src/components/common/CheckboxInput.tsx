import React from 'react';
import { cn } from '../../utils/cn';

export interface CheckboxInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
  description?: string;
  error?: string;
}

export const CheckboxInput = React.forwardRef<HTMLInputElement, CheckboxInputProps>(
  ({ className, id, label, description, error, disabled, ...props }, ref) => {
    const inputId = id || `chk-${Math.random().toString(36).substring(2, 7)}`;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="flex items-start gap-3.5 cursor-pointer select-none">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            disabled={disabled}
            className={cn(
              'mt-1 h-5 w-5 rounded-md border-[#E2E8F0] text-[#16A34A] focus:ring-[#16A34A] focus:ring-offset-2 cursor-pointer disabled:cursor-not-allowed transition-colors',
              className
            )}
            {...props}
          />
          <div className="flex flex-col">
            <span className="text-[18px] font-medium text-[#0F172A] dark:text-white leading-snug">{label}</span>
            {description && <span className="text-[15px] text-[#475569] dark:text-slate-400 mt-0.5">{description}</span>}
          </div>
        </label>
        {error && <p className="text-[15px] text-[#EF4444] dark:text-rose-400 ml-8 font-medium">{error}</p>}
      </div>
    );
  }
);

CheckboxInput.displayName = 'CheckboxInput';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  options,
  selectedValue,
  onChange,
  label,
  error,
  disabled,
}) => {
  return (
    <div className="flex flex-col gap-3">
      {label && <span className="text-[18px] font-medium text-[#0F172A] dark:text-slate-200">{label}</span>}
      <div className="flex flex-col gap-2.5">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={cn(
              'flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all min-h-[52px]',
              selectedValue === opt.value
                ? 'border-[#16A34A] bg-[#F0FDF4] dark:bg-emerald-950/40 text-[#0F172A] dark:text-white ring-1 ring-[#16A34A]'
                : 'border-[#E2E8F0] dark:border-slate-700 hover:bg-[#F8FAFC] dark:hover:bg-slate-850',
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            )}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={selectedValue === opt.value}
              disabled={disabled}
              onChange={() => onChange(opt.value)}
              className="mt-1 h-5 w-5 text-[#16A34A] focus:ring-[#16A34A]"
            />
            <div className="flex flex-col">
              <span className="text-[18px] font-semibold text-[#0F172A] dark:text-white">{opt.label}</span>
              {opt.description && <span className="text-[15px] text-[#475569] dark:text-slate-400 mt-0.5">{opt.description}</span>}
            </div>
          </label>
        ))}
      </div>
      {error && <p className="text-[15px] text-[#EF4444] dark:text-rose-400 font-medium">{error}</p>}
    </div>
  );
};
