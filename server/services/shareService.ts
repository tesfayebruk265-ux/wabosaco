import { db } from '../db/database';
import {
  DbShareAccount,
  DbShareTransaction,
  DbShareCertificate,
  DbSharePriceHistory,
  DbFinancialTransaction,
  DbJournalEntry,
  DbJournalEntryLine,
  DbSystemSettings,
} from '../db/schema';
import { financialMath, financialService } from './financialService';

const notificationService = {
  notifyUser(
    userIdOrMemberId: string,
    _category: string,
    title: string,
    message: string,
    metadata?: Record<string, any>
  ) {
    const member = db.getMemberById(userIdOrMemberId);
    const userId = member?.userId || userIdOrMemberId;
    db.createNotification({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      title,
      message,
      type: 'SUCCESS',
      eventType: 'MEMBERSHIP_ACTIVATED',
      isRead: false,
      metadata,
      createdAt: new Date().toISOString(),
    });
  },
};

const auditService = {
  record(params: {
    action: string;
    entity: string;
    entityId: string;
    userId: string;
    userName: string;
    details: Record<string, any>;
  }) {
    db.recordAuditLog({
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      actorId: params.userId,
      actorName: params.userName,
      actorRole: 'STAFF',
      action: params.action,
      resource: params.entity,
      resourceId: params.entityId,
      afterState: params.details,
      result: 'SUCCESS',
      ipAddress: '127.0.0.1',
      userAgent: 'Internal System Engine',
      timestamp: new Date().toISOString(),
    });
  },
};

export interface PurchaseSharesParams {
  memberId: string;
  numberOfShares: number; // Positive whole integer
  paymentMethod: 'CASH' | 'CBE_BANK' | 'TSEHAY_BANK' | 'INTERNAL_TRANSFER';
  bankReferenceNo?: string;
  narration?: string;
  idempotencyKey?: string;
  receiptUrl?: string;
  performedById: string;
  performedByName: string;
  performedByRole?: string;
}

export interface ConvertSavingsToSharesParams {
  memberId: string;
  amountToConvert: number; // Requested conversion amount in ETB
  narration?: string;
  idempotencyKey?: string;
  performedById: string;
  performedByName: string;
  performedByRole?: string;
}

export interface ReverseShareTransactionParams {
  transactionId: string;
  reason: string;
  performedById: string;
  performedByName: string;
}

export interface ShareEligibilityResult {
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

export class ShareService {
  /**
   * Retrieves or initializes a member's share account.
   */
  public getOrCreateShareAccount(memberId: string): DbShareAccount {
    let shareAccount = db.getShareAccountByMemberId(memberId);
    if (!shareAccount) {
      const member = db.getMemberById(memberId);
      if (!member) {
        throw new Error(`Member not found: ${memberId}`);
      }

      const settings = db.getSystemSettings();
      const accountNo = db.generateShareAccountNo(member.membershipNo);
      const now = new Date().toISOString();

      shareAccount = {
        id: `acc_shr_${member.id.replace('mbr_', '')}`,
        accountNo,
        memberId: member.id,
        membershipNo: member.membershipNo,
        memberName: member.fullName,
        numberOfShares: 0,
        sharePrice: settings.sharePrice || 500.0,
        totalShareValue: 0.0,
        status: 'ACTIVE',
        openingDate: member.membershipDate || now,
        createdAt: now,
        updatedAt: now,
      };

      db.createShareAccount(shareAccount);
    }
    return shareAccount;
  }

  /**
   * Evaluates member's share eligibility and compliance status.
   */
  public getMemberEligibility(memberId: string): ShareEligibilityResult {
    const member = db.getMemberById(memberId);
    if (!member) {
      throw new Error(`Member not found: ${memberId}`);
    }

    const settings = db.getSystemSettings();
    const sharePrice = settings.sharePrice || 500.0;
    const requiredMinShares = settings.minRequiredShares || 5;
    const minShareValue = settings.minShareValue || requiredMinShares * sharePrice;

    const shareAccount = this.getOrCreateShareAccount(member.id);
    const currentShares = shareAccount.numberOfShares || 0;
    const currentShareValue = financialMath.multiply(currentShares, sharePrice);

    const isMinimumSatisfied = currentShares >= requiredMinShares;
    const remainingShares = isMinimumSatisfied ? 0 : requiredMinShares - currentShares;
    const remainingValue = financialMath.multiply(remainingShares, sharePrice);

    // Check Voluntary savings account for conversion potential
    const volAccount = db.getSavingAccounts().find(
      (a) => a.memberId === member.id && a.productCode === 'VOLUNTARY' && a.status === 'ACTIVE'
    );

    const voluntaryAvailable = volAccount ? volAccount.balance : 0;
    const possibleSharesFromVoluntary = Math.floor(voluntaryAvailable / sharePrice);
    const possibleSharesCost = financialMath.multiply(possibleSharesFromVoluntary, sharePrice);

    return {
      memberId: member.id,
      membershipNo: member.membershipNo,
      memberName: member.fullName,
      shareAccountId: shareAccount.id,
      shareAccountNo: shareAccount.accountNo,
      currentShares,
      currentShareValue,
      sharePrice,
      requiredMinimumShares: requiredMinShares,
      minShareValue,
      isMinimumSatisfied,
      remainingSharesToMinimum: remainingShares,
      remainingValueToMinimum: remainingValue,
      canApplyForLoan: isMinimumSatisfied,
      votingEligibility: isMinimumSatisfied,
      voluntaryAccountId: volAccount?.id,
      voluntaryAccountNo: volAccount?.accountNo,
      voluntaryAvailableBalance: voluntaryAvailable,
      possibleSharesFromVoluntary,
      possibleSharesCost,
    };
  }

