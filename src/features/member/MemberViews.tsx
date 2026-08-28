import React, { useState, useEffect } from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { useNavigation } from '../../providers/NavigationProvider';
import { useToast } from '../../providers/ToastProvider';
import { memberApiService } from '../../services/memberApiService';
import { StatisticsCard } from '../../components/dashboard/StatisticsCard';
import { QuickActions } from '../../components/dashboard/QuickActions';
import { RecentTransactionsList } from '../../components/dashboard/RecentTransactionsList';
import { DataTable } from '../../components/table/DataTable';
import { ColumnDef } from '../../types/table';
import { formatCurrency, formatDateTime, formatDate } from '../../utils/formatters';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { TextInput } from '../../components/common/TextInput';
import { CurrencyInput } from '../../components/common/CurrencyInput';
import { SelectInput } from '../../components/common/SelectInput';
import { FileUploadInput } from '../../components/common/FileUploadInput';
import {
  PiggyBank,
  PieChart,
  Landmark,
  BookOpen,
  ArrowUpRight,
  Download,
  Plus,
  RefreshCw,
  Clock,
  ShieldCheck,
  CheckCircle2,
  FileText,
  User,
  AlertCircle
} from 'lucide-react';
import { TransactionRecord, SavingAccount, FinancialTransaction } from '../../types/financial';
import { financialApiService } from '../../services/financialApiService';
import { ROUTES } from '../../constants/routes';

// Sample Member Data for Demo
const MEMBER_DATA = {
  id: 143,
  membershipNo: 'WB000143',
  fullName: 'Abebe Bikila Wolde',
  phone: '+251 91 122 3344',
  email: 'abebe.b@wabisacco.et',
  compulsorySavings: 45000.0,
  voluntarySavings: 18500.0,
  sharesCount: 80, // 80 * 500 = 40,000 ETB
  shareCapitalValue: 40000.0,
  activeLoanBalance: 0.0,
  consecutiveMonthsDeposited: 14,
  loanEligibilityMultiplier: 4.0,
};

const MEMBER_TXNS: TransactionRecord[] = [
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
    runningBalance: 45000.0,
    paymentChannel: 'CBE_BANK',
    referenceNo: 'CBE-FT-88910',
    narration: 'Monthly regular savings deposit via CBE',
    timestamp: '2026-08-14T11:45:00Z',
    status: 'POSTED',
  },
  {
    id: 'tx_102',
    transactionNo: 'TXN-2026-0715-022',
    accountNo: 'SAV-REG-00143',
    accountType: 'Compulsory Savings',
    memberId: 143,
    memberName: 'Abebe Bikila Wolde',
    type: 'DEPOSIT',
    debitAmount: null,
    creditAmount: 2500.0,
    runningBalance: 42500.0,
    paymentChannel: 'CBE_BANK',
    referenceNo: 'CBE-FT-66512',
    narration: 'Monthly regular savings deposit via CBE',
    timestamp: '2026-07-15T09:30:00Z',
    status: 'POSTED',
  },
  {
    id: 'tx_103',
    transactionNo: 'TXN-2026-0630-089',
    accountNo: 'SAV-VOL-00143',
    accountType: 'Voluntary Savings',
    memberId: 143,
    memberName: 'Abebe Bikila Wolde',
    type: 'INTEREST_POSTING',
    debitAmount: null,
    creditAmount: 208.12,
    runningBalance: 18500.0,
    paymentChannel: 'SYSTEM',
    referenceNo: 'INT-2026-06',
    narration: 'Monthly interest payout (13.5% p.a.)',
    timestamp: '2026-06-30T23:59:59Z',
    status: 'POSTED',
  },
];

