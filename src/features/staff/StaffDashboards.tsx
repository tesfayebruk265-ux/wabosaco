import React from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { useNavigation } from '../../providers/NavigationProvider';
import { StatisticsCard, DashboardSection } from '../../components/dashboard/StatisticsCard';
import { ChartContainer } from '../../components/dashboard/ChartContainer';
import { QuickActions } from '../../components/dashboard/QuickActions';
import { RecentTransactionsList } from '../../components/dashboard/RecentTransactionsList';
import { PendingActionsList } from '../../components/dashboard/PendingActionsList';
import { NotificationPreview } from '../../components/dashboard/NotificationPreview';
import { formatCurrency } from '../../utils/formatters';
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
  TrendingUp
} from 'lucide-react';
import { TransactionRecord, ApprovalRequest } from '../../types/financial';
import { ROUTES } from '../../constants/routes';

// Mock foundational sample data for dashboards
const SAMPLE_TXNS: TransactionRecord[] = [
  {
    id: 'tx_101',
    transactionNo: 'TXN-2026-0814-001',
    accountNo: 'SAV-REG-00143',
    accountType: 'Compulsory Savings',
    memberId: 143,
    memberName: 'Abebe Bikila Wolde',
    type: 'DEPOSIT',
    debitAmount: null,
    creditAmount: 2500.0,
    runningBalance: 47500.0,
    paymentChannel: 'CBE_BANK',
    referenceNo: 'CBE-FT-88910',
    narration: 'Monthly regular savings deposit via CBE',
    timestamp: '2026-08-14T11:45:00Z',
    status: 'POSTED',
  },
  {
    id: 'tx_102',
    transactionNo: 'TXN-2026-0814-002',
    accountNo: 'SHR-00088',
    accountType: 'Equity Share Capital',
    memberId: 88,
    memberName: 'Tsedey Hailemariam',
    type: 'SHARE_PURCHASE',
    debitAmount: null,
    creditAmount: 5000.0,
    runningBalance: 25000.0,
    paymentChannel: 'TSEHAY_BANK',
    referenceNo: 'TSH-99120',
    narration: 'Purchased 10 additional shares',
    timestamp: '2026-08-14T10:30:00Z',
    status: 'POSTED',
  },
  {
    id: 'tx_103',
    transactionNo: 'TXN-2026-0814-003',
    accountNo: 'LN-BUS-00042',
    accountType: 'Business Development Loan',
    memberId: 42,
    memberName: 'Kassahun Belay',
    type: 'LOAN_REPAYMENT',
    debitAmount: null,
    creditAmount: 8450.0,
    runningBalance: 91550.0,
    paymentChannel: 'CBE_BANK',
    referenceNo: 'CBE-FT-11422',
    narration: 'Monthly EMI installment repayment',
    timestamp: '2026-08-14T09:15:00Z',
    status: 'POSTED',
  },
  {
    id: 'tx_104',
    transactionNo: 'TXN-2026-0814-004',
    accountNo: 'SAV-VOL-00201',
    accountType: 'Voluntary Savings',
    memberId: 201,
    memberName: 'Hiwot Teshome',
    type: 'WITHDRAWAL',
    debitAmount: 12000.0,
    creditAmount: null,
    runningBalance: 38000.0,
    paymentChannel: 'CASH',
    referenceNo: 'CSH-WDR-009',
    narration: 'Counter cash withdrawal (3-day lock cleared)',
    timestamp: '2026-08-14T08:50:00Z',
    status: 'POSTED',
  },
  {
    id: 'tx_105',
    transactionNo: 'TXN-2026-0814-005',
    accountNo: 'GL-1010-001',
    accountType: 'Cash on Hand - Main Vault',
    memberId: 0,
    memberName: 'Wabi SACCO Vault',
    type: 'TRANSFER',
    debitAmount: 50000.0,
    creditAmount: null,
    runningBalance: 350000.0,
    paymentChannel: 'CBE_BANK',
    referenceNo: 'JV-2026-0814-01',
    narration: 'Vault replenishment from CBE settlement account',
    timestamp: '2026-08-14T08:00:00Z',
    status: 'POSTED',
  },
];

