export type SavingsProductType = 
  | 'REGULAR' 
  | 'VOLUNTARY' 
  | 'CHILDREN' 
  | 'TIME_DEPOSIT';

export type AccountStatus = 
  | 'ACTIVE' 
  | 'PENDING' 
  | 'SUSPENDED' 
  | 'DORMANT' 
  | 'CLOSED' 
  | 'LOCKED';

export type LoanStatus = 
  | 'DRAFT' 
  | 'SUBMITTED' 
  | 'VERIFIED' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'DISBURSED' 
  | 'ACTIVE' 
  | 'OVERDUE' 
  | 'CLOSED_SETTLED';

export type TransactionType = 
  | 'DEPOSIT' 
  | 'WITHDRAWAL' 
  | 'TRANSFER'
  | 'SHARE_PURCHASE' 
  | 'SHARE_CONVERT' 
  | 'LOAN_DISBURSEMENT' 
  | 'LOAN_REPAYMENT' 
  | 'INTEREST_CREDIT' 
  | 'INTEREST_POSTING'
  | 'PENALTY_FEE' 
  | 'REVERSAL'
  | 'ADJUSTMENT';

export type PaymentChannel =
  | 'CASH_OFFICE'
  | 'CBE_BANK'
  | 'TSEHAY_BANK'
  | 'TELEBIRR'
  | 'AWASH_BANK'
  | 'INTERNAL_TRANSFER'
  | 'SYSTEM_AUTOMATED';

export interface MonetaryAmount {
  currency: 'ETB';
  amount: number;
}

export interface SavingProduct {
  id: string;
  code: SavingsProductType;
  name: string;
  description: string;
  currency: 'ETB';
  minMonthlyDeposit: number;
  minOpeningBalance: number;
  annualInterestRate: number;
  interestCalculationMethod: 'MIN_MONTHLY_BALANCE' | 'AVERAGE_DAILY_BALANCE' | 'SIMPLE_MATURITY';
  interestPostingFrequency: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL' | 'AT_MATURITY';
  withdrawalHoldingDays: number;
  earlyWithdrawalPenaltyPercent: number;
  allowPartialWithdrawal: boolean;
  requiresGuardian: boolean;
  isTimeDeposit: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  glLiabilityAccountId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavingAccount {
  id: string;
  accountNo: string;
  memberId: string;
  membershipNo: string;
  memberName: string;
  productId: string;
  productCode: SavingsProductType;
  productName: string;
  currency: 'ETB';
  balance: number;
  clearedBalance?: number;
  heldBalance?: number;
  availableBalance?: number;
  accruedInterest: number;
  lastInterestCalculationDate: string;
  guardianName?: string;
  guardianRelationship?: string;
  termMonths?: number;
  expectedMaturityDate?: string;
  maturityAction?: 'AUTO_RENEW' | 'TRANSFER_TO_VOLUNTARY' | 'PAYOUT';
  status: AccountStatus;
  openingDate: string;
  closedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DepositBatch {
  id: string;
  accountId: string;
  accountNo: string;
  memberId: string;
  transactionId: string;
  amount: number;
  remainingAmount: number;
  depositDate: string;
  clearedDate: string;
  isCleared: boolean;
  createdAt: string;
}

export interface FinancialTransaction {
  id: string;
  transactionNo: string;
  memberId: string;
  membershipNo: string;
  memberName: string;
  accountId: string;
  accountNo: string;
  productCode: SavingsProductType;
  type: TransactionType;
  amount: number;
  debitAmount: number | null;
  creditAmount: number | null;
  balanceBefore: number;
  balanceAfter: number;
  paymentChannel: PaymentChannel;
  bankReferenceNo?: string;
  narration: string;
  idempotencyKey?: string;
  status: 'PENDING_APPROVAL' | 'POSTED' | 'REJECTED' | 'REVERSED';
  requiresApproval: boolean;
  createdById: string;
  createdByName: string;
  approvedById?: string;
  approvedByName?: string;
  isReversed?: boolean;
  reversedAt?: string;
  reversalTransactionId?: string;
  rejectionReason?: string;
  timestamp: string;
  createdAt: string;
}

export interface FinancialApproval {
  id: string;
  transactionId: string;
  transactionNo: string;
  type: 'LARGE_WITHDRAWAL' | 'TRANSACTION_REVERSAL' | 'ACCOUNT_CLOSURE' | 'FEE_WAIVER';
  amount: number;
  currency: 'ETB';
  memberId: string;
  membershipNo: string;
  memberName: string;
  accountId: string;
  accountNo: string;
  requestedById: string;
  requestedByName: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedById?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  comments?: string;
  createdAt: string;
}

export interface MonthlySavingsSchedule {
  id: string;
  memberId: string;
  membershipNo: string;
  memberName: string;
  accountId: string;
  accountNo: string;
  yearMonth: string; // e.g. "2026-08"
  expectedAmount: number;
  actualDeposited: number;
  shortfall: number;
  status: 'MET' | 'SHORTFALL' | 'EXEMPT';
  lastDepositDate?: string;
  updatedAt: string;
}

export interface ChartOfAccount {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';
  balance: number;
  currency: 'ETB';
  description: string;
}

export interface JournalLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
}

export interface JournalEntry {
  id: string;
  journalNo: string;
  transactionId: string;
  transactionReference: string;
  date: string;
  narration: string;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  postedBy: string;
  status: 'POSTED' | 'VOIDED';
  createdAt: string;
}

export interface InterestPostingRun {
  id: string;
  runDate: string;
  periodStart: string;
  periodEnd: string;
  productCode: SavingsProductType | 'ALL';
  totalAccountsProcessed: number;
  totalInterestPosted: number;
  status: 'COMPLETED' | 'FAILED';
  executedById: string;
  executedByName: string;
  createdAt: string;
}

export interface SaccoBranchLocation {
  id: string;
  name: string;
  nameAmharic: string;
  address: string;
  addressAmharic: string;
  phone: string;
  isMainBranch?: boolean;
}

export interface SaccoDepositBankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  isDefault: boolean;
}

