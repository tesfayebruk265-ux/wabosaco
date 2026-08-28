import { NotificationChannel, NotificationCategory, NotificationEventCode } from '../../db/schema';

export interface DispatchRecipient {
  userId?: string;
  memberId?: string;
  name: string;
  phoneNumber?: string;
  email?: string;
  telegramChatId?: string;
  telegramUsername?: string;
}

export interface DispatchMessage {
  eventCode: NotificationEventCode;
  category: NotificationCategory;
  title: string;
  subject?: string;
  body: string;
  htmlBody?: string;
  metadata?: Record<string, any>;
  recipient: DispatchRecipient;
}

export interface ProviderSendResult {
  success: boolean;
  channel: NotificationChannel;
  providerId: string;
  providerMessageId?: string;
  error?: string;
  cost?: number;
  units?: number;
}

export interface INotificationProvider {
  channel: NotificationChannel;
  id: string;
  name: string;
  isAvailable(): boolean;
  send(message: DispatchMessage): Promise<ProviderSendResult>;
}
