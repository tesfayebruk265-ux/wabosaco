import { db } from '../db/database';
import {
  DbLoan,
  DbLoanProduct,
  DbLoanGuarantor,
  DbLoanScheduleItem,
  DbLoanRepayment,
  DbUser,
  DbMember,
  DbFinancialTransaction,
  DbJournalEntry,
  DbJournalEntryLine,
  LoanProductCode,
  LoanStatus,
} from '../db/schema';
import { financialMath } from './financialService';

// ==========================================
// TYPES & INTERFACES FOR LOAN SERVICE
// ==========================================

export interface AmortizationScheduleRow {
  installmentNumber: number;
  dueDate: string;
  openingBalance: number;
  principalAmount: number;
  interestAmount: number;
  installmentAmount: number;
  remainingBalance: number;
}

export interface AmortizationCalculationResult {
  monthlyInstallment: number;
  totalInterest: number;
  totalPayable: number;
  schedule: AmortizationScheduleRow[];
}

export interface EligibilityCriterionResult {
  name: string;
  passed: boolean;
  details: string;
  requirement: string;
}

export interface LoanEligibilityReport {
  isEligible: boolean;
  memberId: string;
  membershipNo: string;
  memberName: string;
  regularSavingsBalance: number;
  shareCount: number;
  shareValue: number;
  continuousSavingsMonths: number;
  maxBorrowableAmount: number;
  activeLoanCount: number;
  activeGuaranteesCount: number;
  criteria: EligibilityCriterionResult[];
  reasons: string[];
}

export interface LoanApplicationPayload {
  memberId: string;
  productId: string;
  requestedAmount: number;
  requestedTermMonths: number;
  purpose: string;
  incomeDetails: {
    monthlyIncome: number;
    monthlyExpenses?: number;
    otherLoansCommitments?: number;
    employerOrBusiness: string;
    netDisposableIncome: number;
  };
  supportingDocuments?: Array<{
    id?: string;
    name: string;
    url: string;
    documentType: string;
  }>;
  guarantors?: Array<{
    guarantorMemberId: string;
    guaranteedAmount: number;
    relationship?: string;
  }>;
}

export interface LoanDisbursementPayload {
  loanId: string;
  paymentChannel: 'CASH' | 'CBE_BANK' | 'TSEHAY_BANK' | 'INTERNAL_TRANSFER_TO_SAVINGS' | 'SYSTEM';
  bankReferenceNo?: string;
  destinationAccountId?: string;
  disbursedBy: DbUser;
}

export interface LoanRepaymentPayload {
  loanId: string;
  amount: number;
  paymentChannel: 'CASH' | 'CBE_BANK' | 'TSEHAY_BANK' | 'INTERNAL_TRANSFER' | 'SYSTEM';
  bankReferenceNo?: string;
  sourceSavingAccountId?: string;
  narration?: string;
  receiptUrl?: string;
  performedBy: DbUser;
}

// ==========================================
// LOAN MANAGEMENT SERVICE CLASS
// ==========================================

export class LoanService {
  // ==========================================
  // 1. AMORTIZATION CALCULATION ENGINE
  // ==========================================

  /**
   * Calculates standard annuity loan amortization schedule with monthly compounding
   * Formula: PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
   */
  public calculateAmortization(
    principal: number,
    annualInterestRatePercent: number,
    termMonths: number,
    gracePeriodMonths: number = 0,
    startDateStr?: string
  ): AmortizationCalculationResult {
    const P = Math.max(0, principal);
    const n = Math.max(1, termMonths);
    const grace = Math.max(0, Math.min(gracePeriodMonths, n - 1));
    const effectiveRepaymentMonths = n - grace;

    const monthlyRate = annualInterestRatePercent / 100 / 12;

    let monthlyPMT = 0;
    if (monthlyRate > 0 && effectiveRepaymentMonths > 0) {
      const factor = Math.pow(1 + monthlyRate, effectiveRepaymentMonths);
      monthlyPMT = (P * (monthlyRate * factor)) / (factor - 1);
    } else {
      monthlyPMT = effectiveRepaymentMonths > 0 ? P / effectiveRepaymentMonths : P;
    }
    monthlyPMT = financialMath.round2(monthlyPMT);

    const schedule: AmortizationScheduleRow[] = [];
    let currentBalance = P;
    let totalInterest = 0;

    const baseDate = startDateStr ? new Date(startDateStr) : new Date();

    for (let m = 1; m <= n; m++) {
      const dueDate = new Date(baseDate);
      dueDate.setMonth(baseDate.getMonth() + m);
      const dueDateStr = dueDate.toISOString().split('T')[0];

      const openingBalance = financialMath.round2(currentBalance);
      let interestForMonth = financialMath.round2(openingBalance * monthlyRate);
      let principalForMonth = 0;
      let installmentAmount = 0;

      if (m <= grace) {
        // Grace period: Member pays only accrued interest or interest capitalizes
        principalForMonth = 0;
        installmentAmount = interestForMonth;
        currentBalance = openingBalance;
      } else if (m === n) {
        // Final installment: Pay exact remaining principal to zero out balance
        principalForMonth = openingBalance;
        installmentAmount = financialMath.round2(principalForMonth + interestForMonth);
        currentBalance = 0;
      } else {
        principalForMonth = financialMath.round2(monthlyPMT - interestForMonth);
        // Safety check to prevent negative principal
        if (principalForMonth > openingBalance) {
          principalForMonth = openingBalance;
        }
        installmentAmount = financialMath.round2(principalForMonth + interestForMonth);
        currentBalance = financialMath.round2(openingBalance - principalForMonth);
      }

      totalInterest = financialMath.round2(totalInterest + interestForMonth);

      schedule.push({
        installmentNumber: m,
        dueDate: dueDateStr,
        openingBalance,
        principalAmount: principalForMonth,
        interestAmount: interestForMonth,
        installmentAmount,
        remainingBalance: Math.max(0, currentBalance),
      });
    }

    const totalPayable = financialMath.round2(P + totalInterest);

    return {
      monthlyInstallment: monthlyPMT,
      totalInterest,
      totalPayable,
      schedule,
    };
  }

  // ==========================================
  // 2. ELIGIBILITY ENGINE
  // ==========================================

