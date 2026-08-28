import React, { useState, useEffect } from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { useToast } from '../../providers/ToastProvider';
import { shareApiService } from '../../services/shareApiService';
import { memberApiService } from '../../services/memberApiService';
import {
  ShareAccount,
  ShareTransaction,
  ShareStatistics,
  OwnershipReport,
  NonCompliantReport,
  ShareSettingsData,
} from '../../types/shares';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { TextInput } from '../../components/common/TextInput';
import { SelectInput } from '../../components/common/SelectInput';
import { Badge } from '../../components/common/Badge';
import {
  Coins,
  TrendingUp,
  Users,
  ShieldCheck,
  AlertTriangle,
  Award,
  History,
  FileSpreadsheet,
  Settings,
  PlusCircle,
  ArrowRightLeft,
  RotateCcw,
  Search,
  CheckCircle2,
  Printer,
  Sliders,
  Sparkles,
  Layers,
  PieChart,
} from 'lucide-react';

export const SharesManagementView: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'ACCOUNTS' | 'TRANSACTIONS' | 'REPORTS' | 'SETTINGS'>('ACCOUNTS');
  const [isLoading, setIsLoading] = useState(true);

  // Accounts Tab State
  const [accounts, setAccounts] = useState<ShareAccount[]>([]);
  const [accountsTotal, setAccountsTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [complianceFilter, setComplianceFilter] = useState<'ALL' | 'COMPLIANT' | 'NON_COMPLIANT'>('ALL');
  const [minReqShares, setMinReqShares] = useState(5);
  const [shareUnitPrice, setShareUnitPrice] = useState(500);

  // Transactions Tab State
  const [transactions, setTransactions] = useState<ShareTransaction[]>([]);
  const [txTypeFilter, setTxTypeFilter] = useState('ALL');
  const [txTotal, setTxTotal] = useState(0);

  // Reports Tab State
  const [stats, setStats] = useState<ShareStatistics | null>(null);
  const [ownership, setOwnership] = useState<OwnershipReport | null>(null);
  const [nonCompliant, setNonCompliant] = useState<NonCompliantReport | null>(null);
  const [reportsSubTab, setReportsSubTab] = useState<'OVERVIEW' | 'OWNERSHIP' | 'NON_COMPLIANT'>('OVERVIEW');

  // Settings Tab State
  const [settings, setSettings] = useState<ShareSettingsData | null>(null);

  // Member search list for issue shares modal
  const [membersList, setMembersList] = useState<any[]>([]);

  // Modals
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isReverseModalOpen, setIsReverseModalOpen] = useState(false);
  const [selectedTxForReverse, setSelectedTxForReverse] = useState<ShareTransaction | null>(null);
  const [reverseReason, setReverseReason] = useState('');
  const [isSubmittingReverse, setIsSubmittingReverse] = useState(false);

  // Account Detail Modal
  const [selectedAccountDetail, setSelectedAccountDetail] = useState<any | null>(null);

  // Issue Shares Form
  const [issueMemberId, setIssueMemberId] = useState('');
  const [issueSharesCount, setIssueSharesCount] = useState<number>(5);
  const [issuePaymentMethod, setIssuePaymentMethod] = useState<'CASH' | 'CBE_BANK' | 'TSEHAY_BANK' | 'INTERNAL_TRANSFER'>('CBE_BANK');
  const [issueBankRef, setIssueBankRef] = useState('');
  const [issueNarration, setIssueNarration] = useState('');
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);

  // Convert Form
  const [convertMemberId, setConvertMemberId] = useState('');
  const [convertAmount, setConvertAmount] = useState<number>(2500);
  const [convertNarration, setConvertNarration] = useState('');
  const [isSubmittingConvert, setIsSubmittingConvert] = useState(false);

  // Settings Edit Form
  const [editPrice, setEditPrice] = useState(500);
  const [editMinShares, setEditMinShares] = useState(5);
  const [editDividendRate, setEditDividendRate] = useState(14.5);
  const [editPriceReason, setEditPriceReason] = useState('');
  const [isSubmittingSettings, setIsSubmittingSettings] = useState(false);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      // Load accounts
      const accRes = await shareApiService.getAccounts({
        query: searchQuery,
        complianceStatus: complianceFilter,
        limit: 50,
      });
      setAccounts(accRes.data || []);
      setAccountsTotal(accRes.pagination?.total || 0);
      if (accRes.meta) {
        setMinReqShares(accRes.meta.minRequiredShares || 5);
        setShareUnitPrice(accRes.meta.sharePrice || 500);
      }

      // Load transactions
      const txRes = await shareApiService.getTransactions({
        type: txTypeFilter !== 'ALL' ? txTypeFilter : undefined,
        limit: 50,
      });
      setTransactions(txRes.data || []);
      setTxTotal(txRes.pagination?.total || 0);

      // Load stats & settings
      const [statsRes, ownerRes, nonCompRes, settRes] = await Promise.all([
        shareApiService.getStatistics().catch(() => null),
        shareApiService.getOwnershipReport().catch(() => null),
        shareApiService.getNonCompliantReport().catch(() => null),
        shareApiService.getSettings().catch(() => null),
      ]);

      if (statsRes) setStats(statsRes);
      if (ownerRes) setOwnership(ownerRes);
      if (nonCompRes) setNonCompliant(nonCompRes);
      if (settRes) {
        setSettings(settRes);
        setEditPrice(settRes.sharePrice);
        setEditMinShares(settRes.minRequiredShares);
        setEditDividendRate(settRes.shareDividendRate);
      }

      // Load members for dropdowns
      const mRes = await memberApiService.getMembers().catch(() => null);
      if (mRes && mRes.members) {
        setMembersList(mRes.members);
      }
    } catch (err: any) {
      console.warn('Error loading share management data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [complianceFilter, txTypeFilter]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const accRes = await shareApiService.getAccounts({
        query: searchQuery,
        complianceStatus: complianceFilter,
        limit: 50,
      });
      setAccounts(accRes.data || []);
      setAccountsTotal(accRes.pagination?.total || 0);
    } catch (err: any) {
      toastError('Search Failed', err.message);
    }
  };

  const handleIssueShares = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueMemberId) {
      toastError('Validation', 'Please select a target member.');
      return;
    }
    if (issueSharesCount < 1) {
      toastError('Validation', 'Please specify at least 1 share.');
      return;
    }

    try {
      setIsSubmittingIssue(true);
      const res = await shareApiService.purchaseShares({
        memberId: issueMemberId,
        numberOfShares: issueSharesCount,
        paymentMethod: issuePaymentMethod,
        bankReferenceNo: issueBankRef || undefined,
        narration: issueNarration || undefined,
      });

      success(
        'Shares Subscribed',
        `Successfully issued ${issueSharesCount} shares (${formatCurrency(issueSharesCount * shareUnitPrice)}) for ${res.shareAccount.memberName}.`
      );
      setIsIssueModalOpen(false);
      setIssueBankRef('');
      setIssueNarration('');
      loadInitialData();
    } catch (err: any) {
      toastError('Subscription Failed', err.message || 'Could not issue shares.');
    } finally {
      setIsSubmittingIssue(false);
    }
  };

  const handleConvertSavings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertMemberId) {
      toastError('Validation', 'Please select a target member.');
      return;
    }
    if (convertAmount < shareUnitPrice) {
      toastError('Validation', `Minimum conversion is ${formatCurrency(shareUnitPrice)} (1 share).`);
      return;
    }

    try {
      setIsSubmittingConvert(true);
      const res = await shareApiService.convertVoluntarySavings({
        memberId: convertMemberId,
        amountToConvert: convertAmount,
        narration: convertNarration || undefined,
      });

      success(
        'Conversion Complete',
        `Converted ${formatCurrency(res.amountConverted)} into ${res.sharesPurchased} share(s). ${
          res.remainderKeptInSavings > 0 ? `${formatCurrency(res.remainderKeptInSavings)} kept in savings.` : ''
        }`
      );
      setIsConvertModalOpen(false);
      setConvertNarration('');
      loadInitialData();
    } catch (err: any) {
      toastError('Conversion Failed', err.message || 'Could not convert savings to shares.');
    } finally {
      setIsSubmittingConvert(false);
    }
  };

  const handleReverseTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxForReverse) return;
    if (!reverseReason || reverseReason.trim().length < 5) {
      toastError('Validation', 'Please provide a comprehensive reversal justification reason.');
      return;
    }

    try {
      setIsSubmittingReverse(true);
      await shareApiService.reverseTransaction(selectedTxForReverse.id, {
        reason: reverseReason.trim(),
      });

      success('Transaction Reversed', `Share transaction ${selectedTxForReverse.transactionNo} reversed successfully.`);
      setIsReverseModalOpen(false);
      setSelectedTxForReverse(null);
      setReverseReason('');
      loadInitialData();
    } catch (err: any) {
      toastError('Reversal Failed', err.message || 'Could not reverse share transaction.');
    } finally {
      setIsSubmittingReverse(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingSettings(true);
      const updated = await shareApiService.updateSettings({
        sharePrice: editPrice,
        minRequiredShares: editMinShares,
        shareDividendRate: editDividendRate,
        reason: editPriceReason || 'Periodic cooperative governance update',
      });

      success('Settings Updated', 'Share system parameters and pricing updated successfully.');
      setSettings(updated);
      setShareUnitPrice(updated.sharePrice);
      setMinReqShares(updated.minRequiredShares);
      setEditPriceReason('');
    } catch (err: any) {
      toastError('Update Failed', err.message || 'Could not update share settings.');
    } finally {
      setIsSubmittingSettings(false);
    }
  };

  const handleViewAccount = async (id: string) => {
    try {
      const detail = await shareApiService.getAccountById(id);
      setSelectedAccountDetail(detail);
    } catch (err: any) {
      toastError('Fetch Error', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Share Capital & Equity Management</h1>
              <p className="text-xs text-slate-500">
                Phase 13 Centralized Module • GL Account 3010-SHR • Par Value: {formatCurrency(shareUnitPrice)} / Share
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (membersList.length > 0) setConvertMemberId(membersList[0].id);
              setIsConvertModalOpen(true);
            }}
            icon={<ArrowRightLeft className="w-4 h-4 text-emerald-600" />}
          >
            Convert Savings
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (membersList.length > 0) setIssueMemberId(membersList[0].id);
              setIsIssueModalOpen(true);
            }}
            icon={<PlusCircle className="w-4 h-4 text-white" />}
          >
            Issue / Purchase Shares
          </Button>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Capital */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Share Capital</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600">
            {formatCurrency(stats?.totalShareCapital || 0)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className="text-slate-500">Total Shares:</span>
            <span className="font-bold text-slate-900">{(stats?.totalShares || 0).toLocaleString()} Shares</span>
          </div>
        </div>

        {/* Active Shareholders */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Shareholders</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            {stats?.totalAccounts || 0}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className="text-slate-500">Average Holding:</span>
            <span className="font-semibold text-slate-700">{stats?.averageShares.toFixed(1) || 0} Shares</span>
          </div>
        </div>

        {/* 5-Share Compliance Rate */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Statutory Compliance (≥5)</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-indigo-600">
              {stats?.complianceRate || 0}%
            </p>
            <span className="text-xs text-slate-500">({stats?.compliantCount || 0} Compliant)</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className="text-slate-500">Pending Members:</span>
            <span className="font-bold text-amber-600">{stats?.nonCompliantCount || 0} below 5 shares</span>
          </div>
        </div>

        {/* Dividend & Par Value */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Current Par & Dividend</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-black text-slate-900">
            {formatCurrency(shareUnitPrice)} <span className="text-xs font-normal text-slate-500">/ Share</span>
          </p>
          <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className="text-slate-500">Declared Dividend:</span>
            <span className="font-bold text-amber-600">{stats?.dividendRate || 14.5}% p.a.</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('ACCOUNTS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'ACCOUNTS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" /> Share Accounts Directory ({accountsTotal})
        </button>
        <button
          onClick={() => setActiveTab('TRANSACTIONS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'TRANSACTIONS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" /> Transactions Ledger ({txTotal})
        </button>
        <button
          onClick={() => setActiveTab('REPORTS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'REPORTS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <PieChart className="w-4 h-4" /> Capital Reports & Ownership
        </button>
        <button
          onClick={() => setActiveTab('SETTINGS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'SETTINGS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4" /> Share Parameters & Pricing
        </button>
      </div>

      {/* ========================================== */}
      {/* TAB 1: SHARE ACCOUNTS DIRECTORY */}
      {/* ========================================== */}
      {activeTab === 'ACCOUNTS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-md w-full">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by member name, ID, or account no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <Button variant="secondary" size="sm" type="submit">
                Search
              </Button>
            </form>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0">
              <button
                onClick={() => setComplianceFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  complianceFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Members
              </button>
              <button
                onClick={() => setComplianceFilter('COMPLIANT')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  complianceFilter === 'COMPLIANT' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Compliant (≥5)
              </button>
              <button
                onClick={() => setComplianceFilter('NON_COMPLIANT')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  complianceFilter === 'NON_COMPLIANT' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Non-Compliant (&lt;5)
              </button>
            </div>
          </div>

          {/* Accounts Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Account No</th>
                  <th className="py-3 px-4">Member Name & ID</th>
                  <th className="py-3 px-4 text-right">Shares Held</th>
                  <th className="py-3 px-4 text-right">Capital Value (ETB)</th>
                  <th className="py-3 px-4 text-center">Compliance Status</th>
                  <th className="py-3 px-4">Certificate No</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No share accounts found matching filters.
                    </td>
                  </tr>
                ) : (
                  accounts.map((acc) => {
                    const isAccCompliant = acc.numberOfShares >= minReqShares;
                    return (
                      <tr key={acc.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-blue-600 whitespace-nowrap">
                          {acc.accountNo}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{acc.memberName}</div>
                          <span className="text-[10px] text-slate-400 font-mono">{acc.membershipNo}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-black text-slate-900 font-mono">
                          {acc.numberOfShares} <span className="text-[10px] font-normal text-slate-400">shares</span>
                        </td>
                        <td className="py-3 px-4 text-right font-black text-emerald-600 font-mono">
                          {formatCurrency(acc.totalShareValue)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isAccCompliant ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              COMPLIANT (≥5)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              SHORTFALL ({minReqShares - acc.numberOfShares})
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {acc.certificateNumber || 'CERT-PENDING'}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="text-xs px-2 py-1"
                              onClick={() => handleViewAccount(acc.id)}
                            >
                              Details
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 text-xs px-2 py-1"
                              onClick={() => {
                                setIssueMemberId(acc.memberId);
                                setIsIssueModalOpen(true);
                              }}
                            >
                              + Issue
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: TRANSACTIONS LEDGER */}
      {/* ========================================== */}
      {activeTab === 'TRANSACTIONS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Share Capital Transactions & Journal Vouchers</h3>
              <p className="text-xs text-slate-500">Centralized immutable ledger of all share purchases, conversions, and GL postings.</p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              {['ALL', 'SHARE_PURCHASE', 'SHARE_CONVERSION', 'SHARE_REVERSAL'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTxTypeFilter(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    txTypeFilter === t ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t === 'ALL' ? 'All' : t === 'SHARE_PURCHASE' ? 'Purchases' : t === 'SHARE_CONVERSION' ? 'Conversions' : 'Reversals'}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Txn Number</th>
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-4">Type & Channel</th>
                  <th className="py-3 px-4 text-right">Shares</th>
                  <th className="py-3 px-4 text-right">Amount (ETB)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Reversal / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No share transactions found.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {formatDateTime(tx.timestamp || tx.createdAt)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 whitespace-nowrap">
                        {tx.transactionNo}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{tx.memberName}</div>
                        <span className="text-[10px] text-slate-400 font-mono">{tx.membershipNo}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">
                          {tx.type === 'SHARE_PURCHASE'
                            ? 'Direct Purchase'
                            : tx.type === 'SHARE_CONVERSION'
                            ? 'Voluntary Conversion'
                            : 'Transaction Reversal'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {tx.paymentMethod} {tx.bankReferenceNo ? `• ${tx.bankReferenceNo}` : ''}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-600 font-mono">
                        +{tx.numberOfShares}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900 font-mono">
                        {formatCurrency(tx.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={tx.status === 'POSTED' ? 'success' : tx.status === 'REVERSED' ? 'error' : 'warning'}
                          size="sm"
                        >
                          {tx.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {tx.status === 'POSTED' && (user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 hover:text-rose-700 text-xs px-2 py-1"
                            onClick={() => {
                              setSelectedTxForReverse(tx);
                              setIsReverseModalOpen(true);
                            }}
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reverse
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 3: CAPITAL REPORTS & OWNERSHIP */}
      {/* ========================================== */}
      {activeTab === 'REPORTS' && (
        <div className="space-y-6">
          {/* Sub Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setReportsSubTab('OVERVIEW')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                reportsSubTab === 'OVERVIEW' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              Tier & Capital Breakdown
            </button>
            <button
              onClick={() => setReportsSubTab('OWNERSHIP')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                reportsSubTab === 'OWNERSHIP' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              Top Shareholders & Ownership %
            </button>
            <button
              onClick={() => setReportsSubTab('NON_COMPLIANT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                reportsSubTab === 'NON_COMPLIANT' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              Non-Compliant Members (&lt;5 Shares)
            </button>
          </div>

          {/* SubTab 1: Overview & Tier Breakdown */}
          {reportsSubTab === 'OVERVIEW' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tiers Distribution */}
              <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" /> Shareholding Tier Distribution
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                    <span className="font-semibold text-slate-700">1 - 5 Shares (Minimum Threshold):</span>
                    <span className="font-black text-slate-900">{stats?.tiers.tier1_5 || 0} Members</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                    <span className="font-semibold text-slate-700">6 - 20 Shares (Standard Class):</span>
                    <span className="font-black text-slate-900">{stats?.tiers.tier6_20 || 0} Members</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                    <span className="font-semibold text-slate-700">21 - 50 Shares (Growth Tier):</span>
                    <span className="font-black text-slate-900">{stats?.tiers.tier21_50 || 0} Members</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                    <span className="font-semibold text-slate-700">51 - 100 Shares (Major Shareholders):</span>
                    <span className="font-black text-slate-900">{stats?.tiers.tier51_100 || 0} Members</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 bg-emerald-50 text-emerald-950 rounded-xl">
                    <span className="font-bold">100+ Shares (Institutional Pillars):</span>
                    <span className="font-black">{stats?.tiers.tier100Plus || 0} Members</span>
                  </div>
                </div>
              </div>

              {/* Conversion Statistics */}
              <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-emerald-600" /> Voluntary Savings Conversion Yield
                </h3>
                <p className="text-xs text-slate-500">
                  Total capital acquired through seamless automated conversion of voluntary liquid thrift into permanent shares.
                </p>
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 space-y-2">
                  <span className="text-[11px] uppercase font-bold text-emerald-800">Total Converted Capital</span>
                  <p className="text-2xl font-black text-emerald-700">
                    {formatCurrency(stats?.totalConversionVolume || 0)}
                  </p>
                  <p className="text-xs text-emerald-800">
                    From <span className="font-bold">{stats?.totalConversionsCount || 0}</span> member conversion operations.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SubTab 2: Top Shareholders */}
          {reportsSubTab === 'OWNERSHIP' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Top Shareholders & Ownership Concentration</h3>
                  <p className="text-xs text-slate-500">Individual equity stakes and voting weight analysis.</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => window.print()} icon={<Printer className="w-4 h-4" />}>
                  Print Report
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                      <th className="py-3 px-4 text-center">Rank</th>
                      <th className="py-3 px-4">Member Name</th>
                      <th className="py-3 px-4">Membership No</th>
                      <th className="py-3 px-4 text-right">Shares Held</th>
                      <th className="py-3 px-4 text-right">Total Capital (ETB)</th>
                      <th className="py-3 px-4 text-right">Ownership %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ownership?.topShareholders.map((sh) => (
                      <tr key={sh.shareAccountId} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 text-center font-bold font-mono text-slate-500">
                          #{sh.rank}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">{sh.memberName}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{sh.membershipNo}</td>
                        <td className="py-3 px-4 text-right font-black text-slate-900 font-mono">
                          {sh.numberOfShares}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-emerald-600 font-mono">
                          {formatCurrency(sh.totalShareValue)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-blue-600 font-mono">
                          {sh.ownershipPercentage.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SubTab 3: Non-Compliant Report */}
          {reportsSubTab === 'NON_COMPLIANT' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Members Below 5-Share Statutory Requirement ({nonCompliant?.totalNonCompliant || 0} Members)
                  </h3>
                  <p className="text-xs text-amber-700">
                    Total Share Capital Shortfall: <span className="font-bold">{formatCurrency(nonCompliant?.totalShortfallCapital || 0)}</span>
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                      <th className="py-3 px-4">Member Name & ID</th>
                      <th className="py-3 px-4 text-right">Current Shares</th>
                      <th className="py-3 px-4 text-right">Shortfall (Shares)</th>
                      <th className="py-3 px-4 text-right">Capital Shortfall (ETB)</th>
                      <th className="py-3 px-4 text-right">Voluntary Savings Available</th>
                      <th className="py-3 px-4 text-center">Can Auto-Cover?</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {nonCompliant?.nonCompliantMembers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          All registered members are 100% compliant with the 5-share minimum rule!
                        </td>
                      </tr>
                    ) : (
                      nonCompliant?.nonCompliantMembers.map((m) => (
                        <tr key={m.shareAccountId} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{m.memberName}</div>
                            <span className="text-[10px] text-slate-400 font-mono">{m.membershipNo}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-700">
                            {m.currentShares} / 5
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-amber-600">
                            -{m.shortfallShares}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-rose-600">
                            {formatCurrency(m.shortfallAmount)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                            {formatCurrency(m.voluntaryAvailableBalance)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {m.canCoverWithVoluntary ? (
                              <Badge variant="success" size="sm">Yes (Voluntary)</Badge>
                            ) : (
                              <Badge variant="warning" size="sm">Deposit Needed</Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {m.canCoverWithVoluntary ? (
                              <Button
                                variant="primary"
                                size="sm"
                                className="text-xs px-2 py-1"
                                onClick={() => {
                                  setConvertMemberId(m.memberId);
                                  setConvertAmount(m.shortfallAmount);
                                  setIsConvertModalOpen(true);
                                }}
                              >
                                Convert & Fulfill
                              </Button>
                            ) : (
                              <Button
                                variant="secondary"
                                size="sm"
                                className="text-xs px-2 py-1"
                                onClick={() => {
                                  setIssueMemberId(m.memberId);
                                  setIssueSharesCount(m.shortfallShares);
                                  setIsIssueModalOpen(true);
                                }}
                              >
                                Issue Shares
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 4: SHARE SETTINGS & PRICING */}
      {/* ========================================== */}
      {activeTab === 'SETTINGS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" /> Share System Parameters
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure par value per share, minimum statutory requirements, and projected dividend rates.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <TextInput
                label="Par Value Per Share (ETB)"
                type="number"
                min="100"
                step="50"
                value={editPrice.toString()}
                onChange={(e) => setEditPrice(parseFloat(e.target.value) || 500)}
                helperText="Standard default: ETB 500.00 per share"
              />

              <TextInput
                label="Minimum Required Shares Per Member"
                type="number"
                min="1"
                step="1"
                value={editMinShares.toString()}
                onChange={(e) => setEditMinShares(parseInt(e.target.value) || 5)}
                helperText={`Equates to a minimum required capital of ${formatCurrency(editMinShares * editPrice)}`}
              />

              <TextInput
                label="Projected Annual Dividend Rate (%)"
                type="number"
                min="0"
                max="50"
                step="0.1"
                value={editDividendRate.toString()}
                onChange={(e) => setEditDividendRate(parseFloat(e.target.value) || 14.5)}
                helperText="Yield rate used for member return projections and AGM dividend allocations"
              />

              <TextInput
                label="Bylaw Amendment / Policy Change Justification"
                placeholder="e.g. AGM 2026 Resolution #4 on share valuation"
                value={editPriceReason}
                onChange={(e) => setEditPriceReason(e.target.value)}
              />

              <div className="flex justify-end pt-2">
                <Button variant="primary" size="sm" type="submit" disabled={isSubmittingSettings}>
                  {isSubmittingSettings ? 'Saving...' : 'Save Parameters'}
                </Button>
              </div>
            </form>
          </div>

          {/* Historical Price Log */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-amber-500" /> Share Price & Policy Audit Log
            </h3>
            <div className="overflow-y-auto max-h-80 divide-y divide-slate-100 text-xs">
              {settings?.priceHistory && settings.priceHistory.length > 0 ? (
                settings.priceHistory.map((h) => (
                  <div key={h.id} className="py-3 space-y-1">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>
                        ETB {h.previousPrice.toFixed(2)} → ETB {h.newPrice.toFixed(2)}
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">{formatDate(h.effectiveDate)}</span>
                    </div>
                    <p className="text-slate-600">{h.reason}</p>
                    <span className="text-[10px] text-slate-400 block font-mono">By: {h.changedByName}</span>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 py-4">No price adjustments recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 1: ISSUE SHARES */}
      {/* ========================================== */}
      {isIssueModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsIssueModalOpen(false)}
          title="Issue / Purchase Shares on Member's Behalf"
          size="md"
        >
          <form onSubmit={handleIssueShares} className="space-y-4 text-xs">
            <SelectInput
              label="Select Member"
              value={issueMemberId}
              onChange={(e) => setIssueMemberId(e.target.value)}
              options={membersList.map((m) => ({
                value: m.id,
                label: `${m.firstName} ${m.fatherName} (${m.membershipNo})`,
              }))}
            />

            <TextInput
              label="Number of Shares"
              type="number"
              min="1"
              step="1"
              value={issueSharesCount.toString()}
              onChange={(e) => setIssueSharesCount(parseInt(e.target.value) || 1)}
              helperText={`Total Value: ${formatCurrency(issueSharesCount * shareUnitPrice)}`}
            />

            <SelectInput
              label="Payment Channel"
              value={issuePaymentMethod}
              onChange={(e) => setIssuePaymentMethod(e.target.value as any)}
              options={[
                { value: 'CBE_BANK', label: 'Commercial Bank of Ethiopia (CBE)' },
                { value: 'TSEHAY_BANK', label: 'Tsehay Bank' },
                { value: 'CASH', label: 'Cash at Branch Counter' },
                { value: 'INTERNAL_TRANSFER', label: 'Internal SACCO Settlement' },
              ]}
            />

            <TextInput
              label="Bank Reference / Deposit Slip No"
              placeholder="e.g. CBE-FT-99120"
              value={issueBankRef}
              onChange={(e) => setIssueBankRef(e.target.value)}
            />

            <TextInput
              label="Narration / Note"
              placeholder="e.g. Member share capital subscription"
              value={issueNarration}
              onChange={(e) => setIssueNarration(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" type="button" onClick={() => setIsIssueModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isSubmittingIssue}>
                {isSubmittingIssue ? 'Issuing...' : `Post ${formatCurrency(issueSharesCount * shareUnitPrice)}`}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================== */}
      {/* MODAL 2: CONVERT SAVINGS */}
      {/* ========================================== */}
      {isConvertModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsConvertModalOpen(false)}
          title="Convert Voluntary Savings to Equity Shares"
          size="md"
        >
          <form onSubmit={handleConvertSavings} className="space-y-4 text-xs">
            <SelectInput
              label="Select Member"
              value={convertMemberId}
              onChange={(e) => setConvertMemberId(e.target.value)}
              options={membersList.map((m) => ({
                value: m.id,
                label: `${m.firstName} ${m.fatherName} (${m.membershipNo})`,
              }))}
            />

            <TextInput
              label="Conversion Amount in ETB"
              type="number"
              min={shareUnitPrice}
              step={shareUnitPrice}
              value={convertAmount.toString()}
              onChange={(e) => setConvertAmount(parseFloat(e.target.value) || 0)}
              helperText={`Yields ${Math.floor(convertAmount / shareUnitPrice)} whole share(s) @ ${formatCurrency(shareUnitPrice)} each`}
            />

            <div className="p-3 bg-slate-100 rounded-xl space-y-1">
              <div className="flex justify-between">
                <span>Shares Purchased:</span>
                <span className="font-bold text-emerald-600">{Math.floor(convertAmount / shareUnitPrice)} Shares</span>
              </div>
              <div className="flex justify-between">
                <span>Deducted Amount:</span>
                <span className="font-bold">{formatCurrency(Math.floor(convertAmount / shareUnitPrice) * shareUnitPrice)}</span>
              </div>
              {convertAmount % shareUnitPrice > 0 && (
                <div className="flex justify-between text-blue-700">
                  <span>Remainder Kept in Savings:</span>
                  <span className="font-bold">+{formatCurrency(convertAmount % shareUnitPrice)}</span>
                </div>
              )}
            </div>

            <TextInput
              label="Narration"
              placeholder="e.g. Voluntary savings converted to equity shares"
              value={convertNarration}
              onChange={(e) => setConvertNarration(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" type="button" onClick={() => setIsConvertModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isSubmittingConvert}>
                {isSubmittingConvert ? 'Processing...' : 'Execute Conversion'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================== */}
      {/* MODAL 3: REVERSE TRANSACTION */}
      {/* ========================================== */}
      {isReverseModalOpen && selectedTxForReverse && (
        <Modal
          isOpen={true}
          onClose={() => setIsReverseModalOpen(false)}
          title="Reverse Share Transaction"
          size="md"
        >
          <form onSubmit={handleReverseTransaction} className="space-y-4 text-xs">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" /> Caution: Financial Reversal
              </p>
              <p className="text-[11px] text-rose-800">
                Reversing transaction <span className="font-mono font-bold">{selectedTxForReverse.transactionNo}</span> will deduct {selectedTxForReverse.numberOfShares} shares ({formatCurrency(selectedTxForReverse.totalAmount)}) from {selectedTxForReverse.memberName}&apos;s share account and create contra GL journal entries.
              </p>
            </div>

            <TextInput
              label="Reversal Justification Reason (Required)"
              placeholder="e.g. Erroneous teller posting, invalid CBE reference"
              value={reverseReason}
              onChange={(e) => setReverseReason(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" type="button" onClick={() => setIsReverseModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" type="submit" disabled={isSubmittingReverse}>
                {isSubmittingReverse ? 'Reversing...' : 'Confirm Reversal'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================== */}
      {/* MODAL 4: ACCOUNT DETAIL MODAL */}
      {/* ========================================== */}
      {selectedAccountDetail && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedAccountDetail(null)}
          title={`Share Account Detail: ${selectedAccountDetail.account.accountNo}`}
          size="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Member Name</span>
                <p className="font-bold text-slate-900">{selectedAccountDetail.account.memberName}</p>
                <span className="text-[10px] text-slate-500 font-mono">{selectedAccountDetail.account.membershipNo}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Shares</span>
                <p className="text-base font-black text-slate-900">{selectedAccountDetail.account.numberOfShares} Shares</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Capital Value</span>
                <p className="text-base font-black text-emerald-600">{formatCurrency(selectedAccountDetail.account.totalShareValue)}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Certificate Number</span>
                <p className="font-mono font-bold text-blue-600">{selectedAccountDetail.account.certificateNumber || 'CERT-ACTIVE'}</p>
              </div>
            </div>

            {/* Account's Transactions */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900">Transaction History</h4>
              <div className="overflow-x-auto max-h-60 overflow-y-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold">
                      <th className="p-2">Date</th>
                      <th className="p-2">Txn No</th>
                      <th className="p-2">Type</th>
                      <th className="p-2 text-right">Shares</th>
                      <th className="p-2 text-right">Amount</th>
                      <th className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedAccountDetail.transactions?.map((t: any) => (
                      <tr key={t.id}>
                        <td className="p-2">{formatDate(t.timestamp || t.createdAt)}</td>
                        <td className="p-2 font-mono font-bold text-blue-600">{t.transactionNo}</td>
                        <td className="p-2">{t.type}</td>
                        <td className="p-2 text-right font-bold">+{t.numberOfShares}</td>
                        <td className="p-2 text-right font-bold text-emerald-600">{formatCurrency(t.totalAmount)}</td>
                        <td className="p-2 text-center">
                          <Badge variant={t.status === 'POSTED' ? 'success' : 'error'} size="sm">{t.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setSelectedAccountDetail(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
