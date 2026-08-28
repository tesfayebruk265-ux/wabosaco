export type TicketCategory =
  | 'MEMBERSHIP'
  | 'SAVINGS'
  | 'SHARES'
  | 'LOANS'
  | 'ACCOUNTING'
  | 'PAYMENTS'
  | 'MOBILE_APP'
  | 'WEBSITE'
  | 'NOTIFICATIONS'
  | 'GENERAL_INQUIRY'
  | 'COMPLAINT'
  | 'SUGGESTION'
  | 'TECHNICAL_ISSUE';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TicketStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_MEMBER'
  | 'ESCALATED'
  | 'RESOLVED'
  | 'CLOSED'
  | 'CANCELLED';

export type TicketDepartment =
  | 'CUSTOMER_SERVICE'
  | 'FINANCE'
  | 'LOANS'
  | 'IT_SUPPORT'
  | 'MANAGEMENT';

export type EscalationLevel = 0 | 1 | 2 | 3; // 0: Agent, 1: Supervisor, 2: Manager, 3: Administrator

export interface TicketAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number; // in bytes
  fileType: string;
  uploadedAt: string;
  uploadedBy: string;
  uploadedByName: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string; // e.g. TCK-2026-0001
  memberId?: string;
  membershipNo?: string;
  memberFullName: string;
  memberEmail?: string;
  memberPhone?: string;
  userId?: string;
  category: TicketCategory;
  priority: TicketPriority;
  subject: string;
  description: string;
  attachments: TicketAttachment[];
  assignedStaffId?: string;
  assignedStaffName?: string;
  department: TicketDepartment;
  currentStatus: TicketStatus;
  resolution?: string;
  resolutionDate?: string;
  resolvedById?: string;
  resolvedByName?: string;
  slaRuleId?: string;
  slaFirstResponseDue: string;
  slaResolutionDue: string;
  firstRespondedAt?: string;
  firstRespondedById?: string;
  resolvedAt?: string;
  isSlaResponseBreached: boolean;
  isSlaResolutionBreached: boolean;
  escalationLevel: EscalationLevel;
  escalatedToName?: string;
  escalationReason?: string;
  satisfactionRating?: number; // 1-5
  satisfactionComment?: string;
  satisfactionImprovement?: string;
  ratedAt?: string;
  mergedIntoTicketId?: string;
  mergedTicketNumbers?: string[];
  isMerged: boolean;
  parentTicketId?: string;
  childTicketIds?: string[];
  reopenCount: number;
  lastRepliedAt: string;
  lastRepliedBy: string;
  lastRepliedRole: 'MEMBER' | 'STAFF' | 'SYSTEM';
  createdDate: string;
  updatedDate: string;
}

export type TicketMessageType =
  | 'MEMBER_REPLY'
  | 'STAFF_REPLY'
  | 'INTERNAL_NOTE'
  | 'STATUS_CHANGE'
  | 'ASSIGNMENT'
  | 'TRANSFER'
  | 'ESCALATION'
  | 'SLA_BREACH_ALERT'
  | 'MERGE_SPLIT'
  | 'RESOLUTION'
  | 'REOPEN'
  | 'RATING';

export interface TicketMessage {
  id: string;
  ticketId: string;
  type: TicketMessageType;
  senderId: string;
  senderName: string;
  senderRole: string;
  isInternalNote: boolean; // CRITICAL: true if private note visible ONLY to authorized staff
  content: string;
  attachments?: TicketAttachment[];
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface SlaPolicy {
  id: string;
  name: string;
  priority: TicketPriority;
  category?: TicketCategory | 'ALL';
  firstResponseMinutes: number;
  resolutionMinutes: number;
  escalationThresholdPercent: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type KbCategory =
  | 'MEMBERSHIP'
  | 'SAVINGS'
  | 'LOANS'
  | 'SHARES'
  | 'PAYMENTS'
  | 'SECURITY'
  | 'FAQ'
  | 'ANNOUNCEMENTS';

export interface KnowledgeBaseArticle {
  id: string;
  articleCode: string; // e.g. KB-101
  title: string;
  slug: string;
  category: KbCategory;
  summary: string;
  content: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  tags: string[];
  relatedArticleIds?: string[];
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  createdById: string;
  createdByName: string;
  updatedById: string;
  updatedByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatSession {
  id: string;
  sessionNo: string;
  memberId?: string;
  memberName: string;
  memberEmail?: string;
  status: 'BOT_ACTIVE' | 'WAITING_AGENT' | 'AGENT_CONNECTED' | 'CLOSED';
  assignedAgentId?: string;
  assignedAgentName?: string;
  department: TicketDepartment;
  rating?: number;
  feedback?: string;
  startedAt: string;
  endedAt?: string;
  lastMessageAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  sender: 'MEMBER' | 'AGENT' | 'BOT';
  senderId?: string;
  senderName: string;
  text: string;
  suggestedArticleId?: string;
  attachments?: TicketAttachment[];
  createdAt: string;
}

export interface Member360Profile {
  member: {
    id: string;
    memberNo: string;
    fullName: string;
    phone: string;
    email: string;
    status: string;
    branch: string;
    joinDate: string;
    kycStatus: string;
  };
  savings: {
    totalBalance: number;
    accountsCount: number;
    accounts: Array<{
      id: string;
      accountNumber: string;
      productName: string;
      balance: number;
      status: string;
    }>;
  };
  shares: {
    totalShares: number;
    totalValue: number;
    certificateCount: number;
  };
  loans: {
    activeLoansCount: number;
    totalOutstanding: number;
    loans: Array<{
      id: string;
      loanNumber: string;
      productName: string;
      principal: number;
      totalOutstanding: number;
      status: string;
      nextDueDate?: string;
    }>;
  };
  recentTransactions: Array<{
    id: string;
    reference: string;
    type: string;
    amount: number;
    date: string;
    status: string;
  }>;
  supportHistory: {
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
    tickets: Array<{
      id: string;
      ticketNumber: string;
      subject: string;
      category: TicketCategory;
      priority: TicketPriority;
      currentStatus: TicketStatus;
      createdDate: string;
    }>;
  };
}

export interface CrmDashboardMetrics {
  totalTickets: number;
  openTickets: number;
  todayTickets: number;
  overdueTickets: number;
  resolvedToday: number;
  avgResolutionHours: number;
  slaBreachedCount: number;
  slaComplianceRate: number;
  pendingEscalations: number;
  averageCsat: number;
  activeAgentsCount: number;
  categoryBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  departmentBreakdown: Record<string, number>;
}

export interface AgentPerformanceMetric {
  agentId: string;
  agentName: string;
  department: string;
  assignedCount: number;
  resolvedCount: number;
  openCount: number;
  avgResolutionHours: number;
  slaBreachCount: number;
  csatAverage: number;
  totalRatingsCount: number;
}
