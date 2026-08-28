import React, { useState, useEffect } from 'react';
import { DataTable } from '../../components/table/DataTable';
import { ColumnDef } from '../../types/table';
import { formatCurrency, formatDateTime, formatDate } from '../../utils/formatters';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { TextInput } from '../../components/common/TextInput';
import { SelectInput } from '../../components/common/SelectInput';
import { Alert } from '../../components/common/Alert';
import { useToast } from '../../providers/ToastProvider';
import { useAuth } from '../../providers/AuthProvider';
import {
  PiggyBank,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  Plus,
  RefreshCw,
  Search,
  Download,
  Eye,
  Calendar,
  AlertTriangle,
  Clock,
  Coins,
  ShieldCheck,
  Building2,
  FileSpreadsheet,
  Settings,
  Sparkles,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import {
  SavingAccount,
  SavingProduct,
  FinancialTransaction,
  MonthlySavingsSchedule,
  SavingsProductType,
  PaymentChannel,
} from '../../types/financial';
import { financialApiService } from '../../services/financialApiService';
import { memberApiService, ClientMember } from '../../services/memberApiService';

export const SavingsManagementView: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'accounts' | 'teller' | 'compulsory' | 'products'>('accounts');

  // Accounts state
  const [accounts, setAccounts] = useState<SavingAccount[]>([]);
  const [products, setProducts] = useState<SavingProduct[]>([]);
  const [members, setMembers] = useState<ClientMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [productFilter, setProductFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Account Details Modal
  const [selectedAccountDetails, setSelectedAccountDetails] = useState<{
    account: SavingAccount;
    balances: any;
    member: any;
    recentTransactions: FinancialTransaction[];
  } | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Open Account Modal
  const [openModalOpen, setOpenModalOpen] = useState(false);
  const [openMemberId, setOpenMemberId] = useState('');
  const [openProductCode, setOpenProductCode] = useState<SavingsProductType>('REGULAR');
  const [openInitialDeposit, setOpenInitialDeposit] = useState('2500');
  const [openPaymentChannel, setOpenPaymentChannel] = useState<PaymentChannel>('CASH_OFFICE');
  const [openBankRef, setOpenBankRef] = useState('');
  const [openGuardianName, setOpenGuardianName] = useState('');
  const [openGuardianRel, setOpenGuardianRel] = useState('');
  const [openTermMonths, setOpenTermMonths] = useState('12');
  const [isOpening, setIsOpening] = useState(false);

  // Quick Action Modal (Deposit / Withdraw / Transfer)
  const [actionModalType, setActionModalType] = useState<'DEPOSIT' | 'WITHDRAW' | 'TRANSFER' | null>(null);
  const [targetAccount, setTargetAccount] = useState<SavingAccount | null>(null);
  const [txAmount, setTxAmount] = useState('');
  const [txChannel, setTxChannel] = useState<PaymentChannel>('CASH_OFFICE');
  const [txBankRef, setTxBankRef] = useState('');
  const [txNarration, setTxNarration] = useState('');
  const [txReason, setTxReason] = useState('');
  const [destAccountId, setDestAccountId] = useState('');
  const [isExecutingTx, setIsExecutingTx] = useState(false);

  // Compulsory schedule state
  const [schedules, setSchedules] = useState<MonthlySavingsSchedule[]>([]);
  const [schedMonth, setSchedMonth] = useState('2026-08');

  // Batch Interest runner
  const [isBatchRunning, setIsBatchRunning] = useState(false);

  // Fetch all initial data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [accRes, prodRes, memRes, schedRes] = await Promise.all([
        financialApiService.getAccounts({
          productCode: productFilter === 'ALL' ? undefined : productFilter,
          status: statusFilter === 'ALL' ? undefined : statusFilter,
        }),
        financialApiService.getProducts(),
        memberApiService.getMembers(),
        financialApiService.getMonthlySchedules({ yearMonth: schedMonth }),
      ]);
      setAccounts(accRes);
      setProducts(prodRes);
      setMembers(memRes.members || []);
      setSchedules(schedRes);
    } catch (err: any) {
      toastError('Failed to load financial data', err?.message || 'Could not connect to SACCO core database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [productFilter, statusFilter, schedMonth]);

  // Handle Account Selection for details view
  const handleInspectAccount = async (account: SavingAccount) => {
    setIsLoadingDetails(true);
    try {
      const details = await financialApiService.getAccountById(account.id);
      setSelectedAccountDetails(details);
    } catch (err: any) {
      toastError('Error', 'Could not load account details.');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Handle Open Account Submission
  const handleOpenAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openMemberId) {
      toastError('Validation', 'Please select a member.');
      return;
    }

    setIsOpening(true);
    try {
      const newAcc = await financialApiService.openAccount({
        memberId: openMemberId,
        productCode: openProductCode,
        initialDeposit: Number(openInitialDeposit) || 0,
        paymentChannel: openPaymentChannel,
        bankReferenceNo: openBankRef.trim() || undefined,
        guardianName: openProductCode === 'CHILDREN' ? openGuardianName.trim() : undefined,
        guardianRelationship: openProductCode === 'CHILDREN' ? openGuardianRel.trim() : undefined,
        termMonths: openProductCode === 'TIME_DEPOSIT' ? Number(openTermMonths) : undefined,
      });

      success('Savings Account Opened', `Account ${newAcc.accountNo} created for ${newAcc.memberName}.`);
      setOpenModalOpen(false);
      fetchData();
    } catch (err: any) {
      toastError('Failed to Open Account', err?.error?.message || err?.message || 'Could not open account.');
    } finally {
      setIsOpening(false);
    }
  };

  // Handle Deposit / Withdraw / Transfer submission
  const handleExecuteTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(txAmount);
    if (!amount || amount <= 0) {
      toastError('Invalid Amount', 'Transaction amount must be greater than zero.');
      return;
    }

    if (!targetAccount && actionModalType !== 'TRANSFER') {
      toastError('No Account Selected', 'Please select an account.');
      return;
    }

    setIsExecutingTx(true);
    try {
      if (actionModalType === 'DEPOSIT') {
        const res = await financialApiService.deposit({
          accountId: targetAccount!.id,
          amount,
          paymentChannel: txChannel,
          bankReferenceNo: txBankRef.trim() || undefined,
          narration: txNarration.trim() || `Deposit to ${targetAccount!.productName}`,
          idempotencyKey: `dep_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        });
        success('Deposit Posted', `Receipt ${res.transactionNo}: Credited ${formatCurrency(amount)} to ${targetAccount!.accountNo}`);
      } else if (actionModalType === 'WITHDRAW') {
        const res = await financialApiService.withdraw({
          accountId: targetAccount!.id,
          amount,
          paymentChannel: txChannel,
          bankReferenceNo: txBankRef.trim() || undefined,
          narration: txNarration.trim() || `Withdrawal from ${targetAccount!.productName}`,
          reason: txReason.trim() || 'Member cash withdrawal',
          idempotencyKey: `wth_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        });

        if (res.requiresApproval) {
          success(
            'Approval Required',
            `Withdrawal of ${formatCurrency(amount)} exceeds threshold (ETB 50,000). Routed to Maker-Checker Queue!`
          );
        } else {
          success(
            'Withdrawal Posted',
            `Receipt ${res.transaction.transactionNo}: Debited ${formatCurrency(amount)} from ${targetAccount!.accountNo}`
          );
        }
      } else if (actionModalType === 'TRANSFER') {
        if (!destAccountId || destAccountId === targetAccount!.id) {
          toastError('Invalid Destination', 'Please select a different destination account.');
          setIsExecutingTx(false);
          return;
        }

        await financialApiService.transfer({
          sourceAccountId: targetAccount!.id,
          destinationAccountId: destAccountId,
          amount,
          narration: txNarration.trim() || `Transfer from ${targetAccount!.accountNo}`,
          idempotencyKey: `trf_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        });

        success('Transfer Completed', `Transferred ${formatCurrency(amount)} from ${targetAccount!.accountNo} to destination account.`);
      }

      setActionModalType(null);
      setTargetAccount(null);
      setTxAmount('');
      setTxBankRef('');
      setTxNarration('');
      setTxReason('');
      setDestAccountId('');
      fetchData();
    } catch (err: any) {
      toastError('Transaction Failed', err?.error?.message || err?.message || 'Transaction could not be completed.');
    } finally {
      setIsExecutingTx(false);
    }
  };

  // Run Batch Interest Posting
  const handleRunBatchInterest = async () => {
    if (!window.confirm('Are you sure you want to run the automated batch interest calculation for all active accounts?')) {
      return;
    }
    setIsBatchRunning(true);
    try {
      const run = await financialApiService.runBatchInterest({});
      success(
        'Batch Interest Posted',
        `Processed ${run.totalAccountsProcessed} accounts. Total interest credited: ${formatCurrency(run.totalInterestPosted)}`
      );
      fetchData();
    } catch (err: any) {
      toastError('Batch Interest Failed', err?.error?.message || err?.message || 'Could not post batch interest.');
    } finally {
      setIsBatchRunning(false);
    }
  };

  // Metrics Calculations
  const totalSavingsPortfolio = accounts.reduce((s, a) => s + (a.balance || 0), 0);
  const totalClearedBalance = accounts.reduce((s, a) => s + (a.clearedBalance ?? a.balance ?? 0), 0);
  const totalHeldBalance = accounts.reduce((s, a) => s + (a.heldBalance ?? 0), 0);
  const activeAccountsCount = accounts.filter((a) => a.status === 'ACTIVE').length;

  // Columns definition
  const columns: ColumnDef<SavingAccount>[] = [
    {
      id: 'accountNo',
      header: 'Account No & Member',
      cell: ({ row }) => (
        <div>
          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            {row.accountNo}
          </span>
          <div className="font-bold text-slate-900 mt-1">{row.memberName}</div>
          <span className="font-mono text-[11px] text-slate-400">{row.membershipNo}</span>
        </div>
      ),
    },
    {
      id: 'product',
      header: 'Product Type',
      cell: ({ row }) => {
        const colors: Record<SavingsProductType, string> = {
          REGULAR: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          VOLUNTARY: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          CHILDREN: 'bg-amber-50 text-amber-700 border-amber-200',
          TIME_DEPOSIT: 'bg-purple-50 text-purple-700 border-purple-200',
        };
        return (
          <div>
            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${colors[row.productCode]}`}>
              {row.productName}
            </span>
            {row.guardianName && (
              <div className="text-[11px] text-slate-500 mt-0.5">Guardian: {row.guardianName}</div>
            )}
            {row.expectedMaturityDate && (
              <div className="text-[10px] text-purple-600 font-mono mt-0.5">
                Matures: {formatDate(row.expectedMaturityDate)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'balance',
      header: 'Total Book Balance',
      align: 'right',
      cell: ({ row }) => (
        <span className="font-black text-slate-900 text-sm">
          {formatCurrency(row.balance)}
        </span>
      ),
    },
    {
      id: 'available',
      header: 'Available for Withdrawal',
      align: 'right',
      cell: ({ row }) => {
        const avail = row.availableBalance ?? row.balance;
        const held = row.heldBalance ?? 0;
        return (
          <div>
            <span className="font-bold text-emerald-600 text-sm">{formatCurrency(avail)}</span>
            {held > 0 && (
              <div className="text-[10px] text-amber-600 font-medium flex items-center justify-end gap-1">
                <Clock className="w-3 h-3 inline" /> Held: {formatCurrency(held)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'interest',
      header: 'Accrued Interest',
      align: 'right',
      cell: ({ row }) => (
        <span className="font-mono text-slate-600 text-xs">
          {formatCurrency(row.accruedInterest || 0)}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      align: 'center',
      cell: ({ row }) => (
        <Badge variant={row.status === 'ACTIVE' ? 'success' : 'neutral'} size="sm">
          {row.status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Quick Action',
      align: 'right',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 justify-end">
          <Button
            variant="outline"
            size="sm"
            className="px-2 text-xs"
            onClick={() => handleInspectAccount(row)}
            title="View Details & Ledger"
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="px-2 text-xs text-emerald-700 hover:bg-emerald-50"
            onClick={() => {
              setTargetAccount(row);
              setActionModalType('DEPOSIT');
            }}
            title="Deposit"
          >
            <ArrowDownRight className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="px-2 text-xs text-rose-700 hover:bg-rose-50"
            onClick={() => {
              setTargetAccount(row);
              setActionModalType('WITHDRAW');
            }}
            title="Withdraw"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 text-left">
      {/* Header with KPI cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <PiggyBank className="w-6 h-6 text-[#16A34A]" />
            <h1 className="text-[24px] sm:text-[32px] font-bold tracking-tight text-slate-900 dark:text-white">Savings & Deposit Management Engine</h1>
          </div>
          <p className="text-[15px] text-slate-500 dark:text-slate-400 max-w-3xl">
            Atomic transaction processing, holding period compliance, multi-product interest accrual, and double-entry integration.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            className="h-[38px] text-[13px] px-3.5"
            onClick={fetchData}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="h-[38px] text-[13px] px-3.5 font-semibold"
            onClick={() => setOpenModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Open New Savings Account
          </Button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Savings Portfolio</span>
          <div className="text-[24px] font-bold text-slate-900 dark:text-white tabular-nums">{formatCurrency(totalSavingsPortfolio)}</div>
          <span className="text-[12px] text-slate-500 dark:text-slate-400 block pt-0.5">{activeAccountsCount} Active Accounts</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cleared & Liquid Funds</span>
          <div className="text-[24px] font-bold text-emerald-600 tabular-nums">{formatCurrency(totalClearedBalance)}</div>
          <span className="text-[12px] text-emerald-700 dark:text-emerald-400 font-semibold block pt-0.5">Immediately Available</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Under Holding Period</span>
          <div className="text-[24px] font-bold text-amber-600 tabular-nums">{formatCurrency(totalHeldBalance)}</div>
          <span className="text-[12px] text-amber-700 dark:text-amber-400 font-semibold block pt-0.5">Voluntary 60-Day Lock Rule</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Batch Interest Posting</span>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">End of month accrual & capitalization</p>
          </div>
          <div className="pt-1.5">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-[12.5px] text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 h-[32px] font-semibold"
              onClick={handleRunBatchInterest}
              isLoading={isBatchRunning}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
            >
              Run Batch Interest
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-4 bg-white dark:bg-slate-900 px-4 rounded-xl shadow-2xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`py-2.5 text-[13px] font-semibold border-b-2 flex items-center gap-1.5 transition-colors h-[40px] ${
            activeTab === 'accounts'
              ? 'border-[#16A34A] text-[#16A34A] dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <PiggyBank className="w-4 h-4" />
          Member Savings Accounts ({accounts.length})
        </button>
        <button
          onClick={() => setActiveTab('teller')}
          className={`py-2.5 text-[13px] font-semibold border-b-2 flex items-center gap-1.5 transition-colors h-[40px] ${
            activeTab === 'teller'
              ? 'border-[#16A34A] text-[#16A34A] dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Coins className="w-4 h-4" />
          Teller Counter & Postings
        </button>
        <button
          onClick={() => setActiveTab('compulsory')}
          className={`py-2.5 text-[13px] font-semibold border-b-2 flex items-center gap-1.5 transition-colors h-[40px] ${
            activeTab === 'compulsory'
              ? 'border-[#16A34A] text-[#16A34A] dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Compulsory Monthly Compliance
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`py-4 text-[18px] font-semibold border-b-2 flex items-center gap-2 transition-colors min-h-[52px] ${
            activeTab === 'products'
              ? 'border-blue-600 text-blue-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Settings className="w-5 h-5" />
          Product Rules & Rates
        </button>
      </div>

      {/* TAB 1: ACCOUNTS LIST */}
      {activeTab === 'accounts' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              <SelectInput
                label=""
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Products (Regular, Voluntary, etc.)' },
                  { value: 'REGULAR', label: 'Compulsory Regular Savings' },
                  { value: 'VOLUNTARY', label: 'Voluntary Savings' },
                  { value: 'CHILDREN', label: "Children's Trust Savings" },
                  { value: 'TIME_DEPOSIT', label: 'Fixed Term Deposit' },
                ]}
              />
              <SelectInput
                label=""
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Account Statuses' },
                  { value: 'ACTIVE', label: 'Active Only' },
                  { value: 'DORMANT', label: 'Dormant' },
                  { value: 'CLOSED', label: 'Closed' },
                ]}
              />
            </div>
            <div className="text-[16px] text-slate-500 dark:text-slate-400 font-mono">
              Showing {accounts.length} registered accounts
            </div>
          </div>

          <DataTable
            data={accounts}
            columns={columns}
            keyExtractor={(a) => a.id}
            searchPlaceholder="Search by account no, member name, membership ID..."
            searchableKey={(a) => `${a.accountNo} ${a.memberName} ${a.membershipNo} ${a.productName}`}
          />
        </div>
      )}

      {/* TAB 2: TELLER COUNTER */}
      {activeTab === 'teller' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <Coins className="w-6 h-6 text-blue-600 dark:text-sky-400" />
              <h2 className="font-bold text-slate-900 dark:text-white text-[22px]">Direct Transaction Counter</h2>
            </div>
            <p className="text-[15px] text-slate-500 dark:text-slate-400">
              Select a member account to immediately deposit, withdraw, or transfer funds with full double-entry validation.
            </p>

            <div className="space-y-4 text-[16px]">
              <div>
                <label className="font-semibold text-slate-900 dark:text-white text-[18px] block mb-2">Select Savings Account</label>
                <select
                  value={targetAccount?.id || ''}
                  onChange={(e) => {
                    const acc = accounts.find((a) => a.id === e.target.value);
                    setTargetAccount(acc || null);
                  }}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 bg-slate-50 dark:bg-slate-800 text-[16px] min-h-[52px]"
                >
                  <option value="">-- Choose Account --</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.accountNo} - {a.memberName} ({a.productName}) [Bal: {formatCurrency(a.balance)}]
                    </option>
                  ))}
                </select>
              </div>

              {targetAccount && (
                <div className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-[16px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Member:</span>
                    <span className="font-bold text-slate-900 dark:text-white text-[17px]">{targetAccount.memberName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Book Balance:</span>
                    <span className="font-bold text-slate-900 dark:text-white text-[18px] font-mono">{formatCurrency(targetAccount.balance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Available:</span>
                    <span className="font-bold text-emerald-600 text-[18px] font-mono">
                      {formatCurrency(targetAccount.availableBalance ?? targetAccount.balance)}
                    </span>
                  </div>
                  {(targetAccount.heldBalance ?? 0) > 0 && (
                    <div className="flex justify-between text-amber-600 text-[16px]">
                      <span>Held (Holding Rule):</span>
                      <span className="font-bold font-mono">{formatCurrency(targetAccount.heldBalance || 0)}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 pt-3">
                <Button
                  variant="success"
                  size="md"
                  className="w-full text-[16px] font-semibold min-h-[52px]"
                  disabled={!targetAccount}
                  onClick={() => setActionModalType('DEPOSIT')}
                >
                  Deposit
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  className="w-full text-[16px] font-semibold min-h-[52px]"
                  disabled={!targetAccount}
                  onClick={() => setActionModalType('WITHDRAW')}
                >
                  Withdraw
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  className="w-full text-[16px] font-semibold min-h-[52px]"
                  disabled={!targetAccount}
                  onClick={() => setActionModalType('TRANSFER')}
                >
                  Transfer
                </Button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h2 className="font-bold text-slate-900 dark:text-white text-[22px]">Financial Integrity & Rules Engine</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[15px]">
              <div className="p-6 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-200 text-[18px]">
                  <Lock className="w-5 h-5 text-blue-600 dark:text-sky-400" />
                  Dual-Control Maker-Checker
                </div>
                <p className="text-blue-800 dark:text-blue-300 leading-relaxed">
                  Any single withdrawal exceeding <strong>ETB 50,000.00</strong> will be placed in PENDING_APPROVAL status and routed to the Manager queue.
                </p>
              </div>

              <div className="p-6 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200 text-[18px]">
                  <Clock className="w-5 h-5 text-amber-600" />
                  Voluntary Savings Holding Rule
                </div>
                <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                  Deposits to Voluntary Savings require a <strong>60-day holding period</strong> before withdrawal eligibility, enforcing long-term cooperative liquidity.
                </p>
              </div>

              <div className="p-6 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200 text-[18px]">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Atomic Double-Entry Balancing
                </div>
                <p className="text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  Every deposit/withdrawal automatically creates balancing journal entries across Cash/Bank Asset Accounts (1010/1020) and Member Savings Liability Accounts (2010-2040).
                </p>
              </div>

              <div className="p-6 bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-purple-900 dark:text-purple-200 text-[18px]">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Interest Accrual Standard
                </div>
                <p className="text-purple-800 dark:text-purple-300 leading-relaxed">
                  Regular Compulsory (12.5% p.a.) is calculated on minimum monthly balance; Voluntary (13.5% p.a.) uses average daily balance.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COMPULSORY MONTHLY COMPLIANCE */}
      {activeTab === 'compulsory' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white text-[22px]">Compulsory Regular Savings Compliance</h2>
              <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1">
                Monthly mandatory deposit tracking (ETB 2,500.00/month) required for active cooperative membership & loan eligibility.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[16px] font-semibold text-slate-700 dark:text-slate-300">Period:</span>
              <TextInput
                type="month"
                value={schedMonth}
                onChange={(e) => setSchedMonth(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-sm">
            <div className="p-4.5 bg-slate-50 dark:bg-slate-800 grid grid-cols-12 text-[16px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              <div className="col-span-3">Member / ID</div>
              <div className="col-span-3">Account No</div>
              <div className="col-span-2 text-right">Expected</div>
              <div className="col-span-2 text-right">Deposited</div>
              <div className="col-span-2 text-center">Status</div>
            </div>
            {schedules.map((s) => (
              <div key={s.id} className="p-4.5 grid grid-cols-12 items-center text-[16px] min-h-[60px] hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                <div className="col-span-3 font-semibold text-slate-900 dark:text-white text-[17px]">
                  {s.memberName}
                  <span className="text-[14px] text-slate-400 font-mono block mt-0.5">{s.membershipNo}</span>
                </div>
                <div className="col-span-3 font-mono text-slate-700 dark:text-slate-300">{s.accountNo}</div>
                <div className="col-span-2 text-right font-semibold text-slate-700 dark:text-slate-300 font-mono">
                  {formatCurrency(s.expectedAmount)}
                </div>
                <div className="col-span-2 text-right font-bold text-emerald-600 font-mono text-[17px]">
                  {formatCurrency(s.actualDeposited)}
                </div>
                <div className="col-span-2 text-center">
                  <Badge variant={s.status === 'MET' ? 'success' : 'error'} size="md">
                    {s.status === 'MET' ? 'COMPLIANT' : 'SHORTFALL'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PRODUCT PARAMETERS */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {products.map((p) => (
            <div key={p.id} className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-[22px]">{p.name}</h3>
                  <span className="font-mono text-[14px] text-blue-600 dark:text-sky-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-800 inline-block mt-1">
                    {p.code}
                  </span>
                </div>
                <Badge variant={p.status === 'ACTIVE' ? 'success' : 'neutral'} size="md">{p.status}</Badge>
              </div>

              <p className="text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed">{p.description}</p>

              <div className="grid grid-cols-2 gap-4 text-[16px] pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[14px]">Annual Interest Rate</span>
                  <span className="font-bold text-emerald-600 text-[20px] tabular-nums">{p.annualInterestRate}% p.a.</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[14px]">Min Opening Balance</span>
                  <span className="font-bold text-slate-900 dark:text-white text-[18px] tabular-nums">{formatCurrency(p.minOpeningBalance)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[14px]">Withdrawal Holding Days</span>
                  <span className="font-bold text-slate-900 dark:text-white text-[18px]">{p.withdrawalHoldingDays} Days</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[14px]">Interest Posting Frequency</span>
                  <span className="font-bold text-slate-900 dark:text-white text-[18px]">{p.interestPostingFrequency}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: OPEN NEW SAVINGS ACCOUNT */}
      {openModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setOpenModalOpen(false)}
          title="Open New Savings Account"
          size="lg"
        >
          <form onSubmit={handleOpenAccount} className="space-y-6 text-[16px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="font-semibold text-slate-900 dark:text-white text-[18px] block mb-2">Select Member *</label>
                <select
                  value={openMemberId}
                  onChange={(e) => setOpenMemberId(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 bg-slate-50 dark:bg-slate-800 text-[16px] min-h-[52px]"
                  required
                >
                  <option value="">-- Choose Active Member --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.membershipNo} - {m.fullName} ({m.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-900 dark:text-white text-[18px] block mb-2">Savings Product *</label>
                <select
                  value={openProductCode}
                  onChange={(e) => setOpenProductCode(e.target.value as SavingsProductType)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 bg-slate-50 dark:bg-slate-800 text-[16px] min-h-[52px]"
                  required
                >
                  <option value="REGULAR">Regular Compulsory Savings (12.5% p.a.)</option>
                  <option value="VOLUNTARY">Voluntary Savings (13.5% p.a.)</option>
                  <option value="CHILDREN">Children's Trust Savings (14.0% p.a.)</option>
                  <option value="TIME_DEPOSIT">Fixed Term Deposit (15.0% p.a.)</option>
                </select>
              </div>

              <div>
                <TextInput
                  label="Initial Opening Deposit (ETB) *"
                  type="number"
                  value={openInitialDeposit}
                  onChange={(e) => setOpenInitialDeposit(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-900 dark:text-white text-[18px] block mb-2">Payment Channel *</label>
                <select
                  value={openPaymentChannel}
                  onChange={(e) => setOpenPaymentChannel(e.target.value as PaymentChannel)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 bg-slate-50 dark:bg-slate-800 text-[16px] min-h-[52px]"
                >
                  <option value="CASH_OFFICE">Cash Office Counter</option>
                  <option value="CBE_BANK">Commercial Bank of Ethiopia (CBE)</option>
                  <option value="TSEHAY_BANK">Tsehay Bank</option>
                  <option value="TELEBIRR">Telebirr SuperApp</option>
                  <option value="AWASH_BANK">Awash Bank</option>
                </select>
              </div>

              {openPaymentChannel !== 'CASH_OFFICE' && (
                <div className="sm:col-span-2">
                  <TextInput
                    label="Bank Reference / FT No *"
                    value={openBankRef}
                    onChange={(e) => setOpenBankRef(e.target.value)}
                    placeholder="e.g. CBE-FT20260814-9981"
                    required
                  />
                </div>
              )}

              {/* Children's product guardian fields */}
              {openProductCode === 'CHILDREN' && (
                <>
                  <div>
                    <TextInput
                      label="Guardian Full Name *"
                      value={openGuardianName}
                      onChange={(e) => setOpenGuardianName(e.target.value)}
                      placeholder="Parent / Legal Guardian"
                      required
                    />
                  </div>
                  <div>
                    <TextInput
                      label="Guardian Relationship *"
                      value={openGuardianRel}
                      onChange={(e) => setOpenGuardianRel(e.target.value)}
                      placeholder="e.g. Mother, Father, Legal Guardian"
                      required
                    />
                  </div>
                </>
              )}

              {/* Time deposit term */}
              {openProductCode === 'TIME_DEPOSIT' && (
                <div>
                  <label className="font-semibold text-slate-900 dark:text-white text-[18px] block mb-2">Deposit Term (Months) *</label>
                  <select
                    value={openTermMonths}
                    onChange={(e) => setOpenTermMonths(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 bg-slate-50 dark:bg-slate-800 text-[16px] min-h-[52px]"
                  >
                    <option value="6">6 Months (8.0% p.a.)</option>
                    <option value="12">12 Months (9.0% p.a.)</option>
                    <option value="24">24 Months (10.0% p.a.)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
              <Button variant="secondary" size="md" className="min-h-[52px] text-[16px] px-6" onClick={() => setOpenModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" className="min-h-[52px] text-[18px] px-6 font-semibold" type="submit" isLoading={isOpening}>
                Confirm Account Opening
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: DIRECT TELLER ACTION (DEPOSIT / WITHDRAW / TRANSFER) */}
      {actionModalType && (
        <Modal
          isOpen={true}
          onClose={() => setActionModalType(null)}
          title={`${actionModalType} - Account ${targetAccount?.accountNo}`}
          size="md"
        >
          <form onSubmit={handleExecuteTransaction} className="space-y-6 text-[16px]">
            {targetAccount && (
              <div className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="font-bold text-slate-900 dark:text-white text-[20px]">{targetAccount.memberName}</div>
                <div className="text-slate-500 dark:text-slate-400 text-[16px]">{targetAccount.productName} ({targetAccount.accountNo})</div>
                <div className="mt-2 flex justify-between font-mono font-bold text-[18px]">
                  <span>Available Balance:</span>
                  <span className="text-emerald-600">
                    {formatCurrency(targetAccount.availableBalance ?? targetAccount.balance)}
                  </span>
                </div>
              </div>
            )}

            <div>
              <TextInput
                label="Transaction Amount (ETB) *"
                type="number"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            {actionModalType === 'TRANSFER' ? (
              <div>
                <label className="font-semibold text-slate-900 dark:text-white text-[18px] block mb-2">Destination Account *</label>
                <select
                  value={destAccountId}
                  onChange={(e) => setDestAccountId(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 bg-slate-50 dark:bg-slate-800 text-[16px] min-h-[52px]"
                  required
                >
                  <option value="">-- Choose Target Account --</option>
                  {accounts
                    .filter((a) => a.id !== targetAccount?.id)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.accountNo} - {a.memberName} ({a.productName})
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="font-semibold text-slate-900 dark:text-white text-[18px] block mb-2">Payment Channel *</label>
                <select
                  value={txChannel}
                  onChange={(e) => setTxChannel(e.target.value as PaymentChannel)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 bg-slate-50 dark:bg-slate-800 text-[16px] min-h-[52px]"
                >
                  <option value="CASH_OFFICE">Cash Office Counter</option>
                  <option value="CBE_BANK">Commercial Bank of Ethiopia (CBE)</option>
                  <option value="TSEHAY_BANK">Tsehay Bank</option>
                  <option value="TELEBIRR">Telebirr SuperApp</option>
                  <option value="AWASH_BANK">Awash Bank</option>
                </select>
              </div>
            )}

            {actionModalType !== 'TRANSFER' && txChannel !== 'CASH_OFFICE' && (
              <TextInput
                label="Bank FT Reference No *"
                value={txBankRef}
                onChange={(e) => setTxBankRef(e.target.value)}
                placeholder="e.g. CBE-FT88910"
                required
              />
            )}

            {actionModalType === 'WITHDRAW' && (
              <TextInput
                label="Withdrawal Reason *"
                value={txReason}
                onChange={(e) => setTxReason(e.target.value)}
                placeholder="e.g. Member emergency expense / medical"
                required
              />
            )}

            <TextInput
              label="Narration / Note"
              value={txNarration}
              onChange={(e) => setTxNarration(e.target.value)}
              placeholder="e.g. Teller cash posting"
            />

            {/* Threshold warning */}
            {actionModalType === 'WITHDRAW' && Number(txAmount) > 50000 && (
              <Alert variant="warning">
                <strong>Dual-Control Triggered:</strong> Amounts exceeding ETB 50,000 require Manager Maker-Checker sign-off. This request will be routed to the Authorization Queue upon submission.
              </Alert>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
              <Button variant="secondary" size="md" className="min-h-[52px] text-[16px] px-6" onClick={() => setActionModalType(null)}>
                Cancel
              </Button>
              <Button
                variant={actionModalType === 'WITHDRAW' ? 'danger' : 'primary'}
                size="md"
                className="min-h-[52px] text-[18px] px-6 font-semibold"
                type="submit"
                isLoading={isExecutingTx}
              >
                Post {actionModalType}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: ACCOUNT DETAIL & STATEMENT */}
      {selectedAccountDetails && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedAccountDetails(null)}
          title={`Savings Account Statement: ${selectedAccountDetails.account.accountNo}`}
          size="lg"
          footer={
            <Button variant="secondary" size="md" className="min-h-[52px] text-[16px] px-6" onClick={() => setSelectedAccountDetails(null)}>
              Close Statement
            </Button>
          }
        >
          <div className="space-y-6 text-[16px]">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-slate-400 font-bold text-[13px] uppercase tracking-wider">Account Holder</span>
                <p className="font-bold text-slate-900 dark:text-white text-[18px] mt-1">{selectedAccountDetails.account.memberName}</p>
                <p className="text-slate-500 dark:text-slate-400 font-mono text-[14px]">{selectedAccountDetails.account.membershipNo}</p>
              </div>
              <div>
                <span className="text-slate-400 font-bold text-[13px] uppercase tracking-wider">Book Balance</span>
                <p className="font-bold text-slate-900 dark:text-white text-[20px] tabular-nums mt-1">
                  {formatCurrency(selectedAccountDetails.account.balance)}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-bold text-[13px] uppercase tracking-wider">Available Balance</span>
                <p className="font-bold text-emerald-600 text-[20px] tabular-nums mt-1">
                  {formatCurrency(selectedAccountDetails.balances.availableBalance)}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-bold text-[13px] uppercase tracking-wider">Held Balance</span>
                <p className="font-bold text-amber-600 text-[20px] tabular-nums mt-1">
                  {formatCurrency(selectedAccountDetails.balances.heldBalance || 0)}
                </p>
              </div>
            </div>

            {/* Holding Batches */}
            {selectedAccountDetails.balances.holdingBatches?.length > 0 && (
              <div className="p-6 bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl space-y-3">
                <span className="font-bold text-amber-900 dark:text-amber-200 text-[17px] flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  Deposit Holding Batches (Voluntary Savings 60-day Rule):
                </span>
                <div className="space-y-2">
                  {selectedAccountDetails.balances.holdingBatches.map((b: any, idx: number) => (
                    <div key={idx} className="flex justify-between py-2 border-b border-amber-200/50 dark:border-amber-800/50 text-[15px]">
                      <span>
                        Deposit Date: {formatDate(b.depositDate)} • Clears: <strong>{formatDate(b.clearedDate)}</strong>
                      </span>
                      <span className="font-mono font-bold text-amber-900 dark:text-amber-200">{formatCurrency(b.remainingAmount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transaction Ledger */}
            <div className="space-y-3">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-[18px]">Recent Transactions:</span>
              <div className="max-h-72 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                {selectedAccountDetails.recentTransactions.map((tx) => (
                  <div key={tx.id} className="p-4 flex justify-between items-center text-[15px] hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <div>
                      <div className="font-mono font-bold text-blue-700 dark:text-sky-400 text-[16px]">{tx.transactionNo}</div>
                      <div className="text-slate-700 dark:text-slate-300 font-medium">{tx.narration}</div>
                      <div className="text-[13px] text-slate-400">{formatDateTime(tx.timestamp)} • {tx.paymentChannel}</div>
                    </div>
                    <div className="text-right">
                      {tx.type === 'DEPOSIT' || tx.type === 'INTEREST_POSTING' ? (
                        <span className="font-bold text-emerald-600 text-[17px] font-mono">+{formatCurrency(tx.amount)}</span>
                      ) : (
                        <span className="font-bold text-rose-600 text-[17px] font-mono">-{formatCurrency(tx.amount)}</span>
                      )}
                      <div className="text-[13px] text-slate-500 font-mono">Bal: {formatCurrency(tx.balanceAfter)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
