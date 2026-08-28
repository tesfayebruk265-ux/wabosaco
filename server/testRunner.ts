import { db } from './db/database';
import { authService } from './services/authService';
import { userService } from './services/userService';
import { rbacService } from './services/rbacService';
import { memberService, RegisterMemberInput } from './services/memberService';
import { financialService, financialMath } from './services/financialService';
import { shareService } from './services/shareService';
import { loanService } from './services/loanService';
import { accountingService } from './services/accountingService';
import { biService } from './services/biService';
import { notificationService } from './services/notificationService';
import { backupDisasterService } from './services/backupDisasterService';
import { securityService } from './services/securityService';
import { mfaService } from './services/mfaService';
import { cryptoUtils } from './utils/crypto';
import { totpUtils } from './utils/totp';
import { migrationService } from './services/migrationService';
import { migrationSourceFilesService } from './services/migrationSourceFiles';
import { migrationParserService } from './services/migrationParserService';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runTest(suite: string, name: string, fn: () => Promise<void> | void) {
  const start = Date.now();
  try {
    await fn();
    results.push({ suite, name, passed: true, durationMs: Date.now() - start });
    console.log(`  ✓ [PASS] ${name}`);
  } catch (err: any) {
    results.push({ suite, name, passed: false, error: err.message, durationMs: Date.now() - start });
    console.error(`  ✗ [FAIL] ${name}: ${err.message}`);
  }
}