  /**
   * Evaluates comprehensive member loan eligibility against cooperative policies
   */
  public evaluateEligibility(memberIdOrNo: string, requestedProductCode?: string, requestedAmount?: number): LoanEligibilityReport {
    const member = db.getMembers().find(
      (m) => m.id === memberIdOrNo || m.membershipNo.toLowerCase() === memberIdOrNo.toLowerCase()
    );

    const systemSettings = db.getSystemSettings();
    const criteria: EligibilityCriterionResult[] = [];
    const reasons: string[] = [];

    if (!member) {
      return {
        isEligible: false,
        memberId: memberIdOrNo,
        membershipNo: '',
        memberName: 'Unknown Member',
        regularSavingsBalance: 0,
        shareCount: 0,
        shareValue: 0,
        continuousSavingsMonths: 0,
        maxBorrowableAmount: 0,
        activeLoanCount: 0,
        activeGuaranteesCount: 0,
        criteria: [{ name: 'Member Existence', passed: false, details: 'Member profile not found in SACCO registry', requirement: 'Must be registered' }],
        reasons: ['Member profile not found in SACCO registry'],
      };
    }

    // 1. Active Membership Status
    const isActive = member.status === 'ACTIVE';
    criteria.push({
      name: 'Active Membership Status',
      passed: isActive,
      details: `Current status is ${member.status}`,
      requirement: 'Member status must be ACTIVE',
    });
    if (!isActive) {
      reasons.push(`Member is not in ACTIVE status (current: ${member.status})`);
    }

    // 2. Membership Approved
    const isApproved = Boolean(member.approvedAt || member.status === 'ACTIVE');
    criteria.push({
      name: 'Membership Board Approval',
      passed: isApproved,
      details: 'Member registration and KYC fully approved',
      requirement: 'Membership must be confirmed and verified',
    });

    // 3. Regular Compulsory Savings Balance & Continuous Savings Record
    const savingAccounts = db.getSavingAccountsByMemberId(member.id);
    const regularAccount = savingAccounts.find((a) => a.productCode === 'REGULAR');
    const regularBalance = regularAccount ? regularAccount.balance : 0;

    // Check continuous savings months from schedule or transaction history
    const monthlySchedules = db.getMonthlySavingsSchedules().filter(
      (s) => s.memberId === member.id || s.membershipNo === member.membershipNo
    );
    const paidContinuousMonths = monthlySchedules.filter((s) => s.status === 'MET').length;
    // Fallback: if schedules are few, check saving transactions or member tenure
    const minContinuousMonthsReq = systemSettings.loanMinContinuousSavingsMonths || 4;
    const continuousMonths = Math.max(paidContinuousMonths, regularBalance >= (minContinuousMonthsReq * (systemSettings.loanMinMonthlySavingsAmount || 500)) ? minContinuousMonthsReq : paidContinuousMonths);

    const hasContinuousSavings = continuousMonths >= minContinuousMonthsReq;
    criteria.push({
      name: 'Continuous Regular Savings',
      passed: hasContinuousSavings,
      details: `Completed ${continuousMonths} months of continuous compulsory regular savings`,
      requirement: `Minimum ${minContinuousMonthsReq} continuous months required`,
    });
    if (!hasContinuousSavings) {
      reasons.push(`Insufficient continuous regular savings history (${continuousMonths}/${minContinuousMonthsReq} months completed)`);
    }

    // 4. Minimum Regular Savings Balance
    const minRegAmountReq = (systemSettings.loanMinMonthlySavingsAmount || 500) * minContinuousMonthsReq;
    const meetsMinRegBalance = regularBalance >= minRegAmountReq;
    criteria.push({
      name: 'Regular Savings Minimum Balance',
      passed: meetsMinRegBalance,
      details: `Regular savings balance: ${regularBalance.toLocaleString()} ETB`,
      requirement: `Minimum required balance: ${minRegAmountReq.toLocaleString()} ETB`,
    });
    if (!meetsMinRegBalance) {
      reasons.push(`Regular savings balance (${regularBalance.toLocaleString()} ETB) is below minimum threshold (${minRegAmountReq.toLocaleString()} ETB)`);
    }

    // 5. Minimum Share Capital Requirement
    const shareAccount = db.getShareAccounts().find(
      (s) => s.memberId === member.id || s.membershipNo === member.membershipNo
    );
    const shareCount = shareAccount ? shareAccount.numberOfShares : 0;
    const shareValue = shareAccount ? shareAccount.totalShareValue : 0;
    const minSharesReq = systemSettings.loanMinShareRequirement || 5;

    const meetsShareReq = shareCount >= minSharesReq;
    criteria.push({
      name: 'Minimum Share Capital',
      passed: meetsShareReq,
      details: `Paid-up shares: ${shareCount} shares (${shareValue.toLocaleString()} ETB)`,
      requirement: `Minimum ${minSharesReq} shares (${(minSharesReq * (systemSettings.sharePrice || 500)).toLocaleString()} ETB) required`,
    });
    if (!meetsShareReq) {
      reasons.push(`Insufficient member share capital (${shareCount}/${minSharesReq} shares paid-up)`);
    }

    // 6. Active Loan Check (Strictly 1 active loan per member)
    const activeLoan = db.getActiveLoanByMemberId(member.id);
    const hasNoActiveLoan = !activeLoan;
    criteria.push({
      name: 'Single Active Loan Policy',
      passed: hasNoActiveLoan,
      details: activeLoan ? `Active loan existing: ${activeLoan.loanNo} (${activeLoan.status})` : 'No outstanding active loan',
      requirement: 'Member must not have any concurrent active or overdue loans',
    });
    if (!hasNoActiveLoan) {
      reasons.push(`Member already has an active loan (${activeLoan?.loanNo} with status ${activeLoan?.status})`);
    }

    // 7. Active Guarantor Count Check (Max 3 guarantees)
    const allLoans = db.getLoans();
    let activeGuaranteesCount = 0;
    allLoans.forEach((l) => {
      if (['ACTIVE', 'DISBURSED', 'OVERDUE', 'AWAITING_GUARANTORS', 'UNDER_REVIEW', 'AWAITING_MANAGER_APPROVAL', 'APPROVED'].includes(l.status)) {
        const isGuarantor = (l.guarantors || []).some(
          (g) => (g.guarantorMemberId === member.id || g.guarantorMembershipNo === member.membershipNo) && g.status === 'ACCEPTED'
        );
        if (isGuarantor) activeGuaranteesCount++;
      }
    });

    const maxGuaranteesAllowed = systemSettings.loanMaxGuaranteePerMember || 3;
    const meetsGuarantorLimit = activeGuaranteesCount < maxGuaranteesAllowed;
    criteria.push({
      name: 'Guarantor Commitment Capacity',
      passed: meetsGuarantorLimit,
      details: `Currently active as guarantor on ${activeGuaranteesCount} loan(s)`,
      requirement: `Maximum ${maxGuaranteesAllowed} active loan guarantees allowed`,
    });

    // 8. Borrowing Capacity Calculation (Multiplier)
    let productMultiplier = systemSettings.loanSavingsMultiplier || 4.0;
    let productMaxAmount = 1500000;
    if (requestedProductCode) {
      const product = db.getLoanProductById(requestedProductCode);
      if (product) {
        productMultiplier = product.savingsMultiplier || productMultiplier;
        productMaxAmount = product.maxAmount;
      }
    }
    const maxBorrowableAmount = Math.min(
      productMaxAmount,
      financialMath.round2(regularBalance * productMultiplier)
    );

    if (requestedAmount && requestedAmount > maxBorrowableAmount) {
      reasons.push(`Requested amount (${requestedAmount.toLocaleString()} ETB) exceeds maximum borrowable limit (${maxBorrowableAmount.toLocaleString()} ETB based on ${productMultiplier}x savings)`);
    }

    const isEligible = criteria.every((c) => c.passed) && (!requestedAmount || requestedAmount <= maxBorrowableAmount);

    return {
      isEligible,
      memberId: member.id,
      membershipNo: member.membershipNo,
      memberName: member.fullName,
      regularSavingsBalance: regularBalance,
      shareCount,
      shareValue,
      continuousSavingsMonths: continuousMonths,
      maxBorrowableAmount,
      activeLoanCount: activeLoan ? 1 : 0,
      activeGuaranteesCount,
      criteria,
      reasons,
    };
  }

  // ==========================================
  // 3. LOAN APPLICATION SUBMISSION
  // ==========================================

