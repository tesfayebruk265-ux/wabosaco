import { db } from '../db/database';
import { accountingService } from './accountingService';

export interface DashboardFilterParams {
  startDate?: string;
  endDate?: string;
  branch?: string;
  officer?: string;
}

export interface MonthlyFinancialTrendPoint {
  month: string; // e.g. "Jan", "Feb" or "2026-01"
  savingsDeposit: number;
  savingsWithdrawal: number;
  netSavings: number;
  loansDisbursed: number;
  loansRepaid: number;
  interestIncome: number;
  operatingExpenses: number;
  netSurplus: number;
}

class BiService {
  /**
   * 1. EXECUTIVE / CEO DASHBOARD
   */
  public getExecutiveDashboard(filters?: DashboardFilterParams) {
    const members = db.getMembers();
    const savingAccounts = db.getSavingAccounts();
    const shareAccounts = db.getShareAccounts();
    const loans = db.getLoans();
    const transactions = db.getFinancialTransactions();
    const coaList = db.getChartOfAccounts();

    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 1. Member KPIs
    const totalMembers = members.length;
    const activeMembers = members.filter((m) => m.status === 'ACTIVE').length;
    const newMembersThisMonth = members.filter(
      (m) => m.createdAt && m.createdAt.startsWith(currentYearMonth)
    ).length;
    const suspendedMembers = members.filter((m) => m.status === 'SUSPENDED').length;

    // 2. Savings KPIs
    const totalSavingsBalance = savingAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const savingsTarget = 60000000; // ETB 60M target
    const savingsGrowthMonth = savingAccounts.reduce((sum, acc) => {
      if (acc.createdAt && acc.createdAt.startsWith(currentYearMonth)) {
        return sum + (acc.balance || 0);
      }
      return sum;
    }, 0);

    // 3. Share Capital KPIs
    const totalShareCapital = shareAccounts.reduce((sum, acc) => sum + (acc.totalShareValue || 0), 0);
    const totalSharesCount = shareAccounts.reduce((sum, acc) => sum + (acc.numberOfShares || 0), 0);
    const shareTarget = 15000000; // ETB 15M target
    const currentSharePrice = 500; // Par value 500 ETB

    // 4. Loan Portfolio & Quality
    const activeLoans = loans.filter((l) =>
      ['ACTIVE', 'DISBURSED', 'OVERDUE', 'AWAITING_GUARANTORS', 'UNDER_REVIEW', 'AWAITING_MANAGER_APPROVAL', 'APPROVED'].includes(l.status)
    );
    const totalOutstandingLoans = loans.reduce((sum, l) => sum + (l.totalOutstanding || 0), 0);
    const totalDisbursedYTD = loans.reduce((sum, l) => sum + (l.approvedAmount || l.requestedAmount || 0), 0);

    // Delinquency & PAR
    const overdueLoans = loans.filter((l) => l.isDelinquent || ['OVERDUE', 'DEFAULTED'].includes(l.status));
    const parAmount = overdueLoans.reduce((sum, l) => sum + (l.totalOutstanding || 0), 0);
    const parRate = totalOutstandingLoans > 0 ? (parAmount / totalOutstandingLoans) * 100 : 0;

    // 5. Liquidity & Financial Health
    const cashAccount = coaList.find((a) => a.accountCode === '1001');
    const cbeAccount = coaList.find((a) => a.accountCode === '1010');
    const tsehayAccount = coaList.find((a) => a.accountCode === '1020');

    const cashInVault = cashAccount?.balance || 0;
    const cbeBankBalance = cbeAccount?.balance || 0;
    const tsehayBankBalance = tsehayAccount?.balance || 0;
    const totalLiquidAssets = cashInVault + cbeBankBalance + tsehayBankBalance;

    // Liquidity Ratio (Liquid Assets / Total Short-term Savings Deposits)
    const liquidityRatio = totalSavingsBalance > 0 ? (totalLiquidAssets / totalSavingsBalance) * 100 : 0;

    // Income Statement figures for YTD
    const incomeStatement = accountingService.getIncomeStatement();
    const netSurplusYTD = incomeStatement.netOperatingSurplus || 0;
    const totalRevenueYTD = incomeStatement.revenue.total || 0;
    const totalExpensesYTD = incomeStatement.totalExpenses || 0;

    // Monthly trends (Last 6 Months)
    const monthlyTrends = this.generateMonthlyTrends(transactions, loans);

    // Portfolio Breakdown by Product
    const portfolioByProduct = this.getLoanPortfolioByProduct(loans);
    const savingsByProduct = this.getSavingsByProduct(savingAccounts);

    return {
      kpi: {
        totalMembers,
        activeMembers,
        newMembersThisMonth,
        suspendedMembers,
        totalSavingsBalance,
        savingsGrowthMonth,
        savingsTargetAchievement: Number(((totalSavingsBalance / savingsTarget) * 100).toFixed(1)),
        totalShareCapital,
        totalSharesCount,
        shareTargetAchievement: Number(((totalShareCapital / shareTarget) * 100).toFixed(1)),
        totalOutstandingLoans,
        totalDisbursedYTD,
        activeLoansCount: activeLoans.length,
        parAmount,
        parRate: Number(parRate.toFixed(2)),
        liquidityRatio: Number(liquidityRatio.toFixed(2)),
        totalLiquidAssets,
        netSurplusYTD,
        totalRevenueYTD,
        totalExpensesYTD,
      },
      liquidity: {
        cashInVault,
        cbeBankBalance,
        tsehayBankBalance,
        totalLiquidAssets,
        liquidityRatio: Number(liquidityRatio.toFixed(2)),
        targetLiquidityRatio: 25.0, // Minimum regulatory requirement 15-20%
      },
      monthlyTrends,
      portfolioByProduct,
      savingsByProduct,
      alerts: this.getExecutiveAlerts(parRate, liquidityRatio, overdueLoans.length),
    };
  }

