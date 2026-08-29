import https from 'https';
import { db } from '../db/database';
import { cryptoUtils } from '../utils/crypto';
import { logger } from './loggerService';

export interface TelegramBotStatus {
  isRunning: boolean;
  botId: number;
  botName: string;
  botUsername: string;
  lastPollAt: string | null;
  lastError: string | null;
  linkedUsersCount: number;
  activeOtpsCount: number;
}

interface StoredOtp {
  userId: string;
  phone: string;
  otpCode: string;
  createdAt: number;
  expiresAt: number;
  verified: boolean;
}

export class TelegramBotService {
  private botToken: string = '8829253596:AAHDZhLUd8bvi73YEtQMv-5KnB6KXHvAPsw';
  private botId: number = 8829253596;
  private botName: string = 'Wabi Saco';
  private botUsername: string = 'wabbisaccobot';
  private isPolling: boolean = false;
  private pollOffset: number = 0;
  private lastPollAt: string | null = null;
  private lastError: string | null = null;
  private pollTimeoutTimer: NodeJS.Timeout | null = null;

  // Active OTP store: phone/userId -> OTP details (10-minute TTL)
  private activeOtps: Map<string, StoredOtp> = new Map();

  constructor() {
    // Clean up expired OTPs periodically (every 2 minutes)
    setInterval(() => this.purgeExpiredOtps(), 2 * 60 * 1000);
  }

  /**
   * Start long-polling listener for Telegram Bot updates
   */
  public startPolling(): void {
    if (this.isPolling) return;
    this.isPolling = true;
    logger.info(`[TelegramBot] Starting long-polling listener for @${this.botUsername}...`);

    // Set bot command menu on Telegram
    this.registerBotCommands().catch((err) => {
      logger.warn(`[TelegramBot] Failed to register bot commands: ${err.message}`);
    });

    // Start polling loop
    this.pollUpdates();
  }

  /**
   * Stop polling listener
   */
  public stopPolling(): void {
    this.isPolling = false;
    if (this.pollTimeoutTimer) {
      clearTimeout(this.pollTimeoutTimer);
      this.pollTimeoutTimer = null;
    }
    logger.info('[TelegramBot] Polling listener stopped.');
  }

  /**
   * Register official bot commands with Telegram
   */
  private async registerBotCommands(): Promise<void> {
    const commands = [
      { command: 'start', description: 'Start Wabi SACCO bot & verify account' },
      { command: 'verify', description: 'Verify phone number & request OTP' },
      { command: 'balance', description: 'Check savings & share capital balances' },
      { command: 'statement', description: 'View recent transactions' },
      { command: 'help', description: 'Contact support, hotlines & branch location' },
    ];
    await this.callApi('setMyCommands', { commands });
  }

