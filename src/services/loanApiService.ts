import { apiClient } from './apiClient';

export interface LoanProduct {
  id: string;
  code: string;
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  interestRate: number;
  interestMethod: 'AMORTIZATION_FIXED_PMT' | 'REDUCING_BALANCE' | 'FLAT_RATE';
  maxTerm: number;
  gracePeriod: number;
  requiresGuarantor: boolean;
  minGuarantors: number;
  maxGuarantors: number;
  savingsMultiplier: number;
  status: 'ACTIVE' | 'INACTIVE';
  glAssetAccountId: string;
  glInterestIncomeAccountId: string;
}

export interface LoanGuarantor {
  id: string;
  loanId: string;
  guarantorMemberId: string;
  guarantorMembershipNo: string;
  guarantorName: string;
  guarantorPhone?: string;
  guaranteedAmount: number;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  relationship?: string;
  decisionDate?: string;
  decisionNotes?: string;
  createdAt: string;
}

export interface LoanScheduleItem {
  id: string;
  loanId: string;
  installmentNumber: number;
  dueDate: string;
  openingBalance: number;
  principalAmount: number;
  interestAmount: number;
  installmentAmount: number;
  remainingBalance: number;
  penaltyAmount: number;
  paidPrincipal: number;
  paidInterest: number;
  paidPenalty: number;
  paidTotal: number;
  status: 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'DEFAULTED';
  paidDate?: string;
  daysLate: number;
}

export interface LoanRepayment {
  id: string;
  repaymentNo: string;
  loanId: string;
  loanNo: string;
  memberId: string;
  membershipNo: string;
  memberName: string;
  amount: number;
  principalPaid: number;
  interestPaid: number;
  penaltyPaid: number;
  principalBalanceBefore: number;
  principalBalanceAfter: number;
  totalBalanceBefore: number;
  totalBalanceAfter: number;
  paymentChannel: string;
  bankReferenceNo?: string;
  sourceSavingAccountId?: string;
  narration?: string;
  receiptUrl?: string;
  performedByName: string;
  timestamp: string;
  status: string;
}