export interface SaccoInstitutionProfile {
  name: string;
  amharicName: string;
  legalName: string;
  legalNameAmharic: string;
  licenseNumber: string;
  slogan: string;
  amharicSlogan: string;
  email: string;
  hotline1: string;
  hotline2: string;
  supportTelegram: string;
  headOfficeAddress: string;
  headOfficeAddressAmharic: string;
  registrationFee: number;
  branchLocations: SaccoBranchLocation[];
  bankAccounts: SaccoDepositBankAccount[];
}

export interface SystemSettings {
  largeWithdrawalThreshold: number;
  regularMinMonthlySaving: number;
  voluntaryHoldingDays: number;
  allowOverdraft: boolean;
  institutionName: string;
  baseCurrency: 'ETB' | string;
  sharePrice: number;
  minRequiredShares: number;
  minShareValue: number;
  shareDividendRate: number;
  registrationFee?: number;
  defaultLoanInterestRate: number;
  loanLatePenaltyRatePercent: number;
  loanLateGraceDays: number;
  loanMaxActivePerMember: number;
  loanMaxGuaranteePerMember: number;
  loanMinContinuousSavingsMonths: number;
  loanMinMonthlySavingsAmount: number;
  loanMinShareRequirement: number;
  loanSavingsMultiplier: number;
  institutionProfile?: SaccoInstitutionProfile;
  savingsRules?: {
    regularMinMonthlySaving: number;
    regularMinOpeningBalance: number;
    regularInterestRate: number;
    voluntaryMinDeposit: number;
    voluntaryHoldingDays: number;
    voluntaryInterestRate: number;
    childrenMinMonthlySaving: number;
    childrenInterestRate: number;
    childrenMaxAgeYears: number;
    timeDepositMinAmount: number;
    timeDepositPenaltyPercent: number;
    timeDepositInterestRates: {
      months3: number;
      months6: number;
      months12: number;
      months24: number;
      months36: number;
    };
    interestCalculationPeriod: string;
    withdrawalWaitingPeriodDays: number;
  };
  shareRules?: {
    sharePrice: number;
    minRequiredShares: number;
    maxAllowedShares: number;
    minShareValue: number;
    shareDividendRate: number;
    allowVoluntaryConversion: boolean;
    shareTransferLockMonths: number;
    shareTransferFeePercent: number;
    maxShareholdingPercentage: number;
  };
  loanRules?: {
    defaultInterestRate: number;
    latePenaltyRatePercent: number;
    lateGraceDays: number;
    maxActiveLoansPerMember: number;
    maxGuaranteesPerMember: number;
    minContinuousSavingsMonths: number;
    savingsMultiplier: number;
    minShareRequirement: number;
    makerCheckerThreshold: number;
    managerApprovalThreshold: number;
    boardApprovalThreshold: number;
    maxLoanTermMonths: number;
  };
}

