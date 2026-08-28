import { NotificationChannel } from '../../db/schema';
import { INotificationProvider } from './types';
import { EthioTelecomSMSProvider, TwilioSMSProvider } from './smsProvider';
import { WabiSmtpEmailProvider, SendGridEmailProvider } from './emailProvider';
import { TelegramBotProvider } from './telegramProvider';
import { InAppNotificationProvider } from './inAppProvider';

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

class ProviderRegistry {
  private providers: Map<string, INotificationProvider> = new Map();
  private gatewayConfigs: Map<string, ProviderGatewayConfig> = new Map();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults() {
    // SMS Providers
    const ethioSms = new EthioTelecomSMSProvider();
    const twilioSms = new TwilioSMSProvider();
    this.register(ethioSms, {
      id: ethioSms.id,
      name: ethioSms.name,
      channel: 'SMS',
      isActive: true,
      isPrimary: true,
      priority: 1,
      settings: {
        senderId: 'WABI-SACCO',
        endpoint: 'https://sms.ethiotelecom.et/api/v2/send',
        rateLimitPerSec: 100,
        unitCostETB: 0.35,
      },
      stats: {
        totalSent: 1420,
        totalSuccess: 1398,
        totalFailed: 22,
        lastPingAt: new Date().toISOString(),
        status: 'ONLINE',
      },
    });

    this.register(twilioSms, {
      id: twilioSms.id,
      name: twilioSms.name,
      channel: 'SMS',
      isActive: true,
      isPrimary: false,
      priority: 2,
      settings: {
        accountSid: 'AC_wabi_sacco_twilio_backup',
        fromNumber: '+12025550199',
        unitCostUSD: 0.05,
      },
      stats: {
        totalSent: 120,
        totalSuccess: 118,
        totalFailed: 2,
        lastPingAt: new Date().toISOString(),
        status: 'ONLINE',
      },
    });

    // Email Providers
    const smtp = new WabiSmtpEmailProvider();
    const sendgrid = new SendGridEmailProvider();
    this.register(smtp, {
      id: smtp.id,
      name: smtp.name,
      channel: 'EMAIL',
      isActive: true,
      isPrimary: true,
      priority: 1,
      settings: {
        host: 'mail.wabisacco.et',
        port: 587,
        secure: true,
        fromEmail: 'notifications@wabisacco.et',
        fromName: 'Wabi SACCO Enterprise Notifications',
      },
      stats: {
        totalSent: 3450,
        totalSuccess: 3421,
        totalFailed: 29,
        lastPingAt: new Date().toISOString(),
        status: 'ONLINE',
      },
    });

    this.register(sendgrid, {
      id: sendgrid.id,
      name: sendgrid.name,
      channel: 'EMAIL',
      isActive: true,
      isPrimary: false,
      priority: 2,
      settings: {
        fromEmail: 'alerts@wabisacco.et',
      },
      stats: {
        totalSent: 45,
        totalSuccess: 45,
        totalFailed: 0,
        lastPingAt: new Date().toISOString(),
        status: 'ONLINE',
      },
    });

    // Telegram Bot Provider
    const telegram = new TelegramBotProvider();
    this.register(telegram, {
      id: telegram.id,
      name: telegram.name,
      channel: 'TELEGRAM',
      isActive: true,
      isPrimary: true,
      priority: 1,
      settings: {
        botUsername: '@WabiSaccoAlertsBot',
        webhookUrl: 'https://api.wabisacco.et/api/notifications/telegram/webhook',
      },
      stats: {
        totalSent: 890,
        totalSuccess: 885,
        totalFailed: 5,
        lastPingAt: new Date().toISOString(),
        status: 'ONLINE',
      },
    });

    // In-App Provider
    const inApp = new InAppNotificationProvider();
    this.register(inApp, {
      id: inApp.id,
      name: inApp.name,
      channel: 'IN_APP',
      isActive: true,
      isPrimary: true,
      priority: 1,
      settings: {
        storageDriver: 'JSON_DB_PERSISTENT',
      },
      stats: {
        totalSent: 5600,
        totalSuccess: 5600,
        totalFailed: 0,
        lastPingAt: new Date().toISOString(),
        status: 'ONLINE',
      },
    });
  }

  public register(provider: INotificationProvider, config: ProviderGatewayConfig) {
    this.providers.set(provider.id, provider);
    this.gatewayConfigs.set(provider.id, config);
  }

  public getProvider(id: string): INotificationProvider | undefined {
    return this.providers.get(id);
  }

  public getPrimaryProvider(channel: NotificationChannel): INotificationProvider | undefined {
    // Find active primary provider for channel
    const configs = Array.from(this.gatewayConfigs.values())
      .filter((c) => c.channel === channel && c.isActive)
      .sort((a, b) => (a.isPrimary ? -1 : 1) || a.priority - b.priority);

    if (configs.length === 0) return undefined;
    return this.providers.get(configs[0].id);
  }

  public getAllProvidersForChannel(channel: NotificationChannel): INotificationProvider[] {
    const configs = Array.from(this.gatewayConfigs.values())
      .filter((c) => c.channel === channel && c.isActive)
      .sort((a, b) => a.priority - b.priority);

    return configs.map((c) => this.providers.get(c.id)!).filter(Boolean);
  }

  public getGatewayConfigs(): ProviderGatewayConfig[] {
    return Array.from(this.gatewayConfigs.values());
  }

  public updateGatewayConfig(id: string, updates: Partial<ProviderGatewayConfig>): ProviderGatewayConfig | undefined {
    const existing = this.gatewayConfigs.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.gatewayConfigs.set(id, updated);
    return updated;
  }

  public recordSuccess(providerId: string) {
    const config = this.gatewayConfigs.get(providerId);
    if (config) {
      config.stats.totalSent += 1;
      config.stats.totalSuccess += 1;
      config.stats.lastPingAt = new Date().toISOString();
      config.stats.status = 'ONLINE';
    }
  }

  public recordFailure(providerId: string) {
    const config = this.gatewayConfigs.get(providerId);
    if (config) {
      config.stats.totalSent += 1;
      config.stats.totalFailed += 1;
      config.stats.lastPingAt = new Date().toISOString();
      if (config.stats.totalFailed / Math.max(1, config.stats.totalSent) > 0.3) {
        config.stats.status = 'DEGRADED';
      }
    }
  }
}

export const providerRegistry = new ProviderRegistry();
