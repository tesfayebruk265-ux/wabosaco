import { Router } from 'express';
import { authController } from '../controllers/authController';
import { userController } from '../controllers/userController';
import { roleController, permissionController } from '../controllers/rbacController';
import { securityController } from '../controllers/securityController';
import { memberController } from '../controllers/memberController';
import { financialController } from '../controllers/financialController';
import { shareController } from '../controllers/shareController';
import { loanController } from '../controllers/loanController';
import { accountingController } from '../controllers/accountingController';
import { biController } from '../controllers/biController';
import { notificationController } from '../controllers/notificationController';
import { crmController } from '../controllers/crmController';
import { adminController } from '../controllers/adminController';
import { migrationController } from '../controllers/migrationController';
import { healthController } from '../controllers/healthController';
import { benchmarkController } from '../controllers/benchmarkController';
import { authenticate, requirePermission, ipRateLimiter, separationOfDuties } from '../middleware/auth';
import { telegramBotService } from '../services/telegramBotService';
import { db } from '../db/database';

const router = Router();

// ==========================================
// PUBLIC HEALTH & READINESS PROBES (K8s/Docker)
// ==========================================
router.get('/health', healthController.getHealth);
router.get('/health/live', healthController.getLiveness);
router.get('/health/ready', healthController.getReadiness);
router.get('/health/detailed', healthController.getDetailedHealth);
router.get('/metrics', benchmarkController.getPrometheusMetrics);

// Authentication routes with brute force protection
router.post('/auth/login', ipRateLimiter(20, 60), authController.login);
router.post('/auth/mfa/verify', ipRateLimiter(15, 60), authController.verifyMfa);
router.post('/auth/mfa/request-otp', ipRateLimiter(5, 60), authController.requestLoginOtp);
router.post('/auth/refresh', authController.refresh);
router.post('/auth/logout', authController.logout);
router.post('/auth/forgot-password', ipRateLimiter(5, 60), authController.forgotPassword);
router.post('/auth/reset-password', ipRateLimiter(10, 60), authController.resetPassword);
router.post('/auth/verify-otp', ipRateLimiter(10, 60), authController.verifyOtp);
router.post('/auth/verify-account', ipRateLimiter(10, 60), authController.verifyAccount);

