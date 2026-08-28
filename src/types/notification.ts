export type NotificationChannel = 'IN_APP' | 'SMS' | 'EMAIL' | 'TELEGRAM';

export type NotificationCategory =
  | 'MEMBERSHIP'
  | 'SAVINGS'
  | 'SHARES'
  | 'LOANS'
  | 'ACCOUNTING'
  | 'SYSTEM'
  | 'MARKETING'
  | 'GENERAL';

export type NotificationEventCode =
  // Membership
  | 'REGISTRATION_SUBMITTED'
  | 'RECEIPT_APPROVED'
  | 'RECEIPT_REJECTED'
  | 'MEMBERSHIP_APPROVED'
  | 'MEMBERSHIP_ACTIVATED'
  | 'MEMBERSHIP_SUSPENDED'
  | 'MEMBERSHIP_TERMINATED'
  | 'RECEIPT_REPLACEMENT_REQUIRED'
  // Savings
  | 'SAVINGS_DEPOSIT_SUCCESSFUL'
  | 'SAVINGS_DEPOSIT_CONFIRMED'
  | 'SAVINGS_DEPOSIT_REJECTED'
  | 'SAVINGS_WITHDRAWAL_SUBMITTED'
  | 'SAVINGS_WITHDRAWAL_APPROVED'
  | 'SAVINGS_WITHDRAWAL_REJECTED'
  | 'SAVINGS_WITHDRAWAL_COMPLETED'
  | 'SAVINGS_WITHDRAWAL_CONFIRMED'
  | 'MONTHLY_SAVING_REMINDER'
  | 'SAVINGS_BALANCE_UPDATED'
  | 'INTEREST_POSTED'
  // Shares
  | 'SHARE_PURCHASE'
  | 'SHARE_PURCHASE_APPROVED'
  | 'SHARE_PURCHASE_REJECTED'
  | 'SHARE_CONVERSION'
  | 'MIN_SHARE_REQUIREMENT_REACHED'
  // Loans
  | 'LOAN_APPLICATION_SUBMITTED'
  | 'LOAN_SUBMITTED'
  | 'LOAN_UNDER_REVIEW'
  | 'LOAN_APPROVED'
  | 'LOAN_REJECTED'
  | 'GUARANTOR_REQUEST'
  | 'GUARANTOR_ACCEPTED'
  | 'GUARANTOR_DECLINED'
  | 'GUARANTOR_APPROVED'
  | 'LOAN_DISBURSED'
  | 'UPCOMING_PAYMENT'
  | 'UPCOMING_INSTALLMENT'
  | 'PAYMENT_RECEIVED'
  | 'INSTALLMENT_PAID'
  | 'LATE_PAYMENT'
  | 'LATE_PAYMENT_REMINDER'
  | 'LOAN_DEFAULTED'
  | 'LOAN_COMPLETED'
  // Accounting
  | 'PERIOD_CLOSED'
  | 'BUDGET_ALERT'
  // System & Security
  | 'PASSWORD_CHANGED'
  | 'LOGIN_ALERT'
  | 'FAILED_LOGIN_ATTEMPTS'
  | 'PROFILE_UPDATED'
  | 'NEW_DEVICE_LOGIN'
  | 'ROLE_CHANGED'
  | 'TRANSACTION_REVERSED'
  | 'ANNOUNCEMENT'
  | 'POLICY_UPDATE'
  | 'EMERGENCY_NOTICE'
  | 'DIRECT_MESSAGE';

