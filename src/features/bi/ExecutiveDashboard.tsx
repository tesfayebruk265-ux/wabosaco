import React, { useState, useEffect } from 'react';
import {
  Users,
  PiggyBank,
  PieChart,
  Landmark,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Eye,
  FileSpreadsheet,
  Layers,
  Scale,
  Sparkles,
  ChevronRight,
  BarChart3,
  SlidersHorizontal
} from 'lucide-react';
import { biApiService } from '../../services/biApiService';
import { ExecutiveDashboardData } from './types';
import { formatCurrency, formatPercentage, formatDate } from '../../utils/formatters';
import { useNavigation } from '../../providers/NavigationProvider';
import { useToast } from '../../providers/ToastProvider';
import { ROUTES } from '../../constants/routes';

export const ExecutiveDashboard: React.FC = () => {
  const { navigate } = useNavigation();
  const { success, error: toastError } = useToast();

  const [data, setData] = useState<ExecutiveDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRangePreset, setTimeRangePreset] = useState<'TODAY' | 'MTD' | 'QTD' | 'YTD' | 'ALL'>('YTD');
  const [activeProductTab, setActiveProductTab] = useState<'LOANS' | 'SAVINGS'>('LOANS');

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Calculate date ranges based on preset
      const now = new Date();
      let startDate: string | undefined;
      const endDate = now.toISOString().split('T')[0];

      if (timeRangePreset === 'TODAY') {
        startDate = endDate;
      } else if (timeRangePreset === 'MTD') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      } else if (timeRangePreset === 'QTD') {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), currentQuarter * 3, 1).toISOString().split('T')[0];
      } else if (timeRangePreset === 'YTD') {
        startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      }

      const res = await biApiService.getExecutiveDashboard({ startDate, endDate });
      setData(res.data);
    } catch (err: any) {
      toastError('Dashboard Sync Failed', err?.message || 'Could not fetch executive telemetry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [timeRangePreset]);

  const kpi = data?.kpi;
  const liquidity = data?.liquidity;
  const monthlyTrends = data?.monthlyTrends || [];
  const portfolioByProduct = data?.portfolioByProduct || [];
  const savingsByProduct = data?.savingsByProduct || [];
  const alerts = data?.alerts || [];

  return (
    <div id="executive-dashboard-view" className="space-y-4 pb-8">
      {/* Header with Title, Live Telemetry Status, Presets & Refresh */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="p-1.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-sky-300 rounded-lg">
              <BarChart3 className="w-4 h-4" />
            </span>
            <h1 className="text-[20px] sm:text-[22px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">Executive BI Cockpit</h1>
            <span className="px-2.5 py-0.5 text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Core Sync
            </span>
          </div>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 max-w-3xl">
            Real-time balance sheet telemetry, portfolio solvency, liquidity buffers, and financial health for Wabi SACCO.
          </p>
        </div>

        {/* Action Controls: Preset Picker & Quick Exports */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Buttons */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[12px] font-semibold min-h-[34px]">
            {(['TODAY', 'MTD', 'QTD', 'YTD', 'ALL'] as const).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setTimeRangePreset(preset)}
                className={`px-2.5 py-1 rounded-md transition-colors min-h-[26px] ${
                  timeRangePreset === preset
                    ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-sky-300 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[13px] font-semibold shadow-xs min-h-[34px] transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(ROUTES.STAFF.REPORTS)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[13px] font-semibold shadow-xs min-h-[34px] transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Reports Hub</span>
          </button>
        </div>
      </div>

      {/* System Warning & Solvency Alerts Banner */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border flex items-center justify-between gap-3 text-[13px] font-medium ${
                alert.type === 'CRITICAL'
                  ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-850 dark:text-rose-200'
                  : alert.type === 'WARNING'
                  ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-850 dark:text-amber-200'
                  : 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-850 dark:text-blue-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className={`w-4 h-4 shrink-0 ${
                  alert.type === 'CRITICAL' ? 'text-rose-600' : alert.type === 'WARNING' ? 'text-amber-600' : 'text-blue-600'
                }`} />
                <span>
                  <strong>{alert.metric}:</strong> {alert.message}
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate(ROUTES.STAFF.REPORTS)}
                className="font-bold underline hover:opacity-80 shrink-0 text-[12.5px] cursor-pointer"
              >
                Inspect Telemetry
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Membership Health */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-300 transition-colors space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Membership Base</span>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-sky-400 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[22px] font-bold text-slate-900 dark:text-white tabular-nums">
              {kpi ? kpi.totalMembers.toLocaleString() : '---'}
            </span>
            <span className="text-[12px] font-bold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +{kpi?.newMembersThisMonth || 0} this mo
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[12px] text-slate-500">
            <span>Active: <strong className="text-slate-800 dark:text-slate-200">{kpi?.activeMembers || 0}</strong></span>
            <span>Suspended: <strong className="text-amber-700 dark:text-amber-400">{kpi?.suspendedMembers || 0}</strong></span>
          </div>
        </div>

        {/* 2. Total Savings Balance */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-300 transition-colors space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Member Savings</span>
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-[22px] font-bold text-slate-900 dark:text-white tabular-nums">
              {kpi ? formatCurrency(kpi.totalSavingsBalance) : '---'}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[12px] text-slate-500">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +{kpi ? formatCurrency(kpi.savingsGrowthMonth) : '0'} MoM
            </span>
            <span>Target: <strong className="text-slate-800 dark:text-slate-200">{kpi ? Math.round(kpi.savingsTargetAchievement) : 100}%</strong></span>
          </div>
        </div>

        {/* 3. Equity Share Capital */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-purple-300 transition-colors space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Paid-up Share Capital</span>
            <div className="p-1.5 bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-lg">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-[22px] font-bold text-slate-900 dark:text-white tabular-nums">
              {kpi ? formatCurrency(kpi.totalShareCapital) : '---'}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[12px] text-slate-500">
            <span>Issued: <strong className="text-slate-800 dark:text-slate-200">{kpi?.totalSharesCount.toLocaleString() || 0} shares</strong></span>
            <span>Target: <strong className="text-purple-700 dark:text-purple-400">{kpi ? Math.round(kpi.shareTargetAchievement) : 100}%</strong></span>
          </div>
        </div>

        {/* 4. Total Outstanding Loan Portfolio */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-300 transition-colors space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Loan Portfolio</span>
            <div className="p-1.5 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-lg">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-[22px] font-bold text-slate-900 dark:text-white tabular-nums">
              {kpi ? formatCurrency(kpi.totalOutstandingLoans) : '---'}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[12px] text-slate-500">
            <span>Active Files: <strong className="text-slate-800 dark:text-slate-200">{kpi?.activeLoansCount || 0}</strong></span>
            <span className="font-semibold text-rose-600 dark:text-rose-400">PAR: {kpi ? formatPercentage(kpi.parRate) : '0%'}</span>
          </div>
        </div>
      </div>

      {/* Secondary Financial Solvency & Liquidity Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {/* Liquidity Ratio Gauge & Vault Assets */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-blue-600" />
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Liquidity & Vault Buffers</h3>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-sky-300 border border-blue-200 dark:border-blue-800">
                Min Req: 15.0%
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full border-3 border-blue-600 flex flex-col items-center justify-center bg-blue-50/50 dark:bg-blue-950/40 shrink-0">
                <span className="text-[15px] font-bold text-blue-700 dark:text-sky-300 tabular-nums">
                  {liquidity ? formatPercentage(liquidity.liquidityRatio) : '---'}
                </span>
                <span className="text-[9px] text-slate-500 font-bold uppercase">Ratio</span>
              </div>
              <div className="flex-1 space-y-1 text-[12.5px]">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Cash in Vault:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{liquidity ? formatCurrency(liquidity.cashInVault) : '---'}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>CBE Bank Account:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{liquidity ? formatCurrency(liquidity.cbeBankBalance) : '---'}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Tsehay Bank Account:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{liquidity ? formatCurrency(liquidity.tsehayBankBalance) : '---'}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[12.5px]">
            <span className="text-slate-500">Total Liquid Assets:</span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-[14px]">
              {liquidity ? formatCurrency(liquidity.totalLiquidAssets) : '---'}
            </span>
          </div>
        </div>

        {/* Operational Net Surplus / P&L Trajectory */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Net Surplus & Profitability</h3>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                FY2026
              </span>
            </div>
            <div>
              <div className="text-[22px] font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                {kpi ? formatCurrency(kpi.netSurplusYTD) : '---'}
              </div>
              <p className="text-[12px] text-slate-500 dark:text-slate-400">Net Operating Surplus (Revenue minus Expenses)</p>
            </div>
            <div className="space-y-2 text-[12px]">
              <div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-1">
                  <span>Gross Operating Revenue:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{kpi ? formatCurrency(kpi.totalRevenueYTD) : '---'}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '85%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-1">
                  <span>Operating & Interest Expenses:</span>
                  <span className="font-mono font-bold text-rose-700 dark:text-rose-400">{kpi ? formatCurrency(kpi.totalExpensesYTD) : '---'}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                  <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: '38%' }} />
                </div>
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[12.5px]">
            <span className="text-slate-500">Cost to Income Ratio:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {kpi && kpi.totalRevenueYTD > 0 ? formatPercentage((kpi.totalExpensesYTD / kpi.totalRevenueYTD) * 100) : '0%'}
            </span>
          </div>
        </div>

        {/* Portfolio at Risk (PAR) & Credit Quality */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Portfolio at Risk (PAR)</h3>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                (kpi?.parRate || 0) > 5
                  ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                  : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              }`}>
                Threshold: &lt; 5.0%
              </span>
            </div>
            <div>
              <div className="text-[22px] font-bold text-slate-900 dark:text-white tabular-nums">
                {kpi ? formatPercentage(kpi.parRate) : '0.00%'}
              </div>
              <p className="text-[12px] text-slate-500 dark:text-slate-400">PAR &gt; 30 Days Delinquent Rate</p>
            </div>
            <div className="space-y-1.5 text-[12px]">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Delinquent Exposure:</span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{kpi ? formatCurrency(kpi.parAmount) : '0 ETB'}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Total Disbursed (YTD):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{kpi ? formatCurrency(kpi.totalDisbursedYTD) : '0 ETB'}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Loan Loss Provision:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency((kpi?.parAmount || 0) * 0.5)}</span>
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[12.5px]">
            <span className="text-slate-500">Portfolio Grade:</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400 text-[12px]">PRUDENTIAL TIER-1</span>
          </div>
        </div>
      </div>

      {/* Detailed Monthly Trends: Visual Comparisons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* 1. Monthly Savings Inflows vs Outflows */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Monthly Savings Flow (Inflow vs Outflow)</h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-400">Deposits vs Liquidations across monthly accounting periods</p>
            </div>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
              ETB (Thousands)
            </span>
          </div>

          <div className="space-y-2.5">
            {monthlyTrends.map((t, idx) => {
              const maxVal = Math.max(...monthlyTrends.map(m => Math.max(m.savingsDeposit, m.savingsWithdrawal, 10000)));
              const depPct = Math.min(100, Math.round((t.savingsDeposit / maxVal) * 100));
              const wdrPct = Math.min(100, Math.round((t.savingsWithdrawal / maxVal) * 100));

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-[13px] font-semibold">
                    <span className="text-slate-800 dark:text-slate-200">{t.month}</span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-400 text-[12px]">
                      Net: +{formatCurrency(t.netSavings)}
                    </span>
                  </div>
                  {/* Deposits bar */}
                  <div className="flex items-center gap-2 text-[11.5px]">
                    <span className="w-18 text-slate-400 font-medium">Deposits</span>
                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${depPct}%` }} />
                    </div>
                    <span className="font-mono text-slate-700 dark:text-slate-300 w-24 text-right font-semibold">{formatCurrency(t.savingsDeposit)}</span>
                  </div>
                  {/* Withdrawals bar */}
                  <div className="flex items-center gap-2 text-[11.5px]">
                    <span className="w-18 text-slate-400 font-medium">Withdrawals</span>
                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div className="bg-rose-400 h-full rounded-full transition-all" style={{ width: `${wdrPct}%` }} />
                    </div>
                    <span className="font-mono text-slate-700 dark:text-slate-300 w-24 text-right font-semibold">{formatCurrency(t.savingsWithdrawal)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Monthly Loan Disbursements vs Principal Repayments */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Loan Portfolio Velocity (Disbursed vs Repaid)</h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-400">New credit issued vs cash recovered into cooperative pool</p>
            </div>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
              ETB (Thousands)
            </span>
          </div>

          <div className="space-y-2.5">
            {monthlyTrends.map((t, idx) => {
              const maxVal = Math.max(...monthlyTrends.map(m => Math.max(m.loansDisbursed, m.loansRepaid, 10000)));
              const disbPct = Math.min(100, Math.round((t.loansDisbursed / maxVal) * 100));
              const repPct = Math.min(100, Math.round((t.loansRepaid / maxVal) * 100));

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-[13px] font-semibold">
                    <span className="text-slate-800 dark:text-slate-200">{t.month}</span>
                    <span className="font-mono text-blue-700 dark:text-sky-400 text-[12px]">
                      Interest: +{formatCurrency(t.interestIncome)}
                    </span>
                  </div>
                  {/* Disbursed bar */}
                  <div className="flex items-center gap-2 text-[11.5px]">
                    <span className="w-18 text-slate-400 font-medium">Disbursed</span>
                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${disbPct}%` }} />
                    </div>
                    <span className="font-mono text-slate-700 dark:text-slate-300 w-24 text-right font-semibold">{formatCurrency(t.loansDisbursed)}</span>
                  </div>
                  {/* Repaid bar */}
                  <div className="flex items-center gap-2 text-[11.5px]">
                    <span className="w-18 text-slate-400 font-medium">Repaid</span>
                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${repPct}%` }} />
                    </div>
                    <span className="font-mono text-slate-700 dark:text-slate-300 w-24 text-right font-semibold">{formatCurrency(t.loansRepaid)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Product Breakdown Matrix & Distribution */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Product Portfolio Asset Allocation</h3>
            <p className="text-[12px] text-slate-500 dark:text-slate-400">Distribution of cooperative assets and liabilities across financial products</p>
          </div>
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[12px] font-semibold min-h-[34px]">
            <button
              type="button"
              onClick={() => setActiveProductTab('LOANS')}
              className={`px-3 py-1 rounded-md transition-colors min-h-[26px] cursor-pointer ${
                activeProductTab === 'LOANS'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-sky-300 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Loan Products ({portfolioByProduct.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveProductTab('SAVINGS')}
              className={`px-3 py-1 rounded-md transition-colors min-h-[26px] cursor-pointer ${
                activeProductTab === 'SAVINGS'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-sky-300 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Savings Schemes ({savingsByProduct.length})
            </button>
          </div>
        </div>

        {/* Product Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Product Name</th>
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3 text-center">Accounts / Loans</th>
                <th className="py-2.5 px-3 text-right">Total Exposure / Balance</th>
                <th className="py-2.5 px-3 text-right">Portfolio Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(activeProductTab === 'LOANS' ? portfolioByProduct : savingsByProduct).map((item, idx) => {
                const totalSum = (activeProductTab === 'LOANS' ? portfolioByProduct : savingsByProduct).reduce((a, b) => a + b.value, 0) || 1;
                const sharePct = ((item.value / totalSum) * 100).toFixed(1);

                return (
                  <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 min-h-[42px] transition-colors">
                    <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color || '#3b82f6' }} />
                      {item.name}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-500 text-[12px]">{item.code}</td>
                    <td className="py-2 px-3 text-center font-mono font-medium text-slate-700 dark:text-slate-300 text-[12px]">{item.count}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white text-[13.5px]">{formatCurrency(item.value)}</td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 text-[12px]">{sharePct}%</span>
                        <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 hidden sm:block">
                          <div
                            className="h-1.5 rounded-full"
                            style={{
                              width: `${sharePct}%`,
                              backgroundColor: item.color || '#3b82f6',
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Drill-down Action Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <button
          type="button"
          onClick={() => navigate(ROUTES.STAFF.MEMBERS)}
          className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:bg-blue-50/30 rounded-xl transition-all text-left flex items-center justify-between group shadow-xs min-h-[56px] cursor-pointer"
        >
          <div>
            <div className="text-[13.5px] font-bold text-slate-800 dark:text-white group-hover:text-blue-700 dark:group-hover:text-sky-300">Member Directory</div>
            <div className="text-[11.5px] text-slate-400 mt-0.5">KYC, status & profiles</div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
        </button>

        <button
          type="button"
          onClick={() => navigate(ROUTES.STAFF.LOANS)}
          className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 hover:bg-emerald-50/30 rounded-xl transition-all text-left flex items-center justify-between group shadow-xs min-h-[56px] cursor-pointer"
        >
          <div>
            <div className="text-[13.5px] font-bold text-slate-800 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300">Loan Underwriting</div>
            <div className="text-[11.5px] text-slate-400 mt-0.5">Approvals & repayments</div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
        </button>

        <button
          type="button"
          onClick={() => navigate(ROUTES.STAFF.ACCOUNTING)}
          className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-400 hover:bg-purple-50/30 rounded-xl transition-all text-left flex items-center justify-between group shadow-xs min-h-[56px] cursor-pointer"
        >
          <div>
            <div className="text-[13.5px] font-bold text-slate-800 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300">General Ledger & COA</div>
            <div className="text-[11.5px] text-slate-400 mt-0.5">Statements & journals</div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
        </button>

        <button
          type="button"
          onClick={() => navigate(ROUTES.STAFF.REPORTS)}
          className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 hover:bg-amber-50/30 rounded-xl transition-all text-left flex items-center justify-between group shadow-xs min-h-[56px] cursor-pointer"
        >
          <div>
            <div className="text-[13.5px] font-bold text-slate-800 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-300">Automated Reports</div>
            <div className="text-[11.5px] text-slate-400 mt-0.5">25+ Standard Statements</div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
        </button>
      </div>
    </div>
  );
};
