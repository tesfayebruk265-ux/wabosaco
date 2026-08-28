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

export interface WorksheetInspection {
  sheetIndex: number;
  sheetName: string;
  rowCount: number;
  columnCount: number;
  headers: string[];
  detectedEntityType: MigrationEntityType;
  isReportSummary: boolean;
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

export interface ColumnMappingItem {
  sourceColumn: string;
  targetField: string;
  dataType: 'STRING' | 'NUMBER' | 'DATE_EC' | 'DATE_GC' | 'DATE_AUTO' | 'BANK' | 'BOOLEAN';
  isRequired: boolean;
  transformRule?: 'NONE' | 'NORMALIZE_BANK' | 'PARSE_EC_DATE' | 'PARSE_GC_DATE' | 'CLEAN_CURRENCY' | 'TRIM_STRING';
  confidence: number;
  notes?: string;
}

export interface WorksheetMappingConfig {
  sheetName: string;
  entityType: MigrationEntityType;
  skipRows: number;
  isReportSummary: boolean;
  mappings: ColumnMappingItem[];
}

export interface DuplicateMatch {
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

export interface MigrationFinancialBreakdown {
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

export interface MigrationReconciliation {
  sourceTotals: MigrationFinancialBreakdown;
  importedTotals: MigrationFinancialBreakdown;
  differences: MigrationFinancialBreakdown;
  status: 'BALANCED' | 'EXPLAINED_VARIANCE' | 'DISCREPANCY';
  varianceExplanation?: string;
  accountantNotes?: string;
  reconciledAt?: string;
  reconciledBy?: string;
}

export interface DryRunReport {
  generatedAt: string;
  totalRowsRead: number;
  validRowsCount: number;
  rejectedRowsCount: number;
  duplicateCount: number;
  manualReviewCount: number;
  entityBreakdown: Record<string, number>;
  financialTotals: MigrationFinancialBreakdown;
  reconciliation: MigrationReconciliation;
  detectedDuplicates: DuplicateMatch[];
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

export interface MigrationBatch {
  id: string;
  batchNumber: string;
  sourceFileName: string;
  sourceFileSize: number;
  sourceFileHash: string;
  sourcePackageKey?: string;
  appVersion: string;
  dbVersion: string;
  status: MigrationStatus;
  worksheets: WorksheetInspection[];
  mappings: WorksheetMappingConfig[];
  validationSummary: {
    totalRows: number;
    validRows: number;
    rejectedRows: number;
    duplicateCount: number;
    manualReviewCount: number;
    anomaliesCount: number;
  };
  financialSummary: MigrationFinancialBreakdown;
  reconciliation: MigrationReconciliation;
  dryRunReport?: DryRunReport;
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

export interface MigrationException {
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
  issueType: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  description: string;
  resolutionStatus: 'PENDING_REVIEW' | 'RESOLVED' | 'SKIPPED' | 'OVERRIDDEN';
  resolutionAction?: string;
  resolvedById?: string;
  resolvedByName?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface SourcePackageInfo {
  key: string;
  filename: string;
  description: string;
  totalRecordsCount: number;
  totalFinancialVolume: number;
  sheets: string[];
}
