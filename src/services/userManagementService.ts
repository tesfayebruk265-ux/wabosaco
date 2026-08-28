import { apiClient } from './apiClient';

export interface UserSummary {
  id: string;
  username: string;
  email: string;
  phoneNumber: string;
  fullName: string;
  role: string;
  roles: Array<{ id: string; code: string; name: string }>;
  status: 'ACTIVE' | 'DEACTIVATED';
  isActive: boolean;
  membershipNo?: string;
  avatarUrl?: string;
  failedLoginAttempts?: number;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserListResponse {
  success: boolean;
  data: UserSummary[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const userManagementService = {
  async getUsers(params: { search?: string; role?: string; status?: string; page?: number; limit?: number } = {}): Promise<UserListResponse> {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.role) query.append('role', params.role);
    if (params.status) query.append('status', params.status);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    return apiClient.get<UserListResponse>(`/users?${query.toString()}`);
  },

  async getUserById(id: string): Promise<{ success: boolean; data: UserSummary & { permissions: string[] } }> {
    return apiClient.get<{ success: boolean; data: UserSummary & { permissions: string[] } }>(`/users/${id}`);
  },

  async createUser(payload: {
    username: string;
    email: string;
    phoneNumber: string;
    fullName: string;
    role: string;
    password?: string;
    membershipNo?: string;
  }): Promise<{ success: boolean; data: UserSummary; message: string }> {
    return apiClient.post('/users', payload);
  },

  async updateUser(id: string, payload: {
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    avatarUrl?: string;
    role?: string;
  }): Promise<{ success: boolean; data: UserSummary; message: string }> {
    const res = await apiClient.put<{ success: boolean; data: UserSummary; message: string }>(`/users/${id}`, payload);
    if (payload.role) {
      await apiClient.post(`/users/${id}/roles`, { roleCode: payload.role });
    }
    return res;
  },

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/users/${id}`);
  },

  async activateUser(id: string): Promise<{ success: boolean; data: UserSummary; message: string }> {
    return apiClient.post(`/users/${id}/activate`);
  },

  async deactivateUser(id: string): Promise<{ success: boolean; data: UserSummary; message: string }> {
    return apiClient.post(`/users/${id}/deactivate`);
  },

  async updateUserStatus(id: string, status: 'ACTIVE' | 'DEACTIVATED'): Promise<{ success: boolean; data: UserSummary; message: string }> {
    if (status === 'ACTIVE') {
      return apiClient.post(`/users/${id}/activate`);
    } else {
      return apiClient.post(`/users/${id}/deactivate`);
    }
  },

  async unlockUser(id: string): Promise<{ success: boolean; data?: UserSummary; message: string }> {
    return apiClient.post(`/users/${id}/activate`);
  },

  async adminResetPassword(id: string, newPassword?: string): Promise<{ success: boolean; message: string; data?: { temporaryPassword?: string } }> {
    return apiClient.post(`/users/${id}/reset-password`, { newPassword });
  },

  async assignRole(userId: string, roleCode: string): Promise<{ success: boolean; data: UserSummary; message: string }> {
    return apiClient.post(`/users/${userId}/roles`, { roleCode });
  },

  async removeRole(userId: string, roleIdOrCode: string): Promise<{ success: boolean; data: UserSummary; message: string }> {
    return apiClient.delete(`/users/${userId}/roles/${roleIdOrCode}`);
  },
};