  /**
   * 2. ACCOUNTANT DASHBOARD
   */
  public getAccountantDashboard() {
    const coaList = db.getChartOfAccounts();
    const journals = db.getJournalEntries();
    const reconciliations = db.getBankReconciliations();
    const budgets = db.getAnnualBudgets();
    const transactions = db.getFinancialTransactions();

    const cashAccount = coaList.find((a) => a.accountCode === '1001');
    const cbeAccount = coaList.find((a) => a.accountCode === '1010');
    const tsehayAccount = coaList.find((a) => a.accountCode === '1020');

    const cashPosition = cashAccount?.balance || 0;
    const bankPosition = (cbeAccount?.balance || 0) + (tsehayAccount?.balance || 0);

    // Unposted or pending items
    const unpostedJournals = journals.filter((j) => j.status === 'DRAFT').length;
    const pendingReconciliations = reconciliations.filter((r) => r.status === 'PENDING').length;
    const pendingJournalEntries = journals.filter((j) => j.status === 'DRAFT').slice(0, 5);

    // Trial Balance Status
    const trialBalance = accountingService.getTrialBalance();
    const totalDebits = trialBalance.totalDebit;
    const totalCredits = trialBalance.totalCredit;
    const trialBalanceBalanced = trialBalance.isBalanced;

    // Budget vs Actual summary
    const currentYear = new Date().getFullYear();
    const activeBudget = budgets.find((b) => b.fiscalYear === currentYear && b.status === 'ACTIVE') || budgets[0];

    // Current Month Revenue & Expenses
    const income = accountingService.getIncomeStatement();
    const monthlyRevenue = Math.round((income.revenue?.total || 0) / 12);
    const monthlyExpenses = Math.round((income.totalExpenses || 0) / 12);

    // Calculate total assets dynamically from Asset accounts in COA
    const totalAssets = coaList
      .filter((a) => a.accountType === 'ASSET')
      .reduce((sum, a) => sum + (a.balance || 0), 0);

    // Recent Transactions
    const recentTransactions = transactions.slice(0, 10).map((t) => ({
      id: t.id,
      transactionNo: t.transactionNo,
      type: t.type,
      amount: t.amount,
      member: t.memberName,
      channel: t.paymentChannel,
      status: t.status,
      timestamp: t.timestamp,
    }));

    return {
      summary: {
        totalAccounts: coaList.length,
        cashPosition,
        bankPosition,
        totalAssets,
        unpostedJournals,
        pendingReconciliations,
        trialBalanceBalanced,
      },
      pendingItems: {
        unpostedJournals,
        pendingReconciliations,
        pendingJournalEntries,
      },
      trialBalance: {
        status: trialBalanceBalanced ? 'BALANCED' : 'OUT_OF_BALANCE',
        isBalanced: trialBalanceBalanced,
        totalDebits,
        totalCredits,
        variance: Math.abs(totalDebits - totalCredits),
      },
      liquidity: {
        cashInVault: cashPosition,
        bankAccounts: bankPosition,
        totalCashPosition: cashPosition + bankPosition,
        cbeBalance: cbeAccount?.balance || 0,
        tsehayBalance: tsehayAccount?.balance || 0,
      },
      financialSummary: {
        monthlyRevenue,
        monthlyExpenses,
        netSurplus: monthlyRevenue - monthlyExpenses,
      },
      recentTransactions,
    };
  }

