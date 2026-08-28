import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  User,
  ShieldCheck,
  FileText,
  DollarSign,
  TrendingUp,
  Percent,
  Sliders,
  Award,
  AlertCircle,
  Printer,
  ChevronRight,
  Calculator,
  Building2,
} from 'lucide-react';
import {
  loanApiService,
  Loan,
  LoanProduct,
  LoanScheduleItem,
  LoanRepayment,
  LoanEligibilityReport,
  AmortizationCalculationResult,
} from '../../services/loanApiService';
import { useAuth } from '../../providers/AuthProvider';
import { useToast } from '../../providers/ToastProvider';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const MemberLoanPortal: React.FC = () => {
  const { user } = useAuth();
  const { success, error, info } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'apply' | 'calculator' | 'guarantees' | 'history'>('overview');
  const [isLoading, setIsLoading] = useState(false);

  // Member Loan Data
  const [activeLoanData, setActiveLoanData] = useState<{ loan: Loan; schedule: LoanScheduleItem[]; repayments: LoanRepayment[] } | null>(null);
  const [myApplications, setMyApplications] = useState<Loan[]>([]);
  const [guarantorRequests, setGuarantorRequests] = useState<Array<{ loan: any; guarantorRecord: any }>>([]);
  const [eligibility, setEligibility] = useState<LoanEligibilityReport | null>(null);
  const [products, setProducts] = useState<LoanProduct[]>([]);

  // Repayment Modal
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [repayAmount, setRepayAmount] = useState<number>(0);
  const [repayChannel, setRepayChannel] = useState<string>('INTERNAL_TRANSFER');
  const [repayBankRef, setRepayBankRef] = useState('');

  // Loan Application Form state
  const [appProductId, setAppProductId] = useState('');
  const [appAmount, setAppAmount] = useState<number>(50000);
  const [appTerm, setAppTerm] = useState<number>(12);
  const [appPurpose, setAppPurpose] = useState('');
  const [appMonthlyIncome, setAppMonthlyIncome] = useState<number>(30000);
  const [appEmployer, setAppEmployer] = useState('');
  const [appGuarantor1, setAppGuarantor1] = useState('');
  const [appGuarantor1Amt, setAppGuarantor1Amt] = useState<number>(25000);
  const [appGuarantor2, setAppGuarantor2] = useState('');
  const [appGuarantor2Amt, setAppGuarantor2Amt] = useState<number>(25000);

  // Interactive Calculator state
  const [calcAmount, setCalcAmount] = useState<number>(100000);
  const [calcTerm, setCalcTerm] = useState<number>(24);
  const [calcRate, setCalcRate] = useState<number>(14.0);
  const [calcGrace, setCalcGrace] = useState<number>(0);
  const [calcResult, setCalcResult] = useState<AmortizationCalculationResult | null>(null);

  // Statement modal
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);

  const fetchMemberLoanData = async () => {
    setIsLoading(true);
    try {
      const [activeData, myApps, gReqs, elig, prods] = await Promise.all([
        loanApiService.getMyActiveLoan(),
        loanApiService.getMyApplications(),
        loanApiService.getMyGuarantorRequests(),
        loanApiService.checkMyEligibility(),
        loanApiService.getProducts(),
      ]);

      setActiveLoanData(activeData || null);
      setMyApplications(Array.isArray(myApps) ? myApps : []);
      setGuarantorRequests(Array.isArray(gReqs) ? gReqs : []);
      setEligibility(elig || null);
      const safeProds = Array.isArray(prods) ? prods : [];
      setProducts(safeProds);

      if (safeProds.length > 0 && !appProductId) {
        setAppProductId(safeProds[0].id);
      }

      // Run initial calculator preview
      const initialCalc = await loanApiService.calculateAmortization({
        principal: 100000,
        interestRate: 14.0,
        termMonths: 24,
        gracePeriodMonths: 0,
      });
      setCalcResult(initialCalc);
    } catch (err: any) {
      console.error('Error loading member loan portal:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberLoanData();
  }, []);

  const handleRunCalculator = async (amount: number, rate: number, term: number, grace: number) => {
    try {
      const res = await loanApiService.calculateAmortization({
        principal: amount,
        interestRate: rate,
        termMonths: term,
        gracePeriodMonths: grace,
      });
      setCalcResult(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGuarantorDecision = async (loanId: string, accept: boolean) => {
    try {
      await loanApiService.respondGuarantor(loanId, accept);
      success(
        accept ? 'Guarantee Accepted' : 'Guarantee Declined',
        accept ? 'You have formally accepted to guarantee this loan request.' : 'Guarantee request declined.'
      );
      fetchMemberLoanData();
    } catch (err: any) {
      error('Action Failed', err.message);
    }
  };

  const handleSubmitApplication = async () => {
    if (!appProductId || appAmount <= 0 || appTerm <= 0 || !appPurpose) {
      error('Validation Error', 'Please complete all required fields.');
      return;
    }

    const selectedProd = products.find((p) => p.id === appProductId);
    const guarantors = [];
    if (selectedProd?.requiresGuarantor) {
      if (appGuarantor1) {
        guarantors.push({ guarantorMemberId: appGuarantor1, guaranteedAmount: appGuarantor1Amt });
      }
      if (appGuarantor2) {
        guarantors.push({ guarantorMemberId: appGuarantor2, guaranteedAmount: appGuarantor2Amt });
      }
    }

    try {
      await loanApiService.apply({
        memberId: eligibility?.memberId || '',
        productId: appProductId,
        requestedAmount: appAmount,
        requestedTermMonths: appTerm,
        purpose: appPurpose,
        incomeDetails: {
          monthlyIncome: appMonthlyIncome,
          employerOrBusiness: appEmployer || 'Member Self-Employment',
          netDisposableIncome: appMonthlyIncome * 0.65,
        },
        guarantors,
      });

      success('Application Submitted', 'Your loan application has been registered for guarantor confirmation and credit review.');
      setActiveTab('overview');
      fetchMemberLoanData();
    } catch (err: any) {
      error('Submission Failed', err.message);
    }
  };

  const handleSubmitRepayment = async () => {
    if (!activeLoanData || repayAmount <= 0) {
      error('Validation Error', 'Please enter a valid repayment amount.');
      return;
    }

    try {
      await loanApiService.recordRepayment({
        loanId: activeLoanData.loan.id,
        amount: repayAmount,
        paymentChannel: repayChannel,
        bankReferenceNo: repayBankRef,
        narration: `Member self-service loan installment repayment for ${activeLoanData.loan.loanNo}`,
      });

      success('Payment Processed', `Payment of ${formatCurrency(repayAmount)} recorded. Passbook updated.`);
      setIsRepayModalOpen(false);
      fetchMemberLoanData();
    } catch (err: any) {
      error('Payment Failed', err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-5 rounded-xl shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 text-[11px] font-bold rounded-full border border-blue-400/30">
              Wabi Credit Facility Portal
            </span>
            {eligibility?.isEligible && (
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[11px] font-bold rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Credit Eligible ({formatCurrency(eligibility.maxBorrowableAmount)})
              </span>
            )}
          </div>
          <h1 className="text-[24px] sm:text-[32px] font-bold tracking-tight leading-tight">Member Loan & Credit Hub</h1>
          <p className="text-[15px] text-slate-300 max-w-2xl">
            Check borrowing limits, simulate repayment schedules, submit applications, manage active loans, and respond to peer guarantee requests.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {activeLoanData?.loan ? (
            <button
              onClick={() => {
                setRepayAmount(activeLoanData.loan.nextInstallmentAmount || activeLoanData.loan.monthlyInstallmentAmount || 2000);
                setIsRepayModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[13px] font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 h-[38px] transition cursor-pointer"
            >
              <ArrowDownLeft className="w-4 h-4" /> Pay Installment
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('apply')}
              className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-[13px] font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 h-[38px] transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Apply for Loan
            </button>
          )}
          <button
            onClick={() => setActiveTab('calculator')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 text-[13px] font-semibold rounded-lg flex items-center gap-1.5 h-[38px] transition cursor-pointer"
          >
            <Calculator className="w-4 h-4" /> Loan Simulator
          </button>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-1.5 text-[13px] font-semibold rounded-lg h-[36px] transition cursor-pointer ${
            activeTab === 'overview' ? 'bg-slate-900 dark:bg-[#16A34A] text-white shadow-2xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Active Loan & Overview
        </button>
        <button
          onClick={() => setActiveTab('apply')}
          className={`px-3.5 py-1.5 text-[13px] font-semibold rounded-lg h-[36px] transition cursor-pointer ${
            activeTab === 'apply' ? 'bg-slate-900 dark:bg-[#16A34A] text-white shadow-2xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          New Application
        </button>
        <button
          onClick={() => setActiveTab('calculator')}
          className={`px-3.5 py-1.5 text-[13px] font-semibold rounded-lg h-[36px] transition cursor-pointer ${
            activeTab === 'calculator' ? 'bg-slate-900 dark:bg-[#16A34A] text-white shadow-2xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Loan Calculator
        </button>
        <button
          onClick={() => setActiveTab('guarantees')}
          className={`px-3.5 py-1.5 text-[13px] font-semibold rounded-lg h-[36px] transition relative cursor-pointer ${
            activeTab === 'guarantees' ? 'bg-slate-900 dark:bg-[#16A34A] text-white shadow-2xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Guarantor Requests
          {(guarantorRequests || []).filter((r) => r.guarantorRecord?.status === 'PENDING').length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.2 text-[11px] bg-rose-500 text-white rounded-full font-bold">
              {(guarantorRequests || []).filter((r) => r.guarantorRecord?.status === 'PENDING').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-3.5 py-1.5 text-[13px] font-semibold rounded-lg h-[36px] transition cursor-pointer ${
            activeTab === 'history' ? 'bg-slate-900 dark:bg-[#16A34A] text-white shadow-2xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Application History
        </button>
      </div>

      {/* 3. TAB CONTENTS */}

      {/* TAB: OVERVIEW / ACTIVE LOAN */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Eligibility Card */}
          {eligibility && (
            <div className={`p-8 rounded-2xl border ${eligibility.isEligible ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'} space-y-6`}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className={`w-7 h-7 ${eligibility.isEligible ? 'text-blue-600 dark:text-sky-400' : 'text-amber-600 dark:text-amber-400'}`} />
                  <h3 className="font-bold text-slate-900 dark:text-white text-[22px]">
                    {eligibility.isEligible ? 'Cooperative Borrowing Eligibility Approved' : 'Borrowing Eligibility Notice'}
                  </h3>
                </div>
                <span className="text-[16px] font-bold text-blue-800 dark:text-sky-300 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-xs border border-blue-200 dark:border-blue-800">
                  Multiplier Limit: {formatCurrency(eligibility.maxBorrowableAmount)} (4.0× Compulsory Savings)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-[16px]">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
                  <span className="text-slate-400 uppercase font-bold text-[13px]">Compulsory Savings</span>
                  <p className="font-bold text-slate-900 dark:text-white text-[22px] tabular-nums">{formatCurrency(eligibility.regularSavingsBalance)}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
                  <span className="text-slate-400 uppercase font-bold text-[13px]">Continuous Savings</span>
                  <p className="font-bold text-slate-900 dark:text-white text-[22px]">{eligibility.continuousSavingsMonths} Months Verified ✓</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
                  <span className="text-slate-400 uppercase font-bold text-[13px]">Share Capital Holding</span>
                  <p className="font-bold text-slate-900 dark:text-white text-[22px] tabular-nums">{eligibility.shareCount} Shares ({formatCurrency(eligibility.shareValue)})</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
                  <span className="text-slate-400 uppercase font-bold text-[13px]">Active Guarantees</span>
                  <p className="font-bold text-slate-900 dark:text-white text-[22px]">{eligibility.activeGuaranteesCount} / 3 Max Permitted</p>
                </div>
              </div>
            </div>
          )}

          {/* Active Loan Display */}
          {activeLoanData?.loan ? (
            <div className="space-y-8">
              {/* Active Loan Top Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-blue-700 dark:text-sky-400 text-[20px]">{activeLoanData.loan.loanNo}</span>
                      <span className="px-3 py-1 rounded-full text-[14px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-sky-300 border border-blue-200 dark:border-blue-800">
                        {activeLoanData.loan.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-[24px] mt-1">{activeLoanData.loan.productName}</h3>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      onClick={() => setIsStatementModalOpen(true)}
                      className="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[16px] font-bold rounded-xl flex items-center gap-2 min-h-[48px] transition"
                    >
                      <Printer className="w-5 h-5" /> Loan Statement
                    </button>
                    <button
                      onClick={() => {
                        setRepayAmount(activeLoanData.loan.nextInstallmentAmount || activeLoanData.loan.monthlyInstallmentAmount || 2000);
                        setIsRepayModalOpen(true);
                      }}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-[16px] font-bold rounded-xl shadow-xs flex items-center gap-2 min-h-[48px] transition"
                    >
                      <ArrowDownLeft className="w-5 h-5" /> Pay Now
                    </button>
                  </div>
                </div>

                {/* Metric Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <span className="text-slate-400 text-[14px] font-semibold">Total Outstanding Balance</span>
                    <p className="text-[34px] font-bold text-rose-600 dark:text-rose-400 mt-1 tabular-nums">{formatCurrency(activeLoanData.loan.totalOutstanding)}</p>
                    <span className="text-[14px] text-slate-500">Principal: {formatCurrency(activeLoanData.loan.outstandingPrincipal)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[14px] font-semibold">Next Installment Due</span>
                    <p className="text-[34px] font-bold text-slate-900 dark:text-white mt-1">
                      {activeLoanData.loan.nextInstallmentDate ? formatDate(activeLoanData.loan.nextInstallmentDate) : '—'}
                    </p>
                    <span className="text-[14px] text-emerald-700 dark:text-emerald-400 font-bold font-mono">
                      Amount: {formatCurrency(activeLoanData.loan.nextInstallmentAmount || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[14px] font-semibold">Repayment Progress</span>
                    <p className="text-[34px] font-bold text-slate-900 dark:text-white mt-1">
                      {activeLoanData.loan.paidInstallmentsCount} / {activeLoanData.loan.totalInstallmentsCount}
                    </p>
                    <span className="text-[14px] text-slate-500">
                      Paid: {formatCurrency(activeLoanData.loan.totalPaid)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[14px] font-semibold">Disbursed Principal</span>
                    <p className="text-[34px] font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                      {formatCurrency(activeLoanData.loan.disbursedAmount || activeLoanData.loan.requestedAmount)}
                    </p>
                    <span className="text-[14px] text-slate-500">Rate: {activeLoanData.loan.interestRate}% p.a.</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[16px] font-semibold text-slate-600 dark:text-slate-300">
                    <span>Overall Loan Amortization Progress</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {Math.min(100, Math.round((activeLoanData.loan.totalPaid / (activeLoanData.loan.totalPayableAmount || 1)) * 100))}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-4 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.round((activeLoanData.loan.totalPaid / (activeLoanData.loan.totalPayableAmount || 1)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Installment Schedule Table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-0">
                <div className="p-6 sm:p-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-white text-[22px]">Monthly Installment Amortization Schedule</h3>
                  <span className="text-[16px] text-slate-500 dark:text-slate-400 font-medium">{(activeLoanData.schedule || []).length} Total Installments</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[17px] text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold uppercase text-[15px] border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-4">#</th>
                        <th className="p-4">Due Date</th>
                        <th className="p-4 text-right">Principal</th>
                        <th className="p-4 text-right">Interest</th>
                        <th className="p-4 text-right">Installment Amount</th>
                        <th className="p-4 text-right">Remaining Balance</th>
                        <th className="p-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {(activeLoanData.schedule || []).map((s) => (
                        <tr key={s.id} className={`${s.status === 'PAID' ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : s.status === 'OVERDUE' ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''} hover:bg-slate-50/70 dark:hover:bg-slate-800/40 min-h-[60px]`}>
                          <td className="p-4 font-mono font-bold text-[18px]">{s.installmentNumber}</td>
                          <td className="p-4 font-mono">{formatDate(s.dueDate)}</td>
                          <td className="p-4 text-right font-mono">{formatCurrency(s.principalAmount)}</td>
                          <td className="p-4 text-right font-mono text-purple-700 dark:text-purple-400">{formatCurrency(s.interestAmount)}</td>
                          <td className="p-4 text-right font-mono font-bold text-slate-900 dark:text-white text-[18px]">{formatCurrency(s.installmentAmount)}</td>
                          <td className="p-4 text-right font-mono text-slate-600 dark:text-slate-400">{formatCurrency(s.remainingBalance)}</td>
                          <td className="p-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-[13px] font-bold ${
                              s.status === 'PAID' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : s.status === 'OVERDUE' ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}>
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-6 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-sky-300 flex items-center justify-center mx-auto">
                <Landmark className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-[24px] font-bold text-slate-900 dark:text-white">No Outstanding Active Loans</h3>
                <p className="text-[16px] text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                  You currently have no active or overdue loans with Wabi SACCO. You are fully eligible to apply for any credit product up to {formatCurrency(eligibility?.maxBorrowableAmount || 180000)}.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('apply')}
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[18px] rounded-xl shadow-sm transition inline-flex items-center gap-2 min-h-[52px]"
              >
                <Plus className="w-5 h-5" /> Start New Loan Application
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB: APPLY FOR LOAN */}
      {activeTab === 'apply' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-8">
          <div>
            <h3 className="text-[28px] font-bold text-slate-900 dark:text-white leading-tight">Originate Cooperative Loan Application</h3>
            <p className="text-[16px] text-slate-500 dark:text-slate-400 mt-1">Select a product and configure terms according to your credit ceiling.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block font-semibold text-slate-900 dark:text-white text-[18px] mb-2">Loan Product</label>
              <select
                value={appProductId}
                onChange={(e) => setAppProductId(e.target.value)}
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[18px] font-medium min-h-[52px]"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.interestRate}% p.a. - Max: {formatCurrency(p.maxAmount)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-900 dark:text-white text-[18px] mb-2">Requested Principal (ETB)</label>
              <input
                type="number"
                value={appAmount}
                onChange={(e) => setAppAmount(Number(e.target.value))}
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-[18px] min-h-[52px]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-900 dark:text-white text-[18px] mb-2">Term (Months)</label>
              <input
                type="number"
                value={appTerm}
                onChange={(e) => setAppTerm(Number(e.target.value))}
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-[18px] min-h-[52px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block font-semibold text-slate-900 dark:text-white text-[18px] mb-2">Monthly Income (ETB)</label>
              <input
                type="number"
                value={appMonthlyIncome}
                onChange={(e) => setAppMonthlyIncome(Number(e.target.value))}
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-semibold text-[18px] min-h-[52px]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-900 dark:text-white text-[18px] mb-2">Employer / Enterprise Name</label>
              <input
                type="text"
                value={appEmployer}
                onChange={(e) => setAppEmployer(e.target.value)}
                placeholder="e.g. Ethio Telecom, or Private Wholesale"
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[18px] min-h-[52px]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-900 dark:text-white text-[18px] mb-2">Detailed Purpose of Loan</label>
            <textarea
              rows={3}
              value={appPurpose}
              onChange={(e) => setAppPurpose(e.target.value)}
              placeholder="e.g. Working capital for wholesale retail goods procurement."
              className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[18px]"
            />
          </div>

          {/* Guarantor Selection */}
          <div className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-4 border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-slate-900 dark:text-white text-[20px]">Guarantor Co-Signers (Fellow Active Members)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-[16px] font-medium mb-1.5">Guarantor 1 (Membership No or ID)</label>
                <input
                  type="text"
                  value={appGuarantor1}
                  onChange={(e) => setAppGuarantor1(e.target.value)}
                  placeholder="e.g. WB000088"
                  className="w-full p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[18px] min-h-[52px]"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-[16px] font-medium mb-1.5">Guaranteed Amount (ETB)</label>
                <input
                  type="number"
                  value={appGuarantor1Amt}
                  onChange={(e) => setAppGuarantor1Amt(Number(e.target.value))}
                  className="w-full p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[18px] min-h-[52px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-[16px] font-medium mb-1.5">Guarantor 2 (Membership No or ID)</label>
                <input
                  type="text"
                  value={appGuarantor2}
                  onChange={(e) => setAppGuarantor2(e.target.value)}
                  placeholder="e.g. WB000201"
                  className="w-full p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[18px] min-h-[52px]"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-[16px] font-medium mb-1.5">Guaranteed Amount (ETB)</label>
                <input
                  type="number"
                  value={appGuarantor2Amt}
                  onChange={(e) => setAppGuarantor2Amt(Number(e.target.value))}
                  className="w-full p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[18px] min-h-[52px]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              onClick={() => setActiveTab('overview')}
              className="px-6 py-3.5 text-slate-600 dark:text-slate-400 text-[18px] font-semibold min-h-[52px]"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitApplication}
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[18px] rounded-xl shadow-sm min-h-[52px] transition"
            >
              Submit Loan Application
            </button>
          </div>
        </div>
      )}

      {/* TAB: CALCULATOR & SIMULATOR */}
      {activeTab === 'calculator' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-8">
          <div>
            <h3 className="text-[28px] font-bold text-slate-900 dark:text-white leading-tight">Interactive Loan Amortization Simulator</h3>
            <p className="text-[16px] text-slate-500 dark:text-slate-400 mt-1">Test different principal amounts, terms, and interest rates with real-time schedule preview.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block font-semibold text-slate-900 dark:text-white text-[18px] mb-2">Principal Amount (ETB)</label>
              <input
                type="number"
                value={calcAmount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCalcAmount(val);
                  handleRunCalculator(val, calcRate, calcTerm, calcGrace);
                }}
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-[18px] min-h-[52px]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-900 dark:text-white text-[18px] mb-2">Annual Interest Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={calcRate}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCalcRate(val);
                  handleRunCalculator(calcAmount, val, calcTerm, calcGrace);
                }}
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-[18px] min-h-[52px]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-900 dark:text-white text-[18px] mb-2">Repayment Term (Months)</label>
              <input
                type="number"
                value={calcTerm}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCalcTerm(val);
                  handleRunCalculator(calcAmount, calcRate, val, calcGrace);
                }}
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-[18px] min-h-[52px]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-900 dark:text-white text-[18px] mb-2">Grace Period (Months)</label>
              <input
                type="number"
                value={calcGrace}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCalcGrace(val);
                  handleRunCalculator(calcAmount, calcRate, calcTerm, val);
                }}
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-[18px] min-h-[52px]"
              />
            </div>
          </div>

          {/* Calculator Output KPI Cards */}
          {calcResult && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-6 bg-blue-50/80 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-1">
                  <span className="text-blue-950 dark:text-sky-300 font-semibold text-[15px]">Estimated Monthly Payment</span>
                  <p className="text-[34px] font-bold text-blue-900 dark:text-sky-200 tabular-nums">{formatCurrency(calcResult.monthlyInstallment)}</p>
                </div>
                <div className="p-6 bg-purple-50/80 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800 space-y-1">
                  <span className="text-purple-950 dark:text-purple-300 font-semibold text-[15px]">Total Interest Payable</span>
                  <p className="text-[34px] font-bold text-purple-900 dark:text-purple-200 tabular-nums">{formatCurrency(calcResult.totalInterest)}</p>
                </div>
                <div className="p-6 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-1">
                  <span className="text-emerald-950 dark:text-emerald-300 font-semibold text-[15px]">Total Amount (Principal + Interest)</span>
                  <p className="text-[34px] font-bold text-emerald-900 dark:text-emerald-200 tabular-nums">{formatCurrency(calcResult.totalPayable)}</p>
                </div>
              </div>

              {/* Schedule Table Preview */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-[17px] text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[15px] border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-4">Month</th>
                      <th className="p-4">Opening Balance</th>
                      <th className="p-4 text-right">Principal</th>
                      <th className="p-4 text-right">Interest</th>
                      <th className="p-4 text-right">Installment Amount</th>
                      <th className="p-4 text-right">Remaining Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {calcResult.schedule.map((row) => (
                      <tr key={row.installmentNumber} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 min-h-[60px]">
                        <td className="p-4 font-bold font-mono text-[18px]">Month #{row.installmentNumber}</td>
                        <td className="p-4 font-mono">{formatCurrency(row.openingBalance)}</td>
                        <td className="p-4 text-right font-mono text-slate-800 dark:text-slate-200">{formatCurrency(row.principalAmount)}</td>
                        <td className="p-4 text-right font-mono text-purple-700 dark:text-purple-400">{formatCurrency(row.interestAmount)}</td>
                        <td className="p-4 text-right font-mono font-bold text-slate-900 dark:text-white text-[18px]">{formatCurrency(row.installmentAmount)}</td>
                        <td className="p-4 text-right font-mono text-slate-600 dark:text-slate-400">{formatCurrency(row.remainingBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: GUARANTOR REQUESTS */}
      {activeTab === 'guarantees' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-6">
          <div>
            <h3 className="text-[28px] font-bold text-slate-900 dark:text-white leading-tight">Peer Guarantee Requests</h3>
            <p className="text-[16px] text-slate-500 dark:text-slate-400 mt-1">Review requests from fellow cooperative members asking you to co-sign their loan facilities.</p>
          </div>

          <div className="space-y-4">
            {guarantorRequests.length === 0 ? (
              <p className="text-center py-12 text-slate-400 text-[17px] font-medium">No pending guarantor requests at this time.</p>
            ) : (
              guarantorRequests.map((req, idx) => (
                <div key={idx} className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-6 text-[16px]">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900 dark:text-white text-[20px]">{req.loan.memberName}</span>
                      <span className="font-mono text-slate-500">({req.loan.membershipNo})</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">
                      Product: <strong>{req.loan.productName}</strong> • Loan Amount: <strong className="text-slate-900 dark:text-white">{formatCurrency(req.loan.requestedAmount)}</strong>
                    </p>
                    <p className="text-blue-700 dark:text-sky-300 font-bold text-[18px]">
                      Requested Guarantee Amount: {formatCurrency(req.guarantorRecord.guaranteedAmount)}
                    </p>
                    <span className={`inline-block px-3 py-1 rounded-full text-[13px] font-bold ${
                      req.guarantorRecord.status === 'ACCEPTED' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : req.guarantorRecord.status === 'DECLINED' ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300' : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                    }`}>
                      Status: {req.guarantorRecord.status}
                    </span>
                  </div>

                  {req.guarantorRecord.status === 'PENDING' && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleGuarantorDecision(req.loan.id, false)}
                        className="px-6 py-3 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-semibold rounded-xl border border-rose-200 dark:border-rose-800 min-h-[48px] text-[16px] transition"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleGuarantorDecision(req.loan.id, true)}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-xs min-h-[48px] text-[16px] transition"
                      >
                        Accept & Co-Sign
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB: APPLICATION HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-0">
          <div className="p-6 sm:p-8 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-[22px]">Your Loan Applications & History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[17px] text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold uppercase text-[15px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-4">Loan No & Date</th>
                  <th className="p-4">Product Name</th>
                  <th className="p-4 text-right">Requested Amount</th>
                  <th className="p-4 text-center">Term</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {myApplications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400 font-medium text-[17px]">
                      No past loan applications recorded.
                    </td>
                  </tr>
                ) : (
                  myApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 min-h-[60px]">
                      <td className="p-4">
                        <span className="font-mono font-bold text-blue-700 dark:text-sky-400 text-[18px]">{app.loanNo}</span>
                        <div className="text-[13px] text-slate-400 mt-0.5">{formatDate(app.applicationDate)}</div>
                      </td>
                      <td className="p-4 font-bold text-slate-900 dark:text-white">{app.productName}</td>
                      <td className="p-4 text-right font-mono font-bold text-slate-900 dark:text-white text-[18px]">{formatCurrency(app.requestedAmount)}</td>
                      <td className="p-4 text-center font-mono">{app.requestedTermMonths} Mos</td>
                      <td className="p-4">
                        <span className="px-3 py-1 rounded-full text-[13px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {app.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          REPAYMENT MODAL
          ========================================== */}
      {isRepayModalOpen && activeLoanData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ArrowDownLeft className="w-6 h-6 text-emerald-400" />
                <h3 className="font-bold text-[22px]">Pay Loan Installment</h3>
              </div>
              <button onClick={() => setIsRepayModalOpen(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>

            <div className="p-8 space-y-6 text-[17px]">
              <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-2 border border-slate-200 dark:border-slate-700">
                <p><strong>Loan:</strong> {activeLoanData.loan.loanNo} • {activeLoanData.loan.productName}</p>
                <p><strong>Outstanding Balance:</strong> <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">{formatCurrency(activeLoanData.loan.totalOutstanding)}</span></p>
              </div>

              <div>
                <label className="block font-semibold text-slate-900 dark:text-white mb-2 text-[18px]">Repayment Amount (ETB)</label>
                <input
                  type="number"
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(Number(e.target.value))}
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-emerald-700 dark:text-emerald-400 text-[24px] min-h-[52px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-900 dark:text-white mb-2 text-[18px]">Payment Method</label>
                <select
                  value={repayChannel}
                  onChange={(e) => setRepayChannel(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-[18px] min-h-[52px]"
                >
                  <option value="INTERNAL_TRANSFER">Deduct from Voluntary Savings Account</option>
                  <option value="CBE_BANK">Commercial Bank of Ethiopia (CBE)</option>
                  <option value="TSEHAY_BANK">Tsehay Bank</option>
                  <option value="CASH">Cash Office Counter</option>
                </select>
              </div>

              {repayChannel !== 'INTERNAL_TRANSFER' && (
                <div>
                  <label className="block font-semibold text-slate-900 dark:text-white mb-2 text-[18px]">Bank Reference No / Slip ID</label>
                  <input
                    type="text"
                    value={repayBankRef}
                    onChange={(e) => setRepayBankRef(e.target.value)}
                    placeholder="e.g. CBE-TX-887766"
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[18px] min-h-[52px]"
                  />
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button onClick={() => setIsRepayModalOpen(false)} className="px-6 py-3.5 text-slate-600 dark:text-slate-400 text-[18px] font-semibold min-h-[52px]">Cancel</button>
              <button
                onClick={handleSubmitRepayment}
                className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[18px] font-semibold rounded-xl min-h-[52px] transition"
              >
                Confirm & Pay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATEMENT MODAL */}
      {isStatementModalOpen && activeLoanData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-400" />
                <h3 className="font-bold text-[22px]">Official Loan Statement — {activeLoanData.loan.loanNo}</h3>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => window.print()} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-[16px] font-semibold rounded-xl flex items-center gap-2">
                  <Printer className="w-5 h-5" /> Print
                </button>
                <button onClick={() => setIsStatementModalOpen(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-8 text-[17px]">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[13px]">Borrower</span>
                  <p className="font-bold text-slate-900 dark:text-white text-[20px] mt-1">{activeLoanData.loan.memberName}</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[13px]">Principal Disbursed</span>
                  <p className="font-bold text-slate-900 dark:text-white text-[20px] mt-1 tabular-nums">{formatCurrency(activeLoanData.loan.disbursedAmount || activeLoanData.loan.requestedAmount)}</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[13px]">Total Paid</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 text-[20px] mt-1 tabular-nums">{formatCurrency(activeLoanData.loan.totalPaid)}</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[13px]">Remaining Balance</span>
                  <p className="font-bold text-rose-600 dark:text-rose-400 text-[20px] mt-1 tabular-nums">{formatCurrency(activeLoanData.loan.totalOutstanding)}</p>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-[17px] text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[15px] border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-4">#</th>
                      <th className="p-4">Due Date</th>
                      <th className="p-4 text-right">Principal</th>
                      <th className="p-4 text-right">Interest</th>
                      <th className="p-4 text-right">Installment Amount</th>
                      <th className="p-4 text-right">Balance</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {activeLoanData.schedule.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 min-h-[60px]">
                        <td className="p-4 font-bold font-mono text-[18px]">{s.installmentNumber}</td>
                        <td className="p-4 font-mono">{formatDate(s.dueDate)}</td>
                        <td className="p-4 text-right font-mono">{formatCurrency(s.principalAmount)}</td>
                        <td className="p-4 text-right font-mono text-purple-700 dark:text-purple-400">{formatCurrency(s.interestAmount)}</td>
                        <td className="p-4 text-right font-mono font-bold text-slate-900 dark:text-white text-[18px]">{formatCurrency(s.installmentAmount)}</td>
                        <td className="p-4 text-right font-mono text-slate-600 dark:text-slate-400">{formatCurrency(s.remainingBalance)}</td>
                        <td className="p-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-[13px] font-bold ${
                            s.status === 'PAID' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