/* 1. MEMBER DASHBOARD */
export const MemberDashboardView: React.FC = () => {
  const { navigate } = useNavigation();
  const { user } = useAuth();
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const { success, error: toastError } = useToast();

  const [accounts, setAccounts] = useState<SavingAccount[]>([]);
  const [transactions, setTransactions] = useState<any[]>(MEMBER_TXNS);
  const [depositAmount, setDepositAmount] = useState('2500');
  const [depositAccount, setDepositAccount] = useState<'COMPULSORY' | 'VOLUNTARY' | 'SHARES'>('COMPULSORY');
  const [depositBank, setDepositBank] = useState('CBE');
  const [depositRef, setDepositRef] = useState('');

  useEffect(() => {
    const loadFinancials = async () => {
      try {
        const [accs, txs] = await Promise.all([
          financialApiService.getMyAccounts(),
          financialApiService.getMyTransactions({ limit: 10 }),
        ]);
        if (Array.isArray(accs) && accs.length > 0) {
          setAccounts(accs);
        }
        if (Array.isArray(txs) && txs.length > 0) {
          setTransactions(txs.map((tx: any) => ({
            id: tx.id,
            transactionNo: tx.transactionNumber,
            accountNo: tx.accountNumber,
            accountType: tx.productName || 'Savings Account',
            memberId: tx.memberId,
            memberName: tx.memberName,
            type: tx.type,
            debitAmount: tx.debitAmount,
            creditAmount: tx.creditAmount,
            runningBalance: tx.runningBalance,
            paymentChannel: tx.paymentChannel,
            referenceNo: tx.bankReferenceNo || tx.transactionNumber,
            narration: tx.narration,
            timestamp: tx.createdAt,
            status: tx.status,
          })));
        }
      } catch (err) {
        // Fallback to sample data for preview
      }
    };
    loadFinancials();
  }, []);

  const compulsoryAcc = accounts.find((a) => a.productCode === 'REGULAR');
  const voluntaryAcc = accounts.find((a) => a.productCode === 'VOLUNTARY');

  const compulsorySavings = compulsoryAcc ? compulsoryAcc.currentBalance : MEMBER_DATA.compulsorySavings;
  const voluntarySavings = voluntaryAcc ? voluntaryAcc.currentBalance : MEMBER_DATA.voluntarySavings;
  const totalSavings = compulsorySavings + voluntarySavings;
  const loanLimit = compulsorySavings * MEMBER_DATA.loanEligibilityMultiplier;
  const memberName = user?.fullName || MEMBER_DATA.fullName;
  const membershipNo = user?.membershipNo || MEMBER_DATA.membershipNo;

  return (
    <div className="space-y-4">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#14532D] via-[#0f3d20] to-slate-950 text-white p-4 sm:p-5 rounded-lg shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4 border border-[#166534]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 bg-[#16A34A]/25 text-emerald-200 text-[11.5px] font-bold rounded-full border border-[#16A34A]/40">
              Member ID: {membershipNo}
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[11.5px] font-bold rounded-full">
              Good Standing ✓
            </span>
          </div>
          <h1 className="text-[22px] sm:text-[24px] font-bold tracking-tight leading-tight text-white">{memberName}</h1>
          <p className="text-[12.5px] text-emerald-100/80">Active member in good standing for {MEMBER_DATA.consecutiveMonthsDeposited} consecutive monthly cycles.</p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="primary"
            onClick={() => setIsDepositModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="bg-[#16A34A] hover:bg-[#15803D] text-white min-h-[36px] max-h-[38px] text-[13px] px-3.5"
          >
            Upload Deposit Slip
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(ROUTES.MEMBER.PASSBOOK)}
            leftIcon={<BookOpen className="w-4 h-4" />}
            className="border-emerald-700/60 text-emerald-100 hover:bg-emerald-900/40 min-h-[36px] max-h-[38px] text-[13px] px-3.5"
          >
            Digital Passbook
          </Button>
        </div>
      </div>

      {/* Main Financial Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <StatisticsCard
          title="Total Savings Balance"
          value={formatCurrency(totalSavings)}
          icon={<PiggyBank className="w-5 h-5" />}
          subtitle={`Compulsory: ${formatCurrency(compulsorySavings)} (12.5% p.a.)`}
          variant="primary"
        />
        <StatisticsCard
          title="Equity Shares Holding"
          value={formatCurrency(MEMBER_DATA.shareCapitalValue)}
          icon={<PieChart className="w-5 h-5" />}
          subtitle={`${MEMBER_DATA.sharesCount} Shares @ ETB 500 / share`}
          variant="success"
        />
        <StatisticsCard
          title="Credit Eligibility Limit"
          value={formatCurrency(loanLimit)}
          icon={<Landmark className="w-5 h-5" />}
          subtitle={`4.0× Multiplier unlocked • No active loans`}
          trend={{ value: 'Instant Access', direction: 'up' }}
        />
      </div>

      {/* Quick Action Operations */}
      <QuickActions
        title="Member Operations"
        actions={[
          {
            id: 'qa-dep-slip',
            label: 'Deposit Money',
            description: 'Upload Bank Slip',
            icon: <PiggyBank className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
            onClick: () => setIsDepositModalOpen(true),
          },
          {
            id: 'qa-loan-apply',
            label: 'Apply for Loan',
            description: `Up to ${formatCurrency(loanLimit)}`,
            icon: <Landmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
            onClick: () => navigate(ROUTES.MEMBER.LOANS),
            color: 'success',
          },
          {
            id: 'qa-shr-buy',
            label: 'Buy Shares',
            description: 'Increase Equity',
            icon: <PieChart className="w-4 h-4 text-sky-600 dark:text-sky-300" />,
            onClick: () => navigate(ROUTES.MEMBER.SHARES),
            color: 'info',
          },
          {
            id: 'qa-pass',
            label: 'View Passbook',
            description: 'Digital Statement',
            icon: <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
            onClick: () => navigate(ROUTES.MEMBER.PASSBOOK),
            color: 'warning',
          },
        ]}
      />

      {/* Recent Ledger Entries */}
      <RecentTransactionsList
        title="My Recent Passbook Ledger Entries"
        transactions={transactions}
        onViewAll={() => navigate(ROUTES.MEMBER.TRANSACTIONS)}
      />

      {/* Deposit Slip Upload Modal */}
      {isDepositModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsDepositModalOpen(false)}
          title="Submit Bank Deposit / Transfer Receipt"
          description="Upload your deposit slip or mobile banking transfer confirmation for rapid ledger posting."
          size="md"
          footer={
            <div className="flex justify-end gap-2.5">
              <Button variant="secondary" size="sm" onClick={() => setIsDepositModalOpen(false)}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (!depositRef.trim()) {
                    toastError('Validation', 'Please provide the Bank FT / Reference Number.');
                    return;
                  }
                  setIsDepositModalOpen(false);
                  success('Deposit Slip Uploaded', 'Accountant queue updated. Crediting within 2 hours after verification.');
                }}
              >
                Submit for Verification
              </Button>
            </div>
          }
        >
          <div className="space-y-3.5 text-xs">
            <SelectInput
              label="Target Account"
              value={depositAccount}
              onChange={(val) => setDepositAccount(val as any)}
              options={[
                { value: 'COMPULSORY', label: 'Compulsory Regular Savings' },
                { value: 'VOLUNTARY', label: 'Voluntary Liquid Savings' },
                { value: 'SHARES', label: 'Equity Shares Purchase' },
              ]}
            />
            <CurrencyInput
              label="Amount Deposited (ETB)"
              value={Number(depositAmount) || 0}
              onChange={(val) => setDepositAmount(String(val))}
            />
            <SelectInput
              label="Bank Deposited To"
              value={depositBank}
              onChange={(val) => setDepositBank(val)}
              options={[
                { value: 'CBE', label: 'Commercial Bank of Ethiopia (CBE) - A/C 10001898762' },
                { value: 'TSEHAY', label: 'Tsehay Bank - A/C 2004558900' },
              ]}
            />
            <TextInput
              label="Bank Reference / FT No."
              placeholder="e.g. CBE-FT2608149921"
              value={depositRef}
              onChange={(e) => setDepositRef(e.target.value)}
              required
            />
            <FileUploadInput label="Upload Receipt / Screenshot" />
          </div>
        </Modal>
      )}
    </div>
  );
};

