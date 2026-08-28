import { apiClient } from './apiClient';
import {
  SavingProduct,
  SavingAccount,
  FinancialTransaction,
  FinancialApproval,
  MonthlySavingsSchedule,
  ChartOfAccount,
  JournalEntry,
  InterestPostingRun,
  SystemSettings,
  SavingsProductType,
  PaymentChannel,
} from '../types/financial';

export interface OpenAccountPayload {
  memberId: string;
  productCode: SavingsProductType;
  initialDeposit?: number;
  paymentChannel?: PaymentChannel;
  bankReferenceNo?: string;
  guardianName?: string;
  guardianRelationship?: string;
  termMonths?: number;
  expectedMaturityDate?: string;
  maturityAction?: 'AUTO_RENEW' | 'TRANSFER_TO_VOLUNTARY' | 'PAYOUT';
}

export interface DepositPayload {
  accountId: string;
  amount: number;
  paymentChannel: PaymentChannel;
  bankReferenceNo?: string;
  narration: string;
  idempotencyKey?: string;
}

export interface WithdrawalPayload {
  accountId: string;
  amount: number;
  paymentChannel: PaymentChannel;
  bankReferenceNo?: string;
  narration: string;
  reason?: string;
  idempotencyKey?: string;
}

export interface TransferPayload {
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  narration: string;
  idempotencyKey?: string;
}

export interface ApprovePayload {
  decision: 'APPROVED' | 'REJECTED';
  comments?: string;
}

class FinancialApiService {
  // Products
  public async getProducts(): Promise<SavingProduct[]> {
    const res = await apiClient.get<{ success: boolean; data: SavingProduct[] }>('/financial/products');
    return res.data;
  }

  public async getProductById(id: string): Promise<SavingProduct> {
    const res = await apiClient.get<{ success: boolean; data: SavingProduct }>(`/financial/products/${id}`);
    return res.data;
  }

  public async updateProduct(id: string, updates: Partial<SavingProduct>): Promise<SavingProduct> {
    const res = await apiClient.put<{ success: boolean; data: SavingProduct }>(`/financial/products/${id}`, updates);
    return res.data;
  }

  // Accounts
  public async getAccounts(params?: {
    memberId?: string;
    productCode?: string;
    search?: string;
    status?: string;
  }): Promise<SavingAccount[]> {
    const query = new URLSearchParams();
    if (params?.memberId) query.set('memberId', params.memberId);
    if (params?.productCode) query.set('productCode', params.productCode);
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);