export interface InAppNotification {
  id: string;
  userId?: string;
  recipientId?: string;
  memberId?: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  eventType: string;
  category?: NotificationCategory;
  channel?: NotificationChannel;
  isRead: boolean;
  isArchived?: boolean;
  isDeleted?: boolean;
  readAt?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface NotificationTemplate {
  id: string;
  code: string;
  name: string;
  category: NotificationCategory;
  title: string;
  subject?: string;
  smsBody: string;
  emailBody: string;
  telegramBody: string;
  inAppBody?: string;
  variables: string[];
  language: 'en' | 'am' | 'om';
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
  version: number;
  channels: NotificationChannel[];
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface NotificationDeliveryLog {
  id: string;
  recipientUserId?: string;
  recipientMemberId?: string;
  recipientName: string;
  recipientContact: string;
  channel: NotificationChannel;
  eventCode: string;
  category: NotificationCategory;
  title: string;
  message: string;
  status: 'QUEUED' | 'SENDING' | 'DELIVERED' | 'FAILED' | 'READ';
  providerId?: string;
  providerMessageId?: string;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  queuedAt: string;
  sentAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  metadata?: Record<string, any>;
}

export interface NotificationPreference {
  userId: string;
  channelsEnabled: {
    inApp: boolean;
    sms: boolean;
    email: boolean;
    telegram: boolean;
  };
  categoryPreferences: {
    MEMBERSHIP: { inApp: boolean; sms: boolean; email: boolean; telegram: boolean };
    SAVINGS: { inApp: boolean; sms: boolean; email: boolean; telegram: boolean };
    SHARES: { inApp: boolean; sms: boolean; email: boolean; telegram: boolean };
    LOANS: { inApp: boolean; sms: boolean; email: boolean; telegram: boolean };
    ACCOUNTING: { inApp: boolean; sms: boolean; email: boolean; telegram: boolean };
    SYSTEM: { inApp: boolean; sms: boolean; email: boolean; telegram: boolean };
    MARKETING: { inApp: boolean; sms: boolean; email: boolean; telegram: boolean };
    GENERAL: { inApp: boolean; sms: boolean; email: boolean; telegram: boolean };
  };
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  telegramChatId?: string;
  telegramUsername?: string;
  telegramVerified?: boolean;
  telegramVerificationToken?: string;
  telegramVerificationExpiresAt?: string;
  language: 'en' | 'am' | 'om';
  updatedAt: string;
}

export interface ScheduledBroadcast {
  id: string;
  broadcastNo: string;
  title: string;
  category: 'ANNOUNCEMENT' | 'MARKETING' | 'POLICY' | 'EMERGENCY';
  channels: NotificationChannel[];
  targetAudience:
    | 'ALL_MEMBERS'
    | 'ACTIVE_MEMBERS'
    | 'BORROWERS_WITH_ACTIVE_LOANS'
    | 'SAVERS_REGULAR'
    | 'MEMBERS_PENDING_KYC'
    | 'CUSTOM_SELECTION'
    | 'STAFF_ALL';
  customRecipientIds?: string[];
  scheduleType: 'IMMEDIATE' | 'SCHEDULED' | 'RECURRING';
  scheduledAt?: string | null;
  recurringPattern?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | null;
  smsMessage?: string;
  emailSubject?: string;
  emailMessage?: string;
  telegramMessage?: string;
  inAppMessage?: string;
  totalRecipients: number;
  sentCount: number;
  successCount: number;
  failureCount: number;
  status: 'DRAFT' | 'PENDING' | 'RUNNING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  executedAt?: string | null;
}

export interface CommunicationMessage {
  id: string;
  memberId: string;
  membershipNo: string;
  memberName: string;
  senderUserId: string;
  senderName: string;
  senderRole: string;
  direction: 'INBOUND' | 'OUTBOUND';
  channels: NotificationChannel[];
  subject: string;
  content: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ';
  createdAt: string;
}

export interface ProviderGatewayConfig {
  id: string;
  name: string;
  channel: NotificationChannel;
  isActive: boolean;
  isPrimary: boolean;
  priority: number;
  settings: Record<string, any>;
  stats: {
    totalSent: number;
    totalSuccess: number;
    totalFailed: number;
    lastPingAt: string;
    status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  };
}

export interface NotificationStatistics {
  totalDispatched: number;
  deliveredCount: number;
  failedCount: number;
  deliveryRate: number;
  totalSmsUnits: number;
  totalSmsCostETB: number;
  emailSent: number;
  telegramDelivered: number;
  inAppDelivered: number;
  activeTemplatesCount: number;
  totalBroadcasts: number;
  telegramSubscribers: number;
  channelBreakdown: {
    IN_APP: { total: number; delivered: number };
    SMS: { total: number; delivered: number; costETB: number };
    EMAIL: { total: number; delivered: number };
    TELEGRAM: { total: number; delivered: number };
  };
  categoryBreakdown: Record<string, number>;
  recentFailures: NotificationDeliveryLog[];
}