const SAMPLE_APPROVALS: ApprovalRequest[] = [
  {
    id: 'app_1',
    requestType: 'LOAN_APPROVAL',
    memberId: 108,
    memberName: 'Mulugeta Assefa',
    membershipNo: 'WB000108',
    amount: 150000.0,
    makerStaffId: 2,
    makerStaffName: 'Bethlehem Tadesse (Loan Officer)',
    submissionDate: '2026-08-14T09:30:00Z',
    status: 'PENDING',
    riskLevel: 'LOW',
    description: '4.0× Multiplier Business Loan (Collateral: ETB 42,500 Savings + 2 Guarantors)',
  },
  {
    id: 'app_2',
    requestType: 'LARGE_WITHDRAWAL',
    memberId: 74,
    memberName: 'Solomon Worku',
    membershipNo: 'WB000074',
    amount: 65000.0,
    makerStaffId: 3,
    makerStaffName: 'Dawit Kebede (Accountant)',
    submissionDate: '2026-08-14T10:15:00Z',
    status: 'PENDING',
    riskLevel: 'MEDIUM',
    description: 'Voluntary savings liquidation exceeding ETB 50,000 dual-control threshold',
  },
  {
    id: 'app_3',
    requestType: 'TRANSACTION_REVERSAL',
    memberId: 143,
    memberName: 'Abebe Bikila Wolde',
    membershipNo: 'WB000143',
    amount: 1200.0,
    makerStaffId: 3,
    makerStaffName: 'Dawit Kebede (Accountant)',
    submissionDate: '2026-08-14T11:00:00Z',
    status: 'PENDING',
    riskLevel: 'HIGH',
    description: 'Duplicate posting reversal on CBE bank batch import',
  },
];