  /**
   * Purchase new shares (Cash / CBE Bank / Tsehay Bank / Internal Transfer).
   */
  public purchaseShares(params: PurchaseSharesParams): {
    shareTransaction: DbShareTransaction;
    shareAccount: DbShareAccount;
    certificate: DbShareCertificate;
    financialTransaction: DbFinancialTransaction;
    journalEntry: DbJournalEntry;
  } {
    // 1. Idempotency check
    if (params.idempotencyKey) {
      const existing = db.getShareTransactionByIdempotencyKey(params.idempotencyKey);
      if (existing) {
        const acc = db.getShareAccountById(existing.shareAccountId)!;
        const cert = db.getShareCertificateByMemberId(existing.memberId)!;
        const finTx = db.getFinancialTransactionById(existing.financialTransactionId || '')!;
        const jnl = db.getJournalEntries().find((j) => j.id === existing.journalEntryId)!;
        return {
          shareTransaction: existing,
          shareAccount: acc,
          certificate: cert,
          financialTransaction: finTx,
          journalEntry: jnl,
        };
      }
    }

    // 2. Validate input
    const member = db.getMemberById(params.memberId);
    if (!member) {
      throw new Error(`Member with ID ${params.memberId} not found.`);
    }

    const numShares = Math.floor(Number(params.numberOfShares));
    if (isNaN(numShares) || numShares < 1) {
      throw new Error('Number of shares must be a positive whole integer (minimum 1 share).');
    }

    const settings = db.getSystemSettings();
    const unitPrice = settings.sharePrice || 500.0;
    const totalAmount = financialMath.multiply(numShares, unitPrice);

    if (totalAmount <= 0) {
      throw new Error('Total share purchase amount must be greater than zero.');
    }

    const shareAccount = this.getOrCreateShareAccount(member.id);
    if (shareAccount.status !== 'ACTIVE') {
      throw new Error(`Cannot purchase shares: Share account status is ${shareAccount.status}`);
    }

    const now = new Date().toISOString();
    const sharesBefore = shareAccount.numberOfShares;
    const sharesAfter = sharesBefore + numShares;
    const valueBefore = shareAccount.totalShareValue;
    const valueAfter = financialMath.add(valueBefore, totalAmount);

    // 3. Central Financial Transaction & General Ledger Journal
    let cashOrBankGlCode = '1001-CSH';
    let glAccountName = 'Cash on Hand (Vault / Till)';
    if (params.paymentMethod === 'CBE_BANK') {
      cashOrBankGlCode = '1010-CBE';
      glAccountName = 'Commercial Bank of Ethiopia (Operating)';
    } else if (params.paymentMethod === 'TSEHAY_BANK') {
      cashOrBankGlCode = '1020-TSH';
      glAccountName = 'Tsehay Bank (Operating)';
    } else if (params.paymentMethod === 'INTERNAL_TRANSFER') {
      cashOrBankGlCode = '1001-CSH';
    }

    // Debit Asset account, Credit Share Capital account 3010-SHR
    const coaList = db.getChartOfAccounts();
    const assetAccount = coaList.find((a) => a.accountCode === cashOrBankGlCode);
    const shareCapitalAccount = coaList.find((a) => a.accountCode === '3010-SHR');

    if (assetAccount) {
      db.updateChartOfAccount(assetAccount.id, {
        balance: financialMath.add(assetAccount.balance, totalAmount),
      });
    }

    if (shareCapitalAccount) {
      db.updateChartOfAccount(shareCapitalAccount.id, {
        balance: financialMath.add(shareCapitalAccount.balance, totalAmount),
      });
    }

    // 4. Create Financial Transaction
    const transactionNo = db.getNextTransactionNo();
    const finTx: DbFinancialTransaction = {
      id: `tx_fin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      transactionNo,
      memberId: member.id,
      membershipNo: member.membershipNo,
      memberName: member.fullName,
      accountId: shareAccount.id,
      accountNo: shareAccount.accountNo,
      productCode: 'SHARE' as any,
      type: 'DEPOSIT',
      amount: totalAmount,
      debitAmount: null,
      creditAmount: totalAmount,
      balanceBefore: valueBefore,
      balanceAfter: valueAfter,
      paymentChannel: (params.paymentMethod === 'INTERNAL_TRANSFER' ? 'INTERNAL_TRANSFER' : params.paymentMethod) as any,
      bankReferenceNo: params.bankReferenceNo,
      narration: params.narration || `Share Capital Purchase (${numShares} shares @ ${unitPrice} ETB)`,
      status: 'POSTED',
      idempotencyKey: params.idempotencyKey,
      requiresApproval: false,
      createdById: params.performedById,
      createdByName: params.performedByName,
      timestamp: now,
      createdAt: now,
    };
    db.createFinancialTransaction(finTx);

    // 5. Create GL Journal Entry
    const journalNo = db.getNextJournalNo();
    const journalLines: DbJournalEntryLine[] = [
      {
        id: `jnl_line_${Date.now()}_1`,
        accountId: assetAccount?.id || 'coa_cash',
        accountCode: cashOrBankGlCode,
        accountName: glAccountName,
        debit: totalAmount,
        credit: 0,
        description: `Cash/Bank received for ${numShares} shares purchase by ${member.membershipNo}`,
      },
      {
        id: `jnl_line_${Date.now()}_2`,
        accountId: shareCapitalAccount?.id || 'coa_share_capital',
        accountCode: '3010-SHR',
        accountName: 'Member Share Capital (Paid-Up)',
        debit: 0,
        credit: totalAmount,
        description: `Member Share Capital credited (${numShares} shares @ ${unitPrice} ETB) - ${member.membershipNo}`,
      },
    ];

    const journalEntry: DbJournalEntry = {
      id: `jnl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      journalNo,
      transactionId: finTx.id,
      transactionReference: finTx.transactionNo,
      date: now.split('T')[0],
      narration: `Share capital subscription: ${member.fullName} (${member.membershipNo}) - ${numShares} Shares`,
      lines: journalLines,
      totalDebit: totalAmount,
      totalCredit: totalAmount,
      postedBy: params.performedByName,
      status: 'POSTED',
      createdAt: now,
    };
    db.createJournalEntry(journalEntry);

    // 6. Update Share Account
    const updatedShareAccount = db.updateShareAccount(shareAccount.id, {
      numberOfShares: sharesAfter,
      totalShareValue: valueAfter,
      sharePrice: unitPrice,
      lastTransactionDate: now,
    })!;

    // 7. Issue or Update Share Certificate
    // Supersede older active certificates
    const existingCerts = db.getShareCertificates(member.id);
    existingCerts.forEach((c) => {
      if (c.status === 'ACTIVE') {
        db.updateShareCertificate(c.id, { status: 'SUPERSEDED' });
      }
    });

    const certificateNumber = db.getNextCertificateNo();
    const certificate: DbShareCertificate = {
      id: `cert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      certificateNumber,
      shareAccountId: shareAccount.id,
      memberId: member.id,
      membershipNo: member.membershipNo,
      memberName: member.fullName,
      sharesIssued: sharesAfter,
      shareValue: valueAfter,
      parValuePerShare: unitPrice,
      issueDate: now,
      status: 'ACTIVE',
      issuedBy: params.performedByName,
      createdAt: now,
    };
    db.createShareCertificate(certificate);

    // Link certificate to share account
    db.updateShareAccount(shareAccount.id, { certificateNumber });

    // 8. Record Share Transaction
    const shareTxNo = db.getNextShareTransactionNo();
    const shareTx: DbShareTransaction = {
      id: `tx_shr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      transactionNo: shareTxNo,
      shareAccountId: shareAccount.id,
      shareAccountNo: shareAccount.accountNo,
      memberId: member.id,
      membershipNo: member.membershipNo,
      memberName: member.fullName,
      type: 'SHARE_PURCHASE',
      numberOfShares: numShares,
      unitPrice,
      totalAmount,
      sharesBefore,
      sharesAfter,
      valueBefore,
      valueAfter,
      paymentMethod: params.paymentMethod,
      bankReferenceNo: params.bankReferenceNo,
      journalEntryId: journalEntry.id,
      financialTransactionId: finTx.id,
      narration: params.narration || `Acquired ${numShares} equity shares @ ${unitPrice} ETB`,
      status: 'POSTED',
      idempotencyKey: params.idempotencyKey,
      receiptUrl: params.receiptUrl,
      createdById: params.performedById,
      createdByName: params.performedByName,
      timestamp: now,
      createdAt: now,
    };
    db.createShareTransaction(shareTx);

    // 9. Notifications & Audit
    notificationService.notifyUser(
      member.id,
      'FINANCIAL_TRANSACTION',
      'Share Purchase Successful',
      `You have successfully purchased ${numShares} share(s) for ${totalAmount.toLocaleString()} ETB. Your total shares are now ${sharesAfter} (${valueAfter.toLocaleString()} ETB). Certificate #${certificateNumber} has been updated.`,
      {
        transactionNo: shareTx.transactionNo,
        numberOfShares: numShares,
        totalAmount,
        totalShares: sharesAfter,
        certificateNumber,
      }
    );

    auditService.record({
      action: 'SHARE_PURCHASE',
      entity: 'SHARE_ACCOUNT',
      entityId: shareAccount.id,
      userId: params.performedById,
      userName: params.performedByName,
      details: {
        memberId: member.id,
        membershipNo: member.membershipNo,
        numberOfShares: numShares,
        unitPrice,
        totalAmount,
        sharesAfter,
        valueAfter,
        paymentMethod: params.paymentMethod,
        transactionNo: shareTx.transactionNo,
        journalNo: journalEntry.journalNo,
      },
    });

    return {
      shareTransaction: shareTx,
      shareAccount: updatedShareAccount,
      certificate,
      financialTransaction: finTx,
      journalEntry,
    };
  }

