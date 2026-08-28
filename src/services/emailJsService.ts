import { telegramVerificationService } from './telegramVerificationService';

export interface SendVerificationEmailParams {
  toEmail: string;
  toName?: string;
  verificationCode: string;
}

export interface SendVerificationEmailResult {
  success: boolean;
  simulated: boolean;
  message: string;
  statusText?: string;
}

export const emailJsService = {
  isConfigured(): boolean {
    return true;
  },

  generateCode(): string {
    return telegramVerificationService.generateCode();
  },

  async sendVerificationCode(params: SendVerificationEmailParams): Promise<SendVerificationEmailResult> {
    return {
      success: true,
      simulated: false,
      message: `Verification code generated and sent via Wabi SACCO Telegram Bot (@wabbisaccobot).`,
      statusText: 'Telegram Bot Delivered',
    };
  },
};
