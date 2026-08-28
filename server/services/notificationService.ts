import { db } from '../db/database';
import {
  DbNotification,
  DbNotificationTemplate,
  DbNotificationDeliveryLog,
  DbNotificationPreference,
  DbScheduledBroadcast,
  DbCommunicationMessage,
  NotificationChannel,
  NotificationCategory,
  NotificationEventCode,
  DbUser,
  DbMember,
} from '../db/schema';
import { providerRegistry } from './notificationProviders/providerRegistry';
import { DispatchMessage, DispatchRecipient } from './notificationProviders/types';

export interface NotificationPublishPayload {
  eventCode: NotificationEventCode;
  category?: NotificationCategory;
  recipientUserId?: string;
  recipientMemberId?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  recipientName?: string;
  variables?: Record<string, any>;
  channels?: NotificationChannel[]; // Optional override
  metadata?: Record<string, any>;
  isUrgent?: boolean; // Bypasses quiet hours
  customTitle?: string;
  customBody?: string;
}

export interface PublishResult {
  success: boolean;
  eventCode: string;
  inAppNotificationId?: string;
  deliveryLogIds: string[];
  channelsDelivered: NotificationChannel[];
  channelsFailed: NotificationChannel[];
  errors?: string[];
}

export class NotificationService {
  // Recent dispatch cache for de-duplication & spam protection (key -> timestamp)
  private deduplicationCache: Map<string, number> = new Map();

