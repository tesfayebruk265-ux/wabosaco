import { apiClient } from './apiClient';

export interface RoleDetail {
  id: string;
  code: string;
  name: string;
  description: string;
  portalPrefix: string;
  isSystem: boolean;
  permissions: string[];
  permissionsList?: Array<{ id: string; code: string; name: string; module: string; description: string }>;
  createdAt: string;
}

export interface PermissionDetail {
  id: string;
  code: string;
  name: string;
  module: string;
  description: string;
}

export interface LoginHistoryEntry {
  id: string;
  userId: string | null;
  identifierAttempted: string;
  status: 'SUCCESS' | 'FAILED';
  failureReason: string | null;
  ipAddress: string;
  userAgent: string;
  deviceInfo: string;
  timestamp: string;
}

export interface SecurityEventEntry {
  id: string;
  eventType: string;
  userId: string | null;
  actorId: string | null;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
  timestamp: string;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  resource: string;
  resourceId: string;
  beforeState: Record<string, any> | null;
  afterState: Record<string, any> | null;
  result: 'SUCCESS' | 'FAILURE';
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export const rbacManagementService = {
  async getRoles(): Promise<{ success: boolean; data: RoleDetail[] }> {
    return apiClient.get('/roles');
  },

  async getRoleById(id: string): Promise<{ success: boolean; data: RoleDetail }> {
    return apiClient.get(`/roles/${id}`);
  },

  async createRole(payload: {
    code: string;
    name: string;
    description?: string;
    portalPrefix?: string;
    permissions?: string[];
  }): Promise<{ success: boolean; data: RoleDetail; message: string }> {
    return apiClient.post('/roles', payload);
  },

  async updateRole(id: string, payload: {
    name?: string;
    description?: string;
    portalPrefix?: string;
    permissions?: string[];
  }): Promise<{ success: boolean; data: RoleDetail; message: string }> {
    return apiClient.put(`/roles/${id}`, payload);
  },

  async deleteRole(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/roles/${id}`);
  },

  async getPermissions(): Promise<{ success: boolean; data: PermissionDetail[] }> {
    return apiClient.get('/permissions');
  },

  async getLoginHistory(limit = 50): Promise<{ success: boolean; data: LoginHistoryEntry[] }> {
    return apiClient.get(`/security/login-history?limit=${limit}`);
  },

  async getSecurityEvents(limit = 50): Promise<{ success: boolean; data: SecurityEventEntry[] }> {
    return apiClient.get(`/security/events?limit=${limit}`);
  },

  async getAuditLogs(limit = 50): Promise<{ success: boolean; data: AuditLogEntry[] }> {
    return apiClient.get(`/security/audit-logs?limit=${limit}`);
  },
};
