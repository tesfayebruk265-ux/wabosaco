import { apiClient } from './apiClient';
import {
  ShareAccount,
  ShareTransaction,
  ShareCertificate,
  ShareEligibility,
  ShareStatistics,
  OwnershipReport,
  NonCompliantReport,
  ShareSettingsData,
  PurchaseSharesPayload,
  ConvertVoluntarySavingsPayload,
  ReverseShareTxPayload,
} from '../types/shares';

export const shareApiService = {
  // Member Self-Service
  async getMyShareAccount(): Promise<{
    account: ShareAccount;
    certificate?: ShareCertificate;
    eligibility: ShareEligibility;
  }> {
    const res = await apiClient.get<{
      success: boolean;
      data: {
        account: ShareAccount;
        certificate?: ShareCertificate;
        eligibility: ShareEligibility;
      };
    }>('/shares/me');
    return res.data;
  },

  async getMyTransactions(params?: { type?: string; page?: number; limit?: number }): Promise<{
    data: ShareTransaction[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qStr = query.toString();
    const endpoint = `/shares/me/transactions${qStr ? `?${qStr}` : ''}`;

    const res = await apiClient.get<{
      success: boolean;
      data: ShareTransaction[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(endpoint);
    return { data: res.data, pagination: res.pagination };
  },

  async getMyEligibility(): Promise<ShareEligibility> {
    const res = await apiClient.get<{
      success: boolean;
      data: ShareEligibility;
    }>('/shares/me/eligibility');
    return res.data;
  },

  async getMyCertificate(): Promise<{
    certificate?: ShareCertificate;
    account: ShareAccount;
    member: { id: string; membershipNo: string; fullName: string; membershipDate: string };
  }> {
    const res = await apiClient.get<{
      success: boolean;
      data: {
        certificate?: ShareCertificate;
        account: ShareAccount;
        member: { id: string; membershipNo: string; fullName: string; membershipDate: string };
      };
    }>('/shares/me/certificate');
    return res.data;
  },

  // Purchase & Conversion operations
  async purchaseShares(payload: PurchaseSharesPayload): Promise<{
    shareTransaction: ShareTransaction;
    shareAccount: ShareAccount;
    certificate: ShareCertificate;
  }> {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      data: {
        shareTransaction: ShareTransaction;
        shareAccount: ShareAccount;
        certificate: ShareCertificate;
      };
    }>('/shares/purchase', payload);
    return res.data;
  },

  async convertVoluntarySavings(payload: ConvertVoluntarySavingsPayload): Promise<{
    shareTransaction: ShareTransaction;
    shareAccount: ShareAccount;
    certificate: ShareCertificate;
    sharesPurchased: number;
    amountConverted: number;
    remainderKeptInSavings: number;
    newSavingsBalance: number;
  }> {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      data: {
        shareTransaction: ShareTransaction;
        shareAccount: ShareAccount;
        certificate: ShareCertificate;
        sharesPurchased: number;
        amountConverted: number;
        remainderKeptInSavings: number;
        newSavingsBalance: number;
      };
    }>('/shares/convert', payload);
    return res.data;
  },

  // Staff & Management Endpoints
  async getAccounts(params?: {
    query?: string;
    status?: string;
    complianceStatus?: 'ALL' | 'COMPLIANT' | 'NON_COMPLIANT';
    page?: number;
    limit?: number;
  }): Promise<{
    data: ShareAccount[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
    meta: { minRequiredShares: number; sharePrice: number };
  }> {
    const query = new URLSearchParams();
    if (params?.query) query.set('query', params.query);
    if (params?.status) query.set('status', params.status);
    if (params?.complianceStatus) query.set('complianceStatus', params.complianceStatus);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qStr = query.toString();
    const endpoint = `/shares/accounts${qStr ? `?${qStr}` : ''}`;

    const res = await apiClient.get<{
      success: boolean;
      data: ShareAccount[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
      meta: { minRequiredShares: number; sharePrice: number };
    }>(endpoint);
    return { data: res.data, pagination: res.pagination, meta: res.meta };
  },

  async getAccountById(id: string): Promise<{
    account: ShareAccount;
    member: any;
    certificate?: ShareCertificate;
    transactions: ShareTransaction[];
    eligibility: ShareEligibility;
  }> {
    const res = await apiClient.get<{
      success: boolean;
      data: {
        account: ShareAccount;
        member: any;
        certificate?: ShareCertificate;
        transactions: ShareTransaction[];
        eligibility: ShareEligibility;
      };
    }>(`/shares/accounts/${id}`);
    return res.data;
  },

  async getTransactions(params?: {
    memberId?: string;
    shareAccountId?: string;
    type?: string;
    paymentMethod?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: ShareTransaction[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const query = new URLSearchParams();
    if (params?.memberId) query.set('memberId', params.memberId);
    if (params?.shareAccountId) query.set('shareAccountId', params.shareAccountId);
    if (params?.type) query.set('type', params.type);
    if (params?.paymentMethod) query.set('paymentMethod', params.paymentMethod);
    if (params?.status) query.set('status', params.status);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qStr = query.toString();
    const endpoint = `/shares/transactions${qStr ? `?${qStr}` : ''}`;

    const res = await apiClient.get<{
      success: boolean;
      data: ShareTransaction[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(endpoint);
    return { data: res.data, pagination: res.pagination };
  },

  async getTransactionById(id: string): Promise<{
    transaction: ShareTransaction;
    journalEntry?: any;
    financialTransaction?: any;
  }> {
    const res = await apiClient.get<{
      success: boolean;
      data: {
        transaction: ShareTransaction;
        journalEntry?: any;
        financialTransaction?: any;
      };
    }>(`/shares/transactions/${id}`);
    return res.data;
  },

  async reverseTransaction(id: string, payload: ReverseShareTxPayload): Promise<any> {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      data: any;
    }>(`/shares/transactions/${id}/reverse`, payload);
    return res.data;
  },

  // Reports
  async getStatistics(): Promise<ShareStatistics> {
    const res = await apiClient.get<{
      success: boolean;
      data: ShareStatistics;
    }>('/shares/reports/statistics');
    return res.data;
  },

  async getOwnershipReport(): Promise<OwnershipReport> {
    const res = await apiClient.get<{
      success: boolean;
      data: OwnershipReport;
    }>('/shares/reports/ownership');
    return res.data;
  },

  async getNonCompliantReport(): Promise<NonCompliantReport> {
    const res = await apiClient.get<{
      success: boolean;
      data: NonCompliantReport;
    }>('/shares/reports/non-compliant');
    return res.data;
  },

  // Settings
  async getSettings(): Promise<ShareSettingsData> {
    const res = await apiClient.get<{
      success: boolean;
      data: ShareSettingsData;
    }>('/shares/settings');
    return res.data;
  },

  async updateSettings(payload: {
    sharePrice?: number;
    minRequiredShares?: number;
    minShareValue?: number;
    shareDividendRate?: number;
    reason?: string;
  }): Promise<ShareSettingsData> {
    const res = await apiClient.put<{
      success: boolean;
      message: string;
      data: ShareSettingsData;
    }>('/shares/settings', payload);
    return res.data;
  },

  async getCertificateById(id: string): Promise<ShareCertificate> {
    const res = await apiClient.get<{
      success: boolean;
      data: ShareCertificate;
    }>(`/shares/certificates/${id}`);
    return res.data;
  },
};