  /**
   * Convert Voluntary Savings to Equity Shares.
   * Enforces whole-share conversion rule: only whole-share value is converted,
   * leaving any fractional remainder safe and untouched in voluntary savings.
   */
  public convertVoluntarySavingsToShares(params: ConvertSavingsToSharesParams): {
    shareTransaction: DbShareTransaction;
    shareAccount: DbShareAccount;
    certificate: DbShareCertificate;
    savingsWithdrawalTx: DbFinancialTransaction;
    journalEntry: DbJournalEntry;
    sharesPurchased: number;
    amountConverted: number;
    remainderKeptInSavings: number;
    newSavingsBalance: number;
  } {
    // 1. Idempotency check
    if (params.idempotencyKey) {
      const existing = db.getShareTransactionByIdempotencyKey(params.idempotencyKey);
      if (existing) {
        const acc = db.getShareAccountById(existing.shareAccountId)!;
        const cert = db.getShareCertificateByMemberId(existing.memberId)!;
        const finTx = db.getFinancialTransactionById(existing.financialTransactionId || '')!;
        const jnl = db.getJournalEntries().find((j) => j.id === existing.journalEntryId)!;
        return {
          shareTransaction: existing,
          shareAccount: acc,
          certificate: cert,
          savingsWithdrawalTx: finTx,
          journalEntry: jnl,
          sharesPurchased: existing.numberOfShares,
          amountConverted: existing.totalAmount,
          remainderKeptInSavings: 0,
          newSavingsBalance: 0,
        };
      }
    }

    // 2. Validate member & voluntary account
    const member = db.getMemberById(params.memberId);
    if (!member) {
      throw new Error(`Member with ID ${params.memberId} not found.`);
    }

    const volAccount = db.getSavingAccounts().find(
      (a) => a.memberId === member.id && a.productCode === 'VOLUNTARY' && a.status === 'ACTIVE'
    );

    if (!volAccount) {
      throw new Error('No active Voluntary Savings account found for this member to convert from.');
    }

    const requestedAmount = Number(params.amountToConvert);
    if (isNaN(requestedAmount) || requestedAmount <= 0) {
      throw new Error('Conversion amount must be a positive number.');
    }

    if (volAccount.balance < requestedAmount) {
      throw new Error(
        `Insufficient balance in Voluntary Savings. Available balance: ${volAccount.balance.toLocaleString()} ETB, Requested: ${requestedAmount.toLocaleString()} ETB`
      );
    }

    const settings = db.getSystemSettings();
    const sharePrice = settings.sharePrice || 500.0;

    // 3. Whole-share conversion mathematics
    const numberOfShares = Math.floor(requestedAmount / sharePrice);
    if (numberOfShares < 1) {
      throw new Error(
        `Requested amount (${requestedAmount} ETB) is less than the price of a single share (${sharePrice} ETB). Minimum conversion is 1 whole share (${sharePrice} ETB).`
      );
    }

    const amountToDeduct = financialMath.multiply(numberOfShares, sharePrice);
    const remainder = financialMath.subtract(requestedAmount, amountToDeduct);

    const shareAccount = this.getOrCreateShareAccount(member.id);
    if (shareAccount.status !== 'ACTIVE') {
      throw new Error(`Cannot convert shares: Share account status is ${shareAccount.status}`);
    }

    const now = new Date().toISOString();
    const savingsBalBefore = volAccount.balance;
    const savingsBalAfter = financialMath.subtract(savingsBalBefore, amountToDeduct);

    const sharesBefore = shareAccount.numberOfShares;
    const sharesAfter = sharesBefore + numberOfShares;
    const shareValBefore = shareAccount.totalShareValue;
    const shareValAfter = financialMath.add(shareValBefore, amountToDeduct);

    // 4. Update Voluntary Savings Account
    db.updateSavingAccount(volAccount.id, {
      balance: savingsBalAfter,
    });

    // 5. Update Chart of Accounts (Debit: 2020-VOL Liability, Credit: 3010-SHR Equity)
    const coaList = db.getChartOfAccounts();
    const volLiabilityAccount = coaList.find((a) => a.accountCode === '2020-VOL');
    const shareCapitalAccount = coaList.find((a) => a.accountCode === '3010-SHR');

    if (volLiabilityAccount) {
      db.updateChartOfAccount(volLiabilityAccount.id, {
        balance: financialMath.subtract(volLiabilityAccount.balance, amountToDeduct),
      });
    }

    if (shareCapitalAccount) {
      db.updateChartOfAccount(shareCapitalAccount.id, {
        balance: financialMath.add(shareCapitalAccount.balance, amountToDeduct),
      });
    }

    // 6. Record Financial Transaction (Withdrawal/Transfer on Voluntary Savings)
    const finTxNo = db.getNextTransactionNo();
    const savingsWithdrawalTx: DbFinancialTransaction = {
      id: `tx_fin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      transactionNo: finTxNo,
      memberId: member.id,
      membershipNo: member.membershipNo,
      memberName: member.fullName,
      accountId: volAccount.id,
      accountNo: volAccount.accountNo,
      productCode: 'VOLUNTARY',
      type: 'WITHDRAWAL',
      amount: amountToDeduct,
      debitAmount: amountToDeduct,
      creditAmount: null,
      balanceBefore: savingsBalBefore,
      balanceAfter: savingsBalAfter,
      paymentChannel: 'INTERNAL_TRANSFER',
      narration:
        params.narration ||
        `Transfer to Share Capital (${numberOfShares} Shares @ ${sharePrice} ETB) [Acc ${shareAccount.accountNo}]`,
      status: 'POSTED',
      idempotencyKey: params.idempotencyKey,
      requiresApproval: false,
      createdById: params.performedById,
      createdByName: params.performedByName,
      timestamp: now,
      createdAt: now,
    };
    db.createFinancialTransaction(savingsWithdrawalTx);

    // 7. General Ledger Journal Entry (Debit 2020-VOL, Credit 3010-SHR)
    const journalNo = db.getNextJournalNo();
    const journalLines: DbJournalEntryLine[] = [
      {
        id: `jnl_line_${Date.now()}_1`,
        accountId: volLiabilityAccount?.id || 'coa_vol_savings',
        accountCode: '2020-VOL',
        accountName: 'Voluntary Savings Deposits (Demand)',
        debit: amountToDeduct,
        credit: 0,
        description: `Voluntary savings transferred to share capital (${member.membershipNo} - ${volAccount.accountNo})`,
      },
      {
        id: `jnl_line_${Date.now()}_2`,
        accountId: shareCapitalAccount?.id || 'coa_share_capital',
        accountCode: '3010-SHR',
        accountName: 'Member Share Capital (Paid-Up)',
        debit: 0,
        credit: amountToDeduct,
        description: `Converted ${numberOfShares} equity shares for member ${member.membershipNo}`,
      },
    ];

    const journalEntry: DbJournalEntry = {
      id: `jnl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      journalNo,
      transactionId: savingsWithdrawalTx.id,
      transactionReference: savingsWithdrawalTx.transactionNo,
      date: now.split('T')[0],
      narration: `Voluntary savings conversion to share capital: ${member.fullName} (${member.membershipNo}) - ${numberOfShares} Shares`,
      lines: journalLines,
      totalDebit: amountToDeduct,
      totalCredit: amountToDeduct,
      postedBy: params.performedByName,
      status: 'POSTED',
      createdAt: now,
    };
    db.createJournalEntry(journalEntry);

    // 8. Update Share Account
    const updatedShareAccount = db.updateShareAccount(shareAccount.id, {
      numberOfShares: sharesAfter,
      totalShareValue: shareValAfter,
      sharePrice,
      lastTransactionDate: now,
    })!;

    // 9. Issue / Supersede Share Certificate
    const existingCerts = db.getShareCertificates(member.id);
    existingCerts.forEach((c) => {
      if (c.status === 'ACTIVE') {
        db.updateShareCertificate(c.id, { status: 'SUPERSEDED' });
      }
    });

    const certificateNumber = db.getNextCertificateNo();
    const certificate: DbShareCertificate = {
      id: `cert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      certificateNumber,
      shareAccountId: shareAccount.id,
      memberId: member.id,
      membershipNo: member.membershipNo,
      memberName: member.fullName,
      sharesIssued: sharesAfter,
      shareValue: shareValAfter,
      parValuePerShare: sharePrice,
      issueDate: now,
      status: 'ACTIVE',
      issuedBy: params.performedByName,
      createdAt: now,
    };
    db.createShareCertificate(certificate);
    db.updateShareAccount(shareAccount.id, { certificateNumber });

    // 10. Record Share Transaction
    const shareTxNo = db.getNextShareTransactionNo();
    const shareTx: DbShareTransaction = {
      id: `tx_shr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      transactionNo: shareTxNo,
      shareAccountId: shareAccount.id,
      shareAccountNo: shareAccount.accountNo,
      memberId: member.id,
      membershipNo: member.membershipNo,
      memberName: member.fullName,
      type: 'SHARE_CONVERSION',
      numberOfShares,
      unitPrice: sharePrice,
      totalAmount: amountToDeduct,
      sharesBefore,
      sharesAfter,
      valueBefore: shareValBefore,
      valueAfter: shareValAfter,
      paymentMethod: 'VOLUNTARY_SAVINGS_CONVERSION',
      sourceSavingAccountId: volAccount.id,
      sourceSavingAccountNo: volAccount.accountNo,
      journalEntryId: journalEntry.id,
      financialTransactionId: savingsWithdrawalTx.id,
      narration:
        params.narration ||
        `Converted ${amountToDeduct.toLocaleString()} ETB from Voluntary Savings (${volAccount.accountNo}) into ${numberOfShares} Shares`,
      status: 'POSTED',
      idempotencyKey: params.idempotencyKey,
      createdById: params.performedById,
      createdByName: params.performedByName,
      timestamp: now,
      createdAt: now,
    };
    db.createShareTransaction(shareTx);

    // 11. Dispatch Notification & Audit Log
    const remainderNote = remainder > 0 ? ` (Remaining ${remainder.toLocaleString()} ETB kept in voluntary savings)` : '';
    notificationService.notifyUser(
      member.id,
      'FINANCIAL_TRANSACTION',
      'Voluntary Savings Converted to Shares',
      `Converted ${amountToDeduct.toLocaleString()} ETB into ${numberOfShares} equity shares.${remainderNote} New total shares: ${sharesAfter} (${shareValAfter.toLocaleString()} ETB). Certificate #${certificateNumber} has been updated.`,
      {
        transactionNo: shareTx.transactionNo,
        numberOfShares,
        amountConverted: amountToDeduct,
        totalShares: sharesAfter,
        certificateNumber,
        newSavingsBalance: savingsBalAfter,
      }
    );

    auditService.record({
      action: 'SHARE_CONVERSION',
      entity: 'SHARE_ACCOUNT',
      entityId: shareAccount.id,
      userId: params.performedById,
      userName: params.performedByName,
      details: {
        memberId: member.id,
        membershipNo: member.membershipNo,
        voluntaryAccountId: volAccount.id,
        voluntaryAccountNo: volAccount.accountNo,
        numberOfShares,
        unitPrice: sharePrice,
        amountConverted: amountToDeduct,
        remainderKeptInSavings: remainder,
        sharesAfter,
        valueAfter: shareValAfter,
        transactionNo: shareTx.transactionNo,
        journalNo: journalEntry.journalNo,
      },
    });

    return {
      shareTransaction: shareTx,
      shareAccount: updatedShareAccount,
      certificate,
      savingsWithdrawalTx,
      journalEntry,
      sharesPurchased: numberOfShares,
      amountConverted: amountToDeduct,
      remainderKeptInSavings: remainder,
      newSavingsBalance: savingsBalAfter,
    };
  }