// ==========================================
// PUBLIC MEMBER SELF-REGISTRATION & DOCUMENTS
// ==========================================
router.post('/members/register', ipRateLimiter(10, 60), memberController.register);
router.get('/members/register/status/:reference', memberController.getRegistrationStatus);
router.post('/members/register/reupload-receipt/:reference', ipRateLimiter(10, 60), memberController.reuploadReceipt);
router.post('/members/register/upload', ipRateLimiter(20, 60), memberController.uploadDocument);
router.get('/documents/:id', memberController.getDocument);
router.get('/public/system-settings', (req, res) => {
  try {
    const settings = db.getSystemSettings();
    res.status(200).json({ success: true, data: settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ==========================================
// AUTHENTICATED USER ENDPOINTS
// ==========================================
router.get('/auth/me', authenticate, authController.getMe);
router.post('/auth/change-password', authenticate, authController.changePassword);

// ==========================================
// MEMBER SELF-SERVICE PORTAL
// ==========================================
router.get('/members/me', authenticate, memberController.getMyProfile);
router.put('/members/me', authenticate, memberController.updateMyProfile);
router.patch('/members/me', authenticate, memberController.updateMyProfile);
router.get('/members/me/nominees', authenticate, memberController.getMyNominees);
router.post('/members/me/nominees', authenticate, memberController.updateMyNominees);
router.put('/members/me/nominees', authenticate, memberController.updateMyNominees);
router.get('/notifications/me', authenticate, memberController.getMyNotifications);
router.post('/notifications/me/read-all', authenticate, memberController.markNotificationsRead);

// ==========================================
// ACCOUNTANT: REGISTRATION REQUESTS & RECEIPT VERIFICATION
// ==========================================
router.get(
  '/membership/registration-requests',
  authenticate,
  requirePermission('MEMBER:RECEIPT:VIEW:ALL', 'MEMBER:RECEIPT:VERIFY', 'MEMBER:PROFILE:VIEW:ALL'),
  memberController.getRegistrationRequests
);

router.get(
  '/membership/registration-requests/:id',
  authenticate,
  requirePermission('MEMBER:RECEIPT:VIEW:ALL', 'MEMBER:RECEIPT:VERIFY', 'MEMBER:PROFILE:VIEW:ALL'),
  memberController.getRegistrationRequestById
);

router.post(
  '/membership/registration-requests/:id/approve',
  authenticate,
  requirePermission('MEMBER:RECEIPT:APPROVE', 'MEMBER:RECEIPT:VERIFY'),
  memberController.approveRegistrationRequest
);

router.post(
  '/membership/registration-requests/:id/reject',
  authenticate,
  requirePermission('MEMBER:RECEIPT:REJECT', 'MEMBER:RECEIPT:VERIFY'),
  memberController.rejectRegistrationRequest
);

// ==========================================
// STAFF: MEMBERS DIRECTORY & MANAGEMENT
// ==========================================
router.get(
  '/members',
  authenticate,
  requirePermission('MEMBER:PROFILE:VIEW:ALL', 'member.view'),
  memberController.getMembers
);

router.get(
  '/members/:id',
  authenticate,
  (req, res, next) => {
    if (req.user && (req.user.id === req.params.id || req.user.membershipNo === req.params.id)) {
      return memberController.getMyProfile(req, res);
    }
    requirePermission('MEMBER:PROFILE:VIEW:ALL', 'member.view')(req, res, next);
  },
  memberController.getMemberById
);

router.put(
  '/members/:id',
  authenticate,
  requirePermission('MEMBER:PROFILE:UPDATE:ALL', 'member.update'),
  memberController.updateMember
);

router.post(
  '/members/:id/activate',
  authenticate,
  requirePermission('MEMBER:PROFILE:ACTIVATE', 'SYSTEM:USER:MANAGE'),
  memberController.activateMember
);

router.post(
  '/members/:id/suspend',
  authenticate,
  requirePermission('MEMBER:PROFILE:SUSPEND', 'SYSTEM:USER:MANAGE'),
  memberController.suspendMember
);

router.post(
  '/members/:id/terminate',
  authenticate,
  requirePermission('MEMBER:PROFILE:DELETE:APPROVE', 'SYSTEM:USER:MANAGE'),
  memberController.terminateMember
);

// ==========================================
// USER MANAGEMENT ENDPOINTS
// ==========================================
router.get(
  '/users',
  authenticate,
  requirePermission('SYSTEM:USER:MANAGE', 'user.view'),
  userController.getUsers
);

router.post(
  '/users',
  authenticate,
  requirePermission('SYSTEM:USER:MANAGE', 'user.create'),
  userController.createUser
);

router.get(
  '/users/:id',
  authenticate,
  (req, res, next) => {
    // Allow users to view their own profile, or staff with permission
    if (req.user && (req.user.id === req.params.id || req.user.membershipNo === req.params.id)) {
      return next();
    }
    requirePermission('SYSTEM:USER:MANAGE', 'user.view', 'MEMBER:PROFILE:VIEW:ALL', 'member.view')(req, res, next);
  },
  userController.getUserById
);

router.put(
  '/users/:id',
  authenticate,
  (req, res, next) => {
    // Allow users to update their own contact info, or staff with permission
    if (req.user && req.user.id === req.params.id) {
      return next();
    }
    requirePermission('SYSTEM:USER:MANAGE', 'user.update', 'MEMBER:PROFILE:UPDATE:ALL', 'member.update')(req, res, next);
  },
  userController.updateUser
);

router.delete(
  '/users/:id',
  authenticate,
  requirePermission('SYSTEM:USER:MANAGE', 'user.delete'),
  userController.deleteUser
);

router.post(
  '/users/:id/activate',
  authenticate,
  requirePermission('SYSTEM:USER:MANAGE', 'user.update', 'MEMBER:PROFILE:ACTIVATE'),
  userController.activateUser
);

router.post(
  '/users/:id/deactivate',
  authenticate,
  requirePermission('SYSTEM:USER:MANAGE', 'user.update', 'MEMBER:PROFILE:SUSPEND'),
  userController.deactivateUser
);

router.post(
  '/users/:id/reset-password',
  authenticate,
  requirePermission('SYSTEM:USER:MANAGE', 'user.update'),
  userController.adminResetPassword
);

router.post(
  '/users/:id/roles',
  authenticate,
  requirePermission('SYSTEM:ROLE:MANAGE', 'role.update', 'SYSTEM:USER:MANAGE'),
  userController.assignRole
);

router.delete(
  '/users/:id/roles/:roleId',
  authenticate,
  requirePermission('SYSTEM:ROLE:MANAGE', 'role.update', 'SYSTEM:USER:MANAGE'),
  userController.removeRole
);

// ==========================================
// RBAC: ROLES & PERMISSIONS
// ==========================================
router.get(
  '/roles',
  authenticate,
  requirePermission('SYSTEM:ROLE:MANAGE', 'role.view'),
  roleController.getRoles
);

router.post(
  '/roles',
  authenticate,
  requirePermission('SYSTEM:ROLE:MANAGE', 'role.create'),
  roleController.createRole
);

router.get(
  '/roles/:id',
  authenticate,
  requirePermission('SYSTEM:ROLE:MANAGE', 'role.view'),
  roleController.getRoleById
);

router.put(
  '/roles/:id',
  authenticate,
  requirePermission('SYSTEM:ROLE:MANAGE', 'role.update'),
  roleController.updateRole
);

router.delete(
  '/roles/:id',
  authenticate,
  requirePermission('SYSTEM:ROLE:MANAGE', 'role.update'),
  roleController.deleteRole
);

router.get(
  '/permissions',
  authenticate,
  requirePermission('SYSTEM:ROLE:MANAGE', 'permission.view'),
  permissionController.getPermissions
);

// ==========================================
// SECURITY & AUDIT TRAIL ENDPOINTS (PHASE 19)
// ==========================================

// 1. Audit Logs & Events
router.get(
  '/security/login-history',
  authenticate,
  requirePermission('SYSTEM:AUDIT:VIEW:ALL', 'audit.view', 'ADMIN', 'AUDITOR'),
  securityController.getLoginHistory
);

router.get(
  '/security/events',
  authenticate,
  requirePermission('SYSTEM:AUDIT:VIEW:ALL', 'audit.view', 'ADMIN', 'AUDITOR'),
  securityController.getSecurityEvents
);

router.get(
  '/security/audit-logs',
  authenticate,
  requirePermission('SYSTEM:AUDIT:VIEW:ALL', 'audit.view', 'ADMIN', 'AUDITOR'),
  securityController.getAuditLogs
);

router.get(
  '/audit-logs',
  authenticate,
  requirePermission('SYSTEM:AUDIT:VIEW:ALL', 'audit.view', 'ADMIN', 'AUDITOR'),
  securityController.getAuditLogs
);

router.get(
  '/security/overview',
  authenticate,
  requirePermission('SYSTEM:AUDIT:VIEW:ALL', 'ADMIN', 'AUDITOR', 'MANAGER'),
  securityController.getSecurityOverview
);

// 2. User MFA Configuration & Role Policies
router.get('/security/mfa/status', authenticate, securityController.getMfaStatus);
router.post('/security/mfa/setup-totp', authenticate, securityController.setupTotp);
router.post('/security/mfa/confirm-totp', authenticate, securityController.confirmTotp);
router.post('/security/mfa/regenerate-backup-codes', authenticate, securityController.regenerateBackupCodes);
router.post('/security/mfa/disable', authenticate, securityController.disableMfa);

router.get(
  '/security/mfa/policies',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'AUDITOR'),
  securityController.getRoleMfaPolicies
);
router.put(
  '/security/mfa/policies',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN'),
  securityController.updateRoleMfaPolicy
);

// 3. Active Sessions & Trusted Devices
router.get('/security/sessions', authenticate, securityController.getActiveSessions);
router.delete('/security/sessions/:sessionId', authenticate, securityController.terminateSession);
router.post('/security/sessions/terminate-others', authenticate, securityController.terminateAllOtherSessions);
router.get('/security/devices', authenticate, securityController.getTrustedDevices);
router.delete('/security/devices/:deviceId', authenticate, securityController.revokeTrustedDevice);

// 4. Fraud & Risk Engine
router.post(
  '/security/risk/evaluate',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'MANAGER', 'AUDITOR', 'TELLER', 'LOANS'),
  securityController.evaluateRisk
);
router.get(
  '/security/risk/assessments',
  authenticate,
  requirePermission('SYSTEM:AUDIT:VIEW:ALL', 'ADMIN', 'AUDITOR', 'MANAGER'),
  securityController.getRiskAssessments
);
router.get(
  '/security/risk/metrics',
  authenticate,
  requirePermission('SYSTEM:AUDIT:VIEW:ALL', 'ADMIN', 'AUDITOR', 'MANAGER'),
  securityController.getRiskMetrics
);

// 5. Security Alerts & Incidents
router.get(
  '/security/alerts',
  authenticate,
  requirePermission('SYSTEM:AUDIT:VIEW:ALL', 'ADMIN', 'AUDITOR', 'MANAGER'),
  securityController.getSecurityAlerts
);
router.post(
  '/security/alerts',
  authenticate,
  requirePermission('SYSTEM:AUDIT:VIEW:ALL', 'ADMIN', 'MANAGER'),
  securityController.createSecurityAlert
);
router.put(
  '/security/alerts/:alertId',
  authenticate,
  requirePermission('SYSTEM:AUDIT:VIEW:ALL', 'ADMIN', 'MANAGER'),
  securityController.updateSecurityAlert
);

router.get(
  '/security/incidents',
  authenticate,
  requirePermission('SYSTEM:AUDIT:VIEW:ALL', 'ADMIN', 'AUDITOR', 'MANAGER'),
  securityController.getSecurityIncidents
);
router.post(
  '/security/incidents',
  authenticate,
  requirePermission('SYSTEM:AUDIT:VIEW:ALL', 'ADMIN', 'MANAGER'),
  securityController.createSecurityIncident
);
router.put(
  '/security/incidents/:incidentId',
  authenticate,
  requirePermission('SYSTEM:AUDIT:VIEW:ALL', 'ADMIN', 'MANAGER'),
  securityController.updateSecurityIncident
);
router.post(
  '/security/incidents/:incidentId/timeline',
  authenticate,
  requirePermission('SYSTEM:AUDIT:VIEW:ALL', 'ADMIN', 'MANAGER'),
  securityController.addIncidentTimelineEvent
);

// 6. Cryptographic Backups & Disaster Recovery
router.get(
  '/security/backups',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'AUDITOR'),
  securityController.getBackupRecords
);
router.post(
  '/security/backups',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN'),
  securityController.createBackup
);
router.post(
  '/security/backups/:backupId/verify',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'AUDITOR'),
  securityController.verifyBackup
);
router.get(
  '/security/backups/:backupId/download',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN'),
  securityController.downloadBackup
);
router.get(
  '/security/disaster-recovery/plan',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'AUDITOR', 'MANAGER'),
  securityController.getDisasterRecoveryPlan
);
router.put(
  '/security/disaster-recovery/plan',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN'),
  securityController.updateDisasterRecoveryPlan
);
router.post(
  '/security/emergency-lockdown',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN'),
  securityController.triggerEmergencyLockdown
);

