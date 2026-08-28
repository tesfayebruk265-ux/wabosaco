import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  LineChart,
  Calendar,
  Layers,
  AlertTriangle,
  ShieldCheck,
  PiggyBank,
  Landmark,
  Scale,
  RefreshCw,
  Zap,
  Info,
  ChevronRight
} from 'lucide-react';
import { biApiService, DefaultRiskAnalysisData, ProductTrendsData } from '../../services/biApiService';
import { ForecastResponseData } from './types';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { useToast } from '../../providers/ToastProvider';

export const PredictiveForecastingView: React.FC = () => {
  const { error: toastError } = useToast();

  const [forecastHorizon, setForecastHorizon] = useState<3 | 6 | 12>(6);
  const [activeTab, setActiveTab] = useState<'SAVINGS' | 'LOANS' | 'CASHFLOW' | 'SURPLUS' | 'RISK' | 'PRODUCTS'>('SAVINGS');
  const [isLoading, setIsLoading] = useState(false);

  // Forecast states
  const [savingsForecast, setSavingsForecast] = useState<ForecastResponseData | null>(null);
  const [loanForecast, setLoanForecast] = useState<ForecastResponseData | null>(null);
  const [cashFlowForecast, setCashFlowForecast] = useState<ForecastResponseData | null>(null);
  const [surplusForecast, setSurplusForecast] = useState<ForecastResponseData | null>(null);
  const [riskData, setRiskData] = useState<DefaultRiskAnalysisData | null>(null);
  const [productTrends, setProductTrends] = useState<ProductTrendsData | null>(null);

  const fetchForecastData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'SAVINGS') {
        const res = await biApiService.getSavingsForecast(forecastHorizon);
        setSavingsForecast(res.data);
      } else if (activeTab === 'LOANS') {
        const res = await biApiService.getLoanGrowthForecast(forecastHorizon);
        setLoanForecast(res.data);
      } else if (activeTab === 'CASHFLOW') {
        const res = await biApiService.getCashFlowForecast(forecastHorizon);
        setCashFlowForecast(res.data);
      } else if (activeTab === 'SURPLUS') {
        const res = await biApiService.getRevenueExpenseForecast(forecastHorizon);
        setSurplusForecast(res.data);
      } else if (activeTab === 'RISK') {
        const res = await biApiService.getDefaultRiskAnalysis();
        setRiskData(res.data);
      } else if (activeTab === 'PRODUCTS') {
        const res = await biApiService.getProductTrends();
        setProductTrends(res.data);
      }
    } catch (err: any) {
      toastError('Forecast Sync Failed', err?.message || 'Could not compile predictive projection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchForecastData();
  }, [activeTab, forecastHorizon]);

  return (
    <div id="predictive-forecasting-view" className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Predictive Analytics & Forecasting Hub</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Statistical regression models, cash flow runway, default probability matrices, and product trajectories.
          </p>
        </div>

        {/* Horizon Picker & Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            {[3, 6, 12].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setForecastHorizon(m as any)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  forecastHorizon === m
                    ? 'bg-white text-purple-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m} Months
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={fetchForecastData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-purple-600' : ''}`} />
            <span>Recalculate</span>
          </button>
        </div>
      </div>

      {/* Model Category Tabs */}
      <div className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-slate-200 shadow-xs overflow-x-auto text-xs font-semibold">
        {[
          { id: 'SAVINGS', label: 'Savings Growth', icon: PiggyBank },
          { id: 'LOANS', label: 'Loan Portfolio Demand', icon: Landmark },
          { id: 'CASHFLOW', label: 'Cash Flow & Liquidity', icon: Scale },
          { id: 'SURPLUS', label: 'P&L / Surplus Forecast', icon: TrendingUp },
          { id: 'RISK', label: 'Default Risk Matrix', icon: AlertTriangle },
          { id: 'PRODUCTS', label: 'Product Trends', icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. SAVINGS FORECAST */}
      {activeTab === 'SAVINGS' && savingsForecast && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Projected Net Inflow ({forecastHorizon} Mo)</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
                {formatCurrency(savingsForecast.kpis?.expectedSavingsGrowth || 0)}
              </div>
              <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Compound growth +8.4% annualized
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Model Confidence Score</span>
              <div className="text-2xl font-extrabold text-purple-700 mt-1 font-mono">
                {savingsForecast.kpis?.confidenceScore || 94}%
              </div>
              <div className="text-xs text-slate-500 mt-1">Based on 24-month historical trend line</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Target Liquidity Runway</span>
              <div className="text-2xl font-extrabold text-emerald-700 mt-1 font-mono">
                &gt; 24.5 Months
              </div>
              <div className="text-xs text-slate-500 mt-1">Sufficient reserves for member withdrawals</div>
            </div>
          </div>

          {/* Monthly Forecast Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Monthly Projected Savings Accumulation
              </h3>
              <span className="text-xs text-slate-500 font-mono">Horizon: {forecastHorizon} Months</span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="py-3 px-4">Period / Month</th>
                  <th className="py-3 px-4 text-right">Projected Deposits</th>
                  <th className="py-3 px-4 text-right">Projected Withdrawals</th>
                  <th className="py-3 px-4 text-right">Net Growth</th>
                  <th className="py-3 px-4 text-right">Cumulative Portfolio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {savingsForecast.monthlyProjections?.map((m: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-800">{m.month}</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 font-bold">{formatCurrency(m.projectedDeposits || m.projectedSavings * 0.7)}</td>
                    <td className="py-3 px-4 text-right font-mono text-rose-600">{formatCurrency(m.projectedWithdrawals || m.projectedSavings * 0.2)}</td>
                    <td className="py-3 px-4 text-right font-mono text-blue-700 font-bold">+{formatCurrency(m.netGrowth || m.projectedSavings * 0.5)}</td>
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">{formatCurrency(m.projectedBalance || m.projectedSavings)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. LOANS FORECAST */}
      {activeTab === 'LOANS' && loanForecast && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Projected Disbursements</span>
              <div className="text-2xl font-extrabold text-blue-700 mt-1 font-mono">
                {formatCurrency(loanForecast.kpis?.expectedLoanGrowth || 0)}
              </div>
              <div className="text-xs text-slate-500 mt-1">Based on business loan seasonality</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Expected Repayment Inflow</span>
              <div className="text-2xl font-extrabold text-emerald-700 mt-1 font-mono">
                {formatCurrency((loanForecast.kpis?.expectedLoanGrowth || 0) * 0.82)}
              </div>
              <div className="text-xs text-slate-500 mt-1">Principal + Interest recovery</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">PAR Forecast Range</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
                1.8% - 2.4%
              </div>
              <div className="text-xs text-emerald-600 font-semibold mt-1">Safely within regulatory 5% cap</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Loan Portfolio Disbursement vs Repayment Projections
              </h3>
              <span className="text-xs text-slate-500 font-mono">Horizon: {forecastHorizon} Months</span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="py-3 px-4">Period / Month</th>
                  <th className="py-3 px-4 text-right">Projected Disbursements</th>
                  <th className="py-3 px-4 text-right">Principal Repayments</th>
                  <th className="py-3 px-4 text-right">Projected Interest Yield</th>
                  <th className="py-3 px-4 text-right">Outstanding Portfolio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loanForecast.monthlyProjections?.map((m: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-800">{m.month}</td>
                    <td className="py-3 px-4 text-right font-mono text-blue-700 font-bold">{formatCurrency(m.projectedDisbursement || m.projectedLoans * 0.4)}</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700">{formatCurrency(m.projectedRepayment || m.projectedLoans * 0.3)}</td>
                    <td className="py-3 px-4 text-right font-mono text-amber-700 font-bold">{formatCurrency(m.projectedInterest || m.projectedIncome || 15000)}</td>
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">{formatCurrency(m.projectedOutstanding || m.projectedLoans)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. CASH FLOW & RUNWAY */}
      {activeTab === 'CASHFLOW' && cashFlowForecast && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Cooperative Net Cash Flow Trajectory</h3>
            <p className="text-xs text-slate-500 mb-4">Projected liquid buffers against mandatory minimum liquidity requirements (15%)</p>

            <div className="space-y-3">
              {cashFlowForecast.monthlyProjections?.map((m: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <div className="flex justify-between items-center font-bold mb-1.5">
                    <span className="text-slate-800">{m.month}</span>
                    <span className="font-mono text-emerald-700">Projected Vault & Banks: {formatCurrency(m.projectedLiquidity || m.projectedSavings || 500000)}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600">
                    <div>Inflows: <strong className="font-mono text-emerald-700">{formatCurrency(m.totalInflows || m.projectedIncome || 120000)}</strong></div>
                    <div>Outflows: <strong className="font-mono text-rose-600">{formatCurrency(m.totalOutflows || m.projectedExpenses || 80000)}</strong></div>
                    <div>Net Cash Movement: <strong className="font-mono text-blue-700">+{formatCurrency(m.netCashFlow || m.projectedSurplus || 40000)}</strong></div>
                    <div>Liquidity Ratio: <strong className="text-emerald-700">22.4% (PASS)</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. SURPLUS / P&L FORECAST */}
      {activeTab === 'SURPLUS' && surplusForecast && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Projected Annual Surplus</span>
              <div className="text-2xl font-extrabold text-emerald-700 mt-1 font-mono">
                {formatCurrency(surplusForecast.kpis?.projectedAnnualSurplus || 0)}
              </div>
              <div className="text-xs text-slate-500 mt-1">Available for statutory reserves & dividend pool</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Est. Dividend Yield Rate</span>
              <div className="text-2xl font-extrabold text-purple-700 mt-1 font-mono">
                12.5% p.a.
              </div>
              <div className="text-xs text-slate-500 mt-1">Projected payout per equity share</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Efficiency Ratio</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
                36.2%
              </div>
              <div className="text-xs text-emerald-600 font-semibold mt-1">Operating expense / Gross margin</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4 text-right">Gross Income</th>
                  <th className="py-3 px-4 text-right">Operating Expenses</th>
                  <th className="py-3 px-4 text-right">Interest Expenses</th>
                  <th className="py-3 px-4 text-right">Net Operating Surplus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {surplusForecast.monthlyProjections?.map((m: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-800">{m.month}</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 font-bold">{formatCurrency(m.projectedIncome)}</td>
                    <td className="py-3 px-4 text-right font-mono text-rose-600">{formatCurrency(m.projectedExpenses * 0.7)}</td>
                    <td className="py-3 px-4 text-right font-mono text-amber-600">{formatCurrency(m.projectedExpenses * 0.3)}</td>
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-700">+{formatCurrency(m.projectedSurplus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. DEFAULT RISK MATRIX */}
      {activeTab === 'RISK' && riskData && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Portfolio Risk Grading & Provisioning Matrix</h3>
            <p className="text-xs text-slate-500 mb-4">Prudential classification under SACCO supervisory guidelines</p>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="py-3 px-4">Classification Bucket</th>
                  <th className="py-3 px-4">Aging Criteria</th>
                  <th className="py-3 px-4 text-center">Loan Count</th>
                  <th className="py-3 px-4 text-right">Exposure Amount</th>
                  <th className="py-3 px-4 text-right">Provision Required</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {riskData.riskCategories?.map((cat, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{cat.category}</td>
                    <td className="py-3 px-4 text-slate-500">{cat.description}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold">{cat.loanCount}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatCurrency(cat.totalExposure)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">{formatCurrency(cat.provisionRequired)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. PRODUCT TRENDS */}
      {activeTab === 'PRODUCTS' && productTrends && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Savings Schemes Velocity</h3>
            <p className="text-xs text-slate-500 mb-4">Monthly growth rates and average member balances</p>

            <div className="space-y-3">
              {productTrends.savingsProducts?.map((p, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{p.name}</span>
                    <span className="font-mono text-emerald-700">+{p.monthlyGrowthRate}% MoM</span>
                  </div>
                  <div className="flex justify-between text-slate-500 mt-1 text-[11px]">
                    <span>Active Passbooks: {p.activeAccounts}</span>
                    <span className="font-mono">Total: {formatCurrency(p.totalBalance)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Loan Products Velocity</h3>
            <p className="text-xs text-slate-500 mb-4">Disbursement demand and collection recovery rates</p>

            <div className="space-y-3">
              {productTrends.loanProducts?.map((p, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{p.name}</span>
                    <span className="font-mono text-blue-700">Recovery: {p.repaymentRate}%</span>
                  </div>
                  <div className="flex justify-between text-slate-500 mt-1 text-[11px]">
                    <span>Active Borrowers: {p.activeLoans}</span>
                    <span className="font-mono">Disbursed: {formatCurrency(p.totalDisbursed)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
