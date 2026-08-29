import {
  SupportTicket,
  TicketMessage,
  SlaPolicy,
  KnowledgeBaseArticle,
  ChatSession,
  ChatMessage,
  Member360Profile,
  CrmDashboardMetrics,
  AgentPerformanceMetric,
  TicketPriority,
  TicketCategory,
  TicketDepartment,
  TicketStatus,
} from '../types/crm';

import { storage } from '../utils/storage';

const API_BASE = '/api/crm';

function getAuthHeaders(): HeadersInit {
  const tokens = storage.get<{ accessToken?: string }>('tokens', {});
  const token = tokens?.accessToken || localStorage.getItem('wabi_auth_token') || sessionStorage.getItem('wabi_auth_token') || localStorage.getItem('wabi_tokens');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const crmService = {
  // ==========================================
  // TICKETS
  // ==========================================
  async getTickets(params?: {
    memberId?: string;
    assignedStaffId?: string;
    department?: string;
    category?: string;
    priority?: string;
    status?: string;
    search?: string;
    isOverdue?: boolean;
    isEscalated?: boolean;
  }): Promise<{ success: boolean; count: number; tickets: SupportTicket[] }> {
    try {
      const query = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            query.append(key, String(val));
          }
        });
      }
      const res = await fetch(`${API_BASE}/tickets?${query.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return { success: true, count: 0, tickets: [] };
      return res.json();
    } catch {
      return { success: true, count: 0, tickets: [] };
    }
  },

  async getTicketById(id: string): Promise<{ success: boolean; ticket: SupportTicket; messages: TicketMessage[] }> {
    const res = await fetch(`${API_BASE}/tickets/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch ticket details');
    return res.json();
  },

  async createTicket(payload: {
    memberId?: string;
    category: TicketCategory;
    priority: TicketPriority;
    department?: TicketDepartment;
    subject: string;
    description: string;
    attachments?: Array<{ id: string; name: string; url: string; size: number; mimeType: string }>;
  }): Promise<{ success: boolean; message: string; ticket: SupportTicket }> {
    const res = await fetch(`${API_BASE}/tickets`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create ticket');
    }
    return res.json();
  },

  async addMessage(
    ticketId: string,
    payload: {
      content: string;
      isInternalNote?: boolean;
      attachments?: Array<{ id: string; name: string; url: string; size: number; mimeType: string }>;
    }
  ): Promise<{ success: boolean; message: string; data: TicketMessage; ticket: SupportTicket }> {
    const res = await fetch(`${API_BASE}/tickets/${ticketId}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to send message');
    }
    return res.json();
  },

  async updateTicket(
    ticketId: string,
    updates: {
      status?: TicketStatus;
      priority?: TicketPriority;
      category?: TicketCategory;
      department?: TicketDepartment;
      assignedStaffId?: string;
      assignedStaffName?: string;
      resolution?: string;
    }
  ): Promise<{ success: boolean; message: string; ticket: SupportTicket }> {
    const res = await fetch(`${API_BASE}/tickets/${ticketId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update ticket');
    }
    return res.json();
  },

  async escalateTicket(
    ticketId: string,
    payload: { level?: number; reason: string; escalatedToName?: string; targetDepartment?: TicketDepartment }
  ): Promise<{ success: boolean; message: string; ticket: SupportTicket }> {
    const res = await fetch(`${API_BASE}/tickets/${ticketId}/escalate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to escalate ticket');
    }
    return res.json();
  },

  async reopenTicket(
    ticketId: string,
    reason: string
  ): Promise<{ success: boolean; message: string; ticket: SupportTicket }> {
    const res = await fetch(`${API_BASE}/tickets/${ticketId}/reopen`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to reopen ticket');
    }
    return res.json();
  },

  async mergeTickets(
    primaryTicketId: string,
    secondaryTicketIds: string[]
  ): Promise<{ success: boolean; message: string; ticket: SupportTicket }> {
    const res = await fetch(`${API_BASE}/tickets/${primaryTicketId}/merge`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ primaryTicketId, secondaryTicketIds }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to merge tickets');
    }
    return res.json();
  },

  async submitCsat(
    ticketId: string,
    payload: { rating: number; comment?: string; improvement?: string }
  ): Promise<{ success: boolean; message: string; ticket: SupportTicket }> {
    const res = await fetch(`${API_BASE}/tickets/${ticketId}/csat`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to submit rating');
    }
    return res.json();
  },

  // ==========================================
  // MEMBER 360 PROFILE
  // ==========================================
  async getMember360(memberId: string): Promise<{ success: boolean; profile: Member360Profile }> {
    const res = await fetch(`${API_BASE}/members/${memberId}/360`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load Member 360 profile');
    return res.json();
  },

  // ==========================================
  // DASHBOARD METRICS
  // ==========================================
  async getDashboardMetrics(): Promise<{
    success: boolean;
    metrics: CrmDashboardMetrics;
    agentPerformance: AgentPerformanceMetric[];
  }> {
    const res = await fetch(`${API_BASE}/analytics/dashboard`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load CRM analytics');
    return res.json();
  },

  // ==========================================
  // SLA POLICIES
  // ==========================================
  async getSlaPolicies(): Promise<{ success: boolean; policies: SlaPolicy[] }> {
    const fallbackPolicies: SlaPolicy[] = [
      { id: 'sla_critical', name: 'Critical Urgency Priority', priority: 'CRITICAL', firstResponseTimeHours: 1, resolutionTimeHours: 4, escalationManagerRole: 'GENERAL_MANAGER', isActive: true },
      { id: 'sla_high', name: 'High Urgency Priority', priority: 'HIGH', firstResponseTimeHours: 2, resolutionTimeHours: 8, escalationManagerRole: 'CS_SUPERVISOR', isActive: true },
      { id: 'sla_medium', name: 'Standard Medium Priority', priority: 'MEDIUM', firstResponseTimeHours: 4, resolutionTimeHours: 24, escalationManagerRole: 'CS_SUPERVISOR', isActive: true },
      { id: 'sla_low', name: 'Low Priority / General Inquiry', priority: 'LOW', firstResponseTimeHours: 8, resolutionTimeHours: 48, escalationManagerRole: 'CS_SUPERVISOR', isActive: true },
    ];
    try {
      const res = await fetch(`${API_BASE}/crm/sla/policies`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const altRes = await fetch(`${API_BASE}/sla/policies`, { headers: getAuthHeaders() });
        if (!altRes.ok) return { success: true, policies: fallbackPolicies };
        return altRes.json();
      }
      return res.json();
    } catch {
      return { success: true, policies: fallbackPolicies };
    }
  },

  async updateSlaPolicy(
    id: string,
    updates: Partial<SlaPolicy>
  ): Promise<{ success: boolean; message: string; policy: SlaPolicy }> {
    try {
      const res = await fetch(`${API_BASE}/crm/sla/policies/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const altRes = await fetch(`${API_BASE}/sla/policies/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(updates),
        });
        if (!altRes.ok) throw new Error('Failed to update SLA policy');
        return altRes.json();
      }
      return res.json();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update SLA policy');
    }
  },

  // ==========================================
  // KNOWLEDGE BASE
  // ==========================================
  async getKbArticles(params?: {
    category?: string;
    status?: string;
    search?: string;
    tag?: string;
  }): Promise<{ success: boolean; count: number; articles: KnowledgeBaseArticle[] }> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val) query.append(key, val);
      });
    }
    const res = await fetch(`${API_BASE}/kb/articles?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to load KB articles');
    return res.json();
  },

  async getKbArticleById(id: string): Promise<{ success: boolean; article: KnowledgeBaseArticle }> {
    const res = await fetch(`${API_BASE}/kb/articles/${id}`);
    if (!res.ok) throw new Error('Failed to load article');
    return res.json();
  },

  async createKbArticle(payload: Partial<KnowledgeBaseArticle>): Promise<{
    success: boolean;
    message: string;
    article: KnowledgeBaseArticle;
  }> {
    const res = await fetch(`${API_BASE}/kb/articles`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create article');
    return res.json();
  },

  async updateKbArticle(
    id: string,
    updates: Partial<KnowledgeBaseArticle>
  ): Promise<{ success: boolean; message: string; article: KnowledgeBaseArticle }> {
    const res = await fetch(`${API_BASE}/kb/articles/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update article');
    return res.json();
  },

  async deleteKbArticle(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/kb/articles/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete article');
    return res.json();
  },

  async voteKbArticle(id: string, helpful: boolean): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/kb/articles/${id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ helpful }),
    });
    if (!res.ok) throw new Error('Failed to record feedback');
    return res.json();
  },

  // ==========================================
  // LIVE CHAT
  // ==========================================
  async getChatSessions(status?: string): Promise<{ success: boolean; sessions: ChatSession[] }> {
    try {
      const url = status ? `${API_BASE}/chat/sessions?status=${status}` : `${API_BASE}/chat/sessions`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (!res.ok) return { success: true, sessions: [] };
      return res.json();
    } catch {
      return { success: true, sessions: [] };
    }
  },

  async createChatSession(payload: {
    initialMessage?: string;
    department?: TicketDepartment;
  }): Promise<{ success: boolean; session: ChatSession }> {
    const res = await fetch(`${API_BASE}/chat/sessions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to start chat session');
    return res.json();
  },

  async getChatMessages(sessionId: string): Promise<{ success: boolean; messages: ChatMessage[] }> {
    const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}/messages`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load chat messages');
    return res.json();
  },

  async sendChatMessage(
    sessionId: string,
    text: string
  ): Promise<{ success: boolean; message: ChatMessage }> {
    const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error('Failed to send chat message');
    return res.json();
  },

  async closeChatSession(
    sessionId: string,
    rating?: number,
    feedback?: string
  ): Promise<{ success: boolean; session: ChatSession }> {
    const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}/close`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ rating, feedback }),
    });
    if (!res.ok) throw new Error('Failed to close chat session');
    return res.json();
  },
};
