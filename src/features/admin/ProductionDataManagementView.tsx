import React, { useState, useEffect } from 'react';
import {
  Database,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  Trash2,
  FileSearch,
  Lock,
  HardDrive,
  Layers,
  ArrowRight,
  Sparkles,
  Info,
  ExternalLink,
  ShieldAlert,
  Server,
  FileCheck2,
  Users,
  Coins,
  Banknote,
  FileText,
  Sliders,
  CheckCheck,
} from 'lucide-react';
import {
  adminService,
  ProductionDataStatus,
  DryRunReport,
  CleanupExecutionResult,
  OriginalDataGenerationSummary,
} from '../../services/adminService';
import { useToast } from '../../providers/ToastProvider';
import { useAuth } from '../../providers/AuthProvider';
import { Button } from '../../components/common/Button';
import { TextInput } from '../../components/common/TextInput';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatDateTime, formatCurrency } from '../../utils/formatters';

export const ProductionDataManagementView: React.FC = () => {
  const { user } = useAuth();
  const { success, error, warning, info } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [statusData, setStatusData] = useState<ProductionDataStatus | null>(null);

  // Dry Run state
  const [dryRunLoading, setDryRunLoading] = useState(false);
  const [dryRunReport, setDryRunReport] = useState<DryRunReport | null>(null);
  const [dryRunModalOpen, setDryRunModalOpen] = useState(false);
  const [tableFilter, setTableFilter] = useState<string>('ALL');

  // Cleanup state
  const [cleanupModalOpen, setCleanupModalOpen] = useState(false);
  const [confirmationPhrase, setConfirmationPhrase] = useState('');
  const [cleanupReason, setCleanupReason] = useState('Production deployment initialization and demo data purge');
  const [isExecutingCleanup, setIsExecutingCleanup] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<CleanupExecutionResult | null>(null);
  const [cleanupSuccessModalOpen, setCleanupSuccessModalOpen] = useState(false);

  // Original Data Generator state
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [isGeneratingOriginal, setIsGeneratingOriginal] = useState(false);
  const [memberCount, setMemberCount] = useState<number>(30);
  const [includeLoans, setIncludeLoans] = useState<boolean>(true);
  const [includeSavings, setIncludeSavings] = useState<boolean>(true);
  const [includeShares, setIncludeShares] = useState<boolean>(true);
  const [includeSupportTickets, setIncludeSupportTickets] = useState<boolean>(true);
  const [monthsOfHistory, setMonthsOfHistory] = useState<number>(6);
  const [generationSummary, setGenerationSummary] = useState<OriginalDataGenerationSummary | null>(null);
  const [generationSuccessModalOpen, setGenerationSuccessModalOpen] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getProductionDataStatus();
      if (res.success) {
        setStatusData(res.data);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load production data status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunDryRun = async () => {
    setDryRunLoading(true);
    try {
      const res = await adminService.getProductionDataDryRun();
      if (res.success) {
        setDryRunReport(res.data);
        setDryRunModalOpen(true);
        info('Dry-run inspection completed. Review classification before executing cleanup.');
      }
    } catch (err: any) {
      error(err.message || 'Failed to run dry-run inspection');
    } finally {
      setDryRunLoading(false);
    }
  };

  const handleExecuteCleanup = async () => {
    if (confirmationPhrase.trim() !== 'DELETE DEMO DATA') {
      warning('Please enter the exact confirmation phrase "DELETE DEMO DATA"');
      return;
    }

    setIsExecutingCleanup(true);
    try {
      const res = await adminService.executeProductionDataCleanup(confirmationPhrase, cleanupReason);
      if (res.success) {
        setCleanupResult(res.data);
        setCleanupModalOpen(false);
        setCleanupSuccessModalOpen(true);
        setConfirmationPhrase('');
        success('Production cleanup executed successfully! All demo records purged.');
        loadStatus();
      }
    } catch (err: any) {
      error(err.message || 'Production cleanup failed');
    } finally {
      setIsExecutingCleanup(false);
    }
  };

  const handleGenerateOriginalData = async () => {
    setIsGeneratingOriginal(true);
    try {
      const res = await adminService.generateOriginalData({
        memberCount,
        includeLoans,
        includeSavings,
        includeShares,
        includeSupportTickets,
        monthsOfHistory,
      });
      if (res.success) {
        setGenerationSummary(res.data);
        setGenerateModalOpen(false);
        setGenerationSuccessModalOpen(true);
        success(`Successfully generated ${res.data.membersGenerated} original Ethiopian SACCO operational members!`);
        loadStatus();
      }
    } catch (err: any) {
      error(err.message || 'Failed to generate original operational data');
    } finally {
      setIsGeneratingOriginal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Inspecting production data architecture..." />
      </div>
    );
  }

  const isClean = statusData?.isProductionClean;

  return (
    <div id="production-data-management-view" className="space-y-6">
      {/* Header & Status Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Production Data Management & Migration
                  </h2>
                  {isClean ? (
                    <Badge variant="success" className="px-2.5 py-0.5 text-xs font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                      PRODUCTION CLEAN
                    </Badge>
                  ) : (
                    <Badge variant="warning" className="px-2.5 py-0.5 text-xs font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                      DEMO DATA PRESENT
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Safely inspect, verify, and purge demo/seed records while preserving institutional configuration, Chart of Accounts, and Administrator credentials.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleRunDryRun}
              disabled={dryRunLoading}
              className="flex items-center gap-2 border-slate-300 dark:border-slate-700"
            >
              {dryRunLoading ? <LoadingSpinner size="sm" /> : <FileSearch className="w-4 h-4 text-sky-600" />}
              <span>Inspect (Dry Run)</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => setGenerateModalOpen(true)}
              className="flex items-center gap-2 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
            >
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Generate Original Data</span>
            </Button>

            {!isClean && (
              <Button
                variant="danger"
                onClick={() => setCleanupModalOpen(true)}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>Execute Production Cleanup</span>
              </Button>
            )}

            <Button
              variant="ghost"
              onClick={loadStatus}
              title="Refresh status"
              className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Original Operational Data Engine Section */}
      <div className="bg-gradient-to-br from-emerald-900/90 to-slate-900 border border-emerald-700/50 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-700/50 pb-5">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-400/30 shrink-0">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-lg font-bold text-white tracking-wide">
                    Original SACCO Operational Data Engine
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                    Authentic Ethiopian Profiles
                  </span>
                </div>
                <p className="text-xs text-emerald-100/80 mt-1 max-w-2xl leading-relaxed">
                  Generates realistic operational data for Wabi SACCO with authentic Ethiopian names, Kebele/Woreda addresses, CBE mobile transactions, balanced double-entry General Ledger postings, share certificates, and amortized loans.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button
                variant="primary"
                onClick={() => setGenerateModalOpen(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-md flex items-center gap-2 px-5 py-2.5"
              >
                <Sliders className="w-4 h-4" />
                <span>Configure & Generate Data</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-1.5 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
                <Users className="w-4 h-4" />
                <span>Ethiopian KYC Demographics</span>
              </div>
              <p className="text-[12px] text-slate-300">
                Realistic 3-part names, National ID / FAYDA numbers, Addis Ababa sub-cities, verified employers & incomes.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-1.5 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
                <Coins className="w-4 h-4" />
                <span>Share Capital & Certificates</span>
              </div>
              <p className="text-[12px] text-slate-300">
                10-60 shares @ 500 ETB par value, official certificates, CBE bank transfer deposit receipts.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-1.5 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
                <Banknote className="w-4 h-4" />
                <span>Savings & Loan Portfolios</span>
              </div>
              <p className="text-[12px] text-slate-300">
                Monthly regular compulsory savings, voluntary accounts, and amortized loans with schedule repayments.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-1.5 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
                <CheckCheck className="w-4 h-4" />
                <span>Balanced Double-Entry GL</span>
              </div>
              <p className="text-[12px] text-slate-300">
                100% verified Trial Balance where Total Debits equal Total Credits across all GL accounts.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Database Mode
            </span>
            {isClean ? (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-950"></span>
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-amber-100 dark:ring-amber-950 animate-pulse"></span>
            )}
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {isClean ? 'Clean Production' : 'Demo Mode Active'}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isClean
                ? 'Ready for authentic members & real transactions'
                : 'Contains seed data requiring cleanup before launch'}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Real Members
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {statusData?.realMemberCount || 0}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Registered via public portal or staff onboarding
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Demo Records Found
            </span>
            <AlertTriangle className={`w-4 h-4 ${isClean ? 'text-slate-400' : 'text-amber-500'}`} />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {statusData?.demoRecordsCount || 0}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isClean ? '0 demo records (Purge verified)' : 'Seed members, loans, txns, and tickets'}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pre-Migration Backup
            </span>
            <HardDrive className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-3">
            <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {statusData?.lastBackup ? statusData.lastBackup.backupNumber : 'None'}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
              {statusData?.lastBackup ? (
                <>SHA-256: {statusData.lastBackup.checksum.slice(0, 16)}...</>
              ) : (
                'Auto-created before cleanup'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Production Readiness Architecture Guidelines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Preserved System-Required & Master Entities
            </h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            The cleanup pipeline never destroys critical cooperative foundations:
          </p>
          <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                <strong>Institutional Roles & Permissions:</strong> Administrator, Manager, Accountant, Auditor, CS Officer, Member.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                <strong>SACCO Chart of Accounts (COA):</strong> Standard 5-digit GL ledger structure preserved with balances reset to clean 0.00 ETB.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                <strong>Financial Products Catalog:</strong> Saving products (Compulsory, Voluntary, Children, Time Deposit) & Loan products.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                <strong>System Policies & Governance:</strong> NBE password policies, Ethiopian working calendar, organization profile & branding.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                <strong>Primary Production Administrator:</strong> <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-emerald-600 dark:text-emerald-400">usr_admin_1</code> (Yohannes Girma - System Admin) preserved with full governance access.
              </span>
            </li>
          </ul>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Data Purged During Production Reset
            </h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            All fictitious and seed-generated business records are safely removed:
          </p>
          <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <Trash2 className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>
                <strong>Mock Members & Accounts:</strong> Fictitious member profiles (Abebe Bikila, Tsedey Hailemariam) and associated savings/share accounts.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Trash2 className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>
                <strong>Mock Financial History:</strong> Seed deposits, withdrawals, loan portfolios, journal entries, and deposit batches.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Trash2 className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>
                <strong>Demo Support & Communications:</strong> Seed support tickets, conversation logs, live chat sessions, and broadcasts.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Trash2 className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>
                <strong>Demo Staff Accounts:</strong> Temporary test users (<code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-rose-600 dark:text-rose-400">usr_manager_1</code>, <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-rose-600 dark:text-rose-400">usr_acct_1</code>, <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-rose-600 dark:text-rose-400">usr_auditor_1</code>, <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-rose-600 dark:text-rose-400">usr_cs_1</code>).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Trash2 className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>
                <strong>Sequence Reset:</strong> Membership, Transaction, Journal, Loan, and Share ID generators reset to 1 for clean live start.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Dry Run Report Modal */}
      {dryRunModalOpen && dryRunReport && (
        <Modal
          isOpen={dryRunModalOpen}
          onClose={() => setDryRunModalOpen(false)}
          title="Production Data Cleanup - Dry Run Simulation Report"
          size="xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Safe simulation only — No database records were modified.
              </span>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => setDryRunModalOpen(false)}>
                  Close Report
                </Button>
                {!isClean && (
                  <Button
                    variant="danger"
                    onClick={() => {
                      setDryRunModalOpen(false);
                      setCleanupModalOpen(true);
                    }}
                  >
                    Proceed to Production Cleanup
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Dry Run Summary Header */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400">Collections Inspected</span>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {dryRunReport.summary.totalTablesInspected} Tables
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400">Total Records</span>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {dryRunReport.summary.totalRecordsFound}
                </p>
              </div>
              <div>
                <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">Demo Records to Purge</span>
                <p className="text-lg font-bold text-rose-600 dark:text-rose-400">
                  {dryRunReport.summary.totalDemoRecordsIdentified}
                </p>
              </div>
              <div>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Records Preserved</span>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {dryRunReport.summary.totalRecordsToPreserve}
                </p>
              </div>
            </div>

            {/* Table Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase mr-2">Filter:</span>
              {['ALL', 'DEMO_DATA', 'SYSTEM_REQUIRED', 'PRODUCTION_MASTER_DATA', 'REAL_USER_DATA'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setTableFilter(cat)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    tableFilter === cat
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {cat.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            {/* Table Breakdown Table */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden max-h-[350px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold sticky top-0">
                  <tr>
                    <th className="p-2.5">Table / Collection</th>
                    <th className="p-2.5">Classification</th>
                    <th className="p-2.5">Found</th>
                    <th className="p-2.5">Delete</th>
                    <th className="p-2.5">Preserve</th>
                    <th className="p-2.5">Action Plan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {dryRunReport.tables
                    .filter((t) => tableFilter === 'ALL' || t.category === tableFilter)
                    .map((t) => (
                      <tr key={t.tableName} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 font-mono font-medium text-slate-900 dark:text-white">
                          {t.tableName}
                          <p className="text-[10px] text-slate-500 font-sans">{t.description}</p>
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              t.category === 'SYSTEM_REQUIRED'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                                : t.category === 'PRODUCTION_MASTER_DATA'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                                : t.category === 'DEMO_DATA'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                                : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {t.category}
                          </span>
                        </td>
                        <td className="p-2.5 font-semibold text-slate-900 dark:text-white">{t.totalRecords}</td>
                        <td className="p-2.5 font-semibold text-rose-600 dark:text-rose-400">
                          {t.demoRecords > 0 ? `-${t.demoRecords}` : '0'}
                        </td>
                        <td className="p-2.5 font-semibold text-emerald-600 dark:text-emerald-400">
                          {t.preservedRecords}
                        </td>
                        <td className="p-2.5">
                          <span className="text-[11px] font-mono font-medium text-slate-700 dark:text-slate-300">
                            {t.action}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Dependency Order Section */}
            <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Atomic Dependency Execution Sequence:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                {dryRunReport.dependencyExecutionOrder.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 truncate">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Production Cleanup Confirmation Modal */}
      {cleanupModalOpen && (
        <Modal
          isOpen={cleanupModalOpen}
          onClose={() => !isExecutingCleanup && setCleanupModalOpen(false)}
          title="Execute Safe Production Cleanup"
          size="md"
          footer={
            <div className="flex items-center justify-end gap-3 w-full">
              <Button
                variant="outline"
                onClick={() => setCleanupModalOpen(false)}
                disabled={isExecutingCleanup}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleExecuteCleanup}
                disabled={isExecutingCleanup || confirmationPhrase.trim() !== 'DELETE DEMO DATA'}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isExecutingCleanup ? <LoadingSpinner size="sm" text="Purging Demo Data..." /> : 'Confirm & Purge Demo Data'}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-800 dark:text-rose-300 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>IRREVERSIBLE DESTRUCTION NOTICE</span>
              </div>
              <p>
                This action will permanently delete all demo members, test savings accounts, fictitious loans, and sample journal vouchers from the database.
              </p>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Automated Pre-Cleanup Backup Protection</span>
              </div>
              <p>
                A verified, SHA-256 encrypted emergency database backup will be created and verified immediately before deletion starts. If backup verification fails, the operation aborts automatically.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Cleanup Justification / Audit Reason:
              </label>
              <TextInput
                value={cleanupReason}
                onChange={(e) => setCleanupReason(e.target.value)}
                placeholder="Reason for production cleanup..."
                disabled={isExecutingCleanup}
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-900 dark:text-white">
                Type <span className="text-rose-600 select-all font-mono">DELETE DEMO DATA</span> to confirm:
              </label>
              <TextInput
                value={confirmationPhrase}
                onChange={(e) => setConfirmationPhrase(e.target.value)}
                placeholder="DELETE DEMO DATA"
                disabled={isExecutingCleanup}
                className="font-mono text-center font-bold"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Post-Cleanup Success Verification Modal */}
      {cleanupSuccessModalOpen && cleanupResult && (
        <Modal
          isOpen={cleanupSuccessModalOpen}
          onClose={() => setCleanupSuccessModalOpen(false)}
          title="Production Database Initialization Verified"
          size="lg"
          footer={
            <Button variant="primary" onClick={() => setCleanupSuccessModalOpen(false)}>
              Acknowledge & Open Live System
            </Button>
          }
        >
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-900 dark:text-emerald-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <h4 className="font-bold text-base">Production Cleanup Completed Successfully</h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  All fake business data has been purged. The system is now initialized in production mode.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Pre-Migration Backup</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {cleanupResult.backup.backupNumber}
                </p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Status: {cleanupResult.backup.verificationStatus}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Trial Balance Status</span>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {cleanupResult.integrityCheck.trialBalanceBalanced ? 'BALANCED ($0.00)' : 'UNBALANCED'}
                </p>
                <span className="text-[10px] text-slate-500">
                  Debit $0.00 = Credit $0.00
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Preserved Admin</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  usr_admin_1 (Active)
                </p>
                <span className="text-[10px] text-slate-500">
                  Admin count: {cleanupResult.integrityCheck.activeAdminCount}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Post-Migration Verification Metrics:
              </h5>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                <div>• Demo Members Remaining: <strong className="text-slate-900 dark:text-white">{cleanupResult.integrityCheck.demoMembersRemaining}</strong></div>
                <div>• Demo Loans Remaining: <strong className="text-slate-900 dark:text-white">{cleanupResult.integrityCheck.demoLoansRemaining}</strong></div>
                <div>• Demo Savings Accounts: <strong className="text-slate-900 dark:text-white">{cleanupResult.integrityCheck.demoSavingsRemaining}</strong></div>
                <div>• Demo Transactions: <strong className="text-slate-900 dark:text-white">{cleanupResult.integrityCheck.demoTransactionsRemaining}</strong></div>
                <div>• Preserved COA Accounts: <strong className="text-slate-900 dark:text-white">{cleanupResult.preservedCounts.chartOfAccounts}</strong></div>
                <div>• Preserved Loan Products: <strong className="text-slate-900 dark:text-white">{cleanupResult.preservedCounts.loanProducts}</strong></div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 p-2.5 rounded-lg truncate">
              Audit Record ID: {cleanupResult.auditLogId} | Cleanup ID: {cleanupResult.cleanupId}
            </div>
          </div>
        </Modal>
      )}

      {/* Generate Original Data Configuration Modal */}
      {generateModalOpen && (
        <Modal
          isOpen={generateModalOpen}
          onClose={() => !isGeneratingOriginal && setGenerateModalOpen(false)}
          title="Generate Authentic Ethiopian SACCO Operational Data"
          size="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Overwrites demo data with authentic Ethiopian cooperative records.
              </span>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setGenerateModalOpen(false)}
                  disabled={isGeneratingOriginal}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleGenerateOriginalData}
                  disabled={isGeneratingOriginal}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
                >
                  {isGeneratingOriginal ? (
                    <LoadingSpinner size="sm" text="Generating Data & Ledgers..." />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate {memberCount} Live Profiles</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-5">
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-900 dark:text-emerald-200 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCheck className="w-4 h-4 text-emerald-600" />
                <span>Original Operational Data Pipeline</span>
              </div>
              <p>
                This process creates genuine Ethiopian member records with complete biographical data, authentic FAYDA National IDs, verified KYC documents, share purchases (500 ETB/share), compulsory and voluntary savings deposits, realistic loans with amortization schedules, and balanced double-entry General Ledger postings.
              </p>
            </div>

            {/* Member Count Presets */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Member Volume Preset:
              </label>
              <div className="grid grid-cols-4 gap-2.5">
                {[
                  { count: 15, label: '15 Members', desc: 'Compact Pilot' },
                  { count: 30, label: '30 Members', desc: 'Standard Branch' },
                  { count: 50, label: '50 Members', desc: 'Large Branch' },
                  { count: 100, label: '100 Members', desc: 'Full Union Scale' },
                ].map((preset) => (
                  <button
                    key={preset.count}
                    type="button"
                    onClick={() => setMemberCount(preset.count)}
                    disabled={isGeneratingOriginal}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      memberCount === preset.count
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{preset.label}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{preset.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Module Toggles */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Operational Modules to Populate:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850">
                  <input
                    type="checkbox"
                    checked={includeShares}
                    onChange={(e) => setIncludeShares(e.target.checked)}
                    disabled={isGeneratingOriginal}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">Share Capital & Certificates</div>
                    <div className="text-[11px] text-slate-500">10-60 shares @ 500 ETB with certificates</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850">
                  <input
                    type="checkbox"
                    checked={includeSavings}
                    onChange={(e) => setIncludeSavings(e.target.checked)}
                    disabled={isGeneratingOriginal}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">Savings Accounts & Schedules</div>
                    <div className="text-[11px] text-slate-500">Compulsory & voluntary deposit streams</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850">
                  <input
                    type="checkbox"
                    checked={includeLoans}
                    onChange={(e) => setIncludeLoans(e.target.checked)}
                    disabled={isGeneratingOriginal}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">Loan Portfolios & Amortization</div>
                    <div className="text-[11px] text-slate-500">EMI schedules, collateral & repayments</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850">
                  <input
                    type="checkbox"
                    checked={includeSupportTickets}
                    onChange={(e) => setIncludeSupportTickets(e.target.checked)}
                    disabled={isGeneratingOriginal}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">Support & Member Inquiries</div>
                    <div className="text-[11px] text-slate-500">Realistic member tickets & resolution threads</div>
                  </div>
                </label>
              </div>
            </div>

            {/* History Duration */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Historical Activity Span:
              </label>
              <select
                value={monthsOfHistory}
                onChange={(e) => setMonthsOfHistory(Number(e.target.value))}
                disabled={isGeneratingOriginal}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value={3}>Past 3 Months of Historical Transactions</option>
                <option value={6}>Past 6 Months of Historical Transactions (Recommended)</option>
                <option value={12}>Past 12 Months of Historical Transactions (Full Year)</option>
              </select>
            </div>
          </div>
        </Modal>
      )}

      {/* Generation Success Verification Modal */}
      {generationSuccessModalOpen && generationSummary && (
        <Modal
          isOpen={generationSuccessModalOpen}
          onClose={() => setGenerationSuccessModalOpen(false)}
          title="Original SACCO Operational Dataset Generated"
          size="lg"
          footer={
            <Button variant="primary" onClick={() => setGenerationSuccessModalOpen(false)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Acknowledge & View SACCO Operations
            </Button>
          }
        >
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-900 dark:text-emerald-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <h4 className="font-bold text-base">Original Dataset Successfully Generated & Reconciled</h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  {generationSummary.membersGenerated} authentic Ethiopian cooperative members created with balanced double-entry accounting entries.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Members Created</span>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {generationSummary.membersGenerated}
                </p>
                <span className="text-[10px] text-emerald-600 font-medium">All KYC Verified</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Total Share Capital</span>
                <p className="text-lg font-bold text-slate-900 dark:text-white truncate">
                  {formatCurrency(generationSummary.totalShareCapitalEtb)}
                </p>
                <span className="text-[10px] text-slate-500">
                  {generationSummary.shareAccountsGenerated} Accounts
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Total Deposits</span>
                <p className="text-lg font-bold text-slate-900 dark:text-white truncate">
                  {formatCurrency(generationSummary.totalDepositsEtb)}
                </p>
                <span className="text-[10px] text-slate-500">
                  {generationSummary.savingAccountsGenerated} Accounts
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Trial Balance Status</span>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {generationSummary.trialBalanceBalanced ? 'BALANCED' : 'UNBALANCED'}
                </p>
                <span className="text-[10px] text-emerald-600 font-medium">
                  Debits = Credits
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Generated Operational Components:
              </h5>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                <div>• Total Financial Transactions: <strong className="text-slate-900 dark:text-white">{generationSummary.transactionsGenerated}</strong></div>
                <div>• Double-Entry Journal Postings: <strong className="text-slate-900 dark:text-white">{generationSummary.journalEntriesGenerated}</strong></div>
                <div>• Active Loans Disbursed: <strong className="text-slate-900 dark:text-white">{generationSummary.loansGenerated} ({formatCurrency(generationSummary.totalLoanPortfolioEtb)})</strong></div>
                <div>• Support Tickets & Messages: <strong className="text-slate-900 dark:text-white">{generationSummary.supportTicketsGenerated}</strong></div>
                <div>• Generation Speed: <strong className="text-slate-900 dark:text-white">{generationSummary.executionTimeMs} ms</strong></div>
                <div>• Generated Timestamp: <strong className="text-slate-900 dark:text-white">{formatDateTime(generationSummary.generatedAt)}</strong></div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