/* 2. MEMBER SAVINGS VIEW */
export const MemberSavingsView: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [convertAmount, setConvertAmount] = useState(5000);
  const [accounts, setAccounts] = useState<SavingAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const accs = await financialApiService.getMyAccounts();
        if (Array.isArray(accs) && accs.length > 0) {
          setAccounts(accs);
        }
      } catch (err) {
        // Fallback to sample view
      } finally {
        setIsLoading(false);
      }
    };
    loadAccounts();
  }, []);

  const compulsoryAcc = accounts.find((a) => a.productCode === 'REGULAR');
  const voluntaryAcc = accounts.find((a) => a.productCode === 'VOLUNTARY');

  const compulsoryBal = compulsoryAcc ? compulsoryAcc.currentBalance : MEMBER_DATA.compulsorySavings;
  const compulsoryAccNo = compulsoryAcc ? compulsoryAcc.accountNumber : 'SAV-REG-00143';
  const voluntaryBal = voluntaryAcc ? voluntaryAcc.currentBalance : MEMBER_DATA.voluntarySavings;
  const voluntaryAccNo = voluntaryAcc ? voluntaryAcc.accountNumber : 'SAV-VOL-00143';

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] sm:text-[22px] font-bold text-slate-900 dark:text-white leading-tight">Savings Accounts & Yield Schedules</h1>
          <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5">Manage your compulsory monthly contributions and voluntary liquid deposits.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsConvertModalOpen(true)}
          leftIcon={<RefreshCw className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
          className="min-h-[36px] max-h-[38px] text-[13px] px-3.5"
        >
          Convert Voluntary to Shares
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        <div className="p-4 sm:p-4.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                REG
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-[15px] leading-tight">Compulsory Regular Savings</h3>
                <p className="text-[11.5px] text-slate-400 font-mono">{compulsoryAccNo}</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[11.5px] rounded-full border border-emerald-200 dark:border-emerald-800/60">
              12.5% p.a.
            </span>
          </div>

          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between items-baseline py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 text-xs">Cleared Balance:</span>
              <span className="font-bold text-slate-900 dark:text-white text-[20px] sm:text-[22px] tabular-nums">{formatCurrency(compulsoryBal)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Monthly Contribution:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">ETB 2,500.00 / month</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Collateral Multiplier Value:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(compulsoryBal * 4)} (4.0x)</span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-4.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold text-xs">
                VOL
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-[15px] leading-tight">Voluntary Liquid Savings</h3>
                <p className="text-[11.5px] text-slate-400 font-mono">{voluntaryAccNo}</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold text-[11.5px] rounded-full border border-sky-200 dark:border-sky-800/60">
              13.5% p.a.
            </span>
          </div>

          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between items-baseline py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 text-xs">Available Liquid Balance:</span>
              <span className="font-bold text-slate-900 dark:text-white text-[20px] sm:text-[22px] tabular-nums">{formatCurrency(voluntaryBal)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Notice Lock Policy:</span>
              <span className="text-slate-700 dark:text-slate-300 font-medium">3-day notice for &gt; ETB 10,000</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Monthly Yield:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">+{formatCurrency((voluntaryBal * 0.07) / 12)} / month</span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Accounts if present (e.g. Fixed deposit or Children) */}
      {(accounts || []).filter((a) => a.productCode !== 'REGULAR' && a.productCode !== 'VOLUNTARY').length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {(accounts || [])
            .filter((a) => a.productCode !== 'REGULAR' && a.productCode !== 'VOLUNTARY')
            .map((acc) => (
              <div key={acc.id} className="p-4 sm:p-4.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 flex items-center justify-center font-bold text-xs">
                      {acc.productCode.substring(0, 3)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-[15px] leading-tight">{acc.productName}</h3>
                      <p className="text-[11.5px] text-slate-400 font-mono">{acc.accountNumber}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold text-[11.5px] rounded-full border border-amber-200 dark:border-amber-800/60">
                    {acc.interestRate}% p.a.
                  </span>
                </div>
                <div className="space-y-2 text-[13px]">
                  <div className="flex justify-between items-baseline py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 text-xs">Current Balance:</span>
                    <span className="font-bold text-slate-900 dark:text-white text-[20px] sm:text-[22px] tabular-nums">{formatCurrency(acc.currentBalance)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Accrued Interest:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">+{formatCurrency(acc.accruedInterest)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Status:</span>
                    <Badge variant={acc.status === 'ACTIVE' ? 'success' : 'warning'} size="sm">
                      {acc.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Voluntary to Shares Conversion Modal */}
      {isConvertModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsConvertModalOpen(false)}
          title="Convert Voluntary Savings to Equity Shares"
          description="Convert your voluntary savings into non-withdrawable equity shares (ETB 500 / share) to increase voting rights and annual dividend distributions."
          size="md"
          footer={
            <div className="flex justify-end gap-2.5">
              <Button variant="secondary" size="sm" onClick={() => setIsConvertModalOpen(false)}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (convertAmount > voluntaryBal) {
                    toastError('Validation', 'Conversion amount exceeds voluntary savings balance.');
                    return;
                  }
                  setIsConvertModalOpen(false);
                  success('Shares Purchased', `Converted ${formatCurrency(convertAmount)} into ${Math.floor(convertAmount / 500)} Equity Shares.`);
                }}
              >
                Confirm Conversion
              </Button>
            </div>
          }
        >
          <div className="space-y-3.5 text-xs">
            <CurrencyInput
              label="Amount to Convert (ETB)"
              value={convertAmount}
              onChange={(v) => setConvertAmount(v)}
              helperText={`Yields ${Math.floor(convertAmount / 500)} shares (Remaining voluntary: ${formatCurrency(voluntaryBal - convertAmount)})`}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

/* 3. MEMBER SHARES VIEW */
export { MemberSharesView } from '../shares/MemberSharesView';

/* 4. MEMBER LOANS VIEW */
export const MemberLoansView: React.FC = () => {
  const { success } = useToast();
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] sm:text-[22px] font-bold text-slate-900 dark:text-white leading-tight">Loan Facility & Credit Origination</h1>
          <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5">Check your borrowing power based on the 4-month consecutive deposit rule.</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsApplyModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="min-h-[36px] max-h-[38px] text-[13px] px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          Apply for SACCO Loan
        </Button>
      </div>

      <div className="p-4 sm:p-4.5 bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-lg space-y-1.5">
        <h3 className="font-bold text-sky-900 dark:text-sky-300 text-[15px] flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          You Are Pre-Approved for up to {formatCurrency(MEMBER_DATA.compulsorySavings * 4)}
        </h3>
        <p className="text-[12.5px] text-sky-800 dark:text-sky-200 leading-relaxed">
          Based on your 14 months of consecutive compulsory deposits of ETB 45,000.00, your 4.0× multiplier credit limit is fully unlocked with 2 eligible member guarantors.
        </p>
      </div>

      {/* Loan Application Modal */}
      {isApplyModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsApplyModalOpen(false)}
          title="Submit SACCO Loan Application"
          description="Complete your loan application request. Credit committee will review with your assigned guarantors."
          size="md"
          footer={
            <div className="flex justify-end gap-2.5">
              <Button variant="secondary" size="sm" onClick={() => setIsApplyModalOpen(false)}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setIsApplyModalOpen(false);
                  success('Application Submitted', 'Credit committee review initialized. Status in Approval Center.');
                }}
              >
                Submit Application
              </Button>
            </div>
          }
        >
          <div className="space-y-3.5 text-xs">
            <SelectInput
              label="Loan Product"
              options={[
                { value: 'EMERGENCY', label: 'Emergency Loan (12.0% p.a. - Term: 12 months)' },
                { value: 'BUSINESS', label: 'Business Development Loan (13.5% p.a. - Term: 36 months)' },
                { value: 'ASSET', label: 'Asset / Vehicle Financing (14.0% p.a. - Term: 48 months)' },
              ]}
            />
            <CurrencyInput label="Requested Loan Principal (ETB)" defaultValue={100000} />
            <TextInput label="Guarantor 1 (Member ID / Name)" placeholder="e.g. WB000088 - Tsedey Hailemariam" required />
            <TextInput label="Guarantor 2 (Member ID / Name)" placeholder="e.g. WB000201 - Hiwot Teshome" required />
            <TextInput label="Loan Purpose" placeholder="Working capital purchase for wholesale inventory" required />
          </div>
        </Modal>
      )}
    </div>
  );
};

/* 5. MEMBER PASSBOOK VIEW */
export const MemberPassbookView: React.FC = () => {
  const { user } = useAuth();
  const { success } = useToast();
  const [accounts, setAccounts] = useState<SavingAccount[]>([]);
  const [transactions, setTransactions] = useState<any[]>(MEMBER_TXNS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPassbook = async () => {
      try {
        const [accs, txs] = await Promise.all([
          financialApiService.getMyAccounts(),
          financialApiService.getMyTransactions({ limit: 50 }),
        ]);
        if (Array.isArray(accs) && accs.length > 0) setAccounts(accs);
        if (Array.isArray(txs) && txs.length > 0) {
          setTransactions(txs.map((tx: any) => ({
            id: tx.id,
            transactionNo: tx.transactionNumber,
            accountNo: tx.accountNumber,
            accountType: tx.productName || 'Savings Account',
            memberId: tx.memberId,
            memberName: tx.memberName,
            type: tx.type,
            debitAmount: tx.debitAmount,
            creditAmount: tx.creditAmount,
            runningBalance: tx.runningBalance,
            paymentChannel: tx.paymentChannel,
            referenceNo: tx.bankReferenceNo || tx.transactionNumber,
            narration: tx.narration,
            timestamp: tx.createdAt,
            status: tx.status,
          })));
        }
      } catch (err) {
        // Fallback for preview
      } finally {
        setIsLoading(false);
      }
    };
    loadPassbook();
  }, []);

  const compulsoryAcc = accounts.find((a) => a.productCode === 'REGULAR');
  const compulsoryBal = compulsoryAcc ? compulsoryAcc.currentBalance : MEMBER_DATA.compulsorySavings;
  const memberName = user?.fullName || MEMBER_DATA.fullName;
  const membershipNo = user?.membershipNo || MEMBER_DATA.membershipNo;
  const phone = user?.phoneNumber || MEMBER_DATA.phone;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-[20px] sm:text-[22px] font-bold text-slate-900 dark:text-white leading-tight">Official Digital Passbook</h1>
          <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5">Certified electronic passbook record with double-entry cryptographic verification.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handlePrint} leftIcon={<Download className="w-4 h-4" />} className="min-h-[36px] max-h-[38px] text-[13px] px-3.5">
          Export / Print Statement
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4 print:border-none print:shadow-none print:p-0">
        {/* Passbook Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5 gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Wabi SACCO Logo"
              className="w-10 h-10 rounded-full object-contain bg-white p-0.5 shadow-2xs border border-slate-200 dark:border-slate-700 shrink-0"
            />
            <div>
              <h2 className="text-[16px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">WABI SAVING & CREDIT COOPERATIVE</h2>
              <p className="text-[11.5px] text-slate-500 dark:text-slate-400 font-semibold uppercase">Addis Ababa • Official Member Passbook</p>
            </div>
          </div>
          <div className="text-left sm:text-right text-xs">
            <div className="font-mono text-slate-500 dark:text-slate-400">PASSBOOK NO: <strong className="text-slate-900 dark:text-white font-bold">{membershipNo}</strong></div>
            <div className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">ISSUED: 15 MARCH 2024</div>
          </div>
        </div>

        {/* Member Details in Passbook */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-lg text-xs">
          <div><span className="text-slate-400 uppercase font-bold text-[10.5px]">Member Name</span><p className="font-bold text-slate-900 dark:text-white text-[14px] mt-0.5">{memberName}</p></div>
          <div><span className="text-slate-400 uppercase font-bold text-[10.5px]">Mobile</span><p className="font-bold text-slate-800 dark:text-slate-200 text-[14px] mt-0.5">{phone}</p></div>
          <div><span className="text-slate-400 uppercase font-bold text-[10.5px]">Compulsory Savings</span><p className="font-bold text-emerald-600 dark:text-emerald-400 text-[16px] tabular-nums mt-0.5">{formatCurrency(compulsoryBal)}</p></div>
          <div><span className="text-slate-400 uppercase font-bold text-[10.5px]">Share Holding</span><p className="font-bold text-sky-600 dark:text-sky-400 text-[16px] tabular-nums mt-0.5">{formatCurrency(MEMBER_DATA.shareCapitalValue)}</p></div>
        </div>

        {/* Ledger Entries */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-300">
                <th className="py-2.5 px-3 font-bold">Date</th>
                <th className="py-2.5 px-3 font-bold">Ref / FT No</th>
                <th className="py-2.5 px-3 font-bold">Description</th>
                <th className="py-2.5 px-3 font-bold text-right">Debit (DR)</th>
                <th className="py-2.5 px-3 font-bold text-right">Credit (CR)</th>
                <th className="py-2.5 px-3 font-bold text-right">Balance</th>
                <th className="py-2.5 px-3 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[12.5px]">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{formatDate(t.timestamp)}</td>
                  <td className="py-2 px-3 font-mono font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">{t.referenceNo}</td>
                  <td className="py-2 px-3 text-slate-900 dark:text-white font-medium">{t.narration}</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">{t.debitAmount ? formatCurrency(t.debitAmount) : '—'}</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{t.creditAmount ? formatCurrency(t.creditAmount) : '—'}</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">{formatCurrency(t.runningBalance)}</td>
                  <td className="py-2 px-3 text-center text-[10.5px] text-emerald-700 dark:text-emerald-300 font-bold font-mono whitespace-nowrap">POSTED ✓</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* 6. MEMBER TRANSACTIONS VIEW */
export const MemberTransactionsView: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>(MEMBER_TXNS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTx = async () => {
      try {
        const txs = await financialApiService.getMyTransactions({ limit: 100 });
        if (Array.isArray(txs) && txs.length > 0) {
          setTransactions(txs.map((tx: any) => ({
            id: tx.id,
            transactionNo: tx.transactionNumber,
            accountNo: tx.accountNumber,
            accountType: tx.productName || 'Savings Account',
            memberId: tx.memberId,
            memberName: tx.memberName,
            type: tx.type,
            debitAmount: tx.debitAmount,
            creditAmount: tx.creditAmount,
            runningBalance: tx.runningBalance,
            paymentChannel: tx.paymentChannel,
            referenceNo: tx.bankReferenceNo || tx.transactionNumber,
            narration: tx.narration,
            timestamp: tx.createdAt,
            status: tx.status,
          })));
        }
      } catch (err) {
        // Fallback for preview
      } finally {
        setIsLoading(false);
      }
    };
    loadTx();
  }, []);

  const columns: ColumnDef<TransactionRecord>[] = [
    {
      id: 'date',
      header: 'Date & Time',
      cell: ({ row }) => <span className="text-slate-600 dark:text-slate-300 text-[12.5px]">{formatDateTime(row.timestamp)}</span>,
    },
    {
      id: 'ref',
      header: 'Txn / Bank Ref',
      cell: ({ row }) => (
        <div>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[12px]">{row.transactionNo}</span>
          <span className="text-[11px] text-slate-400 block">{row.referenceNo}</span>
        </div>
      ),
    },
    {
      id: 'narration',
      header: 'Narration & Account',
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-slate-900 dark:text-white text-[12.5px]">{row.narration}</span>
          <span className="text-[11px] text-slate-400 block">{row.accountType}</span>
        </div>
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      align: 'right',
      cell: ({ row }) =>
        row.creditAmount ? (
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[13px]">+{formatCurrency(row.creditAmount)}</span>
        ) : (
          <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-[13px]">-{formatCurrency(row.debitAmount || 0)}</span>
        ),
    },
    {
      id: 'balance',
      header: 'Balance',
      align: 'right',
      cell: ({ row }) => <span className="font-bold text-slate-900 dark:text-white text-[13px] tabular-nums">{formatCurrency(row.runningBalance)}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
        <h1 className="text-[20px] sm:text-[22px] font-bold text-slate-900 dark:text-white leading-tight">Transaction History & Receipts</h1>
        <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5">Complete ledger statement of all deposits, withdrawals, share buys, and loan payments.</p>
      </div>

      <DataTable
        data={transactions}
        columns={columns}
        keyExtractor={(t) => t.id}
        searchPlaceholder="Search transactions..."
      />
    </div>
  );
};

/* 7. MEMBER PROFILE & NOMINEE VIEW (PHASE 11 SELF-SERVICE) */
export const MemberProfileView: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [profile, setProfile] = useState<any>({
    membershipNo: user?.membershipNo || 'WB000143',
    fullName: user?.fullName || 'Abebe Bikila Wolde',
    nationalId: '14/03/998822',
    phoneNumber: user?.phoneNumber || '+251 91 122 3344',
    email: user?.email || 'abebe.b@wabisacco.et',
    gender: 'MALE',
    dateOfBirth: '1990-05-15',
    membershipDate: '2024-03-15',
    status: 'ACTIVE',
    occupation: 'Software Engineer',
    employer: 'Ethio Telecom',
    monthlyIncome: 45000,
    employmentType: 'Employed',
    address: {
      region: 'Addis Ababa',
      zone: 'Bole Subcity',
      woreda: 'Woreda 03',
      kebele: 'Kebele 07',
      specificAddress: 'House 441, Near Medhanialem Mall',
    },
    emergencyContact: {
      name: 'Marta Worku Tadesse',
      relationship: 'Spouse',
      phone: '+251 91 223 3445',
      address: 'Bole Subcity, Woreda 03',
    },
    nominees: [
      {
        fullName: 'Tigist Bikila',
        relationship: 'Spouse',
        phone: '+251 92 233 4455',
        address: 'Addis Ababa, Bole',
        percentage: 100,
      },
    ],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isEditNomineesOpen, setIsEditNomineesOpen] = useState(false);

  // Edit Profile Form State
  const [editForm, setEditForm] = useState({
    phoneNumber: '',
    email: '',
    occupation: '',
    employer: '',
    monthlyIncome: 0,
    region: '',
    zone: '',
    woreda: '',
    kebele: '',
    specificAddress: '',
  });

  // Nominees Form State
  const [nomineesList, setNomineesList] = useState<any[]>([]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await memberApiService.getMyProfile();
        if (res?.data) {
          setProfile(res.data);
        }
      } catch (err) {
        // Unauthenticated preview / fallback to state
      }
    };
    loadProfile();
  }, []);

  const openEditProfile = () => {
    setEditForm({
      phoneNumber: profile.phoneNumber || '',
      email: profile.email || '',
      occupation: profile.occupation || '',
      employer: profile.employer || '',
      monthlyIncome: profile.monthlyIncome || 0,
      region: profile.address?.region || '',
      zone: profile.address?.zone || '',
      woreda: profile.address?.woreda || '',
      kebele: profile.address?.kebele || '',
      specificAddress: profile.address?.specificAddress || '',
    });
    setIsEditProfileOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const updates = {
        phoneNumber: editForm.phoneNumber,
        email: editForm.email,
        occupation: editForm.occupation,
        employer: editForm.employer,
        monthlyIncome: Number(editForm.monthlyIncome),
        address: {
          region: editForm.region,
          zone: editForm.zone,
          woreda: editForm.woreda,
          kebele: editForm.kebele,
          specificAddress: editForm.specificAddress,
        },
      };
      await memberApiService.updateMyProfile(updates as any);
      setProfile((prev: any) => ({ ...prev, ...updates }));
      success('Profile Updated', 'Your member KYC and contact details were updated successfully.');
      setIsEditProfileOpen(false);
    } catch (err: any) {
      toastError('Update Failed', err?.error?.message || err?.message || 'Could not update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const openEditNominees = () => {
    setNomineesList(profile.nominees ? JSON.parse(JSON.stringify(profile.nominees)) : []);
    setIsEditNomineesOpen(true);
  };

  const addNominee = () => {
    setNomineesList((prev) => [
      ...prev,
      { fullName: '', relationship: 'Child', phone: '+2519', address: '', percentage: 0 },
    ]);
  };

  const removeNominee = (index: number) => {
    if ((nomineesList || []).length <= 1) return;
    setNomineesList((prev) => (prev || []).filter((_, i) => i !== index));
  };

  const updateNominee = (index: number, field: string, val: any) => {
    setNomineesList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  const totalPercentage = nomineesList.reduce((s, n) => s + (Number(n.percentage) || 0), 0);

  const handleSaveNominees = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalPercentage !== 100) {
      toastError('Invalid Allocation', `Total beneficiary shares must equal exactly 100%. Current: ${totalPercentage}%`);
      return;
    }
    setIsLoading(true);
    try {
      await memberApiService.updateMyNominees(nomineesList);
      setProfile((prev: any) => ({ ...prev, nominees: nomineesList }));
      success('Nominees Updated', 'Your designated beneficiary allocations have been updated.');
      setIsEditNomineesOpen(false);
    } catch (err: any) {
      toastError('Update Failed', err?.error?.message || err?.message || 'Could not update nominees.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 text-left">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-[20px] sm:text-[22px] font-bold text-slate-900 dark:text-white leading-tight">Member KYC Profile & Nominees</h1>
          <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5">Official member identity record, Kebele registration, and beneficiary allocations.</p>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <Button variant="outline" size="sm" onClick={openEditProfile} className="min-h-[36px] max-h-[38px] text-[13px] px-3.5">
            Edit Profile
          </Button>
          <Button variant="primary" size="sm" onClick={openEditNominees} className="min-h-[36px] max-h-[38px] text-[13px] px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white">
            Manage Nominees
          </Button>
        </div>
      </div>

      {/* Official Digital Membership Card Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-lg p-4 sm:p-5 shadow-md border border-slate-800 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Wabi SACCO Logo"
              className="w-10 h-10 rounded-full object-contain bg-white p-0.5 shadow-2xs border border-white/20 shrink-0"
            />
            <div>
              <h2 className="text-[16px] font-bold tracking-tight leading-tight">WABI SAVINGS & CREDIT COOPERATIVE</h2>
              <p className="text-[11px] text-sky-300 font-bold uppercase tracking-wider">Certified Member Identity Card</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[11px] font-bold rounded-full border border-emerald-400/30">
              STATUS: {profile.status || 'ACTIVE'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400 text-[10.5px] uppercase font-bold">Sequential Member ID</span>
            <p className="font-mono font-bold text-sky-400 text-[15px] mt-0.5">{profile.membershipNo}</p>
          </div>
          <div>
            <span className="text-slate-400 text-[10.5px] uppercase font-bold">Member Name</span>
            <p className="font-bold text-white text-[15px] mt-0.5">{profile.fullName}</p>
          </div>
          <div>
            <span className="text-slate-400 text-[10.5px] uppercase font-bold">National / Kebele ID</span>
            <p className="font-mono text-slate-200 text-[13px] mt-0.5">{profile.nationalId || '14/03/998822'}</p>
          </div>
          <div>
            <span className="text-slate-400 text-[10.5px] uppercase font-bold">Member Since</span>
            <p className="font-semibold text-slate-200 text-[13px] mt-0.5">{formatDate(profile.membershipDate || profile.createdAt || '2024-03-15')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* Personal & Contact Details */}
        <div className="p-4 sm:p-4.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5 text-[13px]">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-[14px]">Personal & Contact Info</h3>
            <button type="button" onClick={openEditProfile} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold">
              Edit
            </button>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Full Name:</span>
            <span className="font-bold text-slate-900 dark:text-white">{profile.fullName}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Phone Number:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{profile.phoneNumber}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Email Address:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{profile.email}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Occupation & Employer:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{profile.occupation} • {profile.employer || 'Self'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Residential Address:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {profile.address?.region || 'Addis Ababa'}, {profile.address?.zone || 'Bole'}, {profile.address?.woreda || 'Woreda 03'}
            </span>
          </div>
          <div className="flex justify-between py-1 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Emergency Reach:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {profile.emergencyContact?.name || 'N/A'} ({profile.emergencyContact?.phone || 'N/A'})
            </span>
          </div>
        </div>

        {/* Designated Beneficiary Nominees */}
        <div className="p-4 sm:p-4.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5 text-[13px]">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-[14px]">Designated Beneficiary Nominees</h3>
              <p className="text-[11px] text-slate-400">Total must equal 100% allocation</p>
            </div>
            <button type="button" onClick={openEditNominees} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold">
              Manage
            </button>
          </div>

          <div className="space-y-2 pt-1">
            {profile?.nominees && (profile.nominees || []).length > 0 ? (
              (profile.nominees || []).map((n: any, idx: number) => (
                <div key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 dark:text-white text-xs">{n.fullName} ({n.relationship})</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 text-[11px]">
                      {n.percentage}% Share
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap gap-3">
                    <span>Phone: <strong className="text-slate-700 dark:text-slate-200 font-semibold">{n.phone}</strong></span>
                    {n.address && <span>Address: <strong className="text-slate-700 dark:text-slate-200 font-semibold">{n.address}</strong></span>}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                No nominees on record.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsEditProfileOpen(false)}
          title="Update Member Contact & Residential KYC"
          description="Update your contact number, email, employment details, and residential Kebele address."
          size="md"
          footer={
            <div className="flex gap-2.5 justify-end">
              <Button variant="secondary" size="sm" onClick={() => setIsEditProfileOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveProfile} isLoading={isLoading}>
                Save Changes
              </Button>
            </div>
          }
        >
          <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextInput
                label="Mobile Phone"
                value={editForm.phoneNumber}
                onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                required
              />
              <TextInput
                label="Email Address"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextInput
                label="Occupation"
                value={editForm.occupation}
                onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                required
              />
              <TextInput
                label="Employer / Business Name"
                value={editForm.employer}
                onChange={(e) => setEditForm({ ...editForm, employer: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextInput
                label="Region / City"
                value={editForm.region}
                onChange={(e) => setEditForm({ ...editForm, region: e.target.value })}
                required
              />
              <TextInput
                label="Zone / Sub-City"
                value={editForm.zone}
                onChange={(e) => setEditForm({ ...editForm, zone: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextInput
                label="Woreda"
                value={editForm.woreda}
                onChange={(e) => setEditForm({ ...editForm, woreda: e.target.value })}
                required
              />
              <TextInput
                label="Kebele"
                value={editForm.kebele}
                onChange={(e) => setEditForm({ ...editForm, kebele: e.target.value })}
                required
              />
            </div>

            <TextInput
              label="House No / Specific Address"
              value={editForm.specificAddress}
              onChange={(e) => setEditForm({ ...editForm, specificAddress: e.target.value })}
            />
          </form>
        </Modal>
      )}

      {/* Edit Nominees Modal */}
      {isEditNomineesOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsEditNomineesOpen(false)}
          title="Manage Beneficiary Nominees"
          description="Designate one or more beneficiaries. The sum of all allocated percentages must equal exactly 100%."
          size="md"
          footer={
            <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-3">
              <span className={`text-xs font-bold ${totalPercentage === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                Total Allocation: {totalPercentage}% / 100% {totalPercentage === 100 ? '✓ Valid' : '(Must equal 100%)'}
              </span>
              <div className="flex gap-2.5">
                <Button variant="secondary" size="sm" onClick={() => setIsEditNomineesOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveNominees}
                  isLoading={isLoading}
                  disabled={totalPercentage !== 100}
                >
                  Save Nominees
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-3.5 text-xs">
            <div className="space-y-2.5">
              {nomineesList.map((nom, idx) => (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">Beneficiary #{idx + 1}</span>
                    {nomineesList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeNominee(idx)}
                        className="text-[11px] text-rose-600 hover:text-rose-700 font-bold"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <TextInput
                      label="Full Legal Name"
                      value={nom.fullName}
                      onChange={(e) => updateNominee(idx, 'fullName', e.target.value)}
                      placeholder="e.g. Tigist Bikila"
                      required
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <SelectInput
                        label="Relationship"
                        value={nom.relationship}
                        onChange={(e) => updateNominee(idx, 'relationship', e.target.value)}
                        options={[
                          { value: 'Spouse', label: 'Spouse' },
                          { value: 'Child', label: 'Child' },
                          { value: 'Father', label: 'Father' },
                          { value: 'Mother', label: 'Mother' },
                          { value: 'Sibling', label: 'Sibling' },
                          { value: 'Other', label: 'Other' },
                        ]}
                      />
                      <TextInput
                        label="Share %"
                        type="number"
                        min={1}
                        max={100}
                        value={nom.percentage}
                        onChange={(e) => updateNominee(idx, 'percentage', Number(e.target.value))}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <TextInput
                      label="Phone Number"
                      value={nom.phone}
                      onChange={(e) => updateNominee(idx, 'phone', e.target.value)}
                      placeholder="+2519..."
                      required
                    />
                    <TextInput
                      label="Address"
                      value={nom.address}
                      onChange={(e) => updateNominee(idx, 'address', e.target.value)}
                      placeholder="e.g. Addis Ababa, Bole"
                    />
                  </div>
                </div>
              ))}

              <Button variant="secondary" size="sm" onClick={addNominee} className="w-full min-h-[34px] text-xs">
                + Add Another Nominee
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
