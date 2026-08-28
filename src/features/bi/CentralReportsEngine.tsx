import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Filter,
  RefreshCw,
  Search,
  Calendar,
  Layers,
  Printer,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  X,
  Mail,
  Users,
  PiggyBank,
  PieChart,
  Landmark,
  Scale,
  ShieldCheck,
  Building
} from 'lucide-react';
import { biApiService, ReportFilterRequest } from '../../services/biApiService';
import { ReportResponseData, ScheduledReportItem } from './types';
import { formatCurrency, formatDateTime, formatDate } from '../../utils/formatters';
import { useToast } from '../../providers/ToastProvider';
import { useAuth } from '../../providers/AuthProvider';

export const REPORT_CATALOG = [
  // 1. Members
  { id: 'member', category: 'members', title: 'Member Master Register', description: 'Comprehensive list of all registered members with KYC, tier and status', icon: 'Users' },
  { id: 'member_growth', category: 'members', title: 'Member Growth & Attrition', description: 'Monthly influx and churn breakdown with demographic distributions', icon: 'Users' },

  // 2. Savings
  { id: 'savings_all', category: 'savings', title: 'All Savings Portfolio Report', description: 'Consolidated balances, active passbooks, and monthly accruals', icon: 'PiggyBank' },
  { id: 'savings_regular', category: 'savings', title: 'Compulsory Regular Savings', description: 'Mandatory monthly contributions schedule and arrears tracker', icon: 'PiggyBank' },
  { id: 'savings_voluntary', category: 'savings', title: 'Voluntary Savings Report', description: 'On-demand liquidity accounts, deposits and withdrawals', icon: 'PiggyBank' },
  { id: 'savings_children', category: 'savings', title: 'Children Savings Scheme', description: 'Minor accounts with custodian oversight and locked interest tiers', icon: 'PiggyBank' },
  { id: 'savings_time_deposit', category: 'savings', title: 'Time Deposit Certificates', description: 'Fixed-term deposit commitments, maturity schedules and yields', icon: 'PiggyBank' },

  // 3. Shares
  { id: 'shares', category: 'shares', title: 'Share Capital Register', description: 'Member equity shareholdings, par values, and dividend entitlements', icon: 'PieChart' },
  { id: 'interest_dividend', category: 'shares', title: 'Dividend & Interest Yields', description: 'Projected and distributed returns on member equity and savings', icon: 'PieChart' },

  // 4. Loans
  { id: 'loans', category: 'loans', title: 'Loan Portfolio Schedule', description: 'All active, pending and completed loans with tenor and balances', icon: 'Landmark' },
  { id: 'repayment', category: 'loans', title: 'Loan Repayments Schedule', description: 'Principal, interest, penalty collections and teller receipts', icon: 'Landmark' },
  { id: 'outstanding_loan', category: 'loans', title: 'Outstanding Loans Balances', description: 'Active principal exposure, accrued interest, and maturity profile', icon: 'Landmark' },
  { id: 'loan_aging', category: 'loans', title: 'Loan Aging & PAR Schedule', description: 'Delinquency aging buckets (Current, 1-30, 31-60, 61-90, >90 Days)', icon: 'Landmark' },
  { id: 'defaulter', category: 'loans', title: 'Defaulters & Remedial Actions', description: 'Non-performing loans, guarantor calls, and recovery actions', icon: 'Landmark' },

  // 5. Accounting & Financial Statements
  { id: 'balance_sheet', category: 'accounting', title: 'Statement of Financial Position (Balance Sheet)', description: 'Assets, liabilities, and cooperative equity reserves as of report date', icon: 'Scale' },
  { id: 'income_statement', category: 'accounting', title: 'Statement of Comprehensive Income (P&L)', description: 'Interest income, fees, operating expenditures and net surplus', icon: 'Scale' },
  { id: 'cash_flow', category: 'accounting', title: 'Statement of Cash Flows', description: 'Operating, investing, and financing cash movements', icon: 'Scale' },
  { id: 'trial_balance', category: 'accounting', title: 'Trial Balance Verification', description: 'General ledger debit and credit equilibrium audit report', icon: 'Scale' },
  { id: 'general_ledger', category: 'accounting', title: 'General Ledger Detail Report', description: 'Line-by-line journal postings per chart of account code', icon: 'Scale' },
  { id: 'journal', category: 'accounting', title: 'Journal Voucher Register', description: 'Chronological double-entry transactions and maker-checker stamps', icon: 'Scale' },
  { id: 'budget_variance', category: 'accounting', title: 'Budget vs Actual Variance', description: 'Departmental budget allocations versus realized expenses', icon: 'Scale' },

  // 6. Audits & Operational Desk
  { id: 'transaction', category: 'audits', title: 'Financial Transactions Audit', description: 'Teller and digital transactions with audit hash signatures', icon: 'ShieldCheck' },
  { id: 'withdrawal', category: 'audits', title: 'Withdrawals & Liquidity Outflows', description: 'Cash and bank disbursements with dual-authorization signatures', icon: 'ShieldCheck' },
  { id: 'deposit', category: 'audits', title: 'Deposits & Inflow Analysis', description: 'Slip verifications, CBE transfers, and counter teller collections', icon: 'ShieldCheck' },
  { id: 'teller_closure', category: 'audits', title: 'Daily Teller Vault Reconciliation', description: 'Till balance balancing, shortages/overages, and end-of-day closures', icon: 'ShieldCheck' },
  { id: 'audit_log', category: 'audits', title: 'System Security & Access Trail', description: 'Immutable log of administrative overrides, logins and role grants', icon: 'ShieldCheck' },
];