  // =========================================================================
  // 1. CENTRAL EVENT PUBLISHER
  // =========================================================================
  public async publish(payload: NotificationPublishPayload): Promise<PublishResult> {
    const now = new Date().toISOString();
    const result: PublishResult = {
      success: true,
      eventCode: payload.eventCode,
      deliveryLogIds: [],
      channelsDelivered: [],
      channelsFailed: [],
      errors: [],
    };

    // 1. Resolve Recipient Profile & Identifiers
    let user: DbUser | undefined;
    let member: DbMember | undefined;

    if (payload.recipientUserId) {
      user = db.getUserById(payload.recipientUserId);
      if (user?.membershipNo || user?.memberId) {
        member = db.getMemberById(user.memberId || '') || db.getMemberByMembershipNo(user.membershipNo || '');
      }
    } else if (payload.recipientMemberId) {
      member = db.getMemberById(payload.recipientMemberId) || db.getMemberByMembershipNo(payload.recipientMemberId);
      if (member) {
        user = db.getUserById(member.userId || '') || db.findUserByIdentifier(member.membershipNo);
      }
    }

    const recipientName = payload.recipientName || member?.fullName || user?.fullName || 'Valued Member';
    const recipientPhone = payload.recipientPhone || member?.phoneNumber || user?.phoneNumber;
    const recipientEmail = payload.recipientEmail || member?.email || user?.email;
    const userId = user?.id || payload.recipientUserId;
    const memberId = member?.id || payload.recipientMemberId || user?.memberId;

    // 2. Fetch User Notification Preferences
    const prefs: DbNotificationPreference | undefined = userId
      ? db.getNotificationPreferences(userId)
      : undefined;

    const userLang = prefs?.language || 'en';

    // 3. Resolve Active Notification Template
    let template = db.getNotificationTemplateByCode(payload.eventCode);
    if (!template) {
      // Fallback template if specific code not seeded
      template = {
        id: `tmpl_fallback_${payload.eventCode}`,
        code: payload.eventCode,
        name: payload.eventCode.replace(/_/g, ' '),
        category: payload.category || 'GENERAL',
        title: payload.customTitle || `Wabi SACCO Notification: ${payload.eventCode}`,
        subject: `Wabi SACCO - ${payload.customTitle || payload.eventCode}`,
        smsBody: payload.customBody || 'Notice from Wabi SACCO regarding your account. Check your portal for details.',
        emailBody: `<p>${payload.customBody || 'Notice from Wabi SACCO regarding your account.'}</p>`,
        telegramBody: `📢 *Wabi SACCO Alert*\n\n${payload.customBody || 'Account notification.'}`,
        inAppBody: payload.customBody || 'New notice on your SACCO account.',
        variables: [],
        language: 'en',
        status: 'ACTIVE',
        version: 1,
        channels: ['IN_APP', 'SMS', 'EMAIL', 'TELEGRAM'],
        createdAt: now,
        updatedAt: now,
      };
    }

    const category = payload.category || template.category || 'GENERAL';

    // 4. Merge Variables for Interpolation
    const variables: Record<string, any> = {
      organizationName: 'Wabi SACCO',
      memberName: recipientName,
      membershipId: member?.membershipNo || user?.membershipNo || 'WB-PENDING',
      membershipNo: member?.membershipNo || user?.membershipNo || 'WB-PENDING',
      phoneNumber: recipientPhone || 'N/A',
      email: recipientEmail || 'N/A',
      timestamp: new Date().toLocaleString('en-US', { timeZone: 'Africa/Addis_Ababa' }),
      ...payload.variables,
    };

    // 5. Anti-Spam & Deduplication (30 seconds window for exact duplicate event + recipient)
    const dedupeKey = `${userId || recipientPhone || recipientEmail}_${payload.eventCode}_${JSON.stringify(payload.variables || {})}`;
    const lastSentTime = this.deduplicationCache.get(dedupeKey);
    const nowTime = Date.now();
    if (lastSentTime && nowTime - lastSentTime < 25000) {
      console.warn(`[Anti-Spam] Duplicate event skipped: ${dedupeKey}`);
      return {
        success: true,
        eventCode: payload.eventCode,
        deliveryLogIds: [],
        channelsDelivered: [],
        channelsFailed: [],
        errors: ['Skipped duplicate notification within de-bounce window'],
      };
    }
    this.deduplicationCache.set(dedupeKey, nowTime);
    // Cleanup cache periodically
    if (this.deduplicationCache.size > 2000) {
      this.deduplicationCache.clear();
    }

    // 6. Check Quiet Hours (unless urgent or security related)
    const isSecurityOrUrgent =
      payload.isUrgent ||
      category === 'SYSTEM' ||
      payload.eventCode.includes('ALERT') ||
      payload.eventCode.includes('PASSWORD') ||
      payload.eventCode.includes('EMERGENCY');

    const inQuietHours = this.isCurrentlyInQuietHours(prefs);

    // 7. Determine Target Channels based on Template, Preferences, and Overrides
    const candidateChannels = payload.channels || template.channels || ['IN_APP'];
    const channelsToDispatch: NotificationChannel[] = [];

    for (const ch of candidateChannels) {
      // If user has preferences configured, check category and channel toggles
      if (prefs) {
        if (ch === 'IN_APP' && !prefs.channelsEnabled.inApp) continue;
        if (ch === 'SMS' && !prefs.channelsEnabled.sms) continue;
        if (ch === 'EMAIL' && !prefs.channelsEnabled.email) continue;
        if (ch === 'TELEGRAM' && (!prefs.channelsEnabled.telegram || !prefs.telegramChatId || !prefs.telegramVerified)) {
          continue;
        }

        // Category-specific preference check
        const catPref = prefs.categoryPreferences?.[category];
        if (catPref) {
          if (ch === 'IN_APP' && !catPref.inApp) continue;
          if (ch === 'SMS' && !catPref.sms) continue;
          if (ch === 'EMAIL' && !catPref.email) continue;
          if (ch === 'TELEGRAM' && !catPref.telegram) continue;
        }
      }

      // Check quiet hours: skip SMS and Telegram if quiet hours active and not urgent
      if (inQuietHours && !isSecurityOrUrgent && (ch === 'SMS' || ch === 'TELEGRAM')) {
        continue;
      }

      channelsToDispatch.push(ch);
    }

    // Ensure at least IN_APP is always delivered if candidate channels included it
    if (channelsToDispatch.length === 0 && candidateChannels.includes('IN_APP')) {
      channelsToDispatch.push('IN_APP');
    }

    // 8. Render Template Content with Variables
    const renderedTitle = this.interpolate(payload.customTitle || template.title, variables);
    const renderedSubject = this.interpolate(template.subject || template.title, variables);
    const renderedInAppBody = this.interpolate(payload.customBody || template.inAppBody || template.smsBody, variables);
    const renderedSmsBody = this.interpolate(payload.customBody || template.smsBody, variables);
    const renderedEmailBody = this.interpolate(template.emailBody, variables);
    const renderedTelegramBody = this.interpolate(template.telegramBody || template.smsBody, variables);

    const dispatchRecipient: DispatchRecipient = {
      userId,
      memberId,
      name: recipientName,
      phoneNumber: recipientPhone,
      email: recipientEmail,
      telegramChatId: prefs?.telegramChatId,
      telegramUsername: prefs?.telegramUsername,
    };

    // 9. Dispatch to Each Target Channel
    for (const ch of channelsToDispatch) {
      let bodyText = renderedInAppBody;
      let contactStr = 'In-App Inbox';
      if (ch === 'SMS') {
        bodyText = renderedSmsBody;
        contactStr = recipientPhone || 'No Phone';
      } else if (ch === 'EMAIL') {
        bodyText = renderedEmailBody;
        contactStr = recipientEmail || 'No Email';
      } else if (ch === 'TELEGRAM') {
        bodyText = renderedTelegramBody;
        contactStr = prefs?.telegramChatId ? `TG:${prefs.telegramChatId}` : 'Not Linked';
      }

      // Create initial Queued Delivery Log
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const log: DbNotificationDeliveryLog = {
        id: logId,
        recipientUserId: userId,
        recipientMemberId: memberId,
        recipientName,
        recipientContact: contactStr,
        channel: ch,
        eventCode: payload.eventCode,
        category,
        title: renderedTitle,
        message: bodyText,
        status: 'QUEUED',
        retryCount: 0,
        maxRetries: 3,
        queuedAt: now,
        metadata: {
          ...payload.metadata,
          variables,
        },
      };

      db.createDeliveryLog(log);
      result.deliveryLogIds.push(logId);

      // Perform Dispatch
      const provider = providerRegistry.getPrimaryProvider(ch);
      if (!provider || !provider.isAvailable()) {
        log.status = 'FAILED';
        log.lastError = `No available provider for channel: ${ch}`;
        log.failedAt = new Date().toISOString();
        db.updateDeliveryLog(logId, log);
        result.channelsFailed.push(ch);
        result.errors?.push(`Failed to send via ${ch}: No provider available`);
        continue;
      }

      log.providerId = provider.id;
      log.status = 'SENDING';
      db.updateDeliveryLog(logId, log);

      const msg: DispatchMessage = {
        eventCode: payload.eventCode,
        category,
        title: renderedTitle,
        subject: renderedSubject,
        body: bodyText,
        htmlBody: ch === 'EMAIL' ? renderedEmailBody : undefined,
        metadata: payload.metadata,
        recipient: dispatchRecipient,
      };

      try {
        const sendResult = await provider.send(msg);
        const completionTime = new Date().toISOString();

        if (sendResult.success) {
          log.status = 'DELIVERED';
          log.sentAt = completionTime;
          log.deliveredAt = completionTime;
          log.providerMessageId = sendResult.providerMessageId;
          log.lastError = undefined;
          db.updateDeliveryLog(logId, log);
          providerRegistry.recordSuccess(provider.id);

          result.channelsDelivered.push(ch);
          if (ch === 'IN_APP') {
            result.inAppNotificationId = sendResult.providerMessageId;
          }
        } else {
          log.status = 'FAILED';
          log.failedAt = completionTime;
          log.lastError = sendResult.error || 'Provider dispatch failed';
          db.updateDeliveryLog(logId, log);
          providerRegistry.recordFailure(provider.id);

          result.channelsFailed.push(ch);
          result.errors?.push(`Error on ${ch} (${provider.name}): ${sendResult.error}`);
        }
      } catch (err: any) {
        const completionTime = new Date().toISOString();
        log.status = 'FAILED';
        log.failedAt = completionTime;
        log.lastError = err.message || 'Unexpected exception during dispatch';
        db.updateDeliveryLog(logId, log);
        providerRegistry.recordFailure(provider.id);

        result.channelsFailed.push(ch);
        result.errors?.push(`Exception on ${ch}: ${err.message}`);
      }
    }

    if (result.channelsFailed.length > 0 && result.channelsDelivered.length === 0) {
      result.success = false;
    }

    return result;
  }

