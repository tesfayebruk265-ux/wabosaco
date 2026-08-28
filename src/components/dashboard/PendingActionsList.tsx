import React from 'react';
import { ApprovalRequest } from '../../types/financial';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { CheckCircle2, Clock } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { cn } from '../../utils/cn';

export interface PendingActionsListProps {
  requests: ApprovalRequest[];
  onApprove?: (req: ApprovalRequest) => void;
  onReject?: (req: ApprovalRequest) => void;
  onViewAll?: () => void;
  title?: string;
  className?: string;
}

export const PendingActionsList: React.FC<PendingActionsListProps> = ({
  requests,
  onApprove,
  onReject,
  onViewAll,
  title = 'Pending Dual-Control Sign-Offs',
  className,
}) => {
  return (
    <div className={cn('flex flex-col bg-white dark:bg-[#1E293B] rounded-[18px] border border-[#E5E7EB] dark:border-slate-700 p-8 shadow-[0_1px_3px_0_rgba(0,0,0,0.03),0_1px_2px_-1px_rgba(0,0,0,0.03)] transition-all duration-200 hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.05)]', className)}>
      <div className="flex items-center justify-between pb-5 border-b border-[#E5E7EB] dark:border-slate-700/80 mb-4">
        <div className="flex items-center gap-2.5">
          <Clock className="w-5 h-5 text-[#F59E0B]" />
          <h4 className="text-[18px] font-semibold text-[#111827] dark:text-white tracking-tight">{title}</h4>
          <span className="text-[12px] font-bold px-2.5 py-0.5 bg-[#FFFBEB] dark:bg-amber-950 text-[#B45309] dark:text-amber-200 rounded-full border border-[#FDE68A]">
            {requests.length}
          </span>
        </div>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-[14px] text-[#2E7D32] dark:text-emerald-400 hover:text-[#1B5E20] font-semibold cursor-pointer transition-colors"
          >
            Review All
          </button>
        )}
      </div>

      {requests.length === 0 ? (
        <div className="py-10 text-center text-[14px] text-[#6B7280] dark:text-slate-400">
          <CheckCircle2 className="w-8 h-8 text-[#2E7D32] mx-auto mb-2 opacity-80" />
          All maker-checker items cleared. No approvals pending.
        </div>
      ) : (
        <div className="divide-y divide-[#E5E7EB] dark:divide-slate-700/80">
          {requests.slice(0, 4).map((req) => (
            <div key={req.id} className="py-3.5 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[15px] font-semibold text-[#111827] dark:text-white">{req.memberName}</span>
                  <Badge variant={req.riskLevel === 'HIGH' ? 'error' : req.riskLevel === 'MEDIUM' ? 'warning' : 'neutral'} size="sm">
                    {req.riskLevel} Risk
                  </Badge>
                </div>
                <p className="text-[14px] text-[#6B7280] dark:text-slate-300 mt-0.5">
                  {req.description} — <strong className="font-semibold text-[#111827] dark:text-white tabular-nums">{formatCurrency(req.amount)}</strong>
                </p>
                <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Initiated by {req.makerStaffName} • {formatDateTime(req.submissionDate)}
                </span>
              </div>

              {(onApprove || onReject) && (
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {onReject && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onReject(req)}
                      className="text-[#DC2626] dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 px-3.5 py-1.5 text-[13px] min-h-[38px]"
                    >
                      Reject
                    </Button>
                  )}
                  {onApprove && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => onApprove(req)}
                      className="px-4 py-1.5 text-[13px] min-h-[38px]"
                    >
                      Authorize
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
