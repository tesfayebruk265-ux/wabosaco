import { apiClient } from './apiClient';
import type {
  SystemSettings,
  SaccoInstitutionProfile,
  SaccoBranchLocation,
  SaccoDepositBankAccount,
} from '../types/financial';

export interface OrganizationProfile {
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
    secondary?: string;
    hotline?: string;
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
  updatedAt?: string;
  updatedBy?: string;
}

export interface PublicHoliday {
  id: string;
  name: string;
  localName?: string;
  date: string;
  isRecurring: boolean;
  description?: string;
}

export interface SpecialClosure {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PLANNED' | 'EXECUTED' | 'CANCELLED';
  approvedBy: string;
}

export interface WorkingCalendar {
  id: string;
  businessDays: number[];
  saturdayWorking: boolean;
  saturdayWorkingHours: string;
  weekendDays: number[];
  dailyWorkingHours: {
    start: string;
    end: string;
    lunchBreakStart: string;
    lunchBreakEnd: string;
  };
  holidays: PublicHoliday[];
  specialClosures: SpecialClosure[];
  updatedAt: string;
}

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  category: 'CORE' | 'CHANNELS' | 'SECURITY' | 'INNOVATION';
  isEnabled: boolean;
  requiresMfaToToggle?: boolean;
  updatedAt: string;
  updatedBy?: string;
}

export interface LocalizationPack {
  languageCode: string;
  languageName: string;
  nativeName: string;
  isDefault: boolean;
  isRtl: boolean;
  translations: Record<string, string>;
  totalKeys: number;
  updatedAt: string;
}

export interface SequenceConfig {
  prefix: string;
  sequenceLength: number;
  currentNumber: number;
  pattern: string;
}

export interface NumberingSystem {
  membershipId: SequenceConfig;
  transactionId: SequenceConfig;
  journalNumber: SequenceConfig;
  voucherNumber: SequenceConfig;
  loanNumber: SequenceConfig;
  ticketNumber: SequenceConfig;
  receiptNumber: SequenceConfig;
  shareCertificateNumber: SequenceConfig;
  updatedAt: string;
}