  /**
   * Reverse an erroneous share transaction (Manager / Admin governance).
   */
  public reverseShareTransaction(params: ReverseShareTransactionParams): {
    reversalTransaction: DbShareTransaction;
    shareAccount: DbShareAccount;
    reversalJournal: DbJournalEntry;
  } {
    const originalTx = db.getShareTransactionById(params.transactionId);
    if (!originalTx) {
      throw new Error(`Share transaction with ID ${params.transactionId} not found.`);
    }

    if (originalTx.status === 'REVERSED') {
      throw new Error('This transaction has already been reversed.');
    }

    const shareAccount = db.getShareAccountById(originalTx.shareAccountId);
    if (!shareAccount) {
      throw new Error(`Share account ${originalTx.shareAccountId} not found.`);
    }

    if (shareAccount.numberOfShares < originalTx.numberOfShares) {
      throw new Error(
        `Cannot reverse transaction: Member's current shares (${shareAccount.numberOfShares}) are lower than the transaction amount (${originalTx.numberOfShares}).`
      );
    }

    const now = new Date().toISOString();
    const sharesBefore = shareAccount.numberOfShares;
    const sharesAfter = sharesBefore - originalTx.numberOfShares;
    const valueBefore = shareAccount.totalShareValue;
    const valueAfter = financialMath.subtract(valueBefore, originalTx.totalAmount);

    // 1. Mark original transaction as reversed
    db.updateShareTransaction(originalTx.id, { status: 'REVERSED' });

    // 2. Adjust GL Chart of Accounts
    const coaList = db.getChartOfAccounts();
    const shareCapitalAccount = coaList.find((a) => a.accountCode === '3010-SHR');
    if (shareCapitalAccount) {
      db.updateChartOfAccount(shareCapitalAccount.id, {
        balance: financialMath.subtract(shareCapitalAccount.balance, originalTx.totalAmount),
      });
    }

    let contraGlCode = '1001-CSH';
    let contraName = 'Cash on Hand (Vault / Till)';
    if (originalTx.paymentMethod === 'CBE_BANK') {
      contraGlCode = '1010-CBE';
      contraName = 'Commercial Bank of Ethiopia';
      const cbe = coaList.find((a) => a.accountCode === '1010-CBE');
      if (cbe) db.updateChartOfAccount(cbe.id, { balance: financialMath.subtract(cbe.balance, originalTx.totalAmount) });
    } else if (originalTx.paymentMethod === 'TSEHAY_BANK') {
      contraGlCode = '1020-TSH';
      contraName = 'Tsehay Bank';
      const tsh = coaList.find((a) => a.accountCode === '1020-TSH');
      if (tsh) db.updateChartOfAccount(tsh.id, { balance: financialMath.subtract(tsh.balance, originalTx.totalAmount) });
    } else if (originalTx.paymentMethod === 'VOLUNTARY_SAVINGS_CONVERSION') {
      contraGlCode = '2020-VOL';
      contraName = 'Voluntary Savings Deposits (Demand)';
      const vol = coaList.find((a) => a.accountCode === '2020-VOL');
      if (vol) db.updateChartOfAccount(vol.id, { balance: financialMath.add(vol.balance, originalTx.totalAmount) });

      // Restore member voluntary account balance
      if (originalTx.sourceSavingAccountId) {
        const savAcc = db.getSavingAccountById(originalTx.sourceSavingAccountId);
        if (savAcc) {
          db.updateSavingAccount(savAcc.id, {
            balance: financialMath.add(savAcc.balance, originalTx.totalAmount),
          });
        }
      }
    } else {
      const csh = coaList.find((a) => a.accountCode === '1001-CSH');
      if (csh) db.updateChartOfAccount(csh.id, { balance: financialMath.subtract(csh.balance, originalTx.totalAmount) });
    }

    // 3. Create Compensating GL Journal Entry
    const journalNo = db.getNextJournalNo();
    const reversalJournal: DbJournalEntry = {
      id: `jnl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      journalNo,
      transactionId: originalTx.id,
      transactionReference: originalTx.transactionNo,
      date: now.split('T')[0],
      narration: `REVERSAL of Share Tx ${originalTx.transactionNo} - Reason: ${params.reason}`,
      lines: [
        {
          id: `jnl_line_${Date.now()}_1`,
          accountId: shareCapitalAccount?.id || 'coa_share_capital',
          accountCode: '3010-SHR',
          accountName: 'Member Share Capital (Paid-Up)',
          debit: originalTx.totalAmount,
          credit: 0,
          description: `Debit Share Capital to reverse Tx ${originalTx.transactionNo}`,
        },
        {
          id: `jnl_line_${Date.now()}_2`,
          accountId: 'coa_contra',
          accountCode: contraGlCode,
          accountName: contraName,
          debit: 0,
          credit: originalTx.totalAmount,
          description: `Credit contra account on reversal of ${originalTx.transactionNo}`,
        },
      ],
      totalDebit: originalTx.totalAmount,
      totalCredit: originalTx.totalAmount,
      postedBy: params.performedByName,
      status: 'REVERSED',
      createdAt: now,
    };
    db.createJournalEntry(reversalJournal);

    // 4. Update Share Account
    const updatedShareAccount = db.updateShareAccount(shareAccount.id, {
      numberOfShares: sharesAfter,
      totalShareValue: valueAfter,
      lastTransactionDate: now,
    })!;

    // 5. Update / Reissue Certificate
    const cert = db.getShareCertificateByMemberId(originalTx.memberId);
    if (cert) {
      db.updateShareCertificate(cert.id, {
        sharesIssued: sharesAfter,
        shareValue: valueAfter,
      });
    }

    // 6. Create Reversal Transaction record
    const reversalTxNo = db.getNextShareTransactionNo();
    const reversalTx: DbShareTransaction = {
      id: `tx_shr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      transactionNo: reversalTxNo,
      shareAccountId: shareAccount.id,
      shareAccountNo: shareAccount.accountNo,
      memberId: originalTx.memberId,
      membershipNo: originalTx.membershipNo,
      memberName: originalTx.memberName,
      type: 'SHARE_REVERSAL',
      numberOfShares: originalTx.numberOfShares,
      unitPrice: originalTx.unitPrice,
      totalAmount: originalTx.totalAmount,
      sharesBefore,
      sharesAfter,
      valueBefore,
      valueAfter,
      paymentMethod: originalTx.paymentMethod,
      narration: `REVERSAL of ${originalTx.transactionNo}: ${params.reason}`,
      status: 'POSTED',
      createdById: params.performedById,
      createdByName: params.performedByName,
      timestamp: now,
      createdAt: now,
    };
    db.createShareTransaction(reversalTx);

    // 7. Audit & Notify
    auditService.record({
      action: 'TRANSACTION_REVERSAL',
      entity: 'SHARE_ACCOUNT',
      entityId: shareAccount.id,
      userId: params.performedById,
      userName: params.performedByName,
      details: {
        originalTransactionId: originalTx.id,
        originalTransactionNo: originalTx.transactionNo,
        reversalTransactionNo: reversalTx.transactionNo,
        reason: params.reason,
        numberOfShares: originalTx.numberOfShares,
        amount: originalTx.totalAmount,
        sharesAfter,
      },
    });

    notificationService.notifyUser(
      originalTx.memberId,
      'SECURITY_ALERT',
      'Share Transaction Reversed',
      `Share transaction ${originalTx.transactionNo} for ${originalTx.numberOfShares} shares has been reversed. Adjusted balance: ${sharesAfter} shares (${valueAfter.toLocaleString()} ETB). Reason: ${params.reason}`,
      {
        transactionNo: reversalTx.transactionNo,
        originalTransactionNo: originalTx.transactionNo,
        reason: params.reason,
      }
    );

    return {
      reversalTransaction: reversalTx,
      shareAccount: updatedShareAccount,
      reversalJournal,
    };
  }

