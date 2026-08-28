import fs from 'fs';
import path from 'path';
import {
  DatabaseSchema,
  DbUser,
  DbRole,
  DbPermission,
  DbRolePermission,
  DbUserRole,
  DbRefreshToken,
  DbSession,
  DbPasswordResetToken,
  DbLoginHistory,
  DbSecurityEvent,
  DbAuditLog,
  DbMember,
  DbRegistrationRequest,
  DbDocument,
  DbNotification,
  DbSavingProduct,
  DbSavingAccount,
  DbDepositBatch,
  DbChartOfAccount,
  DbJournalEntry,
  DbFinancialTransaction,
  DbFinancialApproval,
  DbMonthlySavingsSchedule,
  DbInterestPostingRun,
  DbSystemSettings,
  SavingProductCode,
  DbShareAccount,
  DbShareTransaction,
  DbShareCertificate,
  DbSharePriceHistory,
  DbLoanProduct,
  DbMigrationBatch,
  DbMigrationException,
  DbHistoricalOpeningBalance,
  DbLoan,
  DbLoanScheduleItem,
  DbLoanRepayment,
  DbAccountingPeriod,
  DbBankReconciliation,
  DbAnnualBudget,
  DbScheduledReport,
  DbDashboardWidgetConfig,
  DbNotificationTemplate,
  DbNotificationDeliveryLog,
  DbNotificationPreference,
  DbScheduledBroadcast,
  DbCommunicationMessage,
  DbTicket,
  DbTicketMessage,
  DbSlaPolicy,
  DbKnowledgeBaseArticle,
  DbChatSession,
  DbChatMessage,
  DbMfaConfig,
  DbRoleMfaPolicy,
  DbTrustedDevice,
  DbPasswordPolicy,
  DbPasswordHistory,
  DbRiskAssessment,
  DbSecurityAlert,
  DbSecurityIncident,
  DbBackupRecord,
  DbDisasterRecoveryPlan,
  DbComplianceStatus,
  DbOrganizationProfile,
  DbWorkingCalendar,
  DbPublicHoliday,
  DbSpecialClosure,
  DbFeatureFlag,
  DbLocalizationPack,
  DbNumberingSystem,
  DbDocumentConfig,
  DbBrandingTheme,
  DbConfigAuditLog,
} from './schema';
import {
  INITIAL_ROLES,
  INITIAL_PERMISSIONS,
  ROLE_PERMISSION_MAP,
  INITIAL_SAVING_PRODUCTS,
  INITIAL_CHART_OF_ACCOUNTS,
  INITIAL_SYSTEM_SETTINGS,
  INITIAL_LOAN_PRODUCTS,
  getInitialUsers,
  getInitialMembers,
  getInitialRegistrationRequests,
  getInitialSavingAccounts,
  getInitialDepositBatches,
  getInitialFinancialTransactions,
  getInitialJournalEntries,
  getInitialMonthlySavingsSchedules,
  getInitialShareAccounts,
  getInitialShareCertificates,
  getInitialShareTransactions,
  getInitialSharePriceHistory,
  getInitialLoans,
  getInitialLoanSchedules,
  getInitialLoanRepayments,
  getInitialAccountingPeriods,
  getInitialAnnualBudgets,
  getInitialBankReconciliations,
  INITIAL_NOTIFICATION_TEMPLATES,
  getInitialNotificationPreferences,
  getInitialNotificationDeliveryLogs,
  getInitialScheduledBroadcasts,
  getInitialCommunicationMessages,
  INITIAL_SLA_POLICIES,
  INITIAL_KB_ARTICLES,
  getInitialSupportTickets,
  getInitialTicketMessages,
  getInitialChatSessions,
  getInitialChatMessages,
  getInitialMfaConfigs,
  getInitialRoleMfaPolicies,
  getInitialTrustedDevices,
  INITIAL_PASSWORD_POLICY,
  getInitialPasswordHistory,
  getInitialRiskAssessments,
  getInitialSecurityAlerts,
  getInitialSecurityIncidents,
  getInitialBackupRecords,
  INITIAL_DISASTER_RECOVERY_PLAN,
  INITIAL_COMPLIANCE_STATUS,
  INITIAL_ORGANIZATION_PROFILE,
  INITIAL_WORKING_CALENDAR,
  INITIAL_FEATURE_FLAGS,
  INITIAL_LOCALIZATION_PACKS,
  INITIAL_NUMBERING_SYSTEM,
  INITIAL_DOCUMENT_CONFIG,
  INITIAL_BRANDING_THEME,
  getInitialConfigAuditLogs,
} from './seed';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'wabi_sacco_db.json');

class Database {
  private schema: DatabaseSchema;
  private isInitialized = false;

  // In-memory High-Speed Lookups and Index Maps (Phase 21 Database Optimization)
  private indexUsersById: Map<string, DbUser> = new Map();
  private indexUsersByUsername: Map<string, DbUser> = new Map();
  private indexMembersById: Map<string, DbMember> = new Map();
  private indexMembersByUserId: Map<string, DbMember> = new Map();
  private indexSavingAccountsByNo: Map<string, DbSavingAccount> = new Map();

  constructor() {
    this.schema = this.createDefaultSchema();
    this.init();
  }

  public isReady(): boolean {
    return this.isInitialized;
  }

  public rebuildIndexes(): void {
    this.indexUsersById.clear();
    this.indexUsersByUsername.clear();
    this.indexMembersById.clear();
    this.indexMembersByUserId.clear();
    this.indexSavingAccountsByNo.clear();

    this.schema.users.forEach((u) => {
      this.indexUsersById.set(u.id, u);
      this.indexUsersByUsername.set(u.username.toLowerCase(), u);
    });

    this.schema.members.forEach((m) => {
      this.indexMembersById.set(m.id, m);
      if (m.userId) this.indexMembersByUserId.set(m.userId, m);
    });

    this.schema.savingAccounts.forEach((sa) => {
      this.indexSavingAccountsByNo.set(sa.accountNo, sa);
    });
  }

  private createDefaultSchema(): DatabaseSchema {
    const users = getInitialUsers();
    const roles = INITIAL_ROLES;
    const permissions = INITIAL_PERMISSIONS;
    const members = getInitialMembers();
    const registrationRequests = getInitialRegistrationRequests();

    const rolePermissions: DbRolePermission[] = [];
    Object.entries(ROLE_PERMISSION_MAP).forEach(([roleId, permCodes]) => {
      permCodes.forEach((code) => {
        const perm = permissions.find((p) => p.code === code);
        if (perm) {
          rolePermissions.push({ roleId, permissionId: perm.id });
        }
      });
    });

    const userRoles: DbUserRole[] = [
      { userId: 'usr_admin_1', roleId: 'role_admin', assignedAt: '2025-01-10T08:00:00Z', assignedBy: 'SYSTEM' },
      { userId: 'usr_manager_1', roleId: 'role_manager', assignedAt: '2025-01-10T08:00:00Z', assignedBy: 'SYSTEM' },
      { userId: 'usr_acct_1', roleId: 'role_accountant', assignedAt: '2025-01-10T08:00:00Z', assignedBy: 'SYSTEM' },
      { userId: 'usr_auditor_1', roleId: 'role_auditor', assignedAt: '2025-01-10T08:00:00Z', assignedBy: 'SYSTEM' },
      { userId: 'usr_cs_1', roleId: 'role_customer_service', assignedAt: '2025-01-10T08:00:00Z', assignedBy: 'SYSTEM' },
      { userId: 'usr_member_143', roleId: 'role_member', assignedAt: '2025-01-10T08:00:00Z', assignedBy: 'SYSTEM' },
      { userId: 'usr_member_88', roleId: 'role_member', assignedAt: '2025-01-10T08:00:00Z', assignedBy: 'SYSTEM' },
      { userId: 'usr_deactivated_test', roleId: 'role_customer_service', assignedAt: '2025-01-10T08:00:00Z', assignedBy: 'SYSTEM' },
    ];

    return {
      version: 2,
      users,
      roles,
      permissions,
      rolePermissions,
      userRoles,
      refreshTokens: [],
      sessions: [],
      passwordResetTokens: [],
      loginHistory: [],
      securityEvents: [],
      auditLogs: [],
      members,
      registrationRequests,
      documents: [],
      notifications: [],
      membershipSequence: 200,
      savingProducts: INITIAL_SAVING_PRODUCTS,
      savingAccounts: getInitialSavingAccounts(),
      depositBatches: getInitialDepositBatches(),
      chartOfAccounts: INITIAL_CHART_OF_ACCOUNTS,
      journalEntries: getInitialJournalEntries(),
      financialTransactions: getInitialFinancialTransactions(),
      financialApprovals: [],
      monthlySavingsSchedules: getInitialMonthlySavingsSchedules(),
      interestPostingRuns: [],
      systemSettings: INITIAL_SYSTEM_SETTINGS,
      transactionSequence: 200,
      journalSequence: 100,
      shareAccounts: getInitialShareAccounts(),
      shareTransactions: getInitialShareTransactions(),
      shareCertificates: getInitialShareCertificates(),
      sharePriceHistory: getInitialSharePriceHistory(),
      shareSequence: 100,
      certificateSequence: 100,
      loanProducts: INITIAL_LOAN_PRODUCTS,
      loans: getInitialLoans(),
      loanSchedules: getInitialLoanSchedules(),
      loanRepayments: getInitialLoanRepayments(),
      loanSequence: 100,
      repaymentSequence: 100,
      accountingPeriods: getInitialAccountingPeriods(),
      bankReconciliations: getInitialBankReconciliations(),
      annualBudgets: getInitialAnnualBudgets(),
      reconciliationSequence: 100,
      budgetSequence: 100,
      scheduledReports: [
        {
          id: 'sch_1',
          scheduleNo: 'SCH-001',
          title: 'Executive Financial Health Summary',
          reportType: 'balance_sheet',
          frequency: 'MONTHLY',
          format: 'PDF',
          recipients: ['admin@wabisacco.et', 'manager@wabisacco.et'],
          filters: {},
          lastRunAt: '2026-08-01T00:00:00Z',
          nextRunAt: '2026-09-01T00:00:00Z',
          status: 'ACTIVE',
          lastStatusMessage: 'Successfully generated and dispatched on 2026-08-01',
          createdById: 'usr_admin_1',
          createdByName: 'Abebe Bikila (Admin)',
          createdAt: '2026-07-01T10:00:00Z',
          updatedAt: '2026-08-01T00:00:00Z',
        },
        {
          id: 'sch_2',
          scheduleNo: 'SCH-002',
          title: 'Weekly Loan Repayment & Delinquency Tracking',
          reportType: 'loan_aging',
          frequency: 'WEEKLY',
          format: 'EXCEL',
          recipients: ['manager@wabisacco.et', 'accountant@wabisacco.et'],
          filters: {},
          lastRunAt: '2026-08-10T00:00:00Z',
          nextRunAt: '2026-08-17T00:00:00Z',
          status: 'ACTIVE',
          lastStatusMessage: 'Successfully generated and dispatched on 2026-08-10',
          createdById: 'usr_manager_1',
          createdByName: 'Kassahun Belay (Manager)',
          createdAt: '2026-07-15T11:30:00Z',
          updatedAt: '2026-08-10T00:00:00Z',
        }
      ],
      dashboardWidgetConfigs: [],
      scheduledReportSequence: 10,
      notificationTemplates: INITIAL_NOTIFICATION_TEMPLATES,
      notificationDeliveryLogs: getInitialNotificationDeliveryLogs(),
      notificationPreferences: getInitialNotificationPreferences(),
      scheduledBroadcasts: getInitialScheduledBroadcasts(),
      communicationMessages: getInitialCommunicationMessages(),
      broadcastSequence: 10,
      // Phase 18 CRM collections
      supportTickets: getInitialSupportTickets(),
      ticketMessages: getInitialTicketMessages(),
      slaPolicies: INITIAL_SLA_POLICIES,
      kbArticles: INITIAL_KB_ARTICLES,
      chatSessions: getInitialChatSessions(),
      chatMessages: getInitialChatMessages(),
      ticketSequence: 10,
      kbArticleSequence: 110,
      chatSequence: 10,
      // Phase 19 Security & Compliance collections
      mfaConfigs: getInitialMfaConfigs(),
      roleMfaPolicies: getInitialRoleMfaPolicies(),
      trustedDevices: getInitialTrustedDevices(),
      passwordPolicy: INITIAL_PASSWORD_POLICY,
      passwordHistory: getInitialPasswordHistory(),
      riskAssessments: getInitialRiskAssessments(),
      securityAlerts: getInitialSecurityAlerts(),
      securityIncidents: getInitialSecurityIncidents(),
      backupRecords: getInitialBackupRecords(),
      disasterRecoveryPlan: INITIAL_DISASTER_RECOVERY_PLAN,
      complianceStatus: INITIAL_COMPLIANCE_STATUS,
      alertSequence: 10,
      incidentSequence: 10,
      backupSequence: 10,
      // Phase 20 Administration & System Configuration collections
      organizationProfile: INITIAL_ORGANIZATION_PROFILE,
      workingCalendar: INITIAL_WORKING_CALENDAR,
      featureFlags: INITIAL_FEATURE_FLAGS,
      localizationPacks: INITIAL_LOCALIZATION_PACKS,
      numberingSystem: INITIAL_NUMBERING_SYSTEM,
      documentConfig: INITIAL_DOCUMENT_CONFIG,
      brandingTheme: INITIAL_BRANDING_THEME,
      configAuditLogs: getInitialConfigAuditLogs(),
      // Phase 25 Legacy Data Migration
      migrationBatches: [],
      migrationExceptions: [],
      historicalOpeningBalances: [],
      migrationBatchSequence: 1,
    };
  }

