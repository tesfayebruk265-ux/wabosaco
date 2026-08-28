import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'There are no active records available under the selected view or filter criteria.',
  icon,
  actionText,
  onAction,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-4 sm:p-5 min-h-[180px] max-h-[220px] text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40', className)}>
      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-2">
        {icon || <Inbox className="w-4.5 h-4.5" />}
      </div>
      <h4 className="text-[13px] font-bold text-slate-800 dark:text-slate-200 leading-tight">{title}</h4>
      <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-sm leading-normal">{description}</p>
      {actionText && onAction && (
        <Button variant="outline" size="sm" onClick={onAction} className="mt-2.5 h-[32px] min-h-[32px] text-[12px] px-3">
          {actionText}
        </Button>
      )}
    </div>
  );
};