export interface Loan {
  id: string;
  loanNo: string;
  memberId: string;
  membershipNo: string;
  memberName: string;
  memberPhone?: string;
  productId: string;
  productCode: string;
  productName: string;
  requestedAmount: number;
  approvedAmount?: number;
  disbursedAmount?: number;
  requestedTermMonths: number;
  approvedTermMonths?: number;
  interestRate: number;
  interestMethod: string;
  monthlyInstallmentAmount: number;
  totalInterestCalculated: number;
  totalPayableAmount: number;
  purpose: string;
  incomeDetails?: {
    monthlyIncome: number;
    monthlyExpenses?: number;
    otherLoansCommitments?: number;
    employerOrBusiness: string;
    netDisposableIncome: number;
  };
  supportingDocuments?: Array<{
    id: string;
    name: string;
    url: string;
    documentType: string;
    uploadedAt: string;
  }>;
  guarantors: LoanGuarantor[];
  status: 'DRAFT' | 'AWAITING_GUARANTORS' | 'UNDER_REVIEW' | 'AWAITING_MANAGER_APPROVAL' | 'APPROVED' | 'DISBURSED' | 'ACTIVE' | 'OVERDUE' | 'DEFAULTED' | 'COMPLETED' | 'REJECTED' | 'RESTRUCTURED';
  rejectionReason?: string;
  reviewedAt?: string;
  reviewedById?: string;
  reviewedByName?: string;
  reviewNotes?: string;
  approvedAt?: string;
  approvedById?: string;
  approvedByName?: string;
  disbursementDetails?: {
    disbursedAt: string;
    paymentChannel: string;
    bankReferenceNo?: string;
    destinationAccountId?: string;
    disbursedByName: string;
    journalEntryId: string;
    financialTransactionId: string;
  };
  outstandingPrincipal: number;
  outstandingInterest: number;
  outstandingPenalty: number;
  totalOutstanding: number;
  totalPrincipalPaid: number;
  totalInterestPaid: number;
  totalPenaltyPaid: number;
  totalPaid: number;
  paidInstallmentsCount: number;
  remainingInstallmentsCount: number;
  totalInstallmentsCount: number;
  nextInstallmentDate?: string;
  nextInstallmentAmount?: number;
  daysLate: number;
  isDelinquent: boolean;
  applicationDate: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoanEligibilityReport {
  isEligible: boolean;
  memberId: string;
  membershipNo: string;
  memberName: string;
  regularSavingsBalance: number;
  shareCount: number;
  shareValue: number;
  continuousSavingsMonths: number;
  maxBorrowableAmount: number;
  activeLoanCount: number;
  activeGuaranteesCount: number;
  criteria: Array<{
    name: string;
    passed: boolean;
    details: string;
    requirement: string;
  }>;
  reasons: string[];
}

export interface AmortizationCalculationResult {
  monthlyInstallment: number;
  totalInterest: number;
  totalPayable: number;
  schedule: Array<{
    installmentNumber: number;
    dueDate: string;
    openingBalance: number;
    principalAmount: number;
    interestAmount: number;
    installmentAmount: number;
    remainingBalance: number;
  }>;
}

export interface PortfolioSummary {
  totalLoansCount: number;
  activeLoansCount: number;
  performingLoansCount: number;
  overdueLoansCount: number;
  defaultedLoansCount: number;
  totalDisbursed: number;
  totalOutstandingPrincipal: number;
  totalOutstandingInterest: number;
  totalOutstandingPenalty: number;
  totalOutstanding: number;
  totalPrincipalCollected: number;
  totalInterestCollected: number;
  totalPenaltyCollected: number;
  totalCollections: number;
  portfolioAtRiskAmount: number;
  portfolioAtRiskRatePercent: number;
}

export interface AgingBucket {
  label: string;
  count: number;
  amount: number;
  percentage: number;
}

class LoanApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const res = await apiClient.request<{ success: boolean; data: T; error?: string }>(endpoint, options);
    // apiClient unwraps or returns standard structure
    if (res && typeof res === 'object' && 'data' in res && 'success' in res) {
      return (res as any).data;
    }
    return res as unknown as T;
  }

  // Loan Products
  public async getProducts(): Promise<LoanProduct[]> {
    return this.request<LoanProduct[]>('/loans/products');
  }

  public async getProductById(id: string): Promise<LoanProduct> {
    return this.request<LoanProduct>(`/loans/products/${id}`);
  }

  public async createProduct(payload: Partial<LoanProduct>): Promise<LoanProduct> {
    return this.request<LoanProduct>('/loans/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async updateProduct(id: string, updates: Partial<LoanProduct>): Promise<LoanProduct> {
    return this.request<LoanProduct>(`/loans/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Calculator
  public async calculateAmortization(params: {
    principal: number;
    interestRate: number;
    termMonths: number;
    gracePeriodMonths?: number;
    startDate?: string;
  }): Promise<AmortizationCalculationResult> {
    return this.request<AmortizationCalculationResult>('/loans/calculator', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Eligibility
  public async checkMyEligibility(productCode?: string, amount?: number): Promise<LoanEligibilityReport> {
    const query = new URLSearchParams();
    if (productCode) query.append('productCode', productCode);
    if (amount) query.append('amount', String(amount));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<LoanEligibilityReport>(`/loans/eligibility/me${qs}`);
  }

  public async checkMemberEligibility(memberId: string, productCode?: string, amount?: number): Promise<LoanEligibilityReport> {
    const query = new URLSearchParams();
    if (productCode) query.append('productCode', productCode);
    if (amount) query.append('amount', String(amount));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<LoanEligibilityReport>(`/loans/eligibility/${memberId}${qs}`);
  }

  // Applications
  public async apply(payload: any): Promise<Loan> {
    return this.request<Loan>('/loans/apply', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getMyApplications(): Promise<Loan[]> {
    return this.request<Loan[]>('/loans/me/applications');
  }

  public async getMyActiveLoan(): Promise<{ loan: Loan; schedule: LoanScheduleItem[]; repayments: LoanRepayment[] } | null> {
    return this.request<{ loan: Loan; schedule: LoanScheduleItem[]; repayments: LoanRepayment[] } | null>('/loans/me/active');
  }

  public async getMyGuarantorRequests(): Promise<Array<{ loan: any; guarantorRecord: LoanGuarantor }>> {
    return this.request<Array<{ loan: any; guarantorRecord: LoanGuarantor }>>('/loans/me/guarantor-requests');
  }

  public async respondGuarantor(loanId: string, accept: boolean, notes?: string): Promise<Loan> {
    return this.request<Loan>('/loans/guarantors/respond', {
      method: 'POST',
      body: JSON.stringify({ loanId, accept, notes }),
    });
  }

  // Staff Queues
  public async getApplications(filters?: { status?: string; memberId?: string; productCode?: string }): Promise<Loan[]> {
    const query = new URLSearchParams();
    if (filters?.status) query.append('status', filters.status);
    if (filters?.memberId) query.append('memberId', filters.memberId);
    if (filters?.productCode) query.append('productCode', filters.productCode);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<Loan[]>(`/loans/applications${qs}`);
  }

  public async getApplicationById(id: string): Promise<{ loan: Loan; schedule: LoanScheduleItem[]; repayments: LoanRepayment[] }> {
    return this.request<{ loan: Loan; schedule: LoanScheduleItem[]; repayments: LoanRepayment[] }>(`/loans/applications/${id}`);
  }

  public async reviewApplication(id: string, approved: boolean, notes: string): Promise<Loan> {
    return this.request<Loan>(`/loans/applications/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ approved, notes }),
    });
  }

  public async approveApplication(
    id: string,
    approved: boolean,
    params?: { approvedAmount?: number; approvedTermMonths?: number; approvedRate?: number; notes?: string }
  ): Promise<Loan> {
    return this.request<Loan>(`/loans/applications/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approved, ...params }),
    });
  }

  public async disburse(id: string, payload: {
    paymentChannel: string;
    bankReferenceNo?: string;
    destinationAccountId?: string;
  }): Promise<Loan> {
    return this.request<Loan>(`/loans/applications/${id}/disburse`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Repayments & Schedules
  public async getSchedule(loanId: string): Promise<LoanScheduleItem[]> {
    return this.request<LoanScheduleItem[]>(`/loans/${loanId}/schedule`);
  }

  public async getRepayments(filters?: { loanId?: string; memberId?: string }): Promise<LoanRepayment[]> {
    const query = new URLSearchParams();
    if (filters?.loanId) query.append('loanId', filters.loanId);
    if (filters?.memberId) query.append('memberId', filters.memberId);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<LoanRepayment[]>(`/loans/repayments${qs}`);
  }

  public async recordRepayment(payload: {
    loanId: string;
    amount: number;
    paymentChannel: string;
    bankReferenceNo?: string;
    sourceSavingAccountId?: string;
    narration?: string;
    receiptUrl?: string;
  }): Promise<LoanRepayment> {
    return this.request<LoanRepayment>('/loans/repayments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async processOverdue(): Promise<{ processedLoansCount: number; overdueInstallmentsCount: number; totalPenaltiesAssessed: number }> {
    return this.request<{ processedLoansCount: number; overdueInstallmentsCount: number; totalPenaltiesAssessed: number }>('/loans/process-overdue', {
      method: 'POST',
    });
  }

  public async waivePenalty(loanId: string, installmentNumber: number, reason: string): Promise<Loan> {
    return this.request<Loan>(`/loans/${loanId}/waive-penalty`, {
      method: 'POST',
      body: JSON.stringify({ installmentNumber, reason }),
    });
  }

  // Reports
  public async getPortfolioSummary(): Promise<PortfolioSummary> {
    return this.request<PortfolioSummary>('/loans/reports/summary');
  }

  public async getAgingReport(): Promise<{ totalPrincipal: number; buckets: AgingBucket[] }> {
    return this.request<{ totalPrincipal: number; buckets: AgingBucket[] }>('/loans/reports/aging');
  }

  public async getProductReport(): Promise<any[]> {
    return this.request<any[]>('/loans/reports/products');
  }

  public async getStatement(id: string): Promise<any> {
    return this.request<any>(`/loans/${id}/statement`);
  }
}

export const loanApiService = new LoanApiService();
