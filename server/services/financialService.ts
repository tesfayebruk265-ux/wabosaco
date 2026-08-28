import { db } from '../db/database';
import {
  DbSavingProduct,
  DbSavingAccount,
  DbDepositBatch,
  DbChartOfAccount,
  DbJournalEntry,
  DbJournalEntryLine,
  DbFinancialTransaction,
  DbFinancialApproval,
  DbMonthlySavingsSchedule,
  DbInterestPostingRun,
  DbSystemSettings,
  SavingProductCode,
} from '../db/schema';

export type PaymentChannel = 'CASH' | 'CBE_BANK' | 'TSEHAY_BANK' | 'INTERNAL_TRANSFER' | 'SYSTEM';
export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'INTEREST_POSTING' | 'PENALTY_FEE' | 'REVERSAL';

// High precision decimal arithmetic helpers (avoiding JS float precision errors)
export const financialMath = {
  toCents(amount: number): number {
    return Math.round((Number(amount) || 0) * 100);
  },
  fromCents(cents: number): number {
    return Number((cents / 100).toFixed(2));
  },
  add(a: number, b: number): number {
    return this.fromCents(this.toCents(a) + this.toCents(b));
  },
  subtract(a: number, b: number): number {
    return this.fromCents(this.toCents(a) - this.toCents(b));
  },
  multiply(amount: number, factor: number): number {
    return Number((amount * factor).toFixed(4));
  },
  round2(num: number): number {
    return Number(Number(num || 0).toFixed(2));
  },
  round(num: number): number {
    return Number(Number(num || 0).toFixed(2));
  },
  round4(num: number): number {
    return Number(Number(num || 0).toFixed(4));
  },
};

export interface CreateAccountParams {
  memberId: string;
  productCode: SavingProductCode;
  initialDeposit?: number;
  paymentChannel?: PaymentChannel;
  bankReferenceNo?: string;
  guardianName?: string;
  guardianRelationship?: string;
  termMonths?: number;
  expectedMaturityDate?: string;
  maturityAction?: 'AUTO_RENEW' | 'TRANSFER_TO_VOLUNTARY' | 'PAYOUT';
  performedById: string;
  performedByName: string;
}

export interface DepositParams {
  accountId: string;
  amount: number;
  paymentChannel: PaymentChannel;
  bankReferenceNo?: string;
  narration: string;
  idempotencyKey?: string;
  performedById: string;
  performedByName: string;
}

export interface WithdrawalParams {
  accountId: string;
  amount: number;
  paymentChannel: PaymentChannel;
  bankReferenceNo?: string;
  narration: string;
  reason?: string;
  idempotencyKey?: string;
  performedById: string;
  performedByName: string;
}

export interface TransferParams {
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  narration: string;
  idempotencyKey?: string;
  performedById: string;
  performedByName: string;
}

export interface AccountBalanceDetails {
  accountId: string;
  accountNo: string;
  memberId: string;
  productCode: SavingProductCode;
  productName: string;
  totalBalance: number;
  clearedBalance: number;
  heldBalance: number;
  availableBalance: number;
  accruedInterest: number;
  status: string;
  minOpeningBalance: number;
  allowPartialWithdrawal: boolean;
  withdrawalHoldingDays: number;
  holdingBatches: {
    id: string;
    amount: number;
    depositDate: string;
    clearedDate: string;
    isCleared: boolean;
    remainingDays: number;
  }[];
}

class FinancialService {
  // ==========================================
  // 1. ACCOUNT BALANCES & HOLDING PERIOD LOGIC
  // ==========================================
  public calculateAccountBalances(accountId: string): AccountBalanceDetails {
    const account = db.getSavingAccountById(accountId);
    if (!account) {
      throw new Error(`Account not found with ID: ${accountId}`);
    }

    const product = db.getSavingProductById(account.productId) || db.getSavingProductByCode(account.productCode);
    const now = new Date();

    // Check deposit batches for voluntary / holding days
    const batches = db.getDepositBatchesByAccountId(accountId);
    let heldBalance = 0;
    const batchDetails: AccountBalanceDetails['holdingBatches'] = [];

    batches.forEach((b) => {
      const clearDate = new Date(b.clearedDate);
      const isMatured = now >= clearDate;
      
      // Update batch if status changed
      if (isMatured && !b.isCleared) {
        db.updateDepositBatch(b.id, { isCleared: true });
        b.isCleared = true;
      }

      const diffMs = clearDate.getTime() - now.getTime();
      const remainingDays = isMatured ? 0 : Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      if (!isMatured && b.remainingAmount > 0) {
        heldBalance = financialMath.add(heldBalance, b.remainingAmount);
      }

      batchDetails.push({
        id: b.id,
        amount: b.amount,
        depositDate: b.depositDate,
        clearedDate: b.clearedDate,
        isCleared: isMatured,
        remainingDays,
      });
    });

    const totalBalance = account.balance;
    const clearedBalance = Math.max(0, financialMath.subtract(totalBalance, heldBalance));
    
    // Regular savings does not allow partial withdrawal unless closed
    let availableBalance = 0;
    if (account.status !== 'ACTIVE') {
      availableBalance = 0;
    } else if (account.productCode === 'REGULAR') {
      availableBalance = 0; // Locked for loans/membership
    } else if (account.productCode === 'TIME_DEPOSIT') {
      // Locked until maturity unless early broken
      availableBalance = 0;
    } else {
      availableBalance = clearedBalance;
    }

    return {
      accountId: account.id,
      accountNo: account.accountNo,
      memberId: account.memberId,
      productCode: account.productCode,
      productName: account.productName,
      totalBalance: financialMath.round2(totalBalance),
      clearedBalance: financialMath.round2(clearedBalance),
      heldBalance: financialMath.round2(heldBalance),
      availableBalance: financialMath.round2(availableBalance),
      accruedInterest: financialMath.round2(account.accruedInterest),
      status: account.status,
      minOpeningBalance: product ? product.minOpeningBalance : 0,
      allowPartialWithdrawal: product ? product.allowPartialWithdrawal : false,
      withdrawalHoldingDays: product ? product.withdrawalHoldingDays : 0,
      holdingBatches: batchDetails,
    };
  }

