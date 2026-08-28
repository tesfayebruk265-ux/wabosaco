import { apiClient } from './apiClient';

export interface RegisterMemberPayload {
  personalInfo: {
    fullName: string;
    gender: 'MALE' | 'FEMALE';
    dateOfBirth: string;
    nationalId: string;
  };
  contactInfo: {
    phoneNumber: string;
    email: string;
    username: string;
    password: string;
  };
  address: {
    region: string;
    zone: string;
    woreda: string;
    kebele: string;
    specificAddress?: string;
    additionalInfo?: string;
  };
  employment: {
    occupation: string;
    employer: string;
    monthlyIncome: number;
    employmentType: 'Employed' | 'Self-employed' | 'Business Owner' | 'Student' | 'Unemployed' | 'Other';
  };
  family: {
    familyMembersCount: number;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    address?: string;
  };
  nominees: Array<{
    fullName: string;
    relationship: string;
    phone: string;
    address?: string;
    percentage: number;
  }>;
  referral?: {
    referralType?: string;
    referralMemberNo?: string;
    referralInfo?: string;
  };
  profilePhotoDocumentId?: string;
  profilePhotoUrl?: string;
  payment: {
    paymentMethod: 'CBE' | 'Tsehay Bank' | 'Bank Transfer';
    referenceNumber: string;
    receiptDocumentId?: string;
    receiptUrl?: string;
  };
}