  public applyForLoan(payload: LoanApplicationPayload, applicantUser?: DbUser): DbLoan {
    const product = db.getLoanProductById(payload.productId);
    if (!product) {
      throw new Error(`Loan product '${payload.productId}' not found`);
    }
    if (product.status !== 'ACTIVE') {
      throw new Error(`Loan product '${product.name}' is currently deactivated`);
    }

    // Eligibility check
    const eligibility = this.evaluateEligibility(payload.memberId, product.code, payload.requestedAmount);
    if (!eligibility.isEligible) {
      throw new Error(`Loan eligibility requirements not met: ${eligibility.reasons.join(', ')}`);
    }

    // Validate amount boundaries
    if (payload.requestedAmount < product.minAmount) {
      throw new Error(`Requested amount (${payload.requestedAmount.toLocaleString()} ETB) is below minimum of ${product.minAmount.toLocaleString()} ETB for ${product.name}`);
    }
    if (payload.requestedAmount > product.maxAmount) {
      throw new Error(`Requested amount (${payload.requestedAmount.toLocaleString()} ETB) exceeds maximum limit of ${product.maxAmount.toLocaleString()} ETB for ${product.name}`);
    }

    // Validate term
    if (payload.requestedTermMonths < 1 || payload.requestedTermMonths > product.maxTerm) {
      throw new Error(`Requested term (${payload.requestedTermMonths} months) must be between 1 and ${product.maxTerm} months`);
    }

    const member = db.getMembers().find((m) => m.id === payload.memberId || m.membershipNo === payload.memberId);
    if (!member) {
      throw new Error('Member profile not found');
    }

    // Validate guarantors if required
    const guarantors: DbLoanGuarantor[] = [];
    if (product.requiresGuarantor) {
      const providedGuarantors = payload.guarantors || [];
      if (providedGuarantors.length < product.minGuarantors) {
        throw new Error(`${product.name} requires at least ${product.minGuarantors} guarantor(s) (provided: ${providedGuarantors.length})`);
      }
      if (providedGuarantors.length > product.maxGuarantors) {
        throw new Error(`${product.name} allows at most ${product.maxGuarantors} guarantor(s)`);
      }

      // Check each guarantor
      const seenIds = new Set<string>();
      let totalGuaranteed = 0;

      for (const g of providedGuarantors) {
        if (g.guarantorMemberId === member.id || g.guarantorMemberId === member.membershipNo) {
          throw new Error('Member cannot act as their own guarantor');
        }
        if (seenIds.has(g.guarantorMemberId)) {
          throw new Error('Duplicate guarantor specified');
        }
        seenIds.add(g.guarantorMemberId);

        const gMember = db.getMembers().find(
          (m) => m.id === g.guarantorMemberId || m.membershipNo.toLowerCase() === g.guarantorMemberId.toLowerCase()
        );
        if (!gMember) {
          throw new Error(`Guarantor member '${g.guarantorMemberId}' not found`);
        }
        if (gMember.status !== 'ACTIVE') {
          throw new Error(`Guarantor '${gMember.fullName}' is not an ACTIVE member`);
        }

        totalGuaranteed += g.guaranteedAmount;

        guarantors.push({
          id: `grt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          loanId: '', // will be set once loan is created
          guarantorMemberId: gMember.id,
          guarantorMembershipNo: gMember.membershipNo,
          guarantorName: gMember.fullName,
          guarantorPhone: gMember.phoneNumber,
          guaranteedAmount: g.guaranteedAmount,
          status: 'PENDING',
          relationship: g.relationship || 'Fellow Member',
          createdAt: new Date().toISOString(),
        });
      }

      if (totalGuaranteed < payload.requestedAmount) {
        throw new Error(`Total guaranteed amount (${totalGuaranteed.toLocaleString()} ETB) is less than requested loan amount (${payload.requestedAmount.toLocaleString()} ETB)`);
      }
    }

    // Calculate initial amortization
    const amort = this.calculateAmortization(
      payload.requestedAmount,
      product.interestRate,
      payload.requestedTermMonths,
      product.gracePeriod
    );

    const loanNo = db.getNextLoanNo();
    const initialStatus: LoanStatus = product.requiresGuarantor && guarantors.length > 0 ? 'AWAITING_GUARANTORS' : 'UNDER_REVIEW';

    const newLoan: DbLoan = {
      id: `loan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      loanNo,
      memberId: member.id,
      membershipNo: member.membershipNo,
      memberName: member.fullName,
      memberPhone: member.phoneNumber,
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      requestedAmount: payload.requestedAmount,
      approvedAmount: payload.requestedAmount,
      disbursedAmount: 0,
      requestedTermMonths: payload.requestedTermMonths,
      approvedTermMonths: payload.requestedTermMonths,
      interestRate: product.interestRate,
      interestMethod: product.interestMethod,
      monthlyInstallmentAmount: amort.monthlyInstallment,
      totalInterestCalculated: amort.totalInterest,
      totalPayableAmount: amort.totalPayable,
      purpose: payload.purpose,
      incomeDetails: payload.incomeDetails,
      supportingDocuments: (payload.supportingDocuments || []).map((doc, idx) => ({
        id: doc.id || `doc_${Date.now()}_${idx}`,
        name: doc.name,
        url: doc.url,
        documentType: doc.documentType,
        uploadedAt: new Date().toISOString(),
      })),
      guarantors: guarantors.map((g) => ({ ...g, loanId: loanNo })),
      status: initialStatus,
      outstandingPrincipal: payload.requestedAmount,
      outstandingInterest: amort.totalInterest,
      outstandingPenalty: 0,
      totalOutstanding: amort.totalPayable,
      totalPrincipalPaid: 0,
      totalInterestPaid: 0,
      totalPenaltyPaid: 0,
      totalPaid: 0,
      paidInstallmentsCount: 0,
      remainingInstallmentsCount: payload.requestedTermMonths,
      totalInstallmentsCount: payload.requestedTermMonths,
      daysLate: 0,
      isDelinquent: false,
      applicationDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Fix loanId in guarantors
    newLoan.guarantors.forEach((g) => {
      g.loanId = newLoan.id;
    });

    db.createLoan(newLoan);

    // Audit log
    db.recordAuditLog({
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      actorId: applicantUser ? applicantUser.id : member.id,
      actorName: applicantUser ? applicantUser.fullName : member.fullName,
      actorRole: 'MEMBER',
      action: 'LOAN_APPLICATION_SUBMITTED',
      resource: 'LOAN',
      resourceId: newLoan.id,
      result: 'SUCCESS',
      afterState: { loanNo: newLoan.loanNo, amount: newLoan.requestedAmount },
      ipAddress: '127.0.0.1',
      userAgent: 'Wabi SACCO Client Engine',
      timestamp: new Date().toISOString(),
    });

    // Notify applicant
    db.createNotification({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: member.userId || member.id,
      title: 'Loan Application Submitted',
      message: `Your ${product.name} application ${newLoan.loanNo} for ${newLoan.requestedAmount.toLocaleString()} ETB has been submitted. Status: ${initialStatus.replace(/_/g, ' ')}.`,
      type: 'INFO',
      eventType: 'LOAN_APPLICATION_SUBMITTED',
      isRead: false,
      metadata: { loanId: newLoan.id, loanNo: newLoan.loanNo },
      createdAt: new Date().toISOString(),
    });

    // Notify guarantors
    guarantors.forEach((g) => {
      const gMem = db.getMemberById(g.guarantorMemberId);
      db.createNotification({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: gMem ? gMem.userId : g.guarantorMemberId,
        title: 'Loan Guarantee Request',
        message: `${newLoan.memberName} (${newLoan.membershipNo}) requested you to guarantee a loan of ${g.guaranteedAmount.toLocaleString()} ETB for ${newLoan.loanNo}.`,
        type: 'WARNING',
        eventType: 'GUARANTOR_REQUEST',
        isRead: false,
        metadata: { loanId: newLoan.id, loanNo: newLoan.loanNo, guaranteedAmount: g.guaranteedAmount },
        createdAt: new Date().toISOString(),
      });
    });

    return newLoan;
  }

  // ==========================================
  // 4. GUARANTOR RESPONSE WORKFLOW
  // ==========================================

  public respondToGuarantorRequest(
    loanId: string,
    guarantorMemberId: string,
    accept: boolean,
    notes?: string
  ): DbLoan {
    const loan = db.getLoanById(loanId);
    if (!loan) throw new Error(`Loan '${loanId}' not found`);

    if (loan.status !== 'AWAITING_GUARANTORS') {
      throw new Error(`Loan is not in AWAITING_GUARANTORS status (current: ${loan.status})`);
    }

    const gIdx = (loan.guarantors || []).findIndex(
      (g) => g.guarantorMemberId === guarantorMemberId || g.guarantorMembershipNo === guarantorMemberId
    );
    if (gIdx === -1) {
      throw new Error('Guarantor record not found for this loan');
    }

    loan.guarantors[gIdx].status = accept ? 'ACCEPTED' : 'DECLINED';
    loan.guarantors[gIdx].decisionDate = new Date().toISOString();
    loan.guarantors[gIdx].decisionNotes = notes || (accept ? 'Guarantor accepted request' : 'Guarantor declined request');

    if (!accept) {
      // If a guarantor declines, application is rejected
      loan.status = 'REJECTED';
      loan.rejectionReason = `Guarantor ${loan.guarantors[gIdx].guarantorName} declined guarantee request.`;
    } else {
      // Check if all guarantors have accepted
      const allAccepted = loan.guarantors.every((g) => g.status === 'ACCEPTED');
      if (allAccepted) {
        loan.status = 'UNDER_REVIEW';
      }
    }

    loan.updatedAt = new Date().toISOString();
    db.updateLoan(loan.id, loan);

    // Notify borrower
    const borrowerMember = db.getMemberById(loan.memberId);
    db.createNotification({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: borrowerMember ? borrowerMember.userId : loan.memberId,
      title: accept ? 'Guarantor Accepted Loan' : 'Guarantor Declined Loan',
      message: `${loan.guarantors[gIdx].guarantorName} has ${accept ? 'accepted' : 'declined'} your guarantee request for loan ${loan.loanNo}.`,
      type: accept ? 'SUCCESS' : 'ERROR',
      eventType: accept ? 'GUARANTOR_ACCEPTED' : 'GUARANTOR_DECLINED',
      isRead: false,
      metadata: { loanId: loan.id, loanNo: loan.loanNo },
      createdAt: new Date().toISOString(),
    });

    return loan;
  }

  // ==========================================
  // 5. REVIEW & VERIFICATION WORKFLOW (Accountant / Loan Officer)
  // ==========================================

  public reviewLoanApplication(
    loanId: string,
    reviewer: DbUser,
    approved: boolean,
    reviewNotes: string
  ): DbLoan {
    const loan = db.getLoanById(loanId);
    if (!loan) throw new Error(`Loan '${loanId}' not found`);

    if (loan.status !== 'UNDER_REVIEW') {
      throw new Error(`Loan must be UNDER_REVIEW to perform review (current: ${loan.status})`);
    }

    // Maker-checker isolation: Reviewer cannot be the applicant
    if (reviewer.id === loan.memberId || reviewer.username === loan.membershipNo) {
      throw new Error('Separation of duties violation: Cannot review your own loan application');
    }

    if (!approved) {
      loan.status = 'REJECTED';
      loan.rejectionReason = reviewNotes;
    } else {
      loan.status = 'AWAITING_MANAGER_APPROVAL';
    }

    loan.reviewedAt = new Date().toISOString();
    loan.reviewedById = reviewer.id;
    loan.reviewedByName = reviewer.fullName;
    loan.reviewNotes = reviewNotes;
    loan.updatedAt = new Date().toISOString();

    db.updateLoan(loan.id, loan);

    // Audit log
    db.recordAuditLog({
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      actorId: reviewer.id,
      actorName: reviewer.fullName,
      actorRole: 'STAFF',
      action: approved ? 'LOAN_REVIEW_PASSED' : 'LOAN_REVIEW_REJECTED',
      resource: 'LOAN',
      resourceId: loan.id,
      result: 'SUCCESS',
      afterState: { loanNo: loan.loanNo, status: loan.status, reviewNotes },
      ipAddress: '127.0.0.1',
      userAgent: 'Wabi SACCO Server',
      timestamp: new Date().toISOString(),
    });

    // Notification
    const borrowerMember = db.getMemberById(loan.memberId);
    db.createNotification({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: borrowerMember ? borrowerMember.userId : loan.memberId,
      title: approved ? 'Loan Application Verified' : 'Loan Application Rejected',
      message: approved
        ? `Your loan ${loan.loanNo} was verified by credit officers and forwarded for Manager Approval.`
        : `Your loan ${loan.loanNo} was rejected during review: ${reviewNotes}`,
      type: approved ? 'INFO' : 'ERROR',
      eventType: approved ? 'LOAN_UNDER_REVIEW' : 'LOAN_REJECTED',
      isRead: false,
      metadata: { loanId: loan.id, loanNo: loan.loanNo },
      createdAt: new Date().toISOString(),
    });

    return loan;
  }

  // ==========================================
  // 6. MANAGER FINAL APPROVAL WORKFLOW
  // ==========================================

  public approveLoanApplication(
    loanId: string,
    manager: DbUser,
    approved: boolean,
    approvedAmount?: number,
    approvedTermMonths?: number,
    approvedRate?: number,
    notes?: string
  ): DbLoan {
    const loan = db.getLoanById(loanId);
    if (!loan) throw new Error(`Loan '${loanId}' not found`);

    if (loan.status !== 'AWAITING_MANAGER_APPROVAL') {
      throw new Error(`Loan must be AWAITING_MANAGER_APPROVAL for manager decision (current: ${loan.status})`);
    }

    // Maker-checker isolation
    if (manager.id === loan.memberId || manager.username === loan.membershipNo) {
      throw new Error('Separation of duties violation: Manager cannot approve their own loan application');
    }

    if (!approved) {
      loan.status = 'REJECTED';
      loan.rejectionReason = notes || 'Manager rejected loan application';
    } else {
      const finalAmount = approvedAmount || loan.requestedAmount;
      const finalTerm = approvedTermMonths || loan.requestedTermMonths;
      const finalRate = approvedRate !== undefined ? approvedRate : loan.interestRate;

      const product = db.getLoanProductById(loan.productId);
      const gracePeriod = product ? product.gracePeriod : 0;

      // Recalculate amortization based on final approved terms
      const amort = this.calculateAmortization(finalAmount, finalRate, finalTerm, gracePeriod);

      loan.status = 'APPROVED';
      loan.approvedAmount = finalAmount;
      loan.approvedTermMonths = finalTerm;
      loan.interestRate = finalRate;
      loan.monthlyInstallmentAmount = amort.monthlyInstallment;
      loan.totalInterestCalculated = amort.totalInterest;
      loan.totalPayableAmount = amort.totalPayable;
      loan.outstandingPrincipal = finalAmount;
      loan.outstandingInterest = amort.totalInterest;
      loan.totalOutstanding = amort.totalPayable;
      loan.remainingInstallmentsCount = finalTerm;
      loan.totalInstallmentsCount = finalTerm;
    }

    loan.approvedAt = new Date().toISOString();
    loan.approvedById = manager.id;
    loan.approvedByName = manager.fullName;
    loan.updatedAt = new Date().toISOString();

    db.updateLoan(loan.id, loan);

    // Audit log
    db.recordAuditLog({
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      actorId: manager.id,
      actorName: manager.fullName,
      actorRole: 'MANAGER',
      action: approved ? 'LOAN_APPROVED' : 'LOAN_REJECTED',
      resource: 'LOAN',
      resourceId: loan.id,
      result: 'SUCCESS',
      afterState: { loanNo: loan.loanNo, status: loan.status, approvedAmount: loan.approvedAmount },
      ipAddress: '127.0.0.1',
      userAgent: 'Wabi SACCO Server',
      timestamp: new Date().toISOString(),
    });

    // Notification
    const borrowerMember = db.getMemberById(loan.memberId);
    db.createNotification({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: borrowerMember ? borrowerMember.userId : loan.memberId,
      title: approved ? 'Loan Approved!' : 'Loan Application Declined',
      message: approved
        ? `Congratulations! Your loan ${loan.loanNo} for ${(loan.approvedAmount || 0).toLocaleString()} ETB was approved and is ready for disbursement.`
        : `Your loan ${loan.loanNo} was declined: ${loan.rejectionReason}`,
      type: approved ? 'SUCCESS' : 'ERROR',
      eventType: approved ? 'LOAN_APPROVED' : 'LOAN_REJECTED',
      isRead: false,
      metadata: { loanId: loan.id, loanNo: loan.loanNo },
      createdAt: new Date().toISOString(),
    });

    return loan;
  }

  // ==========================================
  // 7. ATOMIC LOAN DISBURSEMENT
  // ==========================================

  public disburseLoan(payload: LoanDisbursementPayload): DbLoan {
    const loan = db.getLoanById(payload.loanId);
    if (!loan) throw new Error(`Loan '${payload.loanId}' not found`);

    if (loan.status !== 'APPROVED') {
      throw new Error(`Loan must be in APPROVED status to be disbursed (current: ${loan.status})`);
    }

    const disburseAmount = loan.approvedAmount || loan.requestedAmount;
    const termMonths = loan.approvedTermMonths || loan.requestedTermMonths;
    const product = db.getLoanProductById(loan.productId);
    if (!product) throw new Error('Loan product configuration not found');

    const disburseDate = new Date();
    const disburseDateStr = disburseDate.toISOString();

    // 1. Generate & Persist Amortization Schedule
    const amort = this.calculateAmortization(
      disburseAmount,
      loan.interestRate,
      termMonths,
      product.gracePeriod,
      disburseDateStr
    );

    db.deleteLoanSchedules(loan.id);
    const scheduleItems: DbLoanScheduleItem[] = amort.schedule.map((row) => ({
      id: `sch_${loan.id}_${row.installmentNumber}`,
      loanId: loan.id,
      installmentNumber: row.installmentNumber,
      dueDate: row.dueDate,
      openingBalance: row.openingBalance,
      principalAmount: row.principalAmount,
      interestAmount: row.interestAmount,
      installmentAmount: row.installmentAmount,
      remainingBalance: row.remainingBalance,
      penaltyAmount: 0,
      paidPrincipal: 0,
      paidInterest: 0,
      paidPenalty: 0,
      paidTotal: 0,
      status: 'PENDING',
      daysLate: 0,
    }));
    db.createLoanSchedules(scheduleItems);

    // 2. Determine GL Asset & Credit accounts
    const glLoanAssetAccount = product.glAssetAccountId || '1210-LN-PER';
    let glCreditAccount = '1010-CBE'; // Default CBE
    if (payload.paymentChannel === 'CASH') glCreditAccount = '1001-CSH';
    if (payload.paymentChannel === 'TSEHAY_BANK') glCreditAccount = '1020-TSH';
    if (payload.paymentChannel === 'INTERNAL_TRANSFER_TO_SAVINGS') {
      glCreditAccount = '2020-VOL'; // Crediting member voluntary savings liability
    }

    // 3. Post to Member Savings Account if internal transfer
    let destinationSavingAccountNo = '';
    if (payload.paymentChannel === 'INTERNAL_TRANSFER_TO_SAVINGS' || payload.destinationAccountId) {
      const savingAccounts = db.getSavingAccountsByMemberId(loan.memberId);
      const targetAccount = payload.destinationAccountId
        ? savingAccounts.find((a) => a.id === payload.destinationAccountId)
        : savingAccounts.find((a) => a.productCode === 'VOLUNTARY') || savingAccounts[0];

      if (targetAccount) {
        destinationSavingAccountNo = targetAccount.accountNo;
        targetAccount.balance = financialMath.round2(targetAccount.balance + disburseAmount);
        targetAccount.updatedAt = disburseDateStr;
        db.updateSavingAccount(targetAccount.id, targetAccount);
      }
    }

    // 4. Create Financial Transaction
    const txNo = `WBS-FT-${disburseDate.getFullYear()}-${String(Date.now()).slice(-6)}`;
    const finTx: DbFinancialTransaction = {
      id: `ft_disb_${loan.id}`,
      transactionNo: txNo,
      memberId: loan.memberId,
      membershipNo: loan.membershipNo,
      memberName: loan.memberName,
      accountId: loan.id,
      accountNo: loan.loanNo,
      productCode: loan.productCode,
      type: 'LOAN_DISBURSEMENT',
      amount: disburseAmount,
      debitAmount: disburseAmount,
      creditAmount: null,
      balanceBefore: 0,
      balanceAfter: disburseAmount,
      paymentChannel: payload.paymentChannel === 'INTERNAL_TRANSFER_TO_SAVINGS' ? 'INTERNAL_TRANSFER' : (payload.paymentChannel as any),
      bankReferenceNo: payload.bankReferenceNo,
      narration: `Disbursement of ${loan.productName} (${loan.loanNo}) to ${loan.memberName}`,
      status: 'POSTED',
      requiresApproval: false,
      createdById: payload.disbursedBy.id,
      createdByName: payload.disbursedBy.fullName,
      timestamp: disburseDateStr,
      createdAt: disburseDateStr,
    };
    db.createFinancialTransaction(finTx);

    // 5. Create Balanced GL Double-Entry Journal Entry
    const journalNo = `JNL-LN-DISB-${disburseDate.getFullYear()}-${String(Date.now()).slice(-5)}`;
    const journalEntry: DbJournalEntry = {
      id: `jnl_disb_${loan.id}`,
      journalNo,
      transactionId: finTx.id,
      transactionReference: finTx.transactionNo,
      date: disburseDateStr.split('T')[0],
      narration: `Loan disbursement ${loan.loanNo} for ${loan.memberName} (${disburseAmount.toLocaleString()} ETB)`,
      lines: [
        {
          id: `line_1_${Date.now()}`,
          accountId: glLoanAssetAccount,
          accountCode: glLoanAssetAccount.split('-')[0],
          accountName: `${loan.productName} Loans Receivable`,
          debit: disburseAmount,
          credit: 0,
          description: `Debit loan asset portfolio for ${loan.loanNo}`,
        },
        {
          id: `line_2_${Date.now()}`,
          accountId: glCreditAccount,
          accountCode: glCreditAccount.split('-')[0],
          accountName: glCreditAccount === '2020-VOL' ? 'Member Savings Liability' : 'Cash/Bank Clearing',
          debit: 0,
          credit: disburseAmount,
          description: `Credit disbursement channel for ${loan.loanNo}`,
        },
      ],
      totalDebit: disburseAmount,
      totalCredit: disburseAmount,
      postedBy: payload.disbursedBy.fullName,
      status: 'POSTED',
      createdAt: disburseDateStr,
    };
    db.createJournalEntry(journalEntry);

    // 6. Update Loan record to ACTIVE
    loan.status = 'ACTIVE';
    loan.disbursedAmount = disburseAmount;
    loan.outstandingPrincipal = disburseAmount;
    loan.outstandingInterest = amort.totalInterest;
    loan.outstandingPenalty = 0;
    loan.totalOutstanding = amort.totalPayable;
    loan.nextInstallmentDate = scheduleItems[0]?.dueDate;
    loan.nextInstallmentAmount = scheduleItems[0]?.installmentAmount;
    loan.disbursementDetails = {
      disbursedAt: disburseDateStr,
      paymentChannel: payload.paymentChannel,
      bankReferenceNo: payload.bankReferenceNo,
      destinationAccountId: destinationSavingAccountNo || undefined,
      disbursedById: payload.disbursedBy.id,
      disbursedByName: payload.disbursedBy.fullName,
      journalEntryId: journalEntry.id,
      financialTransactionId: finTx.id,
    };
    loan.updatedAt = disburseDateStr;

    db.updateLoan(loan.id, loan);

    // 7. Audit log
    db.recordAuditLog({
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      actorId: payload.disbursedBy.id,
      actorName: payload.disbursedBy.fullName,
      actorRole: 'STAFF',
      action: 'LOAN_DISBURSED',
      resource: 'LOAN',
      resourceId: loan.id,
      result: 'SUCCESS',
      afterState: { loanNo: loan.loanNo, disbursedAmount: disburseAmount, channel: payload.paymentChannel },
      ipAddress: '127.0.0.1',
      userAgent: 'Wabi SACCO Server',
      timestamp: disburseDateStr,
    });

    // 8. Notification to Member
    const borrowerMember = db.getMemberById(loan.memberId);
    db.createNotification({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: borrowerMember ? borrowerMember.userId : loan.memberId,
      title: 'Loan Disbursed',
      message: `Your loan ${loan.loanNo} for ${disburseAmount.toLocaleString()} ETB has been disbursed via ${payload.paymentChannel}. First installment due on ${loan.nextInstallmentDate}.`,
      type: 'SUCCESS',
      eventType: 'LOAN_DISBURSED',
      isRead: false,
      metadata: { loanId: loan.id, loanNo: loan.loanNo, amount: disburseAmount },
      createdAt: disburseDateStr,
    });

    return loan;
  }

  // ==========================================
  // 8. LOAN REPAYMENT & WATERFALL ENGINE
  // ==========================================

  public recordRepayment(payload: LoanRepaymentPayload): DbLoanRepayment {
    const loan = db.getLoanById(payload.loanId);
    if (!loan) throw new Error(`Loan '${payload.loanId}' not found`);

    if (!['ACTIVE', 'OVERDUE', 'DEFAULTED'].includes(loan.status)) {
      throw new Error(`Cannot post repayment on loan in '${loan.status}' status`);
    }

    const payAmount = financialMath.round2(payload.amount);
    if (payAmount <= 0) {
      throw new Error('Repayment amount must be strictly greater than 0');
    }

    const timestamp = new Date().toISOString();
    const product = db.getLoanProductById(loan.productId);

    // If payment is from internal savings account, verify and debit balance
    if (payload.paymentChannel === 'INTERNAL_TRANSFER' && payload.sourceSavingAccountId) {
      const savingAcc = db.getSavingAccountById(payload.sourceSavingAccountId);
      if (!savingAcc) throw new Error('Source savings account not found');
      if (savingAcc.balance < payAmount) {
        throw new Error(`Insufficient savings account balance (${savingAcc.balance.toLocaleString()} ETB available)`);
      }
      savingAcc.balance = financialMath.round2(savingAcc.balance - payAmount);
      savingAcc.ledgerBalance = financialMath.round2(savingAcc.ledgerBalance - payAmount);
      savingAcc.lastTransactionDate = timestamp;
      db.updateSavingAccount(savingAcc.id, savingAcc);
    }

    // Fetch schedules in installment order
    const schedules = db.getLoanSchedules(loan.id);
    let remainingToAllocate = payAmount;
    let totalPenaltyPaid = 0;
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;

    // Repayment Waterfall: 1. Penalty -> 2. Interest -> 3. Principal across unpaid schedules
    for (const item of schedules) {
      if (remainingToAllocate <= 0) break;
      if (item.status === 'PAID') continue;

      // 1. Pay Penalty
      const unpaidPenalty = financialMath.round2(item.penaltyAmount - item.paidPenalty);
      if (unpaidPenalty > 0 && remainingToAllocate > 0) {
        const penPayment = Math.min(remainingToAllocate, unpaidPenalty);
        item.paidPenalty = financialMath.round2(item.paidPenalty + penPayment);
        totalPenaltyPaid = financialMath.round2(totalPenaltyPaid + penPayment);
        remainingToAllocate = financialMath.round2(remainingToAllocate - penPayment);
      }

      // 2. Pay Interest
      const unpaidInterest = financialMath.round2(item.interestAmount - item.paidInterest);
      if (unpaidInterest > 0 && remainingToAllocate > 0) {
        const intPayment = Math.min(remainingToAllocate, unpaidInterest);
        item.paidInterest = financialMath.round2(item.paidInterest + intPayment);
        totalInterestPaid = financialMath.round2(totalInterestPaid + intPayment);
        remainingToAllocate = financialMath.round2(remainingToAllocate - intPayment);
      }

      // 3. Pay Principal
      const unpaidPrincipal = financialMath.round2(item.principalAmount - item.paidPrincipal);
      if (unpaidPrincipal > 0 && remainingToAllocate > 0) {
        const prinPayment = Math.min(remainingToAllocate, unpaidPrincipal);
        item.paidPrincipal = financialMath.round2(item.paidPrincipal + prinPayment);
        totalPrincipalPaid = financialMath.round2(totalPrincipalPaid + prinPayment);
        remainingToAllocate = financialMath.round2(remainingToAllocate - prinPayment);
      }

      item.paidTotal = financialMath.round2(item.paidPrincipal + item.paidInterest + item.paidPenalty);

      const isFullyPaid =
        item.paidPrincipal >= item.principalAmount &&
        item.paidInterest >= item.interestAmount &&
        item.paidPenalty >= item.penaltyAmount;

      if (isFullyPaid) {
        item.status = 'PAID';
        item.paidDate = timestamp;
      } else {
        item.status = 'PARTIALLY_PAID';
      }

      db.updateLoanScheduleItem(item.id, item);
    }

    // If excess payment remains after paying all schedules, apply to loan principal directly
    if (remainingToAllocate > 0) {
      totalPrincipalPaid = financialMath.round2(totalPrincipalPaid + remainingToAllocate);
      remainingToAllocate = 0;
    }

    // Balances before & after
    const prinBefore = loan.outstandingPrincipal;
    const prinAfter = Math.max(0, financialMath.round2(prinBefore - totalPrincipalPaid));
    const totalBalBefore = loan.totalOutstanding;
    const totalBalAfter = Math.max(0, financialMath.round2(totalBalBefore - payAmount));

    // Update Loan Balances
    loan.outstandingPrincipal = prinAfter;
    loan.outstandingInterest = Math.max(0, financialMath.round2(loan.outstandingInterest - totalInterestPaid));
    loan.outstandingPenalty = Math.max(0, financialMath.round2(loan.outstandingPenalty - totalPenaltyPaid));
    loan.totalOutstanding = totalBalAfter;

    loan.totalPrincipalPaid = financialMath.round2(loan.totalPrincipalPaid + totalPrincipalPaid);
    loan.totalInterestPaid = financialMath.round2(loan.totalInterestPaid + totalInterestPaid);
    loan.totalPenaltyPaid = financialMath.round2(loan.totalPenaltyPaid + totalPenaltyPaid);
    loan.totalPaid = financialMath.round2(loan.totalPaid + payAmount);

    const paidSchedulesCount = schedules.filter((s) => s.status === 'PAID').length;
    loan.paidInstallmentsCount = paidSchedulesCount;
    loan.remainingInstallmentsCount = Math.max(0, loan.totalInstallmentsCount - paidSchedulesCount);

    // Check next due installment
    const nextPending = schedules.find((s) => s.status === 'PENDING' || s.status === 'PARTIALLY_PAID');
    if (nextPending) {
      loan.nextInstallmentDate = nextPending.dueDate;
      loan.nextInstallmentAmount = financialMath.round2(
        nextPending.installmentAmount + nextPending.penaltyAmount - nextPending.paidTotal
      );
    } else {
      loan.nextInstallmentDate = undefined;
      loan.nextInstallmentAmount = 0;
    }

    // Check if Loan is fully completed
    if (loan.outstandingPrincipal <= 0 && loan.outstandingInterest <= 0 && loan.outstandingPenalty <= 0) {
      loan.status = 'COMPLETED';
      loan.completedAt = timestamp;
      loan.isDelinquent = false;
      loan.daysLate = 0;
    } else if (loan.status === 'OVERDUE' || loan.status === 'DEFAULTED') {
      // Check if any overdue schedules remain
      const hasOverdueSchedule = schedules.some((s) => s.status === 'OVERDUE' || s.status === 'DEFAULTED');
      if (!hasOverdueSchedule) {
        loan.status = 'ACTIVE';
        loan.isDelinquent = false;
        loan.daysLate = 0;
      }
    }

    loan.updatedAt = timestamp;
    db.updateLoan(loan.id, loan);

    // Create Repayment Record
    const repaymentNo = db.getNextRepaymentNo();
    const repaymentRecord: DbLoanRepayment = {
      id: `lrp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      repaymentNo,
      loanId: loan.id,
      loanNo: loan.loanNo,
      memberId: loan.memberId,
      membershipNo: loan.membershipNo,
      memberName: loan.memberName,
      amount: payAmount,
      principalPaid: totalPrincipalPaid,
      interestPaid: totalInterestPaid,
      penaltyPaid: totalPenaltyPaid,
      principalBalanceBefore: prinBefore,
      principalBalanceAfter: prinAfter,
      totalBalanceBefore: totalBalBefore,
      totalBalanceAfter: totalBalAfter,
      paymentChannel: payload.paymentChannel,
      bankReferenceNo: payload.bankReferenceNo,
      sourceSavingAccountId: payload.sourceSavingAccountId,
      narration: payload.narration || `Loan installment repayment (${repaymentNo}) for ${loan.loanNo}`,
      receiptUrl: payload.receiptUrl,
      performedById: payload.performedBy.id,
      performedByName: payload.performedBy.fullName || `${payload.performedBy.firstName || ''} ${payload.performedBy.lastName || ''}`.trim() || payload.performedBy.username,
      timestamp,
      status: 'POSTED',
      createdAt: timestamp,
    };
    db.createLoanRepayment(repaymentRecord);

    // Create Financial Transaction
    const txNo = `WBS-LRP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const finTx: DbFinancialTransaction = {
      id: `ft_lrp_${repaymentRecord.id}`,
      transactionNo: txNo,
      memberId: loan.memberId,
      membershipNo: loan.membershipNo,
      memberName: loan.memberName,
      accountId: loan.id,
      accountNo: loan.loanNo,
      productCode: loan.productCode,
      type: 'LOAN_REPAYMENT',
      amount: payAmount,
      debitAmount: null,
      creditAmount: payAmount,
      balanceBefore: totalBalBefore,
      balanceAfter: totalBalAfter,
      paymentChannel: payload.paymentChannel,
      bankReferenceNo: payload.bankReferenceNo,
      narration: `Repayment of ${payAmount.toLocaleString()} ETB for ${loan.loanNo} (Principal: ${totalPrincipalPaid.toLocaleString()}, Interest: ${totalInterestPaid.toLocaleString()}, Penalty: ${totalPenaltyPaid.toLocaleString()})`,
      status: 'POSTED',
      requiresApproval: false,
      createdById: payload.performedBy.id,
      createdByName: payload.performedBy.fullName || `${payload.performedBy.firstName || ''} ${payload.performedBy.lastName || ''}`.trim() || payload.performedBy.username,
      timestamp,
      createdAt: timestamp,
    };
    db.createFinancialTransaction(finTx);

    // Create Balanced Double-Entry Journal Entry
    const glDebitAccount = payload.paymentChannel === 'CASH'
      ? '1001-CSH'
      : payload.paymentChannel === 'TSEHAY_BANK'
      ? '1020-TSH'
      : payload.paymentChannel === 'INTERNAL_TRANSFER'
      ? '2020-VOL' // Debiting member savings liability
      : '1010-CBE';

    const glLoanAssetAccount = product ? product.glAssetAccountId : '1210-LN-PER';
    const glInterestIncome = product ? product.glInterestIncomeAccountId : '4010-INT-INC';
    const glPenaltyIncome = '4030-PEN-INC';

    const lines: DbJournalEntryLine[] = [
      {
        id: `line_dr_${Date.now()}`,
        accountId: glDebitAccount,
        accountCode: glDebitAccount.split('-')[0],
        accountName: glDebitAccount === '2020-VOL' ? 'Member Savings Liability' : 'Cash/Bank Asset',
        accountType: glDebitAccount.startsWith('1') ? 'ASSET' : 'LIABILITY',
        debit: payAmount,
        credit: 0,
        narration: `Debit payment receiving channel for ${loan.loanNo}`,
        description: `Debit payment receiving channel for ${loan.loanNo}`,
      },
    ];

    if (totalPrincipalPaid > 0) {
      lines.push({
        id: `line_cr_prin_${Date.now()}`,
        accountId: glLoanAssetAccount,
        accountCode: glLoanAssetAccount.split('-')[0],
        accountName: `${loan.productName} Loans Receivable`,
        accountType: 'ASSET',
        debit: 0,
        credit: totalPrincipalPaid,
        narration: `Credit loan asset principal for ${loan.loanNo}`,
        description: `Credit loan asset principal for ${loan.loanNo}`,
      });
    }

    if (totalInterestPaid > 0) {
      lines.push({
        id: `line_cr_int_${Date.now()}`,
        accountId: glInterestIncome,
        accountCode: glInterestIncome.split('-')[0],
        accountName: 'Loan Interest Income',
        accountType: 'INCOME',
        debit: 0,
        credit: totalInterestPaid,
        narration: `Credit loan interest earned for ${loan.loanNo}`,
        description: `Credit loan interest earned for ${loan.loanNo}`,
      });
    }

    if (totalPenaltyPaid > 0) {
      lines.push({
        id: `line_cr_pen_${Date.now()}`,
        accountId: glPenaltyIncome,
        accountCode: glPenaltyIncome.split('-')[0],
        accountName: 'Loan Delinquency & Penalty Income',
        accountType: 'INCOME',
        debit: 0,
        credit: totalPenaltyPaid,
        narration: `Credit late payment penalties collected for ${loan.loanNo}`,
        description: `Credit late payment penalties collected for ${loan.loanNo}`,
      });
    }

    const journalNo = `JNL-LRP-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
    const journalEntry: DbJournalEntry = {
      id: `jnl_lrp_${repaymentRecord.id}`,
      journalNo,
      transactionId: finTx.id,
      transactionType: 'LOAN_REPAYMENT',
      entryDate: timestamp.split('T')[0],
      date: timestamp.split('T')[0],
      narration: `Loan Repayment ${loan.loanNo} (${payAmount.toLocaleString()} ETB)`,
      lines,
      totalDebit: payAmount,
      totalCredit: financialMath.round2(totalPrincipalPaid + totalInterestPaid + totalPenaltyPaid),
      postedBy: payload.performedBy.fullName || `${payload.performedBy.firstName || ''} ${payload.performedBy.lastName || ''}`.trim() || payload.performedBy.username,
      status: 'POSTED',
      createdAt: timestamp,
    };
    db.createJournalEntry(journalEntry);

    // Audit log
    db.recordAuditLog({
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      actorId: payload.performedBy.id,
      actorName: payload.performedBy.fullName || payload.performedBy.username,
      actorRole: payload.performedBy.role || 'STAFF',
      action: 'LOAN_REPAYMENT_POSTED',
      resource: 'LOAN',
      resourceId: loan.id,
      result: 'SUCCESS',
      afterState: { loanNo: loan.loanNo, payAmount, totalBalAfter },
      ipAddress: '127.0.0.1',
      userAgent: 'Wabi SACCO Server',
      timestamp,
    });

    // Notification to Member
    db.createNotification({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      recipientId: loan.memberId,
      title: loan.status === 'COMPLETED' ? 'Loan Fully Settled & Closed!' : 'Payment Received',
      message: loan.status === 'COMPLETED'
        ? `Congratulations! Your loan ${loan.loanNo} is fully settled and closed. Thank you for your commitment.`
        : `Payment of ${payAmount.toLocaleString()} ETB received for loan ${loan.loanNo}. Remaining balance: ${totalBalAfter.toLocaleString()} ETB.`,
      type: loan.status === 'COMPLETED' ? 'SUCCESS' : 'INFO',
      eventType: loan.status === 'COMPLETED' ? 'LOAN_COMPLETED' : 'PAYMENT_RECEIVED',
      isRead: false,
      metadata: { loanId: loan.id, loanNo: loan.loanNo, repaymentId: repaymentRecord.id },
      createdAt: timestamp,
    });

    return repaymentRecord;
  }

  // ==========================================
  // 9. OVERDUE, DELINQUENCY & LATE PENALTY SCANNER
  // ==========================================

  public scanAndProcessOverdueLoans(): { processedLoansCount: number; overdueInstallmentsCount: number; totalPenaltiesAssessed: number } {
    const today = new Date();
    const systemSettings = db.getSystemSettings();
    const penaltyRate = (systemSettings.loanLatePenaltyRatePercent || 2.0) / 100;
    const graceDays = systemSettings.loanLateGraceDays || 5;

    const activeLoans = db.getLoans().filter((l) => l.status === 'ACTIVE' || l.status === 'OVERDUE');
    let processedLoansCount = 0;
    let overdueInstallmentsCount = 0;
    let totalPenaltiesAssessed = 0;

    for (const loan of activeLoans) {
      const schedules = db.getLoanSchedules(loan.id);
      let loanHasOverdue = false;
      let maxDaysLate = 0;

      for (const item of schedules) {
        if (item.status === 'PAID') continue;

        const dueDate = new Date(item.dueDate);
        const diffMs = today.getTime() - dueDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays > graceDays) {
          loanHasOverdue = true;
          overdueInstallmentsCount++;
          item.daysLate = diffDays;
          if (diffDays > maxDaysLate) maxDaysLate = diffDays;

          // If over 90 days late -> DEFAULTED
          if (diffDays > 90) {
            item.status = 'DEFAULTED';
          } else {
            item.status = 'OVERDUE';
          }

          // Calculate penalty if not already assessed
          const unpaidInstallment = financialMath.round2(item.installmentAmount - item.paidTotal);
          const newPenalty = financialMath.round2(unpaidInstallment * penaltyRate);
          if (newPenalty > item.penaltyAmount) {
            const addedPenalty = financialMath.round2(newPenalty - item.penaltyAmount);
            item.penaltyAmount = newPenalty;
            totalPenaltiesAssessed += addedPenalty;
            loan.outstandingPenalty = financialMath.round2(loan.outstandingPenalty + addedPenalty);
            loan.totalOutstanding = financialMath.round2(loan.totalOutstanding + addedPenalty);
          }

          db.updateLoanScheduleItem(item.id, item);
        }
      }

      if (loanHasOverdue) {
        processedLoansCount++;
        loan.daysLate = maxDaysLate;
        loan.isDelinquent = true;

        if (maxDaysLate > 90) {
          loan.status = 'DEFAULTED';
        } else {
          loan.status = 'OVERDUE';
        }

        loan.updatedAt = today.toISOString();
        db.updateLoan(loan.id, loan);

        // Notify member of overdue loan
        db.createNotification({
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          recipientId: loan.memberId,
          title: loan.status === 'DEFAULTED' ? 'LOAN DEFAULT ALERT' : 'Late Payment Notice',
          message: `Your loan ${loan.loanNo} is ${maxDaysLate} days overdue. Status: ${loan.status}. Outstanding penalty: ${loan.outstandingPenalty.toLocaleString()} ETB.`,
          type: 'DANGER',
          eventType: loan.status === 'DEFAULTED' ? 'LOAN_DEFAULTED' : 'LATE_PAYMENT',
          isRead: false,
          metadata: { loanId: loan.id, loanNo: loan.loanNo, daysLate: maxDaysLate },
          createdAt: today.toISOString(),
        });
      }
    }

    return {
      processedLoansCount,
      overdueInstallmentsCount,
      totalPenaltiesAssessed: financialMath.round2(totalPenaltiesAssessed),
    };
  }

  // ==========================================
  // 10. WAIVE PENALTY (Manager Override)
  // ==========================================

  public waivePenalty(loanId: string, installmentNumber: number, manager: DbUser, reason: string): DbLoan {
    const loan = db.getLoanById(loanId);
    if (!loan) throw new Error(`Loan '${loanId}' not found`);

    const scheduleItem = db.getLoanSchedules(loan.id).find((s) => s.installmentNumber === installmentNumber);
    if (!scheduleItem) throw new Error(`Installment #${installmentNumber} not found`);

    const waivedAmount = financialMath.round2(scheduleItem.penaltyAmount - scheduleItem.paidPenalty);
    if (waivedAmount <= 0) {
      throw new Error('No outstanding penalty to waive on this installment');
    }

    scheduleItem.penaltyAmount = scheduleItem.paidPenalty;
    db.updateLoanScheduleItem(scheduleItem.id, scheduleItem);

    loan.outstandingPenalty = Math.max(0, financialMath.round2(loan.outstandingPenalty - waivedAmount));
    loan.totalOutstanding = Math.max(0, financialMath.round2(loan.totalOutstanding - waivedAmount));
    loan.updatedAt = new Date().toISOString();
    db.updateLoan(loan.id, loan);

    // Audit log
    db.recordAuditLog({
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      actorId: manager.id,
      actorName: manager.fullName || manager.username,
      actorRole: manager.role || 'MANAGER',
      action: 'LOAN_PENALTY_WAIVED',
      resource: 'LOAN',
      resourceId: loan.id,
      result: 'SUCCESS',
      afterState: { loanNo: loan.loanNo, installmentNumber, waivedAmount, reason },
      ipAddress: '127.0.0.1',
      userAgent: 'Wabi SACCO Server',
      timestamp: new Date().toISOString(),
    });

    return loan;
  }

  // ==========================================
  // 11. PORTFOLIO & MANAGEMENT REPORTS
  // ==========================================

  public getPortfolioSummary() {
    const loans = db.getLoans();
    const activeLoans = loans.filter((l) => ['ACTIVE', 'DISBURSED', 'OVERDUE', 'DEFAULTED'].includes(l.status));

    const totalDisbursed = activeLoans.reduce((sum, l) => sum + (l.disbursedAmount || 0), 0);
    const totalOutstandingPrincipal = activeLoans.reduce((sum, l) => sum + l.outstandingPrincipal, 0);
    const totalOutstandingInterest = activeLoans.reduce((sum, l) => sum + l.outstandingInterest, 0);
    const totalOutstandingPenalty = activeLoans.reduce((sum, l) => sum + l.outstandingPenalty, 0);
    const totalOutstanding = activeLoans.reduce((sum, l) => sum + l.totalOutstanding, 0);
    const totalPrincipalCollected = loans.reduce((sum, l) => sum + l.totalPrincipalPaid, 0);
    const totalInterestCollected = loans.reduce((sum, l) => sum + l.totalInterestPaid, 0);
    const totalPenaltyCollected = loans.reduce((sum, l) => sum + l.totalPenaltyPaid, 0);

    const performingLoans = activeLoans.filter((l) => l.status === 'ACTIVE' && !l.isDelinquent);
    const overdueLoans = activeLoans.filter((l) => l.status === 'OVERDUE');
    const defaultedLoans = activeLoans.filter((l) => l.status === 'DEFAULTED');

    const parAmount = overdueLoans.reduce((sum, l) => sum + l.outstandingPrincipal, 0) +
      defaultedLoans.reduce((sum, l) => sum + l.outstandingPrincipal, 0);
    const parRate = totalOutstandingPrincipal > 0 ? financialMath.round2((parAmount / totalOutstandingPrincipal) * 100) : 0;

    return {
      totalLoansCount: loans.length,
      activeLoansCount: activeLoans.length,
      performingLoansCount: performingLoans.length,
      overdueLoansCount: overdueLoans.length,
      defaultedLoansCount: defaultedLoans.length,
      totalDisbursed: financialMath.round2(totalDisbursed),
      totalOutstandingPrincipal: financialMath.round2(totalOutstandingPrincipal),
      totalOutstandingInterest: financialMath.round2(totalOutstandingInterest),
      totalOutstandingPenalty: financialMath.round2(totalOutstandingPenalty),
      totalOutstanding: financialMath.round2(totalOutstanding),
      totalPrincipalCollected: financialMath.round2(totalPrincipalCollected),
      totalInterestCollected: financialMath.round2(totalInterestCollected),
      totalPenaltyCollected: financialMath.round2(totalPenaltyCollected),
      totalCollections: financialMath.round2(totalPrincipalCollected + totalInterestCollected + totalPenaltyCollected),
      portfolioAtRiskAmount: financialMath.round2(parAmount),
      portfolioAtRiskRatePercent: parRate,
    };
  }

  public getAgingReport() {
    const activeLoans = db.getLoans().filter((l) => ['ACTIVE', 'DISBURSED', 'OVERDUE', 'DEFAULTED'].includes(l.status));

    const buckets = {
      current: { label: 'Current (0 Days)', count: 0, amount: 0, percentage: 0 },
      bucket1: { label: '1 - 30 Days (Special Mention)', count: 0, amount: 0, percentage: 0 },
      bucket2: { label: '31 - 60 Days (Substandard)', count: 0, amount: 0, percentage: 0 },
      bucket3: { label: '61 - 90 Days (Doubtful)', count: 0, amount: 0, percentage: 0 },
      bucket4: { label: '> 90 Days (Loss / Default)', count: 0, amount: 0, percentage: 0 },
    };

    let totalPrincipal = 0;

    activeLoans.forEach((loan) => {
      const prin = loan.outstandingPrincipal;
      totalPrincipal += prin;
      const days = loan.daysLate || 0;

      if (days === 0) {
        buckets.current.count++;
        buckets.current.amount += prin;
      } else if (days <= 30) {
        buckets.bucket1.count++;
        buckets.bucket1.amount += prin;
      } else if (days <= 60) {
        buckets.bucket2.count++;
        buckets.bucket2.amount += prin;
      } else if (days <= 90) {
        buckets.bucket3.count++;
        buckets.bucket3.amount += prin;
      } else {
        buckets.bucket4.count++;
        buckets.bucket4.amount += prin;
      }
    });

    if (totalPrincipal > 0) {
      buckets.current.percentage = financialMath.round2((buckets.current.amount / totalPrincipal) * 100);
      buckets.bucket1.percentage = financialMath.round2((buckets.bucket1.amount / totalPrincipal) * 100);
      buckets.bucket2.percentage = financialMath.round2((buckets.bucket2.amount / totalPrincipal) * 100);
      buckets.bucket3.percentage = financialMath.round2((buckets.bucket3.amount / totalPrincipal) * 100);
      buckets.bucket4.percentage = financialMath.round2((buckets.bucket4.amount / totalPrincipal) * 100);
    }

    return {
      totalPrincipal: financialMath.round2(totalPrincipal),
      buckets: Object.values(buckets).map((b) => ({
        ...b,
        amount: financialMath.round2(b.amount),
      })),
    };
  }

  public getProductTypeReport() {
    const products = db.getLoanProducts();
    const loans = db.getLoans();

    return products.map((prod) => {
      const prodLoans = loans.filter((l) => l.productId === prod.id || l.productCode === prod.code);
      const activeProdLoans = prodLoans.filter((l) => ['ACTIVE', 'DISBURSED', 'OVERDUE', 'DEFAULTED'].includes(l.status));
      const totalDisbursed = prodLoans.reduce((sum, l) => sum + (l.disbursedAmount || 0), 0);
      const outstanding = activeProdLoans.reduce((sum, l) => sum + l.outstandingPrincipal, 0);
      const interestEarned = prodLoans.reduce((sum, l) => sum + l.totalInterestPaid, 0);

      return {
        productId: prod.id,
        productCode: prod.code,
        productName: prod.name,
        interestRate: prod.interestRate,
        totalApplicationsCount: prodLoans.length,
        activeLoansCount: activeProdLoans.length,
        totalDisbursed: financialMath.round2(totalDisbursed),
        outstandingPrincipal: financialMath.round2(outstanding),
        interestEarned: financialMath.round2(interestEarned),
      };
    });
  }
}

export const loanService = new LoanService();