    const qStr = query.toString();
    const endpoint = `/financial/accounts${qStr ? `?${qStr}` : ''}`;
    const res = await apiClient.get<{ success: boolean; data: SavingAccount[] }>(endpoint);
    return res.data;
  }

  public async getAccountById(id: string): Promise<{
    account: SavingAccount;
    balances: any;
    member: any;
    recentTransactions: FinancialTransaction[];
  }> {
    const res = await apiClient.get<{
      success: boolean;
      data: {
        account: SavingAccount;
        balances: any;
        member: any;
        recentTransactions: FinancialTransaction[];
      };
    }>(`/financial/accounts/${id}`);
    return res.data;
  }

  public async getMyAccounts(): Promise<SavingAccount[]> {
    const res = await apiClient.get<{ success: boolean; data: SavingAccount[] }>('/financial/me/accounts');
    return res.data;
  }

  public async openAccount(payload: OpenAccountPayload): Promise<SavingAccount> {
    const res = await apiClient.post<{ success: boolean; data: SavingAccount; message: string }>(
      '/financial/accounts/open',
      payload
    );
    return res.data;
  }

  // Transactions
  public async deposit(payload: DepositPayload): Promise<FinancialTransaction> {
    const res = await apiClient.post<{ success: boolean; data: FinancialTransaction; message: string }>(
      '/financial/deposit',
      payload,
      { idempotencyKey: payload.idempotencyKey }
    );
    return res.data;
  }

  public async withdraw(payload: WithdrawalPayload): Promise<{
    transaction: FinancialTransaction;
    requiresApproval: boolean;
    approvalId?: string;
    message: string;
  }> {
    const res = await apiClient.post<{
      success: boolean;
      data: FinancialTransaction;
      requiresApproval?: boolean;
      approvalId?: string;
      message: string;
    }>('/financial/withdraw', payload, { idempotencyKey: payload.idempotencyKey });
    return {
      transaction: res.data,
      requiresApproval: !!res.requiresApproval,
      approvalId: res.approvalId,
      message: res.message,
    };
  }

  public async transfer(payload: TransferPayload): Promise<{
    withdrawalTx: FinancialTransaction;
    depositTx: FinancialTransaction;
  }> {
    const res = await apiClient.post<{
      success: boolean;
      data: { withdrawalTx: FinancialTransaction; depositTx: FinancialTransaction };
      message: string;
    }>('/financial/transfer', payload, { idempotencyKey: payload.idempotencyKey });
    return res.data;
  }

  public async reverseTransaction(transactionId: string, reason: string): Promise<FinancialTransaction> {
    const res = await apiClient.post<{ success: boolean; data: FinancialTransaction; message: string }>(
      `/financial/transactions/${transactionId}/reverse`,
      { reason }
    );
    return res.data;
  }

  // Approvals (Maker-Checker)
  public async getApprovals(params?: { status?: string; type?: string }): Promise<FinancialApproval[]> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.type) query.set('type', params.type);

    const qStr = query.toString();
    const endpoint = `/financial/approvals${qStr ? `?${qStr}` : ''}`;
    const res = await apiClient.get<{ success: boolean; data: FinancialApproval[] }>(endpoint);
    return res.data;
  }

  public async approveApproval(
    id: string,
    payload: ApprovePayload
  ): Promise<{ approval: FinancialApproval; transaction: FinancialTransaction }> {
    const res = await apiClient.post<{
      success: boolean;
      data: { approval: FinancialApproval; transaction: FinancialTransaction };
      message: string;
    }>(`/financial/approvals/${id}/approve`, payload);
    return res.data;
  }

  // Transactions Ledger
  public async getTransactions(params?: {
    accountId?: string;
    memberId?: string;
    productCode?: string;
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    limit?: number;
  }): Promise<FinancialTransaction[]> {
    const query = new URLSearchParams();
    if (params?.accountId) query.set('accountId', params.accountId);
    if (params?.memberId) query.set('memberId', params.memberId);
    if (params?.productCode) query.set('productCode', params.productCode);
    if (params?.type) query.set('type', params.type);
    if (params?.status) query.set('status', params.status);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.search) query.set('search', params.search);
    if (params?.limit) query.set('limit', String(params.limit));

    const qStr = query.toString();
    const endpoint = `/financial/transactions${qStr ? `?${qStr}` : ''}`;
    const res = await apiClient.get<{ success: boolean; data: FinancialTransaction[] }>(endpoint);
    return res.data;
  }

  public async getTransactionById(id: string): Promise<{
    transaction: FinancialTransaction;
    journal?: JournalEntry;
    account?: SavingAccount;
  }> {
    const res = await apiClient.get<{
      success: boolean;
      data: {
        transaction: FinancialTransaction;
        journal?: JournalEntry;
        account?: SavingAccount;
      };
    }>(`/financial/transactions/${id}`);
    return res.data;
  }

  public async getMyTransactions(params?: { limit?: number; search?: string }): Promise<FinancialTransaction[]> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    const qStr = query.toString();
    const endpoint = `/financial/me/transactions${qStr ? `?${qStr}` : ''}`;
    const res = await apiClient.get<{ success: boolean; data: FinancialTransaction[] }>(endpoint);
    return res.data;
  }

  // Compulsory Monthly Schedules
  public async getMonthlySchedules(params?: {
    yearMonth?: string;
    memberId?: string;
    status?: string;
  }): Promise<MonthlySavingsSchedule[]> {
    const query = new URLSearchParams();
    if (params?.yearMonth) query.set('yearMonth', params.yearMonth);
    if (params?.memberId) query.set('memberId', params.memberId);
    if (params?.status) query.set('status', params.status);

    const qStr = query.toString();
    const endpoint = `/financial/monthly-schedules${qStr ? `?${qStr}` : ''}`;
    const res = await apiClient.get<{ success: boolean; data: MonthlySavingsSchedule[] }>(endpoint);
    return res.data;
  }

  public async getMyMonthlySchedule(): Promise<MonthlySavingsSchedule[]> {
    const res = await apiClient.get<{ success: boolean; data: MonthlySavingsSchedule[] }>(
      '/financial/me/monthly-schedules'
    );
    return res.data;
  }

  // General Ledger
  public async getChartOfAccounts(): Promise<ChartOfAccount[]> {
    const res = await apiClient.get<{ success: boolean; data: ChartOfAccount[] }>('/financial/chart-of-accounts');
    return res.data;
  }

  public async getJournalEntries(params?: {
    startDate?: string;
    endDate?: string;
    search?: string;
    limit?: number;
  }): Promise<JournalEntry[]> {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.search) query.set('search', params.search);
    if (params?.limit) query.set('limit', String(params.limit));

    const qStr = query.toString();
    const endpoint = `/financial/journals${qStr ? `?${qStr}` : ''}`;
    const res = await apiClient.get<{ success: boolean; data: JournalEntry[] }>(endpoint);
    return res.data;
  }

  // Operations
  public async runBatchInterest(payload: {
    productCode?: SavingsProductType;
    effectiveDate?: string;
  }): Promise<InterestPostingRun> {
    const res = await apiClient.post<{ success: boolean; data: InterestPostingRun; message: string }>(
      '/financial/batch-interest',
      payload
    );
    return res.data;
  }

  public async getInterestRuns(): Promise<InterestPostingRun[]> {
    const res = await apiClient.get<{ success: boolean; data: InterestPostingRun[] }>('/financial/interest-runs');
    return res.data;
  }

  public async getSystemSettings(): Promise<SystemSettings> {
    const res = await apiClient.get<{ success: boolean; data: SystemSettings }>('/financial/system-settings');
    return res.data;
  }

  public async updateSystemSettings(updates: Partial<SystemSettings>): Promise<SystemSettings> {
    const res = await apiClient.put<{ success: boolean; data: SystemSettings; message: string }>(
      '/financial/system-settings',
      updates
    );
    return res.data;
  }
}

export const financialApiService = new FinancialApiService();
