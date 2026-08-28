import { Request, Response } from 'express';
import { db } from '../db/database';
import { notificationService } from '../services/notificationService';
import { schedulerService } from '../services/schedulerService';
import { providerRegistry } from '../services/notificationProviders/providerRegistry';
import { NotificationChannel } from '../db/schema';

export const notificationController = {
  // ==========================================
  // IN-APP INBOX (AUTHENTICATED USER / MEMBER)
  // ==========================================
  async getMyNotifications(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const category = req.query.category as string | undefined;
      const status = req.query.status as any;
      const search = req.query.search as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const data = notificationService.getMyNotifications(userId, {
        category,
        status,
        search,
        limit,
        offset,
      });

      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch notifications' });
    }
  },

  async markRead(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const notificationId = req.params.id;
      notificationService.markAsRead(userId, notificationId);
      res.json({ success: true, message: 'Notification marked as read' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async markAllRead(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      notificationService.markAllAsRead(userId);
      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async archiveNotification(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const notificationId = req.params.id;
      notificationService.archiveNotification(userId, notificationId);
      res.json({ success: true, message: 'Notification archived' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async deleteNotification(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const notificationId = req.params.id;
      notificationService.deleteNotification(userId, notificationId);
      res.json({ success: true, message: 'Notification deleted' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  // ==========================================
  // USER PREFERENCES & TELEGRAM INTEGRATION
  // ==========================================
  async getPreferences(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const prefs = notificationService.getPreferences(userId);
      res.json(prefs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async updatePreferences(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const prefs = notificationService.updatePreferences(userId, req.body);
      res.json({ success: true, preferences: prefs, message: 'Notification preferences updated successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async generateTelegramToken(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const tokenInfo = notificationService.generateTelegramVerificationToken(userId);
      res.json(tokenInfo);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async verifyTelegramChat(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { token, chatId, username } = req.body;
      if (!token || !chatId) {
        return res.status(400).json({ error: 'Token and Chat ID are required' });
      }

      const result = notificationService.verifyTelegramChat(userId, token, chatId, username);
      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async unlinkTelegram(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const prefs = notificationService.unlinkTelegram(userId);
      res.json({ success: true, preferences: prefs, message: 'Telegram account unlinked successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async testSendTelegram(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const result = await notificationService.publish({
        eventCode: 'ANNOUNCEMENT',
        category: 'GENERAL',
        recipientUserId: userId,
        channels: ['TELEGRAM'],
        customTitle: 'Telegram Bot Test Message',
        customBody: 'This is a live test notification from Wabi SACCO Enterprise Bot. Your channel is active and operational! 🚀',
        isUrgent: true,
      });
      res.json({ success: result.success, message: 'Test message sent to Telegram', details: result });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  // ==========================================
  // TEMPLATES MANAGEMENT (ADMIN / MANAGER)
  // ==========================================
  async getTemplates(req: Request, res: Response) {
    try {
      const category = req.query.category as string | undefined;
      const status = req.query.status as string | undefined;
      const templates = notificationService.getTemplates(category, status);
      res.json(templates);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async getTemplateById(req: Request, res: Response) {
    try {
      const tmpl = notificationService.getTemplateById(req.params.id);
      if (!tmpl) return res.status(404).json({ error: 'Template not found' });
      res.json(tmpl);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async createTemplate(req: Request, res: Response) {
    try {
      const tmpl = notificationService.createTemplate(req.body);
      res.status(201).json(tmpl);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async updateTemplate(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const tmpl = notificationService.updateTemplate(req.params.id, req.body, user?.fullName);
      res.json({ success: true, template: tmpl, message: 'Template updated successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async previewTemplate(req: Request, res: Response) {
    try {
      const preview = notificationService.previewTemplate(req.params.id, req.body?.variables || {});
      res.json(preview);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async testSendTemplate(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const tmpl = notificationService.getTemplateById(req.params.id);
      if (!tmpl) return res.status(404).json({ error: 'Template not found' });

      const targetChannels: NotificationChannel[] = req.body?.channels || ['IN_APP'];
      const targetPhone = req.body?.phoneNumber || user.phoneNumber;
      const targetEmail = req.body?.email || user.email;

      const result = await notificationService.publish({
        eventCode: tmpl.code as any,
        category: tmpl.category,
        recipientUserId: user.id,
        recipientName: user.fullName,
        recipientPhone: targetPhone,
        recipientEmail: targetEmail,
        channels: targetChannels,
        variables: req.body?.variables || {},
        isUrgent: true,
      });

      res.json({ success: result.success, details: result, message: 'Template test dispatch executed' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  // ==========================================
  // DELIVERY LOGS & RETRY
  // ==========================================
  async getDeliveryLogs(req: Request, res: Response) {
    try {
      const channel = req.query.channel as string | undefined;
      const status = req.query.status as string | undefined;
      const category = req.query.category as string | undefined;
      const eventCode = req.query.eventCode as string | undefined;
      const search = req.query.search as string | undefined;
      const recipientUserId = req.query.recipientUserId as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const data = notificationService.getDeliveryLogs({
        channel,
        status,
        category,
        eventCode,
        search,
        recipientUserId,
        limit,
        offset,
      });

      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async getDeliveryLogById(req: Request, res: Response) {
    try {
      const log = notificationService.getDeliveryLogById(req.params.id);
      if (!log) return res.status(404).json({ error: 'Delivery log not found' });
      res.json(log);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async retryDeliveryLog(req: Request, res: Response) {
    try {
      const result = await notificationService.retryDeliveryLog(req.params.id);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async retryAllFailed(req: Request, res: Response) {
    try {
      const channel = req.query.channel as string | undefined;
      const result = await notificationService.retryAllFailed(channel);
      res.json({ success: true, ...result, message: `Bulk retry completed. Retried ${result.retriedCount} messages.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  // ==========================================
  // PROVIDER GATEWAYS MANAGEMENT
  // ==========================================
  async getProviders(req: Request, res: Response) {
    try {
      const configs = providerRegistry.getGatewayConfigs();
      res.json(configs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async updateProvider(req: Request, res: Response) {
    try {
      const updated = providerRegistry.updateGatewayConfig(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Provider configuration not found' });
      res.json({ success: true, provider: updated, message: 'Provider gateway configuration updated' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async testProvider(req: Request, res: Response) {
    try {
      const providerId = req.params.id;
      const config = providerRegistry.getGatewayConfigs().find((c) => c.id === providerId);
      if (!config) return res.status(404).json({ error: 'Provider not found' });

      const user = (req as any).user;
      const provider = providerRegistry.getProvider(providerId);
      if (!provider) return res.status(404).json({ error: 'Provider driver not found' });

      const testResult = await provider.send({
        eventCode: 'ANNOUNCEMENT',
        category: 'SYSTEM',
        title: 'Provider Ping Health Test',
        body: `Ping test from Wabi SACCO gateway manager for ${config.name} at ${new Date().toISOString()}`,
        recipient: {
          name: user?.fullName || 'SACCO Administrator',
          phoneNumber: user?.phoneNumber || '+251911223344',
          email: user?.email || 'admin@wabisacco.et',
          telegramChatId: '12345678',
        },
      });

      if (testResult.success) {
        providerRegistry.recordSuccess(providerId);
      } else {
        providerRegistry.recordFailure(providerId);
      }

      res.json({ success: testResult.success, result: testResult, message: testResult.success ? 'Provider ping test passed!' : `Provider test error: ${testResult.error}` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  // ==========================================
  // BROADCASTS & CAMPAIGNS (ADMIN / MANAGER)
  // ==========================================
  async getBroadcasts(req: Request, res: Response) {
    try {
      const list = notificationService.getBroadcasts();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async getBroadcastById(req: Request, res: Response) {
    try {
      const bcast = notificationService.getBroadcastById(req.params.id);
      if (!bcast) return res.status(404).json({ error: 'Broadcast not found' });
      res.json(bcast);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async createBroadcast(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const bcast = notificationService.createBroadcast(req.body, user);
      res.status(201).json({ success: true, broadcast: bcast, message: 'Broadcast campaign created successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async cancelBroadcast(req: Request, res: Response) {
    try {
      const bcast = notificationService.cancelBroadcast(req.params.id);
      res.json({ success: true, broadcast: bcast, message: 'Broadcast cancelled' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async runBroadcastNow(req: Request, res: Response) {
    try {
      const bcast = await notificationService.executeBroadcast(req.params.id);
      res.json({ success: true, broadcast: bcast, message: 'Broadcast execution completed' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  // ==========================================
  // DIRECT CUSTOMER SERVICE MESSAGING
  // ==========================================
  async sendDirectMessage(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { memberId, subject, content, channels } = req.body;
      if (!memberId || !content) {
        return res.status(400).json({ error: 'Member ID and content are required' });
      }

      const msg = await notificationService.sendDirectMessage(
        user,
        memberId,
        subject || 'Message from Wabi SACCO Customer Service',
        content,
        channels || ['IN_APP', 'SMS']
      );

      res.status(201).json({ success: true, message: msg });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async getCommunicationHistory(req: Request, res: Response) {
    try {
      const memberId = req.params.memberId;
      const history = notificationService.getCommunicationHistory(memberId);
      res.json(history);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async getAllCommunicationMessages(req: Request, res: Response) {
    try {
      const user = req.user;
      if (user && user.role === 'MEMBER') {
        const member = db.getMemberByUserId(user.id);
        if (!member) {
          res.json([]);
          return;
        }
        const list = notificationService.getCommunicationHistory(member.id);
        res.json(list || []);
        return;
      }
      const list = notificationService.getAllCommunicationMessages();
      res.json(list || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  // ==========================================
  // SCHEDULER & AUTOMATED REMINDERS
  // ==========================================
  async runSchedulerReminders(req: Request, res: Response) {
    try {
      const result = await schedulerService.runAllAutomatedReminders();
      res.json({ success: true, result, message: 'Automated reminder run completed successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async getSchedulerStatus(req: Request, res: Response) {
    try {
      const nextRunTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      res.json({
        status: 'ACTIVE',
        cronActive: true,
        lastRunAt: new Date().toISOString(),
        nextRunAt: nextRunTime,
        jobs: [
          { name: 'Monthly Regular Saving Reminder', frequency: 'MONTHLY (25th of month)', status: 'SCHEDULED' },
          { name: 'Loan Due Installment Reminders', frequency: 'DAILY at 08:00 AM', status: 'SCHEDULED' },
          { name: 'Overdue Loan Payment Alert', frequency: 'DAILY at 09:00 AM', status: 'SCHEDULED' },
          { name: 'Broadcast Campaign Dispatcher', frequency: 'EVERY 5 MINUTES', status: 'RUNNING' },
        ],
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  // ==========================================
  // STATISTICS & REPORTS
  // ==========================================
  async getStatistics(req: Request, res: Response) {
    try {
      const stats = notificationService.getStatistics();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async getReport(req: Request, res: Response) {
    try {
      const reportType = req.params.reportType;
      const filters = req.query;
      const report = notificationService.generateReport(reportType, filters);
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async exportReport(req: Request, res: Response) {
    try {
      const reportType = req.params.reportType;
      const report = notificationService.generateReport(reportType, req.query);

      if (!report.records || report.records.length === 0) {
        return res.status(200).send('No records found for the selected report filters.');
      }

      const headers = Object.keys(report.records[0]);
      const csvRows = [
        `# ${report.reportType} - Generated: ${report.generatedAt}`,
        headers.join(','),
        ...report.records.map((r: any) =>
          headers
            .map((h) => {
              const val = r[h] !== undefined && r[h] !== null ? String(r[h]).replace(/"/g, '""') : '';
              return `"${val}"`;
            })
            .join(',')
        ),
      ];

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType.toLowerCase()}_${Date.now()}.csv"`);
      res.send(csvRows.join('\n'));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },
};
