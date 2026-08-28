import {
  InAppNotification,
  NotificationTemplate,
  NotificationDeliveryLog,
  NotificationPreference,
  ScheduledBroadcast,
  CommunicationMessage,
  ProviderGatewayConfig,
  NotificationStatistics,
} from '../types/notification';
import { storage } from '../utils/storage';

const API_BASE = '/api';

function getAuthHeaders(): Record<string, string> {
  const tokens = storage.get<{ accessToken?: string }>('tokens', {});
  const token =
    tokens?.accessToken ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('token') ||
    localStorage.getItem('wabi_accessToken') ||
    '';

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const notificationApiService = {
  // ==========================================
  // IN-APP NOTIFICATION INBOX
  // ==========================================
  async getMyNotifications(params?: {
    category?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ notifications: InAppNotification[]; total: number; unreadCount: number }> {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));

    const res = await fetch(`${API_BASE}/notifications/me?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  async markRead(id: string): Promise<void> {
    await fetch(`${API_BASE}/notifications/me/${id}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
  },

  async markAllRead(): Promise<void> {
    await fetch(`${API_BASE}/notifications/me/read-all`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  },

  async archiveNotification(id: string): Promise<void> {
    await fetch(`${API_BASE}/notifications/me/${id}/archive`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
  },

  async deleteNotification(id: string): Promise<void> {
    await fetch(`${API_BASE}/notifications/me/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },

  // ==========================================
  // USER PREFERENCES & TELEGRAM INTEGRATION
  // ==========================================
  async getPreferences(): Promise<NotificationPreference> {
    const res = await fetch(`${API_BASE}/notifications/preferences`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch preferences');
    return res.json();
  },

  async updatePreferences(data: Partial<NotificationPreference>): Promise<{ preferences: NotificationPreference; message: string }> {
    const res = await fetch(`${API_BASE}/notifications/preferences`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update notification preferences');
    return res.json();
  },

  async generateTelegramToken(): Promise<{ token: string; botUsername: string; deepLink: string; expiresAt: string }> {
    const res = await fetch(`${API_BASE}/notifications/telegram/generate-token`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to generate Telegram token');
    return res.json();
  },

  async verifyTelegramChat(token: string, chatId: string, username?: string): Promise<{ success: boolean; message: string; preferences: NotificationPreference }> {
    const res = await fetch(`${API_BASE}/notifications/telegram/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ token, chatId, username }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Telegram verification failed');
    return data;
  },

  async unlinkTelegram(): Promise<{ preferences: NotificationPreference; message: string }> {
    const res = await fetch(`${API_BASE}/notifications/telegram/unlink`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to unlink Telegram account');
    return res.json();
  },

  async testSendTelegram(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/notifications/telegram/test-send`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // ==========================================
  // TEMPLATES MANAGEMENT (STAFF / ADMIN)
  // ==========================================
  async getTemplates(category?: string, status?: string): Promise<NotificationTemplate[]> {
    const query = new URLSearchParams();
    if (category) query.set('category', category);
    if (status) query.set('status', status);

    const res = await fetch(`${API_BASE}/notifications/templates?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch templates');
    return res.json();
  },

  async getTemplateById(id: string): Promise<NotificationTemplate> {
    const res = await fetch(`${API_BASE}/notifications/templates/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch template');
    return res.json();
  },

  async createTemplate(data: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    const res = await fetch(`${API_BASE}/notifications/templates`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create template');
    return res.json();
  },

  async updateTemplate(id: string, data: Partial<NotificationTemplate>): Promise<{ template: NotificationTemplate; message: string }> {
    const res = await fetch(`${API_BASE}/notifications/templates/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update template');
    return res.json();
  },

  async previewTemplate(id: string, variables: Record<string, any>): Promise<{
    title: string;
    subject: string;
    inAppBody: string;
    smsBody: string;
    emailBody: string;
    telegramBody: string;
    variablesUsed: string[];
  }> {
    const res = await fetch(`${API_BASE}/notifications/templates/${id}/preview`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ variables }),
    });
    if (!res.ok) throw new Error('Failed to preview template');
    return res.json();
  },

  async testSendTemplate(id: string, payload: { channels: string[]; phoneNumber?: string; email?: string; variables?: Record<string, any> }) {
    const res = await fetch(`${API_BASE}/notifications/templates/${id}/test-send`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to test send template');
    return res.json();
  },

  // ==========================================
  // DELIVERY LOGS & RETRY
  // ==========================================
  async getDeliveryLogs(filters?: {
    channel?: string;
    status?: string;
    category?: string;
    eventCode?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: NotificationDeliveryLog[]; total: number }> {
    const query = new URLSearchParams();
    if (filters?.channel) query.set('channel', filters.channel);
    if (filters?.status) query.set('status', filters.status);
    if (filters?.category) query.set('category', filters.category);
    if (filters?.eventCode) query.set('eventCode', filters.eventCode);
    if (filters?.search) query.set('search', filters.search);
    if (filters?.limit) query.set('limit', String(filters.limit));
    if (filters?.offset) query.set('offset', String(filters.offset));

    const res = await fetch(`${API_BASE}/notifications/delivery-logs?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch delivery logs');
    return res.json();
  },

  async retryDeliveryLog(id: string): Promise<{ success: boolean; message: string; log: NotificationDeliveryLog }> {
    const res = await fetch(`${API_BASE}/notifications/delivery-logs/${id}/retry`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to retry message');
    return res.json();
  },

  async retryAllFailed(channel?: string): Promise<{ success: boolean; retriedCount: number; successCount: number; failCount: number; message: string }> {
    const query = channel ? `?channel=${channel}` : '';
    const res = await fetch(`${API_BASE}/notifications/delivery-logs/retry-all-failed${query}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to bulk retry failed messages');
    return res.json();
  },

  // ==========================================
  // PROVIDER GATEWAYS
  // ==========================================
  async getProviders(): Promise<ProviderGatewayConfig[]> {
    const res = await fetch(`${API_BASE}/notifications/providers`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch providers');
    return res.json();
  },

  async updateProvider(id: string, data: Partial<ProviderGatewayConfig>): Promise<{ provider: ProviderGatewayConfig; message: string }> {
    const res = await fetch(`${API_BASE}/notifications/providers/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update provider');
    return res.json();
  },

  async testProvider(id: string): Promise<{ success: boolean; message: string; result: any }> {
    const res = await fetch(`${API_BASE}/notifications/providers/${id}/test`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // ==========================================
  // BROADCASTS & CAMPAIGNS
  // ==========================================
  async getBroadcasts(): Promise<ScheduledBroadcast[]> {
    const res = await fetch(`${API_BASE}/notifications/broadcasts`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch broadcasts');
    return res.json();
  },

  async createBroadcast(data: Partial<ScheduledBroadcast>): Promise<{ success: boolean; broadcast: ScheduledBroadcast; message: string }> {
    const res = await fetch(`${API_BASE}/notifications/broadcasts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create broadcast');
    return res.json();
  },

  async cancelBroadcast(id: string): Promise<{ success: boolean; broadcast: ScheduledBroadcast; message: string }> {
    const res = await fetch(`${API_BASE}/notifications/broadcasts/${id}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to cancel broadcast');
    return res.json();
  },

  async runBroadcastNow(id: string): Promise<{ success: boolean; broadcast: ScheduledBroadcast; message: string }> {
    const res = await fetch(`${API_BASE}/notifications/broadcasts/${id}/run-now`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to run broadcast');
    return res.json();
  },

  // ==========================================
  // DIRECT CUSTOMER SERVICE MESSAGING
  // ==========================================
  async sendDirectMessage(data: {
    memberId: string;
    subject: string;
    content: string;
    channels: string[];
  }): Promise<{ success: boolean; message: CommunicationMessage }> {
    const res = await fetch(`${API_BASE}/notifications/communication-messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to send direct communication message');
    return res.json();
  },

  async getCommunicationHistory(memberId: string): Promise<CommunicationMessage[]> {
    const res = await fetch(`${API_BASE}/notifications/communication-history/${memberId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch member communication history');
    return res.json();
  },

  async getAllCommunicationMessages(): Promise<CommunicationMessage[]> {
    const res = await fetch(`${API_BASE}/notifications/communication-messages`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      console.warn('Failed to fetch communication messages, status:', res.status);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : (data?.data || []);
  },

  // ==========================================
  // SCHEDULER & AUTOMATED REMINDERS
  // ==========================================
  async runSchedulerReminders(): Promise<{ success: boolean; result: any; message: string }> {
    const res = await fetch(`${API_BASE}/notifications/scheduler/run-reminders`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to run scheduler reminders');
    return res.json();
  },

  async getSchedulerStatus(): Promise<{
    status: string;
    cronActive: boolean;
    lastRunAt: string;
    nextRunAt: string;
    jobs: Array<{ name: string; frequency: string; status: string }>;
  }> {
    const res = await fetch(`${API_BASE}/notifications/scheduler/status`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to get scheduler status');
    return res.json();
  },

  // ==========================================
  // STATISTICS & REPORTS
  // ==========================================
  async getStatistics(): Promise<NotificationStatistics> {
    const res = await fetch(`${API_BASE}/notifications/analytics/summary`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch notification statistics');
    return res.json();
  },

  async getReport(reportType: string, filters?: Record<string, any>): Promise<any> {
    const query = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_BASE}/notifications/reports/${reportType}?${query}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to generate report');
    return res.json();
  },

  getExportReportUrl(reportType: string, filters?: Record<string, any>): string {
    const query = new URLSearchParams(filters).toString();
    return `${API_BASE}/notifications/reports/${reportType}/export?${query}`;
  },
};
