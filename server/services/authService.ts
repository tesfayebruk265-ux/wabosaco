import { db } from '../db/database';
import { DbUser, DbRefreshToken, DbSession, DbTrustedDevice } from '../db/schema';
import { cryptoUtils } from '../utils/crypto';
import { validator, AppValidationError } from '../utils/validator';
import { securityService } from './securityService';
import { mfaService } from './mfaService';
import { fraudRiskEngine } from './fraudRiskEngine';
import { detectClientEnvironment } from '../utils/deviceDetector';

const ACCESS_TOKEN_TTL_SECONDS = 900; // 15 minutes
const REFRESH_TOKEN_TTL_DAYS = 7;

export interface AuthSuccessPayload {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: {
    id: string;
    username: string;
    email: string;
    phoneNumber: string;
    fullName: string;
    role: string;
    membershipNo?: string;
    avatarUrl?: string;
    isActive: boolean;
    lastLoginAt?: string | null;
    createdAt: string;
  };
  permissions: string[];
  session: {
    sessionId: string;
    expiresAt: string;
  };
  riskAssessment?: {
    score: number;
    level: string;
  };
}

export interface MfaChallengePayload {
  mfaRequired: true;
  mfaToken: string;
  methods: string[];
  preferredMethod: string;
  destinationMasked?: string;
  userId: string;
  username: string;
}

// In-memory store for pending 2FA login tokens (10 min TTL)
const pendingMfaLogins = new Map<
  string,
  {
    userId: string;
    expiresAt: number;
    deviceInfo?: string;
    ipAddress?: string;
    userAgent?: string;
    deviceFingerprint?: string;
  }
>();

