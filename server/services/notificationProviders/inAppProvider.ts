import { INotificationProvider, DispatchMessage, ProviderSendResult } from './types';
import { db } from '../../db/database';
import { DbNotification } from '../../db/schema';

export class InAppNotificationProvider implements INotificationProvider {
  public channel = 'IN_APP' as const;
  public id = 'wabi-in-app';
  public name = 'Wabi SACCO In-App Notification Center';

  public isAvailable(): boolean {
    return true;
  }

  public async send(message: DispatchMessage): Promise<ProviderSendResult> {
    const userId = message.recipient.userId;
    if (!userId && !message.recipient.memberId) {
      return {
        success: false,
        channel: 'IN_APP',
        providerId: this.id,
        error: 'In-app notification requires either a target userId or memberId',
      };
    }

    let type: DbNotification['type'] = 'INFO';
    if (message.category === 'SYSTEM' || message.eventCode.includes('ALERT') || message.eventCode.includes('LATE') || message.eventCode.includes('REJECTED')) {
      type = message.eventCode.includes('LATE') || message.eventCode.includes('FAILED') ? 'WARNING' : 'INFO';
    } else if (message.eventCode.includes('APPROVED') || message.eventCode.includes('SUCCESS') || message.eventCode.includes('DISBURSED') || message.eventCode.includes('COMPLETED')) {
      type = 'SUCCESS';
    }

    const notif: DbNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: userId || 'ALL',
      recipientId: userId || message.recipient.memberId,
      memberId: message.recipient.memberId,
      title: message.title,
      message: message.body,
      type,
      eventType: message.eventCode,
      category: message.category,
      channel: 'IN_APP',
      isRead: false,
      isArchived: false,
      isDeleted: false,
      readAt: null,
      metadata: message.metadata,
      createdAt: new Date().toISOString(),
    };

    db.createNotification(notif);

    return {
      success: true,
      channel: 'IN_APP',
      providerId: this.id,
      providerMessageId: notif.id,
      units: 1,
      cost: 0.0,
    };
  }
}