  /**
   * 3. MANAGER DASHBOARD
   */
  public getManagerDashboard() {
    const loans = db.getLoans();
    const members = db.getMembers();
    const savingAccounts = db.getSavingAccounts();
    const shareAccounts = db.getShareAccounts();
    const approvals = db.getFinancialApprovals();
    const repayments = db.getLoanRepayments();

    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Approvals queue
    const pendingLoanApprovals = loans.filter((l) =>
      ['SUBMITTED', 'UNDER_REVIEW', 'AWAITING_MANAGER_APPROVAL'].includes(l.status)
    ).length;
    const pendingWithdrawalApprovals = approvals.filter(
      (a) => a.status === 'PENDING' && (a.requestType === 'LARGE_WITHDRAWAL' || a.requestType === 'TIME_DEPOSIT_EARLY_LIQUIDATION')
    ).length;
    const pendingReversalApprovals = approvals.filter(
      (a) => a.status === 'PENDING' && a.requestType === 'TRANSACTION_REVERSAL'
    ).length;

    // Portfolio & Risk
    const totalDisbursed = loans.reduce((sum, l) => sum + (l.approvedAmount || l.requestedAmount || 0), 0);
    const outstandingPrincipal = loans
      .filter((l) => ['ACTIVE', 'DISBURSED', 'OVERDUE', 'DEFAULTED'].includes(l.status))
      .reduce((sum, l) => sum + (l.totalOutstanding || 0), 0);

    const delinquentLoans = loans.filter((l) => l.isDelinquent || ['OVERDUE', 'DEFAULTED'].includes(l.status));
    const portfolioAtRiskAmount = delinquentLoans.reduce((sum, l) => sum + (l.totalOutstanding || 0), 0);
    const parRate = outstandingPrincipal > 0 ? (portfolioAtRiskAmount / outstandingPrincipal) * 100 : 0;

    // Defaulters List
    const defaulters = delinquentLoans.map((l) => ({
      loanId: l.id,
      loanNo: l.loanNo,
      memberId: l.memberId,
      membershipNo: l.membershipNo,
      memberName: l.memberName,
      productName: l.productName,
      principal: l.approvedAmount || l.requestedAmount,
      outstanding: l.totalOutstanding,
      daysInArrears: l.daysLate || 45,
      collateralType: 'Savings Guarantee',
      collateralValue: 0,
      guarantorsCount: (l.guarantors || []).length,
    }));

    // Collection performance
    const expectedCollections = loans.reduce(
      (sum, l) => sum + (l.totalPayableAmount || l.approvedAmount || l.requestedAmount || 0),
      0
    );
    const actualCollections = repayments.reduce((sum, r) => sum + (r.amount || 0), 0);
    const collectionRate =
      expectedCollections > 0 ? (actualCollections / expectedCollections) * 100 : 94.5;

    // Growth metrics
    const newMembersThisMonth = members.filter(
      (m) => m.createdAt && m.createdAt.startsWith(currentYearMonth)
    ).length;

    const totalSavings = savingAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const totalShares = shareAccounts.reduce((sum, acc) => sum + (acc.totalShareValue || 0), 0);

    return {
      pendingApprovals: {
        loanApprovals: pendingLoanApprovals,
        withdrawalApprovals: pendingWithdrawalApprovals,
        reversalApprovals: pendingReversalApprovals,
        totalPending:
          pendingLoanApprovals + pendingWithdrawalApprovals + pendingReversalApprovals,
      },
      portfolioOverview: {
        totalDisbursed,
        outstandingPrincipal,
        activeLoansCount: loans.filter((l) =>
          ['ACTIVE', 'DISBURSED'].includes(l.status)
        ).length,
        portfolioAtRiskAmount,
        portfolioAtRiskRate: Number(parRate.toFixed(2)),
        collectionRate: Number(collectionRate.toFixed(2)),
      },
      defaulters,
      growth: {
        newMembersThisMonth,
        totalMembers: members.length,
        totalSavings,
        totalShares,
      },
      pendingLoanList: loans
        .filter((l) => ['SUBMITTED', 'UNDER_REVIEW', 'AWAITING_MANAGER_APPROVAL'].includes(l.status))
        .map((l) => ({
          id: l.id,
          loanNo: l.loanNo,
          memberName: l.memberName,
          membershipNo: l.membershipNo,
          productName: l.productName,
          amount: l.approvedAmount || l.requestedAmount,
          termMonths: l.approvedTermMonths || l.requestedTermMonths,
          monthlyInstallment: l.monthlyInstallmentAmount || 0,
          appliedDate: l.createdAt,
          dtiRatio: 28.5,
          approvalStatus: l.status,
        })),
    };
  }