  // ==========================================
  // 2. SAVINGS ACCOUNT OPENING
  // ==========================================
  public openSavingAccount(params: CreateAccountParams): DbSavingAccount {
    const member = db.getMemberById(params.memberId);
    if (!member) {
      throw new Error(`Member not found: ${params.memberId}`);
    }

    const product = db.getSavingProductByCode(params.productCode);
    if (!product || product.status !== 'ACTIVE') {
      throw new Error(`Saving product ${params.productCode} is not available or inactive.`);
    }

    // Check unique account constraints (1 regular savings per member)
    if (params.productCode === 'REGULAR') {
      const existing = db.getSavingAccountsByMemberId(params.memberId).find((a) => a.productCode === 'REGULAR');
      if (existing) {
        throw new Error(`Member ${member.membershipNo} already has a Regular Compulsory Savings account (${existing.accountNo}).`);
      }
    }

    if (params.productCode === 'CHILDREN' && (!params.guardianName || !params.guardianRelationship)) {
      throw new Error("Children's Trust account requires legal Guardian Name and Relationship.");
    }

    const accountNo = db.generateAccountNo(params.productCode, member.membershipNo);
    const now = new Date().toISOString();

    const newAccount: DbSavingAccount = {
      id: `acc_sav_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      accountNo,
      memberId: member.id,
      membershipNo: member.membershipNo,
      memberName: member.fullName,
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      currency: 'ETB',
      balance: 0,
      accruedInterest: 0,
      lastInterestCalculationDate: now,
      guardianInfo: params.guardianName
        ? {
            guardianName: params.guardianName,
            relationship: params.guardianRelationship || '',
            nationalId: '',
            phone: '',
          }
        : undefined,
      timeDepositDetails: params.termMonths
        ? {
            principalAmount: params.initialDeposit || 0,
            termMonths: params.termMonths,
            interestRate: product.annualInterestRate,
            startDate: now,
            maturityDate:
              params.expectedMaturityDate ||
              new Date(Date.now() + params.termMonths * 30 * 24 * 3600 * 1000).toISOString(),
            isMatured: false,
            autoRollover: params.maturityAction === 'AUTO_RENEW',
            expectedMaturityAmount: 0,
            earlyWithdrawalPenaltyPercent: product.earlyWithdrawalPenaltyPercent,
          }
        : undefined,
      status: 'ACTIVE',
      openingDate: now,
      createdAt: now,
      updatedAt: now,
    };

    db.createSavingAccount(newAccount);

    db.recordAuditLog({
      id: `aud_${Date.now()}`,
      actorId: params.performedById,
      actorName: params.performedByName,
      actorRole: 'STAFF',
      action: 'OPEN_SAVING_ACCOUNT',
      resource: 'SAVING_ACCOUNT',
      resourceId: newAccount.id,
      result: 'SUCCESS',
      afterState: { accountNo: newAccount.accountNo, productCode: product.code, memberNo: member.membershipNo },
      ipAddress: '127.0.0.1',
      userAgent: 'System/API',
      timestamp: now,
    });

    // If initial deposit is provided, execute atomic deposit
    if (params.initialDeposit && params.initialDeposit > 0) {
      if (params.initialDeposit < product.minOpeningBalance) {
        throw new Error(
          `Initial deposit ${params.initialDeposit} ETB is less than product minimum opening balance (${product.minOpeningBalance} ETB).`
        );
      }

      this.executeDeposit({
        accountId: newAccount.id,
        amount: params.initialDeposit,
        paymentChannel: params.paymentChannel || 'CBE_BANK',
        bankReferenceNo: params.bankReferenceNo,
        narration: `Initial opening deposit for ${product.name} (${accountNo})`,
        performedById: params.performedById,
        performedByName: params.performedByName,
      });
    }

    return db.getSavingAccountById(newAccount.id)!;
  }

  // ==========================================
  // 3. ATOMIC DEPOSIT TRANSACTION ENGINE
  // ==========================================
  public executeDeposit(params: DepositParams): DbFinancialTransaction {
    // Idempotency check
    if (params.idempotencyKey) {
      const existing = db.getFinancialTransactionByIdempotencyKey(params.idempotencyKey);
      if (existing) return existing;
    }

    // Duplicate bank reference check
    if (params.bankReferenceNo) {
      const duplicate = db.getFinancialTransactionByBankRef(params.bankReferenceNo);
      if (duplicate) {
        throw new Error(`Duplicate transaction: Bank reference ${params.bankReferenceNo} has already been processed in transaction ${duplicate.transactionNo}.`);
      }
    }

    if (!params.amount || params.amount <= 0) {
      throw new Error('Deposit amount must be strictly greater than 0 ETB.');
    }

    const account = db.getSavingAccountById(params.accountId);
    if (!account) {
      throw new Error(`Account not found: ${params.accountId}`);
    }

    if (account.status !== 'ACTIVE') {
      throw new Error(`Cannot deposit to account ${account.accountNo} in ${account.status} state.`);
    }

    const product = db.getSavingProductById(account.productId) || db.getSavingProductByCode(account.productCode);
    const balanceBefore = account.balance;
    const balanceAfter = financialMath.add(balanceBefore, params.amount);
    const now = new Date();
    const nowIso = now.toISOString();

    const transactionNo = db.getNextTransactionNo();
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Create Financial Transaction Record
    const txRecord: DbFinancialTransaction = {
      id: txId,
      transactionNo,
      memberId: account.memberId,
      membershipNo: account.membershipNo,
      memberName: account.memberName,
      accountId: account.id,
      accountNo: account.accountNo,
      productCode: account.productCode,
      type: 'DEPOSIT',
      amount: financialMath.round2(params.amount),
      debitAmount: null,
      creditAmount: financialMath.round2(params.amount),
      balanceBefore: financialMath.round2(balanceBefore),
      balanceAfter: financialMath.round2(balanceAfter),
      paymentChannel: params.paymentChannel,
      bankReferenceNo: params.bankReferenceNo,
      narration: params.narration || `Deposit of ${params.amount} ETB to ${account.accountNo}`,
      idempotencyKey: params.idempotencyKey,
      status: 'POSTED',
      requiresApproval: false,
      createdById: params.performedById,
      createdByName: params.performedByName,
      approvedById: params.performedById,
      approvedByName: params.performedByName,
      timestamp: nowIso,
      createdAt: nowIso,
    };

    // 1. Commit Account Balance Update
    db.updateSavingAccount(account.id, {
      balance: balanceAfter,
      updatedAt: nowIso,
    });

    // 2. Track Deposit Holding Period (for voluntary or holding products)
    const holdingDays = product ? product.withdrawalHoldingDays : 0;
    const clearedDate = new Date(now.getTime() + holdingDays * 24 * 60 * 60 * 1000).toISOString();
    
    db.createDepositBatch({
      id: `bat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      accountId: account.id,
      accountNo: account.accountNo,
      memberId: account.memberId,
      transactionId: txId,
      amount: financialMath.round2(params.amount),
      remainingAmount: financialMath.round2(params.amount),
      depositDate: nowIso,
      clearedDate,
      isCleared: holdingDays === 0,
      createdAt: nowIso,
    });

    // 3. Update Monthly Savings Schedule if Regular
    if (account.productCode === 'REGULAR') {
      this.recordMonthlySavingsContribution(account.memberId, account.membershipNo, account.memberName, account.id, account.accountNo, params.amount);
    }

    // 4. Double-Entry Journal Entry
    this.createDoubleEntryJournal({
      transactionId: txId,
      transactionNo,
      type: 'DEPOSIT',
      amount: params.amount,
      paymentChannel: params.paymentChannel,
      accountCode: account.productCode,
      liabilityGlId: product?.glLiabilityAccountId || '2010-REG',
      narration: `Deposit to ${account.productName} - ${account.memberName} (${account.accountNo})`,
      postedBy: params.performedById,
      timestamp: nowIso,
    });

    // 5. Commit Transaction
    db.createFinancialTransaction(txRecord);

    // 6. Audit Log
    db.recordAuditLog({
      id: `aud_${Date.now()}`,
      actorId: params.performedById,
      actorName: params.performedByName,
      actorRole: 'STAFF',
      action: 'FINANCIAL_DEPOSIT',
      resource: 'TRANSACTION',
      resourceId: txId,
      result: 'SUCCESS',
      afterState: {
        transactionNo,
        accountNo: account.accountNo,
        amount: params.amount,
        paymentChannel: params.paymentChannel,
        bankRef: params.bankReferenceNo,
      },
      ipAddress: '127.0.0.1',
      userAgent: 'System/API',
      timestamp: nowIso,
    });