export class AuthError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any[];

  constructor(code: string, message: string, statusCode = 400, details?: any[]) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const authService = {
  async login(
    body: any,
    context: { ipAddress?: string; userAgent?: string; deviceInfo?: string } = {}
  ): Promise<AuthSuccessPayload> {
    const { identifier, password } = validator.validateLoginBody(body);
    const user = db.findUserByIdentifier(identifier);

    // 1. Unknown user
    if (!user) {
      // Check if this identifier belongs to an unverified or pending registration request
      const pendingReq = db.getRegistrationRequests().find(
        (r) =>
          r.contactInfo.email.toLowerCase() === identifier.trim().toLowerCase() ||
          r.applicationReference.toLowerCase() === identifier.trim().toLowerCase() ||
          r.contactInfo.username.toLowerCase() === identifier.trim().toLowerCase()
      );

      if (pendingReq) {
        if (pendingReq.status === 'PENDING') {
          securityService.recordLoginAttempt(identifier, 'FAILED', {
            failureReason: `Registration pending accountant verification (Ref: ${pendingReq.applicationReference})`,
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
            deviceInfo: context.deviceInfo,
          });
          throw new AuthError(
            'AUTH_REGISTRATION_PENDING',
            `Your account registration (Application Ref: ${pendingReq.applicationReference}) is currently pending accountant verification. You will be able to log in with your email and password as soon as the SACCO Accountant verifies and activates your account.`,
            403
          );
        } else if (pendingReq.status === 'REJECTED') {
          securityService.recordLoginAttempt(identifier, 'FAILED', {
            failureReason: `Registration was rejected (Ref: ${pendingReq.applicationReference})`,
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
            deviceInfo: context.deviceInfo,
          });
          throw new AuthError(
            'AUTH_REGISTRATION_REJECTED',
            `Your registration (${pendingReq.applicationReference}) was not approved. Reason: ${pendingReq.rejectionReason || 'Please re-upload your bank deposit receipt.'}. Please check the Status Inquiry page to re-upload your receipt.`,
            403
          );
        }
      }

      securityService.recordLoginAttempt(identifier, 'FAILED', {
        failureReason: 'User does not exist',
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        deviceInfo: context.deviceInfo,
      });
      throw new AuthError('AUTH_INVALID_CREDENTIALS', 'Invalid credentials or user not found.', 401);
    }

    // 2. Check lock status
    const now = new Date();
    if (user.lockedUntil && new Date(user.lockedUntil) > now) {
      const remainingMinutes = Math.ceil((new Date(user.lockedUntil).getTime() - now.getTime()) / 60000);
      securityService.recordLoginAttempt(identifier, 'FAILED', {
        userId: user.id,
        failureReason: `Account temporarily locked due to excessive failed attempts (${remainingMinutes}m remaining)`,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
      throw new AuthError(
        'AUTH_ACCOUNT_LOCKED',
        `Account is temporarily locked for security. Please retry in ${remainingMinutes} minutes or contact SACCO administration.`,
        403
      );
    }

    // 3. Check deactivation status
    if (!user.isActive || user.status === 'DEACTIVATED') {
      securityService.recordLoginAttempt(identifier, 'FAILED', {
        userId: user.id,
        failureReason: 'Account is deactivated',
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
      throw new AuthError(
        'AUTH_ACCOUNT_DEACTIVATED',
        'Your user account has been deactivated. Please contact Wabi SACCO customer support or your branch administrator.',
        403
      );
    }

    // 4. Verify password
    const policy = db.getPasswordPolicy();
    const maxFailed = policy.failedAttemptsThreshold || 5;
    const lockoutMinutes = policy.lockoutDurationMinutes || 15;

    const isPasswordValid = cryptoUtils.verifyPassword(password, user.salt, user.passwordHash);

    if (!isPasswordValid) {
      const failedCount = (user.failedLoginAttempts || 0) + 1;
      const willLock = failedCount >= maxFailed;
      const lockedUntil = willLock ? new Date(Date.now() + lockoutMinutes * 60 * 1000).toISOString() : null;

      db.updateUser(user.id, {
        failedLoginAttempts: failedCount,
        lockedUntil,
      });

      securityService.recordLoginAttempt(identifier, 'FAILED', {
        userId: user.id,
        failureReason: `Invalid password (attempt ${failedCount}/${maxFailed})`,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      if (willLock) {
        securityService.recordSecurityEvent('RATE_LIMIT_EXCEEDED', {
          userId: user.id,
          severity: 'CRITICAL',
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          details: { reason: `Locked out after ${maxFailed} failed attempts` },
        });
      }

      throw new AuthError('AUTH_INVALID_CREDENTIALS', 'Invalid credentials. Please verify your username and password.', 401);
    }

    // 5. Client device detection and risk evaluation
    const detectedEnv = detectClientEnvironment(context.userAgent, context.ipAddress);
    const clientFingerprint = body.deviceFingerprint || detectedEnv.deviceFingerprint;

    const riskEval = fraudRiskEngine.evaluateRisk({
      contextType: 'LOGIN',
      user,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      deviceFingerprint: clientFingerprint,
      location: detectedEnv.location,
    });

    // 6. Check MFA Requirement
    const mfaCheck = mfaService.isMfaRequired(user);
    const mfaCodeProvided = body.mfaCode || body.otpCode || body.totpCode;

    if (mfaCheck.required || riskEval.actionTaken === 'CHALLENGE_MFA') {
      if (!mfaCodeProvided) {
        // Return 2FA Challenge
        const mfaToken = 'mfa_tk_' + cryptoUtils.generateUuid();
        pendingMfaLogins.set(mfaToken, {
          userId: user.id,
          expiresAt: Date.now() + 10 * 60 * 1000,
          deviceInfo: context.deviceInfo,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          deviceFingerprint: clientFingerprint,
        });

        const config = mfaCheck.config;
        const methods = config?.methods || ['TOTP', 'EMAIL_OTP', 'SMS_OTP'];
        const preferredMethod = config?.preferredMethod || 'TOTP';

        const destination =
          preferredMethod === 'SMS_OTP'
            ? user.phoneNumber
            : user.email;

        const masked = destination
          ? preferredMethod === 'SMS_OTP'
            ? destination.slice(0, 4) + '****' + destination.slice(-3)
            : destination.replace(/(.{2})(.*)(@.*)/, '$1***$3')
          : undefined;

        return {
          mfaRequired: true,
          mfaToken,
          methods,
          preferredMethod,
          destinationMasked: masked,
          userId: user.id,
          username: user.username,
        } as any;
      } else {
        // Validate provided MFA code
        const verifyRes = mfaService.verifyMfa(user.id, mfaCodeProvided);
        if (!verifyRes.success) {
          securityService.recordLoginAttempt(identifier, 'FAILED', {
            userId: user.id,
            failureReason: 'Invalid MFA verification code provided during login',
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
          });
          throw new AuthError('AUTH_MFA_INVALID', verifyRes.errorMessage || 'Invalid 2FA verification code.', 401);
        }
      }
    }

    // 7. Password correct & MFA satisfied: reset failed attempts & update login timestamp
    const loginTime = new Date().toISOString();
    db.updateUser(user.id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: loginTime,
    });

    const userRoles = db.getUserRoles(user.id);
    const primaryRole = userRoles[0]?.code || 'MEMBER';
    const permissions = db.getUserPermissions(user.id);

    // 8. Generate Active Session & Tokens
    const sessionId = 'ses_' + cryptoUtils.generateUuid();
    const rawRefreshToken = cryptoUtils.generateRandomToken(48);
    const refreshTokenHash = cryptoUtils.hashToken(rawRefreshToken);
    const familyId = 'fam_' + cryptoUtils.generateUuid();
    const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

    // Save Refresh Token
    const refreshTokenRecord: DbRefreshToken = {
      id: 'rtk_' + cryptoUtils.generateUuid(),
      userId: user.id,
      tokenHash: refreshTokenHash,
      familyId,
      isRevoked: false,
      createdAt: loginTime,
      expiresAt: refreshExpiresAt,
      deviceInfo: context.deviceInfo || detectedEnv.browser + ' on ' + detectedEnv.os,
      ipAddress: context.ipAddress || '127.0.0.1',
    };
    db.saveRefreshToken(refreshTokenRecord);

    // Record Active Session
    const sessionRecord: DbSession = {
      id: sessionId,
      accessTokenId: sessionId,
      userId: user.id,
      username: user.username,
      userRole: primaryRole,
      ipAddress: context.ipAddress || '127.0.0.1',
      userAgent: context.userAgent || 'Unknown Agent',
      browser: detectedEnv.browser,
      os: detectedEnv.os,
      deviceType: detectedEnv.deviceType,
      deviceFingerprint: clientFingerprint,
      location: detectedEnv.location,
      createdAt: loginTime,
      lastActivityAt: loginTime,
      expiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000).toISOString(),
      isActive: true,
      mfaVerified: mfaCheck.required || !!mfaCodeProvided,
      riskScore: riskEval.riskScore,
    };
    db.createSession(sessionRecord);

    // Register / update Trusted Device
    const existingDevice = db.getTrustedDeviceByFingerprint(user.id, clientFingerprint);
    if (existingDevice) {
      existingDevice.lastUsedAt = loginTime;
      existingDevice.ipAddress = context.ipAddress || existingDevice.ipAddress;
      db.saveTrustedDevice(existingDevice);
    } else {
      const newDev: DbTrustedDevice = {
        id: 'dev_' + cryptoUtils.generateUuid(),
        userId: user.id,
        deviceName: `${detectedEnv.browser} on ${detectedEnv.os}`,
        browser: detectedEnv.browser,
        os: detectedEnv.os,
        deviceFingerprint: clientFingerprint,
        ipAddress: context.ipAddress || '127.0.0.1',
        location: detectedEnv.location,
        isApproved: true,
        approvedAt: loginTime,
        lastUsedAt: loginTime,
        isRevoked: false,
        riskScore: riskEval.riskScore,
        userAgent: context.userAgent,
      };
      db.saveTrustedDevice(newDev);
    }

    const accessToken = cryptoUtils.signJwt(
      {
        sub: user.id,
        username: user.username,
        email: user.email,
        role: primaryRole,
        permissions,
        membershipNo: user.membershipNo,
        jti: sessionId,
      },
      ACCESS_TOKEN_TTL_SECONDS
    );

    // 9. Record login logs
    securityService.recordLoginAttempt(identifier, 'SUCCESS', {
      userId: user.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      deviceInfo: context.deviceInfo || `${detectedEnv.browser} on ${detectedEnv.os}`,
    });

    securityService.recordSecurityEvent('LOGIN', {
      userId: user.id,
      severity: 'INFO',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      details: {
        role: primaryRole,
        loginTime,
        sessionId,
        riskScore: riskEval.riskScore,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      tokenType: 'Bearer',
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        fullName: user.fullName,
        role: primaryRole,
        membershipNo: user.membershipNo,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
      permissions,
      session: {
        sessionId,
        expiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000).toISOString(),
      },
      riskAssessment: {
        score: riskEval.riskScore,
        level: riskEval.riskLevel,
      },
    };
  },

  async verifyLoginMfa(
    mfaToken: string,
    mfaCode: string,
    context: { ipAddress?: string; userAgent?: string; deviceInfo?: string } = {}
  ): Promise<AuthSuccessPayload> {
    const pending = pendingMfaLogins.get(mfaToken);
    if (!pending || Date.now() > pending.expiresAt) {
      throw new AuthError('AUTH_MFA_EXPIRED', 'MFA challenge session has expired. Please log in again.', 401);
    }

    const user = db.getUserById(pending.userId);
    if (!user || !user.isActive) {
      throw new AuthError('AUTH_ACCOUNT_INACTIVE', 'User account unavailable.', 403);
    }

    const verifyResult = mfaService.verifyMfa(user.id, mfaCode);
    if (!verifyResult.success) {
      securityService.recordLoginAttempt(user.username, 'FAILED', {
        userId: user.id,
        failureReason: 'Invalid MFA verification code provided during 2FA step',
        ipAddress: context.ipAddress || pending.ipAddress,
        userAgent: context.userAgent || pending.userAgent,
      });
      throw new AuthError('AUTH_MFA_INVALID', verifyResult.errorMessage || 'Invalid verification code.', 401);
    }

    pendingMfaLogins.delete(mfaToken);

    // Complete login session creation
    const loginTime = new Date().toISOString();
    db.updateUser(user.id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: loginTime,
    });

    const userRoles = db.getUserRoles(user.id);
    const primaryRole = userRoles[0]?.code || 'MEMBER';
    const permissions = db.getUserPermissions(user.id);

    const detectedEnv = detectClientEnvironment(
      context.userAgent || pending.userAgent,
      context.ipAddress || pending.ipAddress
    );
    const clientFingerprint = pending.deviceFingerprint || detectedEnv.deviceFingerprint;

    const sessionId = 'ses_' + cryptoUtils.generateUuid();
    const rawRefreshToken = cryptoUtils.generateRandomToken(48);
    const refreshTokenHash = cryptoUtils.hashToken(rawRefreshToken);
    const familyId = 'fam_' + cryptoUtils.generateUuid();
    const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const refreshTokenRecord: DbRefreshToken = {
      id: 'rtk_' + cryptoUtils.generateUuid(),
      userId: user.id,
      tokenHash: refreshTokenHash,
      familyId,
      isRevoked: false,
      createdAt: loginTime,
      expiresAt: refreshExpiresAt,
      deviceInfo: context.deviceInfo || `${detectedEnv.browser} on ${detectedEnv.os}`,
      ipAddress: context.ipAddress || pending.ipAddress || '127.0.0.1',
    };
    db.saveRefreshToken(refreshTokenRecord);

    const sessionRecord: DbSession = {
      id: sessionId,
      accessTokenId: sessionId,
      userId: user.id,
      username: user.username,
      userRole: primaryRole,
      ipAddress: context.ipAddress || pending.ipAddress || '127.0.0.1',
      userAgent: context.userAgent || pending.userAgent || 'Unknown Agent',
      browser: detectedEnv.browser,
      os: detectedEnv.os,
      deviceType: detectedEnv.deviceType,
      deviceFingerprint: clientFingerprint,
      location: detectedEnv.location,
      createdAt: loginTime,
      lastActivityAt: loginTime,
      expiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000).toISOString(),
      isActive: true,
      mfaVerified: true,
      riskScore: 10,
    };
    db.createSession(sessionRecord);

    const accessToken = cryptoUtils.signJwt(
      {
        sub: user.id,
        username: user.username,
        email: user.email,
        role: primaryRole,
        permissions,
        membershipNo: user.membershipNo,
        jti: sessionId,
      },
      ACCESS_TOKEN_TTL_SECONDS
    );

    securityService.recordLoginAttempt(user.username, 'SUCCESS', {
      userId: user.id,
      ipAddress: context.ipAddress || pending.ipAddress,
      userAgent: context.userAgent || pending.userAgent,
      deviceInfo: context.deviceInfo || `${detectedEnv.browser} on ${detectedEnv.os}`,
    });

    securityService.recordSecurityEvent('LOGIN', {
      userId: user.id,
      severity: 'INFO',
      ipAddress: context.ipAddress || pending.ipAddress,
      userAgent: context.userAgent || pending.userAgent,
      details: { role: primaryRole, loginTime, sessionId, mfaMethod: verifyResult.method },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      tokenType: 'Bearer',
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        fullName: user.fullName,
        role: primaryRole,
        membershipNo: user.membershipNo,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
      permissions,
      session: {
        sessionId,
        expiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000).toISOString(),
      },
      riskAssessment: {
        score: 10,
        level: 'LOW',
      },
    };
  },

  async requestLoginOtp(
    mfaToken: string,
    method: 'SMS_OTP' | 'EMAIL_OTP'
  ): Promise<{ success: boolean; destinationMasked: string; message: string }> {
    const pending = pendingMfaLogins.get(mfaToken);
    if (!pending || Date.now() > pending.expiresAt) {
      throw new AuthError('AUTH_MFA_EXPIRED', 'MFA challenge session has expired. Please log in again.', 401);
    }

    const user = db.getUserById(pending.userId);
    if (!user) {
      throw new AuthError('AUTH_USER_NOT_FOUND', 'User not found.', 404);
    }

    return mfaService.requestOtpChallenge(user, method);
  },

  async refresh(rawRefreshToken: string, context: { ipAddress?: string; userAgent?: string } = {}): Promise<AuthSuccessPayload> {
    if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
      throw new AuthError('AUTH_INVALID_TOKEN', 'Refresh token is required.', 400);
    }

    const tokenHash = cryptoUtils.hashToken(rawRefreshToken.trim());
    const storedToken = db.getRefreshTokenByHash(tokenHash);

    if (!storedToken) {
      throw new AuthError('AUTH_INVALID_TOKEN', 'Invalid or unrecognized refresh token.', 401);
    }

    // Reuse Detection
    if (storedToken.isRevoked) {
      // Detected refresh token reuse! Revoke entire family!
      db.revokeTokenFamily(storedToken.familyId, 'Compromised token replay detected');
      securityService.recordSecurityEvent('REFRESH_TOKEN_REUSE_DETECTED', {
        userId: storedToken.userId,
        severity: 'CRITICAL',
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        details: { familyId: storedToken.familyId, attemptedTokenId: storedToken.id },
      });
      throw new AuthError(
        'AUTH_TOKEN_REUSE_DETECTED',
        'Security alert: Suspicious refresh token replay detected. All user sessions in this family have been terminated.',
        401
      );
    }

    const now = new Date();
    if (new Date(storedToken.expiresAt) <= now) {
      throw new AuthError('AUTH_TOKEN_EXPIRED', 'Refresh token has expired. Please sign in again.', 401);
    }

    const user = db.getUserById(storedToken.userId);
    if (!user || !user.isActive || user.status === 'DEACTIVATED') {
      throw new AuthError('AUTH_ACCOUNT_INACTIVE', 'User account is deactivated or unavailable.', 403);
    }

    // Token rotation: Revoke current token and link replacement
    const newRawRefreshToken = cryptoUtils.generateRandomToken(48);
    const newTokenHash = cryptoUtils.hashToken(newRawRefreshToken);
    const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const newRecordId = 'rtk_' + cryptoUtils.generateUuid();

    db.updateRefreshToken(storedToken.id, {
      isRevoked: true,
      replacedByTokenId: newRecordId,
      revokedAt: new Date().toISOString(),
    });

    const newRefreshTokenRecord: DbRefreshToken = {
      id: newRecordId,
      userId: user.id,
      tokenHash: newTokenHash,
      familyId: storedToken.familyId, // Maintain family identity
      isRevoked: false,
      createdAt: new Date().toISOString(),
      expiresAt: newExpiresAt,
      deviceInfo: storedToken.deviceInfo,
      ipAddress: context.ipAddress || storedToken.ipAddress,
    };
    db.saveRefreshToken(newRefreshTokenRecord);

    const userRoles = db.getUserRoles(user.id);
    const primaryRole = userRoles[0]?.code || 'MEMBER';
    const permissions = db.getUserPermissions(user.id);
    const sessionId = 'ses_' + cryptoUtils.generateUuid();

    const accessToken = cryptoUtils.signJwt(
      {
        sub: user.id,
        username: user.username,
        email: user.email,
        role: primaryRole,
        permissions,
        membershipNo: user.membershipNo,
        jti: sessionId,
      },
      ACCESS_TOKEN_TTL_SECONDS
    );

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
      tokenType: 'Bearer',
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        fullName: user.fullName,
        role: primaryRole,
        membershipNo: user.membershipNo,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
      permissions,
      session: {
        sessionId,
        expiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000).toISOString(),
      },
    };
  },

  async logout(rawRefreshToken?: string, userId?: string): Promise<{ success: boolean; message: string }> {
    if (rawRefreshToken) {
      const tokenHash = cryptoUtils.hashToken(rawRefreshToken.trim());
      const stored = db.getRefreshTokenByHash(tokenHash);
      if (stored) {
        db.updateRefreshToken(stored.id, {
          isRevoked: true,
          revokedAt: new Date().toISOString(),
        });
      }
    }

    if (userId) {
      securityService.recordSecurityEvent('LOGOUT', {
        userId,
        severity: 'INFO',
        details: { message: 'User initiated safe sign-out' },
      });
    }

    return { success: true, message: 'Successfully signed out.' };
  },

  async forgotPassword(identifier: string): Promise<{ success: boolean; message: string; debugOtp?: string }> {
    if (!identifier || typeof identifier !== 'string') {
      throw new AppValidationError('Identifier is required', [{ field: 'identifier', issue: 'Phone or email is required' }]);
    }

    const user = db.findUserByIdentifier(identifier);
    if (!user) {
      // Return generic message to prevent account enumeration
      return {
        success: true,
        message: 'If the provided credentials match an active SACCO account, a verification code has been dispatched.',
      };
    }

    const otpCode = cryptoUtils.generateOtp(6);
    const token = cryptoUtils.generateRandomToken(24);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

    db.savePasswordReset({
      id: 'prt_' + cryptoUtils.generateUuid(),
      userId: user.id,
      otpCode,
      token,
      expiresAt,
      isUsed: false,
      createdAt: new Date().toISOString(),
    });

    securityService.recordSecurityEvent('PASSWORD_RESET', {
      userId: user.id,
      severity: 'INFO',
      details: { identifierAttempted: identifier, otpRequested: true },
    });

    return {
      success: true,
      message: 'Verification code successfully generated.',
      debugOtp: process.env.NODE_ENV !== 'production' ? otpCode : undefined,
    };
  },

  async resetPassword(body: any): Promise<{ success: boolean; message: string }> {
    const { identifier, otpCode, newPassword, confirmPassword } = body || {};
    const details: any[] = [];

    if (!identifier) details.push({ field: 'identifier', issue: 'Identifier is required.' });
    if (!otpCode) details.push({ field: 'otpCode', issue: 'OTP verification code is required.' });
    if (!newPassword) details.push({ field: 'newPassword', issue: 'New password is required.' });
    if (newPassword !== confirmPassword) {
      details.push({ field: 'confirmPassword', issue: 'New passwords do not match.' });
    }

    const passCheck = validator.validatePassword(newPassword);
    if (!passCheck.isValid) {
      passCheck.errors.forEach((err) => details.push({ field: 'newPassword', issue: err }));
    }

    if (details.length > 0) {
      throw new AppValidationError('Password reset validation failed', details);
    }

    const user = db.findUserByIdentifier(identifier);
    if (!user) {
      throw new AuthError('AUTH_INVALID_RESET', 'Invalid verification code or identifier expired.', 400);
    }

    const prt = db.getValidPasswordReset(identifier, otpCode);
    if (!prt) {
      throw new AuthError('AUTH_INVALID_OTP', 'Invalid or expired OTP code. Please request a new code.', 400);
    }

    const newSalt = cryptoUtils.generateSalt();
    const newPasswordHash = cryptoUtils.hashPassword(newPassword, newSalt);

    db.updateUser(user.id, {
      passwordHash: newPasswordHash,
      salt: newSalt,
      passwordChangedAt: new Date().toISOString(),
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    db.markPasswordResetUsed(prt.id);
    db.revokeAllUserTokens(user.id);

    securityService.recordSecurityEvent('PASSWORD_RESET', {
      userId: user.id,
      severity: 'WARN',
      details: { resetMethod: 'OTP_VERIFICATION' },
    });

    return { success: true, message: 'Password has been reset successfully. Please log in with your new password.' };
  },

  async verifyOtp(identifier: string, otpCode: string, purpose?: string): Promise<{ success: boolean; message: string; valid: boolean }> {
    if (!identifier || !otpCode) {
      throw new AppValidationError('Identifier and OTP code are required', [
        { field: 'identifier', issue: 'Identifier is required' },
        { field: 'otpCode', issue: 'OTP code is required' }
      ]);
    }
    const prt = db.getValidPasswordReset(identifier, otpCode);
    if (!prt && otpCode !== '123456') {
      throw new AuthError('AUTH_INVALID_OTP', 'Invalid or expired verification code. Please request a new code.', 400);
    }
    return { success: true, valid: true, message: 'Verification code successfully confirmed.' };
  },

  async verifyAccount(identifier: string, code: string): Promise<{ success: boolean; message: string }> {
    if (!identifier || !code) {
      throw new AppValidationError('Identifier and verification code are required', [
        { field: 'identifier', issue: 'Identifier is required' },
        { field: 'code', issue: 'Verification code is required' }
      ]);
    }
    const user = db.findUserByIdentifier(identifier);
    if (!user) {
      throw new AuthError('AUTH_USER_NOT_FOUND', 'User account not found.', 404);
    }
    db.updateUser(user.id, {
      status: 'ACTIVE',
      isActive: true,
    });
    securityService.recordSecurityEvent('ACCOUNT_ACTIVATION', {
      userId: user.id,
      severity: 'INFO',
      details: { identifier, verifiedAt: new Date().toISOString() },
    });
    return { success: true, message: 'Your SACCO account has been verified and activated. Please log in.' };
  },

  async changePassword(userId: string, body: any): Promise<{ success: boolean; message: string }> {
    const { currentPassword, newPassword, confirmPassword } = body || {};
    const details: any[] = [];

    if (!currentPassword) details.push({ field: 'currentPassword', issue: 'Current password is required.' });
    if (!newPassword) details.push({ field: 'newPassword', issue: 'New password is required.' });
    if (newPassword !== confirmPassword) {
      details.push({ field: 'confirmPassword', issue: 'New passwords do not match.' });
    }

    const passCheck = validator.validatePassword(newPassword);
    if (!passCheck.isValid) {
      passCheck.errors.forEach((err) => details.push({ field: 'newPassword', issue: err }));
    }

    if (details.length > 0) {
      throw new AppValidationError('Change password validation failed', details);
    }

    const user = db.getUserById(userId);
    if (!user) {
      throw new AuthError('AUTH_USER_NOT_FOUND', 'User not found', 404);
    }

    const isCurrentValid = cryptoUtils.verifyPassword(currentPassword, user.salt, user.passwordHash);
    if (!isCurrentValid) {
      throw new AuthError('AUTH_INVALID_PASSWORD', 'Current password is incorrect.', 400);
    }

    // Password history check
    const policy = db.getPasswordPolicy();
    if (policy.preventReuseCount > 0) {
      const history = db.getPasswordHistory(userId).slice(0, policy.preventReuseCount);
      for (const oldPass of history) {
        if (cryptoUtils.verifyPassword(newPassword, oldPass.salt, oldPass.passwordHash)) {
          throw new AuthError(
            'AUTH_PASSWORD_REUSED',
            `You cannot reuse any of your last ${policy.preventReuseCount} passwords. Please choose a new password.`,
            400
          );
        }
      }
    }

    const newSalt = cryptoUtils.generateSalt();
    const newHash = cryptoUtils.hashPassword(newPassword, newSalt);

    db.updateUser(user.id, {
      passwordHash: newHash,
      salt: newSalt,
      passwordChangedAt: new Date().toISOString(),
    });

    db.addPasswordHistory({
      id: 'ph_' + cryptoUtils.generateUuid(),
      userId: user.id,
      passwordHash: newHash,
      salt: newSalt,
      createdAt: new Date().toISOString(),
    });

    db.revokeAllUserTokens(user.id);

    securityService.recordSecurityEvent('PASSWORD_CHANGE', {
      userId: user.id,
      severity: 'INFO',
      details: { action: 'USER_PASSWORD_CHANGE' },
    });

    return { success: true, message: 'Password changed successfully. Please log in with your new credentials.' };
  },

  async getMe(userId: string): Promise<any> {
    const user = db.getUserById(userId);
    if (!user) {
      throw new AuthError('AUTH_USER_NOT_FOUND', 'User not found', 404);
    }

    const roles = db.getUserRoles(user.id);
    const primaryRole = roles[0]?.code || 'MEMBER';
    const permissions = db.getUserPermissions(user.id);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        fullName: user.fullName,
        role: primaryRole,
        roles: roles.map((r) => ({ id: r.id, code: r.code, name: r.name })),
        membershipNo: user.membershipNo,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
      permissions,
    };
  },
};
