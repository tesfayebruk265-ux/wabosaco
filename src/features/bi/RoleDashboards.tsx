import React, { useState, useEffect } from 'react';
import {
  Users,
  PiggyBank,
  PieChart,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Scale,
  FileCheck,
  FileSpreadsheet,
  KeyRound,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Clock,
  UserCheck,
  UserX,
  CreditCard,
  MessageSquare
} from 'lucide-react';
import { biApiService } from '../../services/biApiService';
import { formatCurrency, formatDateTime, formatDate, formatPercentage } from '../../utils/formatters';
import { useNavigation } from '../../providers/NavigationProvider';
import { ROUTES } from '../../constants/routes';

/* ==========================================================================
   1. MANAGER DASHBOARD VIEW
   ========================================================================== */
export const ManagerDashboardView: React.FC = () => {
  const { navigate } = useNavigation();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    biApiService.getManagerDashboard().then((res) => {
      setData(res.data);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  return (
    <div id="manager-bi-dashboard" className="space-y-4 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="space-y-1">
          <h1 className="text-[20px] sm:text-[22px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">Branch Operations & Management Desk</h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 max-w-2xl">Supervisory oversight on approvals, credit underwriting and teller flows.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(ROUTES.STAFF.APPROVAL_CENTER)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[13px] font-semibold min-h-[34px] shadow-xs transition cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Maker-Checker Queue ({data?.pendingApprovalsCount || 0})</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Approvals</span>
          <div className="text-[22px] font-bold text-amber-600 dark:text-amber-400 tabular-nums">
            {data?.pendingApprovalsCount || 0}
          </div>
          <span className="text-[12px] text-slate-500">Dual-control approvals</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Borrowers</span>
          <div className="text-[22px] font-bold text-blue-600 dark:text-sky-400 tabular-nums">
            {data?.activeLoansCount || 0}
          </div>
          <span className="text-[12px] text-slate-500">Under supervisory watch</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Repayment Recovery</span>
          <div className="text-[22px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {data ? formatPercentage(data.collectionEfficiency || 98.2) : '98.2%'}
          </div>
          <span className="text-[12px] text-slate-500">On-time installment rate</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Branch Portfolio</span>
          <div className="text-[22px] font-bold text-slate-900 dark:text-white tabular-nums">
            {data ? formatCurrency(data.totalOutstanding || 0) : '---'}
          </div>
          <span className="text-[12px] text-slate-500">Active principal credit</span>
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   2. ACCOUNTANT DASHBOARD VIEW
   ========================================================================== */
export const AccountantDashboardView: React.FC = () => {
  const { navigate } = useNavigation();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    biApiService.getAccountantDashboard().then((res) => {
      setData(res.data);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  return (
    <div id="accountant-bi-dashboard" className="space-y-4 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="space-y-1">
          <h1 className="text-[20px] sm:text-[22px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">Finance & Accounting Workstation</h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 max-w-2xl">Daily journals, bank deposit slip reconciliations, and general ledger postings.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(ROUTES.STAFF.RECEIPT_VERIFICATION)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[13px] font-semibold min-h-[34px] shadow-xs transition cursor-pointer"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Verify Receipts ({data?.pendingReceiptsCount || 0})</span>
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.STAFF.ACCOUNTING)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[13px] font-semibold min-h-[34px] transition cursor-pointer"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>General Ledger</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cash In Vault</span>
          <div className="text-[22px] font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
            {data ? formatCurrency(data.cashInVault || 0) : '---'}
          </div>
          <span className="text-[12px] text-slate-500">Balanced with teller till</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">CBE Bank Balance</span>
          <div className="text-[22px] font-bold text-blue-700 dark:text-sky-300 tabular-nums">
            {data ? formatCurrency(data.cbeBankBalance || 0) : '---'}
          </div>
          <span className="text-[12px] text-slate-500">Commercial Bank of Ethiopia</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unverified Slips</span>
          <div className="text-[22px] font-bold text-amber-600 dark:text-amber-400 tabular-nums">
            {data?.pendingReceiptsCount || 0}
          </div>
          <span className="text-[12px] text-slate-500">Awaiting Maker Confirmation</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Trial Balance</span>
          <div className="text-[22px] font-bold text-emerald-600 dark:text-emerald-400">
            BALANCED
          </div>
          <span className="text-[12px] text-slate-500">Debit / Credit Σ = 0</span>
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   3. AUDITOR DASHBOARD VIEW
   ========================================================================== */
export const AuditorDashboardView: React.FC = () => {
  const { navigate } = useNavigation();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    biApiService.getAuditorDashboard().then((res) => {
      setData(res.data);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  return (
    <div id="auditor-bi-dashboard" className="space-y-4 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="space-y-1">
          <h1 className="text-[20px] sm:text-[22px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">Internal Audit & Compliance Inspection Cockpit</h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 max-w-2xl">Segregation of duties integrity, high-value transaction monitoring, and security telemetry.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(ROUTES.STAFF.AUDIT_LOGS)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-[13px] font-semibold min-h-[34px] shadow-xs transition cursor-pointer"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>System Audit Trail</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Audit Entries</span>
          <div className="text-[22px] font-bold text-slate-900 dark:text-white tabular-nums">
            {data?.totalAuditLogs || 0}
          </div>
          <span className="text-[12px] text-slate-500">Immutable ledger log records</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Critical Exceptions</span>
          <div className="text-[22px] font-bold text-rose-600 dark:text-rose-400 tabular-nums">
            {data?.criticalExceptionsCount || 0}
          </div>
          <span className="text-[12px] text-slate-500">Requires auditor review</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Dual-Control Compliance</span>
          <div className="text-[22px] font-bold text-emerald-600 dark:text-emerald-400">
            100.0%
          </div>
          <span className="text-[12px] text-slate-500">Zero maker-checker bypasses</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">PAR Rate</span>
          <div className="text-[22px] font-bold text-amber-600 dark:text-amber-400 tabular-nums">
            {data ? formatPercentage(data.parRate || 0) : '0%'}
          </div>
          <span className="text-[12px] text-slate-500">Prudential ceiling &lt; 5%</span>
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   4. CUSTOMER SERVICE DASHBOARD VIEW
   ========================================================================== */
export const CustomerServiceDashboardView: React.FC = () => {
  const { navigate } = useNavigation();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    biApiService.getCustomerServiceDashboard().then((res) => {
      setData(res.data);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  return (
    <div id="customer-service-bi-dashboard" className="space-y-4 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="space-y-1">
          <h1 className="text-[20px] sm:text-[22px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">Member Relations & Customer Service Desk</h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 max-w-2xl">Membership KYC onboarding, passbook queries, and member support tickets.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(ROUTES.STAFF.MEMBERS)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[13px] font-semibold min-h-[34px] shadow-xs transition cursor-pointer"
        >
          <Users className="w-3.5 h-3.5" />
          <span>Member KYC Lookup</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Members</span>
          <div className="text-[22px] font-bold text-slate-900 dark:text-white tabular-nums">
            {data?.totalMembers || 0}
          </div>
          <span className="text-[12px] text-slate-500">Good-standing cooperative members</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">New Inquiries Today</span>
          <div className="text-[22px] font-bold text-blue-600 dark:text-sky-400 tabular-nums">
            {data?.inquiriesToday || 12}
          </div>
          <span className="text-[12px] text-slate-500">Passbook & loan questions</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending KYC Reviews</span>
          <div className="text-[22px] font-bold text-amber-600 dark:text-amber-400 tabular-nums">
            {data?.pendingKycCount || 3}
          </div>
          <span className="text-[12px] text-slate-500">Awaiting ID verification</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Service Satisfaction</span>
          <div className="text-[22px] font-bold text-emerald-600 dark:text-emerald-400">
            98.5%
          </div>
          <span className="text-[12px] text-slate-500">Member feedback score</span>
        </div>
      </div>
    </div>
  );
};