export interface ClientMember {
  id: string;
  userId?: string;
  membershipNo: string;
  fullName: string;
  gender: 'MALE' | 'FEMALE';
  dateOfBirth: string;
  nationalId: string;
  phoneNumber: string;
  email: string;
  address: {
    region: string;
    zone: string;
    woreda: string;
    kebele: string;
    specificAddress?: string;
    additionalInfo?: string;
  };
  occupation: string;
  employer: string;
  monthlyIncome: number;
  employmentType: string;
  familyMembersCount: number;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    address?: string;
  };
  nominees: Array<{
    id?: string;
    fullName: string;
    relationship: string;
    phone: string;
    address?: string;
    percentage: number;
  }>;
  referral?: {
    referralType?: string;
    referralMemberNo?: string;
    referralInfo?: string;
  };
  profilePictureUrl?: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'TERMINATED';
  approvedAt?: string;
  approvedBy?: string;
  membershipDate: string;
  suspendedAt?: string | null;
  suspendedReason?: string | null;
  terminatedAt?: string | null;
  terminatedReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientRegistrationRequest {
  id: string;
  applicationReference: string;
  userId?: string;
  memberId?: string;
  membershipNo?: string;
  personalInfo: {
    fullName: string;
    gender: 'MALE' | 'FEMALE';
    dateOfBirth: string;
    nationalId: string;
  };
  contactInfo: {
    phoneNumber: string;
    email: string;
    username: string;
  };
  address: {
    region: string;
    zone: string;
    woreda: string;
    kebele: string;
    specificAddress?: string;
  };
  employment: {
    occupation: string;
    employer: string;
    monthlyIncome: number;
    employmentType: string;
  };
  family: {
    familyMembersCount: number;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    address?: string;
  };
  nominees: Array<{
    id?: string;
    fullName: string;
    relationship: string;
    phone: string;
    percentage: number;
  }>;
  referral?: {
    referralType?: string;
    referralMemberNo?: string;
    referralInfo?: string;
  };
  payment: {
    amount: number;
    paymentMethod: 'CBE' | 'Tsehay Bank' | 'Bank Transfer';
    referenceNumber: string;
    receiptDocumentId?: string;
    receiptUrl?: string;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  submittedAt: string;
  receiptHistory: Array<{
    id: string;
    receiptDocumentId?: string;
    receiptUrl?: string;
    paymentMethod: string;
    referenceNumber: string;
    amount: number;
    uploadedAt: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    reviewedAt?: string;
    rejectionReason?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

class MemberApiService {
  // Public Registration
  public registerMember(data: RegisterMemberPayload): Promise<{
    success: boolean;
    applicationReference: string;
    status: string;
    message: string;
  }> {
    return apiClient.post('/members/register', data);
  }

  public getRegistrationStatus(reference: string): Promise<{
    success: boolean;
    data: Partial<ClientRegistrationRequest>;
  }> {
    return apiClient.get(`/members/register/status/${encodeURIComponent(reference)}`);
  }

  public reuploadReceipt(
    reference: string,
    data: {
      paymentMethod: 'CBE' | 'Tsehay Bank' | 'Bank Transfer';
      referenceNumber: string;
      receiptUrl?: string;
      receiptDocumentId?: string;
    }
  ): Promise<{ success: boolean; message: string; request: ClientRegistrationRequest }> {
    return apiClient.post(`/members/register/reupload-receipt/${encodeURIComponent(reference)}`, data);
  }

  public uploadDocument(payload: {
    originalName: string;
    mimeType: string;
    size: number;
    documentType: string;
    dataUrl: string;
  }): Promise<{ success: boolean; documentId: string; url: string; originalName: string }> {
    return apiClient.post('/members/register/upload', payload);
  }

  // Member Self-Service
  public getMyProfile(): Promise<{ success: boolean; data: ClientMember }> {
    return apiClient.get('/members/me');
  }

  public updateMyProfile(updates: Partial<ClientMember>): Promise<{ success: boolean; data: ClientMember; message: string }> {
    return apiClient.put('/members/me', updates);
  }

  public getMyNominees(): Promise<{ success: boolean; data: ClientMember['nominees'] }> {
    return apiClient.get('/members/me/nominees');
  }

  public updateMyNominees(nominees: ClientMember['nominees']): Promise<{
    success: boolean;
    data: ClientMember['nominees'];
    message: string;
  }> {
    return apiClient.put('/members/me/nominees', { nominees });
  }

  // Accountant Registration Requests & Verification
  public getRegistrationRequests(params?: { status?: string; search?: string }): Promise<{
    success: boolean;
    requests: ClientRegistrationRequest[];
    total: number;
  }> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    return apiClient.get(`/membership/registration-requests?${query.toString()}`);
  }

  public getRegistrationRequestById(id: string): Promise<{ success: boolean; data: ClientRegistrationRequest }> {
    return apiClient.get(`/membership/registration-requests/${id}`);
  }

  public approveRegistrationRequest(id: string): Promise<{
    success: boolean;
    membershipNo: string;
    message: string;
    member: ClientMember;
  }> {
    return apiClient.post(`/membership/registration-requests/${id}/approve`);
  }

  public rejectRegistrationRequest(
    id: string,
    reason: string
  ): Promise<{ success: boolean; message: string; request: ClientRegistrationRequest }> {
    return apiClient.post(`/membership/registration-requests/${id}/reject`, { reason });
  }

  // Staff Members Management
  public getMembers(params?: { search?: string; status?: string }): Promise<{
    success: boolean;
    members: ClientMember[];
    total: number;
  }> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    return apiClient.get(`/members?${query.toString()}`);
  }

  public getMemberById(id: string): Promise<{ success: boolean; data: ClientMember }> {
    return apiClient.get(`/members/${id}`);
  }

  public updateMemberByStaff(
    id: string,
    updates: Partial<ClientMember>
  ): Promise<{ success: boolean; data: ClientMember; message: string }> {
    return apiClient.put(`/members/${id}`, updates);
  }

  public activateMember(id: string): Promise<{ success: boolean; message: string; data: ClientMember }> {
    return apiClient.post(`/members/${id}/activate`);
  }

  public suspendMember(id: string, reason: string): Promise<{ success: boolean; message: string; data: ClientMember }> {
    return apiClient.post(`/members/${id}/suspend`, { reason });
  }

  public terminateMember(id: string, reason: string): Promise<{ success: boolean; message: string; data: ClientMember }> {
    return apiClient.post(`/members/${id}/terminate`, { reason });
  }
}

export const memberApiService = new MemberApiService();
