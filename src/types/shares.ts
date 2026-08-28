export interface ShareAccount {
  id: string;
  accountNo: string;
  memberId: string;
  membershipNo: string;
  memberName: string;
  numberOfShares: number;
  sharePrice: number;
  totalShareValue: number;
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED';
  openingDate: string;
  lastTransactionDate?: string;
  certificateNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export type ShareTransactionType = 'SHARE_PURCHASE' | 'SHARE_CONVERSION' | 'SHARE_REVERSAL';

export interface ShareTransaction {
  id: string;
  transactionNo: string;
  shareAccountId: string;
  shareAccountNo: string;
  memberId: string;
  membershipNo: string;
  memberName: string;
  type: ShareTransactionType;
  numberOfShares: number;
  unitPrice: number;
  totalAmount: number;
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
  timestamp: string;
  createdAt: string;
}

export interface ShareCertificate {
  id: string;
  certificateNumber: string;
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

export interface ShareEligibility {
  memberId: string;
  membershipNo: string;
  memberName: string;
  shareAccountId: string;
  shareAccountNo: string;
  currentShares: number;
  currentShareValue: number;
  sharePrice: number;
  requiredMinimumShares: number;
  minShareValue: number;
  isMinimumSatisfied: boolean;
  remainingSharesToMinimum: number;
  remainingValueToMinimum: number;
  canApplyForLoan: boolean;
  votingEligibility: boolean;
  voluntaryAccountId?: string;
  voluntaryAccountNo?: string;
  voluntaryAvailableBalance: number;
  possibleSharesFromVoluntary: number;
  possibleSharesCost: number;
}

export interface ShareStatistics {
  totalShares: number;
  totalShareCapital: number;
  totalAccounts: number;
  compliantCount: number;
  nonCompliantCount: number;
  complianceRate: number;
  averageShares: number;
  averageCapital: number;
  maxShares: number;
  minRequiredShares: number;
  sharePrice: number;
  dividendRate: number;
  tiers: {
    tier1_5: number;
    tier6_20: number;
    tier21_50: number;
    tier51_100: number;
    tier100Plus: number;
    zeroShares: number;
  };
  totalPurchasesCount: number;
  totalConversionsCount: number;
  totalConversionVolume: number;
}

export interface ShareholderRank {
  rank: number;
  shareAccountId: string;
  shareAccountNo: string;
  memberId: string;
  membershipNo: string;
  memberName: string;
  numberOfShares: number;
  totalShareValue: number;
  ownershipPercentage: number;
  status: string;
}

export interface OwnershipReport {
  topShareholders: ShareholderRank[];
  totalShareCapital: number;
  totalShares: number;
  sharePrice: number;
  totalShareholders: number;
}

export interface NonCompliantMemberItem {
  shareAccountId: string;
  shareAccountNo: string;
  memberId: string;
  membershipNo: string;
  memberName: string;
  currentShares: number;
  currentShareValue: number;
  requiredShares: number;
  shortfallShares: number;
  shortfallAmount: number;
  voluntaryAvailableBalance: number;
  canCoverWithVoluntary: boolean;
}

export interface NonCompliantReport {
  totalNonCompliant: number;
  totalShortfallCapital: number;
  nonCompliantMembers: NonCompliantMemberItem[];
}

export interface SharePriceHistoryItem {
  id: string;
  previousPrice: number;
  newPrice: number;
  effectiveDate: string;
  changedById: string;
  changedByName: string;
  reason: string;
  createdAt: string;
}

export interface ShareSettingsData {
  sharePrice: number;
  minRequiredShares: number;
  minShareValue: number;
  shareDividendRate: number;
  institutionName: string;
  baseCurrency: string;
  priceHistory: SharePriceHistoryItem[];
}

export interface PurchaseSharesPayload {
  memberId?: string;
  numberOfShares: number;
  paymentMethod: 'CASH' | 'CBE_BANK' | 'TSEHAY_BANK' | 'INTERNAL_TRANSFER';
  bankReferenceNo?: string;
  narration?: string;
  idempotencyKey?: string;
  receiptUrl?: string;
}

export interface ConvertVoluntarySavingsPayload {
  memberId?: string;
  amountToConvert: number;
  narration?: string;
  idempotencyKey?: string;
}

export interface ReverseShareTxPayload {
  reason: string;
}
