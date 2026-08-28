import React, { useState, useEffect } from 'react';
import { DataTable } from '../../components/table/DataTable';
import { ColumnDef } from '../../types/table';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { TextInput } from '../../components/common/TextInput';
import { SelectInput } from '../../components/common/SelectInput';
import { useToast } from '../../providers/ToastProvider';
import { useAuth } from '../../providers/AuthProvider';
import {
  Receipt,
  Download,
  RefreshCw,
  Eye,
  RotateCcw,
  Scale,
  FileSpreadsheet,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { FinancialTransaction, JournalEntry } from '../../types/financial';
import { financialApiService } from '../../services/financialApiService';

export const TransactionsLedgerView: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Transaction Receipt & Journal Inspection Modal
  const [selectedTx, setSelectedTx] = useState<{
    transaction: FinancialTransaction;
    journal?: JournalEntry;
    account?: any;
  } | null>(null);
  const [isLoadingTxDetails, setIsLoadingTxDetails] = useState(false);

  // Reversal Modal
  const [reversalTx, setReversalTx] = useState<FinancialTransaction | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [isReversing, setIsReversing] = useState(false);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const data = await financialApiService.getTransactions({
        type: typeFilter === 'ALL' ? undefined : typeFilter,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      });
      setTransactions(data);
    } catch (err: any) {
      toastError('Failed to load ledger', err?.message || 'Could not fetch transaction records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter, statusFilter]);

  const handleInspectTransaction = async (tx: FinancialTransaction) => {
    setIsLoadingTxDetails(true);
    try {
      const details = await financialApiService.getTransactionById(tx.id);
      setSelectedTx(details);
    } catch (err: any) {
      toastError('Failed to fetch transaction details', err?.message);
    } finally {
      setIsLoadingTxDetails(false);
    }
  };

  const handleExecuteReversal = async () => {
    if (!reversalTx || !reversalReason.trim()) return;
    setIsReversing(true);
    try {
      const res = await financialApiService.reverseTransaction(reversalTx.id, reversalReason.trim());
      success(
        'Transaction Reversed',
        `Compensating transaction ${res.transactionNo} generated. Balance and GL journal restored.`
      );
      setReversalTx(null);
      setReversalReason('');
      fetchTransactions();
    } catch (err: any) {
      toastError('Reversal Failed', err?.error?.message || err?.message || 'Could not reverse transaction.');
    } finally {
      setIsReversing(false);
    }
  };

  const isManagerOrAdmin = user?.role === 'MANAGER' || user?.role === 'ADMIN';

  const columns: ColumnDef<FinancialTransaction>[] = [
    {
      id: 'txNo',
      header: 'Txn Reference',
      cell: ({ row }) => (
        <div>
          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            {row.transactionNo}
          </span>
          {row.isReversed && (
            <span className="text-[10px] text-rose-600 font-bold block mt-0.5">REVERSED</span>
          )}
        </div>
      ),
    },
    {
      id: 'member',
      header: 'Member / Account',
      cell: ({ row }) => (
        <div>
          <div className="font-bold text-slate-900">{row.memberName}</div>
          <span className="text-[11px] text-slate-500 font-mono">
            {row.accountNo} ({row.productCode})
          </span>
        </div>
      ),
    },
    {
      id: 'type',
      header: 'Type & Channel',
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-slate-800">{row.type.replace(/_/g, ' ')}</span>
          <span className="text-[10px] text-slate-400 block">{row.paymentChannel}</span>
        </div>
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      align: 'right',
      cell: ({ row }) => {
        const isCredit = row.type === 'DEPOSIT' || row.type === 'INTEREST_POSTING' || row.type === 'INTEREST_CREDIT';
        return (
          <div>
            <span className={`font-black text-sm ${isCredit ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isCredit ? '+' : '-'}{formatCurrency(row.amount)}
            </span>
            <span className="text-[10px] text-slate-400 block">Bal: {formatCurrency(row.balanceAfter)}</span>
          </div>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      align: 'center',
      cell: ({ row }) => {
        const variant =
          row.status === 'POSTED' ? 'success' : row.status === 'REVERSED' ? 'error' : 'warning';
        return (
          <Badge variant={variant} size="sm">
            {row.status}
          </Badge>
        );
      },
    },
    {
      id: 'date',
      header: 'Timestamp',
      align: 'right',
      cell: ({ row }) => (
        <span className="text-slate-500 text-xs font-mono">{formatDateTime(row.timestamp)}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Receipt & Reversal',
      align: 'right',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 justify-end">
          <Button
            variant="outline"
            size="sm"
            className="px-2 text-xs"
            onClick={() => handleInspectTransaction(row)}
            title="Inspect Voucher & Journal"
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>
          {isManagerOrAdmin && row.status === 'POSTED' && !row.isReversed && (
            <Button
              variant="outline"
              size="sm"
              className="px-2 text-xs text-rose-600 hover:bg-rose-50"
              onClick={() => setReversalTx(row)}
              title="Reverse Transaction"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900">Financial Transaction Ledger</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable single-source-of-truth audit ledger tracking all deposits, withdrawals, transfers, and interest postings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SelectInput
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Transaction Types' },
              { value: 'DEPOSIT', label: 'Deposits' },
              { value: 'WITHDRAWAL', label: 'Withdrawals' },
              { value: 'TRANSFER', label: 'Transfers' },
              { value: 'INTEREST_POSTING', label: 'Interest Postings' },
              { value: 'REVERSAL', label: 'Reversals' },
            ]}
          />
          <SelectInput
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'POSTED', label: 'Posted (Active)' },
              { value: 'REVERSED', label: 'Reversed' },
              { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
            ]}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTransactions}
            leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      <DataTable
        data={transactions}
        columns={columns}
        keyExtractor={(t) => t.id}
        searchPlaceholder="Search by txn no, member, account, bank FT ref..."
        searchableKey={(t) => `${t.transactionNo} ${t.memberName} ${t.membershipNo} ${t.accountNo} ${t.bankReferenceNo || ''}`}
      />

      {/* MODAL: TRANSACTION VOUCHER & GL JOURNAL */}
      {selectedTx && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTx(null)}
          title={`Transaction Receipt & Journal: ${selectedTx.transaction.transactionNo}`}
          size="lg"
          footer={
            <div className="flex justify-between items-center w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Print Voucher
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setSelectedTx(null)}>
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Voucher Banner */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-400 font-bold text-[10px] uppercase">Transaction Ref</span>
                <p className="font-mono font-bold text-blue-700 text-sm mt-0.5">
                  {selectedTx.transaction.transactionNo}
                </p>
                <p className="text-slate-500">{formatDateTime(selectedTx.transaction.timestamp)}</p>
              </div>
              <div>
                <span className="text-slate-400 font-bold text-[10px] uppercase">Member / Holder</span>
                <p className="font-bold text-slate-900 mt-0.5">{selectedTx.transaction.memberName}</p>
                <p className="text-slate-500 font-mono">{selectedTx.transaction.membershipNo}</p>
              </div>
              <div>
                <span className="text-slate-400 font-bold text-[10px] uppercase">Amount</span>
                <p className="font-black text-slate-900 text-base mt-0.5">
                  {formatCurrency(selectedTx.transaction.amount)}
                </p>
                <p className="text-slate-500">{selectedTx.transaction.paymentChannel}</p>
              </div>
              <div>
                <span className="text-slate-400 font-bold text-[10px] uppercase">Balance After</span>
                <p className="font-black text-emerald-600 text-base mt-0.5">
                  {formatCurrency(selectedTx.transaction.balanceAfter)}
                </p>
                <p className="text-[10px] text-slate-500">Before: {formatCurrency(selectedTx.transaction.balanceBefore)}</p>
              </div>
            </div>

            {/* Narration */}
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-slate-500 font-semibold block mb-0.5">Narration:</span>
              <p className="text-slate-800 font-medium">{selectedTx.transaction.narration}</p>
              {selectedTx.transaction.bankReferenceNo && (
                <p className="text-slate-500 font-mono mt-1">
                  Bank Reference No: <strong>{selectedTx.transaction.bankReferenceNo}</strong>
                </p>
              )}
            </div>

            {/* General Ledger Journal Lines */}
            {selectedTx.journal && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                  <Scale className="w-4 h-4 text-blue-600" />
                  Double-Entry General Ledger Postings ({selectedTx.journal.journalNo}):
                </div>
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <div className="p-2.5 bg-slate-50 grid grid-cols-12 text-[11px] font-bold text-slate-600 border-b border-slate-200">
                    <div className="col-span-3">GL Account Code</div>
                    <div className="col-span-5">Account Name / Narration</div>
                    <div className="col-span-2 text-right">Debit (DR)</div>
                    <div className="col-span-2 text-right">Credit (CR)</div>
                  </div>
                  {selectedTx.journal.lines.map((line, idx) => (
                    <div key={idx} className="p-2.5 grid grid-cols-12 items-center text-xs border-b border-slate-100 last:border-0">
                      <div className="col-span-3 font-mono font-bold text-blue-700">{line.accountCode}</div>
                      <div className="col-span-5 text-slate-800">{line.accountName}</div>
                      <div className="col-span-2 text-right font-mono font-bold text-slate-900">
                        {line.debit > 0 ? formatCurrency(line.debit) : '—'}
                      </div>
                      <div className="col-span-2 text-right font-mono font-bold text-slate-900">
                        {line.credit > 0 ? formatCurrency(line.credit) : '—'}
                      </div>
                    </div>
                  ))}
                  <div className="p-2.5 bg-slate-50 grid grid-cols-12 items-center text-xs font-bold border-t border-slate-200">
                    <div className="col-span-8 text-right text-slate-700">Balanced Ledger Total:</div>
                    <div className="col-span-2 text-right text-emerald-600 font-mono">
                      {formatCurrency(selectedTx.journal.totalDebit)}
                    </div>
                    <div className="col-span-2 text-right text-emerald-600 font-mono">
                      {formatCurrency(selectedTx.journal.totalCredit)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* MODAL: TRANSACTION REVERSAL */}
      {reversalTx && (
        <Modal
          isOpen={true}
          onClose={() => setReversalTx(null)}
          title={`Reverse Transaction: ${reversalTx.transactionNo}`}
          size="md"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setReversalTx(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleExecuteReversal}
                isLoading={isReversing}
                disabled={!reversalReason.trim()}
              >
                Confirm Transaction Reversal
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 space-y-1">
              <p className="font-bold">Financial Reversal Notice:</p>
              <p>
                Reversing this <strong>{reversalTx.type}</strong> of{' '}
                <strong>{formatCurrency(reversalTx.amount)}</strong> will create a formal compensating transaction, revert the member's account balance, and generate voiding general ledger entries.
              </p>
            </div>

            <div>
              <TextInput
                label="Formal Justification / Reason for Reversal *"
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder="e.g. Duplicate bank deposit slip posting on CBE teller channel"
                required
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