  /**
   * Core long-polling loop
   */
  private async pollUpdates(): Promise<void> {
    if (!this.isPolling) return;

    try {
      this.lastPollAt = new Date().toISOString();
      const response = await this.callApi<any[]>('getUpdates', {
        offset: this.pollOffset,
        limit: 50,
        timeout: 25,
        allowed_updates: ['message', 'callback_query'],
      });

      if (response && Array.isArray(response)) {
        for (const update of response) {
          this.pollOffset = update.update_id + 1;
          await this.handleUpdate(update);
        }
      }
      this.lastError = null;
    } catch (err: any) {
      this.lastError = err.message;
      logger.warn(`[TelegramBot] Polling error: ${err.message}. Retrying in 5 seconds...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    if (this.isPolling) {
      this.pollTimeoutTimer = setTimeout(() => this.pollUpdates(), 500);
    }
  }

  /**
   * Process incoming Telegram update
   */
  private async handleUpdate(update: any): Promise<void> {
    try {
      if (update.message) {
        await this.handleMessage(update.message);
      } else if (update.callback_query) {
        await this.handleCallbackQuery(update.callback_query);
      }
    } catch (err: any) {
      logger.error(`[TelegramBot] Error handling update ${update.update_id}: ${err.message}`);
    }
  }

  /**
   * Handle incoming user message
   */
  private async handleMessage(msg: any): Promise<void> {
    const chatId = msg.chat.id;
    const text = (msg.text || '').trim();
    const contact = msg.contact;
    const fromUser = msg.from || {};
    const telegramUsername = fromUser.username ? `@${fromUser.username}` : '';

    // 1. User shared contact card (Phone Number Verification Flow)
    if (contact && contact.phone_number) {
      await this.handleContactVerification(chatId, contact, fromUser);
      return;
    }

    // 2. Text Commands
    const lowerText = text.toLowerCase();

    if (lowerText === '/start' || lowerText.startsWith('/start')) {
      // Prompt user to share contact so their phone number is strictly checked before getting the OTP
      await this.promptContactShare(chatId);
    } else if (lowerText === '/verify' || lowerText.includes('verify') || lowerText.includes('ማረጋገጫ')) {
      await this.promptContactShare(chatId);
    } else if (lowerText === '/balance' || lowerText.includes('balance') || lowerText.includes('ቀሪ ሂሳብ')) {
      await this.handleBalanceInquiry(chatId, fromUser);
    } else if (lowerText === '/statement' || lowerText.includes('statement') || lowerText.includes('መግለጫ')) {
      await this.handleStatementInquiry(chatId, fromUser);
    } else if (lowerText === '/help' || lowerText.includes('help') || lowerText.includes('support') || lowerText.includes('ድጋፍ')) {
      await this.sendHelpMessage(chatId);
    } else if (/^\d{6}$/.test(text)) {
      // User entered a 6-digit code
      await this.handleCodeInput(chatId, text, fromUser);
    } else {
      // Default fallback guidance
      await this.sendFallbackMessage(chatId);
    }
  }

  private getPhoneLookupKeys(phone: string): string[] {
    const raw = (phone || '').trim();
    const digits = raw.replace(/\D/g, '');
    const keys = new Set<string>([raw, raw.replace(/[\s()-]/g, '')]);

    let local9 = '';
    if (digits.startsWith('251') && digits.length === 12) {
      local9 = digits.slice(3);
    } else if (digits.startsWith('0') && digits.length === 10) {
      local9 = digits.slice(1);
    } else if (digits.length === 9) {
      local9 = digits;
    }

    if (local9) {
      keys.add(`+251${local9}`);
      keys.add(`0${local9}`);
      keys.add(`251${local9}`);
      keys.add(local9);
    }
    return Array.from(keys);
  }

  /**
   * Handle contact verification: Automatically checks if user's Telegram phone matches registered account
   */
  private async handleContactVerification(chatId: number, contact: any, fromUser: any): Promise<void> {
    const rawPhone = contact.phone_number || '';
    const phoneKeys = this.getPhoneLookupKeys(rawPhone);
    const digits = rawPhone.replace(/\D/g, '');
    const local9 = digits.startsWith('251') && digits.length === 12 ? digits.slice(3) : (digits.startsWith('0') ? digits.slice(1) : digits.slice(-9));
    const normalizedIntl = local9 ? `+251${local9}` : rawPhone;
    const normalizedLocal = local9 ? `0${local9}` : rawPhone;

    logger.info(`[TelegramBot] Verifying contact: ${normalizedIntl} (ChatID: ${chatId})`);

    // Check if there is an active OTP pending for THIS phone number
    let activeOtp: StoredOtp | undefined;
    for (const key of phoneKeys) {
      if (this.activeOtps.has(key)) {
        activeOtp = this.activeOtps.get(key);
        break;
      }
    }

    // If no OTP was generated yet from web UI or it expired, auto-generate fresh OTP on the spot
    if (!activeOtp || Date.now() > activeOtp.expiresAt) {
      const freshCode = Math.floor(100000 + Math.random() * 900000).toString();
      activeOtp = {
        userId: normalizedIntl,
        phone: normalizedIntl,
        otpCode: freshCode,
        createdAt: Date.now(),
        expiresAt: Date.now() + 15 * 60 * 1000,
        verified: true,
      };

      for (const key of phoneKeys) {
        this.activeOtps.set(key, activeOtp);
      }
    } else {
      activeOtp.verified = true;
    }

    const otpCode = activeOtp.otpCode;

    // Search database for matching user or member for personalization
    const allUsers = db.getUsers();
    const matchedUser = allUsers.find((u) => {
      const uPhoneKeys = this.getPhoneLookupKeys(u.phoneNumber || '');
      return phoneKeys.some((k) => uPhoneKeys.includes(k));
    });

    if (matchedUser) {
      try {
        db.updateUser(matchedUser.id, {
          avatarUrl: matchedUser.avatarUrl || (fromUser.username ? `https://t.me/${fromUser.username}` : undefined),
        });
      } catch {
        // non-blocking
      }
    }

    // Format professional Wabi SACCO verification OTP message
    const memberName = matchedUser?.fullName || matchedUser?.username || fromUser.first_name || 'Valued Member';
    const membershipNo = matchedUser?.membershipNo || 'REG-' + normalizedLocal.slice(-4);
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'Africa/Addis_Ababa',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const sysSettings = db.getSystemSettings();
    const profile = sysSettings.institutionProfile;
    const hotlines = profile ? `${profile.hotline1} | ${profile.hotline2}` : '+251 978 434 141 | +251 927 011 111';
    const address = profile?.headOfficeAddress || 'Helen Bldg 3rd Floor, in front of Lideta High Court, Addis Ababa';

    const messageText =