// 7. Compliance & Governance
router.get(
  '/security/compliance/status',
  authenticate,
  requirePermission('SYSTEM:AUDIT:VIEW:ALL', 'ADMIN', 'AUDITOR', 'MANAGER'),
  securityController.getComplianceStatus
);
router.post(
  '/security/compliance/access-review',
  authenticate,
  requirePermission('SYSTEM:AUDIT:VIEW:ALL', 'ADMIN', 'AUDITOR'),
  securityController.recordAccessReview
);

// 8. Password Policy
router.get('/security/password-policy', authenticate, securityController.getPasswordPolicy);
router.put(
  '/security/password-policy',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN'),
  securityController.updatePasswordPolicy
);

// ==========================================
// PHASE 12: FINANCIAL MODULE ENDPOINTS
// ==========================================

// 1. Saving Products
router.get('/financial/products', authenticate, financialController.getProducts);
router.get('/financial/products/:id', authenticate, financialController.getProductById);
router.put(
  '/financial/products/:id',
  authenticate,
  requirePermission('SAVINGS:PRODUCT:MANAGE', 'ADMIN', 'MANAGER'),
  financialController.updateProduct
);

// 2. Saving Accounts
router.get(
  '/financial/accounts',
  authenticate,
  requirePermission('SAVINGS:ACCOUNT:VIEW:ALL', 'MEMBER:PROFILE:VIEW:ALL', 'SAVINGS:DEPOSIT:CREATE'),
  financialController.getAccounts
);
router.get('/financial/accounts/:id', authenticate, financialController.getAccountById);
router.post(
  '/financial/accounts/open',
  authenticate,
  requirePermission('SAVINGS:ACCOUNT:OPEN', 'MEMBER:PROFILE:CREATE'),
  financialController.openAccount
);

// 3. Member Self-Service Financial Endpoints
router.get('/financial/me/accounts', authenticate, financialController.getMyAccounts);
router.get('/financial/me/transactions', authenticate, financialController.getMyTransactions);
router.get('/financial/me/monthly-schedules', authenticate, financialController.getMyMonthlySchedule);

// 4. Financial Transactions: Deposit, Withdraw, Transfer
router.post(
  '/financial/deposit',
  authenticate,
  requirePermission('SAVINGS:DEPOSIT:CREATE', 'FINANCIAL:TRANSACTION:POST'),
  financialController.deposit
);

router.post(
  '/financial/withdraw',
  authenticate,
  requirePermission('SAVINGS:WITHDRAWAL:CREATE', 'FINANCIAL:TRANSACTION:POST'),
  financialController.withdraw
);

router.post(
  '/financial/transfer',
  authenticate,
  requirePermission('SAVINGS:WITHDRAWAL:CREATE', 'SAVINGS:DEPOSIT:CREATE', 'FINANCIAL:TRANSACTION:POST'),
  financialController.transfer
);

router.get(
  '/financial/transactions',
  authenticate,
  requirePermission('FINANCIAL:LEDGER:VIEW', 'SAVINGS:ACCOUNT:VIEW:ALL', 'SYSTEM:AUDIT:VIEW:ALL'),
  financialController.getTransactions
);

router.get(
  '/financial/transactions/:id',
  authenticate,
  financialController.getTransactionById
);

router.post(
  '/financial/transactions/:id/reverse',
  authenticate,
  requirePermission('FINANCIAL:TRANSACTION:REVERSE', 'ADMIN', 'MANAGER'),
  financialController.reverseTransaction
);

// 5. Maker-Checker Financial Approvals
router.get(
  '/financial/approvals',
  authenticate,
  requirePermission('FINANCIAL:APPROVAL:VIEW', 'SAVINGS:WITHDRAWAL:APPROVE', 'MANAGER', 'ADMIN'),
  financialController.getApprovals
);

router.post(
  '/financial/approvals/:id/approve',
  authenticate,
  requirePermission('SAVINGS:WITHDRAWAL:APPROVE', 'FINANCIAL:APPROVAL:EXECUTE', 'MANAGER', 'ADMIN'),
  financialController.approveApprovalRequest
);

// 6. Monthly Compulsory Savings Schedules
router.get(
  '/financial/monthly-schedules',
  authenticate,
  requirePermission('SAVINGS:ACCOUNT:VIEW:ALL', 'MEMBER:PROFILE:VIEW:ALL'),
  financialController.getMonthlySchedules
);

// 7. General Ledger Chart of Accounts & Journals
router.get(
  '/financial/chart-of-accounts',
  authenticate,
  requirePermission('FINANCIAL:LEDGER:VIEW', 'ACCOUNTING:REPORT:VIEW', 'SYSTEM:AUDIT:VIEW:ALL'),
  financialController.getChartOfAccounts
);

router.get(
  '/financial/journals',
  authenticate,
  requirePermission('FINANCIAL:LEDGER:VIEW', 'ACCOUNTING:REPORT:VIEW', 'SYSTEM:AUDIT:VIEW:ALL'),
  financialController.getJournalEntries
);

// 8. Batch Operations & System Settings
router.post(
  '/financial/batch-interest',
  authenticate,
  requirePermission('SAVINGS:INTEREST:POST', 'ADMIN', 'MANAGER'),
  financialController.runBatchInterest
);

router.get(
  '/financial/interest-runs',
  authenticate,
  requirePermission('SAVINGS:INTEREST:POST', 'ADMIN', 'MANAGER', 'SYSTEM:AUDIT:VIEW:ALL'),
  financialController.getInterestRuns
);

router.get('/financial/system-settings', authenticate, financialController.getSystemSettings);
router.put(
  '/financial/system-settings',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'MANAGER'),
  financialController.updateSystemSettings
);

// ==========================================
// PHASE 13: SHARE MANAGEMENT ENDPOINTS
// ==========================================

// 1. Member Self-Service Share Endpoints
router.get('/shares/me', authenticate, shareController.getMyShareAccount);
router.get('/shares/me/transactions', authenticate, shareController.getMyTransactions);
router.get('/shares/me/eligibility', authenticate, shareController.getMyEligibility);
router.get('/shares/me/certificate', authenticate, shareController.getMyCertificate);

// 2. Share Transactions (Purchase & Voluntary Conversion)
router.post(
  '/shares/purchase',
  authenticate,
  ipRateLimiter(30, 60),
  shareController.purchaseShares
);

router.post(
  '/shares/convert',
  authenticate,
  ipRateLimiter(20, 60),
  shareController.convertVoluntarySavings
);

// 3. Staff & Management Share Accounts Directory
router.get(
  '/shares/accounts',
  authenticate,
  requirePermission('SHARES:ACCOUNT:VIEW:ALL', 'SAVINGS:ACCOUNT:VIEW:ALL', 'MEMBER:PROFILE:VIEW:ALL', 'ACCOUNTING:REPORT:VIEW'),
  shareController.getAccounts
);

router.get(
  '/shares/accounts/:id',
  authenticate,
  shareController.getAccountById
);

// 4. Share Transactions Ledger & Reversal
router.get(
  '/shares/transactions',
  authenticate,
  requirePermission('SHARES:TRANSACTION:VIEW:ALL', 'FINANCIAL:LEDGER:VIEW', 'SAVINGS:ACCOUNT:VIEW:ALL', 'SYSTEM:AUDIT:VIEW:ALL'),
  shareController.getTransactions
);

router.get(
  '/shares/transactions/:id',
  authenticate,
  shareController.getTransactionById
);