  /**
   * Filter and list all share accounts.
   */
  public getShareAccounts(filters: {
    query?: string;
    status?: string;
    complianceStatus?: 'ALL' | 'COMPLIANT' | 'NON_COMPLIANT';
    page?: number;
    limit?: number;
  }) {
    const allMembers = db.getMembers();
    const settings = db.getSystemSettings();
    const minRequiredShares = settings.minRequiredShares || 5;

    // Ensure all active members have share accounts
    allMembers.forEach((m) => {
      if (m.status === 'ACTIVE') {
        this.getOrCreateShareAccount(m.id);
      }
    });

    let accounts = db.getShareAccounts();

    if (filters.status && filters.status !== 'ALL') {
      accounts = accounts.filter((a) => a.status === filters.status);
    }

    if (filters.complianceStatus === 'COMPLIANT') {
      accounts = accounts.filter((a) => (a.numberOfShares || 0) >= minRequiredShares);
    } else if (filters.complianceStatus === 'NON_COMPLIANT') {
      accounts = accounts.filter((a) => (a.numberOfShares || 0) < minRequiredShares);
    }

    if (filters.query) {
      const q = filters.query.toLowerCase().trim();
      accounts = accounts.filter(
        (a) =>
          a.accountNo.toLowerCase().includes(q) ||
          a.membershipNo.toLowerCase().includes(q) ||
          a.memberName.toLowerCase().includes(q)
      );
    }

    const total = accounts.length;
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Number(filters.limit) || 20);
    const offset = (page - 1) * limit;