  public init(): void {
    if (this.isInitialized) return;

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.version) {
          const defaultSchema = this.createDefaultSchema();
          this.schema = {
            ...defaultSchema,
            ...parsed,
            users: Array.isArray(parsed.users) ? parsed.users : defaultSchema.users,
            userRoles: Array.isArray(parsed.userRoles) ? parsed.userRoles : defaultSchema.userRoles,
            members: Array.isArray(parsed.members) ? parsed.members : getInitialMembers(),
            registrationRequests: Array.isArray(parsed.registrationRequests)
              ? parsed.registrationRequests
              : getInitialRegistrationRequests(),
            documents: Array.isArray(parsed.documents) ? parsed.documents : [],
            notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
            membershipSequence: parsed.membershipSequence !== undefined ? parsed.membershipSequence : 1,
            savingProducts: Array.isArray(parsed.savingProducts) && parsed.savingProducts.length > 0
              ? parsed.savingProducts
              : INITIAL_SAVING_PRODUCTS,
            savingAccounts: Array.isArray(parsed.savingAccounts) ? parsed.savingAccounts : getInitialSavingAccounts(),
            depositBatches: Array.isArray(parsed.depositBatches) ? parsed.depositBatches : getInitialDepositBatches(),
            chartOfAccounts: Array.isArray(parsed.chartOfAccounts) && parsed.chartOfAccounts.length > 0
              ? parsed.chartOfAccounts
              : INITIAL_CHART_OF_ACCOUNTS,
            journalEntries: Array.isArray(parsed.journalEntries) ? parsed.journalEntries : getInitialJournalEntries(),
            financialTransactions: Array.isArray(parsed.financialTransactions)
              ? parsed.financialTransactions
              : getInitialFinancialTransactions(),
            financialApprovals: Array.isArray(parsed.financialApprovals) ? parsed.financialApprovals : [],
            monthlySavingsSchedules: Array.isArray(parsed.monthlySavingsSchedules)
              ? parsed.monthlySavingsSchedules
              : getInitialMonthlySavingsSchedules(),
            systemSettings: {
              ...INITIAL_SYSTEM_SETTINGS,
              ...(parsed.systemSettings || {}),
              institutionProfile: {
                ...INITIAL_SYSTEM_SETTINGS.institutionProfile,
                ...((parsed.systemSettings && parsed.systemSettings.institutionProfile) || {}),
              },
              savingsRules: {
                ...INITIAL_SYSTEM_SETTINGS.savingsRules,
                ...((parsed.systemSettings && parsed.systemSettings.savingsRules) || {}),
              },
              shareRules: {
                ...INITIAL_SYSTEM_SETTINGS.shareRules,
                ...((parsed.systemSettings && parsed.systemSettings.shareRules) || {}),
              },
              loanRules: {
                ...INITIAL_SYSTEM_SETTINGS.loanRules,
                ...((parsed.systemSettings && parsed.systemSettings.loanRules) || {}),
              },
            },
            journalSequence: parsed.journalSequence !== undefined ? parsed.journalSequence : 1,
            shareAccounts: Array.isArray(parsed.shareAccounts) ? parsed.shareAccounts : getInitialShareAccounts(),
            shareTransactions: Array.isArray(parsed.shareTransactions)
              ? parsed.shareTransactions
              : getInitialShareTransactions(),
            shareCertificates: Array.isArray(parsed.shareCertificates)
              ? parsed.shareCertificates
              : getInitialShareCertificates(),
            sharePriceHistory: Array.isArray(parsed.sharePriceHistory)
              ? parsed.sharePriceHistory
              : getInitialSharePriceHistory(),
            shareSequence: parsed.shareSequence !== undefined ? parsed.shareSequence : 1,
            certificateSequence: parsed.certificateSequence !== undefined ? parsed.certificateSequence : 1,
            loanProducts: Array.isArray(parsed.loanProducts) && parsed.loanProducts.length > 0
              ? parsed.loanProducts
              : INITIAL_LOAN_PRODUCTS,
            loans: Array.isArray(parsed.loans) ? parsed.loans : getInitialLoans(),
            loanSchedules: Array.isArray(parsed.loanSchedules) ? parsed.loanSchedules : getInitialLoanSchedules(),
            loanRepayments: Array.isArray(parsed.loanRepayments) ? parsed.loanRepayments : getInitialLoanRepayments(),
            loanSequence: parsed.loanSequence !== undefined ? parsed.loanSequence : 1,
            repaymentSequence: parsed.repaymentSequence !== undefined ? parsed.repaymentSequence : 1,
            accountingPeriods: Array.isArray(parsed.accountingPeriods) && parsed.accountingPeriods.length > 0
              ? parsed.accountingPeriods
              : getInitialAccountingPeriods(),
            bankReconciliations: Array.isArray(parsed.bankReconciliations) ? parsed.bankReconciliations : [],
            annualBudgets: Array.isArray(parsed.annualBudgets) ? parsed.annualBudgets : [],
            reconciliationSequence: parsed.reconciliationSequence !== undefined ? parsed.reconciliationSequence : 1,
            budgetSequence: parsed.budgetSequence !== undefined ? parsed.budgetSequence : 1,
            notificationTemplates: Array.isArray(parsed.notificationTemplates) && parsed.notificationTemplates.length > 0
              ? parsed.notificationTemplates
              : INITIAL_NOTIFICATION_TEMPLATES,
            notificationDeliveryLogs: Array.isArray(parsed.notificationDeliveryLogs)
              ? parsed.notificationDeliveryLogs
              : [],
            notificationPreferences: Array.isArray(parsed.notificationPreferences)
              ? parsed.notificationPreferences
              : getInitialNotificationPreferences(),
            scheduledBroadcasts: Array.isArray(parsed.scheduledBroadcasts) ? parsed.scheduledBroadcasts : [],
            communicationMessages: Array.isArray(parsed.communicationMessages) ? parsed.communicationMessages : [],
            broadcastSequence: parsed.broadcastSequence !== undefined ? parsed.broadcastSequence : 1,
            supportTickets: Array.isArray(parsed.supportTickets) ? parsed.supportTickets : [],
            ticketMessages: Array.isArray(parsed.ticketMessages) ? parsed.ticketMessages : [],
            slaPolicies: Array.isArray(parsed.slaPolicies) && parsed.slaPolicies.length > 0
              ? parsed.slaPolicies
              : INITIAL_SLA_POLICIES,
            kbArticles: Array.isArray(parsed.kbArticles) && parsed.kbArticles.length > 0
              ? parsed.kbArticles
              : INITIAL_KB_ARTICLES,
            chatSessions: Array.isArray(parsed.chatSessions) ? parsed.chatSessions : [],
            chatMessages: Array.isArray(parsed.chatMessages) ? parsed.chatMessages : [],
            ticketSequence: parsed.ticketSequence !== undefined ? parsed.ticketSequence : 1,
            kbArticleSequence: parsed.kbArticleSequence !== undefined ? parsed.kbArticleSequence : 110,
            chatSequence: parsed.chatSequence !== undefined ? parsed.chatSequence : 1,
            mfaConfigs: Array.isArray(parsed.mfaConfigs) ? parsed.mfaConfigs : [],
            roleMfaPolicies: Array.isArray(parsed.roleMfaPolicies) && parsed.roleMfaPolicies.length > 0
              ? parsed.roleMfaPolicies
              : getInitialRoleMfaPolicies(),
            trustedDevices: Array.isArray(parsed.trustedDevices) ? parsed.trustedDevices : [],
            passwordPolicy: parsed.passwordPolicy || INITIAL_PASSWORD_POLICY,
            passwordHistory: Array.isArray(parsed.passwordHistory) ? parsed.passwordHistory : [],
            riskAssessments: Array.isArray(parsed.riskAssessments) ? parsed.riskAssessments : [],
            securityAlerts: Array.isArray(parsed.securityAlerts) ? parsed.securityAlerts : [],
            securityIncidents: Array.isArray(parsed.securityIncidents) ? parsed.securityIncidents : [],
            backupRecords: Array.isArray(parsed.backupRecords) ? parsed.backupRecords : getInitialBackupRecords(),
            disasterRecoveryPlan: parsed.disasterRecoveryPlan || INITIAL_DISASTER_RECOVERY_PLAN,
            complianceStatus: parsed.complianceStatus || INITIAL_COMPLIANCE_STATUS,
            alertSequence: parsed.alertSequence !== undefined ? parsed.alertSequence : 1,
            incidentSequence: parsed.incidentSequence !== undefined ? parsed.incidentSequence : 1,
            backupSequence: parsed.backupSequence !== undefined ? parsed.backupSequence : 10,
            organizationProfile: parsed.organizationProfile || INITIAL_ORGANIZATION_PROFILE,
            workingCalendar: parsed.workingCalendar || INITIAL_WORKING_CALENDAR,
            featureFlags: Array.isArray(parsed.featureFlags) && parsed.featureFlags.length > 0
              ? parsed.featureFlags
              : INITIAL_FEATURE_FLAGS,
            localizationPacks: Array.isArray(parsed.localizationPacks) && parsed.localizationPacks.length > 0
              ? parsed.localizationPacks
              : INITIAL_LOCALIZATION_PACKS,
            numberingSystem: parsed.numberingSystem || INITIAL_NUMBERING_SYSTEM,
            documentConfig: parsed.documentConfig || INITIAL_DOCUMENT_CONFIG,
            brandingTheme: parsed.brandingTheme || INITIAL_BRANDING_THEME,
            configAuditLogs: Array.isArray(parsed.configAuditLogs) ? parsed.configAuditLogs : [],
            migrationBatches: Array.isArray(parsed.migrationBatches) ? parsed.migrationBatches : [],
            migrationExceptions: Array.isArray(parsed.migrationExceptions) ? parsed.migrationExceptions : [],
            historicalOpeningBalances: Array.isArray(parsed.historicalOpeningBalances) ? parsed.historicalOpeningBalances : [],
            migrationBatchSequence: parsed.migrationBatchSequence !== undefined ? parsed.migrationBatchSequence : 1,
          };
        } else {
          this.persist();
        }
      } else {
        this.persist();
      }
      this.isInitialized = true;
      this.rebuildIndexes();
    } catch (err) {
      console.warn('Could not read persistent DB file, using memory storage:', err);
      this.isInitialized = true;
      this.rebuildIndexes();
    }
  }

  private persist(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.schema, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database state:', err);
    }
  }

  // ==========================================
  // SEQUENTIAL MEMBERSHIP ID GENERATOR (WB000001, WB000002...)
  // ==========================================
  public getNextMembershipNo(): string {
    // Find current max sequence from existing members and users
    let maxSeq = this.schema.membershipSequence || 0;
    
    // Check all members
    this.schema.members.forEach((m) => {
      if (m.membershipNo && m.membershipNo.startsWith('WB')) {
        const num = parseInt(m.membershipNo.substring(2), 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    });

    // Check all users
    this.schema.users.forEach((u) => {
      if (u.membershipNo && u.membershipNo.startsWith('WB')) {
        const num = parseInt(u.membershipNo.substring(2), 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    });

    const nextSeq = maxSeq + 1;
    this.schema.membershipSequence = nextSeq;
    this.persist();

    // Pad to 6 digits, e.g. WB000001, WB000201
    return `WB${String(nextSeq).padStart(6, '0')}`;
  }

  // ==========================================
  // MEMBERS MANAGEMENT
  // ==========================================
  public getMembers(): DbMember[] {
    return this.schema.members;
  }

  public getMemberById(id: string): DbMember | undefined {
    return this.schema.members.find((m) => m.id === id || m.membershipNo === id);
  }

  public getMemberByUserId(userId: string): DbMember | undefined {
    return this.schema.members.find((m) => m.userId === userId);
  }

  public getMemberByMembershipNo(membershipNo: string): DbMember | undefined {
    return this.schema.members.find(
      (m) => m.membershipNo.toLowerCase() === membershipNo.trim().toLowerCase()
    );
  }

  public getMemberByNationalId(nationalId: string): DbMember | undefined {
    return this.schema.members.find(
      (m) => m.nationalId.trim().toLowerCase() === nationalId.trim().toLowerCase()
    );
  }

  public createMember(member: DbMember): DbMember {
    this.schema.members.push(member);
    this.persist();
    return member;
  }

  public updateMember(id: string, updates: Partial<DbMember>): DbMember | undefined {
    const idx = this.schema.members.findIndex((m) => m.id === id || m.membershipNo === id);
    if (idx === -1) return undefined;
    this.schema.members[idx] = {
      ...this.schema.members[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.schema.members[idx];
  }

  public deleteMember(id: string): boolean {
    const initialLen = this.schema.members.length;
    this.schema.members = this.schema.members.filter((m) => m.id !== id && m.membershipNo !== id);
    this.persist();
    return this.schema.members.length < initialLen;
  }

  // ==========================================
  // REGISTRATION REQUESTS & RECEIPT VERIFICATION
  // ==========================================
  public getRegistrationRequests(): DbRegistrationRequest[] {
    return this.schema.registrationRequests;
  }

  public getRegistrationRequestById(id: string): DbRegistrationRequest | undefined {
    return this.schema.registrationRequests.find(
      (r) => r.id === id || r.applicationReference === id
    );
  }

  public getRegistrationRequestByReference(ref: string): DbRegistrationRequest | undefined {
    const clean = ref.trim().toLowerCase();
    return this.schema.registrationRequests.find(
      (r) =>
        r.applicationReference.toLowerCase() === clean ||
        r.personalInfo.nationalId.toLowerCase() === clean ||
        r.contactInfo.phoneNumber.replace(/[\s-]/g, '') === clean.replace(/[\s-]/g, '')
    );
  }

  public createRegistrationRequest(req: DbRegistrationRequest): DbRegistrationRequest {
    this.schema.registrationRequests.unshift(req);
    this.persist();
    return req;
  }

  public updateRegistrationRequest(
    id: string,
    updates: Partial<DbRegistrationRequest>
  ): DbRegistrationRequest | undefined {
    const idx = this.schema.registrationRequests.findIndex(
      (r) => r.id === id || r.applicationReference === id
    );
    if (idx === -1) return undefined;
    this.schema.registrationRequests[idx] = {
      ...this.schema.registrationRequests[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.schema.registrationRequests[idx];
  }

  // ==========================================
  // DOCUMENTS & ATTACHMENTS
  // ==========================================
  public saveDocument(doc: DbDocument): DbDocument {
    this.schema.documents.push(doc);
    this.persist();
    return doc;
  }

  public getDocumentById(id: string): DbDocument | undefined {
    return this.schema.documents.find((d) => d.id === id);
  }

  public recordDocumentAccess(documentId: string, entry: { accessedBy: string; accessedAt: string; action: string }): void {
    const doc = this.getDocumentById(documentId);
    if (doc) {
      if (!doc.accessAudit) doc.accessAudit = [];
      doc.accessAudit.push(entry);
      this.persist();
    }
  }

  // ==========================================
  // NOTIFICATIONS & ENTERPRISE COMMUNICATION (PHASE 17)
  // ==========================================
  public createNotification(notif: DbNotification): DbNotification {
    if (!this.schema.notifications) this.schema.notifications = [];
    this.schema.notifications.unshift(notif);
    if (this.schema.notifications.length > 1000) {
      this.schema.notifications = this.schema.notifications.slice(0, 1000);
    }
    this.persist();
    return notif;
  }

  public getNotifications(userId: string): DbNotification[] {
    if (!this.schema.notifications) return [];
    return this.schema.notifications.filter(
      (n) => n.userId === userId || n.recipientId === userId || n.userId === 'ALL' || n.recipientId === 'ALL'
    );
  }

  public markNotificationsRead(userId: string, notificationId?: string): void {
    if (!this.schema.notifications) return;
    this.schema.notifications.forEach((n) => {
      if (notificationId) {
        if (n.id === notificationId && (n.userId === userId || n.recipientId === userId || n.userId === 'ALL' || n.recipientId === 'ALL')) {
          n.isRead = true;
        }
      } else {
        if (n.userId === userId || n.recipientId === userId || n.userId === 'ALL' || n.recipientId === 'ALL') {
          n.isRead = true;
        }
      }
    });
    this.persist();
  }

  public clearAllNotifications(userId: string): void {
    if (!this.schema.notifications) return;
    this.schema.notifications = this.schema.notifications.filter(
      (n) => n.userId !== userId && n.recipientId !== userId
    );
    this.persist();
  }

  public updateNotification(id: string, partial: Partial<DbNotification>): DbNotification | undefined {
    if (!this.schema.notifications) return undefined;
    const item = this.schema.notifications.find((n) => n.id === id);
    if (item) {
      Object.assign(item, partial);
      this.persist();
    }
    return item;
  }

  // --- Templates ---
  public getNotificationTemplates(): DbNotificationTemplate[] {
    return this.schema.notificationTemplates || [];
  }

  public getNotificationTemplateByCode(code: string): DbNotificationTemplate | undefined {
    return (this.schema.notificationTemplates || []).find((t) => t.code === code && t.status === 'ACTIVE');
  }

  public getNotificationTemplateById(id: string): DbNotificationTemplate | undefined {
    return (this.schema.notificationTemplates || []).find((t) => t.id === id);
  }

  public createNotificationTemplate(template: DbNotificationTemplate): DbNotificationTemplate {
    if (!this.schema.notificationTemplates) this.schema.notificationTemplates = [];
    this.schema.notificationTemplates.push(template);
    this.persist();
    return template;
  }

  public updateNotificationTemplate(id: string, partial: Partial<DbNotificationTemplate>): DbNotificationTemplate | undefined {
    const list = this.schema.notificationTemplates || [];
    const idx = list.findIndex((t) => t.id === id);
    if (idx === -1) return undefined;
    list[idx] = { ...list[idx], ...partial, updatedAt: new Date().toISOString() };
    this.persist();
    return list[idx];
  }

  // --- Delivery Logs ---
  public getDeliveryLogs(filters?: {
    channel?: string;
    status?: string;
    category?: string;
    eventCode?: string;
    search?: string;
    recipientUserId?: string;
  }): DbNotificationDeliveryLog[] {
    let logs = this.schema.notificationDeliveryLogs || [];
    if (!filters) return logs;

    if (filters.channel && filters.channel !== 'ALL') {
      logs = logs.filter((l) => l.channel === filters.channel);
    }
    if (filters.status && filters.status !== 'ALL') {
      logs = logs.filter((l) => l.status === filters.status);
    }
    if (filters.category && filters.category !== 'ALL') {
      logs = logs.filter((l) => l.category === filters.category);
    }
    if (filters.eventCode && filters.eventCode !== 'ALL') {
      logs = logs.filter((l) => l.eventCode === filters.eventCode);
    }
    if (filters.recipientUserId) {
      logs = logs.filter((l) => l.recipientUserId === filters.recipientUserId);
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      logs = logs.filter(
        (l) =>
          l.recipientName.toLowerCase().includes(q) ||
          l.recipientContact.toLowerCase().includes(q) ||
          l.title.toLowerCase().includes(q) ||
          l.message.toLowerCase().includes(q) ||
          (l.providerMessageId && l.providerMessageId.toLowerCase().includes(q))
      );
    }
    return logs;
  }

  public createDeliveryLog(log: DbNotificationDeliveryLog): DbNotificationDeliveryLog {
    if (!this.schema.notificationDeliveryLogs) this.schema.notificationDeliveryLogs = [];
    this.schema.notificationDeliveryLogs.unshift(log);
    if (this.schema.notificationDeliveryLogs.length > 5000) {
      this.schema.notificationDeliveryLogs = this.schema.notificationDeliveryLogs.slice(0, 5000);
    }
    this.persist();
    return log;
  }

  public updateDeliveryLog(id: string, partial: Partial<DbNotificationDeliveryLog>): DbNotificationDeliveryLog | undefined {
    const list = this.schema.notificationDeliveryLogs || [];
    const idx = list.findIndex((l) => l.id === id);
    if (idx === -1) return undefined;
    list[idx] = { ...list[idx], ...partial };
    this.persist();
    return list[idx];
  }

  // --- Preferences ---
  public getNotificationPreferences(userId: string): DbNotificationPreference | undefined {
    const prefs = this.schema.notificationPreferences || [];
    let pref = prefs.find((p) => p.userId === userId);
    if (!pref) {
      const user = this.getUserById(userId);
      pref = {
        id: `pref_${userId}`,
        userId,
        memberId: user?.memberId,
        channelsEnabled: {
          inApp: true,
          sms: true,
          email: true,
          telegram: user?.role === 'MEMBER',
        },
        telegramVerified: false,
        categoryPreferences: {
          MEMBERSHIP: { inApp: true, sms: true, email: true, telegram: true },
          SAVINGS: { inApp: true, sms: true, email: true, telegram: true },
          SHARES: { inApp: true, sms: true, email: true, telegram: true },
          LOANS: { inApp: true, sms: true, email: true, telegram: true },
          ACCOUNTING: { inApp: true, sms: false, email: true, telegram: false },
          SYSTEM: { inApp: true, sms: true, email: true, telegram: true },
          MARKETING: { inApp: true, sms: false, email: true, telegram: true },
          GENERAL: { inApp: true, sms: true, email: true, telegram: true },
        },
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
        language: 'en',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (!this.schema.notificationPreferences) this.schema.notificationPreferences = [];
      this.schema.notificationPreferences.push(pref);
      this.persist();
    }
    return pref;
  }

  public saveNotificationPreferences(pref: DbNotificationPreference): DbNotificationPreference {
    if (!this.schema.notificationPreferences) this.schema.notificationPreferences = [];
    const idx = this.schema.notificationPreferences.findIndex((p) => p.userId === pref.userId);
    if (idx >= 0) {
      this.schema.notificationPreferences[idx] = { ...pref, updatedAt: new Date().toISOString() };
    } else {
      this.schema.notificationPreferences.push(pref);
    }
    this.persist();
    return pref;
  }

  public getAllNotificationPreferences(): DbNotificationPreference[] {
    return this.schema.notificationPreferences || [];
  }

  // --- Scheduled Broadcasts ---
  public getScheduledBroadcasts(): DbScheduledBroadcast[] {
    return this.schema.scheduledBroadcasts || [];
  }

  public getScheduledBroadcastById(id: string): DbScheduledBroadcast | undefined {
    return (this.schema.scheduledBroadcasts || []).find((b) => b.id === id);
  }

  public createScheduledBroadcast(broadcast: DbScheduledBroadcast): DbScheduledBroadcast {
    if (!this.schema.scheduledBroadcasts) this.schema.scheduledBroadcasts = [];
    this.schema.scheduledBroadcasts.unshift(broadcast);
    this.persist();
    return broadcast;
  }

  public updateScheduledBroadcast(id: string, partial: Partial<DbScheduledBroadcast>): DbScheduledBroadcast | undefined {
    const list = this.schema.scheduledBroadcasts || [];
    const idx = list.findIndex((b) => b.id === id);
    if (idx === -1) return undefined;
    list[idx] = { ...list[idx], ...partial };
    this.persist();
    return list[idx];
  }

  public getNextBroadcastNo(): string {
    if (!this.schema.broadcastSequence) this.schema.broadcastSequence = 10;
    this.schema.broadcastSequence += 1;
    this.persist();
    return `BCAST-2026-${String(this.schema.broadcastSequence).padStart(4, '0')}`;
  }

  // --- Communication Messages ---
  public getCommunicationMessages(memberId?: string): DbCommunicationMessage[] {
    const list = this.schema.communicationMessages || [];
    if (memberId) {
      return list.filter((m) => m.memberId === memberId);
    }
    return list;
  }

  public createCommunicationMessage(msg: DbCommunicationMessage): DbCommunicationMessage {
    if (!this.schema.communicationMessages) this.schema.communicationMessages = [];
    this.schema.communicationMessages.unshift(msg);
    this.persist();
    return msg;
  }

  // Users
  public getUsers(): DbUser[] {
    return this.schema.users;
  }

  public getUserById(id: string): DbUser | undefined {
    return this.schema.users.find((u) => u.id === id);
  }

  public findUserByIdentifier(identifier: string): DbUser | undefined {
    if (!identifier) return undefined;
    const clean = identifier.trim().toLowerCase();
    const cleanPhone = identifier.trim().replace(/[\s+()-]/g, '');
    const cleanPhoneLocal = cleanPhone.startsWith('251') ? '0' + cleanPhone.slice(3) : cleanPhone;
    const cleanPhoneIntl = cleanPhone.startsWith('0') ? '251' + cleanPhone.slice(1) : cleanPhone;

    // 1. Direct match on username, email, membershipNo, or phone
    const exact = this.schema.users.find((u) => {
      const uEmail = (u.email || '').toLowerCase();
      const uUsername = (u.username || '').toLowerCase();
      const uMemNo = (u.membershipNo || '').toLowerCase();
      const uPhone = (u.phoneNumber || '').replace(/[\s+()-]/g, '');
      const uAliases = ((u as any).aliases || []).map((a: string) => a.toLowerCase());

      return (
        uUsername === clean ||
        uEmail === clean ||
        uMemNo === clean ||
        uAliases.includes(clean) ||
        (uPhone && (uPhone === cleanPhone || uPhone === cleanPhoneLocal || uPhone === cleanPhoneIntl))
      );
    });
    if (exact) return exact;

    // 2. Tolerance for doubled consonants / minor typos in email prefix (e.g., tesfayebrukk265 vs tesfayebruk265)
    const normClean = clean.replace(/(.)\1+/g, '$1');
    const fuzzy = this.schema.users.find((u) => {
      const uEmail = (u.email || '').toLowerCase();
      const normEmail = uEmail.replace(/(.)\1+/g, '$1');
      const uUsername = (u.username || '').toLowerCase();
      const normUsername = uUsername.replace(/(.)\1+/g, '$1');
      return normEmail === normClean || normUsername === normClean;
    });

    return fuzzy;
  }

  public createUser(user: DbUser): DbUser {
    this.schema.users.push(user);
    this.persist();
    return user;
  }

  public updateUser(id: string, updates: Partial<DbUser>): DbUser | undefined {
    const idx = this.schema.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    this.schema.users[idx] = {
      ...this.schema.users[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.schema.users[idx];
  }

  public deleteUser(id: string): boolean {
    const initialLen = this.schema.users.length;
    this.schema.users = this.schema.users.filter((u) => u.id !== id);
    this.schema.userRoles = this.schema.userRoles.filter((ur) => ur.userId !== id);
    this.persist();
    return this.schema.users.length < initialLen;
  }

  // Roles & Permissions
  public getRoles(): DbRole[] {
    return this.schema.roles;
  }

  public getRoleById(id: string): DbRole | undefined {
    return this.schema.roles.find((r) => r.id === id || r.code === id);
  }

  public createRole(role: DbRole): DbRole {
    this.schema.roles.push(role);
    this.persist();
    return role;
  }

  public updateRole(id: string, updates: Partial<DbRole>): DbRole | undefined {
    const idx = this.schema.roles.findIndex((r) => r.id === id || r.code === id);
    if (idx === -1) return undefined;
    this.schema.roles[idx] = { ...this.schema.roles[idx], ...updates };
    this.persist();
    return this.schema.roles[idx];
  }

  public deleteRole(id: string): boolean {
    const role = this.getRoleById(id);
    if (!role || role.isSystem) return false;
    this.schema.roles = this.schema.roles.filter((r) => r.id !== role.id);
    this.schema.rolePermissions = this.schema.rolePermissions.filter((rp) => rp.roleId !== role.id);
    this.schema.userRoles = this.schema.userRoles.filter((ur) => ur.roleId !== role.id);
    this.persist();
    return true;
  }

  public getPermissions(): DbPermission[] {
    return this.schema.permissions;
  }

  public getPermissionsByRoleId(roleId: string): DbPermission[] {
    const rolePerms = this.schema.rolePermissions.filter((rp) => rp.roleId === roleId);
    const permIds = new Set(rolePerms.map((rp) => rp.permissionId));
    return this.schema.permissions.filter((p) => permIds.has(p.id));
  }

  public setRolePermissions(roleId: string, permissionIds: string[]): void {
    this.schema.rolePermissions = this.schema.rolePermissions.filter((rp) => rp.roleId !== roleId);
    permissionIds.forEach((pid) => {
      this.schema.rolePermissions.push({ roleId, permissionId: pid });
    });
    this.persist();
  }

  // User Roles
  public getUserRoles(userId: string): DbRole[] {
    const assignments = this.schema.userRoles.filter((ur) => ur.userId === userId);
    const roleIds = new Set(assignments.map((a) => a.roleId));
    return this.schema.roles.filter((r) => roleIds.has(r.id));
  }

  public getUserPermissions(userId: string): string[] {
    const roles = this.getUserRoles(userId);
    const perms = new Set<string>();
    roles.forEach((r) => {
      const pList = this.getPermissionsByRoleId(r.id);
      pList.forEach((p) => perms.add(p.code));
    });
    return Array.from(perms);
  }

  public assignUserRole(userId: string, roleId: string, assignedBy?: string): void {
    const exists = this.schema.userRoles.some((ur) => ur.userId === userId && ur.roleId === roleId);
    if (!exists) {
      this.schema.userRoles.push({
        userId,
        roleId,
        assignedAt: new Date().toISOString(),
        assignedBy,
      });
      this.persist();
    }
  }

  public removeUserRole(userId: string, roleId: string): void {
    this.schema.userRoles = this.schema.userRoles.filter(
      (ur) => !(ur.userId === userId && ur.roleId === roleId)
    );
    this.persist();
  }

  public setUserRoles(userId: string, roleIds: string[], assignedBy?: string): void {
    this.schema.userRoles = this.schema.userRoles.filter((ur) => ur.userId !== userId);
    roleIds.forEach((roleId) => {
      this.schema.userRoles.push({
        userId,
        roleId,
        assignedAt: new Date().toISOString(),
        assignedBy,
      });
    });
    this.persist();
  }

  // Refresh Tokens & Sessions
  public saveRefreshToken(token: DbRefreshToken): void {
    this.schema.refreshTokens.push(token);
    this.persist();
  }

  public getRefreshTokenByHash(tokenHash: string): DbRefreshToken | undefined {
    return this.schema.refreshTokens.find((t) => t.tokenHash === tokenHash);
  }

  public updateRefreshToken(id: string, updates: Partial<DbRefreshToken>): void {
    const idx = this.schema.refreshTokens.findIndex((t) => t.id === id);
    if (idx !== -1) {
      this.schema.refreshTokens[idx] = { ...this.schema.refreshTokens[idx], ...updates };
      this.persist();
    }
  }

  public revokeTokenFamily(familyId: string, reason?: string): void {
    const now = new Date().toISOString();
    this.schema.refreshTokens.forEach((t) => {
      if (t.familyId === familyId) {
        t.isRevoked = true;
        t.revokedAt = now;
      }
    });
    this.persist();
  }

  public revokeAllUserTokens(userId: string): void {
    const now = new Date().toISOString();
    this.schema.refreshTokens.forEach((t) => {
      if (t.userId === userId) {
        t.isRevoked = true;
        t.revokedAt = now;
      }
    });
    this.schema.sessions.forEach((s) => {
      if (s.userId === userId) {
        s.isActive = false;
      }
    });
    this.persist();
  }

  // Password Resets
  public savePasswordReset(prt: DbPasswordResetToken): void {
    this.schema.passwordResetTokens.push(prt);
    this.persist();
  }

  public getValidPasswordReset(identifier: string, otpCode: string): DbPasswordResetToken | undefined {
    const user = this.findUserByIdentifier(identifier);
    if (!user) return undefined;
    const now = new Date().toISOString();
    return this.schema.passwordResetTokens.find(
      (p) => p.userId === user.id && p.otpCode === otpCode && !p.isUsed && p.expiresAt > now
    );
  }

  public markPasswordResetUsed(id: string): void {
    const item = this.schema.passwordResetTokens.find((p) => p.id === id);
    if (item) {
      item.isUsed = true;
      this.persist();
    }
  }

  // Login History, Security Events, Audit Logs
  public recordLoginAttempt(entry: DbLoginHistory): void {
    this.schema.loginHistory.unshift(entry);
    if (this.schema.loginHistory.length > 500) {
      this.schema.loginHistory = this.schema.loginHistory.slice(0, 500);
    }
    this.persist();
  }

  public recordSecurityEvent(event: DbSecurityEvent): void {
    this.schema.securityEvents.unshift(event);
    if (this.schema.securityEvents.length > 500) {
      this.schema.securityEvents = this.schema.securityEvents.slice(0, 500);
    }
    this.persist();
  }

  public recordAuditLog(log: DbAuditLog): void {
    this.schema.auditLogs.unshift(log);
    if (this.schema.auditLogs.length > 500) {
      this.schema.auditLogs = this.schema.auditLogs.slice(0, 500);
    }
    this.persist();
  }

  public createAuditLog(log: any): void {
    const formattedLog: DbAuditLog = {
      id: log.id || `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      actorId: log.actorId || log.userId || 'SYSTEM',
      actorName: log.actorName || log.username || 'System Administrator',
      actorRole: log.actorRole || log.userRole || 'ADMIN',
      action: log.action || 'GENERAL_ACTION',
      resource: log.resource || log.entity || 'SYSTEM',
      resourceId: log.resourceId || log.entityId || 'N/A',
      beforeState: log.beforeState || null,
      afterState: log.afterState || (log.details ? { details: log.details } : null),
      result: log.result || 'SUCCESS',
      ipAddress: log.ipAddress || '127.0.0.1',
      userAgent: log.userAgent || 'Wabi SACCO Server',
      timestamp: log.timestamp || log.createdAt || new Date().toISOString(),
    };
    this.recordAuditLog(formattedLog);
  }

  public getLoginHistory(limit = 100): DbLoginHistory[] {
    return this.schema.loginHistory.slice(0, limit);
  }

  public getSecurityEvents(limit = 100): DbSecurityEvent[] {
    return this.schema.securityEvents.slice(0, limit);
  }

  public getAuditLogs(limit = 100): DbAuditLog[] {
    return this.schema.auditLogs.slice(0, limit);
  }

  // ==========================================
  // PHASE 12: FINANCIAL SEQUENCES & GENERATORS
  // ==========================================
  public getNextTransactionNo(): string {
    const year = new Date().getFullYear();
    const seq = (this.schema.transactionSequence = (this.schema.transactionSequence || 0) + 1);
    this.persist();
    return `WBS-${year}-${String(seq).padStart(8, '0')}`;
  }

  public getNextJournalNo(): string {
    const year = new Date().getFullYear();
    const seq = (this.schema.journalSequence = (this.schema.journalSequence || 0) + 1);
    this.persist();
    return `JNL-${year}-${String(seq).padStart(6, '0')}`;
  }

  public generateAccountNo(productCode: SavingProductCode, membershipNo: string): string {
    const codeMap: Record<SavingProductCode, string> = {
      REGULAR: 'REG',
      VOLUNTARY: 'VOL',
      CHILDREN: 'CHD',
      TIME_DEPOSIT: 'TD',
    };
    const codePrefix = codeMap[productCode] || 'SAV';
    const cleanMemNo = membershipNo.replace(/^WB0*/, '');
    const padded = cleanMemNo.padStart(6, '0');
    
    // Check if account already exists with this exact no (e.g. for multiple children or time deposits)
    let candidate = `SAV-${codePrefix}-${padded}`;
    let counter = 1;
    while (this.schema.savingAccounts.some((a) => a.accountNo === candidate)) {
      candidate = `SAV-${codePrefix}-${padded}-${counter}`;
      counter++;
    }
    return candidate;
  }

  // System Settings
  public getSystemSettings(): DbSystemSettings {
    return { ...this.schema.systemSettings };
  }

  public updateSystemSettings(updates: Partial<DbSystemSettings>): DbSystemSettings {
    this.schema.systemSettings = { ...this.schema.systemSettings, ...updates };
    this.persist();
    return { ...this.schema.systemSettings };
  }

  // Saving Products
  public getSavingProducts(): DbSavingProduct[] {
    return [...this.schema.savingProducts];
  }

  public getSavingProductById(id: string): DbSavingProduct | undefined {
    return this.schema.savingProducts.find((p) => p.id === id);
  }

  public getSavingProductByCode(code: SavingProductCode): DbSavingProduct | undefined {
    return this.schema.savingProducts.find((p) => p.code === code);
  }

  public updateSavingProduct(id: string, updates: Partial<DbSavingProduct>): DbSavingProduct | undefined {
    const idx = this.schema.savingProducts.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    this.schema.savingProducts[idx] = {
      ...this.schema.savingProducts[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.schema.savingProducts[idx];
  }

  // Saving Accounts
  public getSavingAccounts(): DbSavingAccount[] {
    return [...this.schema.savingAccounts];
  }

  public getSavingAccountById(id: string): DbSavingAccount | undefined {
    return this.schema.savingAccounts.find((a) => a.id === id);
  }

  public getSavingAccountByNo(accountNo: string): DbSavingAccount | undefined {
    return this.schema.savingAccounts.find((a) => a.accountNo === accountNo);
  }

  public getSavingAccountsByMemberId(memberId: string): DbSavingAccount[] {
    return this.schema.savingAccounts.filter((a) => a.memberId === memberId);
  }

  public createSavingAccount(account: DbSavingAccount): DbSavingAccount {
    this.schema.savingAccounts.push(account);
    this.persist();
    return account;
  }

  public updateSavingAccount(id: string, updates: Partial<DbSavingAccount>): DbSavingAccount | undefined {
    const idx = this.schema.savingAccounts.findIndex((a) => a.id === id);
    if (idx === -1) return undefined;
    this.schema.savingAccounts[idx] = {
      ...this.schema.savingAccounts[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.schema.savingAccounts[idx];
  }

  // Deposit Batches (for 3-day holding tracking)
  public getDepositBatches(): DbDepositBatch[] {
    return [...this.schema.depositBatches];
  }

  public getDepositBatchesByAccountId(accountId: string): DbDepositBatch[] {
    return this.schema.depositBatches.filter((b) => b.accountId === accountId);
  }

  public createDepositBatch(batch: DbDepositBatch): DbDepositBatch {
    this.schema.depositBatches.push(batch);
    this.persist();
    return batch;
  }

  public updateDepositBatch(id: string, updates: Partial<DbDepositBatch>): DbDepositBatch | undefined {
    const idx = this.schema.depositBatches.findIndex((b) => b.id === id);
    if (idx === -1) return undefined;
    this.schema.depositBatches[idx] = { ...this.schema.depositBatches[idx], ...updates };
    this.persist();
    return this.schema.depositBatches[idx];
  }

  // Chart of Accounts
  public getChartOfAccounts(): DbChartOfAccount[] {
    return [...this.schema.chartOfAccounts];
  }

  public getChartOfAccountById(id: string): DbChartOfAccount | undefined {
    return this.schema.chartOfAccounts.find((c) => c.id === id || c.accountCode === id);
  }

  public createChartOfAccount(account: DbChartOfAccount): DbChartOfAccount {
    if (!this.schema.chartOfAccounts) this.schema.chartOfAccounts = [];
    this.schema.chartOfAccounts.push(account);
    this.persist();
    return account;
  }

  public updateChartOfAccount(id: string, updates: Partial<DbChartOfAccount>): DbChartOfAccount | undefined {
    const idx = this.schema.chartOfAccounts.findIndex((c) => c.id === id || c.accountCode === id);
    if (idx === -1) return undefined;
    this.schema.chartOfAccounts[idx] = { 
      ...this.schema.chartOfAccounts[idx], 
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.persist();
    return this.schema.chartOfAccounts[idx];
  }

  public deleteChartOfAccount(id: string): boolean {
    if (!this.schema.chartOfAccounts) return false;
    const initialLen = this.schema.chartOfAccounts.length;
    this.schema.chartOfAccounts = this.schema.chartOfAccounts.filter((c) => c.id !== id && c.accountCode !== id);
    if (this.schema.chartOfAccounts.length < initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // Accounting Periods
  public getAccountingPeriods(): DbAccountingPeriod[] {
    return [...(this.schema.accountingPeriods || [])].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  }

  public getAccountingPeriodById(id: string): DbAccountingPeriod | undefined {
    return (this.schema.accountingPeriods || []).find((p) => p.id === id);
  }

  public getCurrentAccountingPeriod(): DbAccountingPeriod | undefined {
    const now = new Date().toISOString().split('T')[0];
    return (this.schema.accountingPeriods || []).find(
      (p) => p.type === 'MONTHLY' && p.startDate <= now && p.endDate >= now
    ) || (this.schema.accountingPeriods || []).find((p) => p.status === 'OPEN' && p.type === 'MONTHLY');
  }

  public createAccountingPeriod(period: DbAccountingPeriod): DbAccountingPeriod {
    if (!this.schema.accountingPeriods) this.schema.accountingPeriods = [];
    this.schema.accountingPeriods.push(period);
    this.persist();
    return period;
  }

  public updateAccountingPeriod(id: string, updates: Partial<DbAccountingPeriod>): DbAccountingPeriod | undefined {
    if (!this.schema.accountingPeriods) this.schema.accountingPeriods = [];
    const idx = this.schema.accountingPeriods.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    this.schema.accountingPeriods[idx] = {
      ...this.schema.accountingPeriods[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.schema.accountingPeriods[idx];
  }

  // Bank Reconciliations
  public getBankReconciliations(): DbBankReconciliation[] {
    return [...(this.schema.bankReconciliations || [])].sort(
      (a, b) => new Date(b.statementDate).getTime() - new Date(a.statementDate).getTime()
    );
  }

  public getBankReconciliationById(id: string): DbBankReconciliation | undefined {
    return (this.schema.bankReconciliations || []).find((r) => r.id === id || r.reconciliationNo === id);
  }

  public createBankReconciliation(recon: DbBankReconciliation): DbBankReconciliation {
    if (!this.schema.bankReconciliations) this.schema.bankReconciliations = [];
    this.schema.bankReconciliations.unshift(recon);
    this.persist();
    return recon;
  }

  public updateBankReconciliation(id: string, updates: Partial<DbBankReconciliation>): DbBankReconciliation | undefined {
    if (!this.schema.bankReconciliations) this.schema.bankReconciliations = [];
    const idx = this.schema.bankReconciliations.findIndex((r) => r.id === id || r.reconciliationNo === id);
    if (idx === -1) return undefined;
    this.schema.bankReconciliations[idx] = {
      ...this.schema.bankReconciliations[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.schema.bankReconciliations[idx];
  }

  public nextReconciliationNumber(accountCode: string, period: string): string {
    const seq = (this.schema.reconciliationSequence || 100) + 1;
    this.schema.reconciliationSequence = seq;
    this.persist();
    return `BRC-${period}-${accountCode}-${seq}`;
  }

  // Annual Budgets
  public getAnnualBudgets(): DbAnnualBudget[] {
    return [...(this.schema.annualBudgets || [])].sort((a, b) => b.fiscalYear - a.fiscalYear);
  }

  public getAnnualBudgetById(id: string): DbAnnualBudget | undefined {
    return (this.schema.annualBudgets || []).find((b) => b.id === id);
  }

  public getActiveAnnualBudget(year?: number): DbAnnualBudget | undefined {
    const targetYear = year || new Date().getFullYear();
    return (this.schema.annualBudgets || []).find(
      (b) => b.fiscalYear === targetYear && (b.status === 'ACTIVE' || b.status === 'APPROVED')
    ) || (this.schema.annualBudgets || []).find((b) => b.status === 'ACTIVE');
  }

  public createAnnualBudget(budget: DbAnnualBudget): DbAnnualBudget {
    if (!this.schema.annualBudgets) this.schema.annualBudgets = [];
    this.schema.annualBudgets.unshift(budget);
    this.persist();
    return budget;
  }

  public updateAnnualBudget(id: string, updates: Partial<DbAnnualBudget>): DbAnnualBudget | undefined {
    if (!this.schema.annualBudgets) this.schema.annualBudgets = [];
    const idx = this.schema.annualBudgets.findIndex((b) => b.id === id);
    if (idx === -1) return undefined;
    this.schema.annualBudgets[idx] = {
      ...this.schema.annualBudgets[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.schema.annualBudgets[idx];
  }

  public nextBudgetNumber(year: number): string {
    const seq = (this.schema.budgetSequence || 100) + 1;
    this.schema.budgetSequence = seq;
    this.persist();
    return `BGT-${year}-${seq}`;
  }

  // Journal Entries
  public getJournalEntries(): DbJournalEntry[] {
    return [...this.schema.journalEntries];
  }

  public getJournalEntryById(id: string): DbJournalEntry | undefined {
    return this.schema.journalEntries.find((j) => j.id === id);
  }

  public createJournalEntry(entry: DbJournalEntry): DbJournalEntry {
    this.schema.journalEntries.push(entry);
    this.persist();
    return entry;
  }

  public updateJournalEntry(id: string, updates: Partial<DbJournalEntry>): DbJournalEntry | undefined {
    const idx = this.schema.journalEntries.findIndex((j) => j.id === id);
    if (idx === -1) return undefined;
    this.schema.journalEntries[idx] = { ...this.schema.journalEntries[idx], ...updates };
    this.persist();
    return this.schema.journalEntries[idx];
  }

  // Financial Transactions
  public getFinancialTransactions(): DbFinancialTransaction[] {
    return [...this.schema.financialTransactions];
  }

  public getFinancialTransactionById(id: string): DbFinancialTransaction | undefined {
    return this.schema.financialTransactions.find((t) => t.id === id);
  }

  public getFinancialTransactionByNo(transactionNo: string): DbFinancialTransaction | undefined {
    return this.schema.financialTransactions.find((t) => t.transactionNo === transactionNo);
  }

  public getFinancialTransactionByIdempotencyKey(key: string): DbFinancialTransaction | undefined {
    if (!key) return undefined;
    return this.schema.financialTransactions.find((t) => t.idempotencyKey === key);
  }

  public getFinancialTransactionByBankRef(ref: string): DbFinancialTransaction | undefined {
    if (!ref) return undefined;
    const cleanRef = ref.trim().toLowerCase();
    return this.schema.financialTransactions.find(
      (t) => t.bankReferenceNo && t.bankReferenceNo.trim().toLowerCase() === cleanRef && t.status !== 'REJECTED'
    );
  }

  public createFinancialTransaction(tx: DbFinancialTransaction): DbFinancialTransaction {
    this.schema.financialTransactions.push(tx);
    this.persist();
    return tx;
  }

  public updateFinancialTransaction(id: string, updates: Partial<DbFinancialTransaction>): DbFinancialTransaction | undefined {
    const idx = this.schema.financialTransactions.findIndex((t) => t.id === id);
    if (idx === -1) return undefined;
    this.schema.financialTransactions[idx] = { ...this.schema.financialTransactions[idx], ...updates };
    this.persist();
    return this.schema.financialTransactions[idx];
  }

  // Financial Approvals (Maker-Checker Queue)
  public getFinancialApprovals(): DbFinancialApproval[] {
    return [...this.schema.financialApprovals];
  }

  public getFinancialApprovalById(id: string): DbFinancialApproval | undefined {
    return this.schema.financialApprovals.find((a) => a.id === id);
  }

  public createFinancialApproval(approval: DbFinancialApproval): DbFinancialApproval {
    this.schema.financialApprovals.push(approval);
    this.persist();
    return approval;
  }

  public updateFinancialApproval(id: string, updates: Partial<DbFinancialApproval>): DbFinancialApproval | undefined {
    const idx = this.schema.financialApprovals.findIndex((a) => a.id === id);
    if (idx === -1) return undefined;
    this.schema.financialApprovals[idx] = { ...this.schema.financialApprovals[idx], ...updates };
    this.persist();
    return this.schema.financialApprovals[idx];
  }

  // Monthly Savings Schedules
  public getMonthlySavingsSchedules(): DbMonthlySavingsSchedule[] {
    return [...this.schema.monthlySavingsSchedules];
  }

  public getMonthlySavingsSchedule(memberId: string, yearMonth: string): DbMonthlySavingsSchedule | undefined {
    return this.schema.monthlySavingsSchedules.find(
      (s) => s.memberId === memberId && s.yearMonth === yearMonth
    );
  }

  public saveMonthlySavingsSchedule(schedule: DbMonthlySavingsSchedule): DbMonthlySavingsSchedule {
    const idx = this.schema.monthlySavingsSchedules.findIndex((s) => s.id === schedule.id);
    if (idx >= 0) {
      this.schema.monthlySavingsSchedules[idx] = schedule;
    } else {
      this.schema.monthlySavingsSchedules.push(schedule);
    }
    this.persist();
    return schedule;
  }

  // Interest Posting Runs
  public getInterestPostingRuns(): DbInterestPostingRun[] {
    return [...this.schema.interestPostingRuns];
  }

  public createInterestPostingRun(run: DbInterestPostingRun): DbInterestPostingRun {
    this.schema.interestPostingRuns.push(run);
    this.persist();
    return run;
  }

  public updateInterestPostingRun(id: string, updates: Partial<DbInterestPostingRun>): DbInterestPostingRun | undefined {
    const idx = this.schema.interestPostingRuns.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    this.schema.interestPostingRuns[idx] = { ...this.schema.interestPostingRuns[idx], ...updates };
    this.persist();
    return this.schema.interestPostingRuns[idx];
  }

  // ==========================================
  // PHASE 13: SHARE MANAGEMENT METHODS
  // ==========================================

  public getNextShareTransactionNo(): string {
    const year = new Date().getFullYear();
    const seq = (this.schema.shareSequence = (this.schema.shareSequence || 0) + 1);
    this.persist();
    return `WBS-SHR-${year}-${String(seq).padStart(8, '0')}`;
  }

  public getNextCertificateNo(): string {
    const year = new Date().getFullYear();
    const seq = (this.schema.certificateSequence = (this.schema.certificateSequence || 0) + 1);
    this.persist();
    return `CERT-WB-${year}-${String(seq).padStart(6, '0')}`;
  }

  public generateShareAccountNo(membershipNo: string): string {
    const cleanMemNo = membershipNo.replace(/^WB0*/, '');
    const padded = cleanMemNo.padStart(6, '0');
    return `SHR-${padded}`;
  }

  // Share Accounts
  public getShareAccounts(): DbShareAccount[] {
    return [...this.schema.shareAccounts];
  }

  public getShareAccountById(id: string): DbShareAccount | undefined {
    return this.schema.shareAccounts.find((a) => a.id === id || a.accountNo === id);
  }

  public getShareAccountByMemberId(memberId: string): DbShareAccount | undefined {
    return this.schema.shareAccounts.find(
      (a) => a.memberId === memberId || a.membershipNo.toLowerCase() === memberId.toLowerCase()
    );
  }

  public getShareAccountByNo(accountNo: string): DbShareAccount | undefined {
    return this.schema.shareAccounts.find((a) => a.accountNo.toLowerCase() === accountNo.trim().toLowerCase());
  }

  public createShareAccount(account: DbShareAccount): DbShareAccount {
    this.schema.shareAccounts.push(account);
    this.persist();
    return account;
  }

  public updateShareAccount(id: string, updates: Partial<DbShareAccount>): DbShareAccount | undefined {
    const idx = this.schema.shareAccounts.findIndex((a) => a.id === id || a.accountNo === id);
    if (idx === -1) return undefined;
    this.schema.shareAccounts[idx] = {
      ...this.schema.shareAccounts[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.schema.shareAccounts[idx];
  }

  // Share Transactions
  public getShareTransactions(): DbShareTransaction[] {
    return [...this.schema.shareTransactions];
  }

  public getShareTransactionById(id: string): DbShareTransaction | undefined {
    return this.schema.shareTransactions.find((t) => t.id === id || t.transactionNo === id);
  }

  public getShareTransactionsByMemberId(memberId: string): DbShareTransaction[] {
    return this.schema.shareTransactions.filter(
      (t) => t.memberId === memberId || t.membershipNo.toLowerCase() === memberId.toLowerCase()
    );
  }

  public getShareTransactionsByAccountId(shareAccountId: string): DbShareTransaction[] {
    return this.schema.shareTransactions.filter((t) => t.shareAccountId === shareAccountId);
  }

  public getShareTransactionByIdempotencyKey(key: string): DbShareTransaction | undefined {
    if (!key) return undefined;
    return this.schema.shareTransactions.find((t) => t.idempotencyKey === key);
  }

  public createShareTransaction(tx: DbShareTransaction): DbShareTransaction {
    this.schema.shareTransactions.push(tx);
    this.persist();
    return tx;
  }

  public updateShareTransaction(id: string, updates: Partial<DbShareTransaction>): DbShareTransaction | undefined {
    const idx = this.schema.shareTransactions.findIndex((t) => t.id === id || t.transactionNo === id);
    if (idx === -1) return undefined;
    this.schema.shareTransactions[idx] = { ...this.schema.shareTransactions[idx], ...updates };
    this.persist();
    return this.schema.shareTransactions[idx];
  }

  // Share Certificates
  public getShareCertificates(memberId?: string): DbShareCertificate[] {
    if (memberId) {
      return this.schema.shareCertificates.filter((c) => c.memberId === memberId || c.membershipNo === memberId);
    }
    return [...this.schema.shareCertificates];
  }

  public getShareCertificateById(id: string): DbShareCertificate | undefined {
    return this.schema.shareCertificates.find((c) => c.id === id || c.certificateNumber === id);
  }

  public getShareCertificateByMemberId(memberId: string): DbShareCertificate | undefined {
    return this.schema.shareCertificates
      .filter((c) => (c.memberId === memberId || c.membershipNo === memberId) && c.status === 'ACTIVE')
      .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())[0];
  }

  public createShareCertificate(cert: DbShareCertificate): DbShareCertificate {
    this.schema.shareCertificates.push(cert);
    this.persist();
    return cert;
  }

  public updateShareCertificate(id: string, updates: Partial<DbShareCertificate>): DbShareCertificate | undefined {
    const idx = this.schema.shareCertificates.findIndex((c) => c.id === id || c.certificateNumber === id);
    if (idx === -1) return undefined;
    this.schema.shareCertificates[idx] = { ...this.schema.shareCertificates[idx], ...updates };
    this.persist();
    return this.schema.shareCertificates[idx];
  }

  // Share Price History
  public getSharePriceHistory(): DbSharePriceHistory[] {
    return [...this.schema.sharePriceHistory].sort(
      (a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
    );
  }

  public createSharePriceHistory(entry: DbSharePriceHistory): DbSharePriceHistory {
    this.schema.sharePriceHistory.unshift(entry);
    this.persist();
    return entry;
  }

  // ==========================================
  // PHASE 14: LOAN SYSTEM METHODS
  // ==========================================

  public getNextLoanNo(): string {
    const seq = (this.schema.loanSequence || 0) + 1;
    this.schema.loanSequence = seq;
    this.persist();
    const year = new Date().getFullYear();
    return `LN-${year}-${String(seq).padStart(6, '0')}`;
  }

  public getNextRepaymentNo(): string {
    const seq = (this.schema.repaymentSequence || 0) + 1;
    this.schema.repaymentSequence = seq;
    this.persist();
    const year = new Date().getFullYear();
    return `LRP-${year}-${String(seq).padStart(6, '0')}`;
  }

  // Loan Products
  public getLoanProducts(): DbLoanProduct[] {
    return [...(this.schema.loanProducts || [])];
  }

  public getLoanProductById(idOrCode: string): DbLoanProduct | undefined {
    return (this.schema.loanProducts || []).find(
      (p) => p.id === idOrCode || p.code.toLowerCase() === idOrCode.toLowerCase()
    );
  }

  public createLoanProduct(product: DbLoanProduct): DbLoanProduct {
    if (!this.schema.loanProducts) this.schema.loanProducts = [];
    this.schema.loanProducts.push(product);
    this.persist();
    return product;
  }

  public updateLoanProduct(id: string, updates: Partial<DbLoanProduct>): DbLoanProduct | undefined {
    if (!this.schema.loanProducts) this.schema.loanProducts = [];
    const idx = this.schema.loanProducts.findIndex((p) => p.id === id || p.code === id);
    if (idx === -1) return undefined;
    this.schema.loanProducts[idx] = {
      ...this.schema.loanProducts[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.schema.loanProducts[idx];
  }

  // Loans
  public getLoans(): DbLoan[] {
    return [...(this.schema.loans || [])];
  }

  public getLoanById(idOrNo: string): DbLoan | undefined {
    return (this.schema.loans || []).find(
      (l) => l.id === idOrNo || l.loanNo.toLowerCase() === idOrNo.toLowerCase()
    );
  }

  public getLoansByMemberId(memberId: string): DbLoan[] {
    return (this.schema.loans || []).filter(
      (l) => l.memberId === memberId || l.membershipNo.toLowerCase() === memberId.toLowerCase()
    );
  }

  public getActiveLoanByMemberId(memberId: string): DbLoan | undefined {
    const activeStatuses = ['ACTIVE', 'DISBURSED', 'OVERDUE', 'AWAITING_GUARANTORS', 'UNDER_REVIEW', 'AWAITING_MANAGER_APPROVAL', 'APPROVED'];
    return (this.schema.loans || []).find(
      (l) => (l.memberId === memberId || l.membershipNo.toLowerCase() === memberId.toLowerCase()) &&
        activeStatuses.includes(l.status)
    );
  }

  public createLoan(loan: DbLoan): DbLoan {
    if (!this.schema.loans) this.schema.loans = [];
    this.schema.loans.push(loan);
    this.persist();
    return loan;
  }

  public updateLoan(id: string, updates: Partial<DbLoan>): DbLoan | undefined {
    if (!this.schema.loans) this.schema.loans = [];
    const idx = this.schema.loans.findIndex((l) => l.id === id || l.loanNo === id);
    if (idx === -1) return undefined;
    this.schema.loans[idx] = {
      ...this.schema.loans[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.schema.loans[idx];
  }

  // Loan Schedules
  public getLoanSchedules(loanId?: string): DbLoanScheduleItem[] {
    const schedules = this.schema.loanSchedules || [];
    if (loanId) {
      return schedules
        .filter((s) => s.loanId === loanId)
        .sort((a, b) => a.installmentNumber - b.installmentNumber);
    }
    return [...schedules].sort((a, b) => a.installmentNumber - b.installmentNumber);
  }

  public getLoanScheduleById(id: string): DbLoanScheduleItem | undefined {
    return (this.schema.loanSchedules || []).find((s) => s.id === id);
  }

  public createLoanSchedules(items: DbLoanScheduleItem[]): DbLoanScheduleItem[] {
    if (!this.schema.loanSchedules) this.schema.loanSchedules = [];
    this.schema.loanSchedules.push(...items);
    this.persist();
    return items;
  }

  public updateLoanScheduleItem(id: string, updates: Partial<DbLoanScheduleItem>): DbLoanScheduleItem | undefined {
    if (!this.schema.loanSchedules) this.schema.loanSchedules = [];
    const idx = this.schema.loanSchedules.findIndex((s) => s.id === id);
    if (idx === -1) return undefined;
    this.schema.loanSchedules[idx] = { ...this.schema.loanSchedules[idx], ...updates };
    this.persist();
    return this.schema.loanSchedules[idx];
  }

  public deleteLoanSchedules(loanId: string): void {
    if (!this.schema.loanSchedules) return;
    this.schema.loanSchedules = this.schema.loanSchedules.filter((s) => s.loanId !== loanId);
    this.persist();
  }

  // Loan Repayments
  public getLoanRepayments(loanId?: string, memberId?: string): DbLoanRepayment[] {
    let repayments = this.schema.loanRepayments || [];
    if (loanId) {
      repayments = repayments.filter((r) => r.loanId === loanId || r.loanNo === loanId);
    }
    if (memberId) {
      repayments = repayments.filter(
        (r) => r.memberId === memberId || r.membershipNo.toLowerCase() === memberId.toLowerCase()
      );
    }
    return [...repayments].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public getLoanRepaymentById(idOrNo: string): DbLoanRepayment | undefined {
    return (this.schema.loanRepayments || []).find(
      (r) => r.id === idOrNo || r.repaymentNo === idOrNo
    );
  }

  public createLoanRepayment(repayment: DbLoanRepayment): DbLoanRepayment {
    if (!this.schema.loanRepayments) this.schema.loanRepayments = [];
    this.schema.loanRepayments.unshift(repayment);
    this.persist();
    return repayment;
  }

  public updateLoanRepayment(id: string, updates: Partial<DbLoanRepayment>): DbLoanRepayment | undefined {
    if (!this.schema.loanRepayments) this.schema.loanRepayments = [];
    const idx = this.schema.loanRepayments.findIndex((r) => r.id === id || r.repaymentNo === id);
    if (idx === -1) return undefined;
    this.schema.loanRepayments[idx] = { ...this.schema.loanRepayments[idx], ...updates };
    this.persist();
    return this.schema.loanRepayments[idx];
  }

  // Scheduled Reports (Phase 16 BI)
  public getScheduledReports(): DbScheduledReport[] {
    return this.schema.scheduledReports || [];
  }

  public getScheduledReportById(id: string): DbScheduledReport | undefined {
    return (this.schema.scheduledReports || []).find((s) => s.id === id || s.scheduleNo === id);
  }

  public createScheduledReport(report: DbScheduledReport): DbScheduledReport {
    if (!this.schema.scheduledReports) this.schema.scheduledReports = [];
    this.schema.scheduledReports.unshift(report);
    this.persist();
    return report;
  }

  public updateScheduledReport(id: string, updates: Partial<DbScheduledReport>): DbScheduledReport | undefined {
    if (!this.schema.scheduledReports) this.schema.scheduledReports = [];
    const idx = this.schema.scheduledReports.findIndex((s) => s.id === id || s.scheduleNo === id);
    if (idx === -1) return undefined;
    this.schema.scheduledReports[idx] = { ...this.schema.scheduledReports[idx], ...updates, updatedAt: new Date().toISOString() };
    this.persist();
    return this.schema.scheduledReports[idx];
  }

  public deleteScheduledReport(id: string): boolean {
    if (!this.schema.scheduledReports) return false;
    const initialLen = this.schema.scheduledReports.length;
    this.schema.scheduledReports = this.schema.scheduledReports.filter((s) => s.id !== id && s.scheduleNo !== id);
    if (this.schema.scheduledReports.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  public getNextScheduledReportNo(): string {
    if (!this.schema.scheduledReportSequence) this.schema.scheduledReportSequence = 10;
    this.schema.scheduledReportSequence += 1;
    this.persist();
    return `SCH-${String(this.schema.scheduledReportSequence).padStart(4, '0')}`;
  }

  // Dashboard Widget Configurations
  public getDashboardWidgetConfig(userId: string, role: string): DbDashboardWidgetConfig | undefined {
    return (this.schema.dashboardWidgetConfigs || []).find(
      (c) => (c.userId === userId || (!c.userId && c.role === role))
    );
  }

  public saveDashboardWidgetConfig(config: DbDashboardWidgetConfig): DbDashboardWidgetConfig {
    if (!this.schema.dashboardWidgetConfigs) this.schema.dashboardWidgetConfigs = [];
    const idx = this.schema.dashboardWidgetConfigs.findIndex(
      (c) => c.userId === config.userId && c.role === config.role
    );
    if (idx >= 0) {
      this.schema.dashboardWidgetConfigs[idx] = { ...config, updatedAt: new Date().toISOString() };
    } else {
      this.schema.dashboardWidgetConfigs.push(config);
    }
    this.persist();
    return config;
  }

  // ==========================================
  // PHASE 18: CRM, HELP DESK, CASE MANAGEMENT
  // ==========================================

  // Support Tickets
  public getSupportTickets(filter?: {
    memberId?: string;
    assignedStaffId?: string;
    department?: string;
    category?: string;
    priority?: string;
    status?: string;
    search?: string;
    isOverdue?: boolean;
    isEscalated?: boolean;
  }): DbTicket[] {
    let list = this.schema.supportTickets || [];

    if (filter) {
      if (filter.memberId) {
        list = list.filter(
          (t) =>
            t.memberId === filter.memberId ||
            t.userId === filter.memberId ||
            (t.membershipNo && t.membershipNo.toLowerCase() === filter.memberId.toLowerCase())
        );
      }
      if (filter.assignedStaffId) {
        list = list.filter((t) => t.assignedStaffId === filter.assignedStaffId);
      }
      if (filter.department) {
        list = list.filter((t) => t.department === filter.department);
      }
      if (filter.category) {
        list = list.filter((t) => t.category === filter.category);
      }
      if (filter.priority) {
        list = list.filter((t) => t.priority === filter.priority);
      }
      if (filter.status) {
        list = list.filter((t) => t.currentStatus === filter.status);
      }
      if (filter.isEscalated !== undefined) {
        list = list.filter((t) => (filter.isEscalated ? t.escalationLevel > 0 : t.escalationLevel === 0));
      }
      if (filter.isOverdue) {
        const now = new Date().toISOString();
        list = list.filter(
          (t) =>
            (t.currentStatus === 'OPEN' ||
              t.currentStatus === 'ASSIGNED' ||
              t.currentStatus === 'IN_PROGRESS' ||
              t.currentStatus === 'ESCALATED') &&
            t.slaResolutionDue < now
        );
      }
      if (filter.search) {
        const q = filter.search.toLowerCase();
        list = list.filter(
          (t) =>
            t.ticketNumber.toLowerCase().includes(q) ||
            t.subject.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.memberFullName.toLowerCase().includes(q) ||
            (t.membershipNo && t.membershipNo.toLowerCase().includes(q))
        );
      }
    }

    return [...list].sort(
      (a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
    );
  }

  public getSupportTicketById(idOrNo: string): DbTicket | undefined {
    return (this.schema.supportTickets || []).find(
      (t) =>
        t.id === idOrNo ||
        t.ticketNumber.toLowerCase() === idOrNo.toLowerCase()
    );
  }

  public createSupportTicket(ticket: DbTicket): DbTicket {
    if (!this.schema.supportTickets) this.schema.supportTickets = [];
    this.schema.supportTickets.unshift(ticket);
    this.persist();
    return ticket;
  }

  public updateSupportTicket(id: string, updates: Partial<DbTicket>): DbTicket | undefined {
    if (!this.schema.supportTickets) this.schema.supportTickets = [];
    const idx = this.schema.supportTickets.findIndex(
      (t) => t.id === id || t.ticketNumber === id
    );
    if (idx === -1) return undefined;
    this.schema.supportTickets[idx] = {
      ...this.schema.supportTickets[idx],
      ...updates,
      updatedDate: new Date().toISOString(),
    };
    this.persist();
    return this.schema.supportTickets[idx];
  }

  public deleteSupportTicket(id: string): boolean {
    if (!this.schema.supportTickets) return false;
    const initLen = this.schema.supportTickets.length;
    this.schema.supportTickets = this.schema.supportTickets.filter(
      (t) => t.id !== id && t.ticketNumber !== id
    );
    if (this.schema.supportTickets.length !== initLen) {
      if (this.schema.ticketMessages) {
        this.schema.ticketMessages = this.schema.ticketMessages.filter(
          (m) => m.ticketId !== id
        );
      }
      this.persist();
      return true;
    }
    return false;
  }

  public getNextTicketNumber(): string {
    if (!this.schema.ticketSequence) this.schema.ticketSequence = 10;
    this.schema.ticketSequence += 1;
    this.persist();
    const year = new Date().getFullYear();
    return `TCK-${year}-${String(this.schema.ticketSequence).padStart(4, '0')}`;
  }

  // Ticket Messages & Conversation Thread
  public getTicketMessages(ticketId: string, includeInternalNotes = true): DbTicketMessage[] {
    let msgs = (this.schema.ticketMessages || []).filter((m) => m.ticketId === ticketId);
    if (!includeInternalNotes) {
      msgs = msgs.filter((m) => !m.isInternalNote);
    }
    return [...msgs].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  public createTicketMessage(msg: DbTicketMessage): DbTicketMessage {
    if (!this.schema.ticketMessages) this.schema.ticketMessages = [];
    this.schema.ticketMessages.push(msg);
    this.persist();
    return msg;
  }

  // SLA Policies
  public getSlaPolicies(): DbSlaPolicy[] {
    return this.schema.slaPolicies || [];
  }

  public getSlaPolicyById(id: string): DbSlaPolicy | undefined {
    return (this.schema.slaPolicies || []).find((s) => s.id === id);
  }

  public updateSlaPolicy(id: string, updates: Partial<DbSlaPolicy>): DbSlaPolicy | undefined {
    if (!this.schema.slaPolicies) this.schema.slaPolicies = [];
    const idx = this.schema.slaPolicies.findIndex((s) => s.id === id);
    if (idx === -1) return undefined;
    this.schema.slaPolicies[idx] = {
      ...this.schema.slaPolicies[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.schema.slaPolicies[idx];
  }

  // Knowledge Base Articles
  public getKbArticles(filter?: {
    category?: string;
    status?: string;
    search?: string;
    tag?: string;
  }): DbKnowledgeBaseArticle[] {
    let list = this.schema.kbArticles || [];

    if (filter) {
      if (filter.category && filter.category !== 'ALL') {
        list = list.filter((a) => a.category === filter.category);
      }
      if (filter.status) {
        list = list.filter((a) => a.status === filter.status);
      }
      if (filter.tag) {
        list = list.filter((a) => a.tags.some((t) => t.toLowerCase() === filter.tag!.toLowerCase()));
      }
      if (filter.search) {
        const q = filter.search.toLowerCase();
        list = list.filter(
          (a) =>
            a.title.toLowerCase().includes(q) ||
            a.summary.toLowerCase().includes(q) ||
            a.content.toLowerCase().includes(q) ||
            a.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
    }

    return [...list].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  public getKbArticleById(idOrSlugOrCode: string): DbKnowledgeBaseArticle | undefined {
    return (this.schema.kbArticles || []).find(
      (a) =>
        a.id === idOrSlugOrCode ||
        a.slug.toLowerCase() === idOrSlugOrCode.toLowerCase() ||
        a.articleCode.toLowerCase() === idOrSlugOrCode.toLowerCase()
    );
  }

  public createKbArticle(article: DbKnowledgeBaseArticle): DbKnowledgeBaseArticle {
    if (!this.schema.kbArticles) this.schema.kbArticles = [];
    this.schema.kbArticles.unshift(article);
    this.persist();
    return article;
  }

  public updateKbArticle(id: string, updates: Partial<DbKnowledgeBaseArticle>): DbKnowledgeBaseArticle | undefined {
    if (!this.schema.kbArticles) this.schema.kbArticles = [];
    const idx = this.schema.kbArticles.findIndex(
      (a) => a.id === id || a.articleCode === id
    );
    if (idx === -1) return undefined;
    this.schema.kbArticles[idx] = {
      ...this.schema.kbArticles[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.schema.kbArticles[idx];
  }

  public deleteKbArticle(id: string): boolean {
    if (!this.schema.kbArticles) return false;
    const initLen = this.schema.kbArticles.length;
    this.schema.kbArticles = this.schema.kbArticles.filter(
      (a) => a.id !== id && a.articleCode !== id
    );
    if (this.schema.kbArticles.length !== initLen) {
      this.persist();
      return true;
    }
    return false;
  }

  public incrementKbViews(id: string): void {
    if (!this.schema.kbArticles) return;
    const item = this.schema.kbArticles.find((a) => a.id === id || a.articleCode === id);
    if (item) {
      item.viewCount = (item.viewCount || 0) + 1;
      this.persist();
    }
  }

  public voteKbArticle(id: string, helpful: boolean): void {
    if (!this.schema.kbArticles) return;
    const item = this.schema.kbArticles.find((a) => a.id === id || a.articleCode === id);
    if (item) {
      if (helpful) {
        item.helpfulCount = (item.helpfulCount || 0) + 1;
      } else {
        item.notHelpfulCount = (item.notHelpfulCount || 0) + 1;
      }
      this.persist();
    }
  }

  public getNextKbArticleCode(): string {
    if (!this.schema.kbArticleSequence) this.schema.kbArticleSequence = 110;
    this.schema.kbArticleSequence += 1;
    this.persist();
    return `KB-${this.schema.kbArticleSequence}`;
  }

  // Live Chat Sessions & Messages
  public getChatSessions(filter?: {
    memberId?: string;
    status?: string;
    agentId?: string;
  }): DbChatSession[] {
    let list = this.schema.chatSessions || [];
    if (filter) {
      if (filter.memberId) {
        list = list.filter((s) => s.memberId === filter.memberId);
      }
      if (filter.status) {
        list = list.filter((s) => s.status === filter.status);
      }
      if (filter.agentId) {
        list = list.filter((s) => s.assignedAgentId === filter.agentId);
      }
    }
    return [...list].sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  }

  public getChatSessionById(id: string): DbChatSession | undefined {
    return (this.schema.chatSessions || []).find(
      (s) => s.id === id || s.sessionNo === id
    );
  }

  public createChatSession(session: DbChatSession): DbChatSession {
    if (!this.schema.chatSessions) this.schema.chatSessions = [];
    this.schema.chatSessions.unshift(session);
    this.persist();
    return session;
  }

  public updateChatSession(id: string, updates: Partial<DbChatSession>): DbChatSession | undefined {
    if (!this.schema.chatSessions) this.schema.chatSessions = [];
    const idx = this.schema.chatSessions.findIndex(
      (s) => s.id === id || s.sessionNo === id
    );
    if (idx === -1) return undefined;
    this.schema.chatSessions[idx] = {
      ...this.schema.chatSessions[idx],
      ...updates,
      lastMessageAt: updates.lastMessageAt || new Date().toISOString(),
    };
    this.persist();
    return this.schema.chatSessions[idx];
  }

  public getChatMessages(sessionId: string): DbChatMessage[] {
    return (this.schema.chatMessages || [])
      .filter((m) => m.sessionId === sessionId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public createChatMessage(msg: DbChatMessage): DbChatMessage {
    if (!this.schema.chatMessages) this.schema.chatMessages = [];
    this.schema.chatMessages.push(msg);
    // Update session lastMessageAt
    const session = (this.schema.chatSessions || []).find((s) => s.id === msg.sessionId);
    if (session) {
      session.lastMessageAt = msg.createdAt;
    }
    this.persist();
    return msg;
  }

  public getNextChatSessionNumber(): string {
    if (!this.schema.chatSequence) this.schema.chatSequence = 10;
    this.schema.chatSequence += 1;
    this.persist();
    const year = new Date().getFullYear();
    return `CHAT-${year}-${String(this.schema.chatSequence).padStart(4, '0')}`;
  }

  // ==========================================
  // PHASE 19: ENTERPRISE SECURITY & COMPLIANCE
  // ==========================================

  // --- Active Sessions Management ---
  public getSessions(filter?: { userId?: string; isActive?: boolean }): DbSession[] {
    let list = this.schema.sessions || [];
    if (filter) {
      if (filter.userId) {
        list = list.filter((s) => s.userId === filter.userId);
      }
      if (filter.isActive !== undefined) {
        list = list.filter((s) => s.isActive === filter.isActive);
      }
    }
    return [...list].sort(
      (a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
    );
  }

  public getSessionById(id: string): DbSession | undefined {
    return (this.schema.sessions || []).find((s) => s.id === id);
  }

  public createSession(session: DbSession): DbSession {
    if (!this.schema.sessions) this.schema.sessions = [];
    this.schema.sessions.unshift(session);
    if (this.schema.sessions.length > 2000) {
      this.schema.sessions = this.schema.sessions.slice(0, 2000);
    }
    this.persist();
    return session;
  }

  public touchSession(id: string, ipAddress?: string): DbSession | undefined {
    if (!this.schema.sessions) return undefined;
    const session = this.schema.sessions.find((s) => s.id === id);
    if (session && session.isActive) {
      session.lastActivityAt = new Date().toISOString();
      if (ipAddress) session.ipAddress = ipAddress;
      this.persist();
    }
    return session;
  }

  public terminateSession(id: string, reason = 'USER_LOGOUT'): boolean {
    if (!this.schema.sessions) return false;
    const session = this.schema.sessions.find((s) => s.id === id);
    if (session) {
      session.isActive = false;
      this.persist();
      return true;
    }
    return false;
  }

  public terminateUserOtherSessions(userId: string, currentSessionId: string): number {
    if (!this.schema.sessions) return 0;
    let count = 0;
    this.schema.sessions.forEach((s) => {
      if (s.userId === userId && s.id !== currentSessionId && s.isActive) {
        s.isActive = false;
        count++;
      }
    });
    if (count > 0) this.persist();
    return count;
  }

  public terminateAllUserSessions(userId: string): number {
    if (!this.schema.sessions) return 0;
    let count = 0;
    this.schema.sessions.forEach((s) => {
      if (s.userId === userId && s.isActive) {
        s.isActive = false;
        count++;
      }
    });
    if (count > 0) this.persist();
    return count;
  }

  // --- MFA Configs & Policies ---
  public getMfaConfigs(): DbMfaConfig[] {
    return this.schema.mfaConfigs || [];
  }

  public getUserMfaConfig(userId: string): DbMfaConfig | undefined {
    return (this.schema.mfaConfigs || []).find((m) => m.userId === userId);
  }

  public saveMfaConfig(config: DbMfaConfig): DbMfaConfig {
    if (!this.schema.mfaConfigs) this.schema.mfaConfigs = [];
    const idx = this.schema.mfaConfigs.findIndex((m) => m.userId === config.userId || m.id === config.id);
    if (idx >= 0) {
      this.schema.mfaConfigs[idx] = { ...config, updatedAt: new Date().toISOString() };
    } else {
      this.schema.mfaConfigs.push(config);
    }
    this.persist();
    return config;
  }

  public getRoleMfaPolicies(): DbRoleMfaPolicy[] {
    return this.schema.roleMfaPolicies || [];
  }

  public getRoleMfaPolicy(role: string): DbRoleMfaPolicy | undefined {
    return (this.schema.roleMfaPolicies || []).find((p) => p.role === role);
  }

  public updateRoleMfaPolicy(role: string, updates: Partial<DbRoleMfaPolicy>): DbRoleMfaPolicy | undefined {
    if (!this.schema.roleMfaPolicies) this.schema.roleMfaPolicies = [];
    const idx = this.schema.roleMfaPolicies.findIndex((p) => p.role === role);
    if (idx >= 0) {
      this.schema.roleMfaPolicies[idx] = {
        ...this.schema.roleMfaPolicies[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.persist();
      return this.schema.roleMfaPolicies[idx];
    } else {
      const created: DbRoleMfaPolicy = {
        id: `rmp_${role.toLowerCase()}`,
        role: role as any,
        isMandatory: updates.isMandatory ?? false,
        allowedMethods: updates.allowedMethods || ['EMAIL_OTP', 'SMS_OTP', 'TOTP'],
        gracePeriodDays: updates.gracePeriodDays ?? 7,
        updatedAt: new Date().toISOString(),
      };
      this.schema.roleMfaPolicies.push(created);
      this.persist();
      return created;
    }
  }

  // --- Trusted Devices ---
  public getTrustedDevices(userId?: string): DbTrustedDevice[] {
    let list = this.schema.trustedDevices || [];
    if (userId) {
      list = list.filter((d) => d.userId === userId);
    }
    return [...list].sort(
      (a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime()
    );
  }

  public getTrustedDeviceById(id: string): DbTrustedDevice | undefined {
    return (this.schema.trustedDevices || []).find((d) => d.id === id);
  }

  public getTrustedDeviceByFingerprint(userId: string, fingerprint: string): DbTrustedDevice | undefined {
    return (this.schema.trustedDevices || []).find(
      (d) => d.userId === userId && d.deviceFingerprint === fingerprint && !d.isRevoked
    );
  }

  public saveTrustedDevice(device: DbTrustedDevice): DbTrustedDevice {
    if (!this.schema.trustedDevices) this.schema.trustedDevices = [];
    const idx = this.schema.trustedDevices.findIndex(
      (d) => d.id === device.id || (d.userId === device.userId && d.deviceFingerprint === device.deviceFingerprint)
    );
    if (idx >= 0) {
      this.schema.trustedDevices[idx] = { ...this.schema.trustedDevices[idx], ...device };
    } else {
      this.schema.trustedDevices.push(device);
    }
    this.persist();
    return device;
  }

  public approveTrustedDevice(id: string): boolean {
    const dev = this.getTrustedDeviceById(id);
    if (dev) {
      dev.isApproved = true;
      dev.approvedAt = new Date().toISOString();
      dev.isRevoked = false;
      this.persist();
      return true;
    }
    return false;
  }

  public revokeTrustedDevice(id: string): boolean {
    const dev = this.getTrustedDeviceById(id);
    if (dev) {
      dev.isRevoked = true;
      this.persist();
      return true;
    }
    return false;
  }

  // --- Password Policies & History ---
  public getPasswordPolicy(): DbPasswordPolicy {
    return this.schema.passwordPolicy || INITIAL_PASSWORD_POLICY;
  }

  public updatePasswordPolicy(updates: Partial<DbPasswordPolicy>, updatedBy: string): DbPasswordPolicy {
    this.schema.passwordPolicy = {
      ...(this.schema.passwordPolicy || INITIAL_PASSWORD_POLICY),
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy,
    };
    this.persist();
    return this.schema.passwordPolicy;
  }

  public getPasswordHistory(userId: string): DbPasswordHistory[] {
    return (this.schema.passwordHistory || []).filter((h) => h.userId === userId);
  }

  public addPasswordHistory(record: DbPasswordHistory): void {
    if (!this.schema.passwordHistory) this.schema.passwordHistory = [];
    this.schema.passwordHistory.unshift(record);
    const policy = this.getPasswordPolicy();
    const keepLimit = (policy.preventReuseCount || 5) + 5;
    const userHistory = this.schema.passwordHistory.filter((h) => h.userId === record.userId);
    if (userHistory.length > keepLimit) {
      const toRemove = new Set(userHistory.slice(keepLimit).map((h) => h.id));
      this.schema.passwordHistory = this.schema.passwordHistory.filter((h) => !toRemove.has(h.id));
    }
    this.persist();
  }

  // --- Risk Assessments ---
  public getRiskAssessments(filter?: {
    userId?: string;
    memberId?: string;
    contextType?: string;
    riskLevel?: string;
  }): DbRiskAssessment[] {
    let list = this.schema.riskAssessments || [];
    if (filter) {
      if (filter.userId) {
        list = list.filter((r) => r.userId === filter.userId);
      }
      if (filter.memberId) {
        list = list.filter((r) => r.memberId === filter.memberId);
      }
      if (filter.contextType) {
        list = list.filter((r) => r.contextType === filter.contextType);
      }
      if (filter.riskLevel) {
        list = list.filter((r) => r.riskLevel === filter.riskLevel);
      }
    }
    return [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public createRiskAssessment(assessment: DbRiskAssessment): DbRiskAssessment {
    if (!this.schema.riskAssessments) this.schema.riskAssessments = [];
    this.schema.riskAssessments.unshift(assessment);
    if (this.schema.riskAssessments.length > 2000) {
      this.schema.riskAssessments = this.schema.riskAssessments.slice(0, 2000);
    }
    this.persist();
    return assessment;
  }

  // --- Security Alerts ---
  public getSecurityAlerts(filter?: {
    status?: string;
    severity?: string;
    category?: string;
  }): DbSecurityAlert[] {
    let list = this.schema.securityAlerts || [];
    if (filter) {
      if (filter.status && filter.status !== 'ALL') {
        list = list.filter((a) => a.status === filter.status);
      }
      if (filter.severity && filter.severity !== 'ALL') {
        list = list.filter((a) => a.severity === filter.severity);
      }
      if (filter.category && filter.category !== 'ALL') {
        list = list.filter((a) => a.category === filter.category);
      }
    }
    return [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getSecurityAlertById(id: string): DbSecurityAlert | undefined {
    return (this.schema.securityAlerts || []).find((a) => a.id === id || a.alertNumber === id);
  }

  public createSecurityAlert(alert: DbSecurityAlert): DbSecurityAlert {
    if (!this.schema.securityAlerts) this.schema.securityAlerts = [];
    this.schema.securityAlerts.unshift(alert);
    if (this.schema.securityAlerts.length > 1000) {
      this.schema.securityAlerts = this.schema.securityAlerts.slice(0, 1000);
    }
    this.persist();
    return alert;
  }

  public updateSecurityAlert(id: string, updates: Partial<DbSecurityAlert>): DbSecurityAlert | undefined {
    if (!this.schema.securityAlerts) return undefined;
    const idx = this.schema.securityAlerts.findIndex((a) => a.id === id || a.alertNumber === id);
    if (idx === -1) return undefined;
    this.schema.securityAlerts[idx] = { ...this.schema.securityAlerts[idx], ...updates };
    this.persist();
    return this.schema.securityAlerts[idx];
  }

  public getNextAlertNumber(): string {
    if (!this.schema.alertSequence) this.schema.alertSequence = 10;
    this.schema.alertSequence += 1;
    this.persist();
    const year = new Date().getFullYear();
    return `ALT-${year}-${String(this.schema.alertSequence).padStart(4, '0')}`;
  }

  // --- Security Incidents ---
  public getSecurityIncidents(filter?: {
    status?: string;
    severity?: string;
    category?: string;
  }): DbSecurityIncident[] {
    let list = this.schema.securityIncidents || [];
    if (filter) {
      if (filter.status && filter.status !== 'ALL') {
        list = list.filter((i) => i.status === filter.status);
      }
      if (filter.severity && filter.severity !== 'ALL') {
        list = list.filter((i) => i.severity === filter.severity);
      }
      if (filter.category && filter.category !== 'ALL') {
        list = list.filter((i) => i.category === filter.category);
      }
    }
    return [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getSecurityIncidentById(id: string): DbSecurityIncident | undefined {
    return (this.schema.securityIncidents || []).find((i) => i.id === id || i.incidentNumber === id);
  }

  public createSecurityIncident(incident: DbSecurityIncident): DbSecurityIncident {
    if (!this.schema.securityIncidents) this.schema.securityIncidents = [];
    this.schema.securityIncidents.unshift(incident);
    this.persist();
    return incident;
  }

  public updateSecurityIncident(id: string, updates: Partial<DbSecurityIncident>): DbSecurityIncident | undefined {
    if (!this.schema.securityIncidents) return undefined;
    const idx = this.schema.securityIncidents.findIndex((i) => i.id === id || i.incidentNumber === id);
    if (idx === -1) return undefined;
    this.schema.securityIncidents[idx] = {
      ...this.schema.securityIncidents[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.schema.securityIncidents[idx];
  }

  public addIncidentTimeline(incidentId: string, item: { action: string; actor: string; notes: string }): DbSecurityIncident | undefined {
    const inc = this.getSecurityIncidentById(incidentId);
    if (inc) {
      if (!inc.timeline) inc.timeline = [];
      inc.timeline.push({
        id: `tl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        action: item.action,
        actor: item.actor,
        notes: item.notes,
      });
      inc.updatedAt = new Date().toISOString();
      this.persist();
    }
    return inc;
  }

  public addIncidentEvidence(incidentId: string, item: { type: string; description: string; dataRef?: string }): DbSecurityIncident | undefined {
    const inc = this.getSecurityIncidentById(incidentId);
    if (inc) {
      if (!inc.evidence) inc.evidence = [];
      inc.evidence.push({
        id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: item.type,
        description: item.description,
        dataRef: item.dataRef,
        addedAt: new Date().toISOString(),
      });
      inc.updatedAt = new Date().toISOString();
      this.persist();
    }
    return inc;
  }

  public getNextIncidentNumber(): string {
    if (!this.schema.incidentSequence) this.schema.incidentSequence = 10;
    this.schema.incidentSequence += 1;
    this.persist();
    const year = new Date().getFullYear();
    return `INC-${year}-${String(this.schema.incidentSequence).padStart(4, '0')}`;
  }

  // --- Backups & Disaster Recovery ---
  public getBackupRecords(): DbBackupRecord[] {
    return [...(this.schema.backupRecords || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getBackupRecordById(id: string): DbBackupRecord | undefined {
    return (this.schema.backupRecords || []).find((b) => b.id === id || b.backupNumber === id);
  }

  public createBackupRecord(record: DbBackupRecord): DbBackupRecord {
    if (!this.schema.backupRecords) this.schema.backupRecords = [];
    this.schema.backupRecords.unshift(record);
    if (this.schema.backupRecords.length > 200) {
      this.schema.backupRecords = this.schema.backupRecords.slice(0, 200);
    }
    this.persist();
    return record;
  }

  public updateBackupVerification(id: string, status: 'VERIFIED' | 'FAILED', notes: string): DbBackupRecord | undefined {
    if (!this.schema.backupRecords) return undefined;
    const item = this.schema.backupRecords.find((b) => b.id === id || b.backupNumber === id);
    if (item) {
      item.verificationStatus = status;
      item.verificationNotes = notes;
      item.verifiedAt = new Date().toISOString();
      this.persist();
    }
    return item;
  }

  public getNextBackupNumber(): string {
    if (!this.schema.backupSequence) this.schema.backupSequence = 10;
    this.schema.backupSequence += 1;
    this.persist();
    const d = new Date();
    const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    return `BKP-${dateStr}-${String(this.schema.backupSequence).padStart(2, '0')}`;
  }

  public getDisasterRecoveryPlan(): DbDisasterRecoveryPlan {
    return this.schema.disasterRecoveryPlan || INITIAL_DISASTER_RECOVERY_PLAN;
  }

  public updateDisasterRecoveryPlan(updates: Partial<DbDisasterRecoveryPlan>): DbDisasterRecoveryPlan {
    this.schema.disasterRecoveryPlan = {
      ...(this.schema.disasterRecoveryPlan || INITIAL_DISASTER_RECOVERY_PLAN),
      ...updates,
    };
    this.persist();
    return this.schema.disasterRecoveryPlan;
  }

  // --- Compliance Status ---
  public getComplianceStatus(): DbComplianceStatus {
    return this.schema.complianceStatus || INITIAL_COMPLIANCE_STATUS;
  }

  public updateComplianceStatus(updates: Partial<DbComplianceStatus>): DbComplianceStatus {
    this.schema.complianceStatus = {
      ...(this.schema.complianceStatus || INITIAL_COMPLIANCE_STATUS),
      ...updates,
    };
    this.persist();
    return this.schema.complianceStatus;
  }

  public getDatabaseSnapshot(): any {
    return JSON.parse(JSON.stringify(this.schema));
  }

  public setDatabaseSnapshot(newSchema: any): void {
    this.schema = newSchema;
    this.rebuildIndexes();
    this.persist();
  }

  // ==========================================
  // PHASE 20: ENTERPRISE ADMINISTRATION & SYSTEM CONFIGURATION
  // ==========================================

  // --- Organization Profile ---
  public getOrganizationProfile(): DbOrganizationProfile {
    return this.schema.organizationProfile || INITIAL_ORGANIZATION_PROFILE;
  }

  public updateOrganizationProfile(
    updates: Partial<DbOrganizationProfile>,
    actor?: { id: string; name: string; role: string; ip?: string; reason?: string }
  ): DbOrganizationProfile {
    const oldVal = { ...this.getOrganizationProfile() };
    this.schema.organizationProfile = {
      ...this.getOrganizationProfile(),
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: actor ? actor.name : (updates.updatedBy || 'SYSTEM'),
    };
    this.persist();

    if (actor) {
      this.addConfigAuditLog({
        category: 'ORGANIZATION',
        settingKey: 'organizationProfile',
        oldValue: oldVal,
        newValue: this.schema.organizationProfile,
        changedById: actor.id,
        changedByName: actor.name,
        changedByRole: actor.role,
        ipAddress: actor.ip || '127.0.0.1',
        reason: actor.reason || 'Organization Profile configuration updated via Admin Console',
      });
    }
    return this.schema.organizationProfile;
  }

  // --- Working Calendar & Holidays ---
  public getWorkingCalendar(): DbWorkingCalendar {
    return this.schema.workingCalendar || INITIAL_WORKING_CALENDAR;
  }

  public updateWorkingCalendar(
    updates: Partial<DbWorkingCalendar>,
    actor?: { id: string; name: string; role: string; ip?: string; reason?: string }
  ): DbWorkingCalendar {
    const oldVal = { ...this.getWorkingCalendar() };
    this.schema.workingCalendar = {
      ...this.getWorkingCalendar(),
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();

    if (actor) {
      this.addConfigAuditLog({
        category: 'WORKING_CALENDAR',
        settingKey: 'workingCalendar',
        oldValue: oldVal,
        newValue: this.schema.workingCalendar,
        changedById: actor.id,
        changedByName: actor.name,
        changedByRole: actor.role,
        ipAddress: actor.ip || '127.0.0.1',
        reason: actor.reason || 'Working calendar parameters updated',
      });
    }
    return this.schema.workingCalendar;
  }

  public addPublicHoliday(
    holiday: Omit<DbPublicHoliday, 'id'>,
    actor?: { id: string; name: string; role: string; ip?: string; reason?: string }
  ): DbPublicHoliday {
    const cal = this.getWorkingCalendar();
    const newHoliday: DbPublicHoliday = {
      ...holiday,
      id: `hol_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    cal.holidays = [...(cal.holidays || []), newHoliday];
    cal.updatedAt = new Date().toISOString();
    this.persist();

    if (actor) {
      this.addConfigAuditLog({
        category: 'WORKING_CALENDAR',
        settingKey: `holiday:${newHoliday.name}`,
        oldValue: null,
        newValue: newHoliday,
        changedById: actor.id,
        changedByName: actor.name,
        changedByRole: actor.role,
        ipAddress: actor.ip || '127.0.0.1',
        reason: actor.reason || `Added public holiday: ${newHoliday.name}`,
      });
    }
    return newHoliday;
  }

  public deletePublicHoliday(
    id: string,
    actor?: { id: string; name: string; role: string; ip?: string; reason?: string }
  ): boolean {
    const cal = this.getWorkingCalendar();
    const existing = (cal.holidays || []).find((h) => h.id === id);
    if (!existing) return false;

    cal.holidays = (cal.holidays || []).filter((h) => h.id !== id);
    cal.updatedAt = new Date().toISOString();
    this.persist();

    if (actor) {
      this.addConfigAuditLog({
        category: 'WORKING_CALENDAR',
        settingKey: `holiday:${existing.name}`,
        oldValue: existing,
        newValue: null,
        changedById: actor.id,
        changedByName: actor.name,
        changedByRole: actor.role,
        ipAddress: actor.ip || '127.0.0.1',
        reason: actor.reason || `Deleted holiday ${existing.name}`,
      });
    }
    return true;
  }

  public addSpecialClosure(
    closure: Omit<DbSpecialClosure, 'id'>,
    actor?: { id: string; name: string; role: string; ip?: string; reason?: string }
  ): DbSpecialClosure {
    const cal = this.getWorkingCalendar();
    const newClosure: DbSpecialClosure = {
      ...closure,
      id: `cls_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    cal.specialClosures = [...(cal.specialClosures || []), newClosure];
    cal.updatedAt = new Date().toISOString();
    this.persist();

    if (actor) {
      this.addConfigAuditLog({
        category: 'WORKING_CALENDAR',
        settingKey: `closure:${newClosure.title}`,
        oldValue: null,
        newValue: newClosure,
        changedById: actor.id,
        changedByName: actor.name,
        changedByRole: actor.role,
        ipAddress: actor.ip || '127.0.0.1',
        reason: actor.reason || `Scheduled special closure: ${newClosure.title}`,
      });
    }
    return newClosure;
  }

  public deleteSpecialClosure(
    id: string,
    actor?: { id: string; name: string; role: string; ip?: string; reason?: string }
  ): boolean {
    const cal = this.getWorkingCalendar();
    const existing = (cal.specialClosures || []).find((c) => c.id === id);
    if (!existing) return false;

    cal.specialClosures = (cal.specialClosures || []).filter((c) => c.id !== id);
    cal.updatedAt = new Date().toISOString();
    this.persist();

    if (actor) {
      this.addConfigAuditLog({
        category: 'WORKING_CALENDAR',
        settingKey: `closure:${existing.title}`,
        oldValue: existing,
        newValue: null,
        changedById: actor.id,
        changedByName: actor.name,
        changedByRole: actor.role,
        ipAddress: actor.ip || '127.0.0.1',
        reason: actor.reason || `Removed special closure: ${existing.title}`,
      });
    }
    return true;
  }

  // --- Feature Flags ---
  public getFeatureFlags(): DbFeatureFlag[] {
    return this.schema.featureFlags || INITIAL_FEATURE_FLAGS;
  }

  public updateFeatureFlag(
    key: string,
    isEnabled: boolean,
    actor?: { id: string; name: string; role: string; ip?: string; reason?: string }
  ): DbFeatureFlag | undefined {
    if (!this.schema.featureFlags) {
      this.schema.featureFlags = [...INITIAL_FEATURE_FLAGS];
    }
    const flag = this.schema.featureFlags.find((f) => f.key === key);
    if (!flag) return undefined;

    const oldState = flag.isEnabled;
    flag.isEnabled = isEnabled;
    flag.updatedAt = new Date().toISOString();
    flag.updatedBy = actor ? actor.name : 'SYSTEM';
    this.persist();

    if (actor) {
      this.addConfigAuditLog({
        category: 'FEATURE_FLAGS',
        settingKey: key,
        oldValue: oldState,
        newValue: isEnabled,
        changedById: actor.id,
        changedByName: actor.name,
        changedByRole: actor.role,
        ipAddress: actor.ip || '127.0.0.1',
        reason: actor.reason || `Toggled feature flag ${flag.name} to ${isEnabled ? 'ENABLED' : 'DISABLED'}`,
      });
    }
    return flag;
  }

  // --- Localization Packs ---
  public getLocalizationPacks(): DbLocalizationPack[] {
    return this.schema.localizationPacks || INITIAL_LOCALIZATION_PACKS;
  }

  public getLocalizationPack(langCode: string): DbLocalizationPack | undefined {
    return this.getLocalizationPacks().find((p) => p.languageCode === langCode);
  }

  public updateLocalizationPack(
    langCode: string,
    translations: Record<string, string>,
    actor?: { id: string; name: string; role: string; ip?: string; reason?: string }
  ): DbLocalizationPack | undefined {
    if (!this.schema.localizationPacks) {
      this.schema.localizationPacks = [...INITIAL_LOCALIZATION_PACKS];
    }
    const pack = this.schema.localizationPacks.find((p) => p.languageCode === langCode);
    if (!pack) return undefined;

    const oldTranslations = { ...pack.translations };
    pack.translations = { ...pack.translations, ...translations };
    pack.totalKeys = Object.keys(pack.translations).length;
    pack.updatedAt = new Date().toISOString();
    this.persist();

    if (actor) {
      this.addConfigAuditLog({
        category: 'LOCALIZATION',
        settingKey: `lang_${langCode}`,
        oldValue: { totalKeys: Object.keys(oldTranslations).length },
        newValue: { totalKeys: pack.totalKeys, updatedKeysCount: Object.keys(translations).length },
        changedById: actor.id,
        changedByName: actor.name,
        changedByRole: actor.role,
        ipAddress: actor.ip || '127.0.0.1',
        reason: actor.reason || `Updated localization dictionaries for ${pack.languageName}`,
      });
    }
    return pack;
  }

  // --- Numbering System ---
  public getNumberingSystem(): DbNumberingSystem {
    return this.schema.numberingSystem || INITIAL_NUMBERING_SYSTEM;
  }

  public updateNumberingSystem(
    updates: Partial<DbNumberingSystem>,
    actor?: { id: string; name: string; role: string; ip?: string; reason?: string }
  ): DbNumberingSystem {
    const oldVal = { ...this.getNumberingSystem() };
    this.schema.numberingSystem = {
      ...this.getNumberingSystem(),
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();

    if (actor) {
      this.addConfigAuditLog({
        category: 'NUMBERING_SYSTEM',
        settingKey: 'numberingSystem',
        oldValue: oldVal,
        newValue: this.schema.numberingSystem,
        changedById: actor.id,
        changedByName: actor.name,
        changedByRole: actor.role,
        ipAddress: actor.ip || '127.0.0.1',
        reason: actor.reason || 'Numbering sequence configurations updated',
      });
    }
    return this.schema.numberingSystem;
  }

  public generateFormattedNumber(type: keyof Omit<DbNumberingSystem, 'updatedAt'>): string {
    const numbering = this.getNumberingSystem();
    const config = numbering[type];
    if (!config) return `${type.toUpperCase()}-${Date.now()}`;

    config.currentNumber += 1;
    this.persist();

    const d = new Date();
    const yyyy = String(d.getFullYear());
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const seqStr = String(config.currentNumber).padStart(config.sequenceLength, '0');

    let output = config.pattern || '{PREFIX}-{YYYY}-{SEQ}';
    output = output.replace('{PREFIX}', config.prefix);
    output = output.replace('{YYYY}', yyyy);
    output = output.replace('{MM}', mm);
    output = output.replace('{DD}', dd);
    output = output.replace(new RegExp(`\\{SEQ(?::(\\d+))?\\}`, 'g'), (_, len) => {
      const targetLen = len ? parseInt(len, 10) : config.sequenceLength;
      return String(config.currentNumber).padStart(targetLen, '0');
    });

    return output;
  }

  // --- Document Configuration ---
  public getDocumentConfig(): DbDocumentConfig {
    return this.schema.documentConfig || INITIAL_DOCUMENT_CONFIG;
  }

  public updateDocumentConfig(
    updates: Partial<DbDocumentConfig>,
    actor?: { id: string; name: string; role: string; ip?: string; reason?: string }
  ): DbDocumentConfig {
    const oldVal = { ...this.getDocumentConfig() };
    this.schema.documentConfig = {
      ...this.getDocumentConfig(),
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();

    if (actor) {
      this.addConfigAuditLog({
        category: 'DOCUMENT_RULES',
        settingKey: 'documentConfig',
        oldValue: oldVal,
        newValue: this.schema.documentConfig,
        changedById: actor.id,
        changedByName: actor.name,
        changedByRole: actor.role,
        ipAddress: actor.ip || '127.0.0.1',
        reason: actor.reason || 'Document storage and retention rules updated',
      });
    }
    return this.schema.documentConfig;
  }

  // --- Branding & Theme ---
  public getBrandingTheme(): DbBrandingTheme {
    return this.schema.brandingTheme || INITIAL_BRANDING_THEME;
  }

  public updateBrandingTheme(
    updates: Partial<DbBrandingTheme>,
    actor?: { id: string; name: string; role: string; ip?: string; reason?: string }
  ): DbBrandingTheme {
    const oldVal = { ...this.getBrandingTheme() };
    this.schema.brandingTheme = {
      ...this.getBrandingTheme(),
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();

    if (actor) {
      this.addConfigAuditLog({
        category: 'THEME_BRANDING',
        settingKey: 'brandingTheme',
        oldValue: oldVal,
        newValue: this.schema.brandingTheme,
        changedById: actor.id,
        changedByName: actor.name,
        changedByRole: actor.role,
        ipAddress: actor.ip || '127.0.0.1',
        reason: actor.reason || 'Brand visual identity and UI theme customized',
      });
    }
    return this.schema.brandingTheme;
  }

  // --- Configuration Audit Trail ---
  public getConfigAuditLogs(filters?: {
    category?: string;
    startDate?: string;
    endDate?: string;
    actorId?: string;
  }): DbConfigAuditLog[] {
    let logs = [...(this.schema.configAuditLogs || [])];
    if (filters?.category) {
      logs = logs.filter((l) => l.category === filters.category);
    }
    if (filters?.actorId) {
      logs = logs.filter((l) => l.changedById === filters.actorId);
    }
    if (filters?.startDate) {
      logs = logs.filter((l) => l.timestamp >= filters.startDate!);
    }
    if (filters?.endDate) {
      logs = logs.filter((l) => l.timestamp <= filters.endDate!);
    }
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public addConfigAuditLog(entry: Omit<DbConfigAuditLog, 'id' | 'timestamp'>): DbConfigAuditLog {
    if (!this.schema.configAuditLogs) {
      this.schema.configAuditLogs = [];
    }
    const newLog: DbConfigAuditLog = {
      ...entry,
      id: `cfg_aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    this.schema.configAuditLogs.unshift(newLog);
    // Keep max 2000 config audit log records
    if (this.schema.configAuditLogs.length > 2000) {
      this.schema.configAuditLogs = this.schema.configAuditLogs.slice(0, 2000);
    }
    this.persist();
    return newLog;
  }

  // --- Extended System Settings Update with Audit ---
  public updateSystemSettingsWithAudit(
    category: DbConfigAuditLog['category'],
    sectionKey: string,
    updates: Partial<DbSystemSettings>,
    actor?: { id: string; name: string; role: string; ip?: string; reason?: string }
  ): DbSystemSettings {
    const oldVal = { ...this.getSystemSettings() };
    this.schema.systemSettings = {
      ...this.getSystemSettings(),
      ...updates,
    };
    this.persist();

    if (actor) {
      this.addConfigAuditLog({
        category,
        settingKey: sectionKey,
        oldValue: oldVal,
        newValue: this.schema.systemSettings,
        changedById: actor.id,
        changedByName: actor.name,
        changedByRole: actor.role,
        ipAddress: actor.ip || '127.0.0.1',
        reason: actor.reason || `Updated ${sectionKey} business rules`,
      });
    }
    return this.schema.systemSettings;
  }

  public countActiveAdmins(): number {
    const adminRole = this.schema.roles.find((r) => r.code === 'ADMIN');
    if (!adminRole) return 0;
    const adminUserIds = new Set(
      this.schema.userRoles.filter((ur) => ur.roleId === adminRole.id).map((ur) => ur.userId)
    );
    return this.schema.users.filter((u) => adminUserIds.has(u.id) && u.isActive && u.status === 'ACTIVE').length;
  }

  // Production Data Reset (Phase 24)
  public executeProductionReset(adminUserId: string = 'usr_admin_1'): void {
    const adminUser = this.schema.users.find((u) => u.id === 'usr_admin_1' || (u.id === adminUserId && u.isActive));
    const adminRole = this.schema.roles.find((r) => r.code === 'ADMIN') || {
      id: 'role_admin',
      name: 'System Administrator',
      code: 'ADMIN' as any,
      description: 'Full institutional governance',
      isSystem: true,
      createdAt: new Date().toISOString(),
    };

    // Clean initial admin user
    const preservedAdmin: DbUser = adminUser || {
      id: 'usr_admin_1',
      username: 'admin.sacco',
      email: 'admin@wabisacco.et',
      fullName: 'Yohannes Girma (System Admin)',
      phoneNumber: '+251911223344',
      passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', // admin123!
      salt: 'c4ca4238a0b923820dcc509a6f75849b',
      passwordChangedAt: new Date().toISOString(),
      role: 'role_admin',
      isActive: true,
      status: 'ACTIVE' as const,
      failedLoginAttempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Reset Chart of Accounts balances to clean 0.00 ETB
    const cleanChartOfAccounts = (this.schema.chartOfAccounts || []).map((acc) => ({
      ...acc,
      balance: 0,
    }));

    this.schema = {
      ...this.schema,
      // 1. Preserve only the designated Initial Administrator
      users: [preservedAdmin],
      userRoles: [
        {
          userId: preservedAdmin.id,
          roleId: adminRole.id,
          assignedAt: new Date().toISOString(),
          assignedBy: 'SYSTEM',
        },
      ],
      // 2. Clear all business & member data
      members: [],
      registrationRequests: [],
      documents: [],
      notifications: [],
      // 3. Clear all financial accounts, journals, and transactions
      savingAccounts: [],
      depositBatches: [],
      financialTransactions: [],
      journalEntries: [],
      financialApprovals: [],
      monthlySavingsSchedules: [],
      interestPostingRuns: [],
      chartOfAccounts: cleanChartOfAccounts,
      // 4. Clear all share accounts & transactions
      shareAccounts: [],
      shareTransactions: [],
      shareCertificates: [],
      sharePriceHistory: [
        {
          id: 'sph_initial_1',
          previousPrice: 500,
          newPrice: 500,
          effectiveDate: new Date().toISOString().split('T')[0],
          changedById: preservedAdmin.id,
          changedByName: preservedAdmin.fullName,
          reason: 'Cooperative Statutory Par Value Initialization',
          createdAt: new Date().toISOString(),
        },
      ],
      // 5. Clear all loans, schedules, and repayments
      loans: [],
      loanSchedules: [],
      loanRepayments: [],
      // 6. Clear all reconciliations & budgets
      bankReconciliations: [],
      annualBudgets: [],
      // 7. Clear all support tickets, chat, & communications
      supportTickets: [],
      ticketMessages: [],
      chatSessions: [],
      chatMessages: [],
      scheduledBroadcasts: [],
      communicationMessages: [],
      notificationDeliveryLogs: [],
      // 8. Clear security events, alerts, and temporary credentials
      securityAlerts: [],
      securityIncidents: [],
      riskAssessments: [],
      trustedDevices: [],
      mfaConfigs: [],
      passwordHistory: [],
      sessions: [],
      refreshTokens: [],
      passwordResetTokens: [],
      // 9. Reset Sequential ID Counters to 1
      membershipSequence: 1,
      transactionSequence: 1,
      journalSequence: 1,
      shareSequence: 1,
      certificateSequence: 1,
      loanSequence: 1,
      repaymentSequence: 1,
      ticketSequence: 1,
      chatSequence: 1,
      reconciliationSequence: 1,
      budgetSequence: 1,
      alertSequence: 1,
      incidentSequence: 1,
      migrationBatchSequence: 1,
    };

    this.rebuildIndexes();
    this.persist();
  }

  // ==========================================
  // PHASE 25: LEGACY DATA MIGRATION & RECONCILIATION
  // ==========================================
  public getNextMigrationBatchNo(): string {
    const year = new Date().getFullYear();
    const seq = this.schema.migrationBatchSequence || 1;
    this.schema.migrationBatchSequence = seq + 1;
    this.persist();
    return `MB-${year}-${String(seq).padStart(4, '0')}`;
  }

  public getMigrationBatches(): DbMigrationBatch[] {
    return [...(this.schema.migrationBatches || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getMigrationBatchById(id: string): DbMigrationBatch | undefined {
    return (this.schema.migrationBatches || []).find((b) => b.id === id);
  }

  public createMigrationBatch(batch: DbMigrationBatch): DbMigrationBatch {
    if (!this.schema.migrationBatches) {
      this.schema.migrationBatches = [];
    }
    this.schema.migrationBatches.push(batch);
    this.persist();
    return batch;
  }

  public updateMigrationBatch(id: string, updates: Partial<DbMigrationBatch>): DbMigrationBatch {
    const idx = (this.schema.migrationBatches || []).findIndex((b) => b.id === id);
    if (idx === -1) {
      throw new Error(`Migration batch '${id}' not found`);
    }
    const updated = {
      ...this.schema.migrationBatches[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.schema.migrationBatches[idx] = updated;
    this.persist();
    return updated;
  }

  public deleteMigrationBatch(id: string): boolean {
    const initialLen = this.schema.migrationBatches.length;
    this.schema.migrationBatches = this.schema.migrationBatches.filter((b) => b.id !== id);
    this.schema.migrationExceptions = (this.schema.migrationExceptions || []).filter((e) => e.batchId !== id);
    this.schema.historicalOpeningBalances = (this.schema.historicalOpeningBalances || []).filter((h) => h.batchId !== id);
    this.persist();
    return this.schema.migrationBatches.length < initialLen;
  }

  public getMigrationExceptions(batchId?: string): DbMigrationException[] {
    const list = this.schema.migrationExceptions || [];
    if (batchId) {
      return list.filter((e) => e.batchId === batchId);
    }
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getMigrationExceptionById(id: string): DbMigrationException | undefined {
    return (this.schema.migrationExceptions || []).find((e) => e.id === id);
  }

  public createMigrationException(ex: DbMigrationException): DbMigrationException {
    if (!this.schema.migrationExceptions) {
      this.schema.migrationExceptions = [];
    }
    this.schema.migrationExceptions.push(ex);
    this.persist();
    return ex;
  }

  public updateMigrationException(id: string, updates: Partial<DbMigrationException>): DbMigrationException {
    const idx = (this.schema.migrationExceptions || []).findIndex((e) => e.id === id);
    if (idx === -1) {
      throw new Error(`Migration exception '${id}' not found`);
    }
    const updated = {
      ...this.schema.migrationExceptions[idx],
      ...updates,
    };
    this.schema.migrationExceptions[idx] = updated;
    this.persist();
    return updated;
  }

  public getHistoricalOpeningBalances(batchId?: string): DbHistoricalOpeningBalance[] {
    const list = this.schema.historicalOpeningBalances || [];
    if (batchId) {
      return list.filter((b) => b.batchId === batchId);
    }
    return [...list];
  }

  public createHistoricalOpeningBalance(bal: DbHistoricalOpeningBalance): DbHistoricalOpeningBalance {
    if (!this.schema.historicalOpeningBalances) {
      this.schema.historicalOpeningBalances = [];
    }
    this.schema.historicalOpeningBalances.push(bal);
    this.persist();
    return bal;
  }

  public getMemberByLegacyId(legacyId: string): DbMember | undefined {
    if (!legacyId) return undefined;
    const clean = legacyId.trim().toUpperCase();
    return this.schema.members.find(
      (m) => (m.legacyMemberId && m.legacyMemberId.trim().toUpperCase() === clean) ||
             (m.membershipNo && m.membershipNo.trim().toUpperCase() === clean)
    );
  }

  public getMemberByLegacyBookNo(bookNo: string): DbMember | undefined {
    if (!bookNo) return undefined;
    const clean = bookNo.trim().toUpperCase();
    return this.schema.members.find(
      (m) => m.legacyBookNumber && m.legacyBookNumber.trim().toUpperCase() === clean
    );
  }

  public rollbackMigrationBatch(
    batchId: string,
    rolledBackById: string,
    rolledBackByName: string,
    reason: string
  ): { success: boolean; deletedCounts: Record<string, number> } {
    const batch = this.getMigrationBatchById(batchId);
    if (!batch) {
      throw new Error(`Migration batch '${batchId}' not found`);
    }
    if (batch.status === 'ROLLED_BACK') {
      throw new Error(`Batch '${batch.batchNumber}' has already been rolled back.`);
    }

    const counts: Record<string, number> = {
      membersRemoved: 0,
      savingAccountsRemoved: 0,
      savingTransactionsRemoved: 0,
      shareTransactionsRemoved: 0,
      loanRepaymentsRemoved: 0,
      journalEntriesReversed: 0,
      openingBalancesRemoved: 0,
    };

    // 1. Remove or unmark migrated members created in this batch
    const initialMemberCount = this.schema.members.length;
    this.schema.members = this.schema.members.filter((m) => {
      if (m.migrationBatchId === batchId) {
        counts.membersRemoved++;
        return false;
      }
      return true;
    });

    // 2. Remove saving transactions created in this batch
    this.schema.financialTransactions = this.schema.financialTransactions.filter((tx) => {
      if (tx.migrationBatchId === batchId) {
        counts.savingTransactionsRemoved++;
        return false;
      }
      return true;
    });

    // 3. Remove saving accounts created solely for migrated members in this batch
    this.schema.savingAccounts = this.schema.savingAccounts.filter((acc) => {
      if (acc.migrationBatchId === batchId) {
        counts.savingAccountsRemoved++;
        return false;
      }
      return true;
    });

    // 4. Remove share transactions created in this batch
    this.schema.shareTransactions = this.schema.shareTransactions.filter((stx) => {
      if (stx.migrationBatchId === batchId) {
        counts.shareTransactionsRemoved++;
        return false;
      }
      return true;
    });

    // 5. Remove loan repayments created in this batch
    this.schema.loanRepayments = this.schema.loanRepayments.filter((lrp) => {
      if (lrp.migrationBatchId === batchId) {
        counts.loanRepaymentsRemoved++;
        return false;
      }
      return true;
    });

    // 6. Reverse / remove journal entries created for this batch
    this.schema.journalEntries = this.schema.journalEntries.filter((je) => {
      if (je.transactionReference?.includes(batch.batchNumber) || je.narration?.includes(batch.batchNumber)) {
        counts.journalEntriesReversed++;
        return false;
      }
      return true;
    });

    // 7. Remove historical opening balances created in this batch
    this.schema.historicalOpeningBalances = (this.schema.historicalOpeningBalances || []).filter((hob) => {
      if (hob.batchId === batchId) {
        counts.openingBalancesRemoved++;
        return false;
      }
      return true;
    });

    // 8. Update batch status to ROLLED_BACK
    const now = new Date().toISOString();
    this.updateMigrationBatch(batchId, {
      status: 'ROLLED_BACK',
      rollbackInfo: {
        rolledBackAt: now,
        rolledBackById,
        rolledBackByName,
        reason,
        deletedCounts: counts,
      },
    });

    this.rebuildIndexes();
    this.persist();

    return {
      success: true,
      deletedCounts: counts,
    };
  }

  // Reset database for tests / development
  public resetDatabase(): void {
    this.schema = this.createDefaultSchema();
    this.persist();
  }
}

export const db = new Database();