router.post(
  '/shares/transactions/:id/reverse',
  authenticate,
  requirePermission('SHARES:TRANSACTION:REVERSE', 'FINANCIAL:TRANSACTION:REVERSE', 'ADMIN', 'MANAGER'),
  shareController.reverseTransaction
);

// 5. Share Reports & Statistical Analytics
router.get(
  '/shares/reports/statistics',
  authenticate,
  requirePermission('SHARES:REPORT:VIEW', 'ACCOUNTING:REPORT:VIEW', 'FINANCIAL:LEDGER:VIEW', 'ADMIN', 'MANAGER', 'AUDITOR'),
  shareController.getStatistics
);

router.get(
  '/shares/reports/ownership',
  authenticate,
  requirePermission('SHARES:REPORT:VIEW', 'ACCOUNTING:REPORT:VIEW', 'FINANCIAL:LEDGER:VIEW', 'ADMIN', 'MANAGER', 'AUDITOR'),
  shareController.getOwnershipReport
);

router.get(
  '/shares/reports/non-compliant',
  authenticate,
  requirePermission('SHARES:REPORT:VIEW', 'SAVINGS:ACCOUNT:VIEW:ALL', 'MEMBER:PROFILE:VIEW:ALL', 'ADMIN', 'MANAGER', 'AUDITOR'),
  shareController.getNonCompliantReport
);

// 6. Share Settings & Digital Certificates
router.get('/shares/settings', authenticate, shareController.getSettings);
router.put(
  '/shares/settings',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'MANAGER'),
  shareController.updateSettings
);

router.get('/shares/certificates/:id', authenticate, shareController.getCertificateById);

// ==========================================
// PHASE 14: LOAN MANAGEMENT MODULE
// ==========================================

// 1. Loan Products Configuration
router.get('/loans/products', authenticate, loanController.getProducts);
router.get('/loans/products/:id', authenticate, loanController.getProductById);
router.post(
  '/loans/products',
  authenticate,
  requirePermission('LOAN:PRODUCT:MANAGE', 'ADMIN', 'MANAGER'),
  loanController.createProduct
);
router.put(
  '/loans/products/:id',
  authenticate,
  requirePermission('LOAN:PRODUCT:MANAGE', 'ADMIN', 'MANAGER'),
  loanController.updateProduct
);

// 2. Loan Amortization Calculator & Eligibility Evaluation
router.post('/loans/calculator', authenticate, loanController.calculateAmortization);
router.get('/loans/eligibility/me', authenticate, loanController.checkEligibility);
router.get('/loans/eligibility/:memberId', authenticate, loanController.checkEligibility);

// 3. Member Loan Portal & Guarantor Responses
router.post('/loans/apply', authenticate, ipRateLimiter(15, 60), loanController.apply);
router.get('/loans/me/applications', authenticate, loanController.getMyApplications);
router.get('/loans/me/active', authenticate, loanController.getMyActiveLoan);
router.get('/loans/me/guarantor-requests', authenticate, loanController.getMyGuarantorRequests);
router.post('/loans/guarantors/respond', authenticate, loanController.respondGuarantor);

// 4. Staff Loan Applications Workflow (Review, Approval, Disbursement)
router.get(
  '/loans/applications',
  authenticate,
  requirePermission('LOAN:APPLICATION:VIEW', 'LOAN:APPLICATION:PROCESS', 'MEMBER:PROFILE:VIEW:ALL', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'AUDITOR'),
  loanController.getApplications
);
router.get('/loans/applications/:id', authenticate, loanController.getApplicationById);
router.post(
  '/loans/applications/:id/review',
  authenticate,
  requirePermission('LOAN:APPLICATION:REVIEW', 'ACCOUNTANT', 'ADMIN', 'MANAGER'),
  loanController.reviewApplication
);
router.post(
  '/loans/applications/:id/approve',
  authenticate,
  requirePermission('LOAN:APPLICATION:APPROVE', 'MANAGER', 'ADMIN'),
  loanController.approveApplication
);
router.post(
  '/loans/applications/:id/disburse',
  authenticate,
  requirePermission('LOAN:DISBURSE', 'ACCOUNTANT', 'MANAGER', 'ADMIN'),
  loanController.disburse
);

// 5. Schedules, Repayments & Statements
router.get('/loans/:id/schedule', authenticate, loanController.getSchedule);
router.get(
  '/loans/repayments',
  authenticate,
  requirePermission('LOAN:REPAYMENT:VIEW', 'FINANCIAL:LEDGER:VIEW', 'MEMBER:PROFILE:VIEW:ALL', 'ADMIN', 'MANAGER', 'ACCOUNTANT'),
  loanController.getRepayments
);
router.post(
  '/loans/repayments',
  authenticate,
  ipRateLimiter(30, 60),
  loanController.recordRepayment
);
router.get('/loans/:id/statement', authenticate, loanController.getStatement);

// 6. Overdue Processing & Penalty Waiver
router.post(
  '/loans/process-overdue',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'MANAGER', 'ACCOUNTANT'),
  loanController.processOverdue
);
router.post(
  '/loans/:id/waive-penalty',
  authenticate,
  requirePermission('LOAN:PENALTY:WAIVE', 'MANAGER', 'ADMIN'),
  loanController.waivePenalty
);

// 7. Portfolio Reports & Analytics
router.get(
  '/loans/reports/summary',
  authenticate,
  requirePermission('LOAN:REPORT:VIEW', 'ACCOUNTING:REPORT:VIEW', 'ADMIN', 'MANAGER', 'AUDITOR'),
  loanController.getPortfolioSummary
);
router.get(
  '/loans/reports/aging',
  authenticate,
  requirePermission('LOAN:REPORT:VIEW', 'ACCOUNTING:REPORT:VIEW', 'ADMIN', 'MANAGER', 'AUDITOR'),
  loanController.getAgingReport
);
router.get(
  '/loans/reports/products',
  authenticate,
  requirePermission('LOAN:REPORT:VIEW', 'ACCOUNTING:REPORT:VIEW', 'ADMIN', 'MANAGER', 'AUDITOR'),
  loanController.getProductReport
);

// ==========================================
// PHASE 15: ACCOUNTING SYSTEM ENDPOINTS
// ==========================================

// 1. Chart of Accounts
router.get(
  '/accounting/chart-of-accounts',
  authenticate,
  requirePermission('ACCOUNTING:COA:VIEW', 'ACCOUNTING:REPORT:VIEW', 'ACCOUNTANT', 'MANAGER', 'AUDITOR', 'ADMIN'),
  accountingController.getChartOfAccounts
);
router.get(
  '/accounting/chart-of-accounts/code/:code',
  authenticate,
  requirePermission('ACCOUNTING:COA:VIEW', 'ACCOUNTANT', 'MANAGER', 'AUDITOR', 'ADMIN'),
  accountingController.getAccountByCode
);
router.post(
  '/accounting/chart-of-accounts',
  authenticate,
  requirePermission('ACCOUNTING:COA:MANAGE', 'ADMIN', 'ACCOUNTANT'),
  accountingController.createAccount
);
router.put(
  '/accounting/chart-of-accounts/:id',
  authenticate,
  requirePermission('ACCOUNTING:COA:MANAGE', 'ADMIN', 'ACCOUNTANT'),
  accountingController.updateAccount
);

// 2. General Ledger & Trial Balance
router.get(
  '/accounting/general-ledger/:accountCode',
  authenticate,
  requirePermission('ACCOUNTING:GL:VIEW', 'ACCOUNTING:REPORT:VIEW', 'ACCOUNTANT', 'MANAGER', 'AUDITOR', 'ADMIN'),
  accountingController.getGeneralLedger
);
router.get(
  '/accounting/trial-balance',
  authenticate,
  requirePermission('ACCOUNTING:GL:VIEW', 'ACCOUNTING:REPORT:VIEW', 'ACCOUNTANT', 'MANAGER', 'AUDITOR', 'ADMIN'),
  accountingController.getTrialBalance
);

