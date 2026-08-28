import React from 'react';
import { TextInput, TextInputProps } from './TextInput';
import { Calendar } from 'lucide-react';

export interface DateInputProps extends Omit<TextInputProps, 'type'> {}

export const DateInput: React.FC<DateInputProps> = (props) => {
  return (
    <TextInput
      {...props}
      type="date"
      rightElement={<Calendar className="w-5 h-5 text-slate-400 pointer-events-none" />}
    />
  );
};
