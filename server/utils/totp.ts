import crypto from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(input: string): Buffer {
  const cleaned = input.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

export const totpUtils = {
  /**
   * Generate a random base32 secret for TOTP (e.g. 20 bytes = 160 bits)
   */
  generateSecret(): { secret: string; base32: string } {
    const buffer = crypto.randomBytes(20);
    return {
      secret: buffer.toString('hex'),
      base32: base32Encode(buffer),
    };
  },

  /**
   * Generate 6-digit TOTP code for a given timestamp and secret
   */
  generateTOTP(secretBase32: string, timeStepSeconds = 30, timestampMs = Date.now()): string {
    const key = base32Decode(secretBase32);
    const counter = Math.floor(timestampMs / 1000 / timeStepSeconds);
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigInt64BE(BigInt(counter), 0);

    const hmac = crypto.createHmac('sha1', key).update(counterBuffer).digest();
    const offset = hmac[hmac.length - 1] & 0xf;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const code = (binary % 1000000).toString().padStart(6, '0');
    return code;
  },

  /**
   * Verify TOTP code with time drift tolerance window (±1 step = ±30s)
   */
  verifyTOTP(code: string, secretBase32: string, window = 1): boolean {
    if (!code || code.length !== 6) return false;
    const now = Date.now();
    for (let i = -window; i <= window; i++) {
      const stepTime = now + i * 30000;
      const expected = this.generateTOTP(secretBase32, 30, stepTime);
      if (expected === code) {
        return true;
      }
    }
    return false;
  },

  /**
   * Generate otpauth:// URI for QR code generation
   */
  generateOtpAuthUri(accountName: string, issuer: string, secretBase32: string): string {
    const encodedIssuer = encodeURIComponent(issuer);
    const encodedAccount = encodeURIComponent(accountName);
    return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secretBase32}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
  },

  /**
   * Generate a batch of single-use backup recovery codes
   */
  generateBackupCodes(count = 10): { rawCodes: string[]; hashedCodes: { codeHash: string; used: boolean }[] } {
    const rawCodes: string[] = [];
    const hashedCodes: { codeHash: string; used: boolean }[] = [];

    for (let i = 0; i < count; i++) {
      const part1 = crypto.randomBytes(3).toString('hex').toUpperCase();
      const part2 = crypto.randomBytes(3).toString('hex').toUpperCase();
      const raw = `${part1}-${part2}`;
      rawCodes.push(raw);
      const codeHash = crypto.createHash('sha256').update(raw.replace('-', '')).digest('hex');
      hashedCodes.push({ codeHash, used: false });
    }

    return { rawCodes, hashedCodes };
  },

  /**
   * Verify and consume a single-use backup recovery code
   */
  verifyAndConsumeBackupCode(
    inputCode: string,
    storedCodes: { codeHash: string; used: boolean; usedAt?: string }[]
  ): { valid: boolean; updatedCodes: { codeHash: string; used: boolean; usedAt?: string }[] } {
    const clean = inputCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const hash = crypto.createHash('sha256').update(clean).digest('hex');

    let matched = false;
    const updated = storedCodes.map((c) => {
      if (!c.used && c.codeHash === hash) {
        matched = true;
        return { ...c, used: true, usedAt: new Date().toISOString() };
      }
      return c;
    });

    return { valid: matched, updatedCodes: updated };
  },
};
