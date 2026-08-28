export interface GlobalSearchResult {
  members: Array<{
    id: string;
    membershipNo: string;
    fullName: string;
    phone: string;
    status: string;
    matchField: string;
  }>;
  accounts: Array<{
    id: string;
    accountNo: string;
    membershipNo: string;
    memberName: string;
    productName: string;
    type: 'SAVINGS' | 'SHARE';
    balance: number;
  }>;
  loans: Array<{
    id: string;
    loanNo: string;
    membershipNo: string;
    memberName: string;
    productName: string;
    amount: number;
    outstanding: number;
    status: string;
  }>;
  transactions: Array<{
    id: string;
    transactionNo: string;
    memberName: string;
    type: string;
    amount: number;
    channel: string;
    timestamp: string;
  }>;
  accounting: Array<{
    id: string;
    type: 'CHART_OF_ACCOUNT' | 'JOURNAL_ENTRY' | 'BUDGET';
    codeOrNo: string;
    nameOrTitle: string;
    amountOrBalance: number;
  }>;
  reports: Array<{
    id: string;
    title: string;
    category: string;
    description: string;
  }>;
  totalResults: number;
}

export interface ExecutiveDashboardData {
  kpi: {
    totalMembers: number;
    activeMembers: number;
    newMembersThisMonth: number;
    suspendedMembers: number;
    totalSavingsBalance: number;
    savingsGrowthMonth: number;
    savingsTargetAchievement: number;
    totalShareCapital: number;
    totalSharesCount: number;
    shareTargetAchievement: number;
    totalOutstandingLoans: number;
    totalDisbursedYTD: number;
    activeLoansCount: number;
    parAmount: number;
    parRate: number;
    liquidityRatio: number;
    totalLiquidAssets: number;
    netSurplusYTD: number;
    totalRevenueYTD: number;
    totalExpensesYTD: number;
  };
  liquidity: {
    cashInVault: number;
    cbeBankBalance: number;
    tsehayBankBalance: number;
    totalLiquidAssets: number;
    liquidityRatio: number;
    targetLiquidityRatio: number;
  };
  monthlyTrends: Array<{
    month: string;
    savingsDeposit: number;
    savingsWithdrawal: number;
    netSavings: number;
    loansDisbursed: number;
    loansRepaid: number;
    interestIncome: number;
    operatingExpenses: number;
    netSurplus: number;
  }>;
  portfolioByProduct: Array<{
    name: string;
    code: string;
    value: number;
    count: number;
    color: string;
  }>;
  savingsByProduct: Array<{
    name: string;
    code: string;
    value: number;
    count: number;
    color: string;
  }>;
  alerts: Array<{
    type: 'WARNING' | 'CRITICAL' | 'INFO';
    message: string;
    metric: string;
  }>;
}

export interface ReportMetaItem {
  id: string;
  category: 'members' | 'savings' | 'shares' | 'loans' | 'accounting' | 'audits';
  title: string;
  description: string;
  icon: string;
  supportsDateRange: boolean;
  supportsProductFilter: boolean;
}

export interface ReportResponseData {
  reportType: string;
  title: string;
  description: string;
  generatedAt: string;
  generatedBy: string;
  filters: Record<string, any>;
  summary: Record<string, any>;
  data?: any[];
  [key: string]: any;
}

export interface ScheduledReportItem {
  id: string;
  title: string;
  reportType: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  format: 'PDF' | 'EXCEL' | 'CSV';
  recipients: string[];
  filters: Record<string, any>;
  lastRunAt?: string | null;
  nextRunAt: string;
  status: 'ACTIVE' | 'PAUSED' | 'FAILED';
  lastStatusMessage?: string;
  createdByName: string;
  createdAt: string;
}

export interface ForecastResponseData {
  timeframeMonths: number;
  monthlyProjections: Array<{
    month: string;
    projectedSavings: number;
    projectedLoans: number;
    projectedIncome: number;
    projectedExpenses: number;
    projectedSurplus: number;
  }>;
  kpis: {
    expectedSavingsGrowth: number;
    expectedLoanGrowth: number;
    projectedAnnualSurplus: number;
    confidenceScore: number;
  };
  [key: string]: any;
}
