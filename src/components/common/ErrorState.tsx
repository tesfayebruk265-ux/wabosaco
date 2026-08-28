import React from 'react';
import { AlertOctagon, RotateCw } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  statusCode?: number | string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Service Unavailable',
  message = 'We encountered an unexpected error processing this transaction or fetching the record. Please try again.',
  statusCode,
  onRetry,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center rounded-xl border border-rose-200 bg-rose-50/50', className)}>
      <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-3">
        <AlertOctagon className="w-6 h-6" />
      </div>
      {statusCode && (
        <span className="text-[11px] font-bold text-rose-700 tracking-wider uppercase mb-1">
          HTTP {statusCode}
        </span>
      )}
      <h4 className="text-sm font-semibold text-rose-900">{title}</h4>
      <p className="text-xs text-rose-700/80 mt-1 max-w-sm leading-relaxed">{message}</p>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          leftIcon={<RotateCw className="w-3.5 h-3.5" />}
          className="mt-4 border-rose-300 hover:bg-rose-100 text-rose-900"
        >
          Try Again
        </Button>
      )}
    </div>
  );
};
