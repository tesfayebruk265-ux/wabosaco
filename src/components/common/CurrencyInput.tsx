import React from 'react';
import { TextInput, TextInputProps } from './TextInput';
import { formatCurrency } from '../../utils/formatters';

export interface CurrencyInputProps extends Omit<TextInputProps, 'onChange' | 'value' | 'type'> {
  value: number | string;
  onChange: (value: number) => void;
  currency?: string;
  allowNegative?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  currency = 'ETB',
  allowNegative = false,
  helperText,
  ...props
}) => {
  const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value || 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9.]/g, '');
    const num = parseFloat(rawVal) || 0;
    onChange(num);
  };

  return (
    <TextInput
      {...props}
      type="number"
      step="0.01"
      min={allowNegative ? undefined : 0}
      value={value === 0 ? '' : value}
      onChange={handleChange}
      leftElement={<span className="text-[16px] font-bold text-slate-600 dark:text-slate-300">{currency}</span>}
      helperText={
        numericValue > 0
          ? `${helperText ? helperText + ' • ' : ''}Preview: ${formatCurrency(numericValue)}`
          : helperText
      }
    />
  );
};
