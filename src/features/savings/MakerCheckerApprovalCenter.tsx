import React, { useState, useEffect } from 'react';
import { DataTable } from '../../components/table/DataTable';
import { ColumnDef } from '../../types/table';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { TextInput } from '../../components/common/TextInput';
import { SelectInput } from '../../components/common/SelectInput';
import { Alert } from '../../components/common/Alert';
import { useToast } from '../../providers/ToastProvider';
import { useAuth } from '../../providers/AuthProvider';
import {
  CheckCircle2,
  XCircle,
  ShieldAlert,
  RefreshCw,
  Clock,
  Eye,
  AlertTriangle,
  Lock,
  FileCheck,
} from 'lucide-react';
import { FinancialApproval } from '../../types/financial';
import { financialApiService } from '../../services/financialApiService';

export const MakerCheckerApprovalCenter: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [approvals, setApprovals] = useState<FinancialApproval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');

  // Decision Modal
  const [selectedApproval, setSelectedApproval] = useState<FinancialApproval | null>(null);
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [comments, setComments] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchApprovals = async () => {
    setIsLoading(true);
    try {
      const data = await financialApiService.getApprovals({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      });
      setApprovals(data);
    } catch (err: any) {
      toastError('Failed to fetch approvals', err?.message || 'Could not load maker-checker queue.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [statusFilter]);

  const handleExecuteDecision = async () => {
    if (!selectedApproval) return;
    setIsProcessing(true);
    try {
      await financialApiService.approveApproval(selectedApproval.id, {
        decision,
        comments: comments.trim() || undefined,
      });

      success(
        `Request ${decision === 'APPROVED' ? 'Authorized' : 'Rejected'}`,
        `Transaction ${selectedApproval.transactionNo} for ${selectedApproval.memberName} has been ${decision.toLowerCase()}.`
      );

      setSelectedApproval(null);
      setComments('');
      fetchApprovals();
    } catch (err: any) {
      toastError('Decision Failed', err?.error?.message || err?.message || 'Could not complete authorization.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Separation of duties: Check if current user is maker
  const isMaker = selectedApproval && user && selectedApproval.requestedById === user.id;

  const columns: ColumnDef<FinancialApproval>[] = [
    {
      id: 'txNo',
      header: 'Txn / Approval Ref',
      cell: ({ row }) => (
        <div>
          <span className="font-mono font-bold text-blue-700 dark:text-sky-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-800 text-[15px]">
            {row.transactionNo}
          </span>
          <span className="text-[13px] text-slate-400 block font-mono mt-1">{row.id}</span>
        </div>
      ),
    },
    {
      id: 'type',
      header: 'Operation Type',
      cell: ({ row }) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white text-[17px]">{row.type.replace(/_/g, ' ')}</span>
          <span className="text-[14px] text-slate-500 dark:text-slate-400 block mt-0.5">{row.accountNo}</span>
        </div>
      ),
    },
    {
      id: 'member',
      header: 'Member Beneficiary',
      cell: ({ row }) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white text-[17px]">{row.memberName}</span>
          <span className="font-mono text-[14px] text-slate-400 block mt-0.5">{row.membershipNo}</span>
        </div>
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      align: 'right',
      cell: ({ row }) => (
        <span className="font-bold text-rose-600 text-[18px] tabular-nums font-mono">{formatCurrency(row.amount)}</span>
      ),
    },
    {
      id: 'maker',
      header: 'Maker Staff',
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-[16px]">{row.requestedByName}</span>
          <span className="text-[13px] text-slate-400 block mt-0.5">{formatDateTime(row.createdAt)}</span>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      align: 'center',
      cell: ({ row }) => {
        const variant =
          row.status === 'APPROVED' ? 'success' : row.status === 'REJECTED' ? 'error' : 'warning';
        return (
          <Badge variant={variant} size="md">
            {row.status}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Dual Control Sign-Off',
      align: 'right',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="outline"
            size="md"
            className="min-h-[44px] text-[15px] px-4 font-semibold"
            onClick={() => {
              setSelectedApproval(row);
              setDecision('APPROVED');
            }}
          >
            Review & Sign
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-amber-600" />
            <h1 className="text-[32px] sm:text-[40px] font-bold tracking-tight text-slate-900 dark:text-white">Maker-Checker Authorization Center</h1>
          </div>
          <p className="text-[16px] text-slate-500 dark:text-slate-400 max-w-3xl">
            Strict four-eyes principle (dual-control) for high-value withdrawals (&gt; ETB 50,000) and critical ledger adjustments.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SelectInput
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'PENDING', label: 'Pending Review' },
              { value: 'APPROVED', label: 'Authorized' },
              { value: 'REJECTED', label: 'Rejected' },
              { value: 'ALL', label: 'All Requests' },
            ]}
          />
          <Button
            variant="outline"
            size="md"
            className="min-h-[52px] text-[16px] px-6"
            onClick={fetchApprovals}
            leftIcon={<RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      <DataTable
        data={approvals}
        columns={columns}
        keyExtractor={(a) => a.id}
        searchPlaceholder="Search by transaction no, member name, account..."
        searchableKey={(a) => `${a.transactionNo} ${a.memberName} ${a.membershipNo} ${a.accountNo}`}
      />

      {/* Review Modal */}
      {selectedApproval && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedApproval(null)}
          title={`Dual-Control Authorization: ${selectedApproval.transactionNo}`}
          size="md"
          footer={
            <div className="flex justify-between items-center w-full">
              <span className="text-[15px] text-slate-500 dark:text-slate-400">
                Maker: <strong className="text-slate-900 dark:text-white">{selectedApproval.requestedByName}</strong>
              </span>
              <div className="flex gap-3">
                <Button variant="secondary" size="md" className="min-h-[52px] text-[16px] px-6" onClick={() => setSelectedApproval(null)}>
                  Cancel
                </Button>
                {selectedApproval.status === 'PENDING' && (
                  <Button
                    variant={decision === 'APPROVED' ? 'success' : 'danger'}
                    size="md"
                    className="min-h-[52px] text-[18px] px-6 font-semibold"
                    onClick={handleExecuteDecision}
                    isLoading={isProcessing}
                    disabled={Boolean(isMaker)}
                    title={isMaker ? 'Separation of duties: You cannot approve your own request' : ''}
                  >
                    Confirm {decision === 'APPROVED' ? 'Authorization' : 'Rejection'}
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-6 text-[16px]">
            {isMaker && (
              <Alert variant="warning">
                <strong>Separation of Duties Enforced:</strong> You created this withdrawal request. Another Manager or Administrator must review and authorize it.
              </Alert>
            )}

            <div className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Operation:</span>
                <span className="font-bold text-slate-900 dark:text-white text-[17px]">{selectedApproval.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Beneficiary Member:</span>
                <span className="font-bold text-slate-900 dark:text-white text-[17px]">{selectedApproval.memberName} ({selectedApproval.membershipNo})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Source Account:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{selectedApproval.accountNo}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-[18px]">Withdrawal Amount:</span>
                <span className="font-bold text-rose-600 text-[24px] tabular-nums font-mono">{formatCurrency(selectedApproval.amount)}</span>
              </div>
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 block mb-1 text-[15px]">Maker Justification / Reason:</span>
                <p className="font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-[16px] leading-relaxed">
                  {selectedApproval.reason}
                </p>
              </div>
            </div>

            {selectedApproval.status === 'PENDING' && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="font-semibold text-slate-900 dark:text-white text-[18px] block mb-2">Reviewer Decision *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDecision('APPROVED')}
                      className={`p-3.5 rounded-xl border text-center font-bold text-[17px] transition-all min-h-[52px] ${
                        decision === 'APPROVED'
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      Authorize & Execute
                    </button>
                    <button
                      type="button"
                      onClick={() => setDecision('REJECTED')}
                      className={`p-3.5 rounded-xl border text-center font-bold text-[17px] transition-all min-h-[52px] ${
                        decision === 'REJECTED'
                          ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      Reject Request
                    </button>
                  </div>
                </div>

                <div>
                  <TextInput
                    label="Reviewer Comments / Audit Note"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="e.g. Identity verified via national ID and signed signature card."
                  />
                </div>
              </div>
            )}

            {selectedApproval.status !== 'PENDING' && (
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 text-[15px]">
                <p>
                  Status: <strong className="text-slate-900 dark:text-white">{selectedApproval.status}</strong> by {selectedApproval.reviewedByName} on{' '}
                  {formatDateTime(selectedApproval.reviewedAt || '')}
                </p>
                {selectedApproval.comments && (
                  <p className="italic text-[14px] mt-1 text-slate-500 dark:text-slate-400">"{selectedApproval.comments}"</p>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