// 3. Financial Statements & Prudential Ratios
router.get(
  '/accounting/reports/income-statement',
  authenticate,
  requirePermission('ACCOUNTING:REPORT:VIEW', 'ACCOUNTANT', 'MANAGER', 'AUDITOR', 'ADMIN'),
  accountingController.getIncomeStatement
);
router.get(
  '/accounting/reports/balance-sheet',
  authenticate,
  requirePermission('ACCOUNTING:REPORT:VIEW', 'ACCOUNTANT', 'MANAGER', 'AUDITOR', 'ADMIN'),
  accountingController.getBalanceSheet
);
router.get(
  '/accounting/reports/financial-ratios',
  authenticate,
  requirePermission('ACCOUNTING:REPORT:VIEW', 'ACCOUNTANT', 'MANAGER', 'AUDITOR', 'ADMIN'),
  accountingController.getFinancialRatios
);

// 4. Accounting Periods Lifecycle
router.get(
  '/accounting/periods',
  authenticate,
  requirePermission('ACCOUNTING:PERIOD:VIEW', 'ACCOUNTING:REPORT:VIEW', 'ACCOUNTANT', 'MANAGER', 'AUDITOR', 'ADMIN'),
  accountingController.getAccountingPeriods
);
router.post(
  '/accounting/periods',
  authenticate,
  requirePermission('ACCOUNTING:PERIOD:MANAGE', 'ACCOUNTANT', 'ADMIN', 'MANAGER'),
  accountingController.createAccountingPeriod
);
router.post(
  '/accounting/periods/:id/close',
  authenticate,
  requirePermission('ACCOUNTING:PERIOD:CLOSE', 'ACCOUNTANT', 'MANAGER', 'ADMIN'),
  accountingController.closeAccountingPeriod
);
router.post(
  '/accounting/periods/:id/lock',
  authenticate,
  requirePermission('ACCOUNTING:PERIOD:LOCK', 'AUDITOR', 'ADMIN', 'MANAGER'),
  accountingController.lockAccountingPeriod
);
router.post(
  '/accounting/periods/:id/reopen',
  authenticate,
  requirePermission('ACCOUNTING:PERIOD:REOPEN', 'AUDITOR', 'ADMIN'),
  accountingController.reopenAccountingPeriod
);

// 5. Bank Reconciliations
router.get(
  '/accounting/reconciliations',
  authenticate,
  requirePermission('ACCOUNTING:RECON:VIEW', 'ACCOUNTING:REPORT:VIEW', 'ACCOUNTANT', 'MANAGER', 'AUDITOR', 'ADMIN'),
  accountingController.getBankReconciliations
);
router.get(
  '/accounting/reconciliations/:id',
  authenticate,
  requirePermission('ACCOUNTING:RECON:VIEW', 'ACCOUNTANT', 'MANAGER', 'AUDITOR', 'ADMIN'),
  accountingController.getBankReconciliationById
);
router.post(
  '/accounting/reconciliations',
  authenticate,
  requirePermission('ACCOUNTING:RECON:MANAGE', 'ACCOUNTANT', 'ADMIN'),
  accountingController.createBankReconciliation
);

// 6. Annual Budgets & Variance Analysis
router.get(
  '/accounting/budgets',
  authenticate,
  requirePermission('ACCOUNTING:BUDGET:VIEW', 'ACCOUNTING:REPORT:VIEW', 'ACCOUNTANT', 'MANAGER', 'AUDITOR', 'ADMIN'),
  accountingController.getAnnualBudgets
);
router.get(
  '/accounting/budgets/:id',
  authenticate,
  requirePermission('ACCOUNTING:BUDGET:VIEW', 'ACCOUNTANT', 'MANAGER', 'AUDITOR', 'ADMIN'),
  accountingController.getAnnualBudgetById
);
router.post(
  '/accounting/budgets',
  authenticate,
  requirePermission('ACCOUNTING:BUDGET:MANAGE', 'ACCOUNTANT', 'MANAGER', 'ADMIN'),
  accountingController.createAnnualBudget
);
router.post(
  '/accounting/budgets/:id/approve',
  authenticate,
  requirePermission('ACCOUNTING:BUDGET:APPROVE', 'MANAGER', 'ADMIN'),
  accountingController.approveAnnualBudget
);
router.get(
  '/accounting/reports/budget-variance',
  authenticate,
  requirePermission('ACCOUNTING:BUDGET:VIEW', 'ACCOUNTING:REPORT:VIEW', 'ACCOUNTANT', 'MANAGER', 'AUDITOR', 'ADMIN'),
  accountingController.getBudgetVarianceReport
);

// ==========================================================================
// PHASE 16: BUSINESS INTELLIGENCE, DASHBOARDS, REPORTS & ANALYTICS
// ==========================================================================

// 1. Role-Specific Executive Dashboards (singular & plural routes supported)
router.get(
  ['/bi/dashboard/executive', '/bi/dashboards/executive'],
  authenticate,
  requirePermission('BI:DASHBOARD:EXECUTIVE', 'ADMIN', 'MANAGER'),
  biController.getExecutiveDashboard
);

router.get(
  ['/bi/dashboard/accountant', '/bi/dashboards/accountant'],
  authenticate,
  requirePermission('BI:DASHBOARD:ACCOUNTANT', 'ACCOUNTANT', 'ADMIN', 'MANAGER'),
  biController.getAccountantDashboard
);

router.get(
  ['/bi/dashboard/manager', '/bi/dashboards/manager'],
  authenticate,
  requirePermission('BI:DASHBOARD:MANAGER', 'MANAGER', 'ADMIN'),
  biController.getManagerDashboard
);

router.get(
  ['/bi/dashboard/auditor', '/bi/dashboards/auditor'],
  authenticate,
  requirePermission('BI:DASHBOARD:AUDITOR', 'AUDITOR', 'ADMIN'),
  biController.getAuditorDashboard
);

router.get(
  ['/bi/dashboard/customer-service', '/bi/dashboards/customer-service'],
  authenticate,
  requirePermission('BI:DASHBOARD:CS', 'CUSTOMER_SERVICE', 'ADMIN', 'MANAGER'),
  biController.getCustomerServiceDashboard
);

router.get(
  ['/bi/dashboard/member', '/bi/dashboards/member'],
  authenticate,
  biController.getMemberDashboard
);

router.get(
  ['/bi/dashboard/member/:memberId', '/bi/dashboards/member/:memberId'],
  authenticate,
  requirePermission('BI:DASHBOARD:VIEW_MEMBER', 'ADMIN', 'MANAGER', 'CUSTOMER_SERVICE', 'ACCOUNTANT'),
  biController.getMemberDashboard
);

// 2. Dashboard Widget Configuration
router.get(['/bi/dashboard/widgets', '/bi/dashboards/widgets', '/bi/dashboards/widgets/config'], authenticate, biController.getWidgetConfig);
router.post(['/bi/dashboard/widgets/save', '/bi/dashboards/widgets/config'], authenticate, biController.saveWidgetConfig);

// 3. Enterprise Reports & CSV/Excel Exports (25+ Reports)
router.get(
  '/bi/reports/:reportType',
  authenticate,
  requirePermission('BI:REPORTS:VIEW', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'AUDITOR', 'CUSTOMER_SERVICE', 'MEMBER'),
  biController.getReport
);

router.get(
  '/bi/reports/:reportType/export',
  authenticate,
  requirePermission('BI:REPORTS:EXPORT', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'AUDITOR'),
  biController.exportReport
);

