import { db } from '../db/database';
import {
  DbChartOfAccount,
  DbJournalEntry,
  DbJournalEntryLine,
  DbAccountingPeriod,
  DbBankReconciliation,
  DbBankReconciliationItem,
  DbAnnualBudget,
  DbAnnualBudgetItem,
  GLAccountType,
  UserRole,
} from '../db/schema';
import { financialMath } from './financialService';
import { securityService } from './securityService';

export interface TrialBalanceItem {
  accountCode: string;
  accountName: string;
  accountType: GLAccountType;
  normalBalance: 'DEBIT' | 'CREDIT';
  isHeader: boolean;
  level: number;
  openingDebit: number;
  openingCredit: number;
  movementDebit: number;
  movementCredit: number;
  closingDebit: number;
  closingCredit: number;
  netBalance: number;
}

export interface TrialBalanceReport {
  asOfDate: string;
  items: TrialBalanceItem[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  discrepancy: number;
}

export interface GeneralLedgerMovement {
  id: string;
  journalNo: string;
  entryDate: string;
  referenceNo: string;
  transactionType: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
  status: string;
}

export interface GeneralLedgerReport {
  accountCode: string;
  accountName: string;
  accountType: GLAccountType;
  normalBalance: 'DEBIT' | 'CREDIT';
  startDate: string;
  endDate: string;
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
  movements: GeneralLedgerMovement[];
}

export interface FinancialStatementSectionItem {
  code: string;
  name: string;
  amount: number;
  isHeader?: boolean;
  children?: FinancialStatementSectionItem[];
}

export interface FinancialStatementSection {
  title: string;
  total: number;
  items: FinancialStatementSectionItem[];
}

export interface IncomeStatementReport {
  startDate: string;
  endDate: string;
  revenue: FinancialStatementSection;
  costOfFunds: FinancialStatementSection;
  grossFinancialMargin: number;
  operatingExpenses: FinancialStatementSection;
  loanLossProvisions: FinancialStatementSection;
  totalExpenses: number;
  netOperatingSurplus: number;
  statutoryReserve30Pct: number;
  retainedSurplus70Pct: number;
}

export interface BalanceSheetReport {
  asOfDate: string;
  assets: {
    cashAndBank: FinancialStatementSection;
    loansAndReceivables: FinancialStatementSection;
    allowanceForImpairment: FinancialStatementSection;
    otherAssets: FinancialStatementSection;
    totalAssets: number;
  };
  liabilities: {
    memberSavingsDeposits: FinancialStatementSection;
    currentLiabilities: FinancialStatementSection;
    totalLiabilities: number;
  };
  equity: {
    memberShareCapital: FinancialStatementSection;
    statutoryReserve: FinancialStatementSection;
    retainedEarnings: FinancialStatementSection;
    generalReserves: FinancialStatementSection;
    currentPeriodSurplus: number;
    totalEquity: number;
  };
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
  variance: number;
}

export interface BudgetVarianceItem {
  accountCode: string;
  accountName: string;
  accountType: GLAccountType;
  budgetAmount: number;
  actualAmount: number;
  varianceAmount: number;
  variancePercentage: number;
  isFavorable: boolean;
  notes?: string;
}

export interface BudgetVarianceReport {
  fiscalYear: number;
  budgetTitle: string;
  totalBudgetedIncome: number;
  actualIncome: number;
  incomeVariance: number;
  totalBudgetedExpense: number;
  actualExpense: number;
  expenseVariance: number;
  projectedNetSurplus: number;
  actualNetSurplus: number;
  surplusVariance: number;
  items: BudgetVarianceItem[];
}

export interface FinancialRatiosReport {
  asOfDate: string;
  liquidityRatio: number; // Cash & Bank / Total Savings (Standard >= 15%)
  capitalAdequacyRatio: number; // Total Equity / Total Assets (Standard >= 12%)
  nplProvisionCoverage: number; // Loan Loss Reserve / Overdue Portfolio
  returnOnAssets: number; // Net Surplus / Total Assets (Annualized %)
  returnOnEquity: number; // Net Surplus / Total Equity (Annualized %)
  operatingEfficiencyRatio: number; // Operating Expenses / Total Revenue
  loanToDepositRatio: number; // Gross Loans / Total Savings (Target <= 85%)
}

export class AccountingService {
  // ==========================================
  // CHART OF ACCOUNTS
  // ==========================================

  public getChartOfAccounts(): DbChartOfAccount[] {
    return db.getChartOfAccounts().sort((a, b) => a.accountCode.localeCompare(b.accountCode));
  }

  public getAccountByCode(code: string): DbChartOfAccount | undefined {
    return db.getChartOfAccountById(code);
  }