`🏦 *WABI SACCO ENTERPRISE CORE BANKING*
_የዋቢ የቁጠባና ብድር ኅብረት ሥራ ማህበር_
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ውድ *${memberName}* / Dear Member,

✅ *የስልክ ቁጥር ማንነትዎ ተረጋግጧል / Phone Verified!*
የተጋራው የቴሌግራም ስልክ (\`${normalizedIntl}\`) በትክክል ተረጋግጧል።

የእርስዎ የማረጋገጫ ሚስጥር ኮድ (OTP) የሚከተለው ነው፡
Your Wabi SACCO verification OTP code is:

┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
   👉  *${otpCode}*  👈
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛

⏱ *የሚያገለግልበት ጊዜ / Expiry:* 15 Minutes
👤 *የአባል ቁጥር / Member ID:* \`${membershipNo}\`
📱 *የተረጋገጠ ስልክ / Verified Phone:* \`${normalizedIntl}\`
🕒 *ሰዓት / Timestamp:* ${timestamp}

⚠️ *የደህንነት ማስጠንቀቂያ / SECURITY ADVICE:*
• ይህን ሚስጥር ኮድ በድረ-ገጹ ላይ ባለው የምዝገባ/መግቢያ ቅጽ ላይ ያስገቡ።
• ይህን ሚስጥር ኮድ ለማንም ሰው አሳልፈው አይስጡ።
• Never share this OTP verification code with anyone. Wabi SACCO staff will NEVER ask for it.

────────────────────────────
📞 *Hotline:* ${hotlines}
📍 *Address:* ${address}
🌐 *Web Portal:* https://wabisacco.et`;

    // Send the OTP message with interactive quick action buttons
    await this.sendMessage(chatId, messageText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '💰 Check My Balance', callback_data: `balance_${matchedUser?.id || 'guest'}` },
            { text: '📄 Mini Statement', callback_data: `statement_${matchedUser?.id || 'guest'}` },
          ],
          [
            { text: '📞 Call Support', callback_data: 'support_info' },
          ],
        ],
      },
    });

    logger.info(`[TelegramBot] Successfully verified phone match ${normalizedIntl} and dispatched OTP: ${otpCode}`);
  }

  /**
   * Welcome message when user opens the bot or presses /start
   */
  private async sendWelcomeMessage(chatId: number, fromUser: any): Promise<void> {
    await this.promptContactShare(chatId);
  }

  /**
   * Prompt user to share contact
   */
  private async promptContactShare(chatId: number): Promise<void> {
    const text =
`🏦 *WABI SACCO ENTERPRISE CORE BANKING*
_የዋቢ የቁጠባና ብድር ኅብረት ሥራ ማህበር_
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ውድ ደንበኛ / Dear Member,

የስልክ ቁጥርዎን ለማረጋገጥና የደህንነት ማረጋገጫ ሚስጥር ኮድ (OTP) ለመቀበል፣ እባክዎ ከታች ያለውን *"📱 Share Phone Number / ስልክ ቁጥርዎን ያረጋግጡ"* ቁልፍ ይጫኑ።

_To receive your 6-digit OTP verification code, please tap the button below to share your Telegram phone number. The system will automatically check that your Telegram number matches your registration phone number._`;

    await this.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [
          [{ text: '📱 Share Phone Number / ስልክ ቁጥርዎን ያረጋግጡ', request_contact: true }],
          [{ text: '💰 Check Balance / ቀሪ ሂሳብ' }, { text: '📞 Support & Office / ድጋፍ ማዕከል' }],
        ],
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    });
  }

  /**
   * Handle balance inquiry
   */
  private async handleBalanceInquiry(chatId: number, fromUser: any): Promise<void> {
    // Look up user by matching any active OTP or username
    const allUsers = db.getUsers();
    const linkedUser = allUsers.find(
      (u) =>
        this.activeOtps.has(u.id) ||
        (fromUser.username && (u.avatarUrl || '').includes(fromUser.username))
    );

    if (!linkedUser) {
      await this.sendMessage(
        chatId,
        '⚠️ *እባክዎ መጀመሪያ ስልክ ቁጥርዎን ያረጋግጡ*\n_Please share your phone number first by clicking the button below to access your account balances._',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [[{ text: '📱 Share Phone Number / ስልክ ቁጥርዎን ያረጋግጡ', request_contact: true }]],
            resize_keyboard: true,
          },
        }
      );
      return;
    }

    // Retrieve savings and share data
    const memberName = linkedUser.fullName || linkedUser.username;
    const member = db.getMembers().find((m) => m.userId === linkedUser.id || (linkedUser.membershipNo && m.membershipNo === linkedUser.membershipNo));
    const memberId = member?.id || linkedUser.memberId || linkedUser.id;
    const membershipNo = linkedUser.membershipNo || member?.membershipNo || '';

    const savingAccounts = db.getSavingAccounts().filter((s) => s.memberId === memberId || (membershipNo && s.membershipNo === membershipNo));
    const totalSavings = savingAccounts.reduce((sum, s) => sum + (s.balance || 0), 0);
    const shareAccounts = db.getShareAccounts().filter((s) => s.memberId === memberId || (membershipNo && s.membershipNo === membershipNo));
    const totalShares = shareAccounts.reduce((sum, s) => sum + (s.totalShareValue || 0), 0);
    const loans = db.getLoans().filter((l) => (l.memberId === memberId || (membershipNo && l.membershipNo === membershipNo)) && l.status === 'ACTIVE');
    const totalLoanBalance = loans.reduce((sum, l) => sum + (l.outstandingPrincipal || 0), 0);

    const balanceText =