// 4. Predictive Analytics & Forecasts
router.get(
  '/bi/forecasts/savings',
  authenticate,
  requirePermission('BI:FORECAST:VIEW', 'ADMIN', 'MANAGER', 'ACCOUNTANT'),
  biController.getSavingsForecast
);

router.get(
  '/bi/forecasts/loans',
  authenticate,
  requirePermission('BI:FORECAST:VIEW', 'ADMIN', 'MANAGER', 'ACCOUNTANT'),
  biController.getLoanGrowthForecast
);

router.get(
  '/bi/forecasts/cashflow',
  authenticate,
  requirePermission('BI:FORECAST:VIEW', 'ADMIN', 'MANAGER', 'ACCOUNTANT'),
  biController.getCashFlowForecast
);

router.get(
  '/bi/forecasts/revenue-expense',
  authenticate,
  requirePermission('BI:FORECAST:VIEW', 'ADMIN', 'MANAGER', 'ACCOUNTANT'),
  biController.getRevenueExpenseForecast
);

router.get(
  '/bi/forecasts/collections',
  authenticate,
  requirePermission('BI:FORECAST:VIEW', 'ADMIN', 'MANAGER', 'ACCOUNTANT'),
  biController.getExpectedLoanCollections
);

router.get(
  '/bi/forecasts/member-growth',
  authenticate,
  requirePermission('BI:FORECAST:VIEW', 'ADMIN', 'MANAGER'),
  biController.getMemberGrowthForecast
);

router.get(
  '/bi/forecasts/default-risk',
  authenticate,
  requirePermission('BI:FORECAST:VIEW', 'ADMIN', 'MANAGER', 'AUDITOR'),
  biController.getDefaultRiskAnalysis
);

router.get(
  '/bi/forecasts/products',
  authenticate,
  requirePermission('BI:FORECAST:VIEW', 'ADMIN', 'MANAGER', 'ACCOUNTANT'),
  biController.getProductTrends
);

// 5. Global Search Across All SACCO Records
router.get('/bi/search', authenticate, biController.globalSearch);

// 6. Scheduled Reports
router.get(
  '/bi/scheduled-reports',
  authenticate,
  requirePermission('BI:SCHEDULED:VIEW', 'ADMIN', 'MANAGER'),
  biController.getScheduledReports
);

router.post(
  '/bi/scheduled-reports',
  authenticate,
  requirePermission('BI:SCHEDULED:MANAGE', 'ADMIN', 'MANAGER'),
  biController.createScheduledReport
);

router.post(
  '/bi/scheduled-reports/:id/run',
  authenticate,
  requirePermission('BI:SCHEDULED:MANAGE', 'ADMIN', 'MANAGER'),
  biController.runScheduledReportNow
);

router.delete(
  '/bi/scheduled-reports/:id',
  authenticate,
  requirePermission('BI:SCHEDULED:MANAGE', 'ADMIN'),
  biController.deleteScheduledReport
);

// =========================================================================
// ENTERPRISE COMMUNICATION & NOTIFICATION CENTER (PHASE 17)
// =========================================================================

// 1. In-App Notifications Inbox (Member & Staff)
router.get('/notifications/me', authenticate, notificationController.getMyNotifications);
router.post('/notifications/me/read-all', authenticate, notificationController.markAllRead);
router.patch('/notifications/me/:id/read', authenticate, notificationController.markRead);
router.patch('/notifications/me/:id/archive', authenticate, notificationController.archiveNotification);
router.delete('/notifications/me/:id', authenticate, notificationController.deleteNotification);

// 2. User Channel Preferences & Telegram Bot Linking
router.get('/notifications/preferences', authenticate, notificationController.getPreferences);
router.put('/notifications/preferences', authenticate, notificationController.updatePreferences);
router.post('/notifications/telegram/generate-token', authenticate, notificationController.generateTelegramToken);
router.post('/notifications/telegram/verify', authenticate, notificationController.verifyTelegramChat);
router.post('/notifications/telegram/unlink', authenticate, notificationController.unlinkTelegram);
router.post('/notifications/telegram/test-send', authenticate, notificationController.testSendTelegram);

// 3. Notification Templates Management (Admin & Manager)
router.get(
  '/notifications/templates',
  authenticate,
  requirePermission('SYSTEM:TEMPLATE:MANAGE', 'ADMIN', 'MANAGER', 'CUSTOMER_SERVICE'),
  notificationController.getTemplates
);
router.get(
  '/notifications/templates/:id',
  authenticate,
  requirePermission('SYSTEM:TEMPLATE:MANAGE', 'ADMIN', 'MANAGER', 'CUSTOMER_SERVICE'),
  notificationController.getTemplateById
);
router.post(
  '/notifications/templates',
  authenticate,
  requirePermission('SYSTEM:TEMPLATE:MANAGE', 'ADMIN'),
  notificationController.createTemplate
);
router.put(
  '/notifications/templates/:id',
  authenticate,
  requirePermission('SYSTEM:TEMPLATE:MANAGE', 'ADMIN'),
  notificationController.updateTemplate
);
router.post(
  '/notifications/templates/:id/preview',
  authenticate,
  requirePermission('SYSTEM:TEMPLATE:MANAGE', 'ADMIN', 'MANAGER', 'CUSTOMER_SERVICE'),
  notificationController.previewTemplate
);
router.post(
  '/notifications/templates/:id/test-send',
  authenticate,
  requirePermission('SYSTEM:TEMPLATE:MANAGE', 'ADMIN'),
  notificationController.testSendTemplate
);

// 4. Delivery Logs & Retry Engine (Staff)
router.get(
  '/notifications/delivery-logs',
  authenticate,
  requirePermission('SYSTEM:AUDIT:VIEW:ALL', 'ADMIN', 'MANAGER', 'AUDITOR', 'CUSTOMER_SERVICE'),
  notificationController.getDeliveryLogs
);
router.get(
  '/notifications/delivery-logs/:id',
  authenticate,
  requirePermission('SYSTEM:AUDIT:VIEW:ALL', 'ADMIN', 'MANAGER', 'AUDITOR', 'CUSTOMER_SERVICE'),
  notificationController.getDeliveryLogById
);
router.post(
  '/notifications/delivery-logs/:id/retry',
  authenticate,
  requirePermission('SYSTEM:BROADCAST:MANAGE', 'ADMIN', 'MANAGER', 'CUSTOMER_SERVICE'),
  notificationController.retryDeliveryLog
);
router.post(
  '/notifications/delivery-logs/retry-all-failed',
  authenticate,
  requirePermission('SYSTEM:BROADCAST:MANAGE', 'ADMIN', 'MANAGER'),
  notificationController.retryAllFailed
);

// 5. Provider Gateways Management (Admin)
router.get(
  '/notifications/providers',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN'),
  notificationController.getProviders
);
router.put(
  '/notifications/providers/:id',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN'),
  notificationController.updateProvider
);
router.post(
  '/notifications/providers/:id/test',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN'),
  notificationController.testProvider
);

// 6. Broadcasts & Campaigns (Admin & Manager)
router.get(
  '/notifications/broadcasts',
  authenticate,
  requirePermission('SYSTEM:BROADCAST:MANAGE', 'ADMIN', 'MANAGER', 'CUSTOMER_SERVICE'),
  notificationController.getBroadcasts
);
router.get(
  '/notifications/broadcasts/:id',
  authenticate,
  requirePermission('SYSTEM:BROADCAST:MANAGE', 'ADMIN', 'MANAGER', 'CUSTOMER_SERVICE'),
  notificationController.getBroadcastById
);
router.post(
  '/notifications/broadcasts',
  authenticate,
  requirePermission('SYSTEM:BROADCAST:MANAGE', 'ADMIN', 'MANAGER'),
  notificationController.createBroadcast
);
router.post(
  '/notifications/broadcasts/:id/cancel',
  authenticate,
  requirePermission('SYSTEM:BROADCAST:MANAGE', 'ADMIN', 'MANAGER'),
  notificationController.cancelBroadcast
);
router.post(
  '/notifications/broadcasts/:id/run-now',
  authenticate,
  requirePermission('SYSTEM:BROADCAST:MANAGE', 'ADMIN', 'MANAGER'),
  notificationController.runBroadcastNow
);