    return txRecord;
  }

  // ==========================================
  // 4. ATOMIC WITHDRAWAL & MAKER-CHECKER ENGINE
  // ==========================================
  public executeWithdrawal(params: WithdrawalParams): {
    transaction: DbFinancialTransaction;
    requiresApproval: boolean;
    approvalId?: string;
  } {
    // Idempotency check
    if (params.idempotencyKey) {
      const existing = db.getFinancialTransactionByIdempotencyKey(params.idempotencyKey);
      if (existing) {
        return { transaction: existing, requiresApproval: existing.requiresApproval };
      }
    }

    if (!params.amount || params.amount <= 0) {
      throw new Error('Withdrawal amount must be strictly greater than 0 ETB.');
    }

    const account = db.getSavingAccountById(params.accountId);
    if (!account) {
      throw new Error(`Account not found: ${params.accountId}`);
    }

    if (account.status !== 'ACTIVE') {
      throw new Error(`Cannot withdraw from account ${account.accountNo} in ${account.status} status.`);
    }

    const balances = this.calculateAccountBalances(account.id);
    const product = db.getSavingProductById(account.productId) || db.getSavingProductByCode(account.productCode);
    const settings = db.getSystemSettings();

    // Check partial withdrawal restriction (e.g. Regular Savings cannot be partially withdrawn)
    if (!product?.allowPartialWithdrawal && account.balance !== params.amount) {
      throw new Error(
        `Partial withdrawals are not permitted for ${product?.name || 'this product'}. Funds are pledged for loan security and cooperative membership.`
      );
    }

    // Check available cleared funds (including 3-day holding lock)
    if (params.amount > balances.availableBalance) {
      if (balances.heldBalance > 0 && params.amount <= balances.totalBalance) {
        throw new Error(
          `Insufficient cleared funds. Total balance is ${balances.totalBalance.toLocaleString()} ETB, but ${balances.heldBalance.toLocaleString()} ETB is subject to the mandatory ${product?.withdrawalHoldingDays}-day clearance holding period. Available for withdrawal: ${balances.availableBalance.toLocaleString()} ETB.`
        );
      }
      throw new Error(
        `Insufficient available balance. Requested: ${params.amount.toLocaleString()} ETB, Available: ${balances.availableBalance.toLocaleString()} ETB.`
      );
    }

    const now = new Date().toISOString();
    const transactionNo = db.getNextTransactionNo();
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const isLargeWithdrawal = params.amount >= settings.largeWithdrawalThreshold;

    // If withdrawal exceeds threshold, route to MAKER-CHECKER Approval Queue
    if (isLargeWithdrawal) {
      const approvalId = `appr_fin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const txRecord: DbFinancialTransaction = {
        id: txId,
        transactionNo,
        memberId: account.memberId,
        membershipNo: account.membershipNo,
        memberName: account.memberName,
        accountId: account.id,
        accountNo: account.accountNo,
        productCode: account.productCode,
        type: 'WITHDRAWAL',
        amount: financialMath.round2(params.amount),
        debitAmount: financialMath.round2(params.amount),
        creditAmount: null,
        balanceBefore: financialMath.round2(account.balance),
        balanceAfter: financialMath.round2(financialMath.subtract(account.balance, params.amount)),
        paymentChannel: params.paymentChannel,
        bankReferenceNo: params.bankReferenceNo,
        narration: params.narration || `Withdrawal of ${params.amount} ETB from ${account.accountNo}`,
        idempotencyKey: params.idempotencyKey,
        status: 'PENDING_APPROVAL',
        requiresApproval: true,
        createdById: params.performedById,
        createdByName: params.performedByName,
        timestamp: now,
        createdAt: now,
      };

      const approvalRecord: DbFinancialApproval = {
        id: approvalId,
        requestType: 'LARGE_WITHDRAWAL',
        memberId: account.memberId,
        membershipNo: account.membershipNo,
        memberName: account.memberName,
        accountId: account.id,
        accountNo: account.accountNo,
        transactionId: txId,
        amount: financialMath.round2(params.amount),
        makerId: params.performedById,
        makerName: params.performedByName,
        makerRole: 'ACCOUNTANT',
        status: 'PENDING',
        riskLevel: params.amount >= 100000 ? 'HIGH' : 'MEDIUM',
        description:
          params.reason ||
          `Large withdrawal of ${params.amount.toLocaleString()} ETB exceeds ${settings.largeWithdrawalThreshold.toLocaleString()} ETB threshold.`,
        details: { transactionNo, amount: params.amount, accountNo: account.accountNo },
        createdAt: now,
      };

      db.createFinancialTransaction(txRecord);
      db.createFinancialApproval(approvalRecord);

      db.recordAuditLog({
        id: `aud_${Date.now()}`,
        actorId: params.performedById,
        actorName: params.performedByName,
        actorRole: 'STAFF',
        action: 'SUBMIT_WITHDRAWAL_APPROVAL',
        resource: 'FINANCIAL_APPROVAL',
        resourceId: approvalId,
        result: 'SUCCESS',
        afterState: { transactionNo, amount: params.amount, accountNo: account.accountNo },
        ipAddress: '127.0.0.1',
        userAgent: 'System/API',
        timestamp: now,
      });

      return {
        transaction: txRecord,
        requiresApproval: true,
        approvalId,
      };
    }

    // Direct posting for standard withdrawals
    const balanceBefore = account.balance;
    const balanceAfter = financialMath.subtract(balanceBefore, params.amount);

    const txRecord: DbFinancialTransaction = {
      id: txId,
      transactionNo,
      memberId: account.memberId,
      membershipNo: account.membershipNo,
      memberName: account.memberName,
      accountId: account.id,
      accountNo: account.accountNo,
      productCode: account.productCode,
      type: 'WITHDRAWAL',
      amount: financialMath.round2(params.amount),
      debitAmount: financialMath.round2(params.amount),
      creditAmount: null,
      balanceBefore: financialMath.round2(balanceBefore),
      balanceAfter: financialMath.round2(balanceAfter),
      paymentChannel: params.paymentChannel,
      bankReferenceNo: params.bankReferenceNo,
      narration: params.narration || `Withdrawal of ${params.amount} ETB from ${account.accountNo}`,
      idempotencyKey: params.idempotencyKey,
      status: 'POSTED',
      requiresApproval: false,
      createdById: params.performedById,
      createdByName: params.performedByName,
      approvedById: params.performedById,
      approvedByName: params.performedByName,
      timestamp: now,
      createdAt: now,
    };

    // 1. Commit Account Balance
    db.updateSavingAccount(account.id, {
      balance: balanceAfter,
      updatedAt: now,
    });

    // 2. Consume from Cleared Deposit Batches
    this.consumeDepositBatches(account.id, params.amount);

    // 3. Double-Entry Journal Entry
    this.createDoubleEntryJournal({
      transactionId: txId,
      transactionNo,
      type: 'WITHDRAWAL',
      amount: params.amount,
      paymentChannel: params.paymentChannel,
      accountCode: account.productCode,
      liabilityGlId: product?.glLiabilityAccountId || '2020-VOL',
      narration: `Withdrawal from ${account.productName} - ${account.memberName} (${account.accountNo})`,
      postedBy: params.performedById,
      timestamp: now,
    });

    // 4. Save Transaction Record
    db.createFinancialTransaction(txRecord);

    // 5. Audit Log
    db.recordAuditLog({
      id: `aud_${Date.now()}`,
      actorId: params.performedById,
      actorName: params.performedByName,
      actorRole: 'STAFF',
      action: 'FINANCIAL_WITHDRAWAL',
      resource: 'TRANSACTION',
      resourceId: txId,
      result: 'SUCCESS',
      afterState: { transactionNo, accountNo: account.accountNo, amount: params.amount, balanceAfter },
      ipAddress: '127.0.0.1',
      userAgent: 'System/API',
      timestamp: now,
    });

    return {
      transaction: txRecord,
      requiresApproval: false,
    };
  }

  // ==========================================
  // 5. APPROVE / REJECT MAKER-CHECKER WITHDRAWAL
  // ==========================================
  public approveFinancialRequest(params: {
    approvalId: string;
    reviewerId: string;
    reviewerName: string;
    reviewerRole: string;
    decision: 'APPROVED' | 'REJECTED';
    comments?: string;
  }): { approval: DbFinancialApproval; transaction: DbFinancialTransaction } {
    const approval = db.getFinancialApprovalById(params.approvalId);
    if (!approval) {
      throw new Error(`Approval request not found: ${params.approvalId}`);
    }

    if (approval.status !== 'PENDING') {
      throw new Error(`Approval request is already in ${approval.status} status.`);
    }

    // STRICT SEPARATION OF DUTIES: Creator cannot approve their own financial request!
    if (approval.makerId === params.reviewerId) {
      throw new Error('Separation of Duties Violation: You cannot approve or reject a financial transaction you created.');
    }

    // Auditors are read-only
    if (params.reviewerRole === 'AUDITOR' || params.reviewerRole === 'role_auditor') {
      throw new Error('Auditors have read-only access and cannot approve financial transactions.');
    }

    const tx = approval.transactionId ? db.getFinancialTransactionById(approval.transactionId) : undefined;
    if (!tx) {
      throw new Error(`Associated transaction not found: ${approval.transactionId}`);
    }

    const account = approval.accountId ? db.getSavingAccountById(approval.accountId) : undefined;
    if (!account) {
      throw new Error(`Associated account not found: ${approval.accountId}`);
    }

    const now = new Date().toISOString();
    const product = db.getSavingProductById(account.productId) || db.getSavingProductByCode(account.productCode);

    if (params.decision === 'REJECTED') {
      db.updateFinancialApproval(approval.id, {
        status: 'REJECTED',
        checkerId: params.reviewerId,
        checkerName: params.reviewerName,
        reviewedAt: now,
        rejectionReason: params.comments || 'Rejected by Manager',
      });

      db.updateFinancialTransaction(tx.id, {
        status: 'REJECTED',
        narration: `[REJECTED] ${tx.narration} (Reason: ${params.comments || 'Rejected by Manager'})`,
      });

      db.recordAuditLog({
        id: `aud_${Date.now()}`,
        actorId: params.reviewerId,
        actorName: params.reviewerName,
        actorRole: 'MANAGER',
        action: 'REJECT_FINANCIAL_APPROVAL',
        resource: 'FINANCIAL_APPROVAL',
        resourceId: approval.id,
        result: 'SUCCESS',
        afterState: { transactionNo: tx.transactionNo, reason: params.comments },
        ipAddress: '127.0.0.1',
        userAgent: 'System/API',
        timestamp: now,
      });

      return {
        approval: db.getFinancialApprovalById(approval.id)!,
        transaction: db.getFinancialTransactionById(tx.id)!,
      };
    }

    // Decision === 'APPROVED'
    // Re-verify account balance before committing
    const balances = this.calculateAccountBalances(account.id);
    if (approval.amount > balances.availableBalance) {
      throw new Error(
        `Cannot execute approved withdrawal: Account balance changed. Available: ${balances.availableBalance} ETB, Requested: ${approval.amount} ETB.`
      );
    }

    const balanceBefore = account.balance;
    const balanceAfter = financialMath.subtract(balanceBefore, approval.amount);

    // 1. Commit Account Balance
    db.updateSavingAccount(account.id, {
      balance: balanceAfter,
      updatedAt: now,
    });

    // 2. Consume Batches
    this.consumeDepositBatches(account.id, approval.amount);

    // 3. Double-Entry Journal Entry
    this.createDoubleEntryJournal({
      transactionId: tx.id,
      transactionNo: tx.transactionNo,
      type: 'WITHDRAWAL',
      amount: approval.amount,
      paymentChannel: tx.paymentChannel,
      accountCode: account.productCode,
      liabilityGlId: product?.glLiabilityAccountId || '2020-VOL',
      narration: `Approved Manager Withdrawal: ${account.productName} - ${account.memberName} (${account.accountNo})`,
      postedBy: params.reviewerId,
      timestamp: now,
    });

    // 4. Update Transaction Status
    db.updateFinancialTransaction(tx.id, {
      status: 'POSTED',
      balanceBefore,
      balanceAfter,
      approvedById: params.reviewerId,
      approvedByName: params.reviewerName,
    });

    // 5. Update Approval Record
    db.updateFinancialApproval(approval.id, {
      status: 'APPROVED',
      checkerId: params.reviewerId,
      checkerName: params.reviewerName,
      reviewedAt: now,
    });

    // 6. Audit Log
    db.recordAuditLog({
      id: `aud_${Date.now()}`,
      actorId: params.reviewerId,
      actorName: params.reviewerName,
      actorRole: 'MANAGER',
      action: 'APPROVE_FINANCIAL_APPROVAL',
      resource: 'FINANCIAL_APPROVAL',
      resourceId: approval.id,
      result: 'SUCCESS',
      afterState: { transactionNo: tx.transactionNo, amount: approval.amount, newBalance: balanceAfter },
      ipAddress: '127.0.0.1',
      userAgent: 'System/API',
      timestamp: now,
    });

    return {
      approval: db.getFinancialApprovalById(approval.id)!,
      transaction: db.getFinancialTransactionById(tx.id)!,
    };
  }

  // ==========================================
  // 6. INTERNAL ACCOUNT-TO-ACCOUNT TRANSFER
  // ==========================================
  public executeTransfer(params: TransferParams): {
    withdrawalTx: DbFinancialTransaction;
    depositTx: DbFinancialTransaction;
  } {
    if (params.sourceAccountId === params.destinationAccountId) {
      throw new Error('Source and destination accounts cannot be identical.');
    }

    if (!params.amount || params.amount <= 0) {
      throw new Error('Transfer amount must be strictly greater than 0 ETB.');
    }

    const sourceAcc = db.getSavingAccountById(params.sourceAccountId);
    const destAcc = db.getSavingAccountById(params.destinationAccountId);

    if (!sourceAcc || !destAcc) {
      throw new Error('One or both transfer accounts were not found.');
    }

    if (sourceAcc.status !== 'ACTIVE' || destAcc.status !== 'ACTIVE') {
      throw new Error('Both accounts must be ACTIVE to execute a transfer.');
    }

    const sourceBalances = this.calculateAccountBalances(sourceAcc.id);
    if (params.amount > sourceBalances.availableBalance) {
      throw new Error(
        `Insufficient available balance in source account ${sourceAcc.accountNo}. Available: ${sourceBalances.availableBalance} ETB.`
      );
    }

    const now = new Date().toISOString();
    const sourceBefore = sourceAcc.balance;
    const sourceAfter = financialMath.subtract(sourceBefore, params.amount);
    const destBefore = destAcc.balance;
    const destAfter = financialMath.add(destBefore, params.amount);

    const sourceTxNo = db.getNextTransactionNo();
    const destTxNo = db.getNextTransactionNo();

    // 1. Create Source Withdrawal Transaction
    const sourceTx: DbFinancialTransaction = {
      id: `tx_${Date.now()}_w_${Math.random().toString(36).substring(2, 6)}`,
      transactionNo: sourceTxNo,
      memberId: sourceAcc.memberId,
      membershipNo: sourceAcc.membershipNo,
      memberName: sourceAcc.memberName,
      accountId: sourceAcc.id,
      accountNo: sourceAcc.accountNo,
      productCode: sourceAcc.productCode,
      type: 'WITHDRAWAL',
      amount: financialMath.round2(params.amount),
      debitAmount: financialMath.round2(params.amount),
      creditAmount: null,
      balanceBefore: financialMath.round2(sourceBefore),
      balanceAfter: financialMath.round2(sourceAfter),
      paymentChannel: 'INTERNAL_TRANSFER',
      narration: params.narration || `Transfer OUT to ${destAcc.accountNo} (${destAcc.memberName})`,
      status: 'POSTED',
      requiresApproval: false,
      createdById: params.performedById,
      createdByName: params.performedByName,
      approvedById: params.performedById,
      approvedByName: params.performedByName,
      timestamp: now,
      createdAt: now,
    };

    // 2. Create Destination Deposit Transaction
    const destTx: DbFinancialTransaction = {
      id: `tx_${Date.now()}_d_${Math.random().toString(36).substring(2, 6)}`,
      transactionNo: destTxNo,
      memberId: destAcc.memberId,
      membershipNo: destAcc.membershipNo,
      memberName: destAcc.memberName,
      accountId: destAcc.id,
      accountNo: destAcc.accountNo,
      productCode: destAcc.productCode,
      type: 'DEPOSIT',
      amount: financialMath.round2(params.amount),
      debitAmount: null,
      creditAmount: financialMath.round2(params.amount),
      balanceBefore: financialMath.round2(destBefore),
      balanceAfter: financialMath.round2(destAfter),
      paymentChannel: 'INTERNAL_TRANSFER',
      narration: params.narration || `Transfer IN from ${sourceAcc.accountNo} (${sourceAcc.memberName})`,
      status: 'POSTED',
      requiresApproval: false,
      createdById: params.performedById,
      createdByName: params.performedByName,
      approvedById: params.performedById,
      approvedByName: params.performedByName,
      timestamp: now,
      createdAt: now,
    };

    // Update balances
    db.updateSavingAccount(sourceAcc.id, { balance: sourceAfter, updatedAt: now });
    db.updateSavingAccount(destAcc.id, { balance: destAfter, updatedAt: now });

    this.consumeDepositBatches(sourceAcc.id, params.amount);

    // Destination batch (instant cleared for internal transfer)
    db.createDepositBatch({
      id: `bat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      accountId: destAcc.id,
      accountNo: destAcc.accountNo,
      memberId: destAcc.memberId,
      transactionId: destTx.id,
      amount: financialMath.round2(params.amount),
      remainingAmount: financialMath.round2(params.amount),
      depositDate: now,
      clearedDate: now,
      isCleared: true,
      createdAt: now,
    });

    // Double Entry Journal: Debit Source Member Liability, Credit Destination Member Liability
    const sourceProd = db.getSavingProductById(sourceAcc.productId);
    const destProd = db.getSavingProductById(destAcc.productId);

    this.createTransferJournal({
      transactionId: sourceTx.id,
      transactionNo: `${sourceTxNo} / ${destTxNo}`,
      sourceGlId: sourceProd?.glLiabilityAccountId || '2020-VOL',
      destGlId: destProd?.glLiabilityAccountId || '2020-VOL',
      sourceAccountName: `${sourceAcc.accountNo} - ${sourceAcc.memberName}`,
      destAccountName: `${destAcc.accountNo} - ${destAcc.memberName}`,
      amount: params.amount,
      postedBy: params.performedById,
      timestamp: now,
    });

    db.createFinancialTransaction(sourceTx);
    db.createFinancialTransaction(destTx);

    db.recordAuditLog({
      id: `aud_${Date.now()}`,
      actorId: params.performedById,
      actorName: params.performedByName,
      actorRole: 'STAFF',
      action: 'FINANCIAL_TRANSFER',
      resource: 'TRANSACTION',
      resourceId: sourceTx.id,
      result: 'SUCCESS',
      afterState: {
        from: sourceAcc.accountNo,
        to: destAcc.accountNo,
        amount: params.amount,
      },
      ipAddress: '127.0.0.1',
      userAgent: 'System/API',
      timestamp: now,
    });

    return { withdrawalTx: sourceTx, depositTx: destTx };
  }

  // ==========================================
  // 7. COMPENSATING REVERSAL TRANSACTION ENGINE
  // ==========================================
  public reverseTransaction(params: {
    transactionId: string;
    reason: string;
    performedById: string;
    performedByName: string;
    performedByRole: string;
  }): DbFinancialTransaction {
    const originalTx = db.getFinancialTransactionById(params.transactionId);
    if (!originalTx) {
      throw new Error(`Transaction not found: ${params.transactionId}`);
    }

    if (originalTx.status !== 'POSTED') {
      throw new Error(`Only completed POSTED transactions can be reversed. Current status: ${originalTx.status}`);
    }

    if (originalTx.reversedByTransactionId) {
      throw new Error(`Transaction ${originalTx.transactionNo} has already been reversed.`);
    }

    // Role check: Only Manager or Admin can reverse completed financial transactions
    if (!['role_admin', 'role_manager', 'ADMIN', 'MANAGER'].includes(params.performedByRole)) {
      throw new Error('Manager or Admin authorization is strictly required to reverse posted financial transactions.');
    }

    const account = db.getSavingAccountById(originalTx.accountId);
    if (!account) {
      throw new Error(`Associated account not found: ${originalTx.accountId}`);
    }

    const now = new Date().toISOString();
    const reversalTxNo = db.getNextTransactionNo();
    const reversalTxId = `tx_${Date.now()}_rev_${Math.random().toString(36).substring(2, 6)}`;
    const product = db.getSavingProductById(account.productId) || db.getSavingProductByCode(account.productCode);

    let balanceBefore = account.balance;
    let balanceAfter = balanceBefore;
    let debitAmount: number | null = null;
    let creditAmount: number | null = null;

    if (originalTx.type === 'DEPOSIT') {
      // Reversing a deposit debits the member account (reduces balance)
      if (account.balance < originalTx.amount) {
        throw new Error(
          `Cannot reverse deposit: Member has already withdrawn funds. Current balance: ${account.balance} ETB, Reversal amount: ${originalTx.amount} ETB.`
        );
      }
      balanceAfter = financialMath.subtract(balanceBefore, originalTx.amount);
      debitAmount = originalTx.amount;
    } else if (originalTx.type === 'WITHDRAWAL') {
      // Reversing a withdrawal credits the member account (restores balance)
      balanceAfter = financialMath.add(balanceBefore, originalTx.amount);
      creditAmount = originalTx.amount;
    } else {
      throw new Error(`Reversal for transaction type ${originalTx.type} is not directly supported.`);
    }

    const reversalTx: DbFinancialTransaction = {
      id: reversalTxId,
      transactionNo: reversalTxNo,
      memberId: account.memberId,
      membershipNo: account.membershipNo,
      memberName: account.memberName,
      accountId: account.id,
      accountNo: account.accountNo,
      productCode: account.productCode,
      type: 'REVERSAL',
      amount: originalTx.amount,
      debitAmount,
      creditAmount,
      balanceBefore: financialMath.round2(balanceBefore),
      balanceAfter: financialMath.round2(balanceAfter),
      paymentChannel: originalTx.paymentChannel,
      bankReferenceNo: originalTx.bankReferenceNo ? `REV-${originalTx.bankReferenceNo}` : undefined,
      narration: `Compensating Reversal for ${originalTx.transactionNo}. Reason: ${params.reason}`,
      status: 'POSTED',
      requiresApproval: false,
      createdById: params.performedById,
      createdByName: params.performedByName,
      approvedById: params.performedById,
      approvedByName: params.performedByName,
      timestamp: now,
      createdAt: now,
    };

    // Update account balance
    db.updateSavingAccount(account.id, { balance: balanceAfter, updatedAt: now });

    // Mark original transaction as reversed
    db.updateFinancialTransaction(originalTx.id, {
      status: 'REVERSED',
      reversedByTransactionId: reversalTxId,
      reversalReason: params.reason,
    });

    // Create Compensating Reversal Journal
    this.createReversalJournal({
      originalTransactionNo: originalTx.transactionNo,
      reversalTransactionId: reversalTxId,
      reversalTransactionNo: reversalTxNo,
      originalType: originalTx.type,
      amount: originalTx.amount,
      paymentChannel: originalTx.paymentChannel,
      liabilityGlId: product?.glLiabilityAccountId || '2010-REG',
      postedBy: params.performedById,
      timestamp: now,
    });

    db.createFinancialTransaction(reversalTx);

    db.recordAuditLog({
      id: `aud_${Date.now()}`,
      actorId: params.performedById,
      actorName: params.performedByName,
      actorRole: 'MANAGER',
      action: 'REVERSE_FINANCIAL_TRANSACTION',
      resource: 'TRANSACTION',
      resourceId: reversalTxId,
      result: 'SUCCESS',
      afterState: {
        originalTransactionNo: originalTx.transactionNo,
        reversalTransactionNo: reversalTxNo,
        amount: originalTx.amount,
        reason: params.reason,
      },
      ipAddress: '127.0.0.1',
      userAgent: 'System/API',
      timestamp: now,
    });

    return reversalTx;
  }

  // ==========================================
  // 8. BATCH INTEREST CALCULATION & POSTING RUN
  // ==========================================
  public runBatchInterestPosting(params: {
    productCode?: SavingProductCode;
    performedById: string;
    performedByName: string;
    effectiveDate?: string;
  }): DbInterestPostingRun {
    const products = db.getSavingProducts().filter((p) => (!params.productCode ? true : p.code === params.productCode));
    const now = new Date().toISOString();
    const runId = `int_run_${Date.now()}`;
    let totalPostedInterest = 0;
    let totalAccountsProcessed = 0;
    const runDetails: DbInterestPostingRun['details'] = [];

    products.forEach((prod) => {
      const accounts = db.getSavingAccounts().filter((a) => a.productCode === prod.code && a.status === 'ACTIVE' && a.balance > 0);

      accounts.forEach((acc) => {
        // Calculate interest based on product formula
        let interest = 0;
        const rateDecimal = prod.annualInterestRate / 100;

        if (prod.interestCalculationMethod === 'MIN_MONTHLY_BALANCE') {
          // Semi-annual or monthly min balance calculation (6 months = rate * 6/12)
          const monthsFactor = prod.interestPostingFrequency === 'SEMI_ANNUAL' ? 0.5 : 1 / 12;
          interest = financialMath.round2(acc.balance * rateDecimal * monthsFactor);
        } else if (prod.interestCalculationMethod === 'AVERAGE_DAILY_BALANCE') {
          // Monthly average daily balance (30/365 of annual rate)
          interest = financialMath.round2(acc.balance * (rateDecimal / 12));
        } else if (prod.interestCalculationMethod === 'SIMPLE_MATURITY') {
          // Term deposit calculation (rate * termMonths / 12)
          const termMonths = acc.timeDepositDetails?.termMonths || 12;
          interest = financialMath.round2(acc.balance * rateDecimal * (termMonths / 12));
        }

        if (interest > 0) {
          const balanceBefore = acc.balance;
          const balanceAfter = financialMath.add(balanceBefore, interest);
          const txNo = db.getNextTransactionNo();
          const txId = `tx_${Date.now()}_int_${acc.id.substring(acc.id.length - 4)}`;

          const txRecord: DbFinancialTransaction = {
            id: txId,
            transactionNo: txNo,
            memberId: acc.memberId,
            membershipNo: acc.membershipNo,
            memberName: acc.memberName,
            accountId: acc.id,
            accountNo: acc.accountNo,
            productCode: acc.productCode,
            type: 'INTEREST_POSTING',
            amount: interest,
            debitAmount: null,
            creditAmount: interest,
            balanceBefore,
            balanceAfter,
            paymentChannel: 'SYSTEM',
            narration: `Automated ${prod.name} Interest Posting (${prod.annualInterestRate}% p.a.)`,
            status: 'POSTED',
            requiresApproval: false,
            createdById: params.performedById,
            createdByName: params.performedByName,
            approvedById: params.performedById,
            approvedByName: params.performedByName,
            timestamp: now,
            createdAt: now,
          };

          // Update account balance and reset accrued interest
          db.updateSavingAccount(acc.id, {
            balance: balanceAfter,
            accruedInterest: 0,
            lastInterestCalculationDate: now,
            updatedAt: now,
          });

          // Journal Entry: Debit 5010-INT-EXP (Interest Expense), Credit Product Liability Account
          this.createInterestJournal({
            transactionId: txId,
            transactionNo: txNo,
            amount: interest,
            liabilityGlId: prod.glLiabilityAccountId,
            memberAccountName: `${acc.accountNo} - ${acc.memberName}`,
            postedBy: params.performedById,
            timestamp: now,
          });

          db.createFinancialTransaction(txRecord);

          runDetails.push({
            accountId: acc.id,
            accountNo: acc.accountNo,
            memberId: acc.memberId,
            membershipNo: acc.membershipNo,
            memberName: acc.memberName,
            balance: acc.balance,
            rate: prod.annualInterestRate,
            interestAmount: interest,
          });

          totalPostedInterest = financialMath.add(totalPostedInterest, interest);
          totalAccountsProcessed++;
        }
      });
    });

    const runRecord: DbInterestPostingRun = {
      id: runId,
      period: params.effectiveDate || new Date().toISOString().substring(0, 7),
      runDate: now,
      productCode: params.productCode || 'ALL',
      totalAccountsProcessed,
      totalInterestAmount: totalPostedInterest,
      status: 'POSTED',
      executedBy: params.performedByName,
      details: runDetails,
      createdAt: now,
    };

    db.createInterestPostingRun(runRecord);

    db.recordAuditLog({
      id: `aud_${Date.now()}`,
      actorId: params.performedById,
      actorName: params.performedByName,
      actorRole: 'MANAGER',
      action: 'RUN_BATCH_INTEREST_POSTING',
      resource: 'INTEREST_RUN',
      resourceId: runId,
      result: 'SUCCESS',
      afterState: { totalAccountsProcessed, totalInterestPosted: totalPostedInterest },
      ipAddress: '127.0.0.1',
      userAgent: 'System/API',
      timestamp: now,
    });

    return runRecord;
  }

  // ==========================================
  // 9. DOUBLE-ENTRY JOURNAL HELPERS
  // ==========================================
  private createDoubleEntryJournal(params: {
    transactionId: string;
    transactionNo: string;
    type: 'DEPOSIT' | 'WITHDRAWAL';
    amount: number;
    paymentChannel: PaymentChannel;
    accountCode: SavingProductCode;
    liabilityGlId: string;
    narration: string;
    postedBy: string;
    timestamp: string;
  }): DbJournalEntry {
    const journalNo = db.getNextJournalNo();
    const assetGlId = params.paymentChannel === 'CASH' ? '1001-CSH' : params.paymentChannel === 'TSEHAY_BANK' ? '1020-TSH' : '1010-CBE';
    const assetGl = db.getChartOfAccountById(assetGlId);
    const liabilityGl = db.getChartOfAccountById(params.liabilityGlId);

    let lines: DbJournalEntryLine[] = [];

    if (params.type === 'DEPOSIT') {
      // Debit Asset (Cash/Bank), Credit Liability (Member Deposit)
      lines = [
        {
          id: `line_${Date.now()}_1`,
          accountId: assetGlId,
          accountCode: assetGl ? assetGl.accountCode : '1010',
          accountName: assetGl ? assetGl.accountName : 'Bank Clearing',
          debit: financialMath.round2(params.amount),
          credit: 0,
          description: `Deposit receipt via ${params.paymentChannel}`,
        },
        {
          id: `line_${Date.now()}_2`,
          accountId: params.liabilityGlId,
          accountCode: liabilityGl ? liabilityGl.accountCode : '2010',
          accountName: liabilityGl ? liabilityGl.accountName : 'Member Savings Liability',
          debit: 0,
          credit: financialMath.round2(params.amount),
          description: params.narration,
        },
      ];

      // Update Chart of Account balances
      if (assetGl) db.updateChartOfAccount(assetGl.id, { balance: financialMath.add(assetGl.balance, params.amount) });
      if (liabilityGl) db.updateChartOfAccount(liabilityGl.id, { balance: financialMath.add(liabilityGl.balance, params.amount) });
    } else {
      // Debit Liability (Member Deposit), Credit Asset (Cash/Bank)
      lines = [
        {
          id: `line_${Date.now()}_1`,
          accountId: params.liabilityGlId,
          accountCode: liabilityGl ? liabilityGl.accountCode : '2020',
          accountName: liabilityGl ? liabilityGl.accountName : 'Member Savings Liability',
          debit: financialMath.round2(params.amount),
          credit: 0,
          description: params.narration,
        },
        {
          id: `line_${Date.now()}_2`,
          accountId: assetGlId,
          accountCode: assetGl ? assetGl.accountCode : '1010',
          accountName: assetGl ? assetGl.accountName : 'Bank Clearing',
          debit: 0,
          credit: financialMath.round2(params.amount),
          description: `Payout via ${params.paymentChannel}`,
        },
      ];

      // Update Chart of Account balances
      if (liabilityGl) db.updateChartOfAccount(liabilityGl.id, { balance: financialMath.subtract(liabilityGl.balance, params.amount) });
      if (assetGl) db.updateChartOfAccount(assetGl.id, { balance: financialMath.subtract(assetGl.balance, params.amount) });
    }

    const journal: DbJournalEntry = {
      id: `jnl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      journalNo,
      transactionId: params.transactionId,
      transactionReference: params.transactionNo,
      date: params.timestamp,
      narration: params.narration,
      lines,
      totalDebit: financialMath.round2(params.amount),
      totalCredit: financialMath.round2(params.amount),
      postedBy: params.postedBy,
      status: 'POSTED',
      createdAt: params.timestamp,
    };

    return db.createJournalEntry(journal);
  }

  private createTransferJournal(params: {
    transactionId: string;
    transactionNo: string;
    sourceGlId: string;
    destGlId: string;
    sourceAccountName: string;
    destAccountName: string;
    amount: number;
    postedBy: string;
    timestamp: string;
  }): DbJournalEntry {
    const journalNo = db.getNextJournalNo();
    const sourceGl = db.getChartOfAccountById(params.sourceGlId);
    const destGl = db.getChartOfAccountById(params.destGlId);

    const lines: DbJournalEntryLine[] = [
      {
        id: `line_${Date.now()}_1`,
        accountId: params.sourceGlId,
        accountCode: sourceGl ? sourceGl.accountCode : '2020',
        accountName: sourceGl ? sourceGl.accountName : 'Source Liability Account',
        debit: financialMath.round2(params.amount),
        credit: 0,
        description: `Debit Transfer from ${params.sourceAccountName}`,
      },
      {
        id: `line_${Date.now()}_2`,
        accountId: params.destGlId,
        accountCode: destGl ? destGl.accountCode : '2020',
        accountName: destGl ? destGl.accountName : 'Destination Liability Account',
        debit: 0,
        credit: financialMath.round2(params.amount),
        description: `Credit Transfer to ${params.destAccountName}`,
      },
    ];

    if (sourceGl) db.updateChartOfAccount(sourceGl.id, { balance: financialMath.subtract(sourceGl.balance, params.amount) });
    if (destGl) db.updateChartOfAccount(destGl.id, { balance: financialMath.add(destGl.balance, params.amount) });

    const journal: DbJournalEntry = {
      id: `jnl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      journalNo,
      transactionId: params.transactionId,
      transactionReference: params.transactionNo,
      date: params.timestamp,
      narration: `Internal Account Transfer: ${params.sourceAccountName} -> ${params.destAccountName}`,
      lines,
      totalDebit: financialMath.round2(params.amount),
      totalCredit: financialMath.round2(params.amount),
      postedBy: params.postedBy,
      status: 'POSTED',
      createdAt: params.timestamp,
    };

    return db.createJournalEntry(journal);
  }

  private createInterestJournal(params: {
    transactionId: string;
    transactionNo: string;
    amount: number;
    liabilityGlId: string;
    memberAccountName: string;
    postedBy: string;
    timestamp: string;
  }): DbJournalEntry {
    const journalNo = db.getNextJournalNo();
    const expenseGl = db.getChartOfAccountById('5010-INT-EXP');
    const liabilityGl = db.getChartOfAccountById(params.liabilityGlId);

    const lines: DbJournalEntryLine[] = [
      {
        id: `line_${Date.now()}_1`,
        accountId: '5010-INT-EXP',
        accountCode: expenseGl ? expenseGl.accountCode : '5010',
        accountName: expenseGl ? expenseGl.accountName : 'Interest Expense on Member Deposits',
        debit: financialMath.round2(params.amount),
        credit: 0,
        description: `Interest Expense on ${params.memberAccountName}`,
      },
      {
        id: `line_${Date.now()}_2`,
        accountId: params.liabilityGlId,
        accountCode: liabilityGl ? liabilityGl.accountCode : '2010',
        accountName: liabilityGl ? liabilityGl.accountName : 'Member Savings Liability',
        debit: 0,
        credit: financialMath.round2(params.amount),
        description: `Interest Credited to ${params.memberAccountName}`,
      },
    ];

    if (expenseGl) db.updateChartOfAccount(expenseGl.id, { balance: financialMath.add(expenseGl.balance, params.amount) });
    if (liabilityGl) db.updateChartOfAccount(liabilityGl.id, { balance: financialMath.add(liabilityGl.balance, params.amount) });

    const journal: DbJournalEntry = {
      id: `jnl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      journalNo,
      transactionId: params.transactionId,
      transactionReference: params.transactionNo,
      date: params.timestamp,
      narration: `Automated Interest Posting: ${params.memberAccountName}`,
      lines,
      totalDebit: financialMath.round2(params.amount),
      totalCredit: financialMath.round2(params.amount),
      postedBy: params.postedBy,
      status: 'POSTED',
      createdAt: params.timestamp,
    };

    return db.createJournalEntry(journal);
  }

  private createReversalJournal(params: {
    originalTransactionNo: string;
    reversalTransactionId: string;
    reversalTransactionNo: string;
    originalType: TransactionType;
    amount: number;
    paymentChannel: PaymentChannel;
    liabilityGlId: string;
    postedBy: string;
    timestamp: string;
  }): DbJournalEntry {
    const journalNo = db.getNextJournalNo();
    const assetGlId = params.paymentChannel === 'CASH' ? '1001-CSH' : params.paymentChannel === 'TSEHAY_BANK' ? '1020-TSH' : '1010-CBE';
    const assetGl = db.getChartOfAccountById(assetGlId);
    const liabilityGl = db.getChartOfAccountById(params.liabilityGlId);

    let lines: DbJournalEntryLine[] = [];

    if (params.originalType === 'DEPOSIT') {
      // Reversing a deposit: Debit Liability, Credit Asset
      lines = [
        {
          id: `line_${Date.now()}_1`,
          accountId: params.liabilityGlId,
          accountCode: liabilityGl ? liabilityGl.accountCode : '2010',
          accountName: liabilityGl ? liabilityGl.accountName : 'Member Savings Liability',
          debit: financialMath.round2(params.amount),
          credit: 0,
          description: `Compensating Reversal for Deposit ${params.originalTransactionNo}`,
        },
        {
          id: `line_${Date.now()}_2`,
          accountId: assetGlId,
          accountCode: assetGl ? assetGl.accountCode : '1010',
          accountName: assetGl ? assetGl.accountName : 'Bank / Cash Account',
          debit: 0,
          credit: financialMath.round2(params.amount),
          description: `Compensating Asset Credit for ${params.originalTransactionNo}`,
        },
      ];

      if (liabilityGl) db.updateChartOfAccount(liabilityGl.id, { balance: financialMath.subtract(liabilityGl.balance, params.amount) });
      if (assetGl) db.updateChartOfAccount(assetGl.id, { balance: financialMath.subtract(assetGl.balance, params.amount) });
    } else {
      // Reversing a withdrawal: Debit Asset, Credit Liability
      lines = [
        {
          id: `line_${Date.now()}_1`,
          accountId: assetGlId,
          accountCode: assetGl ? assetGl.accountCode : '1010',
          accountName: assetGl ? assetGl.accountName : 'Bank / Cash Account',
          debit: financialMath.round2(params.amount),
          credit: 0,
          description: `Compensating Asset Debit for Withdrawal ${params.originalTransactionNo}`,
        },
        {
          id: `line_${Date.now()}_2`,
          accountId: params.liabilityGlId,
          accountCode: liabilityGl ? liabilityGl.accountCode : '2020',
          accountName: liabilityGl ? liabilityGl.accountName : 'Member Savings Liability',
          debit: 0,
          credit: financialMath.round2(params.amount),
          description: `Compensating Reversal for Withdrawal ${params.originalTransactionNo}`,
        },
      ];

      if (assetGl) db.updateChartOfAccount(assetGl.id, { balance: financialMath.add(assetGl.balance, params.amount) });
      if (liabilityGl) db.updateChartOfAccount(liabilityGl.id, { balance: financialMath.add(liabilityGl.balance, params.amount) });
    }

    const journal: DbJournalEntry = {
      id: `jnl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      journalNo,
      transactionId: params.reversalTransactionId,
      transactionReference: params.reversalTransactionNo,
      date: params.timestamp,
      narration: `Compensating Reversal for Transaction ${params.originalTransactionNo}`,
      lines,
      totalDebit: financialMath.round2(params.amount),
      totalCredit: financialMath.round2(params.amount),
      postedBy: params.postedBy,
      status: 'POSTED',
      createdAt: params.timestamp,
    };

    return db.createJournalEntry(journal);
  }

  // ==========================================
  // 10. INTERNAL UTILITY HELPERS
  // ==========================================
  private consumeDepositBatches(accountId: string, withdrawalAmount: number): void {
    const batches = db.getDepositBatchesByAccountId(accountId).filter((b) => b.isCleared && b.remainingAmount > 0);
    let remainingToDeduct = withdrawalAmount;

    for (const batch of batches) {
      if (remainingToDeduct <= 0) break;
      const deduction = Math.min(batch.remainingAmount, remainingToDeduct);
      const newRemaining = financialMath.subtract(batch.remainingAmount, deduction);
      db.updateDepositBatch(batch.id, { remainingAmount: newRemaining });
      remainingToDeduct = financialMath.subtract(remainingToDeduct, deduction);
    }
  }

  private recordMonthlySavingsContribution(
    memberId: string,
    membershipNo: string,
    memberName: string,
    accountId: string,
    accountNo: string,
    depositAmount: number
  ): void {
    const date = new Date();
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const settings = db.getSystemSettings();
    const expectedAmount = settings.regularMinMonthlySaving || 500;

    let schedule = db.getMonthlySavingsSchedule(memberId, yearMonth);
    const nowIso = date.toISOString();

    if (!schedule) {
      const actualDeposited = financialMath.round2(depositAmount);
      const shortfall = Math.max(0, financialMath.subtract(expectedAmount, actualDeposited));
      schedule = {
        id: `mss_${memberId}_${yearMonth.replace('-', '_')}`,
        memberId,
        membershipNo,
        memberName,
        accountId,
        accountNo,
        yearMonth,
        expectedAmount,
        actualDeposited,
        shortfall,
        status: shortfall === 0 ? 'MET' : actualDeposited > 0 ? 'BELOW_MINIMUM' : 'UNPAID',
        lastDepositDate: nowIso,
        updatedAt: nowIso,
      };
    } else {
      const actualDeposited = financialMath.add(schedule.actualDeposited, depositAmount);
      const shortfall = Math.max(0, financialMath.subtract(expectedAmount, actualDeposited));
      schedule = {
        ...schedule,
        actualDeposited,
        shortfall,
        status: shortfall === 0 ? 'MET' : actualDeposited > 0 ? 'BELOW_MINIMUM' : 'UNPAID',
        lastDepositDate: nowIso,
        updatedAt: nowIso,
      };
    }

    db.saveMonthlySavingsSchedule(schedule);
  }
}

export const financialService = new FinancialService();