    const data = accounts.slice(offset, offset + limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      minRequiredShares,
      sharePrice: settings.sharePrice || 500.0,
    };
  }

  /**
   * Retrieves single share account details with certificate and history.
   */
  public getShareAccountDetails(idOrMemberId: string) {
    let account = db.getShareAccountById(idOrMemberId);
    if (!account) {
      account = db.getShareAccountByMemberId(idOrMemberId);
    }

    if (!account) {
      const member = db.getMemberById(idOrMemberId);
      if (member) {
        account = this.getOrCreateShareAccount(member.id);
      } else {
        throw new Error(`Share account not found for: ${idOrMemberId}`);
      }
    }

    const member = db.getMemberById(account.memberId);
    const certificate = db.getShareCertificateByMemberId(account.memberId);
    const transactions = db.getShareTransactionsByAccountId(account.id).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const eligibility = this.getMemberEligibility(account.memberId);

    return {
      account,
      member,
      certificate,
      transactions,
      eligibility,
    };
  }

  /**
   * Retrieves share transactions with advanced filtering.
   */
  public getShareTransactions(filters: {
    memberId?: string;
    shareAccountId?: string;
    type?: string;
    paymentMethod?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    let txs = db.getShareTransactions();

    if (filters.memberId) {
      txs = txs.filter((t) => t.memberId === filters.memberId || t.membershipNo === filters.memberId);
    }

    if (filters.shareAccountId) {
      txs = txs.filter((t) => t.shareAccountId === filters.shareAccountId || t.shareAccountNo === filters.shareAccountId);
    }

    if (filters.type && filters.type !== 'ALL') {
      txs = txs.filter((t) => t.type === filters.type);
    }

    if (filters.paymentMethod && filters.paymentMethod !== 'ALL') {
      txs = txs.filter((t) => t.paymentMethod === filters.paymentMethod);
    }

    if (filters.status && filters.status !== 'ALL') {
      txs = txs.filter((t) => t.status === filters.status);
    }

    if (filters.startDate) {
      const start = new Date(filters.startDate).getTime();
      txs = txs.filter((t) => new Date(t.timestamp).getTime() >= start);
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate).getTime() + 86400000;
      txs = txs.filter((t) => new Date(t.timestamp).getTime() <= end);
    }

    txs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const total = txs.length;
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Number(filters.limit) || 20);
    const offset = (page - 1) * limit;

