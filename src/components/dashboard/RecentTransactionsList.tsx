import React from 'react';
import { TransactionRecord } from '../../types/financial';
import { DebitCreditDisplay } from '../financial/DebitCreditDisplay';
import { formatDateTime } from '../../utils/formatters';
import { ArrowRight, Receipt } from 'lucide-react';
import { Button } from '../common/Button';
import { cn } from '../../utils/cn';

export interface RecentTransactionsListProps {
  transactions: TransactionRecord[];
  onViewAll?: () => void;
  onSelectTransaction?: (txn: TransactionRecord) => void;
  title?: string;
  className?: string;
}

export const RecentTransactionsList: React.FC<RecentTransactionsListProps> = ({
  transactions,
  onViewAll,
  onSelectTransaction,
  title = 'Recent Ledger Postings',
  className,
}) => {
  return (
    <div className={cn('flex flex-col bg-white dark:bg-[#1E293B] rounded-lg border border-slate-200 dark:border-slate-800 p-4 sm:p-4.5 shadow-xs transition-all duration-150', className)}>
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-2">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-emerald-600" />
          <h4 className="text-[13px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">{title}</h4>
        </div>
        {onViewAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewAll}
            rightIcon={<ArrowRight className="w-3 h-3" />}
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 px-2 py-1 text-[12px] min-h-[28px] max-h-[30px]"
          >
            View All
          </Button>
        )}
      </div>

      {transactions.length === 0 ? (
        <div className="py-6 text-center text-[12.5px] text-slate-400">No recent transactions to display</div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {transactions.slice(0, 5).map((txn) => {
            const isCredit = txn.creditAmount !== null && txn.creditAmount > 0;
            const amount = isCredit ? txn.creditAmount || 0 : txn.debitAmount || 0;

            return (
              <div
                key={txn.id}
                onClick={() => onSelectTransaction?.(txn)}
                className="py-2 px-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-md transition-colors cursor-pointer min-h-[46px]"
              >
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-semibold text-slate-900 dark:text-white truncate">
                      {txn.narration || txn.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] font-mono px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded font-semibold border border-slate-200 dark:border-slate-700">
                      {txn.transactionNo}
                    </span>
                  </div>
                  <span className="text-[11.5px] text-slate-400 mt-0.5">
                    {formatDateTime(txn.timestamp)} • {txn.paymentChannel}
                  </span>
                </div>

                <DebitCreditDisplay
                  type={isCredit ? 'CREDIT' : 'DEBIT'}
                  amount={amount}
                  size="sm"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
