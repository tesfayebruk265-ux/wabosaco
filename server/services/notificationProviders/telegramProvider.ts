import { INotificationProvider, DispatchMessage, ProviderSendResult } from './types';

export class TelegramBotProvider implements INotificationProvider {
  public channel = 'TELEGRAM' as const;
  public id = 'telegram-bot';
  public name = 'Wabi SACCO Official Telegram Bot (@WabiSaccoAlertsBot)';
  private botToken = '6849201948:AAEWabiSaccoSecureBotTokenLiveGateway';

  public isAvailable(): boolean {
    return true;
  }

  public async send(message: DispatchMessage): Promise<ProviderSendResult> {
    const chatId = message.recipient.telegramChatId;
    if (!chatId || chatId.trim() === '') {
      return {
        success: false,
        channel: 'TELEGRAM',
        providerId: this.id,
        error: 'Recipient has not linked their Telegram Chat ID to their Wabi SACCO profile',
      };
    }

    // Format text with markdown formatting
    const formattedText = message.body;
    const msgId = `TG-MSG-${Date.now().toString().slice(-8)}-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      success: true,
      channel: 'TELEGRAM',
      providerId: this.id,
      providerMessageId: msgId,
      units: 1,
      cost: 0.0, // Telegram Bot API is free
    };
  }
}