/* 1. ADMIN DASHBOARD */
export const AdminDashboardView: React.FC = () => {
  const { navigate } = useNavigation();

  return (
    <div className="space-y-4 pb-8">
      {/* Title & Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-[#E2E8F0] dark:border-slate-800 shadow-xs">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-[#16A34A] uppercase tracking-wider">Executive Management</span>
          <h1 className="text-[20px] sm:text-[22px] font-bold text-[#0F172A] dark:text-white tracking-tight leading-tight">Administrator System Cockpit</h1>
          <p className="text-[13px] text-[#475569] dark:text-slate-400 max-w-2xl">High-level institutional solvency, system health, and role security governance.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(ROUTES.STAFF.USERS_ROLES)}
            className="px-3.5 py-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-lg text-[13px] font-semibold min-h-[34px] transition shadow-xs cursor-pointer"
          >
            Manage Staff Roles
          </button>
        </div>
      </div>

      {/* Metric Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatisticsCard
          title="Total Member Base"
          value="1,420"
          icon={<Users className="w-5 h-5" />}
          trend={{ value: '+4.2%', direction: 'up', label: 'vs last month' }}
          subtitle="1,385 Active • 35 Pending KYC"
        />
        <StatisticsCard
          title="Total Savings Mobilized"
          value={formatCurrency(48520000)}
          icon={<PiggyBank className="w-5 h-5" />}
          trend={{ value: '+8.1%', direction: 'up', label: 'YoY growth' }}
          variant="primary"
        />
        <StatisticsCard
          title="Active Loan Portfolio"
          value={formatCurrency(36200000)}
          icon={<Landmark className="w-5 h-5" />}
          trend={{ value: '1.2%', direction: 'down', label: 'PAR > 30 days' }}
          variant="success"
        />
        <StatisticsCard
          title="Share Capital Equity"
          value={formatCurrency(12400000)}
          icon={<PieChart className="w-5 h-5" />}
          subtitle="24,800 Shares Issued @ ETB 500"
        />
      </div>

      {/* Quick Action Operations */}
      <QuickActions
        actions={[
          {
            id: 'qa-mem',
            label: 'Register New Member',
            description: 'KYC & Initial Capital',
            icon: <Users className="w-5 h-5 text-[#16A34A]" />,
            onClick: () => navigate(ROUTES.STAFF.MEMBERS),
          },
          {
            id: 'qa-gl',
            label: 'Chart of Accounts',
            description: 'GL Balances & COA',
            icon: <Scale className="w-5 h-5 text-[#16A34A]" />,
            onClick: () => navigate(ROUTES.STAFF.ACCOUNTING),
            color: 'success',
          },
          {
            id: 'qa-aud',
            label: 'Security Audit Logs',
            description: 'Change Data Capture',
            icon: <ShieldAlert className="w-5 h-5 text-[#B45309]" />,
            onClick: () => navigate(ROUTES.STAFF.AUDIT_LOGS),
            color: 'warning',
          },
          {
            id: 'qa-rep',
            label: 'Generate Reports',
            description: 'Financial Statements',
            icon: <FileSpreadsheet className="w-5 h-5 text-[#0369A1]" />,
            onClick: () => navigate(ROUTES.STAFF.REPORTS),
            color: 'info',
          },
        ]}
      />

      {/* Dual Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        <PendingActionsList
          requests={SAMPLE_APPROVALS}
          onViewAll={() => navigate(ROUTES.STAFF.APPROVAL_CENTER)}
        />
        <RecentTransactionsList
          transactions={SAMPLE_TXNS}
          onViewAll={() => navigate(ROUTES.STAFF.TRANSACTIONS)}
        />
      </div>
    </div>
  );
};

/* 2. MANAGER DASHBOARD */
export const ManagerDashboardView: React.FC = () => {
  const { navigate } = useNavigation();

  return (
    <div className="space-y-4 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-[#E2E8F0] dark:border-slate-800 shadow-xs">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-[#B45309] uppercase tracking-wider">Dual Control & Risk Oversight</span>
          <h1 className="text-[20px] sm:text-[22px] font-bold text-[#0F172A] dark:text-white tracking-tight leading-tight">General Manager Dashboard</h1>
          <p className="text-[13px] text-[#475569] dark:text-slate-400 max-w-2xl">Credit committee approvals, high-value withdrawals, and operational authorizations.</p>
        </div>
        <button
          onClick={() => navigate(ROUTES.STAFF.APPROVAL_CENTER)}
          className="px-3.5 py-1.5 bg-[#B45309] hover:bg-amber-700 text-white rounded-lg text-[13px] font-semibold min-h-[34px] transition shadow-xs cursor-pointer"
        >
          Open Approval Center (3 Pending)
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <StatisticsCard
          title="Pending Dual Authorizations"
          value="3"
          icon={<ShieldCheck className="w-5 h-5" />}
          subtitle="2 Loans • 1 Large Withdrawal"
          variant="warning"
        />
        <StatisticsCard
          title="Portfolio at Risk (PAR 30+)"
          value="1.18%"
          icon={<AlertTriangle className="w-5 h-5" />}
          trend={{ value: 'Well within 5% NBE limit', direction: 'neutral' }}
          variant="success"
        />
        <StatisticsCard
          title="Total Disbursed This Month"
          value={formatCurrency(4120000)}
          icon={<Landmark className="w-5 h-5" />}
          trend={{ value: '+12.4%', direction: 'up' }}
          variant="primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        <PendingActionsList
          requests={SAMPLE_APPROVALS}
          onApprove={(req) => alert(`Authorized request ${req.id} for ${req.memberName}`)}
          onReject={(req) => alert(`Rejected request ${req.id}`)}
          onViewAll={() => navigate(ROUTES.STAFF.APPROVAL_CENTER)}
        />
        <RecentTransactionsList
          transactions={SAMPLE_TXNS}
          onViewAll={() => navigate(ROUTES.STAFF.TRANSACTIONS)}
        />
      </div>
    </div>
  );
};

/* 3. ACCOUNTANT DASHBOARD */
export const AccountantDashboardView: React.FC = () => {
  const { navigate } = useNavigation();

  return (
    <div className="space-y-4 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-[#E2E8F0] dark:border-slate-800 shadow-xs">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-[#16A34A] uppercase tracking-wider">Teller Operations & General Ledger</span>
          <h1 className="text-[20px] sm:text-[22px] font-bold text-[#0F172A] dark:text-white tracking-tight leading-tight">Accountant Workbench</h1>
          <p className="text-[13px] text-[#475569] dark:text-slate-400 max-w-2xl">Bank deposit verification, daily postings, loan disbursement, and cash desk management.</p>
        </div>
        <button
          onClick={() => navigate(ROUTES.STAFF.RECEIPT_VERIFICATION)}
          className="px-3.5 py-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-lg text-[13px] font-semibold min-h-[34px] transition shadow-xs cursor-pointer"
        >
          Verify Pending Receipts (3)
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatisticsCard
          title="Unverified Bank Slips"
          value="3"
          icon={<FileCheck className="w-5 h-5" />}
          subtitle="CBE & Tsehay Bank Feeds"
          variant="warning"
        />
        <StatisticsCard
          title="Daily Cashier Inflow"
          value={formatCurrency(184500)}
          icon={<PiggyBank className="w-5 h-5" />}
          variant="primary"
        />
        <StatisticsCard
          title="Daily Disbursements"
          value={formatCurrency(65000)}
          icon={<Landmark className="w-5 h-5" />}
        />
        <StatisticsCard
          title="GL Postings Today"
          value="48"
          icon={<Scale className="w-5 h-5" />}
          subtitle="All Debits = Credits Balanced"
          variant="success"
        />
      </div>

      <QuickActions
        title="Accountant Quick Postings"
        actions={[
          {
            id: 'qa-dep',
            label: 'Post Member Deposit',
            icon: <PiggyBank className="w-5 h-5 text-[#16A34A]" />,
            onClick: () => navigate(ROUTES.STAFF.SAVINGS),
            color: 'success',
          },
          {
            id: 'qa-wdr',
            label: 'Process Withdrawal',
            icon: <Receipt className="w-5 h-5 text-[#16A34A]" />,
            onClick: () => navigate(ROUTES.STAFF.SAVINGS),
          },
          {
            id: 'qa-ln-pay',
            label: 'Record Loan EMI',
            icon: <Landmark className="w-5 h-5 text-[#0369A1]" />,
            onClick: () => navigate(ROUTES.STAFF.LOANS),
            color: 'info',
          },
          {
            id: 'qa-rcp',
            label: 'Bank Receipt Match',
            icon: <FileCheck className="w-5 h-5 text-[#B45309]" />,
            onClick: () => navigate(ROUTES.STAFF.RECEIPT_VERIFICATION),
            color: 'warning',
          },
        ]}
      />

      <RecentTransactionsList
        transactions={SAMPLE_TXNS}
        onViewAll={() => navigate(ROUTES.STAFF.TRANSACTIONS)}
      />
    </div>
  );
};

/* 4. AUDITOR DASHBOARD */
export const AuditorDashboardView: React.FC = () => {
  const { navigate } = useNavigation();

  return (
    <div className="space-y-4 pb-8">
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-[#E2E8F0] dark:border-slate-800 shadow-xs space-y-1">
        <span className="text-[11px] font-bold text-[#475569] uppercase tracking-wider">Independent Inspection</span>
        <h1 className="text-[20px] sm:text-[22px] font-bold text-[#0F172A] dark:text-white tracking-tight leading-tight">Chief Internal Auditor Dashboard</h1>
        <p className="text-[13px] text-[#475569] dark:text-slate-400 max-w-2xl">Read-only real-time transaction trails, trial balances, and tamper-evident audit logs.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <StatisticsCard
          title="Audit Trail Integrity"
          value="100%"
          icon={<ShieldCheck className="w-5 h-5 text-[#16A34A]" />}
          subtitle="Zero Hash Chain Discrepancies"
          variant="success"
        />
        <StatisticsCard
          title="General Ledger Parity"
          value="Balanced"
          icon={<Scale className="w-5 h-5 text-[#16A34A]" />}
          subtitle="Sum(Debit) - Sum(Credit) = 0.00"
          variant="primary"
        />
        <StatisticsCard
          title="High-Risk Transactions"
          value="0 Flags"
          icon={<AlertTriangle className="w-5 h-5 text-[#475569]" />}
          subtitle="Past 30 Days Monitored"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        <RecentTransactionsList
          title="Live Immutable Transaction Audit Log"
          transactions={SAMPLE_TXNS}
          onViewAll={() => navigate(ROUTES.STAFF.TRANSACTIONS)}
        />
        <PendingActionsList
          title="Maker-Checker Review Queue (R/O)"
          requests={SAMPLE_APPROVALS}
          onViewAll={() => navigate(ROUTES.STAFF.APPROVAL_CENTER)}
        />
      </div>
    </div>
  );
};

/* 5. CUSTOMER SERVICE DASHBOARD */
export const CustomerServiceDashboardView: React.FC = () => {
  const { navigate } = useNavigation();

  return (
    <div className="space-y-4 pb-8">
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-[#E2E8F0] dark:border-slate-800 shadow-xs space-y-1">
        <span className="text-[11px] font-bold text-[#16A34A] uppercase tracking-wider">Member Relations</span>
        <h1 className="text-[20px] sm:text-[22px] font-bold text-[#0F172A] dark:text-white tracking-tight leading-tight">Customer Service Desk</h1>
        <p className="text-[13px] text-[#475569] dark:text-slate-400 max-w-2xl">Member inquiries, KYC profile lookup, support tickets, and SMS notification dispatch.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <StatisticsCard
          title="Open Support Inquiries"
          value="4"
          icon={<FileCheck className="w-5 h-5" />}
          subtitle="Average response time: 14 mins"
          variant="warning"
        />
        <StatisticsCard
          title="KYC Lookup Requests Today"
          value="26"
          icon={<Users className="w-5 h-5" />}
          variant="primary"
        />
        <StatisticsCard
          title="SMS Broadcast Status"
          value="99.4%"
          icon={<CheckCircle2 className="w-5 h-5 text-[#16A34A]" />}
          subtitle="Ethio Telecom Gateway Active"
          variant="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        <QuickActions
          title="Service Operations"
          actions={[
            {
              id: 'qa-mem-look',
              label: 'Search Member KYC',
              icon: <Users className="w-5 h-5 text-[#16A34A]" />,
              onClick: () => navigate(ROUTES.STAFF.MEMBERS),
            },
            {
              id: 'qa-sms',
              label: 'Dispatch SMS Notice',
              icon: <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />,
              onClick: () => navigate(ROUTES.STAFF.NOTIFICATIONS),
              color: 'success',
            },
          ]}
        />
        <NotificationPreview
          notifications={[
            {
              id: 1,
              title: 'Monthly Savings Reminder Dispatched',
              message: 'SMS batch broadcast sent to 1,385 active members for August savings cycle.',
              type: 'info',
              createdAt: '2026-08-14T08:00:00Z',
              isRead: true,
            },
            {
              id: 2,
              title: 'Dividend Payout Notice',
              message: 'Annual general meeting dividend distribution scheduled for end of month.',
              type: 'success',
              createdAt: '2026-08-13T14:30:00Z',
              isRead: false,
            },
          ]}
        />
      </div>
    </div>
  );
};
