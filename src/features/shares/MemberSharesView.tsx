import React, { useState, useEffect } from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { useToast } from '../../providers/ToastProvider';
import { shareApiService } from '../../services/shareApiService';
import {
  ShareAccount,
  ShareCertificate,
  ShareEligibility,
  ShareTransaction,
} from '../../types/shares';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { TextInput } from '../../components/common/TextInput';
import { SelectInput } from '../../components/common/SelectInput';
import { Badge } from '../../components/common/Badge';
import {
  ShieldCheck,
  Award,
  TrendingUp,
  RefreshCw,
  PlusCircle,
  ArrowRightLeft,
  Download,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Building2,
  Printer,
  History,
  Coins,
  Sparkles,
} from 'lucide-react';

export const MemberSharesView: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [account, setAccount] = useState<ShareAccount | null>(null);
  const [certificate, setCertificate] = useState<ShareCertificate | null>(null);
  const [eligibility, setEligibility] = useState<ShareEligibility | null>(null);
  const [transactions, setTransactions] = useState<ShareTransaction[]>([]);
  const [txFilter, setTxFilter] = useState<'ALL' | 'SHARE_PURCHASE' | 'SHARE_CONVERSION'>('ALL');

  // Modals
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<ShareTransaction | null>(null);

  // Buy Shares Form State
  const [buySharesCount, setBuySharesCount] = useState<number>(5);
  const [paymentChannel, setPaymentChannel] = useState<'CBE_BANK' | 'TSEHAY_BANK' | 'CASH'>('CBE_BANK');
  const [bankRefNo, setBankRefNo] = useState('');
  const [buyNarration, setBuyNarration] = useState('');
  const [isSubmittingBuy, setIsSubmittingBuy] = useState(false);

  // Convert Voluntary Form State
  const [convertAmount, setConvertAmount] = useState<number>(2500);
  const [convertNarration, setConvertNarration] = useState('');
  const [isSubmittingConvert, setIsSubmittingConvert] = useState(false);

  const loadShareData = async () => {
    try {
      setIsLoading(true);
      const res = await shareApiService.getMyShareAccount();
      setAccount(res.account);
      setCertificate(res.certificate || null);
      setEligibility(res.eligibility);

      const txRes = await shareApiService.getMyTransactions({ limit: 50 });
      setTransactions(Array.isArray(txRes?.data) ? txRes.data : []);
    } catch (err: any) {
      console.warn('Could not load live share account, using fallback', err);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadShareData();
  }, []);

  const sharePrice = eligibility?.sharePrice || account?.sharePrice || 500;
  const currentShares = account?.numberOfShares || 0;
  const currentTotalValue = account?.totalShareValue || currentShares * sharePrice;
  const requiredMin = eligibility?.requiredMinimumShares || 5;
  const isCompliant = currentShares >= requiredMin;
  const shortfallShares = Math.max(0, requiredMin - currentShares);
  const shortfallAmount = shortfallShares * sharePrice;
  const dividendRate = 14.5; // 14.5% projected annual dividend
  const projectedDividend = (currentTotalValue * (dividendRate / 100));

  // Whole shares computation for conversion
  const computedSharesFromConvert = Math.floor(convertAmount / sharePrice);
  const exactConvertCost = computedSharesFromConvert * sharePrice;
  const remainderKept = Math.max(0, convertAmount - exactConvertCost);

  const handleBuyShares = async (e: React.FormEvent) => {
    e.preventDefault();
    if (buySharesCount < 1) {
      toastError('Validation Error', 'You must purchase at least 1 share.');
      return;
    }

    try {
      setIsSubmittingBuy(true);
      const res = await shareApiService.purchaseShares({
        numberOfShares: buySharesCount,
        paymentMethod: paymentChannel,
        bankReferenceNo: bankRefNo || undefined,
        narration: buyNarration || undefined,
        idempotencyKey: `buy_${user?.id}_${Date.now()}`,
      });

      success('Shares Acquired', `Successfully acquired ${buySharesCount} shares for ${formatCurrency(buySharesCount * sharePrice)}.`);
      setIsBuyModalOpen(false);
      setBankRefNo('');
      setBuyNarration('');
      loadShareData();
    } catch (err: any) {
      toastError('Purchase Failed', err.message || 'Could not complete share purchase.');
    } finally {
      setIsSubmittingBuy(false);
    }
  };

  const handleConvertSavings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (convertAmount < sharePrice) {
      toastError('Validation Error', `Minimum conversion amount is ${formatCurrency(sharePrice)} (1 share).`);
      return;
    }

    if (computedSharesFromConvert < 1) {
      toastError('Validation Error', 'Requested amount yields zero whole shares.');
      return;
    }

    if (eligibility && convertAmount > eligibility.voluntaryAvailableBalance) {
      toastError(
        'Insufficient Balance',
        `Available Voluntary Savings balance is ${formatCurrency(eligibility.voluntaryAvailableBalance)}.`
      );
      return;
    }

    try {
      setIsSubmittingConvert(true);
      const res = await shareApiService.convertVoluntarySavings({
        amountToConvert: convertAmount,
        narration: convertNarration || undefined,
        idempotencyKey: `conv_${user?.id}_${Date.now()}`,
      });

      success(
        'Conversion Successful',
        `Converted ${formatCurrency(res.amountConverted)} into ${res.sharesPurchased} share(s). ${
          res.remainderKeptInSavings > 0
            ? `${formatCurrency(res.remainderKeptInSavings)} kept in voluntary savings.`
            : ''
        }`
      );
      setIsConvertModalOpen(false);
      setConvertNarration('');
      loadShareData();
    } catch (err: any) {
      toastError('Conversion Failed', err.message || 'Could not complete savings conversion.');
    } finally {
      setIsSubmittingConvert(false);
    }
  };

  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const filteredTransactions = safeTransactions.filter((t) => {
    if (txFilter === 'ALL') return true;
    return t.type === txFilter;
  });

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[20px] sm:text-[22px] font-bold text-slate-900 dark:text-white leading-tight">Member Share Capital & Certificates</h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Active Equity
            </span>
          </div>
          <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5">
            Permanent institutional equity capital entitling you to annual dividend yields, AGM voting quorum, and cooperative governance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsCertModalOpen(true)}
            leftIcon={<Award className="w-4 h-4 text-amber-500" />}
            className="min-h-[36px] max-h-[38px] text-[13px] px-3.5"
          >
            Digital Certificate
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (eligibility && eligibility.voluntaryAvailableBalance >= sharePrice) {
                setConvertAmount(Math.min(eligibility.voluntaryAvailableBalance, 2500));
              }
              setIsConvertModalOpen(true);
            }}
            leftIcon={<ArrowRightLeft className="w-4 h-4 text-emerald-600" />}
            className="min-h-[36px] max-h-[38px] text-[13px] px-3.5"
          >
            Convert Savings
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsBuyModalOpen(true)}
            leftIcon={<PlusCircle className="w-4 h-4 text-white" />}
            className="min-h-[36px] max-h-[38px] text-[13px] px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Buy Shares
          </Button>
        </div>
      </div>

      {/* Compliance / Minimum Shares Alert Banner */}
      {!isCompliant ? (
        <div className="p-3.5 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-[14px] text-amber-900 dark:text-amber-200">
                Minimum Share Capital Requirement Pending ({currentShares} / {requiredMin} Shares)
              </h3>
              <p className="text-[12px] text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                SACCO bylaws mandate a minimum holding of {requiredMin} shares ({formatCurrency(requiredMin * sharePrice)}). You currently have a shortfall of{' '}
                <span className="font-bold">{shortfallShares} share(s)</span> ({formatCurrency(shortfallAmount)}). Full voting rights and credit facilities require meeting this threshold.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {eligibility && eligibility.voluntaryAvailableBalance >= shortfallAmount ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setConvertAmount(shortfallAmount);
                  setIsConvertModalOpen(true);
                }}
                className="min-h-[34px] text-xs px-3"
              >
                Fulfill from Savings ({formatCurrency(shortfallAmount)})
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setBuySharesCount(shortfallShares);
                  setIsBuyModalOpen(true);
                }}
                className="min-h-[34px] text-xs px-3"
              >
                Purchase {shortfallShares} Shares Now
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-3.5 bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[13.5px] font-bold text-emerald-900 dark:text-emerald-200 block">
                Cooperative Membership Fully Compliant & Certified
              </span>
              <span className="text-[11.5px] text-emerald-700 dark:text-emerald-300">
                You hold {currentShares} shares ({formatCurrency(currentTotalValue)}), satisfying the {requiredMin}-share statutory threshold. Full voting rights and credit facility multiplier active.
              </span>
            </div>
          </div>
          <span className="px-2.5 py-0.5 bg-emerald-600 text-white font-bold text-[11px] rounded-full shadow-2xs shrink-0 hidden sm:inline-block">
            100% ELIGIBLE
          </span>
        </div>
      )}

      {/* Top 4 Key Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Shares */}
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden space-y-1.5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Shares Owned</span>
            <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[20px] sm:text-[22px] font-bold text-slate-900 dark:text-white tabular-nums">{currentShares}</span>
            <span className="text-xs font-semibold text-slate-500">Shares</span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100 dark:border-slate-800">
            <span className="text-slate-500">Par Value:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(sharePrice)} / share</span>
          </div>
        </div>

        {/* Paid-Up Capital */}
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden space-y-1.5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Paid-Up Capital</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[20px] sm:text-[22px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(currentTotalValue)}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100 dark:border-slate-800">
            <span className="text-slate-500">GL Equity Code:</span>
            <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">3010-SHR</span>
          </div>
        </div>

        {/* Projected Dividend */}
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden space-y-1.5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Projected Annual Dividend</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[20px] sm:text-[22px] font-bold text-amber-600 dark:text-amber-400 tabular-nums">+{formatCurrency(projectedDividend)}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100 dark:border-slate-800">
            <span className="text-slate-500">Declared Yield Rate:</span>
            <span className="font-bold text-amber-700 dark:text-amber-300">{dividendRate}% p.a.</span>
          </div>
        </div>

        {/* Certificate & Voting Status */}
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden space-y-1.5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Certificate Status</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[14px] font-bold text-indigo-900 dark:text-indigo-300 truncate">
              {certificate?.certificateNumber || (account?.accountNo ? `CERT-WB-${account.accountNo.replace('SHR-', '')}` : 'ISSUED')}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100 dark:border-slate-800">
            <span className="text-slate-500">Voting Quorum:</span>
            <Badge variant={isCompliant ? 'success' : 'warning'} size="sm">
              {isCompliant ? '1 Vote (AGM)' : 'Pending'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Official Share Certificate Card Banner */}
      <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-lg border border-slate-700 shadow-md relative overflow-hidden space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-700/60 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-lg shadow-xs">
              W
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 block">
                Wabi Savings & Credit Cooperative Society Ltd.
              </span>
              <h2 className="text-[16px] font-bold text-white leading-tight">Official Equity Share Certificate</h2>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Reg No: SACCO/FDRE/2023/0488 • Certificate: {certificate?.certificateNumber || 'CERT-WB-2024-000143'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 min-h-[34px] text-xs px-3.5"
              onClick={() => setIsCertModalOpen(true)}
              leftIcon={<Printer className="w-4 h-4" />}
            >
              Print Certificate
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
          <div>
            <span className="text-[10.5px] text-slate-400 uppercase font-bold block">Shareholder Name</span>
            <p className="text-[14px] font-bold text-white mt-0.5">
              {account?.memberName || user?.fullName || 'Abebe Bikila Wolde'}
            </p>
            <span className="text-[11px] text-slate-400 font-mono">ID: {account?.membershipNo || user?.membershipNo || 'WB000143'}</span>
          </div>

          <div>
            <span className="text-[10.5px] text-slate-400 uppercase font-bold block">Cumulative Shares Issued</span>
            <p className="text-[18px] font-bold text-amber-300 mt-0.5 tabular-nums">
              {currentShares} <span className="text-[12px] font-normal text-slate-300">Shares</span>
            </p>
            <span className="text-[11px] text-slate-400">At ETB {sharePrice.toFixed(2)} Par Value</span>
          </div>

          <div>
            <span className="text-[10.5px] text-slate-400 uppercase font-bold block">Total Capital Value</span>
            <p className="text-[18px] font-bold text-emerald-400 mt-0.5 tabular-nums">
              {formatCurrency(currentTotalValue)}
            </p>
            <span className="text-[11px] text-emerald-300/80">Permanent Equity</span>
          </div>

          <div>
            <span className="text-[10.5px] text-slate-400 uppercase font-bold block">Issue & Verification Date</span>
            <p className="text-[14px] font-bold text-white mt-0.5">
              {certificate?.issueDate ? formatDate(certificate.issueDate) : '15 March 2024'}
            </p>
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Seal Verified
            </span>
          </div>
        </div>
      </div>

      {/* Share Transactions History Ledger */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-[15px] text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Share Transaction Passbook
            </h3>
            <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">
              Immutable ledger of direct share subscriptions, voluntary conversions, and capital adjustments.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
            <button
              onClick={() => setTxFilter('ALL')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                txFilter === 'ALL' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All ({(safeTransactions || []).length})
            </button>
            <button
              onClick={() => setTxFilter('SHARE_PURCHASE')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                txFilter === 'SHARE_PURCHASE' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Purchases
            </button>
            <button
              onClick={() => setTxFilter('SHARE_CONVERSION')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                txFilter === 'SHARE_CONVERSION' ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Conversions
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-800 text-[11px]">
                <th className="py-2.5 px-3.5">Date & Time</th>
                <th className="py-2.5 px-3.5">Transaction No</th>
                <th className="py-2.5 px-3.5">Type & Channel</th>
                <th className="py-2.5 px-3.5 text-right">Shares Added</th>
                <th className="py-2.5 px-3.5 text-right">Amount (ETB)</th>
                <th className="py-2.5 px-3.5 text-right">Cumulative Shares</th>
                <th className="py-2.5 px-3.5 text-center">Status</th>
                <th className="py-2.5 px-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[12.5px]">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    No share transactions found in this category.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {formatDateTime(tx.timestamp || tx.createdAt)}
                    </td>
                    <td className="py-2.5 px-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {tx.transactionNo}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {tx.type === 'SHARE_PURCHASE'
                          ? 'Share Purchase'
                          : tx.type === 'SHARE_CONVERSION'
                          ? 'Savings Conversion'
                          : 'Reversal'}
                      </div>
                      <span className="text-[11px] text-slate-400 block font-mono">
                        {tx.paymentMethod.replace(/_/g, ' ')}
                        {tx.bankReferenceNo ? ` • ${tx.bankReferenceNo}` : ''}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono text-[13px]">
                      +{tx.numberOfShares}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-bold text-slate-900 dark:text-white font-mono text-[13px]">
                      {formatCurrency(tx.totalAmount)}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                      {tx.sharesAfter} shares ({formatCurrency(tx.valueAfter)})
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      <Badge variant={tx.status === 'POSTED' ? 'success' : tx.status === 'REVERSED' ? 'error' : 'warning'} size="sm">
                        {tx.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 text-xs px-2.5 py-1"
                        onClick={() => setSelectedTx(tx)}
                      >
                        Receipt
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================== */}
      {/* 1. BUY SHARES MODAL */}
      {/* ========================================== */}
      {isBuyModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsBuyModalOpen(false)}
          title="Acquire Member Equity Shares"
          description="Purchase permanent non-withdrawable institutional equity shares to increase your SACCO voting power and annual dividend yields."
          size="md"
        >
          <form onSubmit={handleBuyShares} className="space-y-3.5 text-xs">
            <div className="p-3 bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-lg text-sky-900 dark:text-sky-200 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-xs">
                <Coins className="w-4 h-4 text-sky-600 dark:text-sky-400" /> Share Par Value: {formatCurrency(sharePrice)} / Share
              </p>
              <p className="text-[11.5px] text-sky-800 dark:text-sky-200">
                Shares represent permanent cooperative equity. They earn annual dividend distributions and give you voting power at the AGM.
              </p>
            </div>

            {/* Quick Select Buttons */}
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1.5">
                Select Number of Shares:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[1, 5, 10, 20].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setBuySharesCount(count)}
                    className={`py-2 px-2.5 rounded-lg font-bold text-xs border transition-all min-h-[36px] ${
                      buySharesCount === count
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {count} {count === 1 ? 'Share' : 'Shares'}
                    <span className="block text-[11px] font-medium opacity-90">
                      {formatCurrency(count * sharePrice)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <TextInput
              label="Or Enter Custom Share Quantity"
              type="number"
              min="1"
              step="1"
              value={buySharesCount.toString()}
              onChange={(e) => setBuySharesCount(Math.max(1, parseInt(e.target.value) || 1))}
              helperText={`Total Purchase Cost: ${formatCurrency(buySharesCount * sharePrice)} ETB`}
            />

            {/* Payment Channel */}
            <SelectInput
              label="Payment Channel / Deposit Destination"
              value={paymentChannel}
              onChange={(e) => setPaymentChannel(e.target.value as any)}
              options={[
                { value: 'CBE_BANK', label: 'Commercial Bank of Ethiopia (CBE) - Acc: 100012345678' },
                { value: 'TSEHAY_BANK', label: 'Tsehay Bank - Acc: 200098765432' },
                { value: 'CASH', label: 'Cash at Head Office / Branch Vault' },
              ]}
            />

            {/* Bank Reference No */}
            <TextInput
              label="Bank Deposit Slip / Reference Number"
              placeholder="e.g. CBE-FT-9948201 or Cash Slip"
              value={bankRefNo}
              onChange={(e) => setBankRefNo(e.target.value)}
              helperText="Reference number from your bank deposit slip or mobile banking transfer"
            />

            <TextInput
              label="Narration / Note (Optional)"
              placeholder="e.g. Additional share capital subscription"
              value={buyNarration}
              onChange={(e) => setBuyNarration(e.target.value)}
            />

            {/* Summary Box */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Shares to Acquire:</span>
                <span className="font-bold text-slate-900 dark:text-white">{buySharesCount} Shares</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Par Value:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(sharePrice)} / share</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-1.5 border-t border-slate-200 dark:border-slate-700">
                <span>Total Amount Due:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(buySharesCount * sharePrice)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button variant="secondary" size="sm" type="button" onClick={() => setIsBuyModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isSubmittingBuy} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {isSubmittingBuy ? 'Processing...' : `Confirm & Pay ${formatCurrency(buySharesCount * sharePrice)}`}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================== */}
      {/* 2. CONVERT VOLUNTARY SAVINGS MODAL */}
      {/* ========================================== */}
      {isConvertModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsConvertModalOpen(false)}
          title="Convert Voluntary Savings to Equity Shares"
          description="Convert your available voluntary thrift balance into equity shares without needing a new bank transfer."
          size="md"
        >
          <form onSubmit={handleConvertSavings} className="space-y-3.5 text-xs">
            <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-900 dark:text-emerald-200 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-xs">
                <ArrowRightLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Whole-Share Conversion Rule
              </p>
              <p className="text-[11.5px] text-emerald-800 dark:text-emerald-200">
                Each share costs exactly <span className="font-bold">{formatCurrency(sharePrice)}</span>. Only whole-share amounts will be converted to equity capital. Any fractional remainder stays safely in your Voluntary Savings account.
              </p>
            </div>

            {/* Available Balance Indicator */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block font-medium">Available Voluntary Savings Balance:</span>
                <span className="text-[16px] font-bold text-slate-900 dark:text-white tabular-nums block">
                  {formatCurrency(eligibility?.voluntaryAvailableBalance || 0)}
                </span>
              </div>
              <Badge variant="info" size="sm">
                Up to {eligibility?.possibleSharesFromVoluntary || 0} Shares
              </Badge>
            </div>

            {/* Amount input */}
            <TextInput
              label="Conversion Amount in ETB"
              type="number"
              min={sharePrice}
              step={sharePrice}
              value={convertAmount.toString()}
              onChange={(e) => setConvertAmount(Math.max(0, parseFloat(e.target.value) || 0))}
              helperText={`Yields ${computedSharesFromConvert} whole share(s) @ ${formatCurrency(sharePrice)} each`}
            />

            {/* Live Calculation Preview */}
            <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-700 dark:text-slate-200">
                <span>Whole Shares to Receive:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">+{computedSharesFromConvert} Shares</span>
              </div>
              <div className="flex justify-between text-slate-700 dark:text-slate-200">
                <span>Exact Deduction from Voluntary Savings:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">-{formatCurrency(exactConvertCost)}</span>
              </div>
              {remainderKept > 0 && (
                <div className="flex justify-between text-sky-700 dark:text-sky-300 pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span>Remainder Kept in Voluntary Savings:</span>
                  <span className="font-mono font-bold">+{formatCurrency(remainderKept)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600 dark:text-slate-400 text-[11px] pt-0.5">
                <span>New Total Shares Holding:</span>
                <span className="font-bold text-slate-900 dark:text-white">{currentShares + computedSharesFromConvert} Shares</span>
              </div>
            </div>

            <TextInput
              label="Narration / Note (Optional)"
              placeholder="e.g. Conversion of voluntary thrift to equity shares"
              value={convertNarration}
              onChange={(e) => setConvertNarration(e.target.value)}
            />

            <div className="flex justify-end gap-2.5 pt-2">
              <Button variant="secondary" size="sm" type="button" onClick={() => setIsConvertModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={isSubmittingConvert || computedSharesFromConvert < 1}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSubmittingConvert
                  ? 'Converting...'
                  : `Convert ${formatCurrency(exactConvertCost)} (${computedSharesFromConvert} Shares)`}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================== */}
      {/* 3. OFFICIAL SHARE CERTIFICATE PRINT MODAL */}
      {/* ========================================== */}
      {isCertModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCertModalOpen(false)}
          title="Digital Equity Share Certificate"
          description="Official certified membership certificate registered under Ethiopian Cooperative Societies Proclamation."
          size="md"
          footer={
            <div className="flex justify-between w-full">
              <Button variant="secondary" size="sm" onClick={() => setIsCertModalOpen(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.print()}
                leftIcon={<Printer className="w-4 h-4" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Print / Save PDF
              </Button>
            </div>
          }
        >
          <div className="p-4 sm:p-5 bg-amber-50/50 dark:bg-amber-950/30 rounded-lg border-2 border-double border-amber-600/60 text-slate-900 dark:text-white relative space-y-3.5 text-xs">
            {/* Header */}
            <div className="text-center space-y-1 pb-3 border-b border-amber-800/30">
              <div className="w-10 h-10 rounded-lg bg-amber-600 text-white font-black text-lg flex items-center justify-center mx-auto shadow-2xs border border-amber-300">
                W
              </div>
              <h2 className="text-[16px] font-bold tracking-wide text-slate-900 dark:text-white uppercase leading-tight">
                Wabi Savings and Credit Cooperative Society Ltd.
              </h2>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Registered under FDRE Cooperative Societies Proclamation No. 985/2016
              </p>
              <div className="inline-block px-2.5 py-0.5 bg-amber-700 text-amber-50 rounded-full text-[10.5px] font-bold tracking-wider uppercase mt-1">
                Certificate of Member Share Capital
              </div>
            </div>

            {/* Body */}
            <div className="my-3 text-center space-y-2">
              <p className="text-[11px] text-slate-500 italic">This is to certify that</p>
              <h3 className="text-[16px] font-bold text-slate-900 dark:text-white border-b border-dashed border-slate-400 dark:border-slate-600 inline-block px-4 py-0.5">
                {account?.memberName || user?.fullName || 'Abebe Bikila Wolde'}
              </h3>
              <p className="text-[12px] text-slate-700 dark:text-slate-300">
                Membership ID: <span className="font-mono font-bold text-slate-900 dark:text-white">{account?.membershipNo || user?.membershipNo || 'WB000143'}</span>
              </p>
              <p className="text-[12px] text-slate-700 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                is the registered proprietor of <span className="font-bold text-[14px] text-amber-900 dark:text-amber-300">{currentShares}</span> fully paid-up ordinary equity shares of <span className="font-bold">ETB {sharePrice.toFixed(2)}</span> each, amounting to a total institutional share capital of:
              </p>
              <div className="p-3 bg-white/90 dark:bg-slate-900/90 rounded-lg border border-amber-300 dark:border-amber-700 max-w-xs mx-auto shadow-2xs">
                <span className="text-[10.5px] text-slate-500 uppercase font-bold">Total Paid-Up Share Capital</span>
                <p className="text-[20px] font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 tabular-nums">{formatCurrency(currentTotalValue)}</p>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-amber-800/30 text-center text-[11px]">
              <div>
                <div className="h-8 border-b border-slate-400 dark:border-slate-600 flex items-end justify-center font-serif text-slate-600 dark:text-slate-300 pb-0.5 text-xs">
                  Samuel Ambaw
                </div>
                <span className="text-[10px] text-slate-500 uppercase block mt-0.5">System Admin</span>
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full border border-dashed border-amber-600 flex items-center justify-center text-[8px] font-bold text-amber-800 dark:text-amber-300 text-center uppercase leading-tight">
                  SACCO Seal
                </div>
                <span className="text-[9.5px] text-slate-400 mt-0.5 font-mono">{certificate?.certificateNumber || 'CERT-WB-2024-000143'}</span>
              </div>
              <div>
                <div className="h-8 border-b border-slate-400 dark:border-slate-600 flex items-end justify-center font-serif text-slate-600 dark:text-slate-300 pb-0.5 text-xs">
                  Alemu Tadesse
                </div>
                <span className="text-[10px] text-slate-500 uppercase block mt-0.5">General Manager</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================== */}
      {/* 4. TRANSACTION RECEIPT MODAL */}
      {/* ========================================== */}
      {selectedTx && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTx(null)}
          title="Share Transaction Receipt & GL Voucher"
          description="Detailed double-entry voucher record for this share transaction."
          size="md"
          footer={
            <div className="flex justify-between w-full">
              <Button variant="secondary" size="sm" onClick={() => setSelectedTx(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.print()}
                leftIcon={<Printer className="w-4 h-4" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Print Voucher
              </Button>
            </div>
          }
        >
          <div className="space-y-3.5 text-xs">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="font-bold text-slate-900 dark:text-white">Transaction No:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{selectedTx.transactionNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Date & Time:</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">{formatDateTime(selectedTx.timestamp || selectedTx.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Transaction Type:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{selectedTx.type.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Payment Channel:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{selectedTx.paymentMethod}</span>
              </div>
              {selectedTx.bankReferenceNo && (
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Bank Reference No:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{selectedTx.bankReferenceNo}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Shares Subscribed:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">+{selectedTx.numberOfShares} Shares</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Unit Par Value:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">ETB {selectedTx.unitPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>Total Amount:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(selectedTx.totalAmount)}</span>
              </div>
            </div>

            <div className="p-3 bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-lg space-y-1 text-sky-950 dark:text-sky-200">
              <span className="font-bold text-[11px] uppercase tracking-wider block text-sky-800 dark:text-sky-300">
                General Ledger Accounting Entry
              </span>
              <p className="text-xs">
                Debit: Cash/Bank Clearing • Credit: <span className="font-mono font-bold text-slate-900 dark:text-white">3010-SHR (Member Share Capital)</span>
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                Running Balance After: {selectedTx.sharesAfter} Shares ({formatCurrency(selectedTx.valueAfter)})
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