    const data = txs.slice(offset, offset + limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Aggregated Share Capital & Compliance Statistics.
   */
  public getShareStatistics() {
    const allMembers = db.getMembers();
    const settings = db.getSystemSettings();
    const minRequiredShares = settings.minRequiredShares || 5;
    const sharePrice = settings.sharePrice || 500.0;

    // Ensure accounts initialized
    allMembers.forEach((m) => {
      if (m.status === 'ACTIVE') {
        this.getOrCreateShareAccount(m.id);
      }
    });

    const accounts = db.getShareAccounts();
    const totalAccounts = accounts.length;

    let totalShares = 0;
    let totalShareCapital = 0;
    let compliantCount = 0;
    let nonCompliantCount = 0;
    let maxShares = 0;

    const tiers = {
      tier1_5: 0,
      tier6_20: 0,
      tier21_50: 0,
      tier51_100: 0,
      tier100Plus: 0,
      zeroShares: 0,
    };

    accounts.forEach((a) => {
      const sh = a.numberOfShares || 0;
      totalShares += sh;
      totalShareCapital = financialMath.add(totalShareCapital, a.totalShareValue || 0);

      if (sh >= minRequiredShares) {
        compliantCount++;
      } else {
        nonCompliantCount++;
      }

      if (sh > maxShares) maxShares = sh;

      if (sh === 0) tiers.zeroShares++;
      else if (sh <= 5) tiers.tier1_5++;
      else if (sh <= 20) tiers.tier6_20++;
      else if (sh <= 50) tiers.tier21_50++;
      else if (sh <= 100) tiers.tier51_100++;
      else tiers.tier100Plus++;
    });

    const averageShares = totalAccounts > 0 ? Number((totalShares / totalAccounts).toFixed(1)) : 0;
    const averageCapital = totalAccounts > 0 ? Number((totalShareCapital / totalAccounts).toFixed(2)) : 0;
    const complianceRate = totalAccounts > 0 ? Number(((compliantCount / totalAccounts) * 100).toFixed(1)) : 0;

    const txs = db.getShareTransactions();
    const totalPurchasesCount = txs.filter((t) => t.type === 'SHARE_PURCHASE' && t.status === 'POSTED').length;
    const totalConversionsCount = txs.filter((t) => t.type === 'SHARE_CONVERSION' && t.status === 'POSTED').length;
    const totalConversionVolume = txs
      .filter((t) => t.type === 'SHARE_CONVERSION' && t.status === 'POSTED')
      .reduce((sum, t) => sum + t.totalAmount, 0);

    return {
      totalShares,
      totalShareCapital,
      totalAccounts,
      compliantCount,
      nonCompliantCount,
      complianceRate,
      averageShares,
      averageCapital,
      maxShares,
      minRequiredShares,
      sharePrice,
      dividendRate: settings.shareDividendRate || 14.5,
      tiers,
      totalPurchasesCount,
      totalConversionsCount,
      totalConversionVolume,
    };
  }

  /**
   * Top shareholders and ownership distribution breakdown.
   */
  public getOwnershipReport() {
    const accounts = db.getShareAccounts();
    const stats = this.getShareStatistics();
    const totalShares = stats.totalShares || 1;

    const sorted = [...accounts]
      .sort((a, b) => (b.numberOfShares || 0) - (a.numberOfShares || 0))
      .map((acc, index) => {
        const percentage = Number((((acc.numberOfShares || 0) / totalShares) * 100).toFixed(2));
        return {
          rank: index + 1,
          shareAccountId: acc.id,
          shareAccountNo: acc.accountNo,
          memberId: acc.memberId,
          membershipNo: acc.membershipNo,
          memberName: acc.memberName,
          numberOfShares: acc.numberOfShares,
          totalShareValue: acc.totalShareValue,
          ownershipPercentage: percentage,
          status: acc.status,
        };
      });

    return {
      topShareholders: sorted.slice(0, 20),
      totalShareCapital: stats.totalShareCapital,
      totalShares: stats.totalShares,
      sharePrice: stats.sharePrice,
      totalShareholders: sorted.filter((s) => s.numberOfShares > 0).length,
    };
  }

  /**
   * Non-compliant members report (Members with < 5 shares and their shortfall).
   */
  public getNonCompliantMembersReport() {
    const accounts = db.getShareAccounts();
    const settings = db.getSystemSettings();
    const minRequired = settings.minRequiredShares || 5;
    const sharePrice = settings.sharePrice || 500.0;

    const nonCompliant = accounts
      .filter((a) => (a.numberOfShares || 0) < minRequired && a.status === 'ACTIVE')
      .map((acc) => {
        const current = acc.numberOfShares || 0;
        const shortfallShares = minRequired - current;
        const shortfallAmount = financialMath.multiply(shortfallShares, sharePrice);

        // Find voluntary balance available for potential auto-conversion
        const volAcc = db.getSavingAccounts().find(
          (sa) => sa.memberId === acc.memberId && sa.productCode === 'VOLUNTARY' && sa.status === 'ACTIVE'
        );
        const voluntaryAvailable = volAcc ? volAcc.balance : 0;
        const canCoverWithVoluntary = voluntaryAvailable >= shortfallAmount;

        return {
          shareAccountId: acc.id,
          shareAccountNo: acc.accountNo,
          memberId: acc.memberId,
          membershipNo: acc.membershipNo,
          memberName: acc.memberName,
          currentShares: current,
          currentShareValue: acc.totalShareValue,
          requiredShares: minRequired,
          shortfallShares,
          shortfallAmount,
          voluntaryAvailableBalance: voluntaryAvailable,
          canCoverWithVoluntary,
        };
      });

    return {
      totalNonCompliant: nonCompliant.length,
      totalShortfallCapital: nonCompliant.reduce((sum, m) => sum + m.shortfallAmount, 0),
      nonCompliantMembers: nonCompliant,
    };
  }

  /**
   * Get Share System Settings.
   */
  public getShareSettings() {
    const settings = db.getSystemSettings();
    const history = db.getSharePriceHistory();
    return {
      sharePrice: settings.sharePrice || 500.0,
      minRequiredShares: settings.minRequiredShares || 5,
      minShareValue: settings.minShareValue || 2500.0,
      shareDividendRate: settings.shareDividendRate || 14.5,
      institutionName: settings.institutionName,
      baseCurrency: settings.baseCurrency,
      priceHistory: history,
    };
  }

  /**
   * Update Share System Settings with price history preservation and audit.
   */
  public updateShareSettings(
    updates: {
      sharePrice?: number;
      minRequiredShares?: number;
      minShareValue?: number;
      shareDividendRate?: number;
      reason?: string;
    },
    performedById: string,
    performedByName: string
  ) {
    const current = db.getSystemSettings();
    const oldPrice = current.sharePrice || 500.0;
    const newPrice = updates.sharePrice !== undefined ? Number(updates.sharePrice) : oldPrice;

    if (newPrice <= 0) {
      throw new Error('Share price must be greater than zero.');
    }

    const minRequiredShares =
      updates.minRequiredShares !== undefined ? Math.floor(Number(updates.minRequiredShares)) : current.minRequiredShares || 5;
    if (minRequiredShares < 1) {
      throw new Error('Minimum required shares must be at least 1.');
    }

    const minShareValue = updates.minShareValue !== undefined ? Number(updates.minShareValue) : minRequiredShares * newPrice;

    const updatedSettings = db.updateSystemSettings({
      sharePrice: newPrice,
      minRequiredShares,
      minShareValue,
      shareDividendRate:
        updates.shareDividendRate !== undefined ? Number(updates.shareDividendRate) : current.shareDividendRate || 14.5,
    });

    // If share price changed, record in history and log audit
    if (newPrice !== oldPrice) {
      const now = new Date().toISOString();
      const historyEntry: DbSharePriceHistory = {
        id: `sph_${Date.now()}`,
        previousPrice: oldPrice,
        newPrice,
        effectiveDate: now,
        changedById: performedById,
        changedByName: performedByName,
        reason: updates.reason || 'General assembly / Board resolution share par value adjustment',
        createdAt: now,
      };
      db.createSharePriceHistory(historyEntry);

      auditService.record({
        action: 'SETTINGS_UPDATE',
        entity: 'SYSTEM_SETTINGS',
        entityId: 'share_price',
        userId: performedById,
        userName: performedByName,
        details: {
          previousPrice: oldPrice,
          newPrice,
          effectiveDate: now,
          reason: updates.reason,
        },
      });
    }

    return this.getShareSettings();
  }
}

export const shareService = new ShareService();