async function runAllTests() {
  console.log('\n======================================================');
  console.log('⚡ STARTING WABI SACCO COMPLETE SYSTEM QUALITY & E2E TEST SUITE');
  console.log('======================================================\n');

  // Reset database to known seed state
  db.resetDatabase();

  // ==========================================
  // SUITE 1: AUTHENTICATION & LOGIN
  // ==========================================
  console.log('📦 SUITE 1: Authentication & Credential Verification');
  
  await runTest('Auth', 'Member user login with phone number identifier', async () => {
    const res = await authService.login({ identifier: '+251911998877', password: 'MemberPassword123!' });
    if (res.user.username !== 'WB000143') throw new Error('Failed to resolve user by phone number');
    if (res.user.role !== 'MEMBER') throw new Error('Expected MEMBER role');
    if (!res.accessToken || !res.refreshToken) throw new Error('Missing access/refresh tokens');
  });

  await runTest('Auth', 'Member user login with membership number identifier', async () => {
    const res = await authService.login({ identifier: 'WB000143', password: 'MemberPassword123!' });
    if (res.user.id !== 'usr_member_143') throw new Error('Failed to resolve user by membership ID');
  });

  await runTest('Auth', 'Reject login with invalid password', async () => {
    try {
      await authService.login({ identifier: 'admin.sacco', password: 'WrongPassword999!' });
      throw new Error('Should have failed login with wrong password');
    } catch (err: any) {
      if (err.code !== 'AUTH_INVALID_CREDENTIALS') throw new Error(`Unexpected error code: ${err.code}`);
    }
  });

  await runTest('Auth', 'Account lockout after 5 consecutive failed attempts', async () => {
    const testUsername = 'acct.dawit';
    for (let i = 0; i < 5; i++) {
      try {
        await authService.login({ identifier: testUsername, password: 'BadPassword123!' });
      } catch (err: any) {
        if (err.code !== 'AUTH_INVALID_CREDENTIALS') throw err;
      }
    }
    // 6th attempt with correct password should now be blocked by lockout!
    try {
      await authService.login({ identifier: testUsername, password: 'AccountantPassword123!' });
      throw new Error('Account should have been locked out');
    } catch (err: any) {
      if (err.code !== 'AUTH_ACCOUNT_LOCKED') throw new Error(`Expected AUTH_ACCOUNT_LOCKED, got ${err.code}`);
    }
  });

  await runTest('Auth', 'Deactivated account cannot log in', async () => {
    try {
      await authService.login({ identifier: 'deactivated.user', password: 'Deactivated123!' });
      throw new Error('Deactivated account was allowed to log in');
    } catch (err: any) {
      if (err.code !== 'AUTH_ACCOUNT_DEACTIVATED') throw new Error(`Expected AUTH_ACCOUNT_DEACTIVATED, got ${err.code}`);
    }
  });

  // ==========================================
  // SUITE 2: MULTI-FACTOR AUTHENTICATION & TOTP
  // ==========================================
  console.log('\n📦 SUITE 2: Multi-Factor Authentication (MFA) & TOTP');

  await runTest('MFA', 'Admin login triggers MFA challenge when no code provided', async () => {
    const res: any = await authService.login({ identifier: 'admin.sacco', password: 'AdminPassword123!' });
    if (!res.mfaRequired || !res.mfaToken) throw new Error('Expected MFA challenge response');
    if (res.preferredMethod !== 'TOTP') throw new Error('Expected TOTP preferred method');
  });

  await runTest('MFA', 'Admin user login succeeds with valid TOTP code', async () => {
    const totpCode = totpUtils.generateTOTP('JBSWY3DPEHPK3PXP');
    const res = await authService.login({
      identifier: 'admin.sacco',
      password: 'AdminPassword123!',
      totpCode,
    });
    if (!res.accessToken || !res.refreshToken) throw new Error('Missing tokens in login response');
    if (res.user.role !== 'ADMIN') throw new Error(`Expected role ADMIN, got ${res.user.role}`);
    if (!res.permissions.includes('SYSTEM:USER:MANAGE')) throw new Error('Missing SYSTEM:USER:MANAGE permission');
  });

  await runTest('MFA', 'Manager user login succeeds with valid backup recovery code', async () => {
    const res = await authService.login({
      identifier: 'manager.alemu',
      password: 'ManagerPassword123!',
      mfaCode: 'BK22-8801',
    });
    if (!res.accessToken || !res.refreshToken) throw new Error('Missing tokens in login response');
    if (res.user.role !== 'MANAGER') throw new Error(`Expected role MANAGER, got ${res.user.role}`);
  });

  // ==========================================
  // SUITE 3: TOKEN ROTATION & REPLAY DEFENSE
  // ==========================================
  console.log('\n📦 SUITE 3: Token Rotation & Security Replay Protection');

  await runTest('Tokens', 'Successful token refresh with rotation', async () => {
    const totpCode = totpUtils.generateTOTP('JBSWY3DPEHPK3PXP');
    const loginRes = await authService.login({
      identifier: 'admin.sacco',
      password: 'AdminPassword123!',
      totpCode,
    });
    const refreshRes = await authService.refresh(loginRes.refreshToken);
    if (!refreshRes.accessToken || !refreshRes.refreshToken) throw new Error('Missing rotated tokens');
    if (refreshRes.refreshToken === loginRes.refreshToken) throw new Error('Refresh token was not rotated');
  });

  await runTest('Tokens', 'Detect token reuse and revoke token family', async () => {
    const memberLogin = await authService.login({ identifier: 'WB000143', password: 'MemberPassword123!' });
    const originalToken = memberLogin.refreshToken;

    // Legitimate rotation 1
    const rot1 = await authService.refresh(originalToken);

    // Adversary attempts to replay the already consumed originalToken!
    try {
      await authService.refresh(originalToken);
      throw new Error('Replayed token should have been rejected');
    } catch (err: any) {
      if (err.code !== 'AUTH_TOKEN_REUSE_DETECTED') throw new Error(`Expected AUTH_TOKEN_REUSE_DETECTED, got ${err.code}`);
    }

    // Now rot1's token must also be revoked due to family compromise!
    try {
      await authService.refresh(rot1.refreshToken);
      throw new Error('Family should be revoked');
    } catch (err: any) {
      if (err.code !== 'AUTH_TOKEN_REUSE_DETECTED') throw new Error(`Expected family revocation, got ${err.code}`);
    }
  });

  // ==========================================
  // SUITE 4: PASSWORD MANAGEMENT & OTP RESET
  // ==========================================
  console.log('\n📦 SUITE 4: Password Management & OTP Reset Workflow');

  await runTest('Password', 'Request forgot password OTP', async () => {
    const res = await authService.forgotPassword('WB000143');
    if (!res.success) throw new Error('Forgot password request failed');
    if (!res.debugOtp) throw new Error('Debug OTP was not generated');
  });

  await runTest('Password', 'Execute password reset with OTP code', async () => {
    const reqRes = await authService.forgotPassword('WB000143');
    const otp = reqRes.debugOtp!;
    const resetRes = await authService.resetPassword({
      identifier: 'WB000143',
      otpCode: otp,
      newPassword: 'NewSecurePassword2026!',
      confirmPassword: 'NewSecurePassword2026!',
    });
    if (!resetRes.success) throw new Error('Reset password failed');

    // Login with new password
    const loginRes = await authService.login({ identifier: 'WB000143', password: 'NewSecurePassword2026!' });
    if (!loginRes.user) throw new Error('Failed to login with newly reset password');
  });

  // ==========================================
  // SUITE 5: USER MANAGEMENT & SAFETY GUARDRAILS
  // ==========================================
  console.log('\n📦 SUITE 5: User Management & Safety Guardrails');

  let createdUserId = '';
  await runTest('Users', 'Create new staff user with validation', async () => {
    const newUser = userService.createUser(
      {
        username: 'teller.hiwot',
        email: 'hiwot.b@wabisacco.et',
        phoneNumber: '+251912345678',
        fullName: 'Hiwot Bekele',
        role: 'ACCOUNTANT',
        password: 'TellerPassword123!',
      },
      { id: 'usr_admin_1', name: 'Admin', role: 'ADMIN' }
    );
    if (!newUser.id) throw new Error('Failed to create user');
    createdUserId = newUser.id;
  });

  await runTest('Users', 'Deactivate and reactivate created user', async () => {
    const deact = userService.deactivateUser(createdUserId, { id: 'usr_admin_1', name: 'Admin', role: 'ADMIN' });
    if (deact.isActive || deact.status !== 'DEACTIVATED') throw new Error('User was not deactivated');

    const act = userService.activateUser(createdUserId, { id: 'usr_admin_1', name: 'Admin', role: 'ADMIN' });
    if (!act.isActive || act.status !== 'ACTIVE') throw new Error('User was not reactivated');
  });

  await runTest('Users', 'Safety guardrail: Block deactivating the only active Admin', async () => {
    try {
      userService.deactivateUser('usr_admin_1', { id: 'usr_admin_1', name: 'Admin', role: 'ADMIN' });
      throw new Error('Should have blocked deactivating the last admin');
    } catch (err: any) {
      if (err.code !== 'SAFETY_LAST_ADMIN_PROTECTION') throw new Error(`Expected SAFETY_LAST_ADMIN_PROTECTION, got ${err.code}`);
    }
  });

  // ==========================================
  // SUITE 6: RBAC & AUDIT LOGGING
  // ==========================================
  console.log('\n📦 SUITE 6: RBAC & Audit Trail');

  await runTest('RBAC', 'Verify complete role-permission mapping', async () => {
    const roles = rbacService.getRoles();
    if (roles.length < 6) throw new Error('Missing default roles');
    const admin = roles.find((r) => r.code === 'ADMIN');
    if (!admin.permissions.includes('SYSTEM:USER:MANAGE')) throw new Error('Admin missing SYSTEM:USER:MANAGE');
    const member = roles.find((r) => r.code === 'MEMBER');
    if (member.permissions.includes('SYSTEM:USER:MANAGE')) throw new Error('Member should NOT have SYSTEM:USER:MANAGE');
  });

  await runTest('Audit', 'Verify audit log and security event tracking', async () => {
    const auditLogs = db.getAuditLogs(10);
    if (auditLogs.length === 0) throw new Error('No audit logs recorded');
    const securityEvents = db.getSecurityEvents(10);
    if (securityEvents.length === 0) throw new Error('No security events recorded');
  });

  // ==========================================
  // SUITE 7: MEMBER REGISTRATION & NOMINEES
  // ==========================================
  console.log('\n📦 SUITE 7: Member Registration & Strict Nominee Validation');

  await runTest('Registration', 'Reject registration when nominee percentages do not equal 100%', async () => {
    const invalidInput: RegisterMemberInput = {
      personalInfo: { fullName: 'Test Applicant', gender: 'MALE', dateOfBirth: '1995-01-01', nationalId: 'NAT-TEST-998811' },
      contactInfo: { phoneNumber: '+251911122334', email: 'applicant.test@example.com', username: 'test.applicant', password: 'SecurePassword123!' },
      address: { region: 'Addis Ababa', zone: 'Bole', woreda: 'Woreda 01', kebele: 'Kebele 01' },
      employment: { occupation: 'Engineer', employer: 'Test Corp', monthlyIncome: 30000, employmentType: 'Employed' },
      family: { familyMembersCount: 2 },
      emergencyContact: { name: 'Emergency Person', relationship: 'Friend', phone: '+251911000000' },
      nominees: [
        { fullName: 'Nominee A', relationship: 'Child', phone: '+251911111111', percentage: 40 },
        { fullName: 'Nominee B', relationship: 'Spouse', phone: '+251911222222', percentage: 40 },
      ],
      payment: { paymentMethod: 'CBE', referenceNumber: 'FT-TEST-INVALID-99', receiptUrl: 'data:image/svg+xml;utf8,<svg></svg>' },
    };

    try {
      await memberService.registerMember(invalidInput);
      throw new Error('Should have rejected registration with 80% nominee allocation');
    } catch (err: any) {
      if (!err.message.includes('100%')) throw new Error(`Unexpected error message: ${err.message}`);
    }
  });

  let validApplicationRef = '';
  await runTest('Registration', 'Submit valid registration request with 100% nominee allocation', async () => {
    const validInput: RegisterMemberInput = {
      personalInfo: { fullName: 'Dawit Yohannes Gizaw', gender: 'MALE', dateOfBirth: '1994-05-14', nationalId: 'NAT-ETH-199405-7712' },
      contactInfo: { phoneNumber: '+251944556677', email: 'dawit.yohannes@example.com', username: 'dawit.yohannes', password: 'StrongPassword123!' },
      address: { region: 'Addis Ababa', zone: 'Nifas Silk-Lafto', woreda: 'Woreda 04', kebele: 'Kebele 09', specificAddress: 'Near Jemo 1 Roundabout' },
      employment: { occupation: 'Architectural Consultant', employer: 'Studio One Architects', monthlyIncome: 55000, employmentType: 'Employed' },
      family: { familyMembersCount: 3 },
      emergencyContact: { name: 'Bethlehem Yohannes', relationship: 'Sister', phone: '+251911332211' },
      nominees: [
        { fullName: 'Bethlehem Yohannes', relationship: 'Sister', phone: '+251911332211', percentage: 70 },
        { fullName: 'Yohannes Gizaw', relationship: 'Father', phone: '+251911554433', percentage: 30 },
      ],
      referral: { referralType: 'Existing Member', referralMemberNo: 'WB000088' },
      payment: { paymentMethod: 'CBE', referenceNumber: 'CBE-FT-2026-990011', receiptUrl: 'data:image/svg+xml;utf8,<svg></svg>' },
    };

    const res = await memberService.registerMember(validInput);
    if (!res.applicationReference || res.status !== 'PENDING') {
      throw new Error('Registration submission did not return PENDING status or reference');
    }
    validApplicationRef = res.applicationReference;
  });

  let newMemberId = '';
  let issuedMembershipNo = '';
  await runTest('Verification', 'Accountant approves registration and generates unique sequential Membership ID', async () => {
    const accountantUser = db.getUsers().find((u) => u.id === 'usr_acct_1')!;
    const req = db.getRegistrationRequestByReference(validApplicationRef)!;

    const res = await memberService.approveRegistrationRequest(req.id, accountantUser);
    if (!res.success || !res.membershipNo) throw new Error('Approval failed');
    if (!res.membershipNo.startsWith('WB')) throw new Error(`Membership ID '${res.membershipNo}' does not follow 'WBxxxxxx' format`);
    issuedMembershipNo = res.membershipNo;
    newMemberId = res.member.id;
  });

  // ==========================================
  // SUITE 8: SAVINGS MANAGEMENT & DUAL CONTROL
  // ==========================================
  console.log('\n📦 SUITE 8: Savings Management & Maker-Checker Dual Control');

  let testAccountId = '';
  await runTest('Savings', 'Create regular savings account for member with initial deposit', async () => {
    const regAccounts = db.getSavingAccountsByMemberId(newMemberId);
    const existing = regAccounts.find((a) => a.productCode === 'REGULAR');
    if (existing) {
      testAccountId = existing.id;
    } else {
      const res = financialService.openSavingAccount({
        memberId: newMemberId,
        productCode: 'REGULAR',
        initialDeposit: 5000,
        paymentChannel: 'CBE_BANK',
        bankReferenceNo: 'INIT-DEP-2026-01',
        performedById: 'usr_acct_1',
        performedByName: 'Dawit Accountant',
      });
      testAccountId = res.id;
    }
    if (!testAccountId) throw new Error('Failed to obtain savings account ID');
  });

  await runTest('Savings', 'Execute deposit and verify general ledger and balance updates', async () => {
    const initialAcc = db.getSavingAccountById(testAccountId)!;
    const initialBal = initialAcc.balance;

    const depositTx = financialService.executeDeposit({
      accountId: testAccountId,
      amount: 15000,
      paymentChannel: 'CBE_BANK',
      bankReferenceNo: 'CBE-DEP-TXN-9988',
      narration: 'Monthly savings deposit',
      performedById: 'usr_acct_1',
      performedByName: 'Dawit Accountant',
    });

    const updatedAcc = db.getSavingAccountById(testAccountId)!;
    if (updatedAcc.balance !== financialMath.add(initialBal, 15000)) {
      throw new Error(`Expected balance ${initialBal + 15000}, got ${updatedAcc.balance}`);
    }
    const linkedJournal = db.getJournalEntries().find((j) => j.transactionId === depositTx.id || j.transactionReference === depositTx.transactionNo);
    if (!linkedJournal) throw new Error('Deposit transaction missing linked journal entry');
  });

  await runTest('Savings', 'Enforce minimum balance constraint on withdrawals', async () => {
    try {
      financialService.executeWithdrawal({
        accountId: testAccountId,
        amount: 500000, // exceeds available balance
        paymentChannel: 'CASH',
        narration: 'Overdrawn withdrawal attempt',
        performedById: 'usr_acct_1',
        performedByName: 'Dawit Accountant',
      });
      throw new Error('Should have rejected withdrawal exceeding balance');
    } catch (err: any) {
      if (!err.message.toLowerCase().includes('insufficient') && !err.message.toLowerCase().includes('minimum') && !err.message.toLowerCase().includes('not permitted')) {
        throw new Error(`Unexpected error message: ${err.message}`);
      }
    }
  });

  // ==========================================
  // SUITE 9: SHARE CAPITAL MANAGEMENT
  // ==========================================
  console.log('\n📦 SUITE 9: Share Capital Management & Dividend Accounting');

  await runTest('Shares', 'Purchase initial shares with par value consistency', async () => {
    const shareTx = shareService.purchaseShares({
      memberId: newMemberId,
      numberOfShares: 20,
      paymentMethod: 'CBE_BANK',
      bankReferenceNo: 'CBE-SHR-2026-001',
      performedById: 'usr_acct_1',
      performedByName: 'Dawit Accountant',
    });

    if (shareTx.shareTransaction.totalAmount !== 10000) throw new Error(`Expected 20 shares * 500 ETB = 10000 ETB, got ${shareTx.shareTransaction.totalAmount}`);
    const shareAcc = db.getShareAccountByMemberId(newMemberId);
    if (!shareAcc || shareAcc.numberOfShares < 20) throw new Error('Share account was not credited properly');
  });

  // ==========================================
  // SUITE 10: LOAN LIFECYCLE & AMORTIZATION
  // ==========================================
  console.log('\n📦 SUITE 10: Loan Lifecycle, Eligibility & Repayment Schedule');

  await runTest('Loans', 'Check loan borrowing eligibility (3x savings rule)', async () => {
    const report = loanService.evaluateEligibility(newMemberId, 'EMERGENCY', 10000);
    if (typeof report.maxBorrowableAmount !== 'number') throw new Error('Eligibility report missing maxBorrowableAmount');
  });

  await runTest('Loans', 'Compute reducing balance amortization schedule', async () => {
    const schedule = loanService.calculateAmortization(60000, 12, 12, 0, '2026-09-01');

    if (schedule.schedule.length !== 12) throw new Error(`Expected 12 schedule rows, got ${schedule.schedule.length}`);
    const lastRow = schedule.schedule[11];
    if (lastRow.remainingBalance > 0.05) throw new Error(`Expected final balance ~0, got ${lastRow.remainingBalance}`);
  });

  // ==========================================
  // SUITE 11: ENTERPRISE ACCOUNTING & GL INTEGRATION
  // ==========================================
  console.log('\n📦 SUITE 11: Enterprise Accounting & Trial Balance Parity');

  await runTest('Accounting', 'Verify Trial Balance mathematical balance (Debits == Credits)', async () => {
    const tb = accountingService.getTrialBalance('2026-12-31');
    if (!tb.isBalanced) {
      throw new Error(`Trial balance is unbalanced! Discrepancy: ${tb.discrepancy}, Total Debits: ${tb.totalDebit}, Total Credits: ${tb.totalCredit}`);
    }
  });

  await runTest('Accounting', 'Verify Balance Sheet fundamental equation (Assets = Liabilities + Equity)', async () => {
    const bs = accountingService.getBalanceSheet('2026-12-31');
    if (Math.abs(bs.variance) > 1.0) {
      throw new Error(`Balance sheet has variance: ${bs.variance}`);
    }
  });

  // ==========================================
  // SUITE 12: BUSINESS INTELLIGENCE & FORECASTING
  // ==========================================
  console.log('\n📦 SUITE 12: Business Intelligence & Forecasting Models');

  await runTest('BI', 'Generate Executive KPI metrics and financial ratios', async () => {
    const dashboard = biService.getExecutiveDashboard();
    if (typeof dashboard.kpi.totalSavingsBalance !== 'number' || typeof dashboard.kpi.totalOutstandingLoans !== 'number') {
      throw new Error('Invalid KPI metrics format');
    }
    const ratios = accountingService.getFinancialRatios('2026-12-31');
    if (ratios.liquidityRatio < 0) throw new Error('Liquidity ratio cannot be negative');
  });

  // ==========================================
  // SUITE 13: CRM & NOTIFICATION CENTER
  // ==========================================
  console.log('\n📦 SUITE 13: CRM Ticketing & Multi-Channel Communications');

  let ticketId = '';
  await runTest('CRM', 'Create and assign member support ticket with SLA', async () => {
    const member = db.getMemberById(newMemberId);
    const ticketNo = db.getNextTicketNumber();
    const createdTicket = db.createSupportTicket({
      id: 'tkt_' + cryptoUtils.generateUuid(),
      ticketNumber: ticketNo,
      memberId: newMemberId,
      membershipNo: member?.membershipNo || 'WB000143',
      memberFullName: member?.fullName || 'Dawit Yohannes',
      memberEmail: 'dawit.yohannes@example.com',
      memberPhone: '+251944556677',
      subject: 'Inquiry regarding 2026 AGM dividend payout schedule',
      description: 'When will the 2025/2026 dividend distribution be credited to voluntary accounts?',
      category: 'SHARES',
      priority: 'MEDIUM',
      currentStatus: 'OPEN',
      department: 'CUSTOMER_SERVICE',
      assignedStaffId: 'usr_cs_1',
      assignedStaffName: 'Selamawit Bekele',
      slaFirstResponseDue: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      slaResolutionDue: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      isSlaResponseBreached: false,
      isSlaResolutionBreached: false,
      escalationLevel: 0,
      attachments: [],
      isMerged: false,
      reopenCount: 0,
      lastRepliedAt: new Date().toISOString(),
      lastRepliedBy: 'Selamawit Bekele',
      lastRepliedRole: 'STAFF',
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
    });

    if (!createdTicket.id || createdTicket.currentStatus !== 'OPEN') throw new Error('Failed to create ticket in OPEN status');
    ticketId = createdTicket.id;
  });

  await runTest('CRM', 'Staff reply, internal note and ticket resolution', async () => {
    db.createTicketMessage({
      id: 'tmsg_' + cryptoUtils.generateUuid(),
      ticketId,
      type: 'STAFF_REPLY',
      senderId: 'usr_cs_1',
      senderName: 'Selamawit Bekele',
      senderRole: 'CUSTOMER_SERVICE',
      isInternalNote: false,
      content: 'Dividends will be officially approved at the AGM on Oct 24, 2026 and credited within 48 hours.',
      createdAt: new Date().toISOString(),
    });

    const updated = db.updateSupportTicket(ticketId, {
      currentStatus: 'RESOLVED',
      resolvedAt: new Date().toISOString(),
      resolution: 'Informed member regarding AGM timeline and automated credit workflow.',
    });

    if (!updated || updated.currentStatus !== 'RESOLVED') throw new Error('Ticket was not updated to RESOLVED');
  });

  await runTest('Notifications', 'Dispatch transactional alert via Notification Service', async () => {
    const pubResult = await notificationService.publish({
      eventCode: 'SAVINGS_DEPOSIT_SUCCESSFUL',
      category: 'SAVINGS',
      recipientMemberId: newMemberId,
      recipientName: 'Dawit Yohannes',
      recipientPhone: '+251944556677',
      recipientEmail: 'dawit.yohannes@example.com',
      variables: {
        amount: '15,000.00',
        accountNo: 'SA-REG-000145',
        reference: 'CBE-DEP-TXN-9988',
      },
      customTitle: 'Deposit Confirmation',
      customBody: 'Your deposit of ETB 15,000.00 has been credited to your Regular Savings Account.',
    });

    if (!pubResult.success) throw new Error('Notification publishing failed');
  });

  // ==========================================
  // SUITE 14: BACKUP & DISASTER RECOVERY
  // ==========================================
  console.log('\n📦 SUITE 14: Backup, Cryptographic Checksums & Disaster Recovery');

  let backupRecordId = '';
  await runTest('Backup', 'Generate full encrypted snapshot with SHA-256 integrity verification', async () => {
    const backupRes = backupDisasterService.createBackup('MANUAL', 'usr_admin_1');
    if (!backupRes.backup.id || backupRes.backup.status !== 'COMPLETED') throw new Error('Backup failed or did not complete');
    if (!backupRes.backup.checksum || backupRes.backup.checksum.length !== 64) throw new Error('Invalid SHA-256 checksum format');
    backupRecordId = backupRes.backup.id;
  });

  await runTest('Backup', 'Verify backup snapshot integrity and schema validation', async () => {
    const verifyRes = backupDisasterService.verifyBackup(backupRecordId);
    if (!verifyRes.success) throw new Error(`Backup integrity check failed: ${verifyRes.notes}`);
  });

  // ==========================================
  // SUITE 15: LEGACY DATA MIGRATION & RECONCILIATION
  // ==========================================
  console.log('\n📦 SUITE 15: Controlled Legacy Data Migration Lifecycle & Financial Reconciliation');

  let testBatchId = '';
  const adminUser = db.getUserById('usr_admin_1')!;
  const managerUser = db.getUserById('usr_manager_1')!;

  await runTest('Migration', 'Initialize historical package "All Members 399.xlsx" with SHA-256 hash & inspection', async () => {
    const batch = migrationService.createBatchFromPackage('all_members_399', adminUser);
    if (!batch.id || !batch.batchNumber.startsWith('MB-')) throw new Error('Failed to create migration batch with valid batch number');
    if (batch.sourceFileName !== 'All Members 399.xlsx') throw new Error('Incorrect source file name');
    if (!batch.sourceFileHash || batch.sourceFileHash.length !== 64) throw new Error('Invalid SHA-256 checksum');
    if (batch.worksheets.length !== 3) throw new Error(`Expected 3 worksheets, got ${batch.worksheets.length}`);
    if (batch.validationSummary.totalRows !== 399 * 3) throw new Error(`Expected 1197 rows across sheets, got ${batch.validationSummary.totalRows}`);
    testBatchId = batch.id;
  });

  await runTest('Migration', 'Execute Dry Run simulation without mutating production state', async () => {
    const initialMemberCount = db.getMembers().length;
    const initialTxCount = db.getFinancialTransactions().length;

    const dryRunBatch = migrationService.runDryRun(testBatchId);
    if (dryRunBatch.status !== 'READY_FOR_REVIEW') throw new Error('Batch status should be READY_FOR_REVIEW');
    if (!dryRunBatch.reconciliation) throw new Error('Reconciliation matrix missing from dry run');
    if (dryRunBatch.reconciliation.status !== 'BALANCED') throw new Error(`Expected BALANCED reconciliation, got ${dryRunBatch.reconciliation.status}`);

    // Verify zero production database mutation during dry run
    const currentMemberCount = db.getMembers().length;
    const currentTxCount = db.getFinancialTransactions().length;
    if (currentMemberCount !== initialMemberCount) throw new Error('Safety violation: Dry run altered members collection');
    if (currentTxCount !== initialTxCount) throw new Error('Safety violation: Dry run altered transactions collection');
  });

  await runTest('Migration', 'Maker-Checker separation of duties enforcement on batch approval', async () => {
    // Attempting self-approval by non-admin Maker should fail
    try {
      const mockMaker = { id: 'usr_maker_accountant', username: 'maker.acct', role: 'ACCOUNTANT' } as any;
      const b2 = migrationService.createBatchFromPackage('deresegn_report_2', mockMaker);
      migrationService.approveBatch(b2.id, mockMaker, true);
      throw new Error('Maker was incorrectly allowed to self-approve batch');
    } catch (e: any) {
      if (!e.message.includes('Maker-Checker Violation')) {
        throw new Error(`Unexpected error message: ${e.message}`);
      }
    }

    // Legitimate Checker approval
    const approved = migrationService.approveBatch(testBatchId, managerUser, true, 'Approved by SACCO General Manager with verified reconciliation');
    if (approved.status !== 'APPROVED') throw new Error('Batch status did not change to APPROVED');
    if (approved.approvedById !== managerUser.id) throw new Error('ApprovedById does not match Checker');
  });

  await runTest('Migration', 'Execute real transactional production import and verify legacy preservation', async () => {
    const beforeCount = db.getMembers().length;
    const importedBatch = await migrationService.executeImport(testBatchId, adminUser);

    if (importedBatch.status !== 'COMPLETED') throw new Error(`Expected COMPLETED status, got ${importedBatch.status}`);
    if (!importedBatch.executionStats || importedBatch.executionStats.membersCreated !== 399) {
      throw new Error(`Expected 399 members created, got ${importedBatch.executionStats?.membersCreated}`);
    }

    // Verify new sequential membership numbers generated while legacy SADV is preserved
    const migratedMembers = db.getMembers().filter((m) => m.migrationBatchId === testBatchId);
    if (migratedMembers.length !== 399) throw new Error(`Expected 399 migrated members, found ${migratedMembers.length}`);

    const sample = migratedMembers.find((m) => m.legacyMemberId === 'SADV-0001');
    if (!sample) throw new Error('SADV-0001 historical member was not found');
    if (!sample.membershipNo || !sample.membershipNo.startsWith('WB')) {
      throw new Error(`Authoritative Membership No not assigned: ${sample.membershipNo}`);
    }
    if (!sample.isMigrated) throw new Error('isMigrated flag is false');
    if (sample.legacySourceFile !== 'All Members 399.xlsx') throw new Error('Legacy source file not attached to member');

    // Verify GL journal entries created and balanced
    const glJournals = db.getJournalEntries().filter((j) => j.transactionReference?.includes(importedBatch.batchNumber));
    if (glJournals.length === 0) throw new Error('Migration GL opening journal entries not created');
    if (glJournals[0].totalDebit !== glJournals[0].totalCredit) throw new Error('GL journal entry is not balanced (Debits != Credits)');
  });

  await runTest('Migration', 'Duplicate detection prevents double-counting and flags exact matches', async () => {
    // Dry run on the same package should now flag 100% duplicate matches against production
    const dupBatch = migrationService.createBatchFromPackage('all_members_399', adminUser);
    if (dupBatch.validationSummary.duplicateCount !== 399) {
      throw new Error(`Expected 399 duplicates detected on re-run, got ${dupBatch.validationSummary.duplicateCount}`);
    }
  });

  await runTest('Migration', 'Batch rollback cleanly removes imported records and restores database state', async () => {
    const membersBeforeRollback = db.getMembers().length;
    const rollbackRes = migrationService.rollbackBatch(testBatchId, adminUser, 'Testing automated migration rollback protocol');

    if (!rollbackRes.success) throw new Error('Rollback failed');
    if (rollbackRes.deletedCounts.membersRemoved !== 399) {
      throw new Error(`Expected 399 members removed in rollback, got ${rollbackRes.deletedCounts.membersRemoved}`);
    }

    const membersAfterRollback = db.getMembers().length;
    if (membersBeforeRollback - membersAfterRollback !== 399) {
      throw new Error('Database member count was not accurately restored');
    }

    const rolledBackBatch = db.getMigrationBatchById(testBatchId);
    if (rolledBackBatch?.status !== 'ROLLED_BACK') throw new Error('Batch status is not ROLLED_BACK');
  });

  // ==========================================
  // FINAL SUMMARY
  // ==========================================
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log('\n======================================================');
  console.log(`🏁 TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED (${results.length} total)`);
  console.log('======================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
