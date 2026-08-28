import { db } from '../db/database';

export interface SearchResultItem {
  category: 'MEMBERS' | 'TRANSACTIONS' | 'LOANS' | 'SAVINGS' | 'SHARES' | 'JOURNALS' | 'ACCOUNTS' | 'REPORTS';
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  linkRoute?: string;
  data: Record<string, any>;
}

export interface SearchResponse {
  query: string;
  totalResults: number;
  results: SearchResultItem[];
}

class SearchService {
  public search(query: string, limit: number = 25, memberFilter?: { memberId?: string; membershipNo?: string; isMemberOnly?: boolean }): SearchResponse {
    const q = (query || '').trim().toLowerCase();
    if (!q) {
      return { query: '', totalResults: 0, results: [] };
    }

    const results: SearchResultItem[] = [];

    // If Member Only mode (member role isolation)
    if (memberFilter?.isMemberOnly) {
      const memId = memberFilter.memberId;
      const memNo = memberFilter.membershipNo;

      // 1. Only Member's Own Savings
      const savings = db.getSavingAccounts().filter(s => s.memberId === memId || s.membershipNo === memNo);
      for (const s of savings) {
        if (s.accountNo.toLowerCase().includes(q) || s.productName.toLowerCase().includes(q)) {
          results.push({
            category: 'SAVINGS',
            id: s.id,
            title: `${s.accountNo} - ${s.productName}`,
            subtitle: `Balance: ETB ${s.balance.toLocaleString()}`,
            badge: s.status,
            data: s,
          });
        }
      }

      // 2. Only Member's Own Loans
      const loans = db.getLoans().filter(l => l.memberId === memId || l.membershipNo === memNo);
      for (const l of loans) {
        if (l.loanNo.toLowerCase().includes(q) || l.productName.toLowerCase().includes(q)) {
          const principal = l.approvedAmount || l.requestedAmount || 0;
          results.push({
            category: 'LOANS',
            id: l.id,
            title: `${l.loanNo} - ${l.productName}`,
            subtitle: `Principal: ETB ${principal.toLocaleString()} • Status: ${l.status}`,
            badge: l.status,
            data: l,
          });
        }
      }

      // 3. Only Member's Own Shares
      const shares = db.getShareAccounts().filter(sh => sh.memberId === memId || sh.membershipNo === memNo);
      for (const sh of shares) {
        if (sh.accountNo.toLowerCase().includes(q)) {
          results.push({
            category: 'SHARES',
            id: sh.id,
            title: `${sh.accountNo} - Share Equity`,
            subtitle: `Shares: ${sh.numberOfShares} (ETB ${(sh.totalShareValue || 0).toLocaleString()})`,
            badge: sh.status,
            data: sh,
          });
        }
      }

      // 4. Only Member's Own Transactions
      const transactions = db.getFinancialTransactions().filter(t => t.memberId === memId || t.membershipNo === memNo);
      for (const t of transactions) {
        if (
          t.transactionNo.toLowerCase().includes(q) ||
          (t.narration && t.narration.toLowerCase().includes(q)) ||
          t.accountNo.toLowerCase().includes(q)
        ) {
          results.push({
            category: 'TRANSACTIONS',
            id: t.id,
            title: `${t.transactionNo} - ${t.type}`,
            subtitle: `ETB ${t.amount.toLocaleString()} • ${t.paymentChannel}`,
            badge: t.status,
            data: t,
          });
        }
      }

      return {
        query,
        totalResults: results.length,
        results: results.slice(0, limit),
      };
    }

    // 1. Search Members (Staff/Admin Only)
    const members = db.getMembers();
    for (const m of members) {
      if (
        m.fullName.toLowerCase().includes(q) ||
        m.membershipNo.toLowerCase().includes(q) ||
        (m.phoneNumber && m.phoneNumber.toLowerCase().includes(q)) ||
        (m.nationalId && m.nationalId.toLowerCase().includes(q))
      ) {
        results.push({
          category: 'MEMBERS',
          id: m.id,
          title: `${m.fullName} (${m.membershipNo})`,
          subtitle: `Phone: ${m.phoneNumber} • Status: ${m.status}`,
          badge: m.status,
          data: m,
        });
      }
    }

    // 2. Search Transactions
    const transactions = db.getFinancialTransactions();
    for (const t of transactions) {
      if (
        t.transactionNo.toLowerCase().includes(q) ||
        (t.bankReferenceNo && t.bankReferenceNo.toLowerCase().includes(q)) ||
        (t.narration && t.narration.toLowerCase().includes(q)) ||
        t.memberName.toLowerCase().includes(q) ||
        t.membershipNo.toLowerCase().includes(q) ||
        t.accountNo.toLowerCase().includes(q)
      ) {
        results.push({
          category: 'TRANSACTIONS',
          id: t.id,
          title: `${t.transactionNo} - ${t.type}`,
          subtitle: `${t.memberName} • ETB ${t.amount.toLocaleString()} • ${t.paymentChannel}`,
          badge: t.status,
          data: t,
        });
      }
    }

    // 3. Search Loans
    const loans = db.getLoans();
    for (const l of loans) {
      if (
        l.loanNo.toLowerCase().includes(q) ||
        l.memberName.toLowerCase().includes(q) ||
        l.membershipNo.toLowerCase().includes(q) ||
        l.productName.toLowerCase().includes(q)
      ) {
        const principal = l.approvedAmount || l.requestedAmount || 0;
        results.push({
          category: 'LOANS',
          id: l.id,
          title: `${l.loanNo} - ${l.productName}`,
          subtitle: `${l.memberName} (${l.membershipNo}) • Principal: ETB ${principal.toLocaleString()}`,
          badge: l.status,
          data: l,
        });
      }
    }

    // 4. Search Savings Accounts
    const savings = db.getSavingAccounts();
    for (const s of savings) {
      if (
        s.accountNo.toLowerCase().includes(q) ||
        s.memberName.toLowerCase().includes(q) ||
        s.membershipNo.toLowerCase().includes(q) ||
        s.productName.toLowerCase().includes(q)
      ) {
        results.push({
          category: 'SAVINGS',
          id: s.id,
          title: `${s.accountNo} - ${s.productName}`,
          subtitle: `${s.memberName} • Balance: ETB ${s.balance.toLocaleString()}`,
          badge: s.status,
          data: s,
        });
      }
    }

    // 5. Search Shares
    const shares = db.getShareAccounts();
    for (const sh of shares) {
      if (
        sh.accountNo.toLowerCase().includes(q) ||
        sh.memberName.toLowerCase().includes(q) ||
        sh.membershipNo.toLowerCase().includes(q)
      ) {
        results.push({
          category: 'SHARES',
          id: sh.id,
          title: `${sh.accountNo} - Share Equity Account`,
          subtitle: `${sh.memberName} • Shares: ${sh.numberOfShares} (ETB ${(sh.totalShareValue || 0).toLocaleString()})`,
          badge: sh.status,
          data: sh,
        });
      }
    }

    // 6. Search Journal Entries
    const journals = db.getJournalEntries();
    for (const j of journals) {
      if (
        j.journalNo.toLowerCase().includes(q) ||
        (j.narration && j.narration.toLowerCase().includes(q)) ||
        (j.transactionReference && j.transactionReference.toLowerCase().includes(q))
      ) {
        results.push({
          category: 'JOURNALS',
          id: j.id,
          title: `${j.journalNo} - Journal Voucher`,
          subtitle: `${j.narration} • ETB ${j.totalDebit.toLocaleString()}`,
          badge: j.status,
          data: j,
        });
      }
    }

    // 7. Search Chart of Accounts
    const coaList = db.getChartOfAccounts();
    for (const a of coaList) {
      if (
        a.accountCode.toLowerCase().includes(q) ||
        a.accountName.toLowerCase().includes(q) ||
        a.accountType.toLowerCase().includes(q)
      ) {
        results.push({
          category: 'ACCOUNTS',
          id: a.id,
          title: `${a.accountCode} - ${a.accountName}`,
          subtitle: `Type: ${a.accountType} • Normal Balance: ${a.normalBalance}`,
          badge: a.accountType,
          data: a,
        });
      }
    }

    // 8. Search System Reports
    const availableReports = [
      { id: 'member', title: 'Member Master Report', desc: 'Member registry and demographics' },
      { id: 'savings', title: 'Savings Portfolio Report', desc: 'Breakdown of member savings' },
      { id: 'share', title: 'Share Capital Report', desc: 'Paid-up equity and shares' },
      { id: 'loan', title: 'Loan Portfolio Report', desc: 'Active credit lines and disbursements' },
      { id: 'loan_repayment', title: 'Loan Repayments Report', desc: 'Recovery ledger' },
      { id: 'loan_aging', title: 'Portfolio at Risk (PAR) Aging', desc: 'PAR 30/60/90 days delinquency' },
      { id: 'income_statement', title: 'Statement of Comprehensive Income', desc: 'Revenue and expenses' },
      { id: 'balance_sheet', title: 'Statement of Financial Position', desc: 'Assets, liabilities and equity' },
      { id: 'cash_flow', title: 'Statement of Cash Flows', desc: 'Operating, investing, financing' },
      { id: 'trial_balance', title: 'General Ledger Trial Balance', desc: 'Double-entry balance verification' },
      { id: 'budget', title: 'Annual Operating Budget', desc: 'Budget allocations and limits' },
      { id: 'variance', title: 'Budget vs Actual Variance', desc: 'Variance tracking' },
      { id: 'audit', title: 'Cryptographic Audit Trail', desc: 'Security event logs' },
    ];

    for (const r of availableReports) {
      if (r.title.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)) {
        results.push({
          category: 'REPORTS',
          id: r.id,
          title: r.title,
          subtitle: r.desc,
          badge: 'REPORT',
          data: r,
        });
      }
    }

    return {
      query,
      totalResults: results.length,
      results: results.slice(0, limit),
    };
  }
}

export const searchService = new SearchService();
