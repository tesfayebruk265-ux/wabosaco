export interface ValidationErrorDetail {
  field?: string;
  issue: string;
}

export class AppValidationError extends Error {
  public statusCode = 422;
  public details: ValidationErrorDetail[];

  constructor(message: string, details: ValidationErrorDetail[] = []) {
    super(message);
    this.name = 'AppValidationError';
    this.details = details;
  }
}

export const validator = {
  isValidUsername(username?: string): boolean {
    if (!username) return false;
    // 3 to 30 chars, alphanumeric + dots/underscores/hyphens
    return /^[a-zA-Z0-9._-]{3,30}$/.test(username.trim());
  },

  isValidEmail(email?: string): boolean {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  },

  isValidPhone(phone?: string): boolean {
    if (!phone) return false;
    // Ethiopian numbers: +251 9... / 09... / +251 7... / 07...
    const clean = phone.replace(/[\s-]/g, '');
    return /^(\+251|0)(9|7)\d{8}$/.test(clean);
  },

  validatePassword(password?: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!password) {
      errors.push('Password is required.');
      return { isValid: false, errors };
    }

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long.');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter.');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter.');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number.');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character.');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  validateLoginBody(body: any): { identifier: string; password: string } {
    const details: ValidationErrorDetail[] = [];
    const identifier = body?.identifier || body?.username || body?.email || body?.phoneNumber;
    const password = body?.password;

    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      details.push({ field: 'identifier', issue: 'Username, email, or phone number is required.' });
    }
    if (!password || typeof password !== 'string') {
      details.push({ field: 'password', issue: 'Password is required.' });
    }

    if (details.length > 0) {
      throw new AppValidationError('Invalid login credentials format', details);
    }

    return { identifier: identifier.trim(), password };
  },

  validateCreateUserBody(body: any): {
    username: string;
    email: string;
    phoneNumber: string;
    fullName: string;
    role: string;
    password?: string;
    membershipNo?: string;
  } {
    const details: ValidationErrorDetail[] = [];

    if (!body.fullName || typeof body.fullName !== 'string' || body.fullName.trim().length < 2) {
      details.push({ field: 'fullName', issue: 'Full name must be at least 2 characters.' });
    }

    if (!this.isValidUsername(body.username)) {
      details.push({ field: 'username', issue: 'Username must be 3-30 characters (alphanumeric, dot, underscore, dash).' });
    }

    if (!this.isValidEmail(body.email)) {
      details.push({ field: 'email', issue: 'A valid email address is required.' });
    }

    if (!this.isValidPhone(body.phoneNumber)) {
      details.push({ field: 'phoneNumber', issue: 'A valid Ethiopian mobile number (+2519... or 09...) is required.' });
    }

    const validRoles = ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'AUDITOR', 'CUSTOMER_SERVICE', 'MEMBER'];
    if (!body.role || !validRoles.includes(body.role)) {
      details.push({ field: 'role', issue: `Role must be one of: ${validRoles.join(', ')}` });
    }

    if (body.password) {
      const passVal = this.validatePassword(body.password);
      if (!passVal.isValid) {
        passVal.errors.forEach((err) => details.push({ field: 'password', issue: err }));
      }
    }

    if (details.length > 0) {
      throw new AppValidationError('User validation failed', details);
    }

    return {
      username: body.username.trim(),
      email: body.email.trim().toLowerCase(),
      phoneNumber: body.phoneNumber.trim(),
      fullName: body.fullName.trim(),
      role: body.role,
      password: body.password,
      membershipNo: body.membershipNo?.trim(),
    };
  },
};
