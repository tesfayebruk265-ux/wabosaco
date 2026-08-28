export interface DbUser {
  id: string;
  username: string;
  email: string;
  phoneNumber: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  memberId?: string;
  passwordHash: string;
  salt: string;
  status: 'ACTIVE' | 'DEACTIVATED' | 'LOCKED' | 'PENDING_VERIFICATION';
  isActive: boolean;
  membershipNo?: string;
  avatarUrl?: string;
  aliases?: string[];
  failedLoginAttempts: number;
  lockedUntil?: string | null;
  passwordChangedAt: string;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DbRole {
  id: string;
  code: 'ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'AUDITOR' | 'CUSTOMER_SERVICE' | 'MEMBER';
  name: string;
  description: string;
  portalPrefix: string;
  isSystem: boolean;
  createdAt: string;
}

export interface DbPermission {
  id: string;
  code: string;
  name: string;
  module: string;
  description: string;
}

export interface DbRolePermission {
  roleId: string;
  permissionId: string;
}

export interface DbUserRole {
  userId: string;
  roleId: string;
  assignedAt: string;
  assignedBy?: string | null;
}

export interface DbRefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  familyId: string;
  isRevoked: boolean;
  replacedByTokenId?: string | null;
  createdAt: string;
  expiresAt: string;
  revokedAt?: string | null;
  deviceInfo: string;
  ipAddress: string;
}

export interface DbSession {
  id: string;
  userId: string;
  username?: string;
  userRole?: string;
  accessTokenId: string;
  browser: string;
  os: string;
  deviceType: 'DESKTOP' | 'MOBILE' | 'TABLET' | 'UNKNOWN';
  deviceName?: string;
  deviceFingerprint?: string;
  ipAddress: string;
  country?: string;
  city?: string;
  location?: string;
  createdAt: string;
  expiresAt: string;
  lastActivityAt: string;
  userAgent: string;
  isActive: boolean;
  isCurrent?: boolean;
  mfaVerified?: boolean;
  riskScore?: number;
}

export interface DbPasswordResetToken {
  id: string;
  userId: string;
  otpCode: string;
  token: string;
  expiresAt: string;
  isUsed: boolean;
  createdAt: string;
}

export interface DbLoginHistory {
  id: string;
  userId?: string | null;
  identifierAttempted: string;
  status: 'SUCCESS' | 'FAILED';
  failureReason?: string | null;
  ipAddress: string;
  userAgent: string;
  deviceInfo: string;
  timestamp: string;
}

export interface DbSecurityEvent {
  id: string;
  eventType:
    | 'LOGIN'
    | 'LOGOUT'
    | 'FAILED_LOGIN'
    | 'PASSWORD_CHANGE'
    | 'PASSWORD_RESET'
    | 'PASSWORD_CHANGED'
    | 'ACCOUNT_ACTIVATION'
    | 'ACCOUNT_DEACTIVATION'
    | 'ROLE_CHANGE'
    | 'PERMISSION_CHANGE'
    | 'TOKEN_REVOCATION'
    | 'SUSPICIOUS_ACTIVITY'
    | 'RATE_LIMIT_EXCEEDED'
    | 'REFRESH_TOKEN_REUSE_DETECTED'
    | 'SECURITY_POLICY_VIOLATION'
    | 'MFA_CHALLENGE'
    | 'MFA_ENABLED'
    | 'MFA_DISABLED'
    | 'EMERGENCY_LOCKDOWN'
    | 'DATABASE_BACKUP_COMPLETED'
    | 'EMERGENCY_LOCKDOWN_TRIGGERED'
    | 'SECURITY_ALERT_STATUS_CHANGED';
  userId?: string | null;
  actorId?: string | null;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
  timestamp: string;
}

export interface DbAuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  resource: string;
  resourceId: string;
  beforeState?: Record<string, any> | null;
  afterState?: Record<string, any> | null;
  result: 'SUCCESS' | 'FAILURE';
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface DbNominee {
  id: string;
  fullName: string;
  relationship: string;
  phone: string;
  address?: string;
  percentage: number;
}

export interface DbEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  address?: string;
}

export interface DbAddress {
  region: string;
  zone: string;
  woreda: string;
  kebele: string;
  specificAddress?: string;
  additionalInfo?: string;
}

