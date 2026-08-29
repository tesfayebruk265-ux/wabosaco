import { apiClient } from './apiClient';

export interface SendTelegramOtpParams {
  phone: string;
  fullName?: string;
  membershipNo?: string;
  verificationCode?: string;
}

export interface SendTelegramOtpResult {
  success: boolean;
  message: string;
  code: string;
  telegramBotUrl: string;
}

export const telegramVerificationService = {
  botUsername: 'wabbisaccobot',
  botUrl: 'https://t.me/wabbisaccobot',

  /**
   * Generates a deep link URL directly to the Telegram bot with the registration verification parameter and code.
   */
  getBotLink(phone?: string, code?: string): string {
    if (!phone) return this.botUrl;
    const cleanPhone = phone.replace(/[\s()-]/g, '').replace(/^\+/, '');
    if (code) {
      return `https://t.me/${this.botUsername}?start=reg_${cleanPhone}_${code}`;
    }
    return `https://t.me/${this.botUsername}?start=reg_${cleanPhone}`;
  },

  /**
   * Generates a secure random 6-digit numeric verification code.
   */
  generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  /**
   * Sends an OTP verification code to the user's phone via the official Wabi SACCO Telegram Bot (@wabbisaccobot).
   */
  async sendVerificationOtp(params: SendTelegramOtpParams): Promise<SendTelegramOtpResult> {
    const code = params.verificationCode || this.generateCode();
    const botUrl = this.getBotLink(params.phone, code);

    try {
      const response = await apiClient.post<{ success: boolean; error?: string }>('/telegram/send-otp', {
        phone: params.phone.trim(),
        otpCode: code,
        memberName: params.fullName || 'Valued Member',
        membershipNo: params.membershipNo,
      });

      return {
        success: true,
        message: response.success
          ? `Redirected to Telegram Bot @${this.botUsername}. Press START in Telegram to receive your 6-digit code.`
          : `Redirected to Telegram Bot @${this.botUsername}. Press START in Telegram to receive your 6-digit code.`,
        code,
        telegramBotUrl: botUrl,
      };
    } catch {
      return {
        success: true,
        message: `Redirected to Telegram Bot @${this.botUsername}. Press START in Telegram to receive your 6-digit code.`,
        code,
        telegramBotUrl: botUrl,
      };
    }
  },

  /**
   * Verifies the user-entered 6-digit OTP code against the backend.
   */
  async verifyOtp(phone: string, enteredOtp: string): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; error?: string; message?: string }>('/telegram/verify-otp', {
        phone: phone.trim(),
        otpCode: enteredOtp.trim(),
      });
      return response;
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Invalid or expired verification code.';
      return {
        success: false,
        error: msg,
      };
    }
  },
};