  public createAccount(
    data: {
      accountCode: string;
      accountName: string;
      accountType: GLAccountType;
      parentCode?: string;
      isHeader?: boolean;
      description?: string;
      currency?: string;
    },
    user: { id: string; name: string; role: string }
  ): { success: boolean; account?: DbChartOfAccount; error?: string } {
    const existing = db.getChartOfAccountById(data.accountCode);
    if (existing) {
      return { success: false, error: `Account with code ${data.accountCode} already exists` };
    }

    let parentAccountId: string | undefined;
    let level = 1;
    if (data.parentCode) {
      const parent = db.getChartOfAccountById(data.parentCode);
      if (parent) {
        parentAccountId = parent.id;
        level = (parent.level || 1) + 1;
      }
    }

    let normalBalance: 'DEBIT' | 'CREDIT' = 'DEBIT';
    if (data.accountType === 'ASSET' || data.accountType === 'EXPENSE') {
      normalBalance = 'DEBIT';
    } else {
      normalBalance = 'CREDIT';
    }

    const newAccount: DbChartOfAccount = {
      id: `coa_${data.accountCode}`,
      accountCode: data.accountCode,
      accountName: data.accountName,
      accountType: data.accountType,
      normalBalance,
      isHeader: !!data.isHeader,
      parentCode: data.parentCode,
      parentAccountId,
      level,
      balance: 0,
      status: 'ACTIVE',
      description: data.description,
      currency: 'ETB',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.createChartOfAccount(newAccount);

    securityService.recordAuditLog(user, 'COA_ACCOUNT_CREATED', 'chartOfAccounts', newAccount.accountCode, {
      afterState: { accountCode: newAccount.accountCode, accountName: newAccount.accountName },
    });

    return { success: true, account: newAccount };
  }

  public updateAccount(
    id: string,
    updates: Partial<DbChartOfAccount>,
    user: { id: string; name: string; role: string }
  ): { success: boolean; account?: DbChartOfAccount; error?: string } {
    const updated = db.updateChartOfAccount(id, updates);
    if (!updated) {
      return { success: false, error: 'Account not found' };
    }

    securityService.recordAuditLog(user, 'COA_ACCOUNT_UPDATED', 'chartOfAccounts', updated.accountCode, {
      afterState: { accountCode: updated.accountCode, updates },
    });

    return { success: true, account: updated };
  }

  // ==========================================
  // GENERAL LEDGER & TRIAL BALANCE
  // ==========================================

  public getGeneralLedger(accountCode: string, startDate?: string, endDate?: string): GeneralLedgerReport {
    const account = db.getChartOfAccountById(accountCode);
    const coaList = db.getChartOfAccounts();
    const targetAccount = account || coaList.find((c) => c.accountCode === accountCode);

    const normalBalance = targetAccount?.normalBalance || (targetAccount?.accountType === 'ASSET' || targetAccount?.accountType === 'EXPENSE' ? 'DEBIT' : 'CREDIT');
    const accountType = targetAccount?.accountType || 'ASSET';
    const accountName = targetAccount?.accountName || `Account ${accountCode}`;

    const sDate = startDate || '2020-01-01';
    const eDate = endDate || new Date().toISOString().split('T')[0];

    const allJournals = db.getJournalEntries().filter((j) => j.status === 'POSTED');

    let openingBalance = 0;
    let totalDebit = 0;
    let totalCredit = 0;
    const movements: GeneralLedgerMovement[] = [];

    // Sort journals chronologically
    const sortedJournals = allJournals.sort(
      (a, b) => new Date(a.entryDate || a.date || a.createdAt).getTime() - new Date(b.entryDate || b.date || b.createdAt).getTime()
    );

    let runningBal = 0;

    for (const j of sortedJournals) {
      const entryDateOnly = (j.entryDate || j.date || j.createdAt).split('T')[0];
      const line = j.lines.find((l) => l.accountCode === accountCode);
      if (!line) continue;

      const debit = line.debit || 0;
      const credit = line.credit || 0;

      if (entryDateOnly < sDate) {
        if (normalBalance === 'DEBIT') {
          openingBalance = financialMath.round(openingBalance + debit - credit);
        } else {
          openingBalance = financialMath.round(openingBalance + credit - debit);
        }
      } else if (entryDateOnly <= eDate) {
        totalDebit = financialMath.round(totalDebit + debit);
        totalCredit = financialMath.round(totalCredit + credit);
      }
    }

    runningBal = openingBalance;

    for (const j of sortedJournals) {
      const entryDateOnly = (j.entryDate || j.date || j.createdAt).split('T')[0];
      if (entryDateOnly < sDate || entryDateOnly > eDate) continue;

      const line = j.lines.find((l) => l.accountCode === accountCode);
      if (!line) continue;

      const debit = line.debit || 0;
      const credit = line.credit || 0;

      if (normalBalance === 'DEBIT') {
        runningBal = financialMath.round(runningBal + debit - credit);
      } else {
        runningBal = financialMath.round(runningBal + credit - debit);
      }

      movements.push({
        id: line.id,
        journalNo: j.journalNo,
        entryDate: j.entryDate || j.date || j.createdAt,
        referenceNo: j.transactionReference || j.transactionId || j.journalNo,
        transactionType: j.transactionType || 'JOURNAL',
        description: line.description || j.narration,
        debit,
        credit,
        runningBalance: runningBal,
        status: j.status,
      });
    }

    const closingBalance = runningBal;

    return {
      accountCode,
      accountName,
      accountType,
      normalBalance,
      startDate: sDate,
      endDate: eDate,
      openingBalance,
      totalDebit,
      totalCredit,
      closingBalance,
      movements,
    };
  }

  public getTrialBalance(asOfDate?: string): TrialBalanceReport {
    const targetDate = asOfDate || new Date().toISOString().split('T')[0];
    const coaList = db.getChartOfAccounts().sort((a, b) => a.accountCode.localeCompare(b.accountCode));
    const allJournals = db.getJournalEntries().filter((j) => j.status === 'POSTED');

    const items: TrialBalanceItem[] = [];
    let grandTotalDebit = 0;
    let grandTotalCredit = 0;

    for (const acc of coaList) {
      let movementDebit = 0;
      let movementCredit = 0;

      for (const j of allJournals) {
        const jDate = (j.entryDate || j.date || j.createdAt || '').split('T')[0];
        if (jDate > targetDate) continue;

        const line = j.lines.find((l) => l.accountCode === acc.accountCode);
        if (!line) continue;

        movementDebit = financialMath.round(movementDebit + (line.debit || 0));
        movementCredit = financialMath.round(movementCredit + (line.credit || 0));
      }

      let netBalance = 0;
      let closingDebit = 0;
      let closingCredit = 0;

      if (acc.normalBalance === 'DEBIT') {
        netBalance = financialMath.round(movementDebit - movementCredit);
        if (netBalance >= 0) {
          closingDebit = netBalance;
        } else {
          closingCredit = Math.abs(netBalance);
        }
      } else {
        netBalance = financialMath.round(movementCredit - movementDebit);
        if (netBalance >= 0) {
          closingCredit = netBalance;
        } else {
          closingDebit = Math.abs(netBalance);
        }
      }

      // Add to grand totals if not header
      if (!acc.isHeader) {
        grandTotalDebit = financialMath.round(grandTotalDebit + closingDebit);
        grandTotalCredit = financialMath.round(grandTotalCredit + closingCredit);
      }

      items.push({
        accountCode: acc.accountCode,
        accountName: acc.accountName,
        accountType: acc.accountType,
        normalBalance: acc.normalBalance,
        isHeader: acc.isHeader,
        level: acc.level || 1,
        openingDebit: 0,
        openingCredit: 0,
        movementDebit,
        movementCredit,
        closingDebit,
        closingCredit,
        netBalance,
      });
    }

    const discrepancy = financialMath.round(Math.abs(grandTotalDebit - grandTotalCredit));
    const isBalanced = discrepancy < 0.01;

    return {
      asOfDate: targetDate,
      items,
      totalDebit: grandTotalDebit,
      totalCredit: grandTotalCredit,
      isBalanced,
      discrepancy,
    };
  }

  // ==========================================
  // FINANCIAL STATEMENTS
  // ==========================================

  public getIncomeStatement(startDate?: string, endDate?: string): IncomeStatementReport {
    const sDate = startDate || `${new Date().getFullYear()}-01-01`;
    const eDate = endDate || new Date().toISOString().split('T')[0];

    const coaList = db.getChartOfAccounts();
    const journals = db.getJournalEntries().filter((j) => {
      if (j.status !== 'POSTED') return false;
      const d = (j.entryDate || j.date || j.createdAt || '').split('T')[0];
      return d >= sDate && d <= eDate;
    });

    // Helper to calculate period net change for an account
    const getAccountMovement = (code: string): number => {
      let debits = 0;
      let credits = 0;
      for (const j of journals) {
        const line = j.lines.find((l) => l.accountCode === code);
        if (line) {
          debits = financialMath.round(debits + (line.debit || 0));
          credits = financialMath.round(credits + (line.credit || 0));
        }
      }
      const acc = coaList.find((c) => c.accountCode === code);
      if (acc?.accountType === 'INCOME') {
        return financialMath.round(credits - debits);
      }
      return financialMath.round(debits - credits);
    };

    // Revenue accounts (4000 series)
    const revenueItems: FinancialStatementSectionItem[] = [
      { code: '4010', name: 'Interest Income from Member Loans', amount: getAccountMovement('4010') },
      { code: '4020', name: 'Membership & Registration Fee Income', amount: getAccountMovement('4020') },
      { code: '4030', name: 'Loan Delinquency & Late Penalty Income', amount: getAccountMovement('4030') },
      { code: '4040', name: 'Loan Processing & Appraisal Fees', amount: getAccountMovement('4040') },
      { code: '4050', name: 'Bank Interest & Investment Income', amount: getAccountMovement('4050') },
      { code: '4060', name: 'Miscellaneous Operating Income', amount: getAccountMovement('4060') },
    ].filter((i) => i.amount !== 0 || true);

    const totalRevenue = revenueItems.reduce((acc, curr) => financialMath.round(acc + curr.amount), 0);

    // Cost of funds (Interest on deposits: 5010)
    const costOfFundsItems: FinancialStatementSectionItem[] = [
      { code: '5010', name: 'Interest Expense on Member Deposits', amount: getAccountMovement('5010') },
    ];
    const totalCostOfFunds = costOfFundsItems.reduce((acc, curr) => financialMath.round(acc + curr.amount), 0);

    const grossFinancialMargin = financialMath.round(totalRevenue - totalCostOfFunds);

    // Operating expenses (5030, 5040, 5050, 5060, 5070, 5080)
    const operatingExpenseItems: FinancialStatementSectionItem[] = [
      { code: '5030', name: 'Staff Salaries, Allowances & Benefits', amount: getAccountMovement('5030') },
      { code: '5040', name: 'Office Rent & Utilities Expense', amount: getAccountMovement('5040') },
      { code: '5050', name: 'External Audit, Legal & Compliance Fees', amount: getAccountMovement('5050') },
      { code: '5060', name: 'Depreciation & Amortization Expense', amount: getAccountMovement('5060') },
      { code: '5070', name: 'Stationery, Printing & Office Supplies', amount: getAccountMovement('5070') },
      { code: '5080', name: 'Bank Charges, Transaction Fees & POS Costs', amount: getAccountMovement('5080') },
    ];
    const totalOperatingExpenses = operatingExpenseItems.reduce((acc, curr) => financialMath.round(acc + curr.amount), 0);

    // Loan Loss Provisions (5020)
    const loanLossItems: FinancialStatementSectionItem[] = [
      { code: '5020', name: 'Loan Loss Provision Expense', amount: getAccountMovement('5020') },
    ];
    const totalLoanLoss = loanLossItems.reduce((acc, curr) => financialMath.round(acc + curr.amount), 0);

    const totalExpenses = financialMath.round(totalCostOfFunds + totalOperatingExpenses + totalLoanLoss);
    const netOperatingSurplus = financialMath.round(totalRevenue - totalExpenses);

    // Ethiopian Cooperative Law statutory allocations:
    // Minimum 30% to Statutory Reserve Fund, Remaining 70% to Retained Earnings / Dividend pool
    const statutoryReserve30Pct = netOperatingSurplus > 0 ? financialMath.round(netOperatingSurplus * 0.3) : 0;
    const retainedSurplus70Pct = netOperatingSurplus > 0 ? financialMath.round(netOperatingSurplus - statutoryReserve30Pct) : netOperatingSurplus;

    return {
      startDate: sDate,
      endDate: eDate,
      revenue: {
        title: 'Financial & Operating Revenue',
        total: totalRevenue,
        items: revenueItems,
      },
      costOfFunds: {
        title: 'Financial Cost of Funds',
        total: totalCostOfFunds,
        items: costOfFundsItems,
      },
      grossFinancialMargin,
      operatingExpenses: {
        title: 'Administrative & Operating Expenses',
        total: totalOperatingExpenses,
        items: operatingExpenseItems,
      },
      loanLossProvisions: {
        title: 'Provision for Impairment & Credit Losses',
        total: totalLoanLoss,
        items: loanLossItems,
      },
      totalExpenses,
      netOperatingSurplus,
      statutoryReserve30Pct,
      retainedSurplus70Pct,
    };
  }

  public getBalanceSheet(asOfDate?: string): BalanceSheetReport {
    const targetDate = asOfDate || new Date().toISOString().split('T')[0];
    const coaList = db.getChartOfAccounts();
    const journals = db.getJournalEntries().filter((j) => {
      if (j.status !== 'POSTED') return false;
      return (j.entryDate || j.date || j.createdAt || '').split('T')[0] <= targetDate;
    });

    // Helper to calculate cumulative balance as of target date
    const getAccountCumulativeBalance = (code: string): number => {
      let debits = 0;
      let credits = 0;
      for (const j of journals) {
        const line = j.lines.find((l) => l.accountCode === code);
        if (line) {
          debits = financialMath.round(debits + (line.debit || 0));
          credits = financialMath.round(credits + (line.credit || 0));
        }
      }
      const acc = coaList.find((c) => c.accountCode === code);
      if (acc?.normalBalance === 'CREDIT') {
        return financialMath.round(credits - debits);
      }
      return financialMath.round(debits - credits);
    };

    // 1. ASSETS
    // Cash & Bank (1000 - 1050)
    const cashAndBankItems: FinancialStatementSectionItem[] = [
      { code: '1001', name: 'Cash on Hand (Vault & Petty Cash)', amount: getAccountCumulativeBalance('1001') },
      { code: '1010', name: 'Commercial Bank of Ethiopia (CBE)', amount: getAccountCumulativeBalance('1010') },
      { code: '1020', name: 'Tsehay Bank Current Account', amount: getAccountCumulativeBalance('1020') },
      { code: '1030', name: 'Awash Bank Current Account', amount: getAccountCumulativeBalance('1030') },
      { code: '1040', name: 'Telebirr SuperApp Merchant Liquidity', amount: getAccountCumulativeBalance('1040') },
      { code: '1050', name: 'CBE Birr Agent Wallet Pool', amount: getAccountCumulativeBalance('1050') },
    ];
    const totalCashAndBank = cashAndBankItems.reduce((acc, curr) => financialMath.round(acc + curr.amount), 0);

    // Loans & Receivables (1110 - 1140, 1200)
    const loansItems: FinancialStatementSectionItem[] = [
      { code: '1110', name: 'Emergency Loans Portfolio (Performing)', amount: getAccountCumulativeBalance('1110') },
      { code: '1120', name: 'Short-term Operating Loans (Performing)', amount: getAccountCumulativeBalance('1120') },
      { code: '1130', name: 'Medium-term Business Loans (Performing)', amount: getAccountCumulativeBalance('1130') },
      { code: '1140', name: 'Non-Performing Loans (Overdue & In Default)', amount: getAccountCumulativeBalance('1140') },
      { code: '1200', name: 'Accrued Interest Receivable from Loans', amount: getAccountCumulativeBalance('1200') },
    ];
    const totalLoans = loansItems.reduce((acc, curr) => financialMath.round(acc + curr.amount), 0);

    // Allowance for Loan Impairment (1150 - Contra asset, negative balance)
    const allowanceBalance = getAccountCumulativeBalance('1150');
    const allowanceItems: FinancialStatementSectionItem[] = [
      { code: '1150', name: 'Allowance for Expected Credit Losses', amount: -Math.abs(allowanceBalance) },
    ];
    const totalAllowance = allowanceItems.reduce((acc, curr) => financialMath.round(acc + curr.amount), 0);

    // Other Assets & Equipment (1300, 1400)
    const otherAssetsItems: FinancialStatementSectionItem[] = [
      { code: '1300', name: 'Prepaid Rent & Sundry Debtors', amount: getAccountCumulativeBalance('1300') },
      { code: '1400', name: 'Office Furniture, IT Equipment & Software', amount: getAccountCumulativeBalance('1400') },
    ];
    const totalOtherAssets = otherAssetsItems.reduce((acc, curr) => financialMath.round(acc + curr.amount), 0);

    const totalAssets = financialMath.round(totalCashAndBank + totalLoans + totalAllowance + totalOtherAssets);

    // 2. LIABILITIES
    // Member Savings Deposits (2010 - 2040)
    const savingsItems: FinancialStatementSectionItem[] = [
      { code: '2010', name: 'Compulsory / Regular Savings Deposits', amount: getAccountCumulativeBalance('2010') },
      { code: '2020', name: 'Voluntary / Ordinary Demand Savings', amount: getAccountCumulativeBalance('2020') },
      { code: '2030', name: 'Fixed Term & Time Deposits', amount: getAccountCumulativeBalance('2030') },
      { code: '2040', name: 'Special Purpose & Youth Target Savings', amount: getAccountCumulativeBalance('2040') },
    ];
    const totalSavings = savingsItems.reduce((acc, curr) => financialMath.round(acc + curr.amount), 0);

    // Current Liabilities (2100, 2200, 2300)
    const currentLiabilitiesItems: FinancialStatementSectionItem[] = [
      { code: '2100', name: 'Accrued Interest Payable to Savers', amount: getAccountCumulativeBalance('2100') },
      { code: '2200', name: 'Accounts Payable & Trade Vendors', amount: getAccountCumulativeBalance('2200') },
      { code: '2300', name: 'Tax Withholding & Regulatory Levies Payable', amount: getAccountCumulativeBalance('2300') },
    ];
    const totalCurrentLiabilities = currentLiabilitiesItems.reduce((acc, curr) => financialMath.round(acc + curr.amount), 0);

    const totalLiabilities = financialMath.round(totalSavings + totalCurrentLiabilities);

    // 3. EQUITY
    const shareCapitalItems: FinancialStatementSectionItem[] = [
      { code: '3010', name: 'Member Paid-Up Share Capital', amount: getAccountCumulativeBalance('3010') },
    ];
    const totalShareCapital = shareCapitalItems.reduce((acc, curr) => financialMath.round(acc + curr.amount), 0);

    const statutoryReserveItems: FinancialStatementSectionItem[] = [
      { code: '3020', name: 'Statutory Reserve Fund (30% Legal)', amount: getAccountCumulativeBalance('3020') },
    ];
    const totalStatutoryReserve = statutoryReserveItems.reduce((acc, curr) => financialMath.round(acc + curr.amount), 0);

    const retainedEarningsItems: FinancialStatementSectionItem[] = [
      { code: '3030', name: 'Prior Retained Surplus / (Deficit)', amount: getAccountCumulativeBalance('3030') },
    ];
    const totalRetainedEarnings = retainedEarningsItems.reduce((acc, curr) => financialMath.round(acc + curr.amount), 0);

    const generalReservesItems: FinancialStatementSectionItem[] = [
      { code: '3040', name: 'General & Dividend Equalization Reserves', amount: getAccountCumulativeBalance('3040') },
    ];
    const totalGeneralReserves = generalReservesItems.reduce((acc, curr) => financialMath.round(acc + curr.amount), 0);

    // Calculate current unclosed P&L surplus from income and expense accounts
    let totalPeriodIncome = 0;
    let totalPeriodExpense = 0;
    for (const c of coaList) {
      if (c.isHeader) continue;
      if (c.accountType === 'INCOME') {
        totalPeriodIncome = financialMath.round(totalPeriodIncome + getAccountCumulativeBalance(c.accountCode));
      } else if (c.accountType === 'EXPENSE') {
        totalPeriodExpense = financialMath.round(totalPeriodExpense + getAccountCumulativeBalance(c.accountCode));
      }
    }
    const currentPeriodSurplus = financialMath.round(totalPeriodIncome - totalPeriodExpense);

    const totalEquity = financialMath.round(
      totalShareCapital + totalStatutoryReserve + totalRetainedEarnings + totalGeneralReserves + currentPeriodSurplus
    );

    const totalLiabilitiesAndEquity = financialMath.round(totalLiabilities + totalEquity);
    const variance = financialMath.round(Math.abs(totalAssets - totalLiabilitiesAndEquity));
    const isBalanced = variance < 0.01;

    return {
      asOfDate: targetDate,
      assets: {
        cashAndBank: {
          title: 'Cash and Cash Equivalents',
          total: totalCashAndBank,
          items: cashAndBankItems,
        },
        loansAndReceivables: {
          title: 'Loans to Members (Gross Portfolio)',
          total: totalLoans,
          items: loansItems,
        },
        allowanceForImpairment: {
          title: 'Allowance for Impairment Losses',
          total: totalAllowance,
          items: allowanceItems,
        },
        otherAssets: {
          title: 'Other Assets & Property',
          total: totalOtherAssets,
          items: otherAssetsItems,
        },
        totalAssets,
      },
      liabilities: {
        memberSavingsDeposits: {
          title: 'Member Savings & Deposits',
          total: totalSavings,
          items: savingsItems,
        },
        currentLiabilities: {
          title: 'Other Accounts & Accruals Payable',
          total: totalCurrentLiabilities,
          items: currentLiabilitiesItems,
        },
        totalLiabilities,
      },
      equity: {
        memberShareCapital: {
          title: 'Paid-Up Share Capital',
          total: totalShareCapital,
          items: shareCapitalItems,
        },
        statutoryReserve: {
          title: 'Statutory Reserve Fund',
          total: totalStatutoryReserve,
          items: statutoryReserveItems,
        },
        retainedEarnings: {
          title: 'Retained Earnings',
          total: totalRetainedEarnings,
          items: retainedEarningsItems,
        },
        generalReserves: {
          title: 'General & Special Reserves',
          total: totalGeneralReserves,
          items: generalReservesItems,
        },
        currentPeriodSurplus,
        totalEquity,
      },
      totalLiabilitiesAndEquity,
      isBalanced,
      variance,
    };
  }

  // ==========================================
  // FINANCIAL RATIOS & PRUDENTIAL METRICS
  // ==========================================

  public getFinancialRatios(asOfDate?: string): FinancialRatiosReport {
    const targetDate = asOfDate || new Date().toISOString().split('T')[0];
    const bs = this.getBalanceSheet(targetDate);
    const is = this.getIncomeStatement(`${new Date(targetDate).getFullYear()}-01-01`, targetDate);

    const totalSavings = bs.liabilities.memberSavingsDeposits.total || 1;
    const totalAssets = bs.assets.totalAssets || 1;
    const totalEquity = bs.equity.totalEquity || 1;
    const cashAndBank = bs.assets.cashAndBank.total;
    const grossLoans = bs.assets.loansAndReceivables.total;
    const totalRevenue = is.revenue.total || 1;
    const totalOperatingExpenses = is.operatingExpenses.total + is.costOfFunds.total;

    // Prudential Ratios:
    // 1. Liquidity Ratio = Cash & Bank / Member Savings (Min 15%)
    const liquidityRatio = financialMath.round((cashAndBank / totalSavings) * 100);

    // 2. Capital Adequacy = Total Institutional Equity / Total Assets (Min 12%)
    const capitalAdequacyRatio = financialMath.round((totalEquity / totalAssets) * 100);

    // 3. NPL Provision Coverage
    const allowance = Math.abs(bs.assets.allowanceForImpairment.total);
    const nplLoans = bs.assets.loansAndReceivables.items.find((i) => i.code === '1140')?.amount || 1;
    const nplProvisionCoverage = financialMath.round((allowance / (nplLoans || 1)) * 100);

    // 4. Return on Assets (Annualized)
    const returnOnAssets = financialMath.round((is.netOperatingSurplus / totalAssets) * 100);

    // 5. Return on Equity (Annualized)
    const returnOnEquity = financialMath.round((is.netOperatingSurplus / totalEquity) * 100);

    // 6. Operating Efficiency Ratio
    const operatingEfficiencyRatio = financialMath.round((totalOperatingExpenses / totalRevenue) * 100);

    // 7. Loan to Deposit Ratio
    const loanToDepositRatio = financialMath.round((grossLoans / totalSavings) * 100);

    return {
      asOfDate: targetDate,
      liquidityRatio,
      capitalAdequacyRatio,
      nplProvisionCoverage,
      returnOnAssets,
      returnOnEquity,
      operatingEfficiencyRatio,
      loanToDepositRatio,
    };
  }

  // ==========================================
  // ACCOUNTING PERIOD LIFECYCLE
  // ==========================================

  public getAccountingPeriods(): DbAccountingPeriod[] {
    return db.getAccountingPeriods();
  }

  public createAccountingPeriod(
    data: {
      name: string;
      type: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
      startDate: string;
      endDate: string;
    },
    user: { id: string; name: string; role: string }
  ): { success: boolean; period?: DbAccountingPeriod; error?: string } {
    const existing = db.getAccountingPeriods().find((p) => p.name === data.name || (p.startDate === data.startDate && p.endDate === data.endDate && p.type === data.type));
    if (existing) {
      return { success: false, error: 'An accounting period with this date range or name already exists' };
    }

    const newPeriod: DbAccountingPeriod = {
      id: `prd_${Date.now()}`,
      name: data.name,
      type: data.type,
      startDate: data.startDate,
      endDate: data.endDate,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.createAccountingPeriod(newPeriod);

    securityService.recordAuditLog(user, 'ACCOUNTING_PERIOD_CREATED', 'accountingPeriods', newPeriod.id, {
      afterState: { periodId: newPeriod.id, name: newPeriod.name, type: newPeriod.type },
    });

    return { success: true, period: newPeriod };
  }

  public closeAccountingPeriod(
    periodId: string,
    user: { id: string; name: string; role: string }
  ): { success: boolean; period?: DbAccountingPeriod; error?: string } {
    const period = db.getAccountingPeriodById(periodId);
    if (!period) {
      return { success: false, error: 'Accounting period not found' };
    }
    if (period.status === 'LOCKED') {
      return { success: false, error: 'Period is already locked by external audit' };
    }

    // Verify Trial Balance is balanced before closing
    const trialBalance = this.getTrialBalance(period.endDate);
    if (!trialBalance.isBalanced) {
      return {
        success: false,
        error: `Cannot close period: Trial Balance has discrepancy of ${trialBalance.discrepancy} ETB. Debits must equal Credits.`,
      };
    }

    // Compute period income and expense surplus
    const incomeStatement = this.getIncomeStatement(period.startDate, period.endDate);
    const netSurplus = incomeStatement.netOperatingSurplus;
    const statutoryReserve = incomeStatement.statutoryReserve30Pct;
    const retainedEarnings = incomeStatement.retainedSurplus70Pct;

    const updated = db.updateAccountingPeriod(periodId, {
      status: 'CLOSED',
      closedAt: new Date().toISOString(),
      closedById: user.id,
      closedByName: `${user.name} (${user.role})`,
      netSurplus,
      statutoryReserveAllocation: statutoryReserve,
      retainedEarningsAllocation: retainedEarnings,
    });

    securityService.recordAuditLog(user, 'ACCOUNTING_PERIOD_CLOSED', 'accountingPeriods', periodId, {
      afterState: { periodId, netSurplus, statutoryReserve, retainedEarnings },
    });

    return { success: true, period: updated };
  }

  public lockAccountingPeriod(
    periodId: string,
    user: { id: string; name: string; role: string }
  ): { success: boolean; period?: DbAccountingPeriod; error?: string } {
    const period = db.getAccountingPeriodById(periodId);
    if (!period) {
      return { success: false, error: 'Accounting period not found' };
    }

    const updated = db.updateAccountingPeriod(periodId, {
      status: 'LOCKED',
      lockedAt: new Date().toISOString(),
      lockedById: user.id,
      lockedByName: `${user.name} (${user.role})`,
    });

    securityService.recordAuditLog(user, 'ACCOUNTING_PERIOD_LOCKED', 'accountingPeriods', periodId, {
      afterState: { periodId, name: period.name },
    });

    return { success: true, period: updated };
  }

  public reopenAccountingPeriod(
    periodId: string,
    reason: string,
    user: { id: string; name: string; role: string }
  ): { success: boolean; period?: DbAccountingPeriod; error?: string } {
    const period = db.getAccountingPeriodById(periodId);
    if (!period) {
      return { success: false, error: 'Accounting period not found' };
    }

    const updated = db.updateAccountingPeriod(periodId, {
      status: 'OPEN',
      lockedAt: undefined,
      lockedById: undefined,
      lockedByName: undefined,
    });

    securityService.recordAuditLog(user, 'ACCOUNTING_PERIOD_REOPENED', 'accountingPeriods', periodId, {
      afterState: { periodId, name: period.name, reason },
    });

    return { success: true, period: updated };
  }

  // ==========================================
  // BANK RECONCILIATIONS
  // ==========================================

  public getBankReconciliations(): DbBankReconciliation[] {
    return db.getBankReconciliations();
  }

  public getBankReconciliationById(id: string): DbBankReconciliation | undefined {
    return db.getBankReconciliationById(id);
  }

  public createBankReconciliation(
    data: {
      bankAccountId: string;
      bankAccountCode: string;
      period: string; // e.g. "2026-08"
      statementDate: string;
      statementBalance: number;
      uncreditedDeposits?: number;
      unpresentedPayments?: number;
      notes?: string;
      items?: DbBankReconciliationItem[];
    },
    user: { id: string; name: string; role: string }
  ): { success: boolean; reconciliation?: DbBankReconciliation; error?: string } {
    const account = db.getChartOfAccountById(data.bankAccountCode);
    const bankAccountName = account?.accountName || 'Bank Account';

    // Compute Book Balance from GL as of statementDate
    const glReport = this.getGeneralLedger(data.bankAccountCode, '2020-01-01', data.statementDate);
    const bookBalance = glReport.closingBalance;

    const uncreditedDeposits = data.uncreditedDeposits || 0;
    const unpresentedPayments = data.unpresentedPayments || 0;

    // Adjusted Bank Balance = Statement Balance + Uncredited Deposits - Unpresented Payments
    const adjustedBankBalance = financialMath.round(data.statementBalance + uncreditedDeposits - unpresentedPayments);
    const adjustedBookBalance = bookBalance;
    const variance = financialMath.round(Math.abs(adjustedBankBalance - adjustedBookBalance));
    const status = variance < 0.01 ? 'RECONCILED' : 'DISCREPANCY';

    const reconciliationNo = db.nextReconciliationNumber(data.bankAccountCode, data.period);

    const newRecon: DbBankReconciliation = {
      id: `recon_${Date.now()}`,
      reconciliationNo,
      bankAccountId: data.bankAccountId,
      bankAccountCode: data.bankAccountCode,
      bankAccountName,
      period: data.period,
      statementDate: data.statementDate,
      statementBalance: data.statementBalance,
      bookBalance,
      uncreditedDeposits,
      unpresentedPayments,
      adjustedBankBalance,
      adjustedBookBalance,
      variance,
      status,
      reconciledById: user.id,
      reconciledByName: `${user.name} (${user.role})`,
      reconciledAt: new Date().toISOString(),
      notes: data.notes,
      items: data.items || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.createBankReconciliation(newRecon);

    securityService.recordAuditLog(user, 'BANK_RECONCILIATION_PERFORMED', 'bankReconciliations', newRecon.id, {
      afterState: {
        reconciliationNo,
        bankAccountCode: data.bankAccountCode,
        statementBalance: data.statementBalance,
        bookBalance,
        variance,
      },
    });

    return { success: true, reconciliation: newRecon };
  }

  // ==========================================
  // ANNUAL BUDGETS & VARIANCE ANALYSIS
  // ==========================================

  public getAnnualBudgets(): DbAnnualBudget[] {
    return db.getAnnualBudgets();
  }

  public getAnnualBudgetById(id: string): DbAnnualBudget | undefined {
    return db.getAnnualBudgetById(id);
  }

  public createAnnualBudget(
    data: {
      fiscalYear: number;
      title: string;
      items: DbAnnualBudgetItem[];
      notes?: string;
    },
    user: { id: string; name: string; role: string }
  ): { success: boolean; budget?: DbAnnualBudget; error?: string } {
    let totalBudgetedIncome = 0;
    let totalBudgetedExpense = 0;

    for (const item of data.items) {
      if (item.accountType === 'INCOME') {
        totalBudgetedIncome = financialMath.round(totalBudgetedIncome + (item.annualBudget || 0));
      } else if (item.accountType === 'EXPENSE') {
        totalBudgetedExpense = financialMath.round(totalBudgetedExpense + (item.annualBudget || 0));
      }
    }

    const projectedNetSurplus = financialMath.round(totalBudgetedIncome - totalBudgetedExpense);

    const newBudget: DbAnnualBudget = {
      id: `bgt_${data.fiscalYear}_${Date.now()}`,
      fiscalYear: data.fiscalYear,
      title: data.title,
      status: 'DRAFT',
      totalBudgetedIncome,
      totalBudgetedExpense,
      projectedNetSurplus,
      items: data.items,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.createAnnualBudget(newBudget);

    securityService.recordAuditLog(user, 'ANNUAL_BUDGET_CREATED', 'annualBudgets', newBudget.id, {
      afterState: { fiscalYear: data.fiscalYear, title: data.title },
    });

    return { success: true, budget: newBudget };
  }

  public approveAnnualBudget(
    budgetId: string,
    user: { id: string; name: string; role: string }
  ): { success: boolean; budget?: DbAnnualBudget; error?: string } {
    const budget = db.getAnnualBudgetById(budgetId);
    if (!budget) {
      return { success: false, error: 'Budget not found' };
    }

    const updated = db.updateAnnualBudget(budgetId, {
      status: 'ACTIVE',
      approvedById: user.id,
      approvedByName: `${user.name} (${user.role})`,
      approvedAt: new Date().toISOString(),
    });

    securityService.recordAuditLog(user, 'ANNUAL_BUDGET_APPROVED', 'annualBudgets', budgetId, {
      afterState: { budgetId, fiscalYear: budget.fiscalYear },
    });

    return { success: true, budget: updated };
  }

  public getBudgetVarianceReport(fiscalYear?: number): BudgetVarianceReport {
    const targetYear = fiscalYear || new Date().getFullYear();
    const budget = db.getActiveAnnualBudget(targetYear);
    const is = this.getIncomeStatement(`${targetYear}-01-01`, `${targetYear}-12-31`);

    const defaultItems: BudgetVarianceItem[] = [];

    let totalBudgetedIncome = budget?.totalBudgetedIncome || 950000;
    let totalBudgetedExpense = budget?.totalBudgetedExpense || 380000;
    let actualIncome = is.revenue.total;
    let actualExpense = is.totalExpenses;

    if (budget && budget.items) {
      for (const item of budget.items) {
        // Find actual from GL/Income statement
        const isItem =
          is.revenue.items.find((i) => i.code === item.accountCode) ||
          is.operatingExpenses.items.find((i) => i.code === item.accountCode) ||
          is.costOfFunds.items.find((i) => i.code === item.accountCode) ||
          is.loanLossProvisions.items.find((i) => i.code === item.accountCode);

        const actualAmount = isItem ? isItem.amount : 0;
        const budgetAmount = item.annualBudget || 0;
        const varianceAmount = financialMath.round(actualAmount - budgetAmount);
        const variancePercentage = budgetAmount > 0 ? financialMath.round((varianceAmount / budgetAmount) * 100) : 0;

        const isFavorable = item.accountType === 'INCOME' ? varianceAmount >= 0 : varianceAmount <= 0;

        defaultItems.push({
          accountCode: item.accountCode,
          accountName: item.accountName,
          accountType: item.accountType,
          budgetAmount,
          actualAmount,
          varianceAmount,
          variancePercentage,
          isFavorable,
          notes: item.notes,
        });
      }
    }

    const incomeVariance = financialMath.round(actualIncome - totalBudgetedIncome);
    const expenseVariance = financialMath.round(actualExpense - totalBudgetedExpense);
    const projectedNetSurplus = financialMath.round(totalBudgetedIncome - totalBudgetedExpense);
    const actualNetSurplus = is.netOperatingSurplus;
    const surplusVariance = financialMath.round(actualNetSurplus - projectedNetSurplus);

    return {
      fiscalYear: targetYear,
      budgetTitle: budget?.title || `FY${targetYear} Operating Budget`,
      totalBudgetedIncome,
      actualIncome,
      incomeVariance,
      totalBudgetedExpense,
      actualExpense,
      expenseVariance,
      projectedNetSurplus,
      actualNetSurplus,
      surplusVariance,
      items: defaultItems,
    };
  }
}

export const accountingService = new AccountingService();
