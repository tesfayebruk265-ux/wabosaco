import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Scale,
  FileSpreadsheet,
  Calendar,
  Layers,
  PieChart,
  DollarSign,
  Plus,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Download,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Building,
  Check,
  X,
  FileText,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { TextInput } from '../../components/common/TextInput';
import { SelectInput } from '../../components/common/SelectInput';
import { DataTable, ColumnDef } from '../../components/table/DataTable';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { useToast } from '../../providers/ToastProvider';
import { useAuth } from '../../providers/AuthProvider';

export const AccountingManagementView: React.FC = () => {
  const { success, error: toastError } = useToast();
  const { user } = useAuth();

  // Active module tab
  const [activeTab, setActiveTab] = useState<
    'coa' | 'gl' | 'trial_balance' | 'financial_statements' | 'periods' | 'reconciliation' | 'budgets' | 'ratios'
  >('financial_statements');

  // Loading states
  const [isLoading, setIsLoading] = useState(false);

  // Data states
  const [coaList, setCoaList] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [reconciliations, setReconciliations] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);

  // Financial statements states
  const [incomeStatement, setIncomeStatement] = useState<any>(null);
  const [balanceSheet, setBalanceSheet] = useState<any>(null);
  const [financialRatios, setFinancialRatios] = useState<any>(null);
  const [trialBalance, setTrialBalance] = useState<any>(null);

  // General Ledger state
  const [selectedGLAccount, setSelectedGLAccount] = useState('1010');
  const [glReport, setGLReport] = useState<any>(null);
  const [glStartDate, setGlStartDate] = useState('2026-01-01');
  const [glEndDate, setGlEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Budget Variance state
  const [budgetVariance, setBudgetVariance] = useState<any>(null);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState('2026');

  // Modals
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);
  const [newAccountCode, setNewAccountCode] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState('ASSET');
  const [newAccountParent, setNewAccountParent] = useState('');
  const [newAccountIsHeader, setNewAccountIsHeader] = useState(false);
  const [newAccountDesc, setNewAccountDesc] = useState('');

  const [isClosePeriodModalOpen, setIsClosePeriodModalOpen] = useState(false);
  const [periodToClose, setPeriodToClose] = useState<any>(null);

  const [isNewReconModalOpen, setIsNewReconModalOpen] = useState(false);
  const [reconBankCode, setReconBankCode] = useState('1010');
  const [reconPeriod, setReconPeriod] = useState('2026-08');
  const [reconStatementDate, setReconStatementDate] = useState(new Date().toISOString().split('T')[0]);
  const [reconStatementBal, setReconStatementBal] = useState('');
  const [reconUncredited, setReconUncredited] = useState('0');
  const [reconUnpresented, setReconUnpresented] = useState('0');
  const [reconNotes, setReconNotes] = useState('');

  const [isNewBudgetModalOpen, setIsNewBudgetModalOpen] = useState(false);
  const [budgetTitle, setBudgetTitle] = useState('FY2027 SACCO Annual Operating Plan');
  const [budgetYear, setBudgetYear] = useState('2027');

  // Fetch initial data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [coaRes, prdRes, recRes, bgtRes, isRes, bsRes, tbRes, frRes, bvRes] = await Promise.all([
        fetch('/api/accounting/chart-of-accounts').then((r) => r.json()),
        fetch('/api/accounting/periods').then((r) => r.json()),
        fetch('/api/accounting/reconciliations').then((r) => r.json()),
        fetch('/api/accounting/budgets').then((r) => r.json()),
        fetch('/api/accounting/reports/income-statement').then((r) => r.json()),
        fetch('/api/accounting/reports/balance-sheet').then((r) => r.json()),
        fetch('/api/accounting/trial-balance').then((r) => r.json()),
        fetch('/api/accounting/reports/financial-ratios').then((r) => r.json()),
        fetch(`/api/accounting/reports/budget-variance?fiscalYear=${selectedFiscalYear}`).then((r) => r.json()),
      ]);

      if (coaRes.success) setCoaList(coaRes.data);
      if (prdRes.success) setPeriods(prdRes.data);
      if (recRes.success) setReconciliations(recRes.data);
      if (bgtRes.success) setBudgets(bgtRes.data);
      if (isRes.success) setIncomeStatement(isRes.data);
      if (bsRes.success) setBalanceSheet(bsRes.data);
      if (tbRes.success) setTrialBalance(tbRes.data);
      if (frRes.success) setFinancialRatios(frRes.data);
      if (bvRes.success) setBudgetVariance(bvRes.data);
    } catch (err: any) {
      console.error('Error loading accounting data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch GL report on selection change
  const fetchGLReport = async (code: string, start?: string, end?: string) => {
    try {
      const s = start || glStartDate;
      const e = end || glEndDate;
      const res = await fetch(`/api/accounting/general-ledger/${code}?startDate=${s}&endDate=${e}`);
      const data = await res.json();
      if (data.success) {
        setGLReport(data.data);
      }
    } catch (err) {
      console.error('Error fetching GL report:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedFiscalYear]);

  useEffect(() => {
    if (selectedGLAccount) {
      fetchGLReport(selectedGLAccount, glStartDate, glEndDate);
    }
  }, [selectedGLAccount, glStartDate, glEndDate]);

  // Handlers
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountCode || !newAccountName) {
      toastError('Validation Error', 'Account code and name are required.');
      return;
    }
    try {
      const res = await fetch('/api/accounting/chart-of-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountCode: newAccountCode,
          accountName: newAccountName,
          accountType: newAccountType,
          parentCode: newAccountParent || undefined,
          isHeader: newAccountIsHeader,
          description: newAccountDesc,
        }),
      });
      const data = await res.json();
      if (data.success) {
        success('Account Created', `GL Account ${newAccountCode} - ${newAccountName} successfully registered.`);
        setIsNewAccountModalOpen(false);
        setNewAccountCode('');
        setNewAccountName('');
        fetchData();
      } else {
        toastError('Creation Failed', data.error?.message || 'Could not create account');
      }
    } catch (err: any) {
      toastError('Network Error', err.message);
    }
  };

  const handleClosePeriod = async () => {
    if (!periodToClose) return;
    try {
      const res = await fetch(`/api/accounting/periods/${periodToClose.id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        success('Period Closed', `Period ${periodToClose.name} closed with statutory reserves allocated.`);
        setIsClosePeriodModalOpen(false);
        setPeriodToClose(null);
        fetchData();
      } else {
        toastError('Close Failed', data.error?.message || 'Could not close period');
      }
    } catch (err: any) {
      toastError('Network Error', err.message);
    }
  };

  const handleLockPeriod = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/accounting/periods/${id}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        success('Period Locked', `Period ${name} is locked against further journal postings.`);
        fetchData();
      } else {
        toastError('Lock Failed', data.error?.message || 'Could not lock period');
      }
    } catch (err: any) {
      toastError('Network Error', err.message);
    }
  };

  const handleReopenPeriod = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/accounting/periods/${id}/reopen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Auditor approved adjustment' }),
      });
      const data = await res.json();
      if (data.success) {
        success('Period Reopened', `Period ${name} has been reopened for audit adjustments.`);
        fetchData();
      } else {
        toastError('Reopen Failed', data.error?.message || 'Could not reopen period');
      }
    } catch (err: any) {
      toastError('Network Error', err.message);
    }
  };

  const handleCreateReconciliation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconStatementBal) {
      toastError('Validation Error', 'Statement balance is required');
      return;
    }
    try {
      const res = await fetch('/api/accounting/reconciliations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankAccountId: `${reconBankCode}-ACC`,
          bankAccountCode: reconBankCode,
          period: reconPeriod,
          statementDate: reconStatementDate,
          statementBalance: parseFloat(reconStatementBal),
          uncreditedDeposits: parseFloat(reconUncredited || '0'),
          unpresentedPayments: parseFloat(reconUnpresented || '0'),
          notes: reconNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        success('Reconciliation Completed', 'Bank reconciliation successfully performed and balanced.');
        setIsNewReconModalOpen(false);
        setReconStatementBal('');
        fetchData();
      } else {
        toastError('Reconciliation Failed', data.error?.message || 'Error reconciling bank');
      }
    } catch (err: any) {
      toastError('Network Error', err.message);
    }
  };

  const handleApproveBudget = async (id: string, title: string) => {
    try {
      const res = await fetch(`/api/accounting/budgets/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        success('Budget Approved', `Operating budget "${title}" is now active.`);
        fetchData();
      } else {
        toastError('Approval Failed', data.error?.message || 'Could not approve budget');
      }
    } catch (err: any) {
      toastError('Network Error', err.message);
    }
  };

  // Columns definitions for DataTables
  const coaColumns: ColumnDef<any>[] = [
    {
      id: 'code',
      header: 'GL Code',
      accessorKey: 'accountCode',
      cell: ({ row }) => (
        <span
          className={`font-mono font-bold ${
            row.isHeader ? 'text-slate-900 font-black' : 'text-blue-600 pl-' + ((row.level || 1) * 2)
          }`}
        >
          {row.accountCode}
        </span>
      ),
    },
    {
      id: 'name',
      header: 'Account Name',
      cell: ({ row }) => (
        <div style={{ paddingLeft: `${((row.level || 1) - 1) * 16}px` }}>
          <span className={`text-xs ${row.isHeader ? 'font-black text-slate-900 uppercase' : 'font-semibold text-slate-800'}`}>
            {row.accountName}
          </span>
          {row.description && <span className="text-[11px] text-slate-400 block">{row.description}</span>}
        </div>
      ),
    },
    {
      id: 'type',
      header: 'Type',
      cell: ({ row }) => {
        let variant: 'info' | 'success' | 'warning' | 'error' | 'neutral' = 'neutral';
        if (row.accountType === 'ASSET') variant = 'info';
        if (row.accountType === 'LIABILITY') variant = 'warning';
        if (row.accountType === 'EQUITY') variant = 'neutral';
        if (row.accountType === 'INCOME') variant = 'success';
        if (row.accountType === 'EXPENSE') variant = 'error';
        return (
          <Badge variant={variant} size="sm">
            {row.accountType}
          </Badge>
        );
      },
    },
    {
      id: 'normalBalance',
      header: 'Normal Bal',
      align: 'center',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-slate-600">
          {row.normalBalance}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      align: 'center',
      cell: ({ row }) => (
        <Badge variant={row.isActive ? 'success' : 'neutral'} size="sm">
          {row.isActive ? 'ACTIVE' : 'INACTIVE'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-4 text-left">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[24px] sm:text-[32px] font-bold tracking-tight text-slate-900 dark:text-white">Enterprise SACCO Accounting System</h1>
            <Badge variant="success" size="sm">
              Double-Entry Core
            </Badge>
            <Badge variant="neutral" size="sm">
              Ethiopian GAAP & NBE Compliant
            </Badge>
          </div>
          <p className="text-[15px] text-slate-500 dark:text-slate-400 max-w-3xl">
            Real-time financial statement generation, general ledger audit trails, periodic closing controls, bank reconciliations, and budgeting.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            className="h-[38px] text-[13px] px-3.5"
            onClick={fetchData}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Ledger
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="h-[38px] text-[13px] px-3.5 font-semibold"
            onClick={() => setIsNewAccountModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            New GL Account
          </Button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 bg-white dark:bg-slate-900 px-4 rounded-xl shadow-2xs overflow-x-auto">
        {[
          { id: 'financial_statements', label: 'Financial Statements', icon: FileSpreadsheet },
          { id: 'ratios', label: 'Financial Ratios & Health', icon: TrendingUp },
          { id: 'trial_balance', label: 'Trial Balance', icon: Scale },
          { id: 'gl', label: 'General Ledger', icon: BookOpen },
          { id: 'coa', label: 'Chart of Accounts', icon: Layers },
          { id: 'periods', label: 'Period Closings', icon: Calendar },
          { id: 'reconciliation', label: 'Bank Reconciliation', icon: CheckCircle2 },
          { id: 'budgets', label: 'Budgets & Variance', icon: PieChart },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer h-[40px] ${
                isActive
                  ? 'border-[#16A34A] text-[#16A34A] dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: FINANCIAL STATEMENTS (Balance Sheet & Income Statement) */}
      {/* ========================================================= */}
      {activeTab === 'financial_statements' && (
        <div className="space-y-4">
          {/* Top Key Metrics Banner */}
          {balanceSheet && incomeStatement && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Assets</span>
                <div className="text-[24px] font-bold text-slate-900 dark:text-white tabular-nums">
                  {formatCurrency(balanceSheet.assets.totalAssets)}
                </div>
                <span className="text-[12px] text-emerald-600 dark:text-emerald-400 font-semibold block pt-0.5">
                  Gross Loans: {formatCurrency(balanceSheet.assets.loansAndReceivables.total)}
                </span>
              </div>

              <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Member Deposits</span>
                <div className="text-[24px] font-bold text-slate-900 dark:text-white tabular-nums">
                  {formatCurrency(balanceSheet.liabilities.memberSavingsDeposits.total)}
                </div>
                <span className="text-[12px] text-slate-500 dark:text-slate-400 font-semibold block pt-0.5">
                  Total Liabilities: {formatCurrency(balanceSheet.liabilities.totalLiabilities)}
                </span>
              </div>

              <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Institutional Equity</span>
                <div className="text-[24px] font-bold text-slate-900 dark:text-white tabular-nums">
                  {formatCurrency(balanceSheet.equity.totalEquity)}
                </div>
                <span className="text-[12px] text-blue-600 dark:text-sky-400 font-semibold block pt-0.5">
                  Share Capital: {formatCurrency(balanceSheet.equity.memberShareCapital.total)}
                </span>
              </div>

              <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Net Operating Surplus</span>
                <div className="text-[24px] font-bold text-emerald-600 tabular-nums">
                  {formatCurrency(incomeStatement.netOperatingSurplus)}
                </div>
                <span className="text-[12px] text-slate-500 dark:text-slate-400 font-semibold block pt-0.5">
                  30% Statutory Reserve: {formatCurrency(incomeStatement.statutoryReserve30Pct)}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Statement of Financial Position (Balance Sheet) */}
            {balanceSheet && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-[22px]">Statement of Financial Position</h3>
                    <p className="text-[15px] text-slate-400">Balance Sheet as of {formatDate(balanceSheet.asOfDate)}</p>
                  </div>
                  <Badge variant={balanceSheet.isBalanced ? 'success' : 'error'} size="md">
                    {balanceSheet.isBalanced ? 'BALANCED' : `DIFF: ${formatCurrency(balanceSheet.variance)}`}
                  </Badge>
                </div>

                <div className="p-8 space-y-6 text-[16px] divide-y divide-slate-100 dark:divide-slate-800">
                  {/* ASSETS */}
                  <div>
                    <div className="flex justify-between items-center font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-700 text-[18px]">
                      <span className="uppercase tracking-wider">1. Assets</span>
                      <span className="text-[20px] font-bold tabular-nums">{formatCurrency(balanceSheet.assets.totalAssets)}</span>
                    </div>

                    <div className="mt-4 space-y-4 pl-2">
                      <div>
                        <div className="flex justify-between text-slate-800 dark:text-slate-200 font-semibold text-[17px]">
                          <span>{balanceSheet.assets.cashAndBank.title}</span>
                          <span className="tabular-nums font-mono">{formatCurrency(balanceSheet.assets.cashAndBank.total)}</span>
                        </div>
                        <div className="pl-4 mt-2 space-y-1.5 text-[15px] text-slate-500 dark:text-slate-400">
                          {balanceSheet.assets.cashAndBank.items.map((i: any) => (
                            <div key={i.code} className="flex justify-between">
                              <span>{i.code} - {i.name}</span>
                              <span className="font-mono">{formatCurrency(i.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-800 dark:text-slate-200 font-semibold text-[17px]">
                          <span>{balanceSheet.assets.loansAndReceivables.title}</span>
                          <span className="tabular-nums font-mono">{formatCurrency(balanceSheet.assets.loansAndReceivables.total)}</span>
                        </div>
                        <div className="pl-4 mt-2 space-y-1.5 text-[15px] text-slate-500 dark:text-slate-400">
                          {balanceSheet.assets.loansAndReceivables.items.map((i: any) => (
                            <div key={i.code} className="flex justify-between">
                              <span>{i.code} - {i.name}</span>
                              <span className="font-mono">{formatCurrency(i.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-between text-rose-600 font-semibold text-[17px]">
                        <span>{balanceSheet.assets.allowanceForImpairment.title}</span>
                        <span className="tabular-nums font-mono">{formatCurrency(balanceSheet.assets.allowanceForImpairment.total)}</span>
                      </div>

                      <div className="flex justify-between text-slate-800 dark:text-slate-200 font-semibold text-[17px]">
                        <span>{balanceSheet.assets.otherAssets.title}</span>
                        <span className="tabular-nums font-mono">{formatCurrency(balanceSheet.assets.otherAssets.total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* LIABILITIES */}
                  <div className="pt-6">
                    <div className="flex justify-between items-center font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-700 text-[18px]">
                      <span className="uppercase tracking-wider">2. Liabilities</span>
                      <span className="text-[20px] font-bold tabular-nums">{formatCurrency(balanceSheet.liabilities.totalLiabilities)}</span>
                    </div>

                    <div className="mt-4 space-y-4 pl-2">
                      <div>
                        <div className="flex justify-between text-slate-800 dark:text-slate-200 font-semibold text-[17px]">
                          <span>{balanceSheet.liabilities.memberSavingsDeposits.title}</span>
                          <span className="tabular-nums font-mono">{formatCurrency(balanceSheet.liabilities.memberSavingsDeposits.total)}</span>
                        </div>
                        <div className="pl-4 mt-2 space-y-1.5 text-[15px] text-slate-500 dark:text-slate-400">
                          {balanceSheet.liabilities.memberSavingsDeposits.items.map((i: any) => (
                            <div key={i.code} className="flex justify-between">
                              <span>{i.code} - {i.name}</span>
                              <span className="font-mono">{formatCurrency(i.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-between text-slate-800 dark:text-slate-200 font-semibold text-[17px]">
                        <span>{balanceSheet.liabilities.currentLiabilities.title}</span>
                        <span className="tabular-nums font-mono">{formatCurrency(balanceSheet.liabilities.currentLiabilities.total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* EQUITY */}
                  <div className="pt-6">
                    <div className="flex justify-between items-center font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-700 text-[18px]">
                      <span className="uppercase tracking-wider">3. Institutional Equity & Reserves</span>
                      <span className="text-[20px] font-bold tabular-nums">{formatCurrency(balanceSheet.equity.totalEquity)}</span>
                    </div>

                    <div className="mt-4 space-y-2.5 pl-2">
                      <div className="flex justify-between text-slate-800 dark:text-slate-200 text-[16px]">
                        <span>Paid-Up Share Capital</span>
                        <span className="font-mono font-semibold">{formatCurrency(balanceSheet.equity.memberShareCapital.total)}</span>
                      </div>
                      <div className="flex justify-between text-slate-800 dark:text-slate-200 text-[16px]">
                        <span>Statutory Reserve Fund (30% Legal)</span>
                        <span className="font-mono font-semibold">{formatCurrency(balanceSheet.equity.statutoryReserve.total)}</span>
                      </div>
                      <div className="flex justify-between text-slate-800 dark:text-slate-200 text-[16px]">
                        <span>Prior Retained Earnings</span>
                        <span className="font-mono font-semibold">{formatCurrency(balanceSheet.equity.retainedEarnings.total)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-600 font-semibold text-[17px]">
                        <span>Current Period Operating Surplus</span>
                        <span className="font-mono">{formatCurrency(balanceSheet.equity.currentPeriodSurplus)}</span>
                      </div>
                    </div>
                  </div>

                  {/* SUMMARY TOTAL EQUILIBRIUM */}
                  <div className="pt-6 bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl flex justify-between items-center font-bold text-slate-900 dark:text-white text-[18px]">
                    <span>Total Liabilities and Equity</span>
                    <span className="text-[22px] font-bold tabular-nums text-blue-600 dark:text-sky-400">{formatCurrency(balanceSheet.totalLiabilitiesAndEquity)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Statement of Comprehensive Income (Income Statement) */}
            {incomeStatement && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-[22px]">Statement of Comprehensive Income</h3>
                    <p className="text-[15px] text-slate-400">
                      Period: {formatDate(incomeStatement.startDate)} to {formatDate(incomeStatement.endDate)}
                    </p>
                  </div>
                  <Badge variant="success" size="md">
                    Surplus: {formatCurrency(incomeStatement.netOperatingSurplus)}
                  </Badge>
                </div>

                <div className="p-8 space-y-6 text-[16px] divide-y divide-slate-100 dark:divide-slate-800">
                  {/* REVENUE */}
                  <div>
                    <div className="flex justify-between items-center font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-700 text-[18px]">
                      <span className="uppercase tracking-wider">1. Financial & Operating Revenue</span>
                      <span className="text-[20px] font-bold text-emerald-600 tabular-nums">{formatCurrency(incomeStatement.revenue.total)}</span>
                    </div>

                    <div className="mt-4 space-y-2 pl-2">
                      {incomeStatement.revenue.items.map((i: any) => (
                        <div key={i.code} className="flex justify-between text-slate-800 dark:text-slate-200 text-[16px]">
                          <span>{i.code} - {i.name}</span>
                          <span className="font-semibold font-mono">{formatCurrency(i.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* COST OF FUNDS */}
                  <div className="pt-6">
                    <div className="flex justify-between items-center font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-700 text-[18px]">
                      <span className="uppercase tracking-wider">2. Financial Cost of Funds</span>
                      <span className="text-[20px] font-bold text-rose-600 tabular-nums">({formatCurrency(incomeStatement.costOfFunds.total)})</span>
                    </div>

                    <div className="mt-4 space-y-2 pl-2">
                      {incomeStatement.costOfFunds.items.map((i: any) => (
                        <div key={i.code} className="flex justify-between text-slate-800 dark:text-slate-200 text-[16px]">
                          <span>{i.code} - {i.name}</span>
                          <span className="font-mono">{formatCurrency(i.amount)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 p-4 bg-blue-50/50 dark:bg-blue-950/40 rounded-xl flex justify-between font-bold text-blue-900 dark:text-blue-200 text-[17px]">
                      <span>Gross Financial Margin</span>
                      <span className="font-mono">{formatCurrency(incomeStatement.grossFinancialMargin)}</span>
                    </div>
                  </div>

                  {/* OPERATING EXPENSES */}
                  <div className="pt-6">
                    <div className="flex justify-between items-center font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-700 text-[18px]">
                      <span className="uppercase tracking-wider">3. Administrative & Operating Expenses</span>
                      <span className="text-[20px] font-bold text-rose-600 tabular-nums">({formatCurrency(incomeStatement.operatingExpenses.total)})</span>
                    </div>

                    <div className="mt-4 space-y-2 pl-2">
                      {incomeStatement.operatingExpenses.items.map((i: any) => (
                        <div key={i.code} className="flex justify-between text-slate-800 dark:text-slate-200 text-[16px]">
                          <span>{i.code} - {i.name}</span>
                          <span className="font-mono">{formatCurrency(i.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* LOAN LOSS PROVISIONS */}
                  <div className="pt-6">
                    <div className="flex justify-between items-center font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-700 text-[18px]">
                      <span className="uppercase tracking-wider">4. Impairment Loss Provisions</span>
                      <span className="text-[20px] font-bold text-rose-600 tabular-nums">({formatCurrency(incomeStatement.loanLossProvisions.total)})</span>
                    </div>
                  </div>

                  {/* NET OPERATING SURPLUS & STATUTORY ALLOCATION */}
                  <div className="pt-6 bg-emerald-50/60 dark:bg-emerald-950/40 p-6 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center text-[20px] font-bold text-emerald-900 dark:text-emerald-200">
                      <span>Net Operating Surplus</span>
                      <span className="font-mono">{formatCurrency(incomeStatement.netOperatingSurplus)}</span>
                    </div>

                    <div className="pt-3 border-t border-emerald-200/60 dark:border-emerald-800/60 space-y-2 text-[15px] text-emerald-800 dark:text-emerald-300">
                      <div className="flex justify-between">
                        <span>Statutory Reserve Fund (30% Legal Requirement)</span>
                        <span className="font-bold font-mono text-[16px]">{formatCurrency(incomeStatement.statutoryReserve30Pct)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Retained Surplus for Dividend & Capital (70%)</span>
                        <span className="font-bold font-mono text-[16px]">{formatCurrency(incomeStatement.retainedSurplus70Pct)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: FINANCIAL RATIOS & PRUDENTIAL METRICS */}
      {/* ========================================================= */}
      {activeTab === 'ratios' && financialRatios && (
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <h2 className="text-[22px] font-bold text-slate-900 dark:text-white">Prudential Financial Health & Regulatory Ratios</h2>
            <p className="text-[16px] text-slate-500 dark:text-slate-400">
              Ethiopian Cooperative Agency and National Bank of Ethiopia benchmark ratio compliance analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Liquidity Ratio */}
            <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white text-[18px]">Liquidity Ratio</span>
                <Badge variant={financialRatios.liquidityRatio >= 15 ? 'success' : 'error'} size="md">
                  {financialRatios.liquidityRatio >= 15 ? 'COMPLIANT' : 'LOW'}
                </Badge>
              </div>
              <div className="text-[42px] font-bold text-slate-900 dark:text-white tabular-nums">{financialRatios.liquidityRatio}%</div>
              <p className="text-[15px] text-slate-500 dark:text-slate-400">
                Liquid cash and bank deposits vs total member savings. Regulatory minimum is <strong>15.0%</strong>.
              </p>
            </div>

            {/* Capital Adequacy */}
            <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white text-[18px]">Capital Adequacy Ratio</span>
                <Badge variant={financialRatios.capitalAdequacyRatio >= 12 ? 'success' : 'error'} size="md">
                  {financialRatios.capitalAdequacyRatio >= 12 ? 'STRONG' : 'WARNING'}
                </Badge>
              </div>
              <div className="text-[42px] font-bold text-slate-900 dark:text-white tabular-nums">{financialRatios.capitalAdequacyRatio}%</div>
              <p className="text-[15px] text-slate-500 dark:text-slate-400">
                Total institutional equity capital vs total assets. Cooperative threshold is <strong>12.0%</strong>.
              </p>
            </div>

            {/* Loan to Deposit Ratio */}
            <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white text-[18px]">Loan to Deposit Ratio</span>
                <Badge variant={financialRatios.loanToDepositRatio <= 85 ? 'success' : 'warning'} size="md">
                  {financialRatios.loanToDepositRatio <= 85 ? 'OPTIMAL' : 'HIGH'}
                </Badge>
              </div>
              <div className="text-[42px] font-bold text-slate-900 dark:text-white tabular-nums">{financialRatios.loanToDepositRatio}%</div>
              <p className="text-[15px] text-slate-500 dark:text-slate-400">
                Gross credit portfolio utilization against mobilized savings. Prudent target is <strong>≤ 85.0%</strong>.
              </p>
            </div>

            {/* Return on Assets */}
            <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white text-[18px]">Return on Assets (ROA)</span>
                <Badge variant="info" size="md">
                  ANNUALIZED
                </Badge>
              </div>
              <div className="text-[42px] font-bold text-blue-600 dark:text-sky-400 tabular-nums">{financialRatios.returnOnAssets}%</div>
              <p className="text-[15px] text-slate-500 dark:text-slate-400">
                Net cooperative operating surplus generated per Birr of total balance sheet assets.
              </p>
            </div>

            {/* Return on Equity */}
            <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white text-[18px]">Return on Equity (ROE)</span>
                <Badge variant="info" size="md">
                  ANNUALIZED
                </Badge>
              </div>
              <div className="text-[42px] font-bold text-emerald-600 tabular-nums">{financialRatios.returnOnEquity}%</div>
              <p className="text-[15px] text-slate-500 dark:text-slate-400">
                Net surplus generated on member share capital and accumulated institutional reserves.
              </p>
            </div>

            {/* Operating Efficiency */}
            <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white text-[18px]">Operating Efficiency Ratio</span>
                <Badge variant={financialRatios.operatingEfficiencyRatio <= 50 ? 'success' : 'warning'} size="md">
                  {financialRatios.operatingEfficiencyRatio <= 50 ? 'EFFICIENT' : 'ELEVATED'}
                </Badge>
              </div>
              <div className="text-[42px] font-bold text-slate-900 dark:text-white tabular-nums">{financialRatios.operatingEfficiencyRatio}%</div>
              <p className="text-[15px] text-slate-500 dark:text-slate-400">
                Operating and administrative cost fraction against total SACCO revenues.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: TRIAL BALANCE */}
      {/* ========================================================= */}
      {activeTab === 'trial_balance' && trialBalance && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h2 className="text-[22px] font-bold text-slate-900 dark:text-white">Audited Trial Balance</h2>
              <p className="text-[16px] text-slate-500 dark:text-slate-400 mt-1">
                Aggregated double-entry debit and credit balances as of {formatDate(trialBalance.asOfDate)}.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={trialBalance.isBalanced ? 'success' : 'error'} size="lg">
                {trialBalance.isBalanced ? '✓ DEBITS EQUAL CREDITS' : `DISCREPANCY: ${formatCurrency(trialBalance.discrepancy)}`}
              </Badge>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[16px]">
                    <th className="p-4.5">GL Code</th>
                    <th className="p-4.5">Account Title</th>
                    <th className="p-4.5">Type</th>
                    <th className="p-4.5 text-right">Period Debit Movement</th>
                    <th className="p-4.5 text-right">Period Credit Movement</th>
                    <th className="p-4.5 text-right">Closing Debit (DR)</th>
                    <th className="p-4.5 text-right">Closing Credit (CR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[16px]">
                  {trialBalance.items.map((item: any) => (
                    <tr
                      key={item.accountCode}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 min-h-[60px] ${item.isHeader ? 'bg-slate-50/50 dark:bg-slate-800/30 font-bold' : ''}`}
                    >
                      <td className="p-4.5 text-blue-600 dark:text-sky-400 font-bold">{item.accountCode}</td>
                      <td className={`p-4.5 font-sans ${item.isHeader ? 'font-black text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                        {item.accountName}
                      </td>
                      <td className="p-4.5 font-sans">
                        <span className="text-[14px] text-slate-500 dark:text-slate-400">{item.accountType}</span>
                      </td>
                      <td className="p-4.5 text-right text-slate-600 dark:text-slate-300">
                        {item.movementDebit ? formatCurrency(item.movementDebit) : '—'}
                      </td>
                      <td className="p-4.5 text-right text-slate-600 dark:text-slate-300">
                        {item.movementCredit ? formatCurrency(item.movementCredit) : '—'}
                      </td>
                      <td className="p-4.5 text-right font-bold text-slate-900 dark:text-white">
                        {item.closingDebit ? formatCurrency(item.closingDebit) : '—'}
                      </td>
                      <td className="p-4.5 text-right font-bold text-slate-900 dark:text-white">
                        {item.closingCredit ? formatCurrency(item.closingCredit) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-900 text-white font-bold font-mono text-[16px]">
                  <tr>
                    <td colSpan={5} className="p-5 text-right uppercase tracking-wider text-[15px]">
                      Grand Total Trial Balance Equilibrium
                    </td>
                    <td className="p-5 text-right text-[18px] font-bold text-emerald-400">
                      {formatCurrency(trialBalance.totalDebit)}
                    </td>
                    <td className="p-5 text-right text-[18px] font-bold text-emerald-400">
                      {formatCurrency(trialBalance.totalCredit)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: GENERAL LEDGER */}
      {/* ========================================================= */}
      {activeTab === 'gl' && (
        <div className="space-y-8">
          {/* Controls filter card */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h2 className="text-[22px] font-bold text-slate-900 dark:text-white">General Ledger Account Detail</h2>
              <p className="text-[16px] text-slate-500 dark:text-slate-400 mt-1">
                Detailed journal movement ledger with opening balance and real-time running balance.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
              <SelectInput
                label="Select GL Account"
                value={selectedGLAccount}
                onChange={(e) => setSelectedGLAccount(e.target.value)}
                options={coaList
                  .filter((c) => !c.isHeader)
                  .map((c) => ({
                    value: c.accountCode,
                    label: `${c.accountCode} - ${c.accountName} (${c.accountType})`,
                  }))}
              />
              <TextInput
                label="Start Date"
                type="date"
                value={glStartDate}
                onChange={(e) => setGlStartDate(e.target.value)}
              />
              <TextInput
                label="End Date"
                type="date"
                value={glEndDate}
                onChange={(e) => setGlEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* GL Summary & Movements */}
          {glReport && (
            <div className="space-y-6">
              {/* Account summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <span className="text-[14px] font-bold text-slate-400 uppercase tracking-wider">Opening Balance</span>
                  <div className="text-[28px] font-bold text-slate-900 dark:text-white tabular-nums">{formatCurrency(glReport.openingBalance)}</div>
                </div>
                <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <span className="text-[14px] font-bold text-slate-400 uppercase tracking-wider">Total Debits</span>
                  <div className="text-[28px] font-bold text-blue-600 dark:text-sky-400 tabular-nums">{formatCurrency(glReport.totalDebit)}</div>
                </div>
                <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <span className="text-[14px] font-bold text-slate-400 uppercase tracking-wider">Total Credits</span>
                  <div className="text-[28px] font-bold text-purple-600 tabular-nums">{formatCurrency(glReport.totalCredit)}</div>
                </div>
                <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <span className="text-[14px] font-bold text-slate-400 uppercase tracking-wider">Closing Balance</span>
                  <div className="text-[28px] font-bold text-emerald-600 tabular-nums">{formatCurrency(glReport.closingBalance)}</div>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[16px]">
                        <th className="p-4.5">Date</th>
                        <th className="p-4.5">Journal Ref</th>
                        <th className="p-4.5">Type</th>
                        <th className="p-4.5">Description / Narration</th>
                        <th className="p-4.5 text-right">Debit (DR)</th>
                        <th className="p-4.5 text-right">Credit (CR)</th>
                        <th className="p-4.5 text-right">Running Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[16px]">
                      {glReport.movements.length > 0 ? (
                        glReport.movements.map((m: any) => (
                          <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 min-h-[60px]">
                            <td className="p-4.5 font-sans text-slate-600 dark:text-slate-300">{formatDate(m.entryDate)}</td>
                            <td className="p-4.5 font-bold text-blue-600 dark:text-sky-400">{m.journalNo}</td>
                            <td className="p-4.5 font-sans">
                              <span className="text-[13px] bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg font-semibold text-slate-700 dark:text-slate-300">
                                {m.transactionType}
                              </span>
                            </td>
                            <td className="p-4.5 font-sans text-slate-800 dark:text-slate-200 font-medium">{m.description}</td>
                            <td className="p-4.5 text-right text-rose-600 font-bold">
                              {m.debit ? formatCurrency(m.debit) : '—'}
                            </td>
                            <td className="p-4.5 text-right text-emerald-600 font-bold">
                              {m.credit ? formatCurrency(m.credit) : '—'}
                            </td>
                            <td className="p-4.5 text-right font-bold text-slate-900 dark:text-white">
                              {formatCurrency(m.runningBalance)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400 font-sans text-[16px]">
                            No journal transactions recorded for account {selectedGLAccount} in selected date range.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: CHART OF ACCOUNTS TREE */}
      {/* ========================================================= */}
      {activeTab === 'coa' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h2 className="text-[22px] font-bold text-slate-900 dark:text-white">Standardized Chart of Accounts (COA)</h2>
              <p className="text-[16px] text-slate-500 dark:text-slate-400 mt-1">
                5-Class hierarchical general ledger chart compliant with Ethiopian SACCO regulatory frameworks.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              className="min-h-[52px] text-[18px] px-6 font-semibold"
              onClick={() => setIsNewAccountModalOpen(true)}
              leftIcon={<Plus className="w-5 h-5" />}
            >
              Add GL Account
            </Button>
          </div>

          <DataTable
            data={coaList}
            columns={coaColumns}
            keyExtractor={(item) => item.accountCode}
            searchPlaceholder="Search accounts by code or name..."
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: PERIOD CLOSINGS & AUDIT LOCK */}
      {/* ========================================================= */}
      {activeTab === 'periods' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-[22px] font-bold text-slate-900 dark:text-white">Accounting Periods & Year-End Closing Controls</h2>
            <p className="text-[16px] text-slate-500 dark:text-slate-400 mt-1">
              Control financial posting cutoffs, execute year-end surplus allocations, and enforce cryptographic audit locks.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[16px]">
                    <th className="p-4.5">Period Name</th>
                    <th className="p-4.5">Type</th>
                    <th className="p-4.5">Date Range</th>
                    <th className="p-4.5 text-center">Status</th>
                    <th className="p-4.5 text-right">Net Surplus (ETB)</th>
                    <th className="p-4.5 text-right">30% Legal Reserve</th>
                    <th className="p-4.5">Closed / Locked By</th>
                    <th className="p-4.5 text-right">Period Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[16px]">
                  {periods.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 min-h-[60px]">
                      <td className="p-4.5 font-bold text-slate-900 dark:text-white text-[17px]">{p.name}</td>
                      <td className="p-4.5">
                        <Badge variant="neutral" size="md">
                          {p.type}
                        </Badge>
                      </td>
                      <td className="p-4.5 text-slate-600 dark:text-slate-300 font-mono text-[15px]">
                        {formatDate(p.startDate)} - {formatDate(p.endDate)}
                      </td>
                      <td className="p-4.5 text-center">
                        <Badge
                          variant={p.status === 'LOCKED' ? 'neutral' : p.status === 'CLOSED' ? 'warning' : 'success'}
                          size="md"
                        >
                          {p.status}
                        </Badge>
                      </td>
                      <td className="p-4.5 text-right font-mono font-bold text-emerald-600 text-[17px]">
                        {p.netSurplus ? formatCurrency(p.netSurplus) : '—'}
                      </td>
                      <td className="p-4.5 text-right font-mono text-slate-700 dark:text-slate-300 font-semibold">
                        {p.statutoryReserveAllocation ? formatCurrency(p.statutoryReserveAllocation) : '—'}
                      </td>
                      <td className="p-4.5 text-slate-500 dark:text-slate-400 text-[15px]">
                        {p.lockedByName || p.closedByName || '—'}
                      </td>
                      <td className="p-4.5 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          {p.status === 'OPEN' && (
                            <Button
                              variant="outline"
                              size="md"
                              onClick={() => {
                                setPeriodToClose(p);
                                setIsClosePeriodModalOpen(true);
                              }}
                              className="text-[15px] px-4 min-h-[44px]"
                            >
                              Close Period
                            </Button>
                          )}
                          {p.status === 'CLOSED' && (
                            <Button
                              variant="secondary"
                              size="md"
                              onClick={() => handleLockPeriod(p.id, p.name)}
                              className="text-[15px] px-4 min-h-[44px] text-slate-700 dark:text-slate-200"
                              leftIcon={<Lock className="w-4 h-4" />}
                            >
                              Audit Lock
                            </Button>
                          )}
                          {p.status === 'LOCKED' && (
                            <Button
                              variant="ghost"
                              size="md"
                              onClick={() => handleReopenPeriod(p.id, p.name)}
                              className="text-[15px] text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 px-3 min-h-[44px]"
                              leftIcon={<Unlock className="w-4 h-4" />}
                            >
                              Reopen
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 7: BANK RECONCILIATION */}
      {/* ========================================================= */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h2 className="text-[22px] font-bold text-slate-900 dark:text-white">Bank & Digital Wallet Reconciliations</h2>
              <p className="text-[16px] text-slate-500 dark:text-slate-400 mt-1">
                Reconcile physical bank statements (CBE, Tsehay, Awash) and digital liquidity pools against the General Ledger.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              className="min-h-[52px] text-[18px] px-6 font-semibold"
              onClick={() => setIsNewReconModalOpen(true)}
              leftIcon={<Plus className="w-5 h-5" />}
            >
              Perform Reconciliation
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reconciliations.map((rec: any) => (
              <div key={rec.id} className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-[14px] font-bold text-blue-600 dark:text-sky-400 block">{rec.reconciliationNo}</span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-[20px]">{rec.bankAccountName}</h3>
                  </div>
                  <Badge variant={rec.status === 'RECONCILED' ? 'success' : 'error'} size="md">
                    {rec.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-[16px] font-mono">
                  <div>
                    <span className="text-slate-400 text-[13px] font-sans uppercase tracking-wider block">Statement Balance</span>
                    <span className="font-bold text-slate-900 dark:text-white text-[18px]">{formatCurrency(rec.statementBalance)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[13px] font-sans uppercase tracking-wider block">GL Book Balance</span>
                    <span className="font-bold text-slate-900 dark:text-white text-[18px]">{formatCurrency(rec.bookBalance)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[13px] font-sans uppercase tracking-wider block">Unpresented Checks</span>
                    <span className="text-slate-700 dark:text-slate-300">({formatCurrency(rec.unpresentedPayments || 0)})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[13px] font-sans uppercase tracking-wider block">Variance Discrepancy</span>
                    <span className={`font-bold text-[18px] ${rec.variance === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatCurrency(rec.variance)}
                    </span>
                  </div>
                </div>

                {rec.notes && <p className="text-[15px] text-slate-600 dark:text-slate-400 italic">"{rec.notes}"</p>}

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[14px] text-slate-400">
                  <span>Sign-off: {rec.reconciledByName}</span>
                  <span>{formatDate(rec.statementDate)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 8: ANNUAL BUDGETS & VARIANCE ANALYSIS */}
      {/* ========================================================= */}
      {activeTab === 'budgets' && budgetVariance && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h2 className="text-[22px] font-bold text-slate-900 dark:text-white">FY{budgetVariance.fiscalYear} Annual Operating Budget & Variance</h2>
              <p className="text-[16px] text-slate-500 dark:text-slate-400 mt-1">{budgetVariance.budgetTitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <SelectInput
                label="Fiscal Year"
                value={selectedFiscalYear}
                onChange={(e) => setSelectedFiscalYear(e.target.value)}
                options={[
                  { value: '2026', label: 'FY 2026' },
                  { value: '2025', label: 'FY 2025' },
                ]}
              />
            </div>
          </div>

          {/* Variance KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-[14px] font-bold text-slate-400 uppercase tracking-wider">Revenue Target</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-[30px] font-bold text-slate-900 dark:text-white tabular-nums">{formatCurrency(budgetVariance.actualIncome)}</span>
                <span className="text-[16px] text-slate-400">/ {formatCurrency(budgetVariance.totalBudgetedIncome)}</span>
              </div>
              <span className={`text-[15px] font-bold mt-1 block ${budgetVariance.incomeVariance >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {budgetVariance.incomeVariance >= 0 ? '+' : ''}{formatCurrency(budgetVariance.incomeVariance)} vs Budget
              </span>
            </div>

            <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-[14px] font-bold text-slate-400 uppercase tracking-wider">Operating Expenses</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-[30px] font-bold text-slate-900 dark:text-white tabular-nums">{formatCurrency(budgetVariance.actualExpense)}</span>
                <span className="text-[16px] text-slate-400">/ {formatCurrency(budgetVariance.totalBudgetedExpense)}</span>
              </div>
              <span className={`text-[15px] font-bold mt-1 block ${budgetVariance.expenseVariance <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {budgetVariance.expenseVariance <= 0 ? 'Favorable (Under Budget)' : 'Over Budget'}
              </span>
            </div>

            <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-[14px] font-bold text-slate-400 uppercase tracking-wider">Net Operating Surplus</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-[30px] font-bold text-emerald-600 tabular-nums">{formatCurrency(budgetVariance.actualNetSurplus)}</span>
                <span className="text-[16px] text-slate-400">/ {formatCurrency(budgetVariance.projectedNetSurplus)}</span>
              </div>
              <span className="text-[15px] font-bold text-emerald-600 mt-1 block">
                +{formatCurrency(budgetVariance.surplusVariance)} Surplus Variance
              </span>
            </div>
          </div>

          {/* Itemized Budget vs Actual Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[16px]">
                    <th className="p-4.5">GL Code</th>
                    <th className="p-4.5">Line Item Description</th>
                    <th className="p-4.5">Category</th>
                    <th className="p-4.5 text-right">Annual Budget</th>
                    <th className="p-4.5 text-right">Actual Realized</th>
                    <th className="p-4.5 text-right">Variance (ETB)</th>
                    <th className="p-4.5 text-center">Performance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[16px]">
                  {budgetVariance.items.map((item: any) => (
                    <tr key={item.accountCode} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 min-h-[60px]">
                      <td className="p-4.5 text-blue-600 dark:text-sky-400 font-bold">{item.accountCode}</td>
                      <td className="p-4.5 font-sans font-semibold text-slate-900 dark:text-white text-[17px]">{item.accountName}</td>
                      <td className="p-4.5 font-sans">
                        <Badge variant={item.accountType === 'INCOME' ? 'success' : 'error'} size="md">
                          {item.accountType}
                        </Badge>
                      </td>
                      <td className="p-4.5 text-right text-slate-700 dark:text-slate-300">{formatCurrency(item.budgetAmount)}</td>
                      <td className="p-4.5 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(item.actualAmount)}</td>
                      <td className={`p-4.5 text-right font-bold ${item.isFavorable ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {item.varianceAmount >= 0 ? '+' : ''}{formatCurrency(item.varianceAmount)}
                      </td>
                      <td className="p-4.5 text-center font-sans">
                        <Badge variant={item.isFavorable ? 'success' : 'warning'} size="md">
                          {item.isFavorable ? 'FAVORABLE' : 'UNFAVORABLE'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: CREATE NEW GL ACCOUNT */}
      {/* ========================================================= */}
      {isNewAccountModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsNewAccountModalOpen(false)}
          title="Create New General Ledger Account"
          size="md"
          footer={
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" size="md" className="min-h-[52px] text-[16px] px-6" onClick={() => setIsNewAccountModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" className="min-h-[52px] text-[18px] px-6 font-semibold" onClick={handleCreateAccount}>
                Create Account
              </Button>
            </div>
          }
        >
          <form onSubmit={handleCreateAccount} className="space-y-5 text-[16px]">
            <div className="grid grid-cols-2 gap-4">
              <TextInput
                label="Account Code"
                placeholder="e.g. 1060 or 5090"
                value={newAccountCode}
                onChange={(e) => setNewAccountCode(e.target.value)}
                required
              />
              <SelectInput
                label="Account Classification"
                value={newAccountType}
                onChange={(e) => setNewAccountType(e.target.value)}
                options={[
                  { value: 'ASSET', label: '1000 - ASSET' },
                  { value: 'LIABILITY', label: '2000 - LIABILITY' },
                  { value: 'EQUITY', label: '3000 - EQUITY' },
                  { value: 'INCOME', label: '4000 - INCOME' },
                  { value: 'EXPENSE', label: '5000 - EXPENSE' },
                ]}
              />
            </div>

            <TextInput
              label="Account Title"
              placeholder="e.g. Telebirr Branch Float Wallet"
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
              required
            />

            <SelectInput
              label="Parent Header Account"
              value={newAccountParent}
              onChange={(e) => setNewAccountParent(e.target.value)}
              options={[
                { value: '', label: '-- None (Top Level) --' },
                ...coaList
                  .filter((c) => c.isHeader)
                  .map((c) => ({ value: c.accountCode, label: `${c.accountCode} - ${c.accountName}` })),
              ]}
            />

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="isHeader"
                checked={newAccountIsHeader}
                onChange={(e) => setNewAccountIsHeader(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded"
              />
              <label htmlFor="isHeader" className="font-semibold text-slate-800 dark:text-slate-200 text-[16px]">
                Is Header / Summary Node (Cannot receive direct journal postings)
              </label>
            </div>

            <TextInput
              label="Description / Regulatory Note"
              placeholder="e.g. Operating liquidity account for cashier disbursements"
              value={newAccountDesc}
              onChange={(e) => setNewAccountDesc(e.target.value)}
            />
          </form>
        </Modal>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: CLOSE PERIOD MODAL */}
      {/* ========================================================= */}
      {isClosePeriodModalOpen && periodToClose && (
        <Modal
          isOpen={true}
          onClose={() => setIsClosePeriodModalOpen(false)}
          title={`Close Accounting Period: ${periodToClose.name}`}
          size="md"
          footer={
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" size="md" className="min-h-[52px] text-[16px] px-6" onClick={() => setIsClosePeriodModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="md" className="min-h-[52px] text-[18px] px-6 font-semibold" onClick={handleClosePeriod}>
                Confirm Period Closing
              </Button>
            </div>
          }
        >
          <div className="space-y-5 text-[16px]">
            <div className="p-5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-amber-900 dark:text-amber-200">
              <p className="font-bold text-[18px]">Mandatory Pre-Closing Audit Checklist:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1.5 text-[15px]">
                <li>Double-entry Trial Balance must be balanced (Discrepancy = 0.00 ETB).</li>
                <li>All daily cashier batches and bank imports must be posted.</li>
                <li>Ethiopian Proclamation 30% Statutory Reserve will be allocated automatically.</li>
              </ul>
            </div>

            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Closing period <strong>{periodToClose.name}</strong> ({periodToClose.startDate} to {periodToClose.endDate}) locks standard staff postings and establishes official audit trial balances.
            </p>
          </div>
        </Modal>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: BANK RECONCILIATION MODAL */}
      {/* ========================================================= */}
      {isNewReconModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsNewReconModalOpen(false)}
          title="Perform Bank Reconciliation"
          size="md"
          footer={
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" size="md" className="min-h-[52px] text-[16px] px-6" onClick={() => setIsNewReconModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" className="min-h-[52px] text-[18px] px-6 font-semibold" onClick={handleCreateReconciliation}>
                Execute Reconciliation
              </Button>
            </div>
          }
        >
          <form onSubmit={handleCreateReconciliation} className="space-y-5 text-[16px]">
            <div className="grid grid-cols-2 gap-4">
              <SelectInput
                label="Bank Account"
                value={reconBankCode}
                onChange={(e) => setReconBankCode(e.target.value)}
                options={[
                  { value: '1010', label: '1010 - Commercial Bank of Ethiopia (CBE)' },
                  { value: '1020', label: '1020 - Tsehay Bank Current Account' },
                  { value: '1030', label: '1030 - Awash Bank Current Account' },
                  { value: '1040', label: '1040 - Telebirr SuperApp Merchant Pool' },
                ]}
              />
              <TextInput
                label="Statement Date"
                type="date"
                value={reconStatementDate}
                onChange={(e) => setReconStatementDate(e.target.value)}
                required
              />
            </div>

            <TextInput
              label="Bank Portal Statement Ending Balance (ETB)"
              type="number"
              step="0.01"
              placeholder="e.g. 1452500.00"
              value={reconStatementBal}
              onChange={(e) => setReconStatementBal(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <TextInput
                label="Uncredited Deposits (In Transit)"
                type="number"
                step="0.01"
                value={reconUncredited}
                onChange={(e) => setReconUncredited(e.target.value)}
              />
              <TextInput
                label="Unpresented Checks / Outgoing"
                type="number"
                step="0.01"
                value={reconUnpresented}
                onChange={(e) => setReconUnpresented(e.target.value)}
              />
            </div>

            <TextInput
              label="Reconciliation Notes & Verification"
              placeholder="e.g. Matched with monthly CBE e-banking statement extract"
              value={reconNotes}
              onChange={(e) => setReconNotes(e.target.value)}
            />
          </form>
        </Modal>
      )}
    </div>
  );
};