  /**
   * 4. AUDITOR DASHBOARD
   */
  public getAuditorDashboard() {
    const auditLogs = db.getAuditLogs();
    const transactions = db.getFinancialTransactions();
    const reversals = transactions.filter((t) => t.type === 'REVERSAL' || t.status === 'REVERSED');
    const loans = db.getLoans();
    const periods = db.getAccountingPeriods();

    // High risk transactions
    const highRiskThreshold = 100000;
    const largeWithdrawals = transactions.filter(
      (t) => t.type === 'WITHDRAWAL' && t.amount >= highRiskThreshold
    );
    const largeDeposits = transactions.filter(
      (t) => t.type === 'DEPOSIT' && t.amount >= 200000
    );

    // Permission and role changes
    const permissionChanges = auditLogs.filter(
      (log) =>
        log.action.includes('PERMISSION') ||
        log.action.includes('ROLE') ||
        log.action.includes('PASSWORD') ||
        log.action.includes('LOCK')
    );

    // Loan approvals by manager
    const approvedLoans = loans
      .filter((l) => l.status === 'ACTIVE' || l.status === 'DISBURSED' || l.approvedById)
      .slice(0, 10);

    // Accounting Exceptions (locked periods)
    const lockedPeriods = periods.filter((p) => p.status === 'LOCKED');

    return {
      summary: {
        totalAuditEvents: auditLogs.length,
        totalSecurityEvents: auditLogs.filter((a) => a.action.includes('SECURITY') || a.result === 'FAILURE').length,
        reversalsCount: reversals.length,
        highRiskTransactionsCount: largeWithdrawals.length + largeDeposits.length,
        permissionChangesCount: permissionChanges.length,
        lockedAccountingPeriods: lockedPeriods.length,
      },
      recentAuditEvents: auditLogs.slice(0, 15).map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.resource,
        entityId: log.resourceId,
        performedBy: log.actorName || log.actorId,
        ipAddress: log.ipAddress,
        status: log.result,
        timestamp: log.timestamp,
        details: log.afterState ? JSON.stringify(log.afterState) : '',
      })),
      journalReversals: reversals.map((r) => ({
        id: r.id,
        transactionNo: r.transactionNo,
        member: r.memberName,
        amount: r.amount,
        narration: r.narration,
        channel: r.paymentChannel,
        timestamp: r.timestamp,
      })),
      highRiskTransactions: [...largeWithdrawals, ...largeDeposits].slice(0, 10).map((t) => ({
        id: t.id,
        transactionNo: t.transactionNo,
        member: t.memberName,
        type: t.type,
        amount: t.amount,
        channel: t.paymentChannel,
        referenceNo: t.bankReferenceNo,
        timestamp: t.timestamp,
        riskReason:
          t.type === 'WITHDRAWAL'
            ? 'High value withdrawal (> ETB 100k)'
            : 'Large cash deposit (> ETB 200k)',
      })),
      permissionChanges: permissionChanges.slice(0, 10),
      recentLoanApprovals: approvedLoans.map((l) => ({
        id: l.id,
        loanNo: l.loanNo,
        member: l.memberName,
        amount: l.approvedAmount || l.requestedAmount,
        approvedBy: l.approvedByName || l.approvedById || 'System',
        approvedAt: l.approvedAt || l.createdAt,
      })),
    };
  }

  /**
   * 5. CUSTOMER SERVICE DASHBOARD
   */
  public getCustomerServiceDashboard() {
    const registrationRequests = db.getRegistrationRequests();
    const members = db.getMembers();

    const pendingRegistrations = registrationRequests.filter(
      (r) => r.status === 'PENDING'
    );
    const rejectedRegistrations = registrationRequests.filter((r) => r.status === 'REJECTED');
    const approvedRegistrations = registrationRequests.filter((r) => r.status === 'APPROVED');

    return {
      summary: {
        totalMembers: members.length,
        activeMembers: members.filter((m) => m.status === 'ACTIVE').length,
        pendingRegistrations: pendingRegistrations.length,
        rejectedReceipts: rejectedRegistrations.length,
        approvedRegistrations: approvedRegistrations.length,
        totalNotificationsSent: 154,
      },
      pendingRegistrationsList: pendingRegistrations.slice(0, 10).map((r) => ({
        id: r.id,
        requestNo: r.applicationReference,
        fullName: r.personalInfo?.fullName || 'Prospective Member',
        phone: r.contactInfo?.phoneNumber || 'N/A',
        email: r.contactInfo?.email || 'N/A',
        submittedAt: r.personalInfo?.dateOfBirth || new Date().toISOString(),
        status: r.status,
        receiptUploaded: true,
      })),
      rejectedReceiptsList: rejectedRegistrations.slice(0, 10).map((r) => ({
        id: r.id,
        requestNo: r.applicationReference,
        fullName: r.personalInfo?.fullName || 'Prospective Member',
        phone: r.contactInfo?.phoneNumber || 'N/A',
        rejectionReason: 'Receipt unreadable or deposit amount does not match',
        rejectedAt: new Date().toISOString(),
      })),
      recentNotifications: [],
    };
  }

  /**
   * 6. MEMBER DASHBOARD (For logged in member)
   */
  public getMemberDashboard(memberIdOrNo: string) {
    const member = db.getMemberById(memberIdOrNo);
    if (!member) {
      throw new Error(`Member not found with ID/No: ${memberIdOrNo}`);
    }

    const savingAccounts = db.getSavingAccountsByMemberId(member.id);
    const shareAccounts = db.getShareAccounts().filter((s) => s.memberId === member.id);
    const loans = db.getLoansByMemberId(member.id);
    const transactions = db.getFinancialTransactions().filter((t) => t.memberId === member.id);
    const notifications = db.getNotifications(member.id);
    const schedules = db.getMonthlySavingsSchedules().filter((s) => s.memberId === member.id);

    // Balances
    const totalSavings = savingAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);
    const savingsByProduct = savingAccounts.map((a) => ({
      accountNo: a.accountNo,
      productCode: a.productCode,
      productName: a.productName,
      balance: a.balance,
      interestRate: 6.0,
      status: a.status,
    }));

    const totalShares = shareAccounts.reduce((sum, a) => sum + (a.numberOfShares || 0), 0);
    const totalShareValue = shareAccounts.reduce((sum, a) => sum + (a.totalShareValue || 0), 0);

    // Active loan & next payment
    const activeLoans = loans.filter((l) =>
      ['ACTIVE', 'DISBURSED', 'OVERDUE'].includes(l.status)
    );
    const totalOutstandingLoan = activeLoans.reduce((sum, l) => sum + (l.totalOutstanding || 0), 0);

    let nextLoanPayment = null;
    if (activeLoans.length > 0) {
      const primaryLoan = activeLoans[0];
      nextLoanPayment = {
        loanNo: primaryLoan.loanNo,
        dueDate: primaryLoan.nextInstallmentDate || new Date().toISOString().split('T')[0],
        installmentAmount: primaryLoan.monthlyInstallmentAmount || 0,
        principal: (primaryLoan.monthlyInstallmentAmount || 0) * 0.8,
        interest: (primaryLoan.monthlyInstallmentAmount || 0) * 0.2,
        installmentNo: (primaryLoan.paidInstallmentsCount || 0) + 1,
      };
    }

    // Monthly savings status (Compulsory schedule)
    const currentMonthSchedule = schedules.find(
      (s) => s.yearMonth === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    );

    const monthlySavingStatus = {
      period: currentMonthSchedule?.yearMonth || 'Current Month',
      expectedAmount: currentMonthSchedule?.expectedAmount || 500,
      paidAmount: currentMonthSchedule?.actualDeposited || 500,
      status: currentMonthSchedule?.status || 'MET',
      dueDate: `${new Date().toISOString().split('T')[0]}`,
    };

    // Digital passbook recent entries
    const digitalPassbook = transactions.slice(0, 10).map((t) => ({
      id: t.id,
      transactionNo: t.transactionNo,
      date: t.timestamp,
      type: t.type,
      product: t.productCode,
      narration: t.narration,
      debit: t.type === 'WITHDRAWAL' ? t.amount : 0,
      credit: t.type === 'DEPOSIT' || t.type === 'INTEREST_POSTING' ? t.amount : 0,
      balance: t.balanceAfter,
      channel: t.paymentChannel,
    }));

    return {
      member: {
        id: member.id,
        membershipNo: member.membershipNo,
        fullName: member.fullName,
        phone: member.phoneNumber,
        email: member.email,
        status: member.status,
        memberSince: member.membershipDate || member.createdAt,
      },
      summary: {
        totalSavings,
        totalShares,
        totalShareValue,
        totalOutstandingLoan,
        activeLoansCount: activeLoans.length,
      },
      savingsByProduct,
      shares: {
        totalShares,
        shareValue: totalShareValue,
        certificateNo: shareAccounts[0]?.certificateNumber || 'N/A',
      },
      activeLoans: activeLoans.map((l) => ({
        loanNo: l.loanNo,
        product: l.productName,
        approvedAmount: l.approvedAmount || l.requestedAmount,
        outstanding: l.totalOutstanding,
        nextPaymentDate: l.nextInstallmentDate,
        monthlyInstallment: l.monthlyInstallmentAmount,
        status: l.status,
      })),
      nextLoanPayment,
      monthlySavingStatus,
      digitalPassbook,
      unreadNotifications: notifications.filter((n) => !n.isRead).length,
    };
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  private generateMonthlyTrends(
    transactions: any[],
    loans: any[]
  ): MonthlyFinancialTrendPoint[] {
    const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    const currentYear = new Date().getFullYear();

    return months.map((m, idx) => {
      const monthNum = idx + 3;
      const yearMonth = `${currentYear}-${String(monthNum).padStart(2, '0')}`;

      // Aggregate real transactions for that month
      const monthTxns = transactions.filter((t) => t.timestamp && t.timestamp.startsWith(yearMonth));
      const deposits = monthTxns.filter((t) => t.type === 'DEPOSIT').reduce((sum, t) => sum + (t.amount || 0), 0);
      const withdrawals = monthTxns.filter((t) => t.type === 'WITHDRAWAL').reduce((sum, t) => sum + (t.amount || 0), 0);

      const monthLoans = loans.filter((l) => l.disbursementDate && l.disbursementDate.startsWith(yearMonth));
      const loansDisbursed = monthLoans.reduce((sum, l) => sum + (l.approvedAmount || l.amount || 0), 0);
      const loansRepaid = monthTxns.filter((t) => t.type === 'LOAN_REPAYMENT').reduce((sum, t) => sum + (t.amount || 0), 0);
      const interestIncome = monthTxns.filter((t) => t.type === 'INTEREST_CREDIT' || t.type === 'FEE').reduce((sum, t) => sum + (t.amount || 0), 0);
      const operatingExpenses = monthTxns.filter((t) => t.type === 'EXPENSE').reduce((sum, t) => sum + (t.amount || 0), 0);

      return {
        month: m,
        savingsDeposit: deposits,
        savingsWithdrawal: withdrawals,
        netSavings: deposits - withdrawals,
        loansDisbursed,
        loansRepaid,
        interestIncome,
        operatingExpenses,
        netSurplus: interestIncome - operatingExpenses,
      };
    });
  }

  private getLoanPortfolioByProduct(loans: any[]) {
    const products = [
      { name: 'Emergency Loan', code: 'LN_EMERGENCY', color: '#10B981' },
      { name: 'Business Expansion', code: 'LN_BUSINESS', color: '#3B82F6' },
      { name: 'Agricultural Loan', code: 'LN_AGRI', color: '#F59E0B' },
      { name: 'Asset Financing', code: 'LN_ASSET', color: '#8B5CF6' },
      { name: 'Personal / Consumer', code: 'LN_PERSONAL', color: '#EC4899' },
    ];

    return products.map((p) => {
      const pLoans = loans.filter((l) => l.productCode === p.code || l.productId === p.code);
      const amount = pLoans.reduce((sum, l) => sum + (l.totalOutstanding || l.approvedAmount || 0), 0);
      return {
        name: p.name,
        code: p.code,
        value: amount,
        count: pLoans.length,
        color: p.color,
      };
    });
  }

  private getSavingsByProduct(savings: any[]) {
    const products = [
      { name: 'Compulsory Regular', code: 'REGULAR', color: '#0EA5E9' },
      { name: 'Voluntary Savings', code: 'VOLUNTARY', color: '#14B8A6' },
      { name: 'Children Savings', code: 'CHILDREN', color: '#F97316' },
      { name: 'Time Deposits', code: 'TIME_DEPOSIT', color: '#6366F1' },
    ];

    return products.map((p) => {
      const pAccounts = savings.filter((a) => a.productCode === p.code);
      const balance = pAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);
      return {
        name: p.name,
        code: p.code,
        value: balance,
        count: pAccounts.length,
        color: p.color,
      };
    });
  }

  private getExecutiveAlerts(parRate: number, liquidityRatio: number, overdueCount: number) {
    const alerts: Array<{ type: 'WARNING' | 'CRITICAL' | 'INFO'; message: string; metric: string }> = [];

    if (parRate > 5.0) {
      alerts.push({
        type: 'CRITICAL',
        message: `Portfolio at Risk (PAR) is at ${parRate.toFixed(1)}%, exceeding the 5.0% regulatory ceiling. Immediate recovery action required on ${overdueCount} delinquent loans.`,
        metric: 'PAR > 5.0%',
      });
    } else {
      alerts.push({
        type: 'INFO',
        message: `PAR rate is healthy at ${parRate.toFixed(1)}% (prudential limit is 5.0%).`,
        metric: 'PAR Compliant',
      });
    }

    if (liquidityRatio < 20.0) {
      alerts.push({
        type: 'WARNING',
        message: `SACCO Liquidity Ratio is ${liquidityRatio.toFixed(1)}%, near the minimum statutory safety threshold of 20%.`,
        metric: 'Liquidity Near Minimum',
      });
    } else {
      alerts.push({
        type: 'INFO',
        message: `Liquid reserves are strong with a liquidity coverage ratio of ${liquidityRatio.toFixed(1)}%.`,
        metric: 'Liquidity Robust',
      });
    }

    return alerts;
  }
}

export const biService = new BiService();
