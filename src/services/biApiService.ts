import { apiClient } from './apiClient';
import {
  ExecutiveDashboardData,
  GlobalSearchResult,
  ReportResponseData,
  ScheduledReportItem,
  ForecastResponseData
} from '../features/bi/types';

export interface ReportFilterRequest {
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

export interface DefaultRiskAnalysisData {
  riskCategories: Array<{
    category: string;
    description: string;
    loanCount: number;
    totalExposure: number;
    riskScore: number;
    provisionRequired: number;
  }>;
  overallPortfolioRisk: {
    totalLoans: number;
    totalExposure: number;
    weightedRiskScore: number;
    expectedLoss: number;
    recommendedProvision: number;
    healthyPortfolioPct: number;
  };
  highRiskLoans: Array<{
    loanNo: string;
    memberId: string;
    memberName: string;
    productName: string;
    outstandingBalance: number;
    daysPastDue: number;
    riskScore: number;
    remedialAction: string;
  }>;
}

export interface ProductTrendsData {
  savingsProducts: Array<{
    name: string;
    code: string;
    activeAccounts: number;
    totalBalance: number;
    monthlyGrowthRate: number;
    averageBalance: number;
  }>;
  loanProducts: Array<{
    name: string;
    code: string;
    activeLoans: number;
    totalDisbursed: number;
    outstandingBalance: number;
    averageInterestRate: number;
    repaymentRate: number;
  }>;
}

class BiApiService {
  // -------------------------------------------------------------
  // Dashboards
  // -------------------------------------------------------------
  public async getExecutiveDashboard(params?: { startDate?: string; endDate?: string }): Promise<{ success: boolean; data: ExecutiveDashboardData }> {
    const query = new URLSearchParams();
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get(`/bi/dashboards/executive${qs}`);
  }

  public async getAccountantDashboard(): Promise<{ success: boolean; data: any }> {
    return apiClient.get('/bi/dashboards/accountant');
  }

  public async getManagerDashboard(): Promise<{ success: boolean; data: any }> {
    return apiClient.get('/bi/dashboards/manager');
  }

  public async getAuditorDashboard(): Promise<{ success: boolean; data: any }> {
    return apiClient.get('/bi/dashboards/auditor');
  }

  public async getCustomerServiceDashboard(): Promise<{ success: boolean; data: any }> {
    return apiClient.get('/bi/dashboards/customer-service');
  }

  public async getMemberDashboard(memberId?: string): Promise<{ success: boolean; data: any }> {
    const endpoint = memberId ? `/bi/dashboards/member/${memberId}` : '/bi/dashboards/member';
    return apiClient.get(endpoint);
  }

  // -------------------------------------------------------------
  // Dashboard Widget Configurations
  // -------------------------------------------------------------
  public async getWidgetConfig(): Promise<{ success: boolean; data: any }> {
    return apiClient.get('/bi/dashboards/widgets/config');
  }

  public async saveWidgetConfig(payload: { widgets: any[]; layout?: any }): Promise<{ success: boolean; data: any }> {
    return apiClient.post('/bi/dashboards/widgets/config', payload);
  }

  // -------------------------------------------------------------
  // Central Reports Engine
  // -------------------------------------------------------------
  public async getReport(reportType: string, filters: ReportFilterRequest = {}): Promise<{ success: boolean; data: ReportResponseData }> {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get(`/bi/reports/${reportType}${qs}`);
  }

  public getExportUrl(reportType: string, filters: ReportFilterRequest = {}, format: 'csv' | 'json' = 'csv'): string {
    const query = new URLSearchParams();
    query.append('format', format);
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
    return `/api/bi/reports/${reportType}/export?${query.toString()}`;
  }

  public async exportReportData(reportType: string, filters: ReportFilterRequest = {}): Promise<string> {
    const query = new URLSearchParams();
    query.append('format', 'csv');
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
    const response = await fetch(`/api/bi/reports/${reportType}/export?${query.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to export report CSV');
    }
    return response.text();
  }

  // -------------------------------------------------------------
  // Predictive Analytics & Forecasting
  // -------------------------------------------------------------
  public async getSavingsForecast(months: number = 6): Promise<{ success: boolean; data: ForecastResponseData }> {
    return apiClient.get(`/bi/forecasts/savings?months=${months}`);
  }

  public async getLoanGrowthForecast(months: number = 6): Promise<{ success: boolean; data: ForecastResponseData }> {
    return apiClient.get(`/bi/forecasts/loans?months=${months}`);
  }

  public async getCashFlowForecast(months: number = 6): Promise<{ success: boolean; data: ForecastResponseData }> {
    return apiClient.get(`/bi/forecasts/cashflow?months=${months}`);
  }

  public async getRevenueExpenseForecast(months: number = 6): Promise<{ success: boolean; data: ForecastResponseData }> {
    return apiClient.get(`/bi/forecasts/revenue-expenses?months=${months}`);
  }

  public async getExpectedLoanCollections(months: number = 6): Promise<{ success: boolean; data: any }> {
    return apiClient.get(`/bi/forecasts/loan-collections?months=${months}`);
  }

  public async getMemberGrowthForecast(months: number = 6): Promise<{ success: boolean; data: any }> {
    return apiClient.get(`/bi/forecasts/members?months=${months}`);
  }

  public async getDefaultRiskAnalysis(): Promise<{ success: boolean; data: DefaultRiskAnalysisData }> {
    return apiClient.get('/bi/forecasts/default-risk');
  }

  public async getProductTrends(): Promise<{ success: boolean; data: ProductTrendsData }> {
    return apiClient.get('/bi/forecasts/product-trends');
  }

  // -------------------------------------------------------------
  // Global Search
  // -------------------------------------------------------------
  public async globalSearch(query: string, limit: number = 25): Promise<{ success: boolean; data: GlobalSearchResult }> {
    const encoded = encodeURIComponent(query.trim());
    return apiClient.get(`/bi/search?q=${encoded}&limit=${limit}`);
  }

  // -------------------------------------------------------------
  // Scheduled Reports
  // -------------------------------------------------------------
  public async getScheduledReports(): Promise<{ success: boolean; data: ScheduledReportItem[] }> {
    return apiClient.get('/bi/scheduled-reports');
  }

  public async createScheduledReport(payload: {
    title: string;
    reportType: string;
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    format: 'PDF' | 'EXCEL' | 'CSV';
    recipients: string[];
    filters?: Record<string, any>;
  }): Promise<{ success: boolean; data: ScheduledReportItem }> {
    return apiClient.post('/bi/scheduled-reports', payload);
  }

  public async updateScheduledReport(id: string, payload: Partial<ScheduledReportItem>): Promise<{ success: boolean; data: ScheduledReportItem }> {
    return apiClient.put(`/bi/scheduled-reports/${id}`, payload);
  }

  public async deleteScheduledReport(id: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/bi/scheduled-reports/${id}`);
  }

  public async runScheduledReportNow(id: string): Promise<{ success: boolean; data: any; message: string }> {
    return apiClient.post(`/bi/scheduled-reports/${id}/run`);
  }
}

export const biApiService = new BiApiService();