export interface DocumentConfig {
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

export interface BrandingTheme {
  themeMode: 'LIGHT' | 'DARK' | 'SYSTEM';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
  faviconUrl: string;
  loginBackgroundUrl?: string;
  displayFont: string;
  bodyFont: string;
  borderRadiusPx: number;
  updatedAt: string;
}

export type {
  SaccoBranchLocation,
  SaccoDepositBankAccount,
  SaccoInstitutionProfile,
  SystemSettings,
} from '../types/financial';

export interface SystemHealthData {
  server: {
    status: string;
    uptimeSeconds: number;
    nodeVersion: string;
    platform: string;
    hostname: string;
    timeZone: string;
    currentTime: string;
  };
  resources: {
    cpuCount: number;
    cpuModel: string;
    cpuLoadAverage: number[];
    memoryUsageMb: number;
    memoryTotalMb: number;
    memoryPercent: number;
    processMemoryMb: number;
  };
  database: {
    engine: string;
    schemaVersion: string;
    totalCollections: number;
    recordCounts: Record<string, number>;
    lastSnapshotSync: string;
    status: string;
  };
  services: Array<{ name: string; status: string; latencyMs: number }>;
  alertsSummary: {
    openSecurityAlerts: number;
    systemErrorsLast24h: number;
  };
}

export interface ConfigAuditLog {
  id: string;
  category: string;
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

export const adminService = {
  // Organization
  async getOrganizationProfile(): Promise<{ success: boolean; data: OrganizationProfile }> {
    return apiClient.request<{ success: boolean; data: OrganizationProfile }>('/admin/organization');
  },

  async updateOrganizationProfile(profile: Partial<OrganizationProfile>, changeReason?: string): Promise<{ success: boolean; data: OrganizationProfile; message: string }> {
    return apiClient.request<{ success: boolean; data: OrganizationProfile; message: string }>('/admin/organization', {
      method: 'PUT',
      body: JSON.stringify({ ...profile, changeReason }),
    });
  },

  // Working Calendar
  async getWorkingCalendar(): Promise<{ success: boolean; data: WorkingCalendar }> {
    return apiClient.request<{ success: boolean; data: WorkingCalendar }>('/admin/calendar');
  },

  async updateWorkingCalendar(calendar: Partial<WorkingCalendar>, changeReason?: string): Promise<{ success: boolean; data: WorkingCalendar; message: string }> {
    return apiClient.request<{ success: boolean; data: WorkingCalendar; message: string }>('/admin/calendar', {
      method: 'PUT',
      body: JSON.stringify({ ...calendar, changeReason }),
    });
  },

  async addPublicHoliday(holiday: Omit<PublicHoliday, 'id'>): Promise<{ success: boolean; data: PublicHoliday; message: string }> {
    return apiClient.request<{ success: boolean; data: PublicHoliday; message: string }>('/admin/calendar/holidays', {
      method: 'POST',
      body: JSON.stringify(holiday),
    });
  },

  async deletePublicHoliday(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.request<{ success: boolean; message: string }>(`/admin/calendar/holidays/${id}`, {
      method: 'DELETE',
    });
  },

  async addSpecialClosure(closure: Omit<SpecialClosure, 'id'>): Promise<{ success: boolean; data: SpecialClosure; message: string }> {
    return apiClient.request<{ success: boolean; data: SpecialClosure; message: string }>('/admin/calendar/closures', {
      method: 'POST',
      body: JSON.stringify(closure),
    });
  },

  async deleteSpecialClosure(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.request<{ success: boolean; message: string }>(`/admin/calendar/closures/${id}`, {
      method: 'DELETE',
    });
  },

  // Feature Flags
  async getFeatureFlags(): Promise<{ success: boolean; data: FeatureFlag[] }> {
    return apiClient.request<{ success: boolean; data: FeatureFlag[] }>('/admin/feature-flags');
  },

  async toggleFeatureFlag(key: string, isEnabled: boolean, reason?: string): Promise<{ success: boolean; data: FeatureFlag; message: string }> {
    return apiClient.request<{ success: boolean; data: FeatureFlag; message: string }>(`/admin/feature-flags/${key}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ isEnabled, reason }),
    });
  },

  // Localization
  async getLocalizationPacks(): Promise<{ success: boolean; data: LocalizationPack[] }> {
    return apiClient.request<{ success: boolean; data: LocalizationPack[] }>('/admin/localization');
  },

  async updateLocalizationPack(langCode: string, translations: Record<string, string>): Promise<{ success: boolean; data: LocalizationPack; message: string }> {
    return apiClient.request<{ success: boolean; data: LocalizationPack; message: string }>(`/admin/localization/${langCode}`, {
      method: 'PUT',
      body: JSON.stringify({ translations }),
    });
  },

  // Numbering System
  async getNumberingSystem(): Promise<{ success: boolean; data: NumberingSystem }> {
    return apiClient.request<{ success: boolean; data: NumberingSystem }>('/admin/numbering');
  },

  async updateNumberingSystem(numbering: Partial<NumberingSystem>): Promise<{ success: boolean; data: NumberingSystem; message: string }> {
    return apiClient.request<{ success: boolean; data: NumberingSystem; message: string }>('/admin/numbering', {
      method: 'PUT',
      body: JSON.stringify(numbering),
    });
  },

  async previewNextNumbers(): Promise<{ success: boolean; data: Record<string, string> }> {
    return apiClient.request<{ success: boolean; data: Record<string, string> }>('/admin/numbering/preview');
  },

  // Document Config
  async getDocumentConfig(): Promise<{ success: boolean; data: DocumentConfig }> {
    return apiClient.request<{ success: boolean; data: DocumentConfig }>('/admin/documents');
  },

  async updateDocumentConfig(config: Partial<DocumentConfig>): Promise<{ success: boolean; data: DocumentConfig; message: string }> {
    return apiClient.request<{ success: boolean; data: DocumentConfig; message: string }>('/admin/documents', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  },

  // Branding Theme
  async getBrandingTheme(): Promise<{ success: boolean; data: BrandingTheme }> {
    return apiClient.request<{ success: boolean; data: BrandingTheme }>('/admin/branding');
  },

  async updateBrandingTheme(theme: Partial<BrandingTheme>): Promise<{ success: boolean; data: BrandingTheme; message: string }> {
    return apiClient.request<{ success: boolean; data: BrandingTheme; message: string }>('/admin/branding', {
      method: 'PUT',
      body: JSON.stringify(theme),
    });
  },

  // System Settings Sections
  async getSystemSettings(): Promise<{ success: boolean; data: SystemSettings }> {
    return apiClient.request<{ success: boolean; data: SystemSettings }>('/admin/system-settings');
  },

  async updateSystemSettingsSection(section: string, updates: Partial<SystemSettings>, changeReason?: string): Promise<{ success: boolean; data: SystemSettings; message: string }> {
    return apiClient.request<{ success: boolean; data: SystemSettings; message: string }>(`/admin/system-settings/${section}`, {
      method: 'PUT',
      body: JSON.stringify({ ...updates, changeReason }),
    });
  },

  // System Health
  async getSystemHealth(): Promise<{ success: boolean; data: SystemHealthData }> {
    return apiClient.request<{ success: boolean; data: SystemHealthData }>('/admin/health');
  },

  // Export / Import
  async exportData(entity: string, format: 'json' | 'csv' = 'json'): Promise<any> {
    if (format === 'csv') {
      window.location.href = `/api/admin/export?entity=${entity}&format=csv`;
      return { success: true };
    }
    return apiClient.request<any>(`/admin/export?entity=${entity}&format=json`);
  },

  async importData(entity: string, records: any[], mode: 'PREVIEW' | 'COMMIT'): Promise<any> {
    return apiClient.request<any>('/admin/import', {
      method: 'POST',
      body: JSON.stringify({ entity, records, mode }),
    });
  },

  // Config Audit Logs
  async getConfigAuditLogs(filters?: { category?: string; actorId?: string }): Promise<{ success: boolean; count: number; data: ConfigAuditLog[] }> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.actorId) params.append('actorId', filters.actorId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.request<{ success: boolean; count: number; data: ConfigAuditLog[] }>(`/admin/audit-logs${query}`);
  },

  // Production Data Management (Phase 24)
  async getProductionDataStatus(): Promise<{ success: boolean; data: ProductionDataStatus }> {
    return apiClient.request<{ success: boolean; data: ProductionDataStatus }>('/admin/production-data/status');
  },

  async getProductionDataDryRun(): Promise<{ success: boolean; data: DryRunReport }> {
    return apiClient.request<{ success: boolean; data: DryRunReport }>('/admin/production-data/dry-run');
  },

  async executeProductionDataCleanup(confirmationPhrase: string, reason?: string): Promise<{ success: boolean; message: string; data: CleanupExecutionResult }> {
    return apiClient.request<{ success: boolean; message: string; data: CleanupExecutionResult }>('/admin/production-data/cleanup', {
      method: 'POST',
      body: JSON.stringify({ confirmationPhrase, reason }),
    });
  },

  async generateOriginalData(options?: {
    memberCount?: number;
    includeLoans?: boolean;
    includeSavings?: boolean;
    includeShares?: boolean;
    includeSupportTickets?: boolean;
    monthsOfHistory?: number;
  }): Promise<{ success: boolean; message: string; data: OriginalDataGenerationSummary }> {
    return apiClient.request<{ success: boolean; message: string; data: OriginalDataGenerationSummary }>('/admin/production-data/generate-original-data', {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  },
};

export interface OriginalDataGenerationSummary {
  success: boolean;
  membersGenerated: number;
  usersGenerated: number;
  savingAccountsGenerated: number;
  shareAccountsGenerated: number;
  loansGenerated: number;
  transactionsGenerated: number;
  journalEntriesGenerated: number;
  supportTicketsGenerated: number;
  totalAssetsEtb: number;
  totalDepositsEtb: number;
  totalShareCapitalEtb: number;
  totalLoanPortfolioEtb: number;
  trialBalanceBalanced: boolean;
  executionTimeMs: number;
  generatedAt: string;
}

export interface ProductionDataStatus {
  status: 'PRODUCTION_CLEAN' | 'DEMO_DATA_ACTIVE';
  isProductionClean: boolean;
  realMemberCount: number;
  demoRecordsCount: number;
  totalUsers: number;
  adminUserPresent: boolean;
  chartOfAccountsCount: number;
  loanProductsCount: number;
  savingProductsCount: number;
  lastBackup: {
    id: string;
    backupNumber: string;
    timestamp: string;
    checksum: string;
    status: string;
    sizeBytes: number;
  } | null;
  lastCleanup: any | null;
}

export interface TableClassification {
  tableName: string;
  category: 'SYSTEM_REQUIRED' | 'PRODUCTION_MASTER_DATA' | 'REAL_USER_DATA' | 'DEMO_DATA' | 'TEMPORARY_DATA' | 'DERIVED_DATA' | 'UNKNOWN';
  description: string;
  totalRecords: number;
  demoRecords: number;
  preservedRecords: number;
  dependencyImpact: string[];
  action: 'PRESERVE_ALL' | 'PURGE_DEMO_PRESERVE_REAL' | 'RESET_BALANCES' | 'PURGE_TEMPORARY';
}

export interface DryRunReport {
  timestamp: string;
  environment: string;
  systemVersion: string;
  adminUser: { id: string; username: string; role: string };
  summary: {
    totalTablesInspected: number;
    totalRecordsFound: number;
    totalDemoRecordsIdentified: number;
    totalRecordsToPreserve: number;
    canSafelyProceed: boolean;
    blockers: string[];
  };
  tables: TableClassification[];
  preservedMasterEntities: {
    roles: number;
    permissions: number;
    chartOfAccounts: number;
    savingProducts: number;
    loanProducts: number;
    slaPolicies: number;
    kbArticles: number;
    systemSettings: boolean;
    organizationProfile: boolean;
    workingCalendar: boolean;
    numberingSystem: boolean;
    productionAdminAccount: string;
  };
  dependencyExecutionOrder: string[];
}

export interface CleanupExecutionResult {
  success: boolean;
  cleanupId: string;
  timestamp: string;
  administrator: { id: string; username: string; fullName: string };
  reason: string;
  backup: {
    backupId: string;
    backupNumber: string;
    checksum: string;
    verificationStatus: string;
    sizeBytes: number;
  };
  deletedCounts: Record<string, number>;
  preservedCounts: Record<string, number>;
  integrityCheck: {
    trialBalanceBalanced: boolean;
    trialBalanceTotalDebit: number;
    trialBalanceTotalCredit: number;
    orphanRecordsFound: number;
    activeAdminCount: number;
    masterConfigPreserved: boolean;
    demoMembersRemaining: number;
    demoLoansRemaining: number;
    demoSavingsRemaining: number;
    demoTransactionsRemaining: number;
  };
  auditLogId: string;
  message: string;
}
