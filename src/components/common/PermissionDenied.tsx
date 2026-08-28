import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

export interface PermissionDeniedProps {
  requiredPermission?: string;
  onGoBack?: () => void;
  className?: string;
}

export const PermissionDenied: React.FC<PermissionDeniedProps> = ({
  requiredPermission,
  onGoBack,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-12 text-center rounded-xl border border-amber-200 bg-amber-50/40', className)}>
      <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 mb-4 shadow-xs">
        <ShieldAlert className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
      <p className="text-xs text-slate-600 mt-1.5 max-w-md leading-relaxed">
        Your active security profile does not hold the mandatory authorization tokens required to inspect or execute actions within this financial module.
      </p>
      {requiredPermission && (
        <div className="mt-3 px-3 py-1 bg-white border border-amber-200 rounded-md text-[11px] font-mono text-amber-800">
          Required Token: <span className="font-bold">{requiredPermission}</span>
        </div>
      )}
      {onGoBack && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onGoBack}
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          className="mt-6"
        >
          Return to Previous Station
        </Button>
      )}
    </div>
  );
};