// 7. Direct Customer Service Messaging & 360-Degree History
router.post(
  '/notifications/communication-messages',
  authenticate,
  requirePermission('MEMBER:MESSAGE:SEND', 'ADMIN', 'MANAGER', 'CUSTOMER_SERVICE'),
  notificationController.sendDirectMessage
);
router.get(
  '/notifications/communication-messages',
  authenticate,
  requirePermission('MEMBER:MESSAGE:VIEW', 'ADMIN', 'MANAGER', 'CUSTOMER_SERVICE', 'MEMBER'),
  notificationController.getAllCommunicationMessages
);
router.get(
  '/notifications/communication-history/:memberId',
  authenticate,
  requirePermission('MEMBER:MESSAGE:VIEW', 'ADMIN', 'MANAGER', 'CUSTOMER_SERVICE', 'MEMBER'),
  notificationController.getCommunicationHistory
);

// 8. Scheduler & Automated Reminders Runner
router.post(
  '/notifications/scheduler/run-reminders',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'MANAGER'),
  notificationController.runSchedulerReminders
);
router.get(
  '/notifications/scheduler/status',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'MANAGER'),
  notificationController.getSchedulerStatus
);

// 9. Communication Analytics & Exportable Reports
router.get(
  '/notifications/analytics/summary',
  authenticate,
  requirePermission('BI:REPORTS:VIEW', 'ADMIN', 'MANAGER', 'AUDITOR', 'CUSTOMER_SERVICE'),
  notificationController.getStatistics
);
router.get(
  '/notifications/reports/:reportType',
  authenticate,
  requirePermission('BI:REPORTS:VIEW', 'ADMIN', 'MANAGER', 'AUDITOR', 'CUSTOMER_SERVICE'),
  notificationController.getReport
);
router.get(
  '/notifications/reports/:reportType/export',
  authenticate,
  requirePermission('BI:REPORTS:EXPORT', 'ADMIN', 'MANAGER', 'AUDITOR'),
  notificationController.exportReport
);

// ==========================================
// PHASE 18: CRM, HELP DESK, CASE MANAGEMENT & SUPPORT
// ==========================================

// 1. Support Tickets Endpoints
router.get('/crm/tickets', authenticate, crmController.getTickets);
router.get('/crm/tickets/:id', authenticate, crmController.getTicketById);
router.post('/crm/tickets', authenticate, crmController.createTicket);
router.put(
  '/crm/tickets/:id',
  authenticate,
  requirePermission('CUSTOMER_SERVICE', 'ADMIN', 'MANAGER', 'LOANS', 'FINANCE', 'AUDITOR'),
  crmController.updateTicket
);
router.post('/crm/tickets/:id/messages', authenticate, crmController.addMessage);
router.post(
  '/crm/tickets/:id/escalate',
  authenticate,
  requirePermission('CUSTOMER_SERVICE', 'ADMIN', 'MANAGER', 'LOANS', 'FINANCE'),
  crmController.escalateTicket
);
router.post('/crm/tickets/:id/reopen', authenticate, crmController.reopenTicket);
router.post(
  '/crm/tickets/:id/merge',
  authenticate,
  requirePermission('CUSTOMER_SERVICE', 'ADMIN', 'MANAGER'),
  crmController.mergeTickets
);
router.post('/crm/tickets/:id/csat', authenticate, crmController.submitCsat);

// 2. Member 360-Degree Profile (Read-Only)
router.get(
  '/crm/members/:memberId/360',
  authenticate,
  requirePermission('CUSTOMER_SERVICE', 'ADMIN', 'MANAGER', 'AUDITOR', 'TELLER', 'ACCOUNTANT'),
  crmController.getMember360
);

// 3. CRM Dashboard Metrics & Agent Performance
router.get(
  '/crm/analytics/dashboard',
  authenticate,
  requirePermission('CUSTOMER_SERVICE', 'ADMIN', 'MANAGER', 'AUDITOR', 'TELLER', 'ACCOUNTANT'),
  crmController.getDashboardMetrics
);

// 4. SLA Policies Management
router.get(
  '/crm/sla/policies',
  authenticate,
  requirePermission('CUSTOMER_SERVICE', 'ADMIN', 'MANAGER', 'AUDITOR'),
  crmController.getSlaPolicies
);
router.put(
  '/crm/sla/policies/:id',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'MANAGER'),
  crmController.updateSlaPolicy
);

// 5. Knowledge Base (Publicly searchable by members and staff)
router.get('/crm/kb/articles', crmController.getKbArticles);
router.get('/crm/kb/articles/:id', crmController.getKbArticleById);
router.post(
  '/crm/kb/articles',
  authenticate,
  requirePermission('CUSTOMER_SERVICE', 'ADMIN', 'MANAGER'),
  crmController.createKbArticle
);
router.put(
  '/crm/kb/articles/:id',
  authenticate,
  requirePermission('CUSTOMER_SERVICE', 'ADMIN', 'MANAGER'),
  crmController.updateKbArticle
);
router.delete(
  '/crm/kb/articles/:id',
  authenticate,
  requirePermission('ADMIN', 'MANAGER'),
  crmController.deleteKbArticle
);
router.post('/crm/kb/articles/:id/vote', crmController.voteKbArticle);

// 6. Live Chat Engine
router.get('/crm/chat/sessions', authenticate, crmController.getChatSessions);
router.post('/crm/chat/sessions', authenticate, crmController.createChatSession);
router.get('/crm/chat/sessions/:sessionId/messages', authenticate, crmController.getChatMessages);
router.post('/crm/chat/sessions/:sessionId/messages', authenticate, crmController.sendChatMessage);
router.post('/crm/chat/sessions/:sessionId/close', authenticate, crmController.closeChatSession);

// ==========================================
// PHASE 20: ENTERPRISE ADMINISTRATION & SYSTEM CONFIGURATION
// ==========================================

// 1. Organization Profile
router.get('/admin/organization', adminController.getOrganizationProfile);
router.put(
  '/admin/organization',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN'),
  adminController.updateOrganizationProfile
);

// 2. Working Calendar & Holidays
router.get('/admin/calendar', adminController.getWorkingCalendar);
router.put(
  '/admin/calendar',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'MANAGER'),
  adminController.updateWorkingCalendar
);
router.post(
  '/admin/calendar/holidays',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'MANAGER'),
  adminController.addPublicHoliday
);
router.delete(
  '/admin/calendar/holidays/:id',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'MANAGER'),
  adminController.deletePublicHoliday
);
router.post(
  '/admin/calendar/closures',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'MANAGER'),
  adminController.addSpecialClosure
);
router.delete(
  '/admin/calendar/closures/:id',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'MANAGER'),
  adminController.deleteSpecialClosure
);

// 3. Feature Flags
router.get('/admin/feature-flags', adminController.getFeatureFlags);
router.post(
  '/admin/feature-flags/:key/toggle',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN'),
  adminController.toggleFeatureFlag
);

// 4. Localization & Languages
router.get('/admin/localization', adminController.getLocalizationPacks);
router.put(
  '/admin/localization/:langCode',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'MANAGER'),
  adminController.updateLocalizationPack
);