export interface DbMember {
  id: string;
  userId: string;
  membershipNo: string; // Sequential: WB000001, WB000002...
  fullName: string;
  gender: 'MALE' | 'FEMALE';
  dateOfBirth: string; // YYYY-MM-DD
  nationalId: string; // Unique National / Kebele ID
  phoneNumber: string;
  email: string;
  address: DbAddress;
  occupation: string;
  employer: string;
  monthlyIncome: number;
  employmentType: 'Employed' | 'Self-employed' | 'Business Owner' | 'Student' | 'Unemployed' | 'Other';
  familyMembersCount: number;
  emergencyContact: DbEmergencyContact;
  nominees: DbNominee[]; // Must sum to 100%
  referral?: {
    referralType?: string;
    referralMemberNo?: string;
    referralInfo?: string;
  };
  profilePictureUrl?: string;
  profilePictureDocumentId?: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED' | 'REJECTED';
  approvedAt?: string | null;
  approvedBy?: string | null;
  suspendedAt?: string | null;
  suspendedReason?: string | null;
  terminatedAt?: string | null;
  terminatedReason?: string | null;
  membershipDate: string;
  // Legacy Data Migration Metadata
  legacyMemberId?: string; // Original SADV or Legacy ID (e.g. SADV-00124)
  legacyBookNumber?: string; // Original Book Number (e.g. BK-0892)
  legacyReceiptNumber?: string;
  legacySourceFile?: string;
  legacySourceSheet?: string;
  legacyRowNumber?: number;
  migrationBatchId?: string;
  isMigrated?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DbReceiptHistoryItem {
  id: string;
  receiptDocumentId?: string;
  receiptUrl?: string;
  paymentMethod: string;
  referenceNumber: string;
  amount: number;
  uploadedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  reviewedByName?: string | null;
  rejectionReason?: string | null;
}

export interface DbRegistrationRequest {
  id: string;
  applicationReference: string; // e.g. APP-2026-000123
  userId?: string;
  memberId?: string;
  membershipNo?: string;
  personalInfo: {
    fullName: string;
    gender: 'MALE' | 'FEMALE';
    dateOfBirth: string;
    nationalId: string;
  };
  contactInfo: {
    phoneNumber: string;
    email: string;
    username: string;
    passwordHash: string;
    salt: string;
  };
  address: DbAddress;
  employment: {
    occupation: string;
    employer: string;
    monthlyIncome: number;
    employmentType: 'Employed' | 'Self-employed' | 'Business Owner' | 'Student' | 'Unemployed' | 'Other';
  };
  family: {
    familyMembersCount: number;
  };
  emergencyContact: DbEmergencyContact;
  nominees: DbNominee[];
  referral?: {
    referralType?: string;
    referralMemberNo?: string;
    referralInfo?: string;
  };
  profilePhotoDocumentId?: string;
  profilePhotoUrl?: string;
  payment: {
    amount: number; // 1000 ETB
    paymentMethod: 'CBE' | 'Tsehay Bank' | 'Bank Transfer';
    referenceNumber: string;
    receiptDocumentId?: string;
    receiptUrl?: string;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  reviewedByName?: string | null;
  receiptHistory: DbReceiptHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface DbDocument {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  documentType: 'PROFILE_PHOTO' | 'RECEIPT' | 'NATIONAL_ID' | 'OTHER';
  storagePath: string;
  dataUrl?: string;
  uploadedBy: string;
  uploadedAt: string;
  accessAudit: Array<{
    accessedBy: string;
    accessedAt: string;
    action: string;
  }>;
}

export type NotificationChannel = 'IN_APP' | 'SMS' | 'EMAIL' | 'TELEGRAM';

export type NotificationCategory =
  | 'MEMBERSHIP'
  | 'SAVINGS'
  | 'SHARES'
  | 'LOANS'
  | 'ACCOUNTING'
  | 'SYSTEM'
  | 'MARKETING'
  | 'GENERAL';

export type NotificationEventCode =
  // Membership
  | 'REGISTRATION_SUBMITTED'
  | 'RECEIPT_APPROVED'
  | 'RECEIPT_REJECTED'
  | 'MEMBERSHIP_APPROVED'
  | 'MEMBERSHIP_ACTIVATED'
  | 'MEMBERSHIP_SUSPENDED'
  | 'MEMBERSHIP_TERMINATED'
  | 'RECEIPT_REPLACEMENT_REQUIRED'
  // Savings
  | 'SAVINGS_DEPOSIT_SUCCESSFUL'
  | 'SAVINGS_DEPOSIT_CONFIRMED'
  | 'SAVINGS_DEPOSIT_REJECTED'
  | 'SAVINGS_WITHDRAWAL_SUBMITTED'
  | 'SAVINGS_WITHDRAWAL_APPROVED'
  | 'SAVINGS_WITHDRAWAL_REJECTED'
  | 'SAVINGS_WITHDRAWAL_COMPLETED'
  | 'SAVINGS_WITHDRAWAL_CONFIRMED'
  | 'MONTHLY_SAVING_REMINDER'
  | 'SAVINGS_BALANCE_UPDATED'
  | 'INTEREST_POSTED'
  // Shares
  | 'SHARE_PURCHASE'
  | 'SHARE_PURCHASE_APPROVED'
  | 'SHARE_PURCHASE_REJECTED'
  | 'SHARE_CONVERSION'
  | 'MIN_SHARE_REQUIREMENT_REACHED'
  // Loans
  | 'LOAN_APPLICATION_SUBMITTED'
  | 'LOAN_SUBMITTED'
  | 'LOAN_UNDER_REVIEW'
  | 'LOAN_APPROVED'
  | 'LOAN_REJECTED'
  | 'GUARANTOR_REQUEST'
  | 'GUARANTOR_ACCEPTED'
  | 'GUARANTOR_DECLINED'
  | 'GUARANTOR_APPROVED'
  | 'LOAN_DISBURSED'
  | 'UPCOMING_PAYMENT'
  | 'UPCOMING_INSTALLMENT'
  | 'PAYMENT_RECEIVED'
  | 'INSTALLMENT_PAID'
  | 'LATE_PAYMENT'
  | 'LATE_PAYMENT_REMINDER'
  | 'LOAN_DEFAULTED'
  | 'LOAN_COMPLETED'
  // Accounting
  | 'PERIOD_CLOSED'
  | 'BUDGET_ALERT'
  // System & Security
  | 'PASSWORD_CHANGED'
  | 'LOGIN_ALERT'
  | 'FAILED_LOGIN_ATTEMPTS'
  | 'PROFILE_UPDATED'
  | 'NEW_DEVICE_LOGIN'
  | 'ROLE_CHANGED'
  | 'TRANSACTION_REVERSED'
  | 'ANNOUNCEMENT'
  | 'POLICY_UPDATE'
  | 'EMERGENCY_NOTICE'
  | 'DIRECT_MESSAGE';

export interface DbNotification {
  id: string;
  userId?: string;
  recipientId?: string;
  memberId?: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'DANGER';
  eventType: NotificationEventCode | string;
  category?: NotificationCategory;
  channel?: NotificationChannel;
  isRead: boolean;
  isArchived?: boolean;
  isDeleted?: boolean;
  readAt?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface DbNotificationTemplate {
  id: string;
  code: NotificationEventCode | string;
  name: string;
  category: NotificationCategory;
  title: string; // In-App title template
  subject: string; // Email subject template
  smsBody: string;
  emailBody: string; // Rich HTML template
  telegramBody: string;
  inAppBody: string;
  variables: string[]; // e.g. ['memberName', 'membershipId', 'loanAmount', 'dueDate', ...]
  language: 'en' | 'am' | 'om';
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  version: number;
  channels: NotificationChannel[];
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface DbNotificationDeliveryLog {
  id: string;
  notificationId?: string;
  recipientUserId?: string;
  recipientMemberId?: string;
  recipientName: string;
  recipientContact: string; // Phone, Email, or Telegram ChatId
  channel: NotificationChannel;
  eventCode: string;
  category: NotificationCategory;
  title: string;
  message: string;
  status: 'QUEUED' | 'SENDING' | 'DELIVERED' | 'FAILED' | 'READ' | 'ARCHIVED';
  providerId?: string; // e.g. 'ethio-telecom', 'twilio', 'wabi-mail-smtp', 'telegram-bot'
  providerMessageId?: string;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  queuedAt: string;
  sentAt?: string | null;
  deliveredAt?: string | null;
  readAt?: string | null;
  failedAt?: string | null;
  metadata?: Record<string, any>;
}

export interface DbNotificationPreference {
  id: string;
  userId: string;
  memberId?: string;
  channelsEnabled: {
    inApp: boolean;
    sms: boolean;
    email: boolean;
    telegram: boolean;
  };
  telegramChatId?: string;
  telegramUsername?: string;
  telegramVerified: boolean;
  telegramVerificationToken?: string;
  telegramVerificationExpiresAt?: string;
  categoryPreferences: Record<
    NotificationCategory,
    { inApp: boolean; sms: boolean; email: boolean; telegram: boolean }
  >;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // e.g. "22:00"
  quietHoursEnd: string; // e.g. "07:00"
  language: 'en' | 'am' | 'om';
  createdAt: string;
  updatedAt: string;
}

export interface DbScheduledBroadcast {
  id: string;
  broadcastNo: string; // e.g. BCAST-2026-0001
  title: string;
  category: NotificationCategory;
  targetAudience:
    | 'ALL_MEMBERS'
    | 'ACTIVE_MEMBERS'
    | 'BORROWERS_WITH_ACTIVE_LOANS'
    | 'SAVERS_REGULAR'
    | 'MEMBERS_PENDING_KYC'
    | 'CUSTOM_SELECTION'
    | 'STAFF_ALL';
  customRecipientIds?: string[];
  channels: NotificationChannel[];
  inAppMessage: string;
  smsMessage?: string;
  emailSubject?: string;
  emailHtml?: string;
  telegramMessage?: string;
  scheduleType: 'IMMEDIATE' | 'ONE_TIME' | 'RECURRING';
  scheduledAt?: string;
  recurringPattern?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  totalRecipients: number;
  sentCount: number;
  successCount: number;
  failureCount: number;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  executedAt?: string | null;
}

export interface DbCommunicationMessage {
  id: string;
  ticketId?: string;
  memberId: string;
  membershipNo: string;
  memberName: string;
  senderUserId: string;
  senderName: string;
  senderRole: string;
  direction: 'OUTBOUND' | 'INBOUND';
  channels: NotificationChannel[];
  subject: string;
  content: string;
  status: 'SENT' | 'DELIVERED' | 'FAILED';
  createdAt: string;
}

// ==========================================
// PHASE 12: FINANCIAL MODULE SCHEMAS
// ==========================================

export type SavingProductCode = 'REGULAR' | 'VOLUNTARY' | 'CHILDREN' | 'TIME_DEPOSIT';

export interface DbSavingProduct {
  id: string;
  code: SavingProductCode;
  name: string;
  description: string;
  currency: 'ETB';
  minMonthlyDeposit: number; // e.g. 500 ETB for REGULAR
  minOpeningBalance: number; // e.g. 100 ETB
  annualInterestRate: number; // e.g. 6.0, 5.0, 7.0, 9.0%
  interestCalculationMethod: 'MIN_MONTHLY_BALANCE' | 'AVERAGE_DAILY_BALANCE' | 'SIMPLE_MATURITY';
  interestPostingFrequency: 'MONTHLY' | 'SEMI_ANNUAL' | 'ANNUAL' | 'AT_MATURITY';
  withdrawalHoldingDays: number; // e.g. 3 for VOLUNTARY
  earlyWithdrawalPenaltyPercent: number; // e.g. 2.0% for TIME_DEPOSIT
  allowPartialWithdrawal: boolean;
  requiresGuardian: boolean;
  isTimeDeposit: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  glLiabilityAccountId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbSavingAccount {
  id: string;
  accountNo: string; // e.g. SAV-REG-000143, SAV-VOL-000143
  memberId: string;
  membershipNo: string;
  memberName: string;
  productId: string;
  productCode: SavingProductCode;
  productName: string;
  currency: 'ETB';
  balance: number; // Book balance in ETB (decimal precision)
  ledgerBalance?: number;
  lastTransactionDate?: string;
  accruedInterest: number;
  lastInterestCalculationDate: string;
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED' | 'DORMANT';
  openingDate: string;
  closingDate?: string | null;
  // Legacy Migration Metadata
  legacyMemberId?: string;
  legacySourceFile?: string;
  legacySourceSheet?: string;
  migrationBatchId?: string;
  isMigrated?: boolean;
  guardianInfo?: {
    guardianName: string;
    relationship: string;
    nationalId: string;
    phone: string;
    childBirthCertificateNo?: string;
    childDateOfBirth?: string;
  };
  timeDepositDetails?: {
    principalAmount: number;
    termMonths: number;
    interestRate: number;
    startDate: string;
    maturityDate: string;
    isMatured: boolean;
    autoRollover: boolean;
    expectedMaturityAmount: number;
    earlyWithdrawalPenaltyPercent: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DbDepositBatch {
  id: string;
  accountId: string;
  accountNo: string;
  memberId: string;
  transactionId: string;
  amount: number;
  remainingAmount: number;
  depositDate: string; // ISO string
  clearedDate: string; // ISO string (depositDate + holdingDays)
  isCleared: boolean;
  createdAt: string;
}

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';
export type GLAccountType = AccountType;
export type NormalBalance = 'DEBIT' | 'CREDIT';
export type AccountStatus = 'ACTIVE' | 'INACTIVE';
export type UserRole = 'ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'AUDITOR' | 'CUSTOMER_SERVICE' | 'MEMBER';

export interface DbChartOfAccount {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  parentCode?: string;
  parentAccountId?: string;
  level?: number;
  normalBalance: NormalBalance;
  balance: number;
  currency: 'ETB';
  status: AccountStatus;
  isActive?: boolean;
  description?: string;
  isHeader?: boolean;
  isSystemAccount?: boolean;
  isReconciled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DbJournalEntryLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType?: AccountType;
  debit: number;
  credit: number;
  description?: string;
  narration?: string;
}

export type JournalStatus = 'DRAFT' | 'POSTED' | 'REVERSED' | 'CANCELLED';
export type JournalSource = 'AUTOMATIC' | 'MANUAL';

export interface DbJournalEntry {
  id: string;
  journalNo: string; // e.g. JNL-2026-000001
  transactionId?: string;
  transactionType?: string;
  transactionReference?: string;
  date?: string;
  entryDate?: string;
  narration: string;
  lines: DbJournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  postedBy: string;
  postedByName?: string;
  status: JournalStatus;
  source?: JournalSource;
  reversalOfJournalId?: string | null;
  reversedByJournalId?: string | null;
  reversalReason?: string | null;
  periodId?: string;
  createdAt: string;
  updatedAt?: string;
}

export type AccountingPeriodType = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
export type AccountingPeriodStatus = 'OPEN' | 'CLOSED' | 'LOCKED';

export interface DbAccountingPeriod {
  id: string; // e.g. '2026-08', '2026-Q3', '2026-FY'
  name: string; // e.g. 'August 2026', 'Third Quarter 2026', 'Fiscal Year 2026'
  type: AccountingPeriodType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: AccountingPeriodStatus;
  closedAt?: string;
  closedById?: string;
  closedByName?: string;
  lockedAt?: string;
  lockedById?: string;
  lockedByName?: string;
  closingJournalId?: string;
  netSurplus?: number;
  statutoryReserveAllocation?: number;
  generalReserveAllocation?: number;
  retainedEarningsAllocation?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DbBankReconItem {
  id: string;
  date: string;
  reference: string;
  description: string;
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  source: 'BOOK' | 'BANK_STATEMENT';
  isMatched: boolean;
  matchedTransactionId?: string;
  matchedJournalId?: string;
}

export type DbBankReconciliationItem = DbBankReconItem;
export type DbAnnualBudgetItem = DbBudgetItem;
export type BankReconciliationStatus = 'PENDING' | 'RECONCILED' | 'DISCREPANCY';

export interface DbBankReconciliation {
  id: string;
  reconciliationNo: string; // e.g. 'BRC-2026-08-CBE'
  bankAccountId: string; // COA id e.g. '1010-CBE'
  bankAccountCode: string; // e.g. '1010'
  bankAccountName: string; // e.g. 'Commercial Bank of Ethiopia (CBE)'
  period: string; // e.g. '2026-08'
  statementDate: string; // YYYY-MM-DD
  statementBalance: number;
  bookBalance: number;
  uncreditedDeposits: number;
  unpresentedPayments: number;
  adjustedBankBalance: number;
  adjustedBookBalance: number;
  variance: number;
  status: BankReconciliationStatus;
  items: DbBankReconItem[];
  reconciledById?: string;
  reconciledByName?: string;
  reconciledAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbBudgetItem {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: 'INCOME' | 'EXPENSE';
  annualBudget: number;
  q1Budget: number;
  q2Budget: number;
  q3Budget: number;
  q4Budget: number;
  notes?: string;
}

export type BudgetStatus = 'DRAFT' | 'APPROVED' | 'ACTIVE' | 'ARCHIVED';

export interface DbScheduledReport {
  id: string;
  scheduleNo: string;
  title: string;
  reportType: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  format: 'PDF' | 'EXCEL' | 'CSV';
  recipients: string[]; // Email addresses / user ids
  filters: Record<string, any>;
  lastRunAt?: string | null;
  nextRunAt: string;
  status: 'ACTIVE' | 'PAUSED' | 'FAILED';
  lastStatusMessage?: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbDashboardWidgetConfig {
  id: string;
  userId: string;
  role: string;
  widgets: string[];
  layout?: Record<string, any>;
  updatedAt: string;
}

export interface DbAnnualBudget {
  id: string;
  fiscalYear: number;
  title: string;
  status: BudgetStatus;
  totalBudgetedIncome: number;
  totalBudgetedExpense: number;
  projectedNetSurplus: number;
  items: DbBudgetItem[];
  approvedById?: string;
  approvedByName?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbFinancialTransaction {
  id: string;
  transactionNo: string; // e.g. WBS-2026-00000001
  memberId: string;
  membershipNo: string;
  memberName: string;
  accountId: string;
  accountNo: string;
  productCode: SavingProductCode | 'SHARE' | 'LOAN' | LoanProductCode;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'INTEREST_POSTING' | 'PENALTY_FEE' | 'REVERSAL' | 'SHARE_PURCHASE' | 'LOAN_DISBURSEMENT' | 'LOAN_REPAYMENT';
  amount: number;
  debitAmount: number | null;
  creditAmount: number | null;
  balanceBefore: number;
  balanceAfter: number;
  paymentChannel: 'CASH' | 'CBE_BANK' | 'TSEHAY_BANK' | 'INTERNAL_TRANSFER' | 'SYSTEM';
  bankReferenceNo?: string;
  narration: string;
  status: 'POSTED' | 'PENDING_APPROVAL' | 'REJECTED' | 'REVERSED';
  idempotencyKey?: string;
  receiptUrl?: string;
  receiptDocumentId?: string;
  requiresApproval: boolean;
  approvalId?: string;
  reversedByTransactionId?: string;
  reversalReason?: string;
  createdById: string;
  createdByName: string;
  approvedById?: string;
  approvedByName?: string;
  // Legacy Migration Metadata
  legacyMemberId?: string;
  legacyBookNumber?: string;
  legacyReceiptNumber?: string;
  legacySourceFile?: string;
  legacySourceSheet?: string;
  legacyRowNumber?: number;
  migrationBatchId?: string;
  isMigrated?: boolean;
  timestamp: string;
  createdAt: string;
}

export interface DbFinancialApproval {
  id: string;
  requestType:
    | 'LARGE_WITHDRAWAL'
    | 'TRANSACTION_REVERSAL'
    | 'TIME_DEPOSIT_EARLY_LIQUIDATION'
    | 'INTEREST_BATCH_POSTING'
    | 'ONLINE_DEPOSIT_VERIFICATION';
  memberId: string;
  memberName: string;
  membershipNo: string;
  accountId?: string;
  accountNo?: string;
  transactionId?: string;
  amount: number;
  makerId: string;
  makerName: string;
  makerRole: string;
  checkerId?: string;
  checkerName?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  supportingDocUrl?: string;
  rejectionReason?: string;
  details: Record<string, any>;
  createdAt: string;
  reviewedAt?: string;
}

export interface DbMonthlySavingsSchedule {
  id: string;
  memberId: string;
  membershipNo: string;
  memberName: string;
  accountId: string;
  accountNo: string;
  yearMonth: string; // e.g. '2026-08'
  expectedAmount: number;
  actualDeposited: number;
  shortfall: number;
  status: 'MET' | 'BELOW_MINIMUM' | 'UNPAID';
  lastDepositDate?: string;
  updatedAt: string;
}

export interface DbInterestPostingRun {
  id: string;
  period: string; // e.g. '2026-H1' or '2026-08'
  runDate: string;
  productCode: string;
  totalAccountsProcessed: number;
  totalInterestAmount: number;
  status: 'PREVIEW' | 'APPROVED' | 'POSTED';
  executedBy: string;
  approvedBy?: string;
  details: Array<{
    accountId: string;
    accountNo: string;
    memberId: string;
    membershipNo: string;
    memberName: string;
    balance: number;
    rate: number;
    interestAmount: number;
  }>;
  createdAt: string;
}

export interface DbShareAccount {
  id: string;
  accountNo: string; // e.g. 'SHR-000143'
  memberId: string;
  membershipNo: string;
  memberName: string;
  numberOfShares: number; // Positive whole integer
  sharePrice: number; // Unit price (e.g. 500 ETB)
  totalShareValue: number; // numberOfShares * sharePrice
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED';
  openingDate: string;
  lastTransactionDate?: string;
  certificateNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbShareTransaction {
  id: string;
  transactionNo: string; // e.g. WBS-SHR-2026-00000001
  shareAccountId: string;
  shareAccountNo: string;
  memberId: string;
  membershipNo: string;
  memberName: string;
  type: 'SHARE_PURCHASE' | 'SHARE_CONVERSION' | 'SHARE_REVERSAL';
  numberOfShares: number; // Positive integer
  unitPrice: number; // ETB price per share at transaction time
  totalAmount: number; // numberOfShares * unitPrice
  sharesBefore: number;
  sharesAfter: number;
  valueBefore: number;
  valueAfter: number;
  paymentMethod: 'CASH' | 'CBE_BANK' | 'TSEHAY_BANK' | 'VOLUNTARY_SAVINGS_CONVERSION' | 'INTERNAL_TRANSFER';
  bankReferenceNo?: string;
  sourceSavingAccountId?: string;
  sourceSavingAccountNo?: string;
  journalEntryId?: string;
  financialTransactionId?: string;
  narration: string;
  status: 'POSTED' | 'PENDING_APPROVAL' | 'REJECTED' | 'REVERSED';
  idempotencyKey?: string;
  receiptUrl?: string;
  createdById: string;
  createdByName: string;
  approvedById?: string;
  approvedByName?: string;
  // Legacy Migration Metadata
  legacyMemberId?: string;
  legacyBookNumber?: string;
  legacyReceiptNumber?: string;
  legacySourceFile?: string;
  legacySourceSheet?: string;
  legacyRowNumber?: number;
  migrationBatchId?: string;
  isMigrated?: boolean;
  timestamp: string;
  createdAt: string;
}

export interface DbShareCertificate {
  id: string;
  certificateNumber: string; // e.g. CERT-WB-2024-000143
  shareAccountId: string;
  memberId: string;
  membershipNo: string;
  memberName: string;
  sharesIssued: number;
  shareValue: number;
  parValuePerShare: number;
  issueDate: string;
  status: 'ACTIVE' | 'SUPERSEDED' | 'CANCELLED';
  issuedBy: string;
  createdAt: string;
}

export interface DbSharePriceHistory {
  id: string;
  previousPrice: number;
  newPrice: number;
  effectiveDate: string;
  changedById: string;
  changedByName: string;
  reason: string;
  createdAt: string;
}

// ==========================================
// PHASE 14: LOAN MANAGEMENT MODULE SCHEMAS
// ==========================================

export type LoanProductCode = 'PERSONAL' | 'EMERGENCY' | 'BUSINESS' | 'EDUCATION' | 'CAR' | 'HOUSE';

export type LoanStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'AWAITING_GUARANTORS'
  | 'UNDER_REVIEW'
  | 'AWAITING_MANAGER_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'DISBURSED'
  | 'ACTIVE'
  | 'OVERDUE'
  | 'DEFAULTED'
  | 'COMPLETED'
  | 'CANCELLED';

export type GuarantorStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export interface DbLoanProduct {
  id: string;
  code: LoanProductCode;
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  interestRate: number; // Annual rate e.g. 14.0%
  interestMethod: 'AMORTIZATION_FIXED_PMT' | 'REDUCING_BALANCE';
  maxTerm: number; // Maximum term in months
  gracePeriod: number; // Grace period in months
  requiresGuarantor: boolean;
  minGuarantors: number;
  maxGuarantors: number;
  savingsMultiplier: number; // e.g. 3x member regular savings
  status: 'ACTIVE' | 'INACTIVE';
  glAssetAccountId: string; // e.g. '1210-LN-PER'
  glInterestIncomeAccountId: string; // e.g. '4010-INT-INC'
  createdAt: string;
  updatedAt: string;
}

export interface DbLoanGuarantor {
  id: string;
  loanId: string;
  guarantorMemberId: string;
  guarantorMembershipNo: string;
  guarantorName: string;
  guarantorPhone: string;
  guaranteedAmount: number;
  status: GuarantorStatus;
  decisionDate?: string;
  decisionNotes?: string;
  relationship?: string;
  createdAt: string;
}

export interface DbLoanScheduleItem {
  id: string;
  loanId: string;
  installmentNumber: number;
  dueDate: string; // ISO date string (YYYY-MM-DD)
  openingBalance: number;
  principalAmount: number;
  interestAmount: number;
  installmentAmount: number; // principalAmount + interestAmount
  remainingBalance: number;
  penaltyAmount: number;
  paidPrincipal: number;
  paidInterest: number;
  paidPenalty: number;
  paidTotal: number;
  paidDate?: string;
  status: 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'DEFAULTED';
  daysLate: number;
  transactionId?: string;
  repaymentId?: string;
}

export interface DbLoan {
  id: string;
  loanNo: string; // e.g. 'LN-2026-000001'
  memberId: string;
  membershipNo: string;
  memberName: string;
  memberPhone?: string;
  productId: string;
  productCode: LoanProductCode;
  productName: string;
  requestedAmount: number;
  approvedAmount?: number;
  disbursedAmount?: number;
  requestedTermMonths: number;
  approvedTermMonths?: number;
  interestRate: number; // Locked annual interest rate e.g. 14.0%
  interestMethod: 'AMORTIZATION_FIXED_PMT' | 'REDUCING_BALANCE';
  monthlyInstallmentAmount?: number;
  totalInterestCalculated?: number;
  totalPayableAmount?: number;
  purpose: string;
  incomeDetails: {
    monthlyIncome: number;
    monthlyExpenses?: number;
    otherLoansCommitments?: number;
    employerOrBusiness: string;
    netDisposableIncome: number;
  };
  supportingDocuments: Array<{
    id: string;
    name: string;
    url: string;
    documentType: string;
    uploadedAt: string;
  }>;
  guarantors: DbLoanGuarantor[];
  status: LoanStatus;
  rejectionReason?: string;
  reviewNotes?: string;
  disbursementDetails?: {
    disbursedAt: string;
    paymentChannel: 'CASH' | 'CBE_BANK' | 'TSEHAY_BANK' | 'INTERNAL_TRANSFER_TO_SAVINGS' | 'SYSTEM';
    bankReferenceNo?: string;
    destinationAccountId?: string;
    disbursedById: string;
    disbursedByName: string;
    journalEntryId?: string;
    financialTransactionId?: string;
  };
  outstandingPrincipal: number;
  outstandingInterest: number;
  outstandingPenalty: number;
  totalOutstanding: number;
  totalPrincipalPaid: number;
  totalInterestPaid: number;
  totalPenaltyPaid: number;
  totalPaid: number;
  nextInstallmentDate?: string;
  nextInstallmentAmount?: number;
  paidInstallmentsCount: number;
  remainingInstallmentsCount: number;
  totalInstallmentsCount: number;
  daysLate: number;
  isDelinquent: boolean;
  applicationDate: string;
  reviewedAt?: string;
  reviewedById?: string;
  reviewedByName?: string;
  approvedAt?: string;
  approvedById?: string;
  approvedByName?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbLoanRepayment {
  id: string;
  repaymentNo: string; // e.g. 'LRP-2026-000001'
  loanId: string;
  loanNo: string;
  memberId: string;
  membershipNo: string;
  memberName: string;
  amount: number;
  principalPaid: number;
  interestPaid: number;
  penaltyPaid: number;
  principalBalanceBefore: number;
  principalBalanceAfter: number;
  totalBalanceBefore: number;
  totalBalanceAfter: number;
  paymentChannel: 'CASH' | 'CBE_BANK' | 'TSEHAY_BANK' | 'INTERNAL_TRANSFER' | 'SYSTEM';
  bankReferenceNo?: string;
  sourceSavingAccountId?: string;
  journalEntryId?: string;
  financialTransactionId?: string;
  receiptUrl?: string;
  narration: string;
  performedById: string;
  performedByName: string;
  // Legacy Migration Metadata
  legacyMemberId?: string;
  legacyBookNumber?: string;
  legacyReceiptNumber?: string;
  legacySourceFile?: string;
  legacySourceSheet?: string;
  legacyRowNumber?: number;
  migrationBatchId?: string;
  isMigrated?: boolean;
  timestamp: string;
  status: 'POSTED' | 'REVERSED';
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

export interface DbSystemSettings {
  largeWithdrawalThreshold: number; // default 50000 ETB
  regularMinMonthlySaving: number; // default 500 ETB
  voluntaryHoldingDays: number; // default 3 days
  allowOverdraft: boolean; // default false
  institutionName: string;
  baseCurrency: string;
  // Phase 13: Share parameters
  sharePrice: number; // default 500 ETB
  minRequiredShares: number; // default 5 shares
  minShareValue: number; // default 2500 ETB
  shareDividendRate: number; // default 14.5%
  // Phase 14: Loan parameters
  defaultLoanInterestRate: number; // default 14.0%
  loanLatePenaltyRatePercent: number; // default 2.0% per month
  loanLateGraceDays: number; // default 5 days
  loanMaxActivePerMember: number; // default 1 active loan
  loanMaxGuaranteePerMember: number; // default 3 guarantees
  loanMinContinuousSavingsMonths: number; // default 4 months
  loanMinMonthlySavingsAmount: number; // default 500 ETB
  loanMinShareRequirement: number; // default 5 shares (2500 ETB)
  loanSavingsMultiplier: number; // default 3x regular savings
  // Phase 20: Enterprise Centralized System Settings Extensions
  institutionProfile?: SaccoInstitutionProfile;
  registrationFee?: number;
  systemName?: string;
  maintenanceMode?: {
    isEnabled: boolean;
    message: string;
    allowedIps: string[];
    scheduledEndTime?: string | null;
  };
  maxLoginAttempts?: number;
  sessionTimeoutMinutes?: number;
  defaultLanguage?: 'en' | 'am' | 'om' | string;
  theme?: 'LIGHT' | 'DARK' | 'SYSTEM';
  timezone?: string;
  backupSchedule?: {
    autoBackupEnabled: boolean;
    frequency: 'HOURLY' | 'DAILY' | 'WEEKLY';
    backupTime: string;
    retentionDays: number;
    storageLocation: string;
  };
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
    interestCalculationPeriod: 'MONTHLY' | 'SEMI_ANNUAL' | 'ANNUAL' | 'AT_MATURITY';
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
  accountingRules?: {
    chartOfAccountsDefaults: {
      memberSavingsPayableAccountId: string;
      voluntarySavingsPayableAccountId: string;
      loanReceivableAccountId: string;
      shareCapitalAccountId: string;
      cashVaultAccountId: string;
      cbeBankAccountId: string;
      tsehayBankAccountId: string;
      interestIncomeAccountId: string;
      interestExpenseAccountId: string;
      statutoryReserveAccountId: string;
      generalReserveAccountId: string;
    };
    fiscalYearStartMonth: number;
    fiscalYearEndMonth: number;
    currentFiscalYear: string;
    autoLockAccountingPeriods: boolean;
    autoPostApprovedLoans: boolean;
    autoPostInterestRuns: boolean;
    reservePercentages: {
      statutoryReservePercent: number;
      generalReservePercent: number;
      educationFundPercent: number;
      dividendPayoutLimitPercent: number;
    };
  };
  notificationRules?: {
    smsProvider: {
      provider: 'MOCK' | 'ETHIO_TELECOM' | 'TWILIO';
      apiKey: string;
      senderId: string;
      enabled: boolean;
    };
    emailProvider: {
      provider: 'MOCK' | 'SMTP' | 'SENDGRID' | 'SES';
      host: string;
      port: number;
      user: string;
      fromEmail: string;
      enabled: boolean;
    };
    telegramBot: {
      enabled: boolean;
      botUsername: string;
      botToken: string;
    };
    retryPolicy: {
      maxRetries: number;
      retryBackoffMs: number;
    };
    quietHours: {
      enabled: boolean;
      startHour: number;
      endHour: number;
      bypassCritical: boolean;
    };
    defaultChannels: Record<string, string[]>;
  };
  securityRules?: {
    mfaMandatoryRoles: string[];
    mfaGracePeriodDays: number;
    sessionIdleTimeoutMinutes: number;
    maxConcurrentSessions: number;
    rateLimits: {
      publicEndpointsPerMin: number;
      authEndpointsPerMin: number;
      staffEndpointsPerMin: number;
    };
    fraudThresholds: {
      largeTransactionThreshold: number;
      dailyVelocityCount: number;
      parRiskTriggerDays: number;
    };
    riskThresholds: {
      lowMax: number;
      mediumMax: number;
      highMax: number;
    };
    ipRestrictions: {
      enabled: boolean;
      whitelist: string[];
      blacklist: string[];
    };
  };
}

export interface DatabaseSchema {
  version: number;
  users: DbUser[];
  roles: DbRole[];
  permissions: DbPermission[];
  rolePermissions: DbRolePermission[];
  userRoles: DbUserRole[];
  refreshTokens: DbRefreshToken[];
  sessions: DbSession[];
  passwordResetTokens: DbPasswordResetToken[];
  loginHistory: DbLoginHistory[];
  securityEvents: DbSecurityEvent[];
  auditLogs: DbAuditLog[];
  members: DbMember[];
  registrationRequests: DbRegistrationRequest[];
  documents: DbDocument[];
  notifications: DbNotification[];
  membershipSequence: number;
  // Phase 12 financial collections
  savingProducts: DbSavingProduct[];
  savingAccounts: DbSavingAccount[];
  depositBatches: DbDepositBatch[];
  chartOfAccounts: DbChartOfAccount[];
  journalEntries: DbJournalEntry[];
  financialTransactions: DbFinancialTransaction[];
  financialApprovals: DbFinancialApproval[];
  monthlySavingsSchedules: DbMonthlySavingsSchedule[];
  interestPostingRuns: DbInterestPostingRun[];
  systemSettings: DbSystemSettings;
  transactionSequence: number;
  journalSequence: number;
  // Phase 13 share collections
  shareAccounts: DbShareAccount[];
  shareTransactions: DbShareTransaction[];
  shareCertificates: DbShareCertificate[];
  sharePriceHistory: DbSharePriceHistory[];
  shareSequence: number;
  certificateSequence: number;
  // Phase 14 loan collections
  loanProducts: DbLoanProduct[];
  loans: DbLoan[];
  loanSchedules: DbLoanScheduleItem[];
  loanRepayments: DbLoanRepayment[];
  loanSequence: number;
  repaymentSequence: number;
  // Phase 15 accounting collections
  accountingPeriods: DbAccountingPeriod[];
  bankReconciliations: DbBankReconciliation[];
  annualBudgets: DbAnnualBudget[];
  reconciliationSequence: number;
  budgetSequence: number;
  // Phase 16 BI & Analytics collections
  scheduledReports: DbScheduledReport[];
  dashboardWidgetConfigs: DbDashboardWidgetConfig[];
  scheduledReportSequence: number;
  // Phase 17 Enterprise Communication collections
  notificationTemplates: DbNotificationTemplate[];
  notificationDeliveryLogs: DbNotificationDeliveryLog[];
  notificationPreferences: DbNotificationPreference[];
  scheduledBroadcasts: DbScheduledBroadcast[];
  communicationMessages: DbCommunicationMessage[];
  broadcastSequence: number;
  // Phase 18 CRM, Case Management, Help Desk collections
  supportTickets: DbTicket[];
  ticketMessages: DbTicketMessage[];
  slaPolicies: DbSlaPolicy[];
  kbArticles: DbKnowledgeBaseArticle[];
  chatSessions: DbChatSession[];
  chatMessages: DbChatMessage[];
  ticketSequence: number;
  kbArticleSequence: number;
  chatSequence: number;
  // Phase 19 Security, Compliance & Risk collections
  mfaConfigs: DbMfaConfig[];
  roleMfaPolicies: DbRoleMfaPolicy[];
  trustedDevices: DbTrustedDevice[];
  passwordPolicy: DbPasswordPolicy;
  passwordHistory: DbPasswordHistory[];
  riskAssessments: DbRiskAssessment[];
  securityAlerts: DbSecurityAlert[];
  securityIncidents: DbSecurityIncident[];
  backupRecords: DbBackupRecord[];
  disasterRecoveryPlan: DbDisasterRecoveryPlan;
  complianceStatus: DbComplianceStatus;
  alertSequence: number;
  incidentSequence: number;
  backupSequence: number;
  // Phase 20 Administration & System Configuration collections
  organizationProfile: DbOrganizationProfile;
  workingCalendar: DbWorkingCalendar;
  featureFlags: DbFeatureFlag[];
  localizationPacks: DbLocalizationPack[];
  numberingSystem: DbNumberingSystem;
  documentConfig: DbDocumentConfig;
  brandingTheme: DbBrandingTheme;
  configAuditLogs: DbConfigAuditLog[];
  // Phase 25 Legacy Data Migration & Historical Reconciliation Collections
  migrationBatches: DbMigrationBatch[];
  migrationExceptions: DbMigrationException[];
  historicalOpeningBalances: DbHistoricalOpeningBalance[];
  migrationBatchSequence: number;
}

// ==========================================
// PHASE 25: LEGACY DATA MIGRATION & RECONCILIATION SCHEMAS
// ==========================================

export type MigrationStatus =
  | 'UPLOADED'
  | 'ANALYZING'
  | 'VALIDATION_FAILED'
  | 'READY_FOR_REVIEW'
  | 'APPROVED'
  | 'IMPORTING'
  | 'COMPLETED'
  | 'PARTIALLY_COMPLETED'
  | 'FAILED'
  | 'ROLLED_BACK';

export type DuplicateMatchLevel =
  | 'EXACT_MATCH'
  | 'HIGH_CONFIDENCE'
  | 'POSSIBLE_MATCH'
  | 'NO_MATCH'
  | 'MANUAL_REVIEW';

export type MigrationEntityType =
  | 'MEMBER'
  | 'SAVINGS_TRANSACTION'
  | 'SHARE_TRANSACTION'
  | 'TIME_DEPOSIT'
  | 'LOAN_REPAYMENT'
  | 'LOAN_SCHEDULE'
  | 'INTEREST'
  | 'PENALTY'
  | 'REGISTRATION_PAYMENT'
  | 'BANK_TRANSACTION'
  | 'HISTORICAL_REPORT'
  | 'MONTHLY_SUMMARY'
  | 'HISTORICAL_BANK_BALANCE'
  | 'OPENING_BALANCE'
  | 'IGNORE_UNMAPPED';

export interface DbWorksheetInspection {
  sheetIndex: number;
  sheetName: string;
  rowCount: number;
  columnCount: number;
  headers: string[];
  detectedEntityType: MigrationEntityType;
  isReportSummary: boolean; // Flags summary / aggregate sheets so they are not double-counted as individual transactions
  sampleRows: Array<Record<string, any>>;
  dateRange?: {
    minDate?: string;
    maxDate?: string;
    detectedCalendar: 'GREGORIAN' | 'ETHIOPIAN' | 'MIXED' | 'UNKNOWN';
  };
  detectedMemberIdsCount: number;
  detectedTransactionTypes: string[];
  suggestedAction: 'IMPORT_AS_RECORDS' | 'IMPORT_AS_OPENING_BALANCE' | 'TREAT_AS_REPORT_ONLY' | 'MANUAL_REVIEW';
}

export interface DbColumnMappingItem {
  sourceColumn: string;
  targetField: string; // e.g. 'legacyMemberId', 'fullName', 'regularSavings', etc.
  dataType: 'STRING' | 'NUMBER' | 'DATE_EC' | 'DATE_GC' | 'DATE_AUTO' | 'BANK' | 'BOOLEAN';
  isRequired: boolean;
  transformRule?: 'NONE' | 'NORMALIZE_BANK' | 'PARSE_EC_DATE' | 'PARSE_GC_DATE' | 'CLEAN_CURRENCY' | 'TRIM_STRING';
  confidence: number; // 0.0 to 1.0
  notes?: string;
}

export interface DbWorksheetMappingConfig {
  sheetName: string;
  entityType: MigrationEntityType;
  skipRows: number; // e.g. 1 if header is row 1
  isReportSummary: boolean;
  mappings: DbColumnMappingItem[];
}

export interface DbDuplicateMatch {
  id: string;
  sourceRowNumber: number;
  sourceSheet: string;
  legacyIdentifier: string;
  bookNumber?: string;
  rvNumber?: string;
  fullName: string;
  nationalId?: string;
  phone?: string;
  matchLevel: DuplicateMatchLevel;
  matchedMemberId?: string;
  matchedMembershipNo?: string;
  matchedMemberName?: string;
  matchConfidencePercent: number;
  matchReason: string;
  action: 'CREATE_NEW' | 'LINK_EXISTING' | 'SKIP' | 'MANUAL_REVIEW';
}

export interface DbMigrationFinancialBreakdown {
  registrationFees: number;
  regularSavings: number;
  voluntarySavings: number;
  timeDeposits: number;
  shares: number;
  loanRepayments: number;
  interest: number;
  penalties: number;
  other: number;
  totalFinancialVolume: number;
}

export interface DbMigrationReconciliation {
  sourceTotals: DbMigrationFinancialBreakdown;
  importedTotals: DbMigrationFinancialBreakdown;
  differences: DbMigrationFinancialBreakdown;
  status: 'BALANCED' | 'EXPLAINED_VARIANCE' | 'DISCREPANCY';
  varianceExplanation?: string;
  accountantNotes?: string;
  reconciledAt?: string;
  reconciledBy?: string;
}

export interface DbDryRunReport {
  generatedAt: string;
  totalRowsRead: number;
  validRowsCount: number;
  rejectedRowsCount: number;
  duplicateCount: number;
  manualReviewCount: number;
  entityBreakdown: Record<MigrationEntityType | string, number>;
  financialTotals: DbMigrationFinancialBreakdown;
  reconciliation: DbMigrationReconciliation;
  detectedDuplicates: DbDuplicateMatch[];
  topExceptions: Array<{
    sheetName: string;
    rowNumber: number;
    issueType: string;
    description: string;
  }>;
  safetyChecks: {
    noDirectProductionMutation: boolean;
    backupVerified: boolean;
    accountingPeriodsValidated: boolean;
    makerCheckerCompliant: boolean;
  };
}

export interface DbMigrationBatch {
  id: string;
  batchNumber: string; // e.g. 'MB-2026-0001'
  sourceFileName: string;
  sourceFileSize: number;
  sourceFileHash: string; // SHA-256
  sourcePackageKey?: string; // e.g. 'all_members_399' | 'deresegn_report_2' | 'custom_upload'
  appVersion: string;
  dbVersion: string;
  status: MigrationStatus;
  worksheets: DbWorksheetInspection[];
  mappings: DbWorksheetMappingConfig[];
  validationSummary: {
    totalRows: number;
    validRows: number;
    rejectedRows: number;
    duplicateCount: number;
    manualReviewCount: number;
    anomaliesCount: number;
  };
  financialSummary: DbMigrationFinancialBreakdown;
  reconciliation: DbMigrationReconciliation;
  dryRunReport?: DbDryRunReport;
  makerNotes?: string;
  checkerNotes?: string;
  uploadedById: string;
  uploadedByName: string;
  uploadedByRole: string;
  uploadDate: string;
  approvedById?: string;
  approvedByName?: string;
  approvedAt?: string;
  approvalMfaVerified?: boolean;
  executionStats?: {
    startedAt?: string;
    completedAt?: string;
    membersCreated: number;
    membersLinked: number;
    savingsAccountsUpdated: number;
    savingsTransactionsCreated: number;
    shareAccountsUpdated: number;
    shareTransactionsCreated: number;
    loanRepaymentsCreated: number;
    journalEntriesCreated: number;
    openingBalancesEstablished: number;
    exceptionsLogged: number;
  };
  rollbackInfo?: {
    rolledBackAt: string;
    rolledBackById: string;
    rolledBackByName: string;
    reason: string;
    deletedCounts: Record<string, number>;
  };
  createdAt: string;
  updatedAt: string;
}

export type MigrationExceptionIssueType =
  | 'DUPLICATE_MEMBER'
  | 'DUPLICATE_BOOK_NO'
  | 'DUPLICATE_RECEIPT'
  | 'AMBIGUOUS_DATE'
  | 'EC_GC_MISMATCH'
  | 'UNKNOWN_BANK'
  | 'INVALID_AMOUNT'
  | 'MISSING_MEMBER_REF'
  | 'MISSING_NAME'
  | 'LOAN_REPAYMENT_WITHOUT_DISBURSEMENT'
  | 'UNKNOWN_TX_CATEGORY'
  | 'FINANCIAL_MISMATCH'
  | 'CORRUPT_ROW';

export interface DbMigrationException {
  id: string;
  batchId: string;
  batchNumber: string;
  sourceFile: string;
  sourceSheet: string;
  sourceRowNumber: number;
  legacyIdentifier?: string;
  memberName?: string;
  entityType: MigrationEntityType;
  rawRecord: Record<string, any>;
  issueType: MigrationExceptionIssueType;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  description: string;
  resolutionStatus: 'PENDING_REVIEW' | 'RESOLVED' | 'SKIPPED' | 'OVERRIDDEN';
  resolutionAction?: string;
  resolvedById?: string;
  resolvedByName?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface DbHistoricalOpeningBalance {
  id: string;
  batchId: string;
  batchNumber: string;
  accountCode: string; // Chart of Accounts Code e.g. '1010', '2010', '3010'
  accountName: string;
  accountType: AccountType;
  debit: number;
  credit: number;
  effectiveDate: string; // Canonical GC ISO string
  sourceDocument: string;
  reason: string;
  status: 'DRAFT' | 'APPROVED' | 'POSTED';
  journalEntryId?: string;
  createdById: string;
  createdByName: string;
  approvedById?: string;
  approvedByName?: string;
  approvedAt?: string;
  createdAt: string;
}

export type TicketCategory =
  | 'MEMBERSHIP'
  | 'SAVINGS'
  | 'SHARES'
  | 'LOANS'
  | 'ACCOUNTING'
  | 'PAYMENTS'
  | 'MOBILE_APP'
  | 'WEBSITE'
  | 'NOTIFICATIONS'
  | 'GENERAL_INQUIRY'
  | 'COMPLAINT'
  | 'SUGGESTION'
  | 'TECHNICAL_ISSUE';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TicketStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_MEMBER'
  | 'ESCALATED'
  | 'RESOLVED'
  | 'CLOSED'
  | 'CANCELLED';

export type TicketDepartment =
  | 'CUSTOMER_SERVICE'
  | 'FINANCE'
  | 'LOANS'
  | 'IT_SUPPORT'
  | 'MANAGEMENT';

export type EscalationLevel = 0 | 1 | 2 | 3; // 0: Agent, 1: Supervisor, 2: Manager, 3: Administrator

export interface DbTicketAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  uploadedBy: string;
  uploadedByName: string;
}

export interface DbTicket {
  id: string;
  ticketNumber: string; // e.g. TCK-2026-0001
  memberId?: string;
  membershipNo?: string;
  memberFullName: string;
  memberEmail?: string;
  memberPhone?: string;
  userId?: string;
  category: TicketCategory;
  priority: TicketPriority;
  subject: string;
  description: string;
  attachments: DbTicketAttachment[];
  assignedStaffId?: string;
  assignedStaffName?: string;
  department: TicketDepartment;
  currentStatus: TicketStatus;
  resolution?: string;
  resolutionDate?: string;
  resolvedById?: string;
  resolvedByName?: string;
  slaRuleId?: string;
  slaFirstResponseDue: string;
  slaResolutionDue: string;
  firstRespondedAt?: string;
  firstRespondedById?: string;
  resolvedAt?: string;
  isSlaResponseBreached: boolean;
  isSlaResolutionBreached: boolean;
  escalationLevel: EscalationLevel;
  escalatedToName?: string;
  escalationReason?: string;
  satisfactionRating?: number; // 1-5
  satisfactionComment?: string;
  satisfactionImprovement?: string;
  ratedAt?: string;
  mergedIntoTicketId?: string;
  mergedTicketNumbers?: string[];
  isMerged: boolean;
  parentTicketId?: string;
  childTicketIds?: string[];
  reopenCount: number;
  lastRepliedAt: string;
  lastRepliedBy: string;
  lastRepliedRole: 'MEMBER' | 'STAFF' | 'SYSTEM';
  createdDate: string;
  updatedDate: string;
}

export type TicketMessageType =
  | 'MEMBER_REPLY'
  | 'STAFF_REPLY'
  | 'INTERNAL_NOTE'
  | 'STATUS_CHANGE'
  | 'ASSIGNMENT'
  | 'TRANSFER'
  | 'ESCALATION'
  | 'SLA_BREACH_ALERT'
  | 'MERGE_SPLIT'
  | 'RESOLUTION'
  | 'REOPEN'
  | 'RATING';

export interface DbTicketMessage {
  id: string;
  ticketId: string;
  type: TicketMessageType;
  senderId: string;
  senderName: string;
  senderRole: string;
  isInternalNote: boolean;
  content: string;
  attachments?: DbTicketAttachment[];
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface DbSlaPolicy {
  id: string;
  name: string;
  priority: TicketPriority;
  category?: TicketCategory | 'ALL';
  firstResponseMinutes: number;
  resolutionMinutes: number;
  escalationThresholdPercent: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type KbCategory =
  | 'MEMBERSHIP'
  | 'SAVINGS'
  | 'LOANS'
  | 'SHARES'
  | 'PAYMENTS'
  | 'SECURITY'
  | 'FAQ'
  | 'ANNOUNCEMENTS';

export interface DbKnowledgeBaseArticle {
  id: string;
  articleCode: string;
  title: string;
  slug: string;
  category: KbCategory;
  summary: string;
  content: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  tags: string[];
  relatedArticleIds?: string[];
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  createdById: string;
  createdByName: string;
  updatedById: string;
  updatedByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbChatSession {
  id: string;
  sessionNo: string;
  memberId?: string;
  memberName: string;
  memberEmail?: string;
  status: 'BOT_ACTIVE' | 'WAITING_AGENT' | 'AGENT_CONNECTED' | 'CLOSED';
  assignedAgentId?: string;
  assignedAgentName?: string;
  department: TicketDepartment;
  rating?: number;
  feedback?: string;
  startedAt: string;
  endedAt?: string;
  lastMessageAt: string;
}

export interface DbChatMessage {
  id: string;
  sessionId: string;
  sender: 'MEMBER' | 'AGENT' | 'BOT';
  senderId?: string;
  senderName: string;
  text: string;
  suggestedArticleId?: string;
  attachments?: DbTicketAttachment[];
  createdAt: string;
}

// ========================================================
// PHASE 19 ENTERPRISE SECURITY, COMPLIANCE & RISK SCHEMAS
// ========================================================

export type MfaMethod = 'EMAIL_OTP' | 'SMS_OTP' | 'TOTP' | 'WEBAUTHN';

export interface DbMfaBackupCode {
  codeHash: string;
  used: boolean;
  usedAt?: string;
}

export interface DbWebAuthnCredential {
  id: string;
  name: string;
  publicKey: string;
  counter: number;
  createdAt: string;
}

export interface DbMfaConfig {
  id: string;
  userId: string;
  isEnabled: boolean;
  methods: MfaMethod[];
  preferredMethod: MfaMethod;
  totpSecret?: string;
  totpSecretBase32?: string;
  totpQrUri?: string;
  backupCodes: DbMfaBackupCode[];
  webAuthnCredentials?: DbWebAuthnCredential[];
  enforcedByRole: boolean;
  updatedAt: string;
}

export interface DbRoleMfaPolicy {
  id: string;
  role: string;
  isMandatory: boolean;
  allowedMethods: MfaMethod[];
  gracePeriodDays: number;
  updatedAt: string;
}

export interface DbTrustedDevice {
  id: string;
  userId: string;
  deviceFingerprint: string;
  deviceName: string;
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
  isApproved: boolean;
  approvedAt: string;
  lastUsedAt: string;
  isRevoked: boolean;
  revokedAt?: string;
  riskScore: number;
  userAgent: string;
}

export interface DbPasswordPolicy {
  id: string;
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventReuseCount: number;
  expirationDays: number;
  failedAttemptsThreshold: number;
  lockoutDurationMinutes: number;
  autoUnlockEnabled: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface DbPasswordHistory {
  id: string;
  userId: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RiskContextType =
  | 'LOGIN'
  | 'TRANSACTION'
  | 'LOAN_APPROVAL'
  | 'WITHDRAWAL'
  | 'MEMBER_UPDATE'
  | 'PRIVILEGE_CHANGE'
  | 'PASSWORD_RESET'
  | 'PROFILE_UPDATE'
  | 'LOAN';

export interface DbRiskFactor {
  rule: string;
  score: number;
  weight: number;
  description: string;
}

export interface DbRiskAssessment {
  id: string;
  contextType: RiskContextType;
  entityId: string;
  userId?: string;
  userFullName?: string;
  memberId?: string;
  membershipNo?: string;
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  riskFactors: DbRiskFactor[];
  actionTaken: 'ALLOWED' | 'FLAGGED' | 'CHALLENGED_MFA' | 'BLOCKED' | 'REQUIRES_MANUAL_REVIEW';
  ipAddress: string;
  deviceFingerprint?: string;
  location?: string;
  details?: Record<string, any>;
  createdAt: string;
}

export type SecurityAlertCategory =
  | 'FRAUD'
  | 'BRUTE_FORCE'
  | 'UNUSUAL_TRANSACTION'
  | 'SUSPICIOUS_DEVICE'
  | 'PRIVILEGE_CHANGE'
  | 'DATA_EXPORT'
  | 'CONFIG_CHANGE'
  | 'SECURITY_POLICY_VIOLATION'
  | 'SUSPICIOUS_LOGIN'
  | 'UNAUTHORIZED_ACCESS_ATTEMPT';

export interface DbSecurityAlert {
  id: string;
  alertNumber: string; // ALT-2026-XXXX
  title: string;
  severity: RiskLevel;
  category: SecurityAlertCategory;
  description: string;
  sourceIp: string;
  userId?: string;
  userName?: string;
  memberId?: string;
  membershipNo?: string;
  transactionId?: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
  assignedTo?: string;
  assignedToName?: string;
  createdAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'NEW' | 'INVESTIGATING' | 'CONTAINED' | 'MITIGATED' | 'RESOLVED' | 'CLOSED';

export interface DbIncidentTimelineItem {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  notes: string;
}

export interface DbIncidentEvidenceItem {
  id: string;
  type: string;
  description: string;
  dataRef: string;
  addedAt: string;
}

export interface DbSecurityIncident {
  id: string;
  incidentNumber: string; // INC-2026-XXXX
  title: string;
  category:
    | 'BRUTE_FORCE'
    | 'UNAUTHORIZED_ACCESS'
    | 'UNAUTHORIZED_ACCESS_ATTEMPT'
    | 'FRAUD_ATTEMPT'
    | 'DATA_LEAK'
    | 'POLICY_VIOLATION'
    | 'SYSTEM_COMPROMISE';
  severity: IncidentSeverity;
  status: IncidentStatus;
  affectedUserId?: string;
  affectedUserName?: string;
  affectedResource?: string;
  assignedInvestigatorId?: string;
  assignedInvestigatorName?: string;
  summary: string;
  timeline: DbIncidentTimelineItem[];
  evidence: DbIncidentEvidenceItem[];
  rootCause?: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbBackupRecord {
  id: string;
  backupNumber: string; // BKP-2026-0816-01
  backupType: 'FULL' | 'INCREMENTAL' | 'MANUAL' | 'SCHEDULED' | 'EMERGENCY';
  status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED' | 'VERIFIED';
  recordCounts: Record<string, number>;
  sizeBytes: number;
  checksum: string; // SHA-256
  verificationStatus: 'VERIFIED' | 'UNVERIFIED' | 'FAILED';
  verificationNotes?: string;
  verifiedAt?: string;
  createdBy: string;
  createdAt: string;
}

export interface DbDisasterRecoveryPlan {
  rtoMinutes: number;
  rpoMinutes: number;
  lastTestedAt: string;
  testStatus: 'SUCCESS' | 'WARNING' | 'FAILED';
  runbooks: {
    id: string;
    title: string;
    trigger: string;
    steps: string[];
    estimatedTimeMinutes: number;
  }[];
  recoveryContacts: {
    role: string;
    name: string;
    phone: string;
    email: string;
  }[];
}

export interface DbComplianceMetric {
  id: string;
  title: string;
  framework: 'FINANCIAL_REGULATORY' | 'DATA_PROTECTION' | 'AUDIT_INTEGRITY' | 'ACCESS_CONTROL';
  status: 'COMPLIANT' | 'NEEDS_ATTENTION' | 'NON_COMPLIANT';
  description: string;
  lastChecked: string;
  scorePercent: number;
}

export interface DbComplianceStatus {
  overallScore: number;
  auditComplianceScore: number;
  financialComplianceScore: number;
  privacyComplianceScore: number;
  dataRetentionYears: {
    financial: number;
    loans: number;
    audit: number;
    documents: number;
  };
  metrics: DbComplianceMetric[];
  lastAccessReviewDate: string;
  nextAccessReviewDue: string;
}

// ==========================================
// PHASE 20: ENTERPRISE ADMINISTRATION & SYSTEM CONFIGURATION
// ==========================================

export interface DbOrganizationProfile {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string;
  address: {
    street: string;
    city: string;
    subcity: string;
    woreda: string;
    region: string;
    postalCode: string;
    country: string;
  };
  phones: {
    primary: string;
    secondary: string;
    hotline: string;
  };
  email: string;
  website: string;
  tin: string;
  businessLicense: string;
  registrationNumber: string;
  workingHours: {
    weekdays: string;
    saturdays: string;
    sundays: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
    locationName: string;
  };
  timeZone: string;
  currency: string;
  language: string;
  fiscalYear: {
    startMonth: number;
    endMonth: number;
    currentYear: string;
  };
  dateFormat: string;
  numberFormat: string;
  updatedAt: string;
  updatedBy: string;
}

export interface DbPublicHoliday {
  id: string;
  name: string;
  localName?: string;
  date: string; // YYYY-MM-DD
  isRecurring: boolean;
  description: string;
}

export interface DbSpecialClosure {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  approvedBy: string;
}

export interface DbWorkingCalendar {
  id: string;
  businessDays: number[]; // [1, 2, 3, 4, 5] (Monday=1..Friday=5)
  saturdayWorking: boolean;
  saturdayWorkingHours: string;
  weekendDays: number[]; // [0, 6]
  dailyWorkingHours: {
    start: string; // '08:30'
    end: string; // '17:30'
    lunchBreakStart: string; // '12:30'
    lunchBreakEnd: string; // '13:30'
  };
  holidays: DbPublicHoliday[];
  specialClosures: DbSpecialClosure[];
  updatedAt: string;
}

export interface DbFeatureFlag {
  key: string;
  name: string;
  description: string;
  category: 'CORE' | 'CHANNELS' | 'SECURITY' | 'INNOVATION';
  isEnabled: boolean;
  requiresMfaToToggle: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface DbLocalizationPack {
  languageCode: string;
  languageName: string;
  nativeName: string;
  isDefault: boolean;
  isRtl: boolean;
  totalKeys: number;
  translations: Record<string, string>;
  updatedAt: string;
}

export interface DbNumberingSequenceConfig {
  prefix: string;
  sequenceLength: number;
  currentNumber: number;
  suffix?: string;
  pattern: string; // e.g. '{PREFIX}-{YYYY}-{SEQ}'
}

export interface DbNumberingSystem {
  membershipId: DbNumberingSequenceConfig;
  transactionId: DbNumberingSequenceConfig;
  journalNumber: DbNumberingSequenceConfig;
  voucherNumber: DbNumberingSequenceConfig;
  loanNumber: DbNumberingSequenceConfig;
  ticketNumber: DbNumberingSequenceConfig;
  receiptNumber: DbNumberingSequenceConfig;
  shareCertificateNumber: DbNumberingSequenceConfig;
  updatedAt: string;
}

export interface DbDocumentConfig {
  maxUploadSizeMb: number;
  allowedExtensions: string[];
  imageCompressionQuality: number;
  maxImageDimensionPx: number;
  retentionYears: {
    memberKyc: number;
    loanDocuments: number;
    financialReceipts: number;
    auditTrail: number;
    systemLogs: number;
  };
  storageProvider: 'LOCAL' | 'S3_COMPATIBLE' | 'GCS';
  updatedAt: string;
}

export interface DbBrandingTheme {
  themeMode: 'LIGHT' | 'DARK' | 'SYSTEM';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
  faviconUrl: string;
  loginBackgroundUrl: string;
  displayFont: string;
  bodyFont: string;
  borderRadiusPx: number;
  updatedAt: string;
}

export interface DbConfigAuditLog {
  id: string;
  category:
    | 'ORGANIZATION'
    | 'SYSTEM_SETTINGS'
    | 'SAVINGS_RULES'
    | 'SHARE_RULES'
    | 'LOAN_RULES'
    | 'ACCOUNTING_RULES'
    | 'NOTIFICATION_PROVIDERS'
    | 'SECURITY_POLICY'
    | 'WORKING_CALENDAR'
    | 'DOCUMENT_RULES'
    | 'LOCALIZATION'
    | 'THEME_BRANDING'
    | 'NUMBERING_SYSTEM'
    | 'FEATURE_FLAGS'
    | 'DATA_IMPORT_EXPORT';
  settingKey: string;
  oldValue: any;
  newValue: any;
  changedById: string;
  changedByName: string;
  changedByRole: string;
  ipAddress: string;
  reason?: string;
  timestamp: string;
}


