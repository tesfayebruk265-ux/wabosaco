import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search records by name, ID, or reference...',
  size = 'md',
  className,
  ...props
}) => {
  return (
    <div className="relative flex items-center w-full">
      <Search className={cn('absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none', size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-lg text-[#111827] dark:text-white transition-all duration-150 placeholder:text-slate-400',
          'focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/20 focus:border-[#2E7D32]',
          size === 'sm' ? 'py-1.5 pl-8 pr-7 text-[12.5px] h-[36px] min-h-[36px]' : 'py-2 pl-9 pr-8 text-[13px] h-[42px] min-h-[42px] max-h-[44px]',
          className
        )}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange('');
            onClear?.();
          }}
          className="absolute right-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg transition-colors cursor-pointer"
          aria-label="Clear search"
        >
          <X className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        </button>
      )}
    </div>
  );
};
