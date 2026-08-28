import React, { useState, useEffect, useRef, useId } from 'react';
import {
  Search,
  X,
  Users,
  PiggyBank,
  PieChart,
  Landmark,
  Receipt,
  Scale,
  FileText,
  ArrowRight,
  Loader2,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { biApiService } from '../../services/biApiService';
import { GlobalSearchResult } from './types';
import { useNavigation } from '../../providers/NavigationProvider';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { ROUTES } from '../../constants/routes';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterCategory = 'ALL' | 'MEMBERS' | 'ACCOUNTS' | 'LOANS' | 'TRANSACTIONS' | 'ACCOUNTING' | 'REPORTS';

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<GlobalSearchResult | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('wabi_recent_searches') || '["Abebe", "LN-", "SAV-", "CBE"]');
    } catch {
      return ["Abebe", "LN-", "SAV-", "CBE"];
    }
  });

  const searchInputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { navigate } = useNavigation();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle Cmd+K / Ctrl+K keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search query
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await biApiService.globalSearch(query.trim(), 20);
        setResults(res.data);
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const saveRecentSearch = (term: string) => {
    const updated = [term, ...recentSearches.filter(s => s.toLowerCase() !== term.toLowerCase())].slice(0, 6);
    setRecentSearches(updated);
    try {
      localStorage.setItem('wabi_recent_searches', JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  };

  const handleSelectItem = (action: () => void, term?: string) => {
    if (term) saveRecentSearch(term);
    onClose();
    action();
  };

  if (!isOpen) return null;

  const totalCount = results?.totalResults || 0;
  const membersCount = results?.members?.length || 0;
  const accountsCount = results?.accounts?.length || 0;
  const loansCount = results?.loans?.length || 0;
  const txnCount = results?.transactions?.length || 0;
  const accCount = results?.accounting?.length || 0;
  const repCount = results?.reports?.length || 0;

  return (
    <div
      id="global-search-modal-backdrop"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-20 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="global-search-dialog"
        className="w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 bg-slate-50/70">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            id={searchInputId}
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search SACCO across Members, Accounts, Loans, Journals, Txns, Reports..."
            className="w-full bg-transparent text-base text-slate-900 placeholder:text-slate-400 focus:outline-hidden font-medium"
          />
          {isLoading && <Loader2 className="w-4 h-4 text-blue-600 animate-spin mr-2 shrink-0" />}
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/50 mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-mono font-semibold px-2 py-1 bg-white border border-slate-300 rounded text-slate-500 hover:bg-slate-100 shrink-0"
          >
            ESC
          </button>
        </div>

        {/* Category Filters Bar */}
        {results && totalCount > 0 && (
          <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-100/70 border-b border-slate-200 overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setActiveCategory('ALL')}
              className={`px-3 py-1 rounded-md font-semibold whitespace-nowrap transition-colors ${
                activeCategory === 'ALL'
                  ? 'bg-[#16A34A] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              All Results ({totalCount})
            </button>
            {membersCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveCategory('MEMBERS')}
                className={`px-3 py-1 rounded-md font-semibold whitespace-nowrap transition-colors ${
                  activeCategory === 'MEMBERS'
                    ? 'bg-[#16A34A] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                Members ({membersCount})
              </button>
            )}
            {accountsCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveCategory('ACCOUNTS')}
                className={`px-3 py-1 rounded-md font-semibold whitespace-nowrap transition-colors ${
                  activeCategory === 'ACCOUNTS'
                    ? 'bg-[#16A34A] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                Accounts ({accountsCount})
              </button>
            )}
            {loansCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveCategory('LOANS')}
                className={`px-3 py-1 rounded-md font-semibold whitespace-nowrap transition-colors ${
                  activeCategory === 'LOANS'
                    ? 'bg-[#16A34A] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                Loans ({loansCount})
              </button>
            )}
            {txnCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveCategory('TRANSACTIONS')}
                className={`px-3 py-1 rounded-md font-semibold whitespace-nowrap transition-colors ${
                  activeCategory === 'TRANSACTIONS'
                    ? 'bg-[#16A34A] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                Transactions ({txnCount})
              </button>
            )}
            {accCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveCategory('ACCOUNTING')}
                className={`px-3 py-1 rounded-md font-semibold whitespace-nowrap transition-colors ${
                  activeCategory === 'ACCOUNTING'
                    ? 'bg-[#16A34A] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                Accounting ({accCount})
              </button>
            )}
            {repCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveCategory('REPORTS')}
                className={`px-3 py-1 rounded-md font-semibold whitespace-nowrap transition-colors ${
                  activeCategory === 'REPORTS'
                    ? 'bg-[#16A34A] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                Reports ({repCount})
              </button>
            )}
          </div>
        )}

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 divide-y divide-slate-100">
          {/* No search entered -> show recent and suggested quick links */}
          {!query.trim() && (
            <div className="space-y-4 py-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Recent Queries
                </h4>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setQuery(term)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-md border border-slate-200 font-medium transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Quick Navigation
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleSelectItem(() => navigate(ROUTES.STAFF.MEMBERS))}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-blue-100 text-blue-700 rounded-md">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 group-hover:text-blue-700">Members Directory</div>
                        <div className="text-[11px] text-slate-400">Search KYC, activate, or manage members</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectItem(() => navigate(ROUTES.STAFF.REPORTS))}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-purple-100 text-purple-700 rounded-md">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 group-hover:text-purple-700">Financial Reports</div>
                        <div className="text-[11px] text-slate-400">Run General Ledger, PAR, Balance Sheet</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectItem(() => navigate(ROUTES.STAFF.LOANS))}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-md">
                        <Landmark className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 group-hover:text-emerald-700">Loan Portfolio</div>
                        <div className="text-[11px] text-slate-400">Applications, disbursements, and aging</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectItem(() => navigate(ROUTES.STAFF.ACCOUNTING))}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-amber-100 text-amber-700 rounded-md">
                        <Scale className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 group-hover:text-amber-700">General Ledger & COA</div>
                        <div className="text-[11px] text-slate-400">Double-entry journals and trial balances</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Results Listing */}
          {results && totalCount > 0 && (
            <div className="space-y-4">
              {/* 1. Members */}
              {(activeCategory === 'ALL' || activeCategory === 'MEMBERS') && results.members.length > 0 && (
                <div className="pt-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-600" /> Members ({results.members.length})
                  </div>
                  <div className="space-y-1.5">
                    {results.members.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => handleSelectItem(() => navigate(ROUTES.STAFF.MEMBERS), m.fullName)}
                        className="p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {m.membershipNo}
                          </span>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{m.fullName}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-2">
                              <span>Phone: {m.phone || 'N/A'}</span>
                              <span>•</span>
                              <span className={`font-semibold ${m.status === 'ACTIVE' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {m.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                          View Member <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Accounts */}
              {(activeCategory === 'ALL' || activeCategory === 'ACCOUNTS') && results.accounts.length > 0 && (
                <div className="pt-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <PiggyBank className="w-3.5 h-3.5 text-emerald-600" /> Accounts & Shares ({results.accounts.length})
                  </div>
                  <div className="space-y-1.5">
                    {results.accounts.map((acc) => (
                      <div
                        key={acc.id}
                        onClick={() =>
                          handleSelectItem(
                            () => navigate(acc.type === 'SAVINGS' ? ROUTES.STAFF.SAVINGS : ROUTES.STAFF.SHARES),
                            acc.accountNo
                          )
                        }
                        className="p-2.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {acc.accountNo}
                          </span>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              {acc.memberName} <span className="text-xs text-slate-400 font-normal">({acc.membershipNo})</span>
                            </div>
                            <div className="text-xs text-slate-500">{acc.productName}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-slate-900 font-mono">
                            {formatCurrency(acc.balance)}
                          </div>
                          <div className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">
                            {acc.type}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Loans */}
              {(activeCategory === 'ALL' || activeCategory === 'LOANS') && results.loans.length > 0 && (
                <div className="pt-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5 text-purple-600" /> Loan Files ({results.loans.length})
                  </div>
                  <div className="space-y-1.5">
                    {results.loans.map((loan) => (
                      <div
                        key={loan.id}
                        onClick={() => handleSelectItem(() => navigate(ROUTES.STAFF.LOANS), loan.loanNo)}
                        className="p-2.5 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition-colors cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            {loan.loanNo}
                          </span>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              {loan.memberName} <span className="text-xs text-slate-400 font-normal">({loan.membershipNo})</span>
                            </div>
                            <div className="text-xs text-slate-500">{loan.productName}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-slate-900 font-mono">
                            {formatCurrency(loan.outstanding)}
                          </div>
                          <div className="text-[10px] font-semibold text-purple-700">
                            Status: {loan.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Transactions */}
              {(activeCategory === 'ALL' || activeCategory === 'TRANSACTIONS') && results.transactions.length > 0 && (
                <div className="pt-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-amber-600" /> Transactions ({results.transactions.length})
                  </div>
                  <div className="space-y-1.5">
                    {results.transactions.map((txn) => (
                      <div
                        key={txn.id}
                        onClick={() => handleSelectItem(() => navigate(ROUTES.STAFF.TRANSACTIONS), txn.transactionNo)}
                        className="p-2.5 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 transition-colors cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {txn.transactionNo}
                          </span>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{txn.memberName}</div>
                            <div className="text-xs text-slate-500">
                              {txn.type} via {txn.channel} • {formatDateTime(txn.timestamp)}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm font-bold text-slate-900 font-mono">
                          {formatCurrency(txn.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Accounting */}
              {(activeCategory === 'ALL' || activeCategory === 'ACCOUNTING') && results.accounting.length > 0 && (
                <div className="pt-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-indigo-600" /> Accounting & Ledgers ({results.accounting.length})
                  </div>
                  <div className="space-y-1.5">
                    {results.accounting.map((ac) => (
                      <div
                        key={ac.id}
                        onClick={() => handleSelectItem(() => navigate(ROUTES.STAFF.ACCOUNTING), ac.codeOrNo)}
                        className="p-2.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            {ac.codeOrNo}
                          </span>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{ac.nameOrTitle}</div>
                            <div className="text-xs text-slate-500 uppercase">{ac.type.replace(/_/g, ' ')}</div>
                          </div>
                        </div>
                        <div className="text-sm font-bold text-slate-900 font-mono">
                          {formatCurrency(ac.amountOrBalance)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. Reports */}
              {(activeCategory === 'ALL' || activeCategory === 'REPORTS') && results.reports.length > 0 && (
                <div className="pt-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-rose-600" /> Reports Directory ({results.reports.length})
                  </div>
                  <div className="space-y-1.5">
                    {results.reports.map((rep) => (
                      <div
                        key={rep.id}
                        onClick={() => handleSelectItem(() => navigate(ROUTES.STAFF.REPORTS), rep.title)}
                        className="p-2.5 rounded-lg border border-slate-200 hover:border-rose-300 hover:bg-rose-50/50 transition-colors cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-rose-50 text-rose-700 rounded border border-rose-200">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{rep.title}</div>
                            <div className="text-xs text-slate-500">{rep.description}</div>
                          </div>
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-700 uppercase">
                          {rep.category}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No results found */}
          {query.trim().length >= 2 && !isLoading && results && totalCount === 0 && (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No matching records found</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Could not find any members, accounts, loans, transactions, journals, or reports matching "{query}".
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span>Navigation: <kbd className="font-mono bg-white px-1.5 py-0.5 border border-slate-300 rounded text-slate-600">↑</kbd> <kbd className="font-mono bg-white px-1.5 py-0.5 border border-slate-300 rounded text-slate-600">↓</kbd></span>
            <span>Select: <kbd className="font-mono bg-white px-1.5 py-0.5 border border-slate-300 rounded text-slate-600">↵</kbd></span>
          </div>
          <span className="text-[11px] font-medium text-slate-400">
            Wabi Core BI Search Index
          </span>
        </div>
      </div>
    </div>
  );
};