export interface SavingsAccountSummary {
  id: string | number;
  accountNo: string;
  productType: SavingsProductType;
  productName: string;
  balance: number;
  clearedBalance: number;
  heldBalance?: number;
  availableBalance?: number;
  accruedInterest: number;
  interestRate: number; // e.g. 6.0
  minMonthlyDeposit?: number;
  maturityDate?: string;
  status: AccountStatus;
  lastDepositDate?: string;
}

export interface ShareAccountSummary {
  id: string | number;
  accountNo: string;
  sharesCount: number;
  parValue: number; // 500 ETB
  totalValue: number;
  accruedDividends: number;
  status: AccountStatus;
}

export interface LoanAccountSummary {
  id: string | number;
  loanNo: string;
  productName: string;
  principalAmount: number;
  outstandingBalance: number;
  monthlyEmi: number;
  annualInterestRate: number;
  termMonths: number;
  paidInstallments: number;
  totalInstallments: number;
  nextPaymentDate: string;
  status: LoanStatus;
}

export interface TransactionRecord {
  id: string | number;
  transactionNo: string;
  accountNo: string;
  accountType: string;
  memberId: string | number;
  memberName: string;
  type: TransactionType;
  debitAmount: number | null;
  creditAmount: number | null;
  runningBalance: number;
  paymentChannel: string;
  referenceNo: string;
  narration: string;
  timestamp: string;
  status: 'POSTED' | 'PENDING' | 'REVERSED' | 'PENDING_APPROVAL' | 'REJECTED';
}

export interface MemberSummary {
  id: string | number;
  membershipNo: string;
  fullName: string;
  phoneNumber: string;
  nationalId: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'TERMINATED';
  totalSavings: number;
  totalShares: number;
  activeLoansCount: number;
  totalLoanBalance: number;
  joinedDate: string;
}

export interface ApprovalRequest {
  id: string | number;
  requestType: 'LOAN_APPROVAL' | 'LARGE_WITHDRAWAL' | 'TRANSACTION_REVERSAL' | 'MEMBER_TERMINATION' | 'FEE_WAIVER';
  memberId: string | number;
  memberName: string;
  membershipNo: string;
  amount: number;
  makerStaffId: string | number;
  makerStaffName: string;
  submissionDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  supportingDocUrl?: string;
}

export interface BankReceiptSlip {
  id: string | number;
  receiptNo: string;
  memberId: string | number;
  memberName: string;
  membershipNo: string;
  bankName: string;
  accountCredited: string;
  amount: number;
  bankReferenceNo: string;
  depositDate: string;
  targetAccountType: string;
  status: 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  uploadedAt: string;
  verifiedAt?: string;
  verifierStaffName?: string;
  rejectionReason?: string;
}

