import { db } from '../db/database';
import { accountingService } from './accountingService';

export interface ReportFilterParams {
  startDate?: string;
  endDate?: string;
  memberId?: string;
  membershipNo?: string;
  savingType?: string;
  loanType?: string;
  shareType?: string;
  transactionType?: string;
  status?: string;
  paymentMethod?: string;
  minAmount?: number;
  maxAmount?: number;
  accountCode?: string;
  officer?: string;
  branch?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ReportResult<T = any> {
  reportType: string;
  title: string;
  description: string;
  generatedAt: string;
  generatedBy?: string;
  filters: ReportFilterParams;
  summary: Record<string, any>;
  columns: Array<{ key: string; label: string; type?: 'currency' | 'number' | 'date' | 'badge' | 'text' }>;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

class ReportService {
  /**
   * Main Dispatcher for all 25+ Reports
   */
  public generateReport(reportType: string, filters: ReportFilterParams = {}, user?: any): ReportResult {
    switch (reportType.toLowerCase()) {
      case 'member':
        return this.getMemberReport(filters, user);
      case 'savings':
      case 'savings_all':
        return this.getSavingsReport(filters, user);
      case 'savings_regular':
        return this.getSavingsByProductReport('SAV_REGULAR', 'Regular Compulsory Savings Report', filters, user);
      case 'savings_voluntary':
        return this.getSavingsByProductReport('SAV_VOLUNTARY', 'Voluntary Savings Report', filters, user);
      case 'savings_children':
        return this.getSavingsByProductReport('SAV_CHILDREN', 'Children Savings Scheme Report', filters, user);
      case 'savings_time_deposit':
        return this.getSavingsByProductReport('SAV_TIME_DEPOSIT', 'Time Deposit Certificate Report', filters, user);
      case 'share':
      case 'shares':
        return this.getShareReport(filters, user);
      case 'loan':
      case 'loans':
        return this.getLoanReport(filters, user);
      case 'repayment':
      case 'loan_repayment':
        return this.getLoanRepaymentReport(filters, user);
      case 'outstanding_loan':
      case 'loan_outstanding':
        return this.getOutstandingLoanReport(filters, user);
      case 'defaulter':
      case 'loan_defaulter':
        return this.getDefaulterReport(filters, user);
      case 'loan_aging':
      case 'par':
        return this.getLoanAgingReport(filters, user);
      case 'income_statement':
        return this.getIncomeStatementReport(filters, user);
      case 'balance_sheet':
        return this.getBalanceSheetReport(filters, user);
      case 'cash_flow':
        return this.getCashFlowStatementReport(filters, user);
      case 'trial_balance':
        return this.getTrialBalanceReport(filters, user);
      case 'general_ledger':
        return this.getGeneralLedgerReport(filters, user);
      case 'journal':
      case 'journal_entry':
        return this.getJournalReport(filters, user);
      case 'transaction':
      case 'financial_transaction':
        return this.getTransactionReport(filters, user);
      case 'withdrawal':
        return this.getWithdrawalReport(filters, user);
      case 'deposit':
        return this.getDepositReport(filters, user);
      case 'interest':
        return this.getInterestReport(filters, user);
      case 'budget':
        return this.getBudgetReport(filters, user);
      case 'variance':
        return this.getBudgetVarianceReport(filters, user);
      case 'audit':
        return this.getAuditReport(filters, user);
      case 'user_activity':
        return this.getUserActivityReport(filters, user);
      default:
        throw new Error(`Unrecognized report type: '${reportType}'`);
    }
  }

  // ==========================================
  // 1. MEMBER REPORT
  // ==========================================
  public getMemberReport(filters: ReportFilterParams, user?: any): ReportResult {
    let members = db.getMembers();

    if (filters.startDate) members = members.filter((m) => m.createdAt >= filters.startDate!);
    if (filters.endDate) members = members.filter((m) => m.createdAt <= `${filters.endDate!}T23:59:59Z`);
    if (filters.status) members = members.filter((m) => m.status === filters.status);
    if (filters.membershipNo) {
      members = members.filter((m) =>
        m.membershipNo.toLowerCase().includes(filters.membershipNo!.toLowerCase())
      );
    }

    const totalCount = members.length;
    const activeCount = members.filter((m) => m.status === 'ACTIVE').length;
    const suspendedCount = members.filter((m) => m.status === 'SUSPENDED').length;
    const pendingCount = members.filter((m) => m.status === 'PENDING').length;

    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 25;
    const pagedData = members.slice((page - 1) * limit, page * limit).map((m) => ({
      id: m.id,
      membershipNo: m.membershipNo,
      fullName: m.fullName,
      gender: m.gender || 'N/A',
      phone: m.phoneNumber,
      email: m.email,
      status: m.status,
      monthlyIncome: m.monthlyIncome || 0,
      monthlyCompulsorySavings: 500,
      joinDate: m.membershipDate || m.createdAt,
    }));

    return {
      reportType: 'member',
      title: 'SACCO Member Master Directory Report',
      description: 'Comprehensive listing of registered SACCO members, status, and compulsory contribution commitments.',
      generatedAt: new Date().toISOString(),
      generatedBy: user?.name || user?.fullName || 'Authorized Staff',
      filters,
      summary: {
        totalMembers: totalCount,
        activeMembers: activeCount,
        suspendedMembers: suspendedCount,
        pendingMembers: pendingCount,
      },
      columns: [
        { key: 'membershipNo', label: 'Membership No', type: 'text' },
        { key: 'fullName', label: 'Full Name', type: 'text' },
        { key: 'gender', label: 'Gender', type: 'text' },
        { key: 'phone', label: 'Phone', type: 'text' },
        { key: 'monthlyCompulsorySavings', label: 'Monthly Saving', type: 'currency' },
        { key: 'status', label: 'Status', type: 'badge' },
        { key: 'joinDate', label: 'Member Since', type: 'date' },
      ],
      data: pagedData,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    };
  }

  // ==========================================
  // 2. SAVINGS REPORT (ALL & BY PRODUCT)
  // ==========================================
  public getSavingsReport(filters: ReportFilterParams, user?: any): ReportResult {
    let accounts = db.getSavingAccounts();

    if (filters.memberId) accounts = accounts.filter((a) => a.memberId === filters.memberId);
    if (filters.savingType) accounts = accounts.filter((a) => a.productCode === filters.savingType);
    if (filters.status) accounts = accounts.filter((a) => a.status === filters.status);
    if (filters.minAmount !== undefined) accounts = accounts.filter((a) => a.balance >= Number(filters.minAmount));
    if (filters.maxAmount !== undefined) accounts = accounts.filter((a) => a.balance <= Number(filters.maxAmount));

    const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
    const totalCount = accounts.length;
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 25;

    const pagedData = accounts.slice((page - 1) * limit, page * limit).map((a) => ({
      id: a.id,
      accountNo: a.accountNo,
      membershipNo: a.membershipNo,
      memberName: a.memberName,
      productName: a.productName,
      productCode: a.productCode,
      balance: a.balance,
      interestRate: 6.0,
      accruedInterest: a.accruedInterest || 0,
      status: a.status,
      openedAt: a.createdAt,
    }));

    return {
      reportType: 'savings',
      title: 'Institutional Savings Portfolio Report',
      description: 'Breakdown of active, dormant, and locked member savings accounts across all deposit products.',
      generatedAt: new Date().toISOString(),
      generatedBy: user?.name || user?.fullName || 'Authorized Staff',
      filters,
      summary: {
        totalAccounts: totalCount,
        totalSavingsBalance: totalBalance,
        averageBalance: totalCount > 0 ? totalBalance / totalCount : 0,
      },
      columns: [
        { key: 'accountNo', label: 'Account No', type: 'text' },
        { key: 'membershipNo', label: 'Member No', type: 'text' },
        { key: 'memberName', label: 'Member Name', type: 'text' },
        { key: 'productName', label: 'Savings Product', type: 'text' },
        { key: 'interestRate', label: 'Rate (%)', type: 'number' },
        { key: 'balance', label: 'Current Balance', type: 'currency' },
        { key: 'status', label: 'Status', type: 'badge' },
      ],
      data: pagedData,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    };
  }

  public getSavingsByProductReport(
    productCode: string,
    title: string,
    filters: ReportFilterParams,
    user?: any
  ): ReportResult {
    return this.getSavingsReport({ ...filters, savingType: productCode }, user);
  }

  // ==========================================
  // 3. SHARE CAPITAL REPORT
  // ==========================================
  public getShareReport(filters: ReportFilterParams, user?: any): ReportResult {
    let shareAccounts = db.getShareAccounts();

    if (filters.memberId) shareAccounts = shareAccounts.filter((s) => s.memberId === filters.memberId);
    if (filters.status) shareAccounts = shareAccounts.filter((s) => s.status === filters.status);

    const totalShares = shareAccounts.reduce((sum, s) => sum + (s.numberOfShares || 0), 0);
    const totalCapital = shareAccounts.reduce((sum, s) => sum + (s.totalShareValue || 0), 0);
    const totalCount = shareAccounts.length;
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 25;

    const pagedData = shareAccounts.slice((page - 1) * limit, page * limit).map((s) => ({
      id: s.id,
      accountNo: s.accountNo,
      membershipNo: s.membershipNo,
      memberName: s.memberName,
      totalShares: s.numberOfShares,
      parValue: s.sharePrice || 500,
      totalValue: s.totalShareValue,
      certificateNumber: s.certificateNumber || 'N/A',
      status: s.status,
      openedAt: s.createdAt,
    }));

    return {
      reportType: 'share',
      title: 'Institutional Share Capital & Equity Registry Report',
      description: 'Member equity participation, paid-up shares, nominal value, and certificate registration.',
      generatedAt: new Date().toISOString(),
      generatedBy: user?.name || user?.fullName || 'Authorized Staff',
      filters,
      summary: {
        totalShareholders: totalCount,
        totalSharesIssued: totalShares,
        totalPaidUpCapital: totalCapital,
        parValuePerShare: 500,
      },
      columns: [
        { key: 'accountNo', label: 'Share Account', type: 'text' },
        { key: 'membershipNo', label: 'Member No', type: 'text' },
        { key: 'memberName', label: 'Member Name', type: 'text' },
        { key: 'totalShares', label: 'Total Shares', type: 'number' },
        { key: 'totalValue', label: 'Equity Value', type: 'currency' },
        { key: 'status', label: 'Status', type: 'badge' },
      ],
      data: pagedData,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    };
  }

  // ==========================================
  // 4. LOAN & DELINQUENCY REPORTS
  // ==========================================
  public getLoanReport(filters: ReportFilterParams, user?: any): ReportResult {
    let loans = db.getLoans();

    if (filters.startDate) loans = loans.filter((l) => l.createdAt >= filters.startDate!);
    if (filters.endDate) loans = loans.filter((l) => l.createdAt <= `${filters.endDate!}T23:59:59Z`);
    if (filters.loanType) loans = loans.filter((l) => l.productCode === filters.loanType);
    if (filters.status) loans = loans.filter((l) => l.status === filters.status);
    if (filters.memberId) loans = loans.filter((l) => l.memberId === filters.memberId);

    const totalPrincipal = loans.reduce((sum, l) => sum + (l.approvedAmount || l.requestedAmount || 0), 0);
    const totalRemaining = loans.reduce((sum, l) => sum + (l.totalOutstanding || 0), 0);
    const totalCount = loans.length;
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 25;

    const pagedData = loans.slice((page - 1) * limit, page * limit).map((l) => ({
      id: l.id,
      loanNo: l.loanNo,
      membershipNo: l.membershipNo,
      memberName: l.memberName,
      productName: l.productName,
      principalAmount: l.approvedAmount || l.requestedAmount,
      interestRate: l.interestRate,
      termMonths: l.approvedTermMonths || l.requestedTermMonths,
      monthlyInstallment: l.monthlyInstallmentAmount || 0,
      remainingBalance: l.totalOutstanding,
      status: l.status,
      disbursedAt: l.disbursementDetails?.disbursedAt || l.createdAt,
    }));

    return {
      reportType: 'loan',
      title: 'Loan Portfolio & Disbursement Master Report',
      description: 'Detailed record of loan disbursements, repayment terms, interest rates, and loan balances.',
      generatedAt: new Date().toISOString(),
      generatedBy: user?.name || user?.fullName || 'Authorized Staff',
      filters,
      summary: {
        totalLoans: totalCount,
        totalDisbursedPrincipal: totalPrincipal,
        totalOutstandingBalance: totalRemaining,
      },
      columns: [
        { key: 'loanNo', label: 'Loan No', type: 'text' },
        { key: 'membershipNo', label: 'Member No', type: 'text' },
        { key: 'memberName', label: 'Member Name', type: 'text' },
        { key: 'productName', label: 'Loan Product', type: 'text' },
        { key: 'principalAmount', label: 'Principal', type: 'currency' },
        { key: 'remainingBalance', label: 'Remaining', type: 'currency' },
        { key: 'status', label: 'Status', type: 'badge' },
      ],
      data: pagedData,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    };
  }

  public getLoanRepaymentReport(filters: ReportFilterParams, user?: any): ReportResult {
    let repayments = db.getLoanRepayments();

    if (filters.startDate) repayments = repayments.filter((r) => r.timestamp >= filters.startDate!);
    if (filters.endDate) repayments = repayments.filter((r) => r.timestamp <= `${filters.endDate!}T23:59:59Z`);
    if (filters.memberId) repayments = repayments.filter((r) => r.memberId === filters.memberId);
    if (filters.paymentMethod) repayments = repayments.filter((r) => r.paymentChannel === filters.paymentMethod);

    const totalCollected = repayments.reduce((sum, r) => sum + (r.amount || 0), 0);
    const totalPrincipal = repayments.reduce((sum, r) => sum + (r.principalPaid || 0), 0);
    const totalInterest = repayments.reduce((sum, r) => sum + (r.interestPaid || 0), 0);
    const totalCount = repayments.length;

    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 25;
    const pagedData = repayments.slice((page - 1) * limit, page * limit).map((r) => ({
      id: r.id,
      repaymentNo: r.repaymentNo,
      loanNo: r.loanNo,
      membershipNo: r.membershipNo,
      memberName: r.memberName,
      amount: r.amount,
      principalPaid: r.principalPaid,
      interestPaid: r.interestPaid,
      penaltyPaid: r.penaltyPaid || 0,
      paymentChannel: r.paymentChannel,
      referenceNo: r.bankReferenceNo || 'N/A',
      timestamp: r.timestamp,
    }));

    return {
      reportType: 'loan_repayment',
      title: 'Loan Repayment & Collection Ledger Report',
      description: 'Audit log of loan principal recoveries, interest earnings, penalty collections, and settlement channels.',
      generatedAt: new Date().toISOString(),
      generatedBy: user?.name || user?.fullName || 'Authorized Staff',
      filters,
      summary: {
        totalTransactions: totalCount,
        totalAmountCollected: totalCollected,
        principalRecovered: totalPrincipal,
        interestYieldEarned: totalInterest,
      },
      columns: [
        { key: 'repaymentNo', label: 'Repayment Ref', type: 'text' },
        { key: 'loanNo', label: 'Loan No', type: 'text' },
        { key: 'memberName', label: 'Member Name', type: 'text' },
        { key: 'principalPaid', label: 'Principal', type: 'currency' },
        { key: 'interestPaid', label: 'Interest', type: 'currency' },
        { key: 'amount', label: 'Total Paid', type: 'currency' },
        { key: 'paymentChannel', label: 'Channel', type: 'badge' },
        { key: 'timestamp', label: 'Date', type: 'date' },
      ],
      data: pagedData,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    };
  }

  public getOutstandingLoanReport(filters: ReportFilterParams, user?: any): ReportResult {
    return this.getLoanReport({ ...filters, status: 'ACTIVE' }, user);
  }

  public getDefaulterReport(filters: ReportFilterParams, user?: any): ReportResult {
    const loans = db.getLoans().filter((l) => ['OVERDUE', 'DEFAULTED'].includes(l.status) || l.isDelinquent);
    const totalOutstanding = loans.reduce((sum, l) => sum + (l.totalOutstanding || 0), 0);
    const totalCount = loans.length;

    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 25;
    const pagedData = loans.slice((page - 1) * limit, page * limit).map((l) => ({
      id: l.id,
      loanNo: l.loanNo,
      membershipNo: l.membershipNo,
      memberName: l.memberName,
      productName: l.productName,
      principal: l.approvedAmount || l.requestedAmount,
      remainingBalance: l.totalOutstanding,
      daysInArrears: l.daysLate || 60,
      guarantorsCount: (l.guarantors || []).length,
      status: l.status,
    }));

    return {
      reportType: 'loan_defaulter',
      title: 'Delinquent Loans & Defaulter Registry Report',
      description: 'Identification of non-performing loans, overdue installments, collateral values, and recovery risks.',
      generatedAt: new Date().toISOString(),
      generatedBy: user?.name || user?.fullName || 'Authorized Staff',
      filters,
      summary: {
        totalDefaulters: totalCount,
        totalDefaultedAmount: totalOutstanding,
      },
      columns: [
        { key: 'loanNo', label: 'Loan No', type: 'text' },
        { key: 'membershipNo', label: 'Member No', type: 'text' },
        { key: 'memberName', label: 'Member Name', type: 'text' },
        { key: 'daysInArrears', label: 'Days Overdue', type: 'number' },
        { key: 'remainingBalance', label: 'Overdue Balance', type: 'currency' },
        { key: 'status', label: 'Status', type: 'badge' },
      ],
      data: pagedData,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    };
  }

  public getLoanAgingReport(filters: ReportFilterParams, user?: any): ReportResult {
    const loans = db.getLoans().filter((l) =>
      ['ACTIVE', 'DISBURSED', 'OVERDUE', 'DEFAULTED'].includes(l.status)
    );

    let par0 = 0; // Current (0-30 days)
    let par30 = 0; // 31-60 days
    let par60 = 0; // 61-90 days
    let par90 = 0; // 91-180 days (Substandard/Doubtful)
    let par180 = 0; // >180 days (Loss/Default)

    loans.forEach((l) => {
      const days = l.daysLate || 0;
      const bal = l.totalOutstanding || 0;
      if (days <= 30) par0 += bal;
      else if (days <= 60) par30 += bal;
      else if (days <= 90) par60 += bal;
      else if (days <= 180) par90 += bal;
      else par180 += bal;
    });

    const totalPortfolio = par0 + par30 + par60 + par90 + par180;
    const parTotalAtRisk = par30 + par60 + par90 + par180;
    const parRate = totalPortfolio > 0 ? (parTotalAtRisk / totalPortfolio) * 100 : 0;

    const data = [
      {
        bracket: 'Pass / Current (0 - 30 Days)',
        days: '0 - 30',
        amount: par0,
        percentage: totalPortfolio > 0 ? (par0 / totalPortfolio) * 100 : 100,
        nbeProvisionRate: 1, // 1%
        requiredProvision: par0 * 0.01,
        riskLevel: 'LOW',
      },
      {
        bracket: 'Special Mention (31 - 60 Days)',
        days: '31 - 60',
        amount: par30,
        percentage: totalPortfolio > 0 ? (par30 / totalPortfolio) * 100 : 0,
        nbeProvisionRate: 5, // 5%
        requiredProvision: par30 * 0.05,
        riskLevel: 'MEDIUM',
      },
      {
        bracket: 'Substandard (61 - 90 Days)',
        days: '61 - 90',
        amount: par60,
        percentage: totalPortfolio > 0 ? (par60 / totalPortfolio) * 100 : 0,
        nbeProvisionRate: 20, // 20%
        requiredProvision: par60 * 0.2,
        riskLevel: 'HIGH',
      },
      {
        bracket: 'Doubtful (91 - 180 Days)',
        days: '91 - 180',
        amount: par90,
        percentage: totalPortfolio > 0 ? (par90 / totalPortfolio) * 100 : 0,
        nbeProvisionRate: 50, // 50%
        requiredProvision: par90 * 0.5,
        riskLevel: 'CRITICAL',
      },
      {
        bracket: 'Loss / Default (> 180 Days)',
        days: '> 180',
        amount: par180,
        percentage: totalPortfolio > 0 ? (par180 / totalPortfolio) * 100 : 0,
        nbeProvisionRate: 100, // 100%
        requiredProvision: par180 * 1.0,
        riskLevel: 'LOSS',
      },
    ];

    const totalProvisionRequired = data.reduce((sum, item) => sum + item.requiredProvision, 0);

    return {
      reportType: 'loan_aging',
      title: 'Portfolio at Risk (PAR) & Loan Aging Schedule',
      description: 'Prudential loan aging classification and National Bank of Ethiopia loan loss provisioning requirement.',
      generatedAt: new Date().toISOString(),
      generatedBy: user?.name || user?.fullName || 'Authorized Staff',
      filters,
      summary: {
        totalGrossPortfolio: totalPortfolio,
        portfolioAtRiskAmount: parTotalAtRisk,
        portfolioAtRiskRate: Number(parRate.toFixed(2)),
        totalLoanLossProvisionRequired: totalProvisionRequired,
      },
      columns: [
        { key: 'bracket', label: 'Aging Classification', type: 'text' },
        { key: 'amount', label: 'Outstanding Balance', type: 'currency' },
        { key: 'percentage', label: 'Portfolio Share (%)', type: 'number' },
        { key: 'nbeProvisionRate', label: 'NBE Provision (%)', type: 'number' },
        { key: 'requiredProvision', label: 'Required Reserve', type: 'currency' },
        { key: 'riskLevel', label: 'Risk Rating', type: 'badge' },
      ],
      data,
      pagination: {
        page: 1,
        limit: 10,
        totalCount: data.length,
        totalPages: 1,
      },
    };
  }

  // ==========================================
  // 5. ACCOUNTING & FINANCIAL STATEMENTS
  // ==========================================
  public getIncomeStatementReport(filters: ReportFilterParams, user?: any): ReportResult {
    const sDate = filters.startDate || `${new Date().getFullYear()}-01-01`;
    const eDate = filters.endDate || new Date().toISOString().split('T')[0];

    const income = accountingService.getIncomeStatement(sDate, eDate);

    const items: Array<{ category: string; item: string; amount: number }> = [];

    // Revenue lines
    income.revenue.items.forEach((item) => {
      items.push({ category: 'Revenue', item: `${item.code} - ${item.name}`, amount: item.amount });
    });
    items.push({ category: 'Revenue Subtotal', item: 'Total Operational Revenue', amount: income.revenue.total });

    // Cost of funds
    income.costOfFunds.items.forEach((item) => {
      items.push({ category: 'Cost of Funds', item: `${item.code} - ${item.name}`, amount: item.amount });
    });
    items.push({ category: 'Gross Financial Margin', item: 'Net Operating Financial Margin', amount: income.grossFinancialMargin });

    // Operating expenses
    income.operatingExpenses.items.forEach((item) => {
      items.push({ category: 'Operating Expense', item: `${item.code} - ${item.name}`, amount: item.amount });
    });
    items.push({ category: 'Total Operating Expenses', item: 'Total Administrative & General Expenses', amount: income.operatingExpenses.total });

    // Net Surplus & Allocations
    items.push({ category: 'Net Surplus', item: 'Net Operating Surplus', amount: income.netOperatingSurplus });
    items.push({ category: 'Statutory Reserve (30%)', item: '30% Cooperative Legal Reserve Fund', amount: income.statutoryReserve30Pct });
    items.push({ category: 'Retained Earnings (70%)', item: '70% Member Dividend / Retained Surplus', amount: income.retainedSurplus70Pct });

    return {
      reportType: 'income_statement',
      title: 'Statement of Comprehensive Income (Profit & Loss)',
      description: `Cooperative revenue, financial cost of funds, operational expenses, and statutory legal reserves for period ${sDate} to ${eDate}.`,
      generatedAt: new Date().toISOString(),
      generatedBy: user?.name || user?.fullName || 'Authorized Staff',
      filters: { ...filters, startDate: sDate, endDate: eDate },
      summary: {
        totalRevenue: income.revenue.total,
        totalExpenses: income.totalExpenses,
        grossFinancialMargin: income.grossFinancialMargin,
        netSurplus: income.netOperatingSurplus,
        statutoryReserve: income.statutoryReserve30Pct,
        retainedEarnings: income.retainedSurplus70Pct,
      },
      columns: [
        { key: 'category', label: 'Section / Classification', type: 'text' },
        { key: 'item', label: 'Account Line Item', type: 'text' },
        { key: 'amount', label: 'Amount (ETB)', type: 'currency' },
      ],
      data: items,
      pagination: {
        page: 1,
        limit: 100,
        totalCount: items.length,
        totalPages: 1,
      },
    };
  }

  public getBalanceSheetReport(filters: ReportFilterParams, user?: any): ReportResult {
    const asOfDate = filters.endDate || new Date().toISOString().split('T')[0];
    const bs = accountingService.getBalanceSheet(asOfDate);

    const items: Array<{ category: string; item: string; amount: number }> = [];

    // Assets
    bs.assets.cashAndBank.items.forEach((item) => {
      items.push({ category: '1000 Cash & Bank', item: `${item.code} - ${item.name}`, amount: item.amount });
    });
    bs.assets.loansAndReceivables.items.forEach((item) => {
      items.push({ category: '1100 Loan Portfolio', item: `${item.code} - ${item.name}`, amount: item.amount });
    });
    bs.assets.allowanceForImpairment.items.forEach((item) => {
      items.push({ category: '1150 Impairment Reserve', item: `${item.code} - ${item.name}`, amount: item.amount });
    });
    bs.assets.otherAssets.items.forEach((item) => {
      items.push({ category: '1300/1400 Other Assets', item: `${item.code} - ${item.name}`, amount: item.amount });
    });
    items.push({ category: 'Total Assets', item: 'TOTAL ASSETS', amount: bs.assets.totalAssets });

    // Liabilities
    bs.liabilities.memberSavingsDeposits.items.forEach((item) => {
      items.push({ category: '2000 Member Savings Deposits', item: `${item.code} - ${item.name}`, amount: item.amount });
    });
    bs.liabilities.currentLiabilities.items.forEach((item) => {
      items.push({ category: '2100 Current Liabilities', item: `${item.code} - ${item.name}`, amount: item.amount });
    });
    items.push({ category: 'Total Liabilities', item: 'TOTAL LIABILITIES', amount: bs.liabilities.totalLiabilities });

    // Equity
    bs.equity.memberShareCapital.items.forEach((item) => {
      items.push({ category: '3000 Member Share Capital', item: `${item.code} - ${item.name}`, amount: item.amount });
    });
    bs.equity.statutoryReserve.items.forEach((item) => {
      items.push({ category: '3100 Statutory Reserve', item: `${item.code} - ${item.name}`, amount: item.amount });
    });
    bs.equity.retainedEarnings.items.forEach((item) => {
      items.push({ category: '3200 Retained Surplus', item: `${item.code} - ${item.name}`, amount: item.amount });
    });
    items.push({ category: 'Total Equity', item: 'TOTAL EQUITY & RESERVES', amount: bs.equity.totalEquity });
    items.push({ category: 'Total Liabilities & Equity', item: 'TOTAL LIABILITIES & EQUITY', amount: bs.totalLiabilitiesAndEquity });

    return {
      reportType: 'balance_sheet',
      title: 'Statement of Financial Position (Balance Sheet)',
      description: `Institutional assets, member savings liabilities, share capital equity, and statutory reserves as of ${asOfDate}.`,
      generatedAt: new Date().toISOString(),
      generatedBy: user?.name || user?.fullName || 'Authorized Staff',
      filters: { ...filters, endDate: asOfDate },
      summary: {
        totalAssets: bs.assets.totalAssets,
        totalLiabilities: bs.liabilities.totalLiabilities,
        totalEquity: bs.equity.totalEquity,
        isBalanced: bs.isBalanced,
        variance: bs.variance,
      },
      columns: [
        { key: 'category', label: 'Financial Category', type: 'text' },
        { key: 'item', label: 'Account Classification', type: 'text' },
        { key: 'amount', label: 'Balance (ETB)', type: 'currency' },
      ],
      data: items,
      pagination: {
        page: 1,
        limit: 100,
        totalCount: items.length,
        totalPages: 1,
      },
    };
  }

  public getCashFlowStatementReport(filters: ReportFilterParams, user?: any): ReportResult {
    const sDate = filters.startDate || `${new Date().getFullYear()}-01-01`;
    const eDate = filters.endDate || new Date().toISOString().split('T')[0];

    const transactions = db.getFinancialTransactions().filter((t) => {
      if (t.status !== 'POSTED') return false;
      const d = (t.timestamp || '').split('T')[0];
      return d >= sDate && d <= eDate;
    });

    const operatingInflows = transactions
      .filter((t) => t.type === 'DEPOSIT' || t.type === 'LOAN_REPAYMENT' || t.type === 'INTEREST_POSTING')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const operatingOutflows = transactions
      .filter((t) => t.type === 'WITHDRAWAL')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const netOperatingCashFlow = operatingInflows - operatingOutflows;

    const financingInflows = transactions
      .filter((t) => t.type === 'SHARE_PURCHASE')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const investingOutflows = transactions
      .filter((t) => t.type === 'LOAN_DISBURSEMENT')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const netCashFlow = netOperatingCashFlow + financingInflows - investingOutflows;

    const data = [
      { category: 'Cash Flow from Operating Activities', item: 'Member Savings Deposits & Loan Repayments Inflow', amount: operatingInflows },
      { category: 'Cash Flow from Operating Activities', item: 'Member Savings Withdrawals & Operating Costs', amount: -operatingOutflows },
      { category: 'Operating Cash Flow Subtotal', item: 'Net Cash Generated by Operating Activities', amount: netOperatingCashFlow },
      { category: 'Cash Flow from Investing Activities', item: 'Loan Portfolio Disbursements (Asset Growth)', amount: -investingOutflows },
      { category: 'Cash Flow from Financing Activities', item: 'Member Equity Share Capital Purchases', amount: financingInflows },
      { category: 'Net Cash Position Change', item: 'NET INCREASE / (DECREASE) IN CASH & BANK BALANCES', amount: netCashFlow },
    ];

    return {
      reportType: 'cash_flow',
      title: 'Statement of Cash Flows',
      description: `Analysis of cash inflows and outflows across operating, investing, and financing activities from ${sDate} to ${eDate}.`,
      generatedAt: new Date().toISOString(),
      generatedBy: user?.name || user?.fullName || 'Authorized Staff',
      filters: { ...filters, startDate: sDate, endDate: eDate },
      summary: {
        operatingInflows,
        operatingOutflows,
        netOperatingCashFlow,
        investingOutflows,
        financingInflows,
        netCashFlow,
      },
      columns: [
        { key: 'category', label: 'Activity Classification', type: 'text' },
        { key: 'item', label: 'Cash Flow Component', type: 'text' },
        { key: 'amount', label: 'Net Flow (ETB)', type: 'currency' },
      ],
      data,
      pagination: { page: 1, limit: 20, totalCount: data.length, totalPages: 1 },
    };
  }

  public getTrialBalanceReport(filters: ReportFilterParams, user?: any): ReportResult {
    const asOfDate = filters.endDate || new Date().toISOString().split('T')[0];
    const tb = accountingService.getTrialBalance(asOfDate);

    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 50;
    const pagedRows = tb.items.slice((page - 1) * limit, page * limit).map((i) => ({
      accountCode: i.accountCode,
      accountName: i.accountName,
      category: i.accountType,
      debit: i.closingDebit,
      credit: i.closingCredit,
    }));

    return {
      reportType: 'trial_balance',
      title: 'General Ledger Trial Balance Report',
      description: `Summary of all General Ledger account debit and credit balances verifying double-entry arithmetic equilibrium as of ${asOfDate}.`,
      generatedAt: new Date().toISOString(),
      generatedBy: user?.name || user?.fullName || 'Authorized Staff',
      filters: { ...filters, endDate: asOfDate },
      summary: {
        totalDebit: tb.totalDebit,
        totalCredit: tb.totalCredit,
        isBalanced: tb.isBalanced,
        variance: tb.discrepancy,
      },
      columns: [
        { key: 'accountCode', label: 'Account Code', type: 'text' },
        { key: 'accountName', label: 'Account Description', type: 'text' },
        { key: 'category', label: 'Category', type: 'badge' },
        { key: 'debit', label: 'Debit (DR)', type: 'currency' },
        { key: 'credit', label: 'Credit (CR)', type: 'currency' },
      ],
      data: pagedRows,
      pagination: {
        page,
        limit,
        totalCount: tb.items.length,
        totalPages: Math.ceil(tb.items.length / limit) || 1,
      },
    };
  }

  public getGeneralLedgerReport(filters: ReportFilterParams, user?: any): ReportResult {
    const accountCode = filters.accountCode || '1001';
    const sDate = filters.startDate || `${new Date().getFullYear()}-01-01`;
    const eDate = filters.endDate || new Date().toISOString().split('T')[0];

    const gl = accountingService.getGeneralLedger(accountCode, sDate, eDate);

    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 30;
    const pagedMovements = gl.movements.slice((page - 1) * limit, page * limit);

    return {
      reportType: 'general_ledger',
      title: `General Ledger Statement: ${gl.accountCode} - ${gl.accountName}`,
      description: `Detailed chronological ledger postings and running balance for account ${gl.accountCode}.`,
      generatedAt: new Date().toISOString(),
      generatedBy: user?.name || user?.fullName || 'Authorized Staff',
      filters: { ...filters, accountCode, startDate: sDate, endDate: eDate },
      summary: {
        accountCode: gl.accountCode,
        accountName: gl.accountName,
        category: gl.accountType,
        openingBalance: gl.openingBalance,
        closingBalance: gl.closingBalance,
        totalDebit: gl.totalDebit,
        totalCredit: gl.totalCredit,
      },
      columns: [
        { key: 'entryDate', label: 'Date', type: 'date' },
        { key: 'journalNo', label: 'Journal No', type: 'text' },
        { key: 'referenceNo', label: 'Reference', type: 'text' },
        { key: 'description', label: 'Narration / Description', type: 'text' },
        { key: 'debit', label: 'Debit (DR)', type: 'currency' },
        { key: 'credit', label: 'Credit (CR)', type: 'currency' },
        { key: 'runningBalance', label: 'Balance', type: 'currency' },
      ],
      data: pagedMovements,
      pagination: {
        page,
        limit,
        totalCount: gl.movements.length,
        totalPages: Math.ceil(gl.movements.length / limit) || 1,
      },
    };
  }

  public getJournalReport(filters: ReportFilterParams, user?: any): ReportResult {
    let journals = db.getJournalEntries();

    if (filters.startDate) journals = journals.filter((j) => (j.entryDate || j.date || j.createdAt) >= filters.startDate!);
    if (filters.endDate) journals = journals.filter((j) => (j.entryDate || j.date || j.createdAt) <= `${filters.endDate!}T23:59:59Z`);
    if (filters.status) journals = journals.filter((j) => j.status === filters.status);

    const totalDebit = journals.reduce((sum, j) => sum + (j.totalDebit || 0), 0);
    const totalCredit = journals.reduce((sum, j) => sum + (j.totalCredit || 0), 0);
    const totalCount = journals.length;

    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const pagedData = journals.slice((page - 1) * limit, page * limit).map((j) => ({
      id: j.id,
      journalNo: j.journalNo,
      date: j.entryDate || j.date || j.createdAt,
      narration: j.narration,
      totalDebit: j.totalDebit,
      totalCredit: j.totalCredit,
      status: j.status,
      linesCount: (j.lines || []).length,
      postedBy: j.postedByName || 'System',
    }));

    return {
      reportType: 'journal',
      title: 'Double-Entry Journal Postings Audit Report',
      description: 'Comprehensive listing of balanced double-entry accounting journals with multi-line splits.',
      generatedAt: new Date().toISOString(),
      generatedBy: user?.name || user?.fullName || 'Authorized Staff',
      filters,
      summary: {
        totalJournals: totalCount,
        totalDebit,
        totalCredit,
      },
      columns: [
        { key: 'journalNo', label: 'Journal No', type: 'text' },
        { key: 'date', label: 'Posting Date', type: 'date' },
        { key: 'narration', label: 'Narration', type: 'text' },
        { key: 'totalDebit', label: 'Total Debit', type: 'currency' },
        { key: 'totalCredit', label: 'Total Credit', type: 'currency' },
        { key: 'status', label: 'Status', type: 'badge' },
      ],
      data: pagedData,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    };
  }

  // ==========================================
  // 6. TRANSACTION, DEPOSIT & WITHDRAWAL REPORTS
  // ==========================================
  public getTransactionReport(filters: ReportFilterParams, user?: any): ReportResult {
    let txns = db.getFinancialTransactions();

    if (filters.startDate) txns = txns.filter((t) => t.timestamp >= filters.startDate!);
    if (filters.endDate) txns = txns.filter((t) => t.timestamp <= `${filters.endDate!}T23:59:59Z`);
    if (filters.transactionType) txns = txns.filter((t) => t.type === filters.transactionType);
    if (filters.status) txns = txns.filter((t) => t.status === filters.status);
    if (filters.paymentMethod) txns = txns.filter((t) => t.paymentChannel === filters.paymentMethod);
    if (filters.memberId) txns = txns.filter((t) => t.memberId === filters.memberId);

    const totalVolume = txns.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalCount = txns.length;

    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 25;
    const pagedData = txns.slice((page - 1) * limit, page * limit).map((t) => ({
      id: t.id,
      transactionNo: t.transactionNo,
      membershipNo: t.membershipNo,
      memberName: t.memberName,
      accountNo: t.accountNo,
      type: t.type,
      amount: t.amount,
      balanceAfter: t.balanceAfter,
      paymentChannel: t.paymentChannel,
      referenceNo: t.bankReferenceNo || 'N/A',
      status: t.status,
      timestamp: t.timestamp,
    }));

    return {
      reportType: 'transaction',
      title: 'Financial Transaction Activity Ledger Report',
      description: 'Audit log of all member transactions including deposits, withdrawals, transfers, and share purchases.',
      generatedAt: new Date().toISOString(),
      generatedBy: user?.name || user?.fullName || 'Authorized Staff',
      filters,
      summary: {
        totalTransactions: totalCount,
        totalTransactionVolume: totalVolume,
      },
      columns: [
        { key: 'transactionNo', label: 'Txn Ref', type: 'text' },
        { key: 'membershipNo', label: 'Member No', type: 'text' },
        { key: 'memberName', label: 'Member Name', type: 'text' },
        { key: 'type', label: 'Type', type: 'badge' },
        { key: 'amount', label: 'Amount', type: 'currency' },
        { key: 'balanceAfter', label: 'Balance After', type: 'currency' },
        { key: 'paymentChannel', label: 'Channel', type: 'text' },
        { key: 'timestamp', label: 'Date Time', type: 'date' },
      ],
      data: pagedData,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    };
  }

  public getWithdrawalReport(filters: ReportFilterParams, user?: any): ReportResult {
    return this.getTransactionReport({ ...filters, transactionType: 'WITHDRAWAL' }, user);
  }

  public getDepositReport(filters: ReportFilterParams, user?: any): ReportResult {
    return this.getTransactionReport({ ...filters, transactionType: 'DEPOSIT' }, user);
  }

  public getInterestReport(filters: ReportFilterParams, user?: any): ReportResult {
    return this.getTransactionReport({ ...filters, transactionType: 'INTEREST_POSTING' }, user);
  }

  // ==========================================
  // 7. BUDGET & VARIANCE REPORTS
  // ==========================================
  public getBudgetReport(filters: ReportFilterParams, user?: any): ReportResult {
    const budgets = db.getAnnualBudgets();
    const primaryBudget = budgets.find((b) => b.status === 'APPROVED' || b.status === 'ACTIVE') || budgets[0];

    if (!primaryBudget) {
      return {
        reportType: 'budget',
        title: 'Annual Operating Budget Report',
        description: 'Approved cooperative income and expenditure allocations.',
        generatedAt: new Date().toISOString(),
        generatedBy: user?.name || user?.fullName || 'Authorized Staff',
        filters,
        summary: { totalIncome: 0, totalExpense: 0, projectedSurplus: 0 },
        columns: [],
        data: [],
        pagination: { page: 1, limit: 20, totalCount: 0, totalPages: 1 },
      };
    }

    return {
      reportType: 'budget',
      title: `Fiscal Year ${primaryBudget.fiscalYear} Annual Operating Budget`,
      description: `Institutional budget allocations, income expectations, and operational limits (${primaryBudget.title}).`,
      generatedAt: new Date().toISOString(),
      generatedBy: user?.name || user?.fullName || 'Authorized Staff',
      filters,
      summary: {
        fiscalYear: primaryBudget.fiscalYear,
        totalBudgetedIncome: primaryBudget.totalBudgetedIncome,
        totalBudgetedExpense: primaryBudget.totalBudgetedExpense,
        projectedNetSurplus: primaryBudget.projectedNetSurplus,
        status: primaryBudget.status,
      },
      columns: [
        { key: 'accountCode', label: 'Account Code', type: 'text' },
        { key: 'accountName', label: 'Budget Line Item', type: 'text' },
        { key: 'accountType', label: 'Category', type: 'badge' },
        { key: 'annualBudget', label: 'Budget Allocation', type: 'currency' },
        { key: 'notes', label: 'Justification / Notes', type: 'text' },
      ],
      data: primaryBudget.items,
      pagination: {
        page: 1,
        limit: 50,
        totalCount: primaryBudget.items.length,
        totalPages: 1,
      },
    };
  }

  public getBudgetVarianceReport(filters: ReportFilterParams, user?: any): ReportResult {
    const variance = accountingService.getBudgetVarianceReport(new Date().getFullYear());

    return {
      reportType: 'variance',
      title: `Fiscal Year ${variance.fiscalYear} Budget vs. Actual Variance Analysis`,
      description: 'Comparison of approved budget allocations against actual year-to-date income and expenditures.',
      generatedAt: new Date().toISOString(),
      generatedBy: user?.name || user?.fullName || 'Authorized Staff',
      filters,
      summary: {
        fiscalYear: variance.fiscalYear,
        totalBudgetedIncome: variance.totalBudgetedIncome,
        totalActualIncome: variance.actualIncome,
        incomeVariance: variance.incomeVariance,
        totalBudgetedExpense: variance.totalBudgetedExpense,
        totalActualExpense: variance.actualExpense,
        expenseVariance: variance.expenseVariance,
      },
      columns: [
        { key: 'accountCode', label: 'Account Code', type: 'text' },
        { key: 'accountName', label: 'Line Item', type: 'text' },
        { key: 'accountType', label: 'Category', type: 'badge' },
        { key: 'budgetAmount', label: 'Budget', type: 'currency' },
        { key: 'actualAmount', label: 'Actual YTD', type: 'currency' },
        { key: 'varianceAmount', label: 'Variance', type: 'currency' },
        { key: 'variancePercentage', label: 'Variance (%)', type: 'number' },
      ],
      data: variance.items,
      pagination: {
        page: 1,
        limit: 50,
        totalCount: variance.items.length,
        totalPages: 1,
      },
    };
  }

  // ==========================================
  // 8. AUDIT & USER ACTIVITY REPORTS
  // ==========================================
  public getAuditReport(filters: ReportFilterParams, user?: any): ReportResult {
    let logs = db.getAuditLogs();

    if (filters.startDate) logs = logs.filter((l) => l.timestamp >= filters.startDate!);
    if (filters.endDate) logs = logs.filter((l) => l.timestamp <= `${filters.endDate!}T23:59:59Z`);
    if (filters.status) logs = logs.filter((l) => l.result === filters.status);

    const totalCount = logs.length;
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 30;

    const pagedData = logs.slice((page - 1) * limit, page * limit).map((l) => ({
      id: l.id,
      action: l.action,
      entityType: l.resource,
      entityId: l.resourceId,
      performedBy: l.actorName || l.actorId,
      ipAddress: l.ipAddress,
      status: l.result,
      timestamp: l.timestamp,
      details: l.afterState ? JSON.stringify(l.afterState) : '',
    }));

    return {
      reportType: 'audit',
      title: 'Cryptographic Audit Trail & Security Events Log',
      description: 'Immutable chronological audit record of critical user actions, administrative overrides, and system approvals.',
      generatedAt: new Date().toISOString(),
      generatedBy: user?.name || user?.fullName || 'Authorized Staff',
      filters,
      summary: {
        totalAuditEvents: totalCount,
      },
      columns: [
        { key: 'timestamp', label: 'Timestamp', type: 'date' },
        { key: 'action', label: 'Security Action', type: 'badge' },
        { key: 'performedBy', label: 'Actor / User', type: 'text' },
        { key: 'entityType', label: 'Target Entity', type: 'text' },
        { key: 'ipAddress', label: 'IP Address', type: 'text' },
        { key: 'status', label: 'Status', type: 'badge' },
      ],
      data: pagedData,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    };
  }

  public getUserActivityReport(filters: ReportFilterParams, user?: any): ReportResult {
    const history = db.getLoginHistory();
    const totalLogins = history.length;
    const successfulLogins = history.filter((h) => h.status === 'SUCCESS').length;
    const failedLogins = history.filter((h) => h.status === 'FAILED').length;

    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 30;
    const pagedData = history.slice((page - 1) * limit, page * limit).map((h) => ({
      id: h.id,
      identifier: h.identifierAttempted,
      status: h.status,
      ipAddress: h.ipAddress,
      deviceInfo: h.deviceInfo,
      timestamp: h.timestamp,
    }));

    return {
      reportType: 'user_activity',
      title: 'User Authentication & Session Activity Report',
      description: 'Monitoring of user logins, authentication attempts, device signatures, and access timestamps.',
      generatedAt: new Date().toISOString(),
      generatedBy: user?.name || user?.fullName || 'Authorized Staff',
      filters,
      summary: {
        totalLoginAttempts: totalLogins,
        successfulLogins,
        failedLogins,
      },
      columns: [
        { key: 'timestamp', label: 'Timestamp', type: 'date' },
        { key: 'identifier', label: 'User / Account', type: 'text' },
        { key: 'status', label: 'Result', type: 'badge' },
        { key: 'ipAddress', label: 'IP Address', type: 'text' },
        { key: 'deviceInfo', label: 'Device / Browser', type: 'text' },
      ],
      data: pagedData,
      pagination: {
        page,
        limit,
        totalCount: history.length,
        totalPages: Math.ceil(history.length / limit) || 1,
      },
    };
  }

  /**
   * Export Report to CSV Format
   */
  public exportToCSV(reportResult: ReportResult): string {
    const headers = reportResult.columns.map((c) => `"${c.label}"`).join(',');
    const rows = reportResult.data.map((row) =>
      reportResult.columns
        .map((c) => {
          const val = row[c.key];
          if (val === null || val === undefined) return '""';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    return [headers, ...rows].join('\n');
  }
}

export const reportService = new ReportService();