// 5. Numbering System & Sequence Generator
router.get('/admin/numbering', adminController.getNumberingSystem);
router.get('/admin/numbering/preview', adminController.previewNextNumbers);
router.put(
  '/admin/numbering',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN'),
  adminController.updateNumberingSystem
);

// 6. Document Storage Rules
router.get('/admin/documents', adminController.getDocumentConfig);
router.put(
  '/admin/documents',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN'),
  adminController.updateDocumentConfig
);

// 7. Branding & Themes
router.get('/admin/branding', adminController.getBrandingTheme);
router.put(
  '/admin/branding',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN'),
  adminController.updateBrandingTheme
);

// 8. Business Rules Configuration (Central System Settings)
router.get('/admin/system-settings', authenticate, adminController.getSystemSettings);
router.put(
  '/admin/system-settings/:section',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN'),
  adminController.updateSystemSettingsSection
);

// 9. System Health & Infrastructure Monitoring
router.get(
  '/admin/health',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'MANAGER', 'AUDITOR'),
  adminController.getSystemHealth
);

// 10. Data Import & Export Center
router.get(
  '/admin/export',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'MANAGER', 'AUDITOR'),
  adminController.exportEntityData
);
router.post(
  '/admin/import',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN'),
  adminController.importEntityData
);

// 11. Configuration Audit Trail
router.get(
  '/admin/audit-logs',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'MANAGER', 'AUDITOR'),
  adminController.getConfigAuditLogs
);

// ==========================================
// DEVOPS, BENCHMARKING & OBSERVABILITY SUITE (PHASE 21)
// ==========================================
// Telemetry & Metrics
router.get(
  '/devops/metrics',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'MANAGER', 'AUDITOR'),
  benchmarkController.getMetrics
);

// Load Testing & Benchmark Engine
router.post(
  '/devops/benchmark/run',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN'),
  benchmarkController.runLoadTest
);
router.get(
  '/devops/benchmark/history',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'MANAGER', 'AUDITOR'),
  benchmarkController.getBenchmarkHistory
);

// Centralized Cache Layer Management
router.get(
  '/devops/cache/stats',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'MANAGER', 'AUDITOR'),
  benchmarkController.getCacheStats
);
router.post(
  '/devops/cache/warmup',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN'),
  benchmarkController.warmUpCache
);
router.post(
  '/devops/cache/invalidate-tag',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN'),
  benchmarkController.invalidateCacheTag
);
router.post(
  '/devops/cache/clear',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN'),
  benchmarkController.clearCache
);

// Background Queue System Management
router.get(
  '/devops/queues/stats',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'MANAGER', 'AUDITOR'),
  benchmarkController.getQueueStats
);
router.get(
  '/devops/queues/jobs',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'MANAGER', 'AUDITOR'),
  benchmarkController.getQueueJobs
);
router.post(
  '/devops/queues/enqueue',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN'),
  benchmarkController.enqueueJob
);
router.post(
  '/devops/queues/retry/:id',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN'),
  benchmarkController.retryDlqJob
);
router.post(
  '/devops/queues/purge',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN'),
  benchmarkController.purgeQueue
);

// Structured Log Stream
router.get(
  '/devops/logs',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'MANAGER', 'AUDITOR'),
  benchmarkController.getLogs
);

// Storage & Signed URLs
router.get(
  '/devops/storage/files',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'MANAGER', 'AUDITOR'),
  benchmarkController.getStorageFiles
);
router.post(
  '/devops/storage/signed-url',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'MANAGER', 'AUDITOR'),
  benchmarkController.generateSignedUrl
);

// ==========================================
// PRODUCTION DATA MANAGEMENT (PHASE 24)
// ==========================================
router.get(
  '/admin/production-data/status',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'SYSTEM:BACKUP:MANAGE'),
  adminController.getProductionDataStatus
);

router.get(
  '/admin/production-data/dry-run',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'SYSTEM:BACKUP:MANAGE'),
  adminController.getProductionDataDryRun
);

router.post(
  '/admin/production-data/cleanup',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN'),
  adminController.executeProductionDataCleanup
);

router.post(
  '/admin/production-data/generate-original-data',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN'),
  adminController.generateOriginalData
);

// ==========================================
// LEGACY DATA MIGRATION & RECONCILIATION (PHASE 25)
// ==========================================
router.get(
  '/migration/packages',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'ACCOUNTANT', 'MANAGER', 'AUDITOR'),
  migrationController.getPackages
);

router.get(
  '/migration/source-file/:packageKey',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'ACCOUNTANT', 'MANAGER', 'AUDITOR'),
  migrationController.downloadSourceFile
);

router.post(
  '/migration/init-package',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'ACCOUNTANT', 'MANAGER'),
  migrationController.initFromPackage
);

router.post(
  '/migration/upload',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'ACCOUNTANT', 'MANAGER'),
  migrationController.uploadFile
);

router.get(
  '/migration/batches',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'ACCOUNTANT', 'MANAGER', 'AUDITOR'),
  migrationController.getBatches
);

router.get(
  '/migration/batches/:id',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'ACCOUNTANT', 'MANAGER', 'AUDITOR'),
  migrationController.getBatchById
);

router.put(
  '/migration/batches/:id/mappings',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'ACCOUNTANT', 'MANAGER'),
  migrationController.updateMappings
);

router.post(
  '/migration/batches/:id/dry-run',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'ACCOUNTANT', 'MANAGER'),
  migrationController.runDryRun
);

router.post(
  '/migration/batches/:id/submit',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'ACCOUNTANT', 'MANAGER'),
  migrationController.submitBatch
);

router.post(
  '/migration/batches/:id/approve',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'MANAGER'),
  migrationController.approveBatch
);

router.post(
  '/migration/batches/:id/reject',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'MANAGER'),
  migrationController.rejectBatch
);

router.post(
  '/migration/batches/:id/import',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'ACCOUNTANT', 'MANAGER'),
  migrationController.executeImport
);

router.post(
  '/migration/batches/:id/rollback',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'MANAGER'),
  migrationController.rollbackBatch
);

router.get(
  '/migration/batches/:id/exceptions',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'ACCOUNTANT', 'MANAGER', 'AUDITOR'),
  migrationController.getExceptions
);

router.post(
  '/migration/exceptions/:id/resolve',
  authenticate,
  requirePermission('SYSTEM:SETTINGS:MANAGE', 'ADMIN', 'ACCOUNTANT', 'MANAGER'),
  migrationController.resolveException
);

// ==========================================
// TELEGRAM ENTERPRISE BOT ENDPOINTS
// ==========================================
router.get('/telegram/status', (req, res) => {
  try {
    const status = telegramBotService.getStatus();
    res.json({ success: true, data: status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/telegram/send-otp', async (req, res) => {
  try {
    const { phone, otpCode, memberName, membershipNo } = req.body;
    if (!phone || !otpCode) {
      return res.status(400).json({ success: false, error: 'Phone and OTP code are required' });
    }
    const result = await telegramBotService.sendOtp(phone, otpCode, memberName, membershipNo);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/telegram/verify-otp', async (req, res) => {
  try {
    const { phone, otpCode } = req.body;
    if (!phone || !otpCode) {
      return res.status(400).json({ success: false, error: 'Phone and OTP code are required' });
    }
    const result = telegramBotService.verifyOtp(phone, otpCode);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error || result.message });
    }
    res.json({ success: true, message: result.message });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/telegram/webhook', async (req, res) => {
  try {
    if (req.body) {
      await telegramBotService.handleUpdate(req.body);
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(200).json({ ok: false, error: err.message });
  }
});

router.post('/telegram/test-message', authenticate, async (req, res) => {
  try {
    const { chatId, message } = req.body;
    if (!chatId || !message) {
      return res.status(400).json({ success: false, error: 'chatId and message are required' });
    }
    const result = await telegramBotService.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;