export const CentralReportsEngine: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'REPORTS' | 'SCHEDULES'>('REPORTS');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReportId, setSelectedReportId] = useState<string>('balance_sheet');

  // Filters State
  const [filters, setFilters] = useState<ReportFilterRequest>({
    page: 1,
    limit: 25,
    startDate: '',
    endDate: '',
    membershipNo: '',
    status: '',
  });

  // Report Data
  const [reportResult, setReportResult] = useState<ReportResponseData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Scheduled Reports
  const [scheduledReports, setScheduledReports] = useState<ScheduledReportItem[]>([]);
  const [isSchedModalOpen, setIsSchedModalOpen] = useState(false);
  const [schedForm, setSchedForm] = useState({
    title: '',
    reportType: 'balance_sheet',
    frequency: 'MONTHLY' as const,
    format: 'PDF' as const,
    recipients: '',
  });

  // Fetch report on selectedReportId or filter change
  const executeReport = async (overrideFilters?: Partial<ReportFilterRequest>) => {
    setIsLoading(true);
    try {
      const mergedFilters = { ...filters, ...(overrideFilters || {}) };
      const res = await biApiService.getReport(selectedReportId, mergedFilters);
      setReportResult(res.data);
    } catch (err: any) {
      toastError('Report Generation Failed', err?.message || 'Could not compile report.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchScheduledReports = async () => {
    try {
      const res = await biApiService.getScheduledReports();
      setScheduledReports(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'REPORTS') {
      executeReport();
    } else {
      fetchScheduledReports();
    }
  }, [selectedReportId, activeTab]);

  const handleExportCSV = async () => {
    try {
      const csvData = await biApiService.exportReportData(selectedReportId, filters);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${selectedReportId}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      success('CSV Export Ready', `Downloaded ${selectedReportId} dataset.`);
    } catch (err: any) {
      toastError('Export Failed', err?.message || 'Could not export CSV file.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedForm.title.trim() || !schedForm.recipients.trim()) {
      toastError('Form Incomplete', 'Please provide a title and at least one recipient email.');
      return;
    }

    try {
      const recipientList = schedForm.recipients.split(',').map(s => s.trim()).filter(Boolean);
      await biApiService.createScheduledReport({
        title: schedForm.title,
        reportType: schedForm.reportType,
        frequency: schedForm.frequency,
        format: schedForm.format,
        recipients: recipientList,
        filters: {},
      });
      success('Report Scheduled', `Automated delivery set up for "${schedForm.title}".`);
      setIsSchedModalOpen(false);
      setSchedForm({
        title: '',
        reportType: 'balance_sheet',
        frequency: 'MONTHLY',
        format: 'PDF',
        recipients: '',
      });
      fetchScheduledReports();
    } catch (err: any) {
      toastError('Scheduling Failed', err?.message || 'Could not schedule report.');
    }
  };

  const handleRunScheduledNow = async (id: string) => {
    try {
      const res = await biApiService.runScheduledReportNow(id);
      success('Dispatched Now', res.message || 'Report generated and dispatched to recipients.');
      fetchScheduledReports();
    } catch (err: any) {
      toastError('Execution Failed', err?.message || 'Could not trigger report dispatch.');
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scheduled report dispatch?')) return;
    try {
      await biApiService.deleteScheduledReport(id);
      success('Deleted', 'Scheduled report has been removed.');
      fetchScheduledReports();
    } catch (err: any) {
      toastError('Delete Failed', err?.message || 'Could not remove schedule.');
    }
  };

  const filteredCatalog = REPORT_CATALOG.filter((rep) => {
    const matchesCategory = selectedCategory === 'all' || rep.category === selectedCategory;
    const matchesSearch = rep.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          rep.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeReportMeta = REPORT_CATALOG.find((r) => r.id === selectedReportId) || REPORT_CATALOG[0];

  return (
    <div id="central-reports-engine-view" className="space-y-6 pb-12">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Enterprise Reporting & Statements Engine</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Standardized financial statements, portfolio aging matrices, ledger audits, and scheduled dispatches.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('REPORTS')}
            className={`px-3.5 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'REPORTS'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Interactive Reports</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SCHEDULES')}
            className={`px-3.5 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'SCHEDULES'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Scheduled Dispatches</span>
          </button>
        </div>
      </div>

      {activeTab === 'REPORTS' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Report Catalog Selector */}
          <div className="lg:col-span-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Report Catalog (25+ Statements)
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter report catalog..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
              {[
                { id: 'all', label: 'All' },
                { id: 'accounting', label: 'Financial' },
                { id: 'loans', label: 'Loans' },
                { id: 'savings', label: 'Savings' },
                { id: 'members', label: 'Members' },
                { id: 'shares', label: 'Shares' },
                { id: 'audits', label: 'Audits' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Catalog List */}
            <div className="max-h-[580px] overflow-y-auto space-y-1.5 pr-1">
              {filteredCatalog.map((rep) => (
                <button
                  key={rep.id}
                  type="button"
                  onClick={() => setSelectedReportId(rep.id)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                    selectedReportId === rep.id
                      ? 'bg-blue-50/80 border-blue-300 ring-1 ring-blue-500 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${
                      selectedReportId === rep.id ? 'text-blue-900' : 'text-slate-800'
                    }`}>
                      {rep.title}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">
                      {rep.category}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                    {rep.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Active Report Viewer & Filter Drawer */}
          <div className="lg:col-span-8 space-y-6">
            {/* Filter Control Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{activeReportMeta.title}</h3>
                  <p className="text-xs text-slate-500">{activeReportMeta.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print PDF</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Filter Form Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Member ID / No</label>
                  <input
                    type="text"
                    value={filters.membershipNo || ''}
                    onChange={(e) => setFilters({ ...filters, membershipNo: e.target.value, page: 1 })}
                    placeholder="e.g. WB000143"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={() => executeReport()}
                    disabled={isLoading}
                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Run Query</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFilters({ page: 1, limit: 25, startDate: '', endDate: '', membershipNo: '', status: '' });
                      executeReport({ page: 1, limit: 25, startDate: '', endDate: '', membershipNo: '', status: '' });
                    }}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md font-semibold text-xs"
                    title="Reset Filters"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Report Summary Cards (if provided in reportResult) */}
            {reportResult?.summary && Object.keys(reportResult.summary).length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(reportResult.summary).map(([key, val], idx) => {
                  const isCurrency = typeof val === 'number' && key.toLowerCase().includes('amount') || key.toLowerCase().includes('total') || key.toLowerCase().includes('balance');
                  const formattedVal = isCurrency ? formatCurrency(val as number) : String(val);

                  return (
                    <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div className="text-base font-extrabold text-slate-900 mt-1 font-mono">
                        {formattedVal}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Report Table Display */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Header Info */}
              <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">Generated:</span>
                  <span>{reportResult?.generatedAt ? formatDateTime(reportResult.generatedAt) : '---'}</span>
                  <span>•</span>
                  <span className="font-semibold text-slate-800">Records:</span>
                  <span>{reportResult?.pagination?.totalCount || reportResult?.data?.length || 0}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  SACCO CORE FINANCIAL DISPATCH
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <tr>
                      {reportResult?.columns && reportResult.columns.length > 0 ? (
                        reportResult.columns.map((col: any) => (
                          <th key={col.key} className="py-3 px-4">
                            {col.label}
                          </th>
                        ))
                      ) : (
                        <th className="py-3 px-4">Record Details</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-slate-400">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                          <span>Generating statement dataset...</span>
                        </td>
                      </tr>
                    ) : reportResult?.data && reportResult.data.length > 0 ? (
                      reportResult.data.map((row: any, rIdx: number) => (
                        <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                          {reportResult.columns.map((col: any) => {
                            const val = row[col.key];
                            let formatted = val;

                            if (col.type === 'currency' && typeof val === 'number') {
                              formatted = <span className="font-mono font-bold text-slate-900">{formatCurrency(val)}</span>;
                            } else if (col.type === 'date' && val) {
                              formatted = <span className="text-slate-600">{formatDate(val)}</span>;
                            } else if (col.type === 'badge') {
                              formatted = (
                                <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                  val === 'ACTIVE' || val === 'POSTED' || val === 'CURRENT'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {val}
                                </span>
                              );
                            }

                            return (
                              <td key={col.key} className="py-2.5 px-4 font-medium text-slate-700">
                                {formatted !== undefined && formatted !== null ? formatted : '-'}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="py-10 text-center text-slate-400">
                          No matching records found for the applied filter criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {reportResult?.pagination && reportResult.pagination.totalPages > 1 && (
                <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
                  <span>
                    Showing page {reportResult.pagination.page} of {reportResult.pagination.totalPages} ({reportResult.pagination.totalCount} total entries)
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={reportResult.pagination.page <= 1}
                      onClick={() => {
                        const newPage = (filters.page || 1) - 1;
                        setFilters({ ...filters, page: newPage });
                        executeReport({ page: newPage });
                      }}
                      className="p-1.5 border border-slate-200 bg-white rounded-md disabled:opacity-40 hover:bg-slate-100 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={reportResult.pagination.page >= reportResult.pagination.totalPages}
                      onClick={() => {
                        const newPage = (filters.page || 1) + 1;
                        setFilters({ ...filters, page: newPage });
                        executeReport({ page: newPage });
                      }}
                      className="p-1.5 border border-slate-200 bg-white rounded-md disabled:opacity-40 hover:bg-slate-100 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Scheduled Reports Sub-View */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Scheduled Automated Dispatches</h3>
              <p className="text-xs text-slate-500">Configure recurring automated financial statements sent via email/system outbox.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsSchedModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule New Report</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Title & Report</th>
                  <th className="py-3 px-4">Frequency</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Recipients</th>
                  <th className="py-3 px-4">Next Dispatch</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scheduledReports.length > 0 ? (
                  scheduledReports.map((sch) => (
                    <tr key={sch.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{sch.title}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{sch.reportType}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-700">{sch.frequency}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {sch.format}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate">
                        {sch.recipients.join(', ')}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {sch.nextRunAt ? formatDate(sch.nextRunAt) : 'Immediate'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sch.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {sch.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleRunScheduledNow(sch.id)}
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md font-semibold text-[11px] transition-colors"
                        >
                          Run Now
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSchedule(sch.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No automated scheduled dispatches configured. Click "Schedule New Report" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Schedule New Report */}
      {isSchedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Schedule Automated Financial Dispatch</h3>
              <button
                type="button"
                onClick={() => setIsSchedModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Schedule Name / Job Title</label>
                <input
                  type="text"
                  required
                  value={schedForm.title}
                  onChange={(e) => setSchedForm({ ...schedForm, title: e.target.value })}
                  placeholder="e.g. Monthly Board Balance Sheet Packet"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Report Statement</label>
                <select
                  value={schedForm.reportType}
                  onChange={(e) => setSchedForm({ ...schedForm, reportType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                >
                  {REPORT_CATALOG.map((r) => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Frequency</label>
                  <select
                    value={schedForm.frequency}
                    onChange={(e) => setSchedForm({ ...schedForm, frequency: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                  >
                    <option value="DAILY">Daily (End of Day)</option>
                    <option value="WEEKLY">Weekly (Monday)</option>
                    <option value="MONTHLY">Monthly (1st Day)</option>
                    <option value="QUARTERLY">Quarterly</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Output Format</label>
                  <select
                    value={schedForm.format}
                    onChange={(e) => setSchedForm({ ...schedForm, format: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="EXCEL">Excel Spreadsheet</option>
                    <option value="CSV">CSV Data File</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Recipient Email Addresses (comma-separated)</label>
                <input
                  type="text"
                  required
                  value={schedForm.recipients}
                  onChange={(e) => setSchedForm({ ...schedForm, recipients: e.target.value })}
                  placeholder="manager@wabisacco.com, auditor@wabisacco.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSchedModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
