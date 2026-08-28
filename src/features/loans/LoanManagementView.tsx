import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Plus,
  Search,
  Filter,
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
  CreditCard,
  Building2,
  RefreshCw,
  Eye,
  Sliders,
  Award,
  AlertCircle,
  ChevronRight,
  Printer,
  FileCheck,
  Ban,
  Percent,
} from 'lucide-react';
import {
  loanApiService,
  Loan,
  LoanProduct,
  LoanScheduleItem,
  LoanRepayment,
  PortfolioSummary,
  AgingBucket,
  LoanEligibilityReport,
} from '../../services/loanApiService';
import { useAuth } from '../../providers/AuthProvider';
import { useToast } from '../../providers/ToastProvider';
import { formatCurrency, formatDate } from '../../utils/formatters';

type TabType = 'applications' | 'active_portfolio' | 'repayments' | 'delinquency' | 'reports' | 'products';

export const LoanManagementView: React.FC = () => {
  const { user } = useAuth();
  const { success, error, info } = useToast();

  const [currentTab, setCurrentTab] = useState<TabType>('applications');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Data states
  const [loans, setLoans] = useState<Loan[]>([]);
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [repayments, setRepayments] = useState<LoanRepayment[]>([]);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
  const [agingData, setAgingData] = useState<{ totalPrincipal: number; buckets: AgingBucket[] } | null>(null);
  const [productStats, setProductStats] = useState<any[]>([]);

  // Modal states
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [selectedLoanSchedule, setSelectedLoanSchedule] = useState<LoanScheduleItem[]>([]);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isDisburseModalOpen, setIsDisburseModalOpen] = useState(false);
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [isNewAppModalOpen, setIsNewAppModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isWaiveModalOpen, setIsWaiveModalOpen] = useState(false);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);

  // Form states for modals
  const [reviewNotes, setReviewNotes] = useState('');
  const [managerNotes, setManagerNotes] = useState('');
  const [approvedAmount, setApprovedAmount] = useState<number>(0);
  const [approvedTerm, setApprovedTerm] = useState<number>(0);
  const [approvedRate, setApprovedRate] = useState<number>(0);

  const [disburseChannel, setDisburseChannel] = useState<string>('CBE_BANK');
  const [disburseBankRef, setDisburseBankRef] = useState('');

  const [repayAmount, setRepayAmount] = useState<number>(0);
  const [repayChannel, setRepayChannel] = useState<string>('CBE_BANK');
  const [repayBankRef, setRepayBankRef] = useState('');
  const [repayNarration, setRepayNarration] = useState('');

  const [waiveInstallmentNo, setWaiveInstallmentNo] = useState<number>(1);
  const [waiveReason, setWaiveReason] = useState('');

  // New Application form
  const [newMemberId, setNewMemberId] = useState('');
  const [newProductId, setNewProductId] = useState('');
  const [newAmount, setNewAmount] = useState<number>(50000);
  const [newTerm, setNewTerm] = useState<number>(12);
  const [newPurpose, setNewPurpose] = useState('');
  const [newMonthlyIncome, setNewMonthlyIncome] = useState<number>(25000);
  const [newGuarantor1, setNewGuarantor1] = useState('');
  const [newGuarantor1Amt, setNewGuarantor1Amt] = useState<number>(25000);
  const [newGuarantor2, setNewGuarantor2] = useState('');
  const [newGuarantor2Amt, setNewGuarantor2Amt] = useState<number>(25000);
  const [memberEligibility, setMemberEligibility] = useState<LoanEligibilityReport | null>(null);

  // Product edit form
  const [editingProduct, setEditingProduct] = useState<Partial<LoanProduct>>({
    code: 'PERSONAL',
    name: '',
    description: '',
    minAmount: 5000,
    maxAmount: 150000,
    interestRate: 14.0,
    maxTerm: 36,
    gracePeriod: 0,
    requiresGuarantor: true,
    minGuarantors: 1,
    maxGuarantors: 3,
    savingsMultiplier: 4.0,
  });

  // Load initial data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [loansData, productsData, repsData, summaryData, aging, pStats] = await Promise.all([
        loanApiService.getApplications(),
        loanApiService.getProducts(),
        loanApiService.getRepayments(),
        loanApiService.getPortfolioSummary(),
        loanApiService.getAgingReport(),
        loanApiService.getProductReport(),
      ]);

      setLoans(loansData);
      setProducts(productsData);
      setRepayments(repsData);
      setPortfolioSummary(summaryData);
      setAgingData(aging);
      setProductStats(pStats);

      if (productsData.length > 0 && !newProductId) {
        setNewProductId(productsData[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching loan data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter loans based on search and tab status
  const filteredLoans = loans.filter((loan) => {
    const matchesSearch =
      loan.loanNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.membershipNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.productName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (currentTab === 'applications') {
      if (statusFilter === 'ALL') {
        return ['AWAITING_GUARANTORS', 'UNDER_REVIEW', 'AWAITING_MANAGER_APPROVAL', 'APPROVED', 'REJECTED'].includes(loan.status);
      }
      return loan.status === statusFilter;
    }

    if (currentTab === 'active_portfolio') {
      if (statusFilter === 'ALL') {
        return ['ACTIVE', 'DISBURSED', 'OVERDUE', 'DEFAULTED', 'COMPLETED'].includes(loan.status);
      }
      return loan.status === statusFilter;
    }

    if (currentTab === 'delinquency') {
      return ['OVERDUE', 'DEFAULTED'].includes(loan.status) || loan.isDelinquent;
    }

    return true;
  });

  // Action handlers
  const handleOpenReview = async (loan: Loan) => {
    setSelectedLoan(loan);
    setReviewNotes('');
    try {
      const schedule = await loanApiService.getSchedule(loan.id);
      setSelectedLoanSchedule(schedule);
    } catch (e) {
      setSelectedLoanSchedule([]);
    }
    setIsReviewModalOpen(true);
  };

  const handleOpenApprove = (loan: Loan) => {
    setSelectedLoan(loan);
    setApprovedAmount(loan.approvedAmount || loan.requestedAmount);
    setApprovedTerm(loan.approvedTermMonths || loan.requestedTermMonths);
    setApprovedRate(loan.interestRate);
    setManagerNotes('');
    setIsApproveModalOpen(true);
  };

  const handleOpenDisburse = (loan: Loan) => {
    setSelectedLoan(loan);
    setDisburseChannel('CBE_BANK');
    setDisburseBankRef('');
    setIsDisburseModalOpen(true);
  };

  const handleOpenRepay = (loan: Loan) => {
    setSelectedLoan(loan);
    setRepayAmount(loan.nextInstallmentAmount || loan.monthlyInstallmentAmount || 1000);
    setRepayChannel('CBE_BANK');
    setRepayBankRef('');
    setRepayNarration(`Monthly installment repayment for ${loan.loanNo}`);
    setIsRepayModalOpen(true);
  };

  const handleOpenViewDetails = async (loan: Loan) => {
    setSelectedLoan(loan);
    try {
      const res = await loanApiService.getApplicationById(loan.id);
      setSelectedLoanSchedule(res.schedule || []);
    } catch (e) {
      setSelectedLoanSchedule([]);
    }
    setIsViewModalOpen(true);
  };

  const handleOpenStatement = async (loan: Loan) => {
    setSelectedLoan(loan);
    try {
      const schedule = await loanApiService.getSchedule(loan.id);
      setSelectedLoanSchedule(schedule);
    } catch (e) {
      setSelectedLoanSchedule([]);
    }
    setIsStatementModalOpen(true);
  };

  const handleCheckMemberEligibility = async () => {
    if (!newMemberId) {
      error('Input Required', 'Please enter a valid Member ID / Number');
      return;
    }
    try {
      const report = await loanApiService.checkMemberEligibility(newMemberId, newProductId, newAmount);
      setMemberEligibility(report);
      if (report.isEligible) {
        success('Eligibility Verified', `Member is pre-approved for up to ${formatCurrency(report.maxBorrowableAmount)}.`);
      } else {
        info('Eligibility Notice', `Member does not meet all criteria: ${report.reasons.join(', ')}`);
      }
    } catch (err: any) {
      error('Check Failed', err.message);
    }
  };

  const handleSubmitReview = async (approved: boolean) => {
    if (!selectedLoan) return;
    if (!reviewNotes) {
      error('Validation Error', 'Please enter review assessment notes.');
      return;
    }
    try {
      await loanApiService.reviewApplication(selectedLoan.id, approved, reviewNotes);
      success(
        approved ? 'Application Verified' : 'Application Rejected',
        approved
          ? `Loan ${selectedLoan.loanNo} successfully verified and sent for Manager Approval.`
          : `Loan ${selectedLoan.loanNo} rejected.`
      );
      setIsReviewModalOpen(false);
      fetchData();
    } catch (err: any) {
      error('Review Failed', err.message);
    }
  };

  const handleSubmitManagerApproval = async (approved: boolean) => {
    if (!selectedLoan) return;
    try {
      await loanApiService.approveApplication(selectedLoan.id, approved, {
        approvedAmount,
        approvedTermMonths: approvedTerm,
        approvedRate,
        notes: managerNotes,
      });
      success(
        approved ? 'Loan Approved' : 'Loan Rejected',
        approved
          ? `Loan ${selectedLoan.loanNo} for ${formatCurrency(approvedAmount)} approved and ready for disbursement.`
          : `Loan ${selectedLoan.loanNo} rejected.`
      );
      setIsApproveModalOpen(false);
      fetchData();
    } catch (err: any) {
      error('Approval Failed', err.message);
    }
  };

  const handleSubmitDisbursement = async () => {
    if (!selectedLoan) return;
    try {
      await loanApiService.disburse(selectedLoan.id, {
        paymentChannel: disburseChannel,
        bankReferenceNo: disburseBankRef,
      });
      success('Loan Disbursed', `Loan ${selectedLoan.loanNo} successfully disbursed via ${disburseChannel}. General Ledger updated.`);
      setIsDisburseModalOpen(false);
      fetchData();
    } catch (err: any) {
      error('Disbursement Failed', err.message);
    }
  };

  const handleSubmitRepayment = async () => {
    if (!selectedLoan || repayAmount <= 0) {
      error('Validation Error', 'Please enter a valid repayment amount');
      return;
    }
    try {
      await loanApiService.recordRepayment({
        loanId: selectedLoan.id,
        amount: repayAmount,
        paymentChannel: repayChannel,
        bankReferenceNo: repayBankRef,
        narration: repayNarration,
      });
      success('Repayment Posted', `Payment of ${formatCurrency(repayAmount)} posted for ${selectedLoan.loanNo}.`);
      setIsRepayModalOpen(false);
      fetchData();
    } catch (err: any) {
      error('Repayment Failed', err.message);
    }
  };

  const handleScanOverdue = async () => {
    setIsLoading(true);
    try {
      const res = await loanApiService.processOverdue();
      success(
        'Delinquency Scan Completed',
        `Scanned active loans: ${res.processedLoansCount} loans flagged overdue. Assessed penalties: ${formatCurrency(res.totalPenaltiesAssessed)}.`
      );
      fetchData();
    } catch (err: any) {
      error('Scan Failed', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitWaivePenalty = async () => {
    if (!selectedLoan) return;
    if (!waiveReason) {
      error('Validation Error', 'Please provide a formal waiver justification reason.');
      return;
    }
    try {
      await loanApiService.waivePenalty(selectedLoan.id, waiveInstallmentNo, waiveReason);
      success('Penalty Waived', `Penalty on installment #${waiveInstallmentNo} waived successfully.`);
      setIsWaiveModalOpen(false);
      fetchData();
    } catch (err: any) {
      error('Waiver Failed', err.message);
    }
  };

  const handleCreateNewApplication = async () => {
    if (!newMemberId || !newProductId || newAmount <= 0 || newTerm <= 0) {
      error('Validation Error', 'Please fill in all mandatory application fields.');
      return;
    }

    const selectedProd = products.find((p) => p.id === newProductId);
    const guarantors = [];
    if (selectedProd?.requiresGuarantor) {
      if (newGuarantor1) {
        guarantors.push({ guarantorMemberId: newGuarantor1, guaranteedAmount: newGuarantor1Amt });
      }
      if (newGuarantor2) {
        guarantors.push({ guarantorMemberId: newGuarantor2, guaranteedAmount: newGuarantor2Amt });
      }
    }

    try {
      await loanApiService.apply({
        memberId: newMemberId,
        productId: newProductId,
        requestedAmount: newAmount,
        requestedTermMonths: newTerm,
        purpose: newPurpose || 'Member loan request',
        incomeDetails: {
          monthlyIncome: newMonthlyIncome,
          employerOrBusiness: 'Self-Employed / Business',
          netDisposableIncome: newMonthlyIncome * 0.6,
        },
        guarantors,
      });

      success('Application Originated', 'New loan application registered and routed for credit check.');
      setIsNewAppModalOpen(false);
      fetchData();
    } catch (err: any) {
      error('Application Failed', err.message);
    }
  };

  const handleSaveProduct = async () => {
    if (!editingProduct.code || !editingProduct.name || !editingProduct.minAmount || !editingProduct.maxAmount) {
      error('Validation Error', 'Please fill all required product settings.');
      return;
    }

    try {
      if (editingProduct.id) {
        await loanApiService.updateProduct(editingProduct.id, editingProduct);
        success('Product Updated', `Loan product ${editingProduct.name} settings updated.`);
      } else {
        await loanApiService.createProduct(editingProduct);
        success('Product Created', `New loan product ${editingProduct.name} created.`);
      }
      setIsProductModalOpen(false);
      fetchData();
    } catch (err: any) {
      error('Save Failed', err.message);
    }
  };

  // Status badge styling helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Approved
          </span>
        );
      case 'ACTIVE':
      case 'DISBURSED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            <DollarSign className="w-3 h-3 text-blue-600" /> Active
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Clock className="w-3 h-3 text-amber-600" /> Credit Review
          </span>
        );
      case 'AWAITING_GUARANTORS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
            <User className="w-3 h-3 text-purple-600" /> Guarantors
          </span>
        );
      case 'AWAITING_MANAGER_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
            <Award className="w-3 h-3 text-indigo-600" /> Mgr Approval
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-800">
            <AlertTriangle className="w-3 h-3 text-orange-600" /> Overdue
          </span>
        );
      case 'DEFAULTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <Ban className="w-3 h-3 text-rose-600" /> Default / NPL
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <CheckCircle2 className="w-3 h-3 text-slate-600" /> Settled
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircle className="w-3 h-3 text-rose-600" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* 1. Compact Hero Header Banner (Reduced height by ~45%) */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-4 sm:p-5 rounded-xl border border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[11px] font-semibold rounded-md border border-blue-400/30 flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5" /> Credit & Lending Operations
            </span>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold rounded-md">
              Double-Entry Accounting ✓
            </span>
            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-[11px] font-semibold rounded-md">
              Core Banking
            </span>
            <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[11px] font-semibold rounded-md border border-slate-700">
              Loan Module
            </span>
          </div>
          <h1 className="text-[22px] sm:text-[26px] font-bold tracking-tight text-white mt-1 leading-tight">
            Loan Management
          </h1>
          <p className="text-[12.5px] text-slate-300 max-w-2xl leading-normal">
            Credit origination • Risk Assessment • Maker Checker • Portfolio Management
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setNewMemberId('');
              setMemberEligibility(null);
              setIsNewAppModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[13.5px] font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition min-h-[40px] h-[40px] cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Loan
          </button>
          <button
            onClick={handleScanOverdue}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-[12.5px] font-semibold rounded-lg flex items-center gap-1.5 transition min-h-[40px] h-[40px] cursor-pointer"
            title="Scan active loans for overdue schedules and apply delinquency penalties"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Scan Overdue
          </button>
        </div>
      </div>

      {/* 2. Compact 4-Column KPI Metric Cards (110-125px height) */}
      {portfolioSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1 */}
          <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs h-[118px] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Total Outstanding Principal
              </span>
              <div className="p-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-sky-400 rounded-lg">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[22px] sm:text-[24px] font-bold text-slate-900 dark:text-white tabular-nums leading-none">
              {formatCurrency(portfolioSummary.totalOutstandingPrincipal)}
            </p>
            <div className="flex items-center gap-1.5 text-[12px] text-slate-500 dark:text-slate-400 truncate">
              <span>Active: {portfolioSummary.activeLoansCount} loans</span>
              <span>•</span>
              <span className="text-emerald-600 font-semibold">{portfolioSummary.performingLoansCount} Performing</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs h-[118px] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Portfolio at Risk (PAR)
              </span>
              <div
                className={`p-1.5 rounded-lg ${
                  portfolioSummary.portfolioAtRiskRatePercent > 5
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <p className="text-[22px] sm:text-[24px] font-bold text-slate-900 dark:text-white tabular-nums leading-none">
                {portfolioSummary.portfolioAtRiskRatePercent}%
              </p>
              <span className="text-[12.5px] font-semibold text-rose-600 truncate">
                ({formatCurrency(portfolioSummary.portfolioAtRiskAmount)})
              </span>
            </div>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 truncate">
              {portfolioSummary.overdueLoansCount} Overdue • {portfolioSummary.defaultedLoansCount} Default / NPL
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs h-[118px] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Total Disbursed Volume
              </span>
              <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-lg">
                <Landmark className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[22px] sm:text-[24px] font-bold text-slate-900 dark:text-white tabular-nums leading-none">
              {formatCurrency(portfolioSummary.totalDisbursed)}
            </p>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 truncate">
              Across {portfolioSummary.totalLoansCount} lifetime originated credit facilities
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs h-[118px] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Collections & Earned Income
              </span>
              <div className="p-1.5 bg-purple-50 dark:bg-purple-950/60 text-purple-600 rounded-lg">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[22px] sm:text-[24px] font-bold text-slate-900 dark:text-white tabular-nums leading-none">
              {formatCurrency(portfolioSummary.totalCollections)}
            </p>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 truncate">
              Int: <strong className="text-purple-700 dark:text-purple-300">{formatCurrency(portfolioSummary.totalInterestCollected)}</strong> • Pen: <strong className="text-orange-700 dark:text-orange-300">{formatCurrency(portfolioSummary.totalPenaltyCollected)}</strong>
            </p>
          </div>
        </div>
      )}

      {/* 3. Compact Navigation Tabs & Search Controls (40px height) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => { setCurrentTab('applications'); setStatusFilter('ALL'); }}
            className={`px-3.5 py-1 text-[13px] font-medium rounded-md transition-all h-[34px] cursor-pointer ${
              currentTab === 'applications'
                ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Origination & Queue
          </button>
          <button
            onClick={() => { setCurrentTab('active_portfolio'); setStatusFilter('ALL'); }}
            className={`px-3.5 py-1 text-[13px] font-medium rounded-md transition-all h-[34px] cursor-pointer ${
              currentTab === 'active_portfolio'
                ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Active Portfolio
          </button>
          <button
            onClick={() => setCurrentTab('repayments')}
            className={`px-3.5 py-1 text-[13px] font-medium rounded-md transition-all h-[34px] cursor-pointer ${
              currentTab === 'repayments'
                ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Repayments Ledger
          </button>
          <button
            onClick={() => setCurrentTab('delinquency')}
            className={`px-3.5 py-1 text-[13px] font-medium rounded-md transition-all h-[34px] cursor-pointer ${
              currentTab === 'delinquency'
                ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Delinquency & PAR
          </button>
          <button
            onClick={() => setCurrentTab('reports')}
            className={`px-3.5 py-1 text-[13px] font-medium rounded-md transition-all h-[34px] cursor-pointer ${
              currentTab === 'reports'
                ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Reports & Aging
          </button>
          <button
            onClick={() => setCurrentTab('products')}
            className={`px-3.5 py-1 text-[13px] font-medium rounded-md transition-all h-[34px] cursor-pointer ${
              currentTab === 'products'
                ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Loan Products
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by loan #, member, product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1 text-[12.5px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 h-[34px]"
          />
        </div>
      </div>

      {/* 4. Tab Contents - High Density Tables */}

      {/* TAB 1: APPLICATIONS QUEUE */}
      {currentTab === 'applications' && (
        <div className="space-y-3">
          {/* Sub-status filters */}
          <div className="flex flex-wrap gap-1.5 text-[12px]">
            {['ALL', 'AWAITING_GUARANTORS', 'UNDER_REVIEW', 'AWAITING_MANAGER_APPROVAL', 'APPROVED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md font-medium border transition h-[30px] cursor-pointer ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[11.5px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Loan No & Product</th>
                    <th className="py-2.5 px-3">Member Details</th>
                    <th className="py-2.5 px-3 text-right">Requested Principal</th>
                    <th className="py-2.5 px-3 text-center">Term / Rate</th>
                    <th className="py-2.5 px-3">Guarantors Status</th>
                    <th className="py-2.5 px-3">Workflow Status</th>
                    <th className="py-2.5 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[13px]">
                  {filteredLoans.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 font-medium text-[13px]">
                        No loan applications found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLoans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-bold text-blue-700 dark:text-sky-400 text-[13px]">{loan.loanNo}</span>
                          <div className="text-slate-800 dark:text-slate-200 font-medium text-[13px]">{loan.productName}</div>
                          <span className="text-[11px] text-slate-400">{formatDate(loan.applicationDate)}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-900 dark:text-white text-[13.5px]">{loan.memberName}</span>
                          <div className="text-[11.5px] font-mono text-slate-500 dark:text-slate-400">{loan.membershipNo}</div>
                          {loan.incomeDetails && (
                            <div className="text-[11px] text-slate-400">Income: {formatCurrency(loan.incomeDetails.monthlyIncome)}/mo</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white text-[14px]">
                          {formatCurrency(loan.requestedAmount)}
                          <div className="text-[11.5px] font-normal text-slate-400">
                            Monthly: {formatCurrency(loan.monthlyInstallmentAmount)}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          <span className="font-medium text-slate-800 dark:text-slate-200 text-[13px]">{loan.requestedTermMonths} Mos</span>
                          <div className="text-[11.5px] text-slate-500">{loan.interestRate}% p.a.</div>
                        </td>
                        <td className="py-2.5 px-3">
                          {loan.guarantors && loan.guarantors.length > 0 ? (
                            <div className="space-y-1">
                              {loan.guarantors.map((g) => (
                                <div key={g.id} className="flex items-center gap-1.5 text-[12px]">
                                  <span className={`w-2 h-2 rounded-full ${g.status === 'ACCEPTED' ? 'bg-emerald-500' : g.status === 'DECLINED' ? 'bg-rose-500' : 'bg-amber-400'}`} />
                                  <span className="text-slate-700 dark:text-slate-300 font-medium">{g.guarantorName.split(' ')[0]}:</span>
                                  <span className="text-slate-500 font-mono text-[11px]">({formatCurrency(g.guaranteedAmount)})</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[12px]">Not Required</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">{getStatusBadge(loan.status)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenViewDetails(loan)}
                              className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-md transition cursor-pointer"
                              title="View Application Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Review Button for Credit Officers / Accountants */}
                            {loan.status === 'UNDER_REVIEW' && (
                              <button
                                onClick={() => handleOpenReview(loan)}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-[12px] rounded-md shadow-2xs flex items-center gap-1 transition h-7 cursor-pointer"
                              >
                                <FileCheck className="w-3.5 h-3.5" /> Review
                              </button>
                            )}

                            {/* Final Approval Button for Manager */}
                            {loan.status === 'AWAITING_MANAGER_APPROVAL' && (
                              <button
                                onClick={() => handleOpenApprove(loan)}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[12px] rounded-md shadow-2xs flex items-center gap-1 transition h-7 cursor-pointer"
                              >
                                <Award className="w-3.5 h-3.5" /> Decide
                              </button>
                            )}

                            {/* Disbursement Button */}
                            {loan.status === 'APPROVED' && (
                              <button
                                onClick={() => handleOpenDisburse(loan)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[12px] rounded-md shadow-2xs flex items-center gap-1 transition h-7 cursor-pointer"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5" /> Disburse
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE PORTFOLIO */}
      {currentTab === 'active_portfolio' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5 text-[12px]">
            {['ALL', 'ACTIVE', 'OVERDUE', 'DEFAULTED', 'COMPLETED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md font-medium border transition h-[30px] cursor-pointer ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[11.5px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Loan No & Member</th>
                    <th className="py-2.5 px-3 text-right">Disbursed Principal</th>
                    <th className="py-2.5 px-3 text-right">Outstanding Balance</th>
                    <th className="py-2.5 px-3 text-center">Progress (Paid / Total)</th>
                    <th className="py-2.5 px-3">Next Due Installment</th>
                    <th className="py-2.5 px-3">Status & Aging</th>
                    <th className="py-2.5 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[13px]">
                  {filteredLoans.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 font-medium text-[13px]">
                        No active portfolio loans found.
                      </td>
                    </tr>
                  ) : (
                    filteredLoans.map((loan) => {
                      const percentPaid = loan.totalPayableAmount > 0
                        ? Math.min(100, Math.round((loan.totalPaid / loan.totalPayableAmount) * 100))
                        : 0;

                      return (
                        <tr key={loan.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                          <td className="py-2.5 px-3">
                            <span className="font-mono font-bold text-blue-700 dark:text-sky-400 text-[13px]">{loan.loanNo}</span>
                            <div className="font-semibold text-slate-900 dark:text-white text-[13.5px]">{loan.memberName}</div>
                            <span className="text-[11.5px] text-slate-400">{loan.productName} ({loan.membershipNo})</span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white text-[14px]">
                            {formatCurrency(loan.disbursedAmount || loan.requestedAmount)}
                            <div className="text-[11.5px] font-normal text-slate-400">Rate: {loan.interestRate}% p.a.</div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            <span className="font-bold text-rose-600 text-[14px]">{formatCurrency(loan.totalOutstanding)}</span>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              Prin: {formatCurrency(loan.outstandingPrincipal)} • Int: {formatCurrency(loan.outstandingInterest)}
                            </div>
                            {loan.outstandingPenalty > 0 && (
                              <div className="text-[11px] text-orange-600 font-bold">
                                Pen: {formatCurrency(loan.outstandingPenalty)}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-between text-[11.5px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              <span>{loan.paidInstallmentsCount}/{loan.totalInstallmentsCount} inst.</span>
                              <span>{percentPaid}%</span>
                            </div>
                            <div className="w-24 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mx-auto">
                              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${percentPaid}%` }} />
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            {loan.nextInstallmentDate ? (
                              <div>
                                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[13px]">{formatDate(loan.nextInstallmentDate)}</span>
                                <div className="text-[12px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                                  {formatCurrency(loan.nextInstallmentAmount || 0)}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[13px]">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {getStatusBadge(loan.status)}
                            {loan.daysLate > 0 && (
                              <div className="text-[11.5px] text-rose-600 font-bold mt-0.5">
                                {loan.daysLate} days late
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {['ACTIVE', 'OVERDUE', 'DEFAULTED'].includes(loan.status) && (
                                <button
                                  onClick={() => handleOpenRepay(loan)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[12px] rounded-md shadow-2xs flex items-center gap-1 transition h-7 cursor-pointer"
                                >
                                  <ArrowDownLeft className="w-3.5 h-3.5" /> Repay
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenStatement(loan)}
                                className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-md transition cursor-pointer"
                                title="Print Loan Statement"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
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
        </div>
      )}

      {/* TAB 3: REPAYMENTS LEDGER */}
      {currentTab === 'repayments' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="py-3 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white text-[16px]">Loan Repayments & Collections Ledger</h3>
            <span className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">Total: {repayments.length} transactions</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[11.5px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Repayment No / Date</th>
                  <th className="py-2.5 px-3">Loan & Member</th>
                  <th className="py-2.5 px-3 text-right">Total Paid (ETB)</th>
                  <th className="py-2.5 px-3 text-right">Principal Allocation</th>
                  <th className="py-2.5 px-3 text-right">Interest Allocation</th>
                  <th className="py-2.5 px-3 text-right">Penalty Allocation</th>
                  <th className="py-2.5 px-3">Channel / Performer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[13px]">
                {repayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400 font-medium text-[13px]">
                      No repayments recorded yet.
                    </td>
                  </tr>
                ) : (
                  repayments.map((rep) => (
                    <tr key={rep.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                      <td className="py-2.5 px-3 font-mono">
                        <span className="font-bold text-blue-700 dark:text-sky-400 text-[13px]">{rep.repaymentNo}</span>
                        <div className="text-[11px] text-slate-400">{formatDate(rep.timestamp)}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-900 dark:text-white text-[13.5px]">{rep.memberName}</span>
                        <div className="text-[11.5px] font-mono text-slate-500 dark:text-slate-400">Loan: {rep.loanNo}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 text-[14px]">
                        {formatCurrency(rep.amount)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-800 dark:text-slate-200 text-[13px]">
                        {formatCurrency(rep.principalPaid)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-purple-700 dark:text-purple-300 text-[13px]">
                        {formatCurrency(rep.interestPaid)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-orange-600 text-[13px]">
                        {formatCurrency(rep.penaltyPaid)}
                      </td>
                      <td className="py-2.5 px-3 text-[12px]">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{rep.paymentChannel.replace(/_/g, ' ')}</span>
                        <div className="text-[11px] text-slate-400">By: {rep.performedByName}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DELINQUENCY & PAR */}
      {currentTab === 'delinquency' && (
        <div className="space-y-3">
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h3 className="font-bold text-amber-900 dark:text-amber-200 text-[14px] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Delinquency Management & Penalty Assessment
              </h3>
              <p className="text-[12px] text-amber-800 dark:text-amber-300 leading-normal max-w-3xl">
                Grace period is set to 5 days. Late installments accrue 2.0% monthly penalty. Installments older than 90 days are classified as Non-Performing Loans (Loss).
              </p>
            </div>
            <button
              onClick={handleScanOverdue}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-[12.5px] font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition whitespace-nowrap h-[34px] cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Re-Assess Overdue
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="py-3 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white text-[16px]">Overdue & Defaulted Credit Accounts</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[11.5px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Loan No & Member</th>
                    <th className="py-2.5 px-3">Days Delinquent</th>
                    <th className="py-2.5 px-3 text-right">Overdue Principal</th>
                    <th className="py-2.5 px-3 text-right">Accrued Late Penalty</th>
                    <th className="py-2.5 px-3 text-right">Total Outstanding</th>
                    <th className="py-2.5 px-3">Classification</th>
                    <th className="py-2.5 px-3 text-center">Manager Waiver</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[13px]">
                  {loans.filter((l) => ['OVERDUE', 'DEFAULTED'].includes(l.status) || l.daysLate > 0).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 font-medium text-[13px]">
                        Excellent! No loans are currently overdue.
                      </td>
                    </tr>
                  ) : (
                    loans
                      .filter((l) => ['OVERDUE', 'DEFAULTED'].includes(l.status) || l.daysLate > 0)
                      .map((loan) => (
                        <tr key={loan.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                          <td className="py-2.5 px-3">
                            <span className="font-mono font-bold text-blue-700 dark:text-sky-400 text-[13px]">{loan.loanNo}</span>
                            <div className="font-semibold text-slate-900 dark:text-white text-[13.5px]">{loan.memberName}</div>
                            <span className="text-[11.5px] text-slate-400">{loan.memberPhone || loan.membershipNo}</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-semibold rounded text-[12px]">
                              {loan.daysLate} Days Late
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200 text-[13.5px]">
                            {formatCurrency(loan.outstandingPrincipal)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-orange-600 text-[13.5px]">
                            {formatCurrency(loan.outstandingPenalty)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700 text-[14px]">
                            {formatCurrency(loan.totalOutstanding)}
                          </td>
                          <td className="py-2.5 px-3">{getStatusBadge(loan.status)}</td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => {
                                setSelectedLoan(loan);
                                setWaiveInstallmentNo(1);
                                setWaiveReason('');
                                setIsWaiveModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-[12px] rounded-md shadow-2xs transition h-7 cursor-pointer"
                            >
                              Waive Penalty
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: REPORTS & AGING */}
      {currentTab === 'reports' && (
        <div className="space-y-4">
          {/* Portfolio Aging Buckets */}
          {agingData && (
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-[16px]">Portfolio Aging Schedule (NBE / SACCO Standards)</h3>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400">Asset classification into 5 distinct aging categories.</p>
                </div>
                <span className="text-[13px] font-mono font-bold text-blue-700 dark:text-sky-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                  Total Principal: {formatCurrency(agingData.totalPrincipal)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                {agingData.buckets.map((b, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block uppercase tracking-wider">{b.label}</span>
                    <p className="text-[18px] font-bold text-slate-900 dark:text-white tabular-nums leading-tight">{formatCurrency(b.amount)}</p>
                    <div className="flex items-center justify-between text-[11.5px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-200 dark:border-slate-700">
                      <span>{b.count} loan(s)</span>
                      <strong className="text-blue-600 dark:text-sky-400">{b.percentage}%</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Product Type Breakdown */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <h3 className="font-semibold text-slate-900 dark:text-white text-[16px]">Product Portfolio Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[11.5px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3 text-center">Interest Rate</th>
                    <th className="py-2.5 px-3 text-center">Active Loans</th>
                    <th className="py-2.5 px-3 text-right">Total Disbursed</th>
                    <th className="py-2.5 px-3 text-right">Outstanding Principal</th>
                    <th className="py-2.5 px-3 text-right">Interest Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[13px]">
                  {productStats.map((p) => (
                    <tr key={p.productId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white text-[13.5px]">{p.productName}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-medium text-blue-700 dark:text-sky-400 text-[12.5px]">{p.interestRate}% p.a.</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-[12.5px]">{p.activeLoansCount}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white text-[14px]">{formatCurrency(p.totalDisbursed)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600 text-[14px]">{formatCurrency(p.outstandingPrincipal)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 text-[14px]">{formatCurrency(p.interestEarned)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: LOAN PRODUCTS CONFIG */}
      {currentTab === 'products' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-[16px]">Configurable Loan Products</h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-400">Database-driven lending policy parameters, multipliers, and terms.</p>
            </div>
            <button
              onClick={() => {
                setEditingProduct({
                  code: 'BUSINESS',
                  name: '',
                  description: '',
                  minAmount: 10000,
                  maxAmount: 500000,
                  interestRate: 13.5,
                  maxTerm: 36,
                  gracePeriod: 0,
                  requiresGuarantor: true,
                  minGuarantors: 2,
                  maxGuarantors: 4,
                  savingsMultiplier: 4.0,
                });
                setIsProductModalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition h-[36px] cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {products.map((prod) => (
              <div key={prod.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-sky-400 font-bold font-mono text-[12px] rounded-md">
                    {prod.code}
                  </span>
                  <span className="text-[12px] font-bold text-emerald-600">{prod.status}</span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-[15px]">{prod.name}</h4>
                <p className="text-[12.5px] text-slate-500 dark:text-slate-400 line-clamp-2">{prod.description}</p>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[12.5px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Interest Rate:</span>
                    <strong className="text-slate-900 dark:text-white font-mono">{prod.interestRate}% p.a.</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Borrowing Limit:</span>
                    <strong className="text-slate-900 dark:text-white font-mono">{formatCurrency(prod.minAmount)} - {formatCurrency(prod.maxAmount)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Max Term / Grace:</span>
                    <strong className="text-slate-900 dark:text-white font-mono">{prod.maxTerm} Mos ({prod.gracePeriod} Grace)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Savings Multiplier:</span>
                    <strong className="text-blue-600 dark:text-sky-400 font-bold">{prod.savingsMultiplier}× Compulsory Savings</strong>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => {
                      setEditingProduct(prod);
                      setIsProductModalOpen(true);
                    }}
                    className="w-full py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-[12.5px] rounded-lg border border-slate-200 dark:border-slate-700 transition h-[34px] cursor-pointer"
                  >
                    Edit Product Rules
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==========================================
          COMPACT ERP MODALS & WORKFLOW OVERLAYS
          ========================================== */}

      {/* VIEW DETAILS MODAL */}
      {isViewModalOpen && selectedLoan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-blue-400" />
                <h3 className="font-semibold text-[15px]">Loan Application File — {selectedLoan.loanNo}</h3>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-white text-[16px] cursor-pointer">✕</button>
            </div>

            <div className="p-4 space-y-3.5 text-[13px] max-h-[80vh] overflow-y-auto">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Applicant:</span>
                  <strong className="text-slate-900 dark:text-white">{selectedLoan.memberName} ({selectedLoan.membershipNo})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Product & Requested:</span>
                  <strong className="text-blue-700 dark:text-sky-400 font-mono">{selectedLoan.productName} • {formatCurrency(selectedLoan.requestedAmount)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Term & Rate:</span>
                  <strong className="text-slate-900 dark:text-white font-mono">{selectedLoan.requestedTermMonths} Months • {selectedLoan.interestRate}% p.a.</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Purpose:</span>
                  <span className="text-slate-800 dark:text-slate-200 italic">{selectedLoan.purpose}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Workflow Status:</span>
                  <span>{getStatusBadge(selectedLoan.status)}</span>
                </div>
              </div>

              {selectedLoan.guarantors && selectedLoan.guarantors.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white text-[13px] mb-1.5">Co-Signer Guarantors</h4>
                  <div className="space-y-1.5">
                    {selectedLoan.guarantors.map((g) => (
                      <div key={g.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[12.5px]">
                        <span className="font-medium">{g.guarantorName} ({g.guarantorMembershipNo})</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(g.guaranteedAmount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[12.5px] font-semibold rounded-lg cursor-pointer h-[34px]"
              >
                Close File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. REVIEW MODAL (Credit Assessment) */}
      {isReviewModalOpen && selectedLoan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4.5 h-4.5 text-amber-400" />
                <h3 className="font-semibold text-[15px]">Credit Risk Assessment & Verification</h3>
              </div>
              <button onClick={() => setIsReviewModalOpen(false)} className="text-slate-400 hover:text-white text-[16px] cursor-pointer">✕</button>
            </div>

            <div className="p-4 space-y-3.5 text-[13px]">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Applicant:</span>
                  <strong className="text-slate-900 dark:text-white">{selectedLoan.memberName} ({selectedLoan.membershipNo})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Product & Requested:</span>
                  <strong className="text-blue-700 dark:text-sky-400 font-mono">{selectedLoan.productName} • {formatCurrency(selectedLoan.requestedAmount)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Term & Est. Monthly:</span>
                  <strong className="text-slate-900 dark:text-white">{selectedLoan.requestedTermMonths} Mos • {formatCurrency(selectedLoan.monthlyInstallmentAmount)}/mo</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Stated Purpose:</span>
                  <span className="text-slate-800 dark:text-slate-200 italic">{selectedLoan.purpose}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-900 dark:text-white text-[12.5px] mb-1">Credit Officer Review Assessment Notes</label>
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Verify continuous savings record, member share holdings, debt service capacity, and guarantor confirmation."
                  className="w-full p-2.5 text-[12.5px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => handleSubmitReview(false)}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-[12.5px] font-semibold rounded-lg transition h-[36px] cursor-pointer"
              >
                Reject Application
              </button>
              <button
                onClick={() => handleSubmitReview(true)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[12.5px] font-semibold rounded-lg transition h-[36px] cursor-pointer"
              >
                Verify & Forward for Manager Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MANAGER APPROVAL MODAL */}
      {isApproveModalOpen && selectedLoan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4.5 h-4.5 text-indigo-400" />
                <h3 className="font-semibold text-[15px]">Manager Final Approval Decision</h3>
              </div>
              <button onClick={() => setIsApproveModalOpen(false)} className="text-slate-400 hover:text-white text-[16px] cursor-pointer">✕</button>
            </div>

            <div className="p-4 space-y-3.5 text-[13px]">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/60 rounded-lg space-y-1 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800 text-[12.5px]">
                <p><strong>Applicant:</strong> {selectedLoan.memberName} ({selectedLoan.membershipNo})</p>
                <p><strong>Credit Reviewer:</strong> {selectedLoan.reviewedByName} — <span className="italic">"{selectedLoan.reviewNotes}"</span></p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-900 dark:text-white text-[12px] mb-1">Approved Amount (ETB)</label>
                  <input
                    type="number"
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(Number(e.target.value))}
                    className="w-full px-2.5 py-1 text-[13.5px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold h-[36px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-900 dark:text-white text-[12px] mb-1">Approved Term (Mos)</label>
                  <input
                    type="number"
                    value={approvedTerm}
                    onChange={(e) => setApprovedTerm(Number(e.target.value))}
                    className="w-full px-2.5 py-1 text-[13.5px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold h-[36px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-900 dark:text-white text-[12px] mb-1">Interest Rate (% p.a.)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={approvedRate}
                    onChange={(e) => setApprovedRate(Number(e.target.value))}
                    className="w-full px-2.5 py-1 text-[13.5px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold h-[36px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-900 dark:text-white text-[12px] mb-1">Manager Decision Notes</label>
                <textarea
                  rows={2}
                  value={managerNotes}
                  onChange={(e) => setManagerNotes(e.target.value)}
                  placeholder="Official approval justification or stipulations."
                  className="w-full p-2.5 text-[12.5px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
            </div>

            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => handleSubmitManagerApproval(false)}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-[12.5px] font-semibold rounded-lg transition h-[36px] cursor-pointer"
              >
                Decline Loan
              </button>
              <button
                onClick={() => handleSubmitManagerApproval(true)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[12.5px] font-semibold rounded-lg transition h-[36px] cursor-pointer"
              >
                Grant Final Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. ATOMIC DISBURSEMENT MODAL */}
      {isDisburseModalOpen && selectedLoan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="px-4 py-3 bg-emerald-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-4.5 h-4.5 text-emerald-400" />
                <h3 className="font-semibold text-[15px]">Disburse Approved Loan</h3>
              </div>
              <button onClick={() => setIsDisburseModalOpen(false)} className="text-slate-400 hover:text-white text-[16px] cursor-pointer">✕</button>
            </div>

            <div className="p-4 space-y-3 text-[13px]">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg space-y-1 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 text-[12.5px]">
                <p><strong>Loan:</strong> {selectedLoan.loanNo} ({selectedLoan.memberName})</p>
                <p><strong>Amount to Disburse:</strong> <span className="font-bold text-[16px] text-emerald-700 dark:text-emerald-300 ml-1.5">{formatCurrency(selectedLoan.approvedAmount || selectedLoan.requestedAmount)}</span></p>
              </div>

              <div>
                <label className="block font-semibold text-slate-900 dark:text-white text-[12px] mb-1">Disbursement Payment Channel</label>
                <select
                  value={disburseChannel}
                  onChange={(e) => setDisburseChannel(e.target.value)}
                  className="w-full px-2.5 py-1 text-[13px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium h-[36px]"
                >
                  <option value="CBE_BANK">Commercial Bank of Ethiopia (CBE)</option>
                  <option value="TSEHAY_BANK">Tsehay Bank</option>
                  <option value="CASH">Cash Office Vault (1001-CSH)</option>
                  <option value="INTERNAL_TRANSFER_TO_SAVINGS">Direct Credit to Member Savings</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-900 dark:text-white text-[12px] mb-1">Bank Reference / Cheque No</label>
                <input
                  type="text"
                  value={disburseBankRef}
                  onChange={(e) => setDisburseBankRef(e.target.value)}
                  placeholder="e.g. CBE-TX-98765432"
                  className="w-full px-2.5 py-1 text-[13px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono h-[36px]"
                />
              </div>

              <p className="text-[11.5px] text-slate-500 dark:text-slate-400 italic leading-tight">
                * Disbursement atomically generates the Amortization Schedule, updates Member balances, and logs double-entry GL journals.
              </p>
            </div>

            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button onClick={() => setIsDisburseModalOpen(false)} className="px-3.5 py-1 text-slate-600 dark:text-slate-300 text-[12.5px] font-semibold cursor-pointer">Cancel</button>
              <button
                onClick={handleSubmitDisbursement}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[12.5px] font-semibold rounded-lg transition h-[36px] cursor-pointer"
              >
                Execute Disbursement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. REPAYMENT MODAL */}
      {isRepayModalOpen && selectedLoan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="w-4.5 h-4.5 text-emerald-400" />
                <h3 className="font-semibold text-[15px]">Post Loan Installment Repayment</h3>
              </div>
              <button onClick={() => setIsRepayModalOpen(false)} className="text-slate-400 hover:text-white text-[16px] cursor-pointer">✕</button>
            </div>

            <div className="p-4 space-y-3 text-[13px]">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg space-y-1 border border-slate-200 dark:border-slate-700 text-[12.5px]">
                <p><strong>Loan:</strong> {selectedLoan.loanNo} • {selectedLoan.memberName}</p>
                <p><strong>Total Outstanding:</strong> <span className="font-bold text-rose-600 text-[14px] ml-1">{formatCurrency(selectedLoan.totalOutstanding)}</span></p>
                <p><strong>Suggested Installment:</strong> <span className="font-bold text-blue-700 dark:text-sky-400 text-[14px] ml-1">{formatCurrency(selectedLoan.nextInstallmentAmount || selectedLoan.monthlyInstallmentAmount)}</span></p>
              </div>

              <div>
                <label className="block font-semibold text-slate-900 dark:text-white text-[12px] mb-1">Repayment Amount (ETB)</label>
                <input
                  type="number"
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(Number(e.target.value))}
                  className="w-full px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold text-emerald-600 text-[16px] h-[38px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-900 dark:text-white text-[12px] mb-1">Payment Method / Channel</label>
                <select
                  value={repayChannel}
                  onChange={(e) => setRepayChannel(e.target.value)}
                  className="w-full px-2.5 py-1 text-[13px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium h-[36px]"
                >
                  <option value="CBE_BANK">Commercial Bank of Ethiopia (CBE)</option>
                  <option value="TSEHAY_BANK">Tsehay Bank</option>
                  <option value="CASH">Cash Office Counter</option>
                  <option value="INTERNAL_TRANSFER">Deduct from Member Savings Balance</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-900 dark:text-white text-[12px] mb-1">Bank Reference No</label>
                <input
                  type="text"
                  value={repayBankRef}
                  onChange={(e) => setRepayBankRef(e.target.value)}
                  placeholder="e.g. CBE-FT-77665544"
                  className="w-full px-2.5 py-1 text-[13px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono h-[36px]"
                />
              </div>
            </div>

            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button onClick={() => setIsRepayModalOpen(false)} className="px-3.5 py-1 text-slate-600 dark:text-slate-300 text-[12.5px] font-semibold cursor-pointer">Cancel</button>
              <button
                onClick={handleSubmitRepayment}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[12.5px] font-semibold rounded-lg transition h-[36px] cursor-pointer"
              >
                Post Repayment & Update Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. LOAN STATEMENT MODAL */}
      {isStatementModalOpen && selectedLoan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-4xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-blue-400" />
                <h3 className="font-semibold text-[15px]">Amortization Statement — {selectedLoan.loanNo}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white text-[12.5px] font-semibold rounded-md flex items-center gap-1.5 cursor-pointer h-7"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button onClick={() => setIsStatementModalOpen(false)} className="text-slate-400 hover:text-white text-[16px] cursor-pointer">✕</button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 text-[13px]">
              {/* Header summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-400 text-[11px] uppercase font-bold tracking-wider">Borrower</span>
                  <p className="font-bold text-slate-900 dark:text-white text-[14px] mt-0.5">{selectedLoan.memberName}</p>
                  <span className="font-mono text-slate-500 dark:text-slate-400 text-[12px]">{selectedLoan.membershipNo}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] uppercase font-bold tracking-wider">Principal Disbursed</span>
                  <p className="font-bold text-slate-900 dark:text-white text-[15px] mt-0.5 tabular-nums">{formatCurrency(selectedLoan.disbursedAmount || selectedLoan.requestedAmount)}</p>
                  <span className="text-slate-500 dark:text-slate-400 text-[11.5px]">{selectedLoan.interestRate}% p.a. • {selectedLoan.approvedTermMonths || selectedLoan.requestedTermMonths} Mos</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] uppercase font-bold tracking-wider">Total Paid</span>
                  <p className="font-bold text-emerald-600 text-[15px] mt-0.5 tabular-nums">{formatCurrency(selectedLoan.totalPaid)}</p>
                  <span className="text-slate-500 dark:text-slate-400 text-[11.5px]">Prin: {formatCurrency(selectedLoan.totalPrincipalPaid)}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] uppercase font-bold tracking-wider">Remaining Balance</span>
                  <p className="font-bold text-rose-600 text-[15px] mt-0.5 tabular-nums">{formatCurrency(selectedLoan.totalOutstanding)}</p>
                  <span className="text-slate-500 dark:text-slate-400 text-[11.5px]">Status: {selectedLoan.status}</span>
                </div>
              </div>

              {/* Schedule Table */}
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-[14px] mb-2">Installment Amortization Schedule</h4>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold uppercase text-[11.5px]">
                      <tr>
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Due Date</th>
                        <th className="py-2 px-3 text-right">Principal</th>
                        <th className="py-2 px-3 text-right">Interest</th>
                        <th className="py-2 px-3 text-right">Total Installment</th>
                        <th className="py-2 px-3 text-right">Balance</th>
                        <th className="py-2 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[12.5px]">
                      {selectedLoanSchedule.map((s) => (
                        <tr key={s.id} className={s.status === 'PAID' ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : s.status === 'OVERDUE' ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''}>
                          <td className="py-2 px-3 font-bold font-mono">{s.installmentNumber}</td>
                          <td className="py-2 px-3 font-mono">{formatDate(s.dueDate)}</td>
                          <td className="py-2 px-3 text-right font-mono">{formatCurrency(s.principalAmount)}</td>
                          <td className="py-2 px-3 text-right font-mono text-purple-700 dark:text-purple-300">{formatCurrency(s.interestAmount)}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(s.installmentAmount)}</td>
                          <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-400">{formatCurrency(s.remainingBalance)}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              s.status === 'PAID' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : s.status === 'OVERDUE' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
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
        </div>
      )}

      {/* 6. NEW LOAN APPLICATION ORIGINATION MODAL */}
      {isNewAppModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-4.5 h-4.5 text-blue-400" />
                <h3 className="font-semibold text-[15px]">Originate Member Loan Application</h3>
              </div>
              <button onClick={() => setIsNewAppModalOpen(false)} className="text-slate-400 hover:text-white text-[16px] cursor-pointer">✕</button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3.5 text-[13px]">
              {/* Member identification & live eligibility check */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2.5 border border-slate-200 dark:border-slate-700">
                <div className="flex flex-col sm:flex-row sm:items-end gap-2.5">
                  <div className="flex-1">
                    <label className="block font-semibold text-slate-900 dark:text-white text-[12px] mb-1">Member ID or Membership Number</label>
                    <input
                      type="text"
                      value={newMemberId}
                      onChange={(e) => setNewMemberId(e.target.value)}
                      placeholder="e.g. WB000088 or member UUID"
                      className="w-full px-2.5 py-1 text-[13px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono uppercase h-[36px]"
                    />
                  </div>
                  <button
                    onClick={handleCheckMemberEligibility}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[12.5px] rounded-lg shadow-2xs transition h-[36px] cursor-pointer"
                  >
                    Verify Eligibility
                  </button>
                </div>

                {memberEligibility && (
                  <div className={`p-3 rounded-lg border text-[12px] space-y-1 ${memberEligibility.isEligible ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'}`}>
                    <div className="flex items-center gap-1.5 font-bold text-[13px]">
                      {memberEligibility.isEligible ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
                      <span>{memberEligibility.memberName} — {memberEligibility.isEligible ? 'Eligible for Credit' : 'Ineligible'}</span>
                    </div>
                    <p>Regular Savings: {formatCurrency(memberEligibility.regularSavingsBalance)} • Shares: {memberEligibility.shareCount} • Continuous Savings: {memberEligibility.continuousSavingsMonths} mos</p>
                    <p className="font-bold text-[13.5px]">Max Borrowable Limit: {formatCurrency(memberEligibility.maxBorrowableAmount)}</p>
                    {!memberEligibility.isEligible && (
                      <p className="text-rose-700 dark:text-rose-300 font-semibold">{memberEligibility.reasons.join(', ')}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Loan Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-900 dark:text-white text-[12px] mb-1">Loan Product</label>
                  <select
                    value={newProductId}
                    onChange={(e) => setNewProductId(e.target.value)}
                    className="w-full px-2.5 py-1 text-[13px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium h-[36px]"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.interestRate}%)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-900 dark:text-white text-[12px] mb-1">Requested Amount (ETB)</label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(Number(e.target.value))}
                    className="w-full px-2.5 py-1 text-[13px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold h-[36px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-900 dark:text-white text-[12px] mb-1">Term (Months)</label>
                  <input
                    type="number"
                    value={newTerm}
                    onChange={(e) => setNewTerm(Number(e.target.value))}
                    className="w-full px-2.5 py-1 text-[13px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold h-[36px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-900 dark:text-white text-[12px] mb-1">Loan Purpose</label>
                <input
                  type="text"
                  value={newPurpose}
                  onChange={(e) => setNewPurpose(e.target.value)}
                  placeholder="e.g. Purchase of commercial inventory and equipment"
                  className="w-full px-2.5 py-1 text-[13px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg h-[36px]"
                />
              </div>

              {/* Guarantors */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-white text-[13px]">Guarantor Co-Signers</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 text-[11.5px] mb-1 font-medium">Guarantor 1 (Member No)</label>
                    <input
                      type="text"
                      value={newGuarantor1}
                      onChange={(e) => setNewGuarantor1(e.target.value)}
                      placeholder="e.g. WB000088"
                      className="w-full px-2.5 py-1 text-[12.5px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono h-[34px]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 text-[11.5px] mb-1 font-medium">Guaranteed Amount (ETB)</label>
                    <input
                      type="number"
                      value={newGuarantor1Amt}
                      onChange={(e) => setNewGuarantor1Amt(Number(e.target.value))}
                      className="w-full px-2.5 py-1 text-[12.5px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono h-[34px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 text-[11.5px] mb-1 font-medium">Guarantor 2 (Member No)</label>
                    <input
                      type="text"
                      value={newGuarantor2}
                      onChange={(e) => setNewGuarantor2(e.target.value)}
                      placeholder="e.g. WB000201"
                      className="w-full px-2.5 py-1 text-[12.5px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono h-[34px]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 text-[11.5px] mb-1 font-medium">Guaranteed Amount (ETB)</label>
                    <input
                      type="number"
                      value={newGuarantor2Amt}
                      onChange={(e) => setNewGuarantor2Amt(Number(e.target.value))}
                      className="w-full px-2.5 py-1 text-[12.5px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono h-[34px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button onClick={() => setIsNewAppModalOpen(false)} className="px-3.5 py-1 text-slate-600 dark:text-slate-300 text-[12.5px] font-semibold cursor-pointer">Cancel</button>
              <button
                onClick={handleCreateNewApplication}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[12.5px] font-semibold rounded-lg transition h-[36px] cursor-pointer"
              >
                Submit Loan Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. WAIVE PENALTY MODAL */}
      {isWaiveModalOpen && selectedLoan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4.5 h-4.5 text-amber-400" />
                <h3 className="font-semibold text-[15px]">Waive Delinquency Penalty (Manager)</h3>
              </div>
              <button onClick={() => setIsWaiveModalOpen(false)} className="text-slate-400 hover:text-white text-[16px] cursor-pointer">✕</button>
            </div>

            <div className="p-4 space-y-3 text-[13px]">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-lg space-y-1 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 text-[12.5px]">
                <p><strong>Loan:</strong> {selectedLoan.loanNo} • {selectedLoan.memberName}</p>
                <p><strong>Accrued Penalty:</strong> <span className="font-bold text-rose-600 text-[14px] ml-1">{formatCurrency(selectedLoan.outstandingPenalty)}</span></p>
              </div>

              <div>
                <label className="block font-semibold text-slate-900 dark:text-white text-[12px] mb-1">Installment Number to Waive</label>
                <input
                  type="number"
                  min="1"
                  max="48"
                  value={waiveInstallmentNo}
                  onChange={(e) => setWaiveInstallmentNo(Number(e.target.value))}
                  className="w-full px-2.5 py-1 text-[13.5px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold h-[36px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-900 dark:text-white text-[12px] mb-1">Formal Justification Reason</label>
                <textarea
                  rows={2}
                  value={waiveReason}
                  onChange={(e) => setWaiveReason(e.target.value)}
                  placeholder="e.g. Member experienced documented force majeure."
                  className="w-full p-2.5 text-[12.5px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
            </div>

            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button onClick={() => setIsWaiveModalOpen(false)} className="px-3.5 py-1 text-slate-600 dark:text-slate-300 text-[12.5px] font-semibold cursor-pointer">Cancel</button>
              <button
                onClick={handleSubmitWaivePenalty}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-[12.5px] font-semibold rounded-lg transition h-[36px] cursor-pointer"
              >
                Execute Penalty Waiver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. LOAN PRODUCT CONFIGURATION MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4.5 h-4.5 text-blue-400" />
                <h3 className="font-semibold text-[15px]">{editingProduct.id ? 'Edit Loan Product Rules' : 'Configure New Loan Product'}</h3>
              </div>
              <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-white text-[16px] cursor-pointer">✕</button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3.5 text-[13px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-900 dark:text-white text-[12px] mb-1">Product Code</label>
                  <input
                    type="text"
                    value={editingProduct.code || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. PERSONAL, CAR"
                    disabled={Boolean(editingProduct.id)}
                    className="w-full px-2.5 py-1 text-[13px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono uppercase h-[36px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-900 dark:text-white text-[12px] mb-1">Product Name</label>
                  <input
                    type="text"
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    placeholder="e.g. Personal Development Loan"
                    className="w-full px-2.5 py-1 text-[13px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg h-[36px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-900 dark:text-white text-[12px] mb-1">Product Description</label>
                <textarea
                  rows={2}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  placeholder="Terms and purpose of this loan facility."
                  className="w-full p-2.5 text-[12.5px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-900 dark:text-white text-[12px] mb-1">Min Amount (ETB)</label>
                  <input
                    type="number"
                    value={editingProduct.minAmount || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, minAmount: Number(e.target.value) })}
                    className="w-full px-2.5 py-1 text-[13px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono h-[36px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-900 dark:text-white text-[12px] mb-1">Max Amount (ETB)</label>
                  <input
                    type="number"
                    value={editingProduct.maxAmount || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, maxAmount: Number(e.target.value) })}
                    className="w-full px-2.5 py-1 text-[13px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono h-[36px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-900 dark:text-white text-[12px] mb-1">Interest Rate (% p.a.)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingProduct.interestRate || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, interestRate: Number(e.target.value) })}
                    className="w-full px-2.5 py-1 text-[13px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono h-[36px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-900 dark:text-white text-[12px] mb-1">Max Term (Months)</label>
                  <input
                    type="number"
                    value={editingProduct.maxTerm || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, maxTerm: Number(e.target.value) })}
                    className="w-full px-2.5 py-1 text-[13px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono h-[36px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-900 dark:text-white text-[12px] mb-1">Grace Period (Months)</label>
                  <input
                    type="number"
                    value={editingProduct.gracePeriod || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, gracePeriod: Number(e.target.value) })}
                    className="w-full px-2.5 py-1 text-[13px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono h-[36px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-900 dark:text-white text-[12px] mb-1">Savings Multiplier</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingProduct.savingsMultiplier || 4.0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, savingsMultiplier: Number(e.target.value) })}
                    className="w-full px-2.5 py-1 text-[13px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono h-[36px]"
                  />
                </div>
              </div>
            </div>

            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button onClick={() => setIsProductModalOpen(false)} className="px-3.5 py-1 text-slate-600 dark:text-slate-300 text-[12.5px] font-semibold cursor-pointer">Cancel</button>
              <button
                onClick={handleSaveProduct}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[12.5px] font-semibold rounded-lg transition h-[36px] cursor-pointer"
              >
                Save Product Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
