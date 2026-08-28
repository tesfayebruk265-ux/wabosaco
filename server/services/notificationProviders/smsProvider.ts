import { INotificationProvider, DispatchMessage, ProviderSendResult } from './types';

export class EthioTelecomSMSProvider implements INotificationProvider {
  public channel = 'SMS' as const;
  public id = 'ethio-telecom';
  public name = 'Ethio Telecom Enterprise SMS Gateway';

  public isAvailable(): boolean {
    return true;
  }

  public async send(message: DispatchMessage): Promise<ProviderSendResult> {
    const phone = message.recipient.phoneNumber;
    if (!phone || phone.trim() === '') {
      return {
        success: false,
        channel: 'SMS',
        providerId: this.id,
        error: 'Recipient has no registered mobile phone number',
      };
    }

    // Basic Ethiopian / International number format validation
    const cleaned = phone.replace(/[\s-]/g, '');
    const isValidPhone = /^(\+?251|0)?9\d{8}$/.test(cleaned) || /^\+\d{9,15}$/.test(cleaned);
    if (!isValidPhone) {
      return {
        success: false,
        channel: 'SMS',
        providerId: this.id,
        error: `Invalid phone number format: ${phone}`,
      };
    }

    // Calculate SMS units (160 GSM chars per segment)
    const len = message.body.length;
    const units = Math.max(1, Math.ceil(len / 160));
    const msgId = `ETH-SMS-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      success: true,
      channel: 'SMS',
      providerId: this.id,
      providerMessageId: msgId,
      units,
      cost: units * 0.35, // ETB 0.35 per segment
    };
  }
}

export class TwilioSMSProvider implements INotificationProvider {
  public channel = 'SMS' as const;
  public id = 'twilio-sms';
  public name = 'Twilio SMS Gateway';

  public isAvailable(): boolean {
    return true;
  }

  public async send(message: DispatchMessage): Promise<ProviderSendResult> {
    const phone = message.recipient.phoneNumber;
    if (!phone) {
      return {
        success: false,
        channel: 'SMS',
        providerId: this.id,
        error: 'Missing phone number',
      };
    }

    const msgId = `SM${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    return {
      success: true,
      channel: 'SMS',
      providerId: this.id,
      providerMessageId: msgId,
      units: 1,
      cost: 0.05,
    };
  }
}