  // =========================================================================
  // 2. VARIABLE INTERPOLATION & TEMPLATE HELPERS
  // =========================================================================
  public interpolate(text: string, variables: Record<string, any>): string {
    if (!text) return '';
    return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
      if (variables[key] !== undefined && variables[key] !== null) {
        if (typeof variables[key] === 'number') {
          // Format amounts if variable name suggests money
          if (
            key.toLowerCase().includes('amount') ||
            key.toLowerCase().includes('balance') ||
            key.toLowerCase().includes('value')
          ) {
            return variables[key].toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
          }
        }
        return String(variables[key]);
      }
      return match;
    });
  }

  private isCurrentlyInQuietHours(prefs?: DbNotificationPreference): boolean {
    if (!prefs || !prefs.quietHoursEnabled) return false;
    try {
      const now = new Date();
      // Format as HH:MM in Addis Ababa timezone (+3)
      const currentHour = (now.getUTCHours() + 3) % 24;
      const currentMin = now.getUTCMinutes();
      const currentMinutes = currentHour * 60 + currentMin;

      const [startH, startM] = prefs.quietHoursStart.split(':').map(Number);
      const [endH, endM] = prefs.quietHoursEnd.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (startMinutes > endMinutes) {
        // Overnight quiet hours (e.g. 22:00 to 07:00)
        return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
      } else {
        return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
      }
    } catch {
      return false;
    }
  }

  // =========================================================================
  // 3. TEMPLATE MANAGEMENT
  // =========================================================================
  public getTemplates(category?: string, status?: string): DbNotificationTemplate[] {
    let list = db.getNotificationTemplates();
    if (category && category !== 'ALL') {
      list = list.filter((t) => t.category === category);
    }
    if (status && status !== 'ALL') {
      list = list.filter((t) => t.status === status);
    }
    return list;
  }

  public getTemplateById(id: string): DbNotificationTemplate | undefined {
    return db.getNotificationTemplateById(id);
  }

  public getTemplateByCode(code: string): DbNotificationTemplate | undefined {
    return db.getNotificationTemplateByCode(code);
  }

  public createTemplate(data: Omit<DbNotificationTemplate, 'id' | 'createdAt' | 'updatedAt' | 'version'>): DbNotificationTemplate {
    const now = new Date().toISOString();
    const newTmpl: DbNotificationTemplate = {
      ...data,
      id: `tmpl_${Date.now()}`,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    return db.createNotificationTemplate(newTmpl);
  }

  public updateTemplate(id: string, updates: Partial<DbNotificationTemplate>, updatedBy?: string): DbNotificationTemplate {
    const existing = db.getNotificationTemplateById(id);
    if (!existing) throw new Error(`Template with id '${id}' not found`);

    const updated = db.updateNotificationTemplate(id, {
      ...updates,
      version: (existing.version || 1) + 1,
      updatedBy: updatedBy || 'SYSTEM_ADMIN',
    });
    return updated!;
  }

  public previewTemplate(templateId: string, sampleVariables: Record<string, any>) {
    const tmpl = db.getNotificationTemplateById(templateId);
    if (!tmpl) throw new Error('Template not found');

    const defaultSample = {
      organizationName: 'Wabi SACCO Enterprise',
      memberName: 'Almaz Tadesse',
      membershipId: 'WB000042',
      membershipNo: 'WB000042',
      phoneNumber: '+251911445566',
      email: 'almaz.tadesse@example.com',
      loanAmount: 150000,
      paymentAmount: 4850,
      savingBalance: 78500,
      shareBalance: 200,
      shareValue: 200000,
      sharesCount: 50,
      dueDate: '2026-08-30',
      loanNo: 'LN-2026-000018',
      loanType: 'Agricultural Input Loan',
      transactionReference: 'TXN-2026-0816-0921',
      productName: 'Regular Voluntary Savings',
      rejectionReason: 'Credit score below threshold',
      borrowerName: 'Mulugeta Kebede',
      principalBalance: 120000,
      daysOverdue: 5,
      announcementTitle: 'Annual General Assembly 2026',
      announcementBody: 'The 2026 AGM will be held at Skylight Hotel, Addis Ababa on Sept 15, 2026.',
      ...sampleVariables,
    };

    return {
      title: this.interpolate(tmpl.title, defaultSample),
      subject: this.interpolate(tmpl.subject, defaultSample),
      inAppBody: this.interpolate(tmpl.inAppBody || tmpl.smsBody, defaultSample),
      smsBody: this.interpolate(tmpl.smsBody, defaultSample),
      emailBody: this.interpolate(tmpl.emailBody, defaultSample),
      telegramBody: this.interpolate(tmpl.telegramBody || tmpl.smsBody, defaultSample),
      variablesUsed: tmpl.variables,
    };
  }

  // =========================================================================
  // 4. DELIVERY LOGS & RETRY ENGINE
  // =========================================================================
  public getDeliveryLogs(filters?: {
    channel?: string;
    status?: string;
    category?: string;
    eventCode?: string;
    search?: string;
    recipientUserId?: string;
    limit?: number;
    offset?: number;
  }): { logs: DbNotificationDeliveryLog[]; total: number } {
    const all = db.getDeliveryLogs(filters);
    const total = all.length;
    const offset = filters?.offset || 0;
    const limit = filters?.limit || 50;
    return {
      logs: all.slice(offset, offset + limit),
      total,
    };
  }

  public getDeliveryLogById(id: string): DbNotificationDeliveryLog | undefined {
    return (db.getDeliveryLogs() || []).find((l) => l.id === id);
  }

  public async retryDeliveryLog(logId: string): Promise<{ success: boolean; message: string; log?: DbNotificationDeliveryLog }> {
    const log = this.getDeliveryLogById(logId);
    if (!log) throw new Error(`Delivery log '${logId}' not found`);

    const provider = providerRegistry.getPrimaryProvider(log.channel);
    if (!provider) {
      return { success: false, message: `No active provider available for ${log.channel}` };
    }

    log.retryCount = (log.retryCount || 0) + 1;
    log.status = 'SENDING';
    db.updateDeliveryLog(logId, log);

    const recipient: DispatchRecipient = {
      userId: log.recipientUserId,
      memberId: log.recipientMemberId,
      name: log.recipientName,
      phoneNumber: log.recipientContact.startsWith('+') || log.recipientContact.startsWith('09') ? log.recipientContact : undefined,
      email: log.recipientContact.includes('@') ? log.recipientContact : undefined,
      telegramChatId: log.recipientContact.startsWith('TG:') ? log.recipientContact.replace('TG:', '') : undefined,
    };

    const msg: DispatchMessage = {
      eventCode: log.eventCode as NotificationEventCode,
      category: log.category,
      title: log.title,
      subject: log.title,
      body: log.message,
      htmlBody: log.channel === 'EMAIL' ? log.message : undefined,
      recipient,
    };

    const sendRes = await provider.send(msg);
    const now = new Date().toISOString();

    if (sendRes.success) {
      log.status = 'DELIVERED';
      log.deliveredAt = now;
      log.lastError = undefined;
      log.providerMessageId = sendRes.providerMessageId;
      db.updateDeliveryLog(logId, log);
      providerRegistry.recordSuccess(provider.id);
      return { success: true, message: `Message successfully redelivered via ${provider.name}`, log };
    } else {
      log.status = 'FAILED';
      log.failedAt = now;
      log.lastError = `Retry ${log.retryCount} failed: ${sendRes.error}`;
      db.updateDeliveryLog(logId, log);
      providerRegistry.recordFailure(provider.id);
      return { success: false, message: `Redelivery failed: ${sendRes.error}`, log };
    }
  }

  public async retryAllFailed(channel?: string): Promise<{ retriedCount: number; successCount: number; failCount: number }> {
    let failedLogs = db.getDeliveryLogs({ status: 'FAILED' });
    if (channel && channel !== 'ALL') {
      failedLogs = failedLogs.filter((l) => l.channel === channel);
    }

    let successCount = 0;
    let failCount = 0;

    for (const log of failedLogs) {
      const res = await this.retryDeliveryLog(log.id);
      if (res.success) successCount++;
      else failCount++;
    }

    return { retriedCount: failedLogs.length, successCount, failCount };
  }

  // =========================================================================
  // 5. IN-APP NOTIFICATION INBOX (MEMBER & STAFF)
  // =========================================================================
  public getMyNotifications(
    userId: string,
    filters?: {
      category?: string;
      status?: 'ALL' | 'UNREAD' | 'READ' | 'ARCHIVED';
      search?: string;
      limit?: number;
      offset?: number;
    }
  ): { notifications: DbNotification[]; total: number; unreadCount: number } {
    let all = db.getNotifications(userId).filter((n) => !n.isDeleted);
    const unreadCount = all.filter((n) => !n.isRead && !n.isArchived).length;

    if (filters?.status === 'UNREAD') {
      all = all.filter((n) => !n.isRead && !n.isArchived);
    } else if (filters?.status === 'READ') {
      all = all.filter((n) => n.isRead && !n.isArchived);
    } else if (filters?.status === 'ARCHIVED') {
      all = all.filter((n) => n.isArchived);
    } else {
      // Default ALL shows non-archived unless specifically filtered
      all = all.filter((n) => !n.isArchived);
    }

    if (filters?.category && filters.category !== 'ALL') {
      all = all.filter((n) => n.category === filters.category);
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      all = all.filter(
        (n) => n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q)
      );
    }

    const total = all.length;
    const offset = filters?.offset || 0;
    const limit = filters?.limit || 30;

    return {
      notifications: all.slice(offset, offset + limit),
      total,
      unreadCount,
    };
  }

  public markAsRead(userId: string, notificationId: string): void {
    db.markNotificationsRead(userId, notificationId);
  }

  public markAllAsRead(userId: string): void {
    db.markNotificationsRead(userId);
  }

  public archiveNotification(userId: string, notificationId: string): void {
    db.updateNotification(notificationId, { isArchived: true });
  }

  public deleteNotification(userId: string, notificationId: string): void {
    db.updateNotification(notificationId, { isDeleted: true });
  }

  // =========================================================================
  // 6. USER PREFERENCES & TELEGRAM INTEGRATION
  // =========================================================================
  public getPreferences(userId: string): DbNotificationPreference {
    return db.getNotificationPreferences(userId)!;
  }

  public updatePreferences(userId: string, updates: Partial<DbNotificationPreference>): DbNotificationPreference {
    const existing = db.getNotificationPreferences(userId)!;
    const merged: DbNotificationPreference = {
      ...existing,
      ...updates,
      userId,
      channelsEnabled: {
        ...existing.channelsEnabled,
        ...(updates.channelsEnabled || {}),
      },
      categoryPreferences: {
        ...existing.categoryPreferences,
        ...(updates.categoryPreferences || {}),
      },
      updatedAt: new Date().toISOString(),
    };
    return db.saveNotificationPreferences(merged);
  }

  public generateTelegramVerificationToken(userId: string): {
    token: string;
    botUsername: string;
    deepLink: string;
    expiresAt: string;
  } {
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

    const prefs = db.getNotificationPreferences(userId)!;
    prefs.telegramVerificationToken = token;
    prefs.telegramVerificationExpiresAt = expiresAt;
    db.saveNotificationPreferences(prefs);

    const botUsername = 'WabiSaccoAlertsBot';
    const deepLink = `https://t.me/${botUsername}?start=${token}`;

    return { token, botUsername, deepLink, expiresAt };
  }

  public verifyTelegramChat(
    userId: string,
    token: string,
    chatId: string,
    username?: string
  ): { success: boolean; message: string; preferences?: DbNotificationPreference } {
    const prefs = db.getNotificationPreferences(userId);
    if (!prefs) return { success: false, message: 'Preferences not found' };

    if (!prefs.telegramVerificationToken || prefs.telegramVerificationToken !== token.trim()) {
      return { success: false, message: 'Invalid or expired verification token. Please generate a new link code.' };
    }

    if (prefs.telegramVerificationExpiresAt && new Date(prefs.telegramVerificationExpiresAt) < new Date()) {
      return { success: false, message: 'Verification token has expired. Please generate a new code.' };
    }

    prefs.telegramChatId = chatId.trim();
    prefs.telegramUsername = username ? (username.startsWith('@') ? username : `@${username}`) : undefined;
    prefs.telegramVerified = true;
    prefs.channelsEnabled.telegram = true;
    prefs.telegramVerificationToken = undefined;
    prefs.telegramVerificationExpiresAt = undefined;
    prefs.updatedAt = new Date().toISOString();

    db.saveNotificationPreferences(prefs);

    // Send immediate confirmation on Telegram
    this.publish({
      eventCode: 'ANNOUNCEMENT',
      recipientUserId: userId,
      channels: ['TELEGRAM', 'IN_APP'],
      customTitle: 'Telegram Bot Linked Successfully',
      customBody: `Welcome to Wabi SACCO Telegram Notifications! Your chat is securely verified. You will receive real-time balance alerts, transaction receipts, and payment reminders.`,
      isUrgent: true,
    });

    return {
      success: true,
      message: 'Telegram account verified and linked successfully!',
      preferences: prefs,
    };
  }

  public unlinkTelegram(userId: string): DbNotificationPreference {
    const prefs = db.getNotificationPreferences(userId)!;
    prefs.telegramChatId = undefined;
    prefs.telegramUsername = undefined;
    prefs.telegramVerified = false;
    prefs.channelsEnabled.telegram = false;
    prefs.updatedAt = new Date().toISOString();
    return db.saveNotificationPreferences(prefs);
  }

  // =========================================================================
  // 7. BROADCASTS & CAMPAIGN ENGINE
  // =========================================================================
  public getBroadcasts(): DbScheduledBroadcast[] {
    return db.getScheduledBroadcasts();
  }

  public getBroadcastById(id: string): DbScheduledBroadcast | undefined {
    return db.getScheduledBroadcastById(id);
  }

  public createBroadcast(
    data: Omit<
      DbScheduledBroadcast,
      'id' | 'broadcastNo' | 'status' | 'sentCount' | 'successCount' | 'failureCount' | 'createdAt'
    >,
    creatorUser: DbUser
  ): DbScheduledBroadcast {
    const now = new Date().toISOString();
    const broadcastNo = db.getNextBroadcastNo();

    // Resolve target audience count
    const recipients = this.resolveBroadcastRecipients(data.targetAudience, data.customRecipientIds);

    const broadcast: DbScheduledBroadcast = {
      ...data,
      id: `bcast_${Date.now()}`,
      broadcastNo,
      totalRecipients: recipients.length,
      sentCount: 0,
      successCount: 0,
      failureCount: 0,
      status: data.scheduleType === 'IMMEDIATE' ? 'RUNNING' : 'PENDING',
      createdBy: creatorUser.id,
      createdByName: creatorUser.fullName,
      createdAt: now,
    };

    db.createScheduledBroadcast(broadcast);

    if (data.scheduleType === 'IMMEDIATE') {
      // Execute immediately in background
      this.executeBroadcast(broadcast.id);
    }

    return broadcast;
  }

  public async executeBroadcast(broadcastId: string): Promise<DbScheduledBroadcast> {
    const bcast = db.getScheduledBroadcastById(broadcastId);
    if (!bcast) throw new Error(`Broadcast '${broadcastId}' not found`);

    bcast.status = 'RUNNING';
    db.updateScheduledBroadcast(bcast.id, bcast);

    const recipients = this.resolveBroadcastRecipients(bcast.targetAudience, bcast.customRecipientIds);
    let successCount = 0;
    let failCount = 0;

    for (const rec of recipients) {
      try {
        const categoryMap: Record<string, NotificationCategory> = {
          EMERGENCY: 'SYSTEM',
          POLICY: 'SYSTEM',
          MARKETING: 'MARKETING',
          ANNOUNCEMENT: 'GENERAL',
        };
        const mappedCat = categoryMap[bcast.category as string] || 'GENERAL';

        const res = await this.publish({
          eventCode: (bcast.category as string) === 'EMERGENCY' ? 'EMERGENCY_NOTICE' : 'ANNOUNCEMENT',
          category: mappedCat,
          recipientUserId: rec.userId,
          recipientMemberId: rec.memberId,
          recipientName: rec.fullName,
          recipientPhone: rec.phoneNumber,
          recipientEmail: rec.email,
          channels: bcast.channels,
          customTitle: bcast.title,
          customBody: bcast.inAppMessage || bcast.smsMessage,
          isUrgent: (bcast.category as string) === 'EMERGENCY',
          variables: {
            announcementTitle: bcast.title,
            announcementBody: bcast.inAppMessage,
          },
          metadata: {
            broadcastId: bcast.id,
            broadcastNo: bcast.broadcastNo,
          },
        });

        if (res.success) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }

    bcast.sentCount = recipients.length;
    bcast.successCount = successCount;
    bcast.failureCount = failCount;
    bcast.status = 'COMPLETED';
    bcast.executedAt = new Date().toISOString();

    db.updateScheduledBroadcast(bcast.id, bcast);
    return bcast;
  }

  public cancelBroadcast(id: string): DbScheduledBroadcast {
    const bcast = db.getScheduledBroadcastById(id);
    if (!bcast) throw new Error('Broadcast not found');
    if (bcast.status === 'COMPLETED') throw new Error('Cannot cancel already completed broadcast');
    bcast.status = 'CANCELLED';
    db.updateScheduledBroadcast(id, bcast);
    return bcast;
  }

  public resolveBroadcastRecipients(
    audience: DbScheduledBroadcast['targetAudience'],
    customIds?: string[]
  ): Array<{ userId?: string; memberId?: string; fullName: string; phoneNumber?: string; email?: string }> {
    const members = db.getMembers();
    const users = db.getUsers();

    if (audience === 'ALL_MEMBERS') {
      return members.map((m) => ({
        userId: m.userId,
        memberId: m.id,
        fullName: m.fullName,
        phoneNumber: m.phoneNumber,
        email: m.email,
      }));
    }

    if (audience === 'ACTIVE_MEMBERS') {
      return members
        .filter((m) => m.status === 'ACTIVE')
        .map((m) => ({
          userId: m.userId,
          memberId: m.id,
          fullName: m.fullName,
          phoneNumber: m.phoneNumber,
          email: m.email,
        }));
    }

    if (audience === 'BORROWERS_WITH_ACTIVE_LOANS') {
      const activeLoans = db.getLoans().filter((l) => l.status === 'ACTIVE' || l.status === 'DISBURSED');
      const memberIds = new Set(activeLoans.map((l) => l.memberId));
      return members
        .filter((m) => memberIds.has(m.id) || memberIds.has(m.membershipNo))
        .map((m) => ({
          userId: m.userId,
          memberId: m.id,
          fullName: m.fullName,
          phoneNumber: m.phoneNumber,
          email: m.email,
        }));
    }

    if (audience === 'SAVERS_REGULAR') {
      const regularAccounts = db.getSavingAccounts().filter((a) => a.productCode === 'REGULAR' && a.status === 'ACTIVE');
      const memberIds = new Set(regularAccounts.map((a) => a.memberId));
      return members
        .filter((m) => memberIds.has(m.id) || memberIds.has(m.membershipNo))
        .map((m) => ({
          userId: m.userId,
          memberId: m.id,
          fullName: m.fullName,
          phoneNumber: m.phoneNumber,
          email: m.email,
        }));
    }

    if (audience === 'MEMBERS_PENDING_KYC') {
      return members
        .filter((m) => m.status === 'PENDING' || !m.nationalId)
        .map((m) => ({
          userId: m.userId,
          memberId: m.id,
          fullName: m.fullName,
          phoneNumber: m.phoneNumber,
          email: m.email,
        }));
    }

    if (audience === 'STAFF_ALL') {
      return users
        .filter((u) => u.role !== 'MEMBER' && u.isActive)
        .map((u) => ({
          userId: u.id,
          fullName: u.fullName,
          phoneNumber: u.phoneNumber,
          email: u.email,
        }));
    }

    if (audience === 'CUSTOM_SELECTION' && customIds && customIds.length > 0) {
      const idSet = new Set(customIds);
      return members
        .filter((m) => idSet.has(m.id) || idSet.has(m.membershipNo) || (m.userId && idSet.has(m.userId)))
        .map((m) => ({
          userId: m.userId,
          memberId: m.id,
          fullName: m.fullName,
          phoneNumber: m.phoneNumber,
          email: m.email,
        }));
    }

    return members.slice(0, 10).map((m) => ({
      userId: m.userId,
      memberId: m.id,
      fullName: m.fullName,
      phoneNumber: m.phoneNumber,
      email: m.email,
    }));
  }

  // =========================================================================
  // 8. DIRECT MEMBER MESSAGING & COMMUNICATION HISTORY
  // =========================================================================
  public async sendDirectMessage(
    senderUser: DbUser,
    memberId: string,
    subject: string,
    content: string,
    channels: NotificationChannel[] = ['IN_APP', 'SMS']
  ): Promise<DbCommunicationMessage> {
    const member = db.getMemberById(memberId) || db.getMemberByMembershipNo(memberId);
    if (!member) throw new Error(`Member '${memberId}' not found`);

    const now = new Date().toISOString();
    const commMsg: DbCommunicationMessage = {
      id: `comm_${Date.now()}`,
      memberId: member.id,
      membershipNo: member.membershipNo,
      memberName: member.fullName,
      senderUserId: senderUser.id,
      senderName: senderUser.fullName,
      senderRole: senderUser.role,
      direction: 'OUTBOUND',
      channels,
      subject,
      content,
      status: 'DELIVERED',
      createdAt: now,
    };

    db.createCommunicationMessage(commMsg);

    // Publish event
    await this.publish({
      eventCode: 'DIRECT_MESSAGE',
      category: 'GENERAL',
      recipientUserId: member.userId,
      recipientMemberId: member.id,
      recipientName: member.fullName,
      recipientPhone: member.phoneNumber,
      recipientEmail: member.email,
      channels,
      customTitle: subject,
      customBody: content,
      isUrgent: true,
      metadata: {
        senderRole: senderUser.role,
        senderName: senderUser.fullName,
        messageId: commMsg.id,
      },
    });

    return commMsg;
  }

  public getCommunicationHistory(memberId: string): DbCommunicationMessage[] {
    return db.getCommunicationMessages(memberId);
  }

  public getAllCommunicationMessages(): DbCommunicationMessage[] {
    return db.getCommunicationMessages();
  }

  // =========================================================================
  // 9. STATISTICS & ENTERPRISE ANALYTICS
  // =========================================================================
  public getStatistics() {
    const logs = db.getDeliveryLogs();
    const broadcasts = db.getScheduledBroadcasts();
    const templates = db.getNotificationTemplates();
    const prefs = db.getAllNotificationPreferences();

    const totalLogs = logs.length;
    const deliveredCount = logs.filter((l) => l.status === 'DELIVERED').length;
    const failedCount = logs.filter((l) => l.status === 'FAILED').length;
    const deliveryRate = totalLogs > 0 ? (deliveredCount / totalLogs) * 100 : 99.2;

    const smsLogs = logs.filter((l) => l.channel === 'SMS');
    const smsCount = smsLogs.length;
    const smsCost = smsCount * 0.35; // ETB 0.35 per SMS

    const emailLogs = logs.filter((l) => l.channel === 'EMAIL');
    const emailCount = emailLogs.length;

    const telegramLogs = logs.filter((l) => l.channel === 'TELEGRAM');
    const telegramCount = telegramLogs.length;

    const inAppLogs = logs.filter((l) => l.channel === 'IN_APP');
    const inAppCount = inAppLogs.length;

    // Channel breakdown
    const channelBreakdown = {
      IN_APP: { total: inAppCount, delivered: inAppLogs.filter((l) => l.status === 'DELIVERED').length },
      SMS: { total: smsCount, delivered: smsLogs.filter((l) => l.status === 'DELIVERED').length, costETB: smsCost },
      EMAIL: { total: emailCount, delivered: emailLogs.filter((l) => l.status === 'DELIVERED').length },
      TELEGRAM: { total: telegramCount, delivered: telegramLogs.filter((l) => l.status === 'DELIVERED').length },
    };

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    for (const log of logs) {
      categoryBreakdown[log.category] = (categoryBreakdown[log.category] || 0) + 1;
    }

    // Telegram subscriber count
    const telegramSubscribers = prefs.filter((p) => p.telegramVerified && p.telegramChatId).length;

    return {
      totalDispatched: totalLogs,
      deliveredCount,
      failedCount,
      deliveryRate: Number(deliveryRate.toFixed(2)),
      totalSmsUnits: smsCount,
      totalSmsCostETB: Number(smsCost.toFixed(2)),
      emailSent: emailCount,
      telegramDelivered: telegramCount,
      inAppDelivered: inAppCount,
      activeTemplatesCount: templates.filter((t) => t.status === 'ACTIVE').length,
      totalBroadcasts: broadcasts.length,
      telegramSubscribers,
      channelBreakdown,
      categoryBreakdown,
      recentFailures: logs.filter((l) => l.status === 'FAILED').slice(0, 10),
    };
  }

  public generateReport(reportType: string, filters?: Record<string, any>) {
    const logs = db.getDeliveryLogs(filters);

    if (reportType === 'SMS_DELIVERY_REPORT') {
      const sms = logs.filter((l) => l.channel === 'SMS');
      return {
        reportType: 'SMS Delivery & Billing Audit Report',
        generatedAt: new Date().toISOString(),
        totalSms: sms.length,
        totalCostETB: (sms.length * 0.35).toFixed(2),
        records: sms.map((s) => ({
          logId: s.id,
          date: s.queuedAt,
          recipient: s.recipientName,
          phone: s.recipientContact,
          eventCode: s.eventCode,
          status: s.status,
          provider: s.providerId || 'ethio-telecom',
          messageId: s.providerMessageId,
          error: s.lastError || '-',
          costETB: '0.35',
        })),
      };
    }

    if (reportType === 'EMAIL_DELIVERY_REPORT') {
      const email = logs.filter((l) => l.channel === 'EMAIL');
      return {
        reportType: 'Email Deliverability & Queue Audit Report',
        generatedAt: new Date().toISOString(),
        totalEmails: email.length,
        records: email.map((e) => ({
          logId: e.id,
          date: e.queuedAt,
          recipient: e.recipientName,
          email: e.recipientContact,
          subject: e.title,
          eventCode: e.eventCode,
          status: e.status,
          provider: e.providerId || 'wabi-mail-smtp',
          error: e.lastError || '-',
        })),
      };
    }

    if (reportType === 'TELEGRAM_BOT_REPORT') {
      const tg = logs.filter((l) => l.channel === 'TELEGRAM');
      return {
        reportType: 'Telegram Bot Alert Delivery Report',
        generatedAt: new Date().toISOString(),
        totalMessages: tg.length,
        records: tg.map((t) => ({
          logId: t.id,
          date: t.queuedAt,
          recipient: t.recipientName,
          chatId: t.recipientContact,
          eventCode: t.eventCode,
          status: t.status,
          error: t.lastError || '-',
        })),
      };
    }

    if (reportType === 'BROADCAST_CAMPAIGN_REPORT') {
      const bcasts = db.getScheduledBroadcasts();
      return {
        reportType: 'Broadcast & Campaign Performance Report',
        generatedAt: new Date().toISOString(),
        totalCampaigns: bcasts.length,
        records: bcasts.map((b) => ({
          broadcastNo: b.broadcastNo,
          title: b.title,
          targetAudience: b.targetAudience,
          channels: b.channels.join(', '),
          totalRecipients: b.totalRecipients,
          sentCount: b.sentCount,
          successCount: b.successCount,
          failureCount: b.failureCount,
          status: b.status,
          createdBy: b.createdByName,
          executedAt: b.executedAt || '-',
        })),
      };
    }

    // Default: MASTER DELIVERY REPORT
    return {
      reportType: 'Master Notification & Communication Delivery Report',
      generatedAt: new Date().toISOString(),
      totalRecords: logs.length,
      records: logs.slice(0, 500).map((l) => ({
        id: l.id,
        date: l.queuedAt,
        recipient: l.recipientName,
        contact: l.recipientContact,
        channel: l.channel,
        category: l.category,
        event: l.eventCode,
        title: l.title,
        status: l.status,
        provider: l.providerId || '-',
        retries: l.retryCount,
        error: l.lastError || '-',
      })),
    };
  }
}

export const notificationService = new NotificationService();
