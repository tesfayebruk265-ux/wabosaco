import crypto from 'crypto';

const MASTER_ENCRYPTION_KEY = process.env.FIELD_ENCRYPTION_KEY || 'wabi-sacco-master-aes256-encryption-key-2026!';
// Derive a 32-byte key using SHA-256
const ENCRYPTION_KEY_32 = crypto.createHash('sha256').update(MASTER_ENCRYPTION_KEY).digest();
const SIGNED_URL_SECRET = process.env.SIGNED_URL_SECRET || 'wabi-sacco-signed-url-secret-2026!';

export const encryptionUtils = {
  /**
   * Encrypt sensitive string data using AES-256-GCM with authentication tag
   */
  encryptField(plainText: string): string {
    if (!plainText) return plainText;
    try {
      const iv = crypto.randomBytes(12); // 12-byte IV for GCM
      const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY_32, iv);
      let encrypted = cipher.update(plainText, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag().toString('hex');
      // Format: enc:v1:iv:authTag:cipherHex
      return `enc:v1:${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (err) {
      console.error('Encryption failure:', err);
      return plainText;
    }
  },

  /**
   * Decrypt AES-256-GCM encrypted field
   */
  decryptField(cipherText: string): string {
    if (!cipherText || !cipherText.startsWith('enc:v1:')) {
      return cipherText;
    }
    try {
      const parts = cipherText.split(':');
      if (parts.length !== 5) return cipherText;
      const iv = Buffer.from(parts[2], 'hex');
      const authTag = Buffer.from(parts[3], 'hex');
      const encrypted = parts[4];

      const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY_32, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (err) {
      console.error('Decryption failure:', err);
      return '[ENCRYPTED_UNREADABLE]';
    }
  },

  /**
   * Mask sensitive national ID, account, or phone numbers for safe display
   */
  maskNationalId(id: string): string {
    if (!id || id.length <= 4) return '****';
    const clean = this.decryptField(id);
    return `${clean.substring(0, 2)}****${clean.substring(clean.length - 3)}`;
  },

  maskPhoneNumber(phone: string): string {
    if (!phone || phone.length <= 6) return '****';
    return `${phone.substring(0, 4)}****${phone.substring(phone.length - 3)}`;
  },

  maskEmail(email: string): string {
    if (!email || !email.includes('@')) return '****';
    const [local, domain] = email.split('@');
    if (local.length <= 2) return `*@${domain}`;
    return `${local.substring(0, 2)}****@${domain}`;
  },

  maskBankReference(ref: string): string {
    if (!ref || ref.length <= 4) return '****';
    return `${ref.substring(0, 3)}****${ref.substring(ref.length - 3)}`;
  },

  /**
   * Generate time-limited signed URL token for document access
   */
  generateSignedDocumentToken(documentId: string, userId: string, expiresInMinutes = 15): {
    token: string;
    expiresAt: string;
    url: string;
  } {
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();
    const payload = `${documentId}:${userId}:${expiresAt}`;
    const signature = crypto
      .createHmac('sha256', SIGNED_URL_SECRET)
      .update(payload)
      .digest('hex');
    const token = Buffer.from(JSON.stringify({ documentId, userId, expiresAt, signature })).toString('base64url');
    
    return {
      token,
      expiresAt,
      url: `/api/v1/documents/secure-access?token=${token}`,
    };
  },

  /**
   * Verify signed document access token
   */
  verifySignedDocumentToken(token: string): {
    valid: boolean;
    documentId?: string;
    userId?: string;
    error?: string;
  } {
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
      const { documentId, userId, expiresAt, signature } = decoded;

      if (!documentId || !expiresAt || !signature) {
        return { valid: false, error: 'Malformed access token' };
      }

      if (new Date(expiresAt) < new Date()) {
        return { valid: false, error: 'Document access link has expired. Please request a new signed URL.' };
      }

      const expectedPayload = `${documentId}:${userId}:${expiresAt}`;
      const expectedSignature = crypto
        .createHmac('sha256', SIGNED_URL_SECRET)
        .update(expectedPayload)
        .digest('hex');

      if (signature !== expectedSignature) {
        return { valid: false, error: 'Invalid document signature' };
      }

      return { valid: true, documentId, userId };
    } catch {
      return { valid: false, error: 'Invalid document signature format' };
    }
  },
};