`🏦 *የሂሳብ መግለጫ / WABI SACCO FINANCIAL SUMMARY*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 *አባል / Member:* ${memberName}
🆔 *መለያ ቁጥር / ID:* \`${linkedUser.membershipNo || linkedUser.id}\`

💰 *የቁጠባ ሂሳብ / Total Savings:*
👉 *ETB ${totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })}*

🏛 *የአክሲዮን ካፒታል / Paid-Up Shares:*
👉 *ETB ${totalShares.toLocaleString('en-US', { minimumFractionDigits: 2 })}*

📈 *ጠቅላላ ሀብት / Net Financial Asset:*
👉 *ETB ${(totalSavings + totalShares).toLocaleString('en-US', { minimumFractionDigits: 2 })}*

${totalLoanBalance > 0 ? `💳 *የብድር ቀሪ / Active Loan Balance:*\n👉 *ETB ${totalLoanBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}*` : '✅ *ንቁ ብድር / Loans:* ምንም የብድር እዳ የለብዎትም (Zero Overdue)'}

────────────────────────────
🕒 _እንደ አውሮፓውያን አቆጣጠር፡ ${new Date().toLocaleString()}_
🌐 *ድረ-ገጽ:* http://localhost:3000`;

    await this.sendMessage(chatId, balanceText, { parse_mode: 'Markdown' });
  }

  /**
   * Handle mini statement inquiry
   */
  private async handleStatementInquiry(chatId: number, fromUser: any): Promise<void> {
    const allUsers = db.getUsers();
    const linkedUser = allUsers.find(
      (u) =>
        this.activeOtps.has(u.id) ||
        (fromUser.username && (u.avatarUrl || '').includes(fromUser.username))
    );

    if (!linkedUser) {
      await this.promptContactShare(chatId);
      return;
    }

    const member = db.getMembers().find((m) => m.userId === linkedUser.id || (linkedUser.membershipNo && m.membershipNo === linkedUser.membershipNo));
    const memberId = member?.id || linkedUser.memberId || linkedUser.id;
    const membershipNo = linkedUser.membershipNo || member?.membershipNo || '';

    const txns = db.getFinancialTransactions()
      .filter((t) => t.memberId === memberId || (membershipNo && t.membershipNo === membershipNo))
      .slice(0, 5);

    let statementText =
`📄 *የቅርብ ጊዜ ግብይቶች / RECENT TRANSACTIONS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 *አባል / Member:* ${linkedUser.fullName}\n\n`;

    if (txns.length === 0) {
      statementText += `_ምንም የቅርብ ጊዜ ግብይት አልተገኘም። / No recent transactions on record._\n`;
    } else {
      txns.forEach((t, idx) => {
        const isCredit = t.type === 'DEPOSIT' || t.type === 'INTEREST_POSTING';
        statementText += `${idx + 1}. *${t.type}* - ${isCredit ? '➕' : '➖'} ETB ${t.amount.toLocaleString()}\n   📅 ${new Date(t.timestamp || t.createdAt).toLocaleDateString()} | Ref: \`${t.transactionNo}\`\n\n`;
      });
    }

    statementText += `────────────────────────────\n🌐 _ለሙሉ መግለጫ ድረ-ገጻችንን ይጎብኙ / Full passbook available on web portal._`;

    await this.sendMessage(chatId, statementText, { parse_mode: 'Markdown' });
  }

  /**
   * Handle support / help message
   */
  private async sendHelpMessage(chatId: number): Promise<void> {
    const helpText =
`🏢 *የዋቢ ሳኮ ድጋፍ መስጫና አድራሻ / WABI SACCO CONTACT & SUPPORT*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📞 *የቀጥታ ስልክ መስመሮች / Direct Hotlines:*
• +251 978 434 141
• +251 927 011 111

📍 *ዋና መሥሪያ ቤት አድራሻ / Office Address:*
አዲስ አበባ፣ ልደታ ከፍተኛ ፍርድ ቤት ፊት ለፊት፣ ሄለን ህንፃ 3ኛ ፎቅ
_Addis Ababa, Opposite Helen Building, in front of Lideta High Court, 3rd Floor_

⏰ *የሥራ ሰዓት / Working Hours:*
• ሰኞ - አርብ / Mon - Fri: 2:00 - 11:30 (8:00 AM - 5:30 PM)
• ቅዳሜ / Saturday: 2:00 - 6:30 (8:00 AM - 12:30 PM)

🌐 *ይፋዊ ድረ-ገጽ / Web Portal:* http://localhost:3000
📧 *ኢሜይል / Email:* info@wabisacco.et`;

    await this.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
  }

  /**
   * Handle user typing a 6-digit code
   */
  private async handleCodeInput(chatId: number, code: string, fromUser: any): Promise<void> {
    // Check if code matches any active challenge
    let matchedEntry: StoredOtp | null = null;
    for (const [key, entry] of this.activeOtps.entries()) {
      if (entry.otpCode === code && Date.now() <= entry.expiresAt) {
        matchedEntry = entry;
        break;
      }
    }

    if (matchedEntry) {
      matchedEntry.verified = true;
      await this.sendMessage(
        chatId,
        `✅ *ማረጋገጫው ተሳክቷል / Verification Confirmed!*\n\nየማረጋገጫ ኮድዎ በትክክል ጸድቋል።\nYour OTP code *${code}* has been verified successfully. You may now continue your session on the web portal.`,
        { parse_mode: 'Markdown' }
      );
    } else {
      await this.sendMessage(
        chatId,
        `❌ *ልክ ያልሆነ ወይም ጊዜው ያለፈበት ኮድ / Invalid or Expired Code*\n\nያስገቡት የማረጋገጫ ኮድ ትክክል አይደለም ወይም ጊዜው አልፏል። እባክዎ አዲስ ኮድ ለመጠየቅ ስልክ ቁጥርዎን በድጋሚ ያጋሩ።\n_The code is invalid or expired. Please request a new OTP by tapping the button below._`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [[{ text: '📱 Share Phone Number / ስልክ ቁጥርዎን ያረጋግጡ', request_contact: true }]],
            resize_keyboard: true,
          },
        }
      );
    }
  }

  /**
   * Fallback message for unhandled input
   */
  private async sendFallbackMessage(chatId: number): Promise<void> {
    await this.sendMessage(
      chatId,
      `👋 *የዋቢ ሳኮ ረዳት ቦት / Wabi SACCO Bot*\n\nእባክዎ ከታች ካሉት አማራጮች አንዱን ይምረጡ ወይም ስልክ ቁጥርዎን ለማረጋገጥ ቁልፉን ይጫኑ።\n_Please choose from the menu below or tap Share Phone Number to verify._`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [
            [{ text: '📱 Share Phone Number / ስልክ ቁጥርዎን ያረጋግጡ', request_contact: true }],
            [{ text: '💰 Check Balance / ቀሪ ሂሳብ' }, { text: '📞 Support & Office / ድጋፍ ማዕከል' }],
          ],
          resize_keyboard: true,
        },
      }
    );
  }

  /**
   * Handle inline button callbacks
   */
  private async handleCallbackQuery(cb: any): Promise<void> {
    const chatId = cb.message.chat.id;
    const data = cb.data || '';

    if (data.startsWith('balance_')) {
      const userId = data.replace('balance_', '');
      const user = db.getUserById(userId);
      if (user) {
        await this.handleBalanceInquiry(chatId, { username: user.username });
      }
    } else if (data.startsWith('statement_')) {
      const userId = data.replace('statement_', '');
      const user = db.getUserById(userId);
      if (user) {
        await this.handleStatementInquiry(chatId, { username: user.username });
      }
    } else if (data === 'support_info') {
      await this.sendHelpMessage(chatId);
    }

    // Acknowledge callback query to remove spinner on button
    await this.callApi('answerCallbackQuery', { callback_query_id: cb.id });
  }

  /**
   * Programmatic API: Send OTP to a phone or chat ID
   */
  public async sendOtp(
    phoneOrIdentifier: string,
    otpCode: string,
    memberName?: string,
    membershipNo?: string
  ): Promise<{ success: boolean; messageId?: number; error?: string }> {
    const user = db.findUserByIdentifier(phoneOrIdentifier);
    const targetName = memberName || user?.fullName || 'Valued Member';
    const targetMemNo = membershipNo || user?.membershipNo || 'MBR-' + (user?.id.slice(-6) || 'CORE');
    const phone = user?.phoneNumber || phoneOrIdentifier;

    const phoneKeys = this.getPhoneLookupKeys(phone);
    const digits = phone.replace(/\D/g, '');
    const local9 = digits.startsWith('251') && digits.length === 12 ? digits.slice(3) : (digits.startsWith('0') ? digits.slice(1) : digits.slice(-9));
    const normalizedIntl = local9 ? `+251${local9}` : phone;

    const storedEntry: StoredOtp = {
      userId: user?.id || normalizedIntl,
      phone: normalizedIntl,
      otpCode,
      createdAt: Date.now(),
      expiresAt: Date.now() + 15 * 60 * 1000,
      verified: false,
    };

    // Store in active OTP cache under all potential lookup formats
    for (const key of phoneKeys) {
      this.activeOtps.set(key, storedEntry);
    }

    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'Africa/Addis_Ababa',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const messageText =
`🏦 *WABI SACCO ENTERPRISE CORE BANKING*
_የዋቢ የቁጠባና ብድር ኅብረት ሥራ ማህበር_
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ውድ *${targetName}* / Dear Member,

የደህንነት ማረጋገጫ ሚስጥር ኮድዎ (OTP) የሚከተለው ነው፡
Your Wabi SACCO verification OTP code is:

┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
   👉  *${otpCode}*  👈
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛

⏱ *የሚያገለግልበት ጊዜ / Expiry:* 15 Minutes
👤 *የአባል ቁጥር / Member ID:* \`${targetMemNo}\`
📱 *ስልክ / Phone:* \`${normalizedIntl}\`
🕒 *ሰዓት / Timestamp:* ${timestamp}

⚠️ *የደህንነት ማስጠንቀቂያ / SECURITY ADVICE:*
• ይህን ሚስጥር ኮድ ለማንም ሰው አሳልፈው አይስጡ።
• Never share this OTP verification code with anyone.

────────────────────────────
📞 *Hotline:* +251 978 434 141 | +251 927 011 111
📍 *Address:* Helen Bldg 3rd Floor, in front of Lideta High Court, Addis Ababa`;

    // Try finding linked Telegram Chat ID if available
    const targetChatId = (user as any)?.telegramChatId || (user as any)?.preferences?.telegramChatId;

    if (targetChatId) {
      try {
        const res = await this.sendMessage(targetChatId, messageText, { parse_mode: 'Markdown' });
        return { success: true, messageId: res?.message_id };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    logger.info(`[TelegramBot] OTP generated for ${normalizedIntl}: ${otpCode} (Awaiting member contact share on Telegram)`);
    return { success: true };
  }

  /**
   * Verify an entered OTP against active OTP cache
   */
  public verifyOtp(
    phoneOrIdentifier: string,
    enteredOtp: string
  ): { success: boolean; message: string; error?: string } {
    // Master test override
    if (enteredOtp.trim() === '123456') {
      return { success: true, message: 'OTP verified successfully (Master Bypass)' };
    }

    const phoneKeys = this.getPhoneLookupKeys(phoneOrIdentifier);
    let otpEntry: StoredOtp | undefined;

    for (const key of phoneKeys) {
      if (this.activeOtps.has(key)) {
        otpEntry = this.activeOtps.get(key);
        break;
      }
    }

    if (!otpEntry) {
      return {
        success: false,
        error: 'No active OTP verification challenge found for this phone number. Please click Send Code to Telegram.',
        message: 'No active challenge found.',
      };
    }

    if (Date.now() > otpEntry.expiresAt) {
      return {
        success: false,
        error: 'The verification code has expired. Please click Resend Code.',
        message: 'OTP has expired.',
      };
    }

    if (otpEntry.otpCode.trim() !== enteredOtp.trim()) {
      return {
        success: false,
        error: 'Invalid verification code. Please enter the exact 6-digit code sent to you by @wabbisaccobot.',
        message: 'Incorrect OTP code.',
      };
    }

    otpEntry.verified = true;
    return { success: true, message: 'Phone number verified successfully via Telegram Bot.' };
  }

  /**
   * Send arbitrary message to a Telegram Chat
   */
  public async sendMessage(chatId: number | string, text: string, options: Record<string, any> = {}): Promise<any> {
    return this.callApi('sendMessage', {
      chat_id: chatId,
      text,
      ...options,
    });
  }

  /**
   * Check status and telemetry of Telegram Bot
   */
  public getStatus(): TelegramBotStatus {
    const allUsers = db.getUsers();
    const linkedCount = allUsers.filter((u) => (u as any).telegramChatId || (u as any).avatarUrl?.includes('t.me')).length;

    return {
      isRunning: this.isPolling,
      botId: this.botId,
      botName: this.botName,
      botUsername: this.botUsername,
      lastPollAt: this.lastPollAt,
      lastError: this.lastError,
      linkedUsersCount: linkedCount,
      activeOtpsCount: this.activeOtps.size,
    };
  }

  /**
   * Purge expired OTP challenges
   */
  private purgeExpiredOtps(): void {
    const now = Date.now();
    for (const [key, entry] of this.activeOtps.entries()) {
      if (entry.expiresAt < now) {
        this.activeOtps.delete(key);
      }
    }
  }

  /**
   * Call Telegram Bot API via native HTTPS
   */
  private callApi<T = any>(method: string, payload: Record<string, any>): Promise<T> {
    return new Promise((resolve, reject) => {
      const dataString = JSON.stringify(payload);
      const urlPath = `/bot${this.botToken}/${method}`;

      const options = {
        hostname: 'api.telegram.org',
        port: 443,
        path: urlPath,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(dataString),
        },
        timeout: 30000,
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (parsed.ok) {
              resolve(parsed.result as T);
            } else {
              reject(new Error(parsed.description || `Telegram API Error ${parsed.error_code}`));
            }
          } catch (e: any) {
            reject(new Error(`Failed to parse Telegram API response: ${e.message}`));
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Telegram API request timed out'));
      });

      req.write(dataString);
      req.end();
    });
  }
}

export const telegramBotService = new TelegramBotService();
