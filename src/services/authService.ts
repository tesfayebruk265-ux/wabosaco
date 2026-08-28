import { User, LoginCredentials, AuthTokens, RoleCode, AuthResponse, LoginResult } from '../types/auth';
import { ROLES } from '../constants/roles';
import { storage } from '../utils/storage';
import { apiClient } from './apiClient';

export const DEMO_CREDENTIALS: Record<RoleCode, { username: string; password: string; name: string }> = {
  ADMIN: {
    username: 'admin.sacco',
    password: 'AdminPassword123!',
    name: 'Yohannes Girma (System Admin)',
  },
  MANAGER: {
    username: 'manager.alemu',
    password: 'ManagerPassword123!',
    name: 'Alemu Tadesse (General Manager)',
  },
  ACCOUNTANT: {
    username: 'acct.dawit',
    password: 'AccountantPassword123!',
    name: 'Dawit Kebede (Senior Accountant / Teller)',
  },
  AUDITOR: {
    username: 'auditor.tigist',
    password: 'AuditorPassword123!',
    name: 'Tigist Mengistu (Chief Internal Auditor)',
  },
  CUSTOMER_SERVICE: {
    username: 'cs.selam',
    password: 'CustomerService123!',
    name: 'Selamawit Bekele (Member Care Officer)',
  },
  MEMBER: {
    username: 'WB000143',
    password: 'MemberPassword123!',
    name: 'Abebe Bikila Wolde',
  },
};

// Fallback demo profiles for initial rendering or offline support
export const DEMO_PROFILES: Record<RoleCode, { user: User; tokens: AuthTokens; password: string }> = {
  ADMIN: {
    password: 'AdminPassword123!',
    user: {
      id: 'usr_admin_1',
      username: 'admin.sacco',
      email: 'admin@wabisacco.et',
      fullName: 'Yohannes Girma (System Admin)',
      role: 'ADMIN',
      isActive: true,
      phoneNumber: '+251911223344',
      createdAt: '2025-01-10T08:00:00Z',
      lastLoginAt: '2026-08-14T09:15:00Z',
    },
    tokens: {
      accessToken: 'demo_jwt_admin_token',
      refreshToken: 'demo_refresh_admin_token',
      tokenType: 'Bearer',
      expiresIn: 3600,
    },
  },
  MANAGER: {
    password: 'ManagerPassword123!',
    user: {
      id: 'usr_manager_1',
      username: 'manager.alemu',
      email: 'alemu.t@wabisacco.et',
      fullName: 'Alemu Tadesse (General Manager)',
      role: 'MANAGER',
      isActive: true,
      phoneNumber: '+251922334455',
      createdAt: '2025-01-15T08:00:00Z',
      lastLoginAt: '2026-08-14T10:00:00Z',
    },
    tokens: {
      accessToken: 'demo_jwt_manager_token',
      refreshToken: 'demo_refresh_manager_token',
      tokenType: 'Bearer',
      expiresIn: 3600,
    },
  },
  ACCOUNTANT: {
    password: 'AccountantPassword123!',
    user: {
      id: 'usr_acct_1',
      username: 'acct.dawit',
      email: 'dawit.k@wabisacco.et',
      fullName: 'Dawit Kebede (Senior Accountant / Teller)',
      role: 'ACCOUNTANT',
      isActive: true,
      phoneNumber: '+251933445566',
      createdAt: '2025-02-01T08:00:00Z',
      lastLoginAt: '2026-08-14T11:30:00Z',
    },
    tokens: {
      accessToken: 'demo_jwt_accountant_token',
      refreshToken: 'demo_refresh_accountant_token',
      tokenType: 'Bearer',
      expiresIn: 3600,
    },
  },
  AUDITOR: {
    password: 'AuditorPassword123!',
    user: {
      id: 'usr_auditor_1',
      username: 'auditor.tigist',
      email: 'tigist.m@wabisacco.et',
      fullName: 'Tigist Mengistu (Chief Internal Auditor)',
      role: 'AUDITOR',
      isActive: true,
      phoneNumber: '+251944556677',
      createdAt: '2025-02-10T08:00:00Z',
      lastLoginAt: '2026-08-14T08:45:00Z',
    },
    tokens: {
      accessToken: 'demo_jwt_auditor_token',
      refreshToken: 'demo_refresh_auditor_token',
      tokenType: 'Bearer',
      expiresIn: 3600,
    },
  },
  CUSTOMER_SERVICE: {
    password: 'CustomerService123!',
    user: {
      id: 'usr_cs_1',
      username: 'cs.selam',
      email: 'selamawit.b@wabisacco.et',
      fullName: 'Selamawit Bekele (Member Care Officer)',
      role: 'CUSTOMER_SERVICE',
      isActive: true,
      phoneNumber: '+251955667788',
      createdAt: '2025-03-01T08:00:00Z',
      lastLoginAt: '2026-08-14T11:00:00Z',
    },
    tokens: {
      accessToken: 'demo_jwt_cs_token',
      refreshToken: 'demo_refresh_cs_token',
      tokenType: 'Bearer',
      expiresIn: 3600,
    },
  },
  MEMBER: {
    password: 'MemberPassword123!',
    user: {
      id: 'usr_member_143',
      username: 'WB000143',
      email: 'abebe.bikila@gmail.com',
      fullName: 'Abebe Bikila Wolde',
      membershipNo: 'WB000143',
      role: 'MEMBER',
      isActive: true,
      phoneNumber: '+251911998877',
      createdAt: '2025-04-12T09:00:00Z',
      lastLoginAt: '2026-08-14T12:00:00Z',
    },
    tokens: {
      accessToken: 'demo_jwt_member_token',
      refreshToken: 'demo_refresh_member_token',
      tokenType: 'Bearer',
      expiresIn: 3600,
    },
  },
};

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', {
        identifier: credentials.username,
        password: credentials.password,
        mfaCode: credentials.mfaCode,
      });

      if (response.data.mfaRequired) {
        return {
          mfaRequired: true,
          mfaToken: response.data.mfaToken,
          methods: response.data.methods,
          preferredMethod: response.data.preferredMethod,
          destinationMasked: response.data.destinationMasked,
        };
      }

      const user = response.data.user!;
      const tokens: AuthTokens = {
        accessToken: response.data.accessToken!,
        refreshToken: response.data.refreshToken!,
        tokenType: 'Bearer',
        expiresIn: response.data.expiresIn || 3600,
      };
      const permissions = response.data.permissions || (ROLES[user.role]?.permissions as string[]) || [];

      storage.set('user', user);
      storage.set('tokens', tokens);
      storage.set('permissions', permissions);

      return { user, tokens, permissions };
    } catch (err) {
      console.warn('API login failed, falling back to local demo profile if applicable:', err);
      // If offline or network error, verify against DEMO_CREDENTIALS for instant UI preview
      const matchedRole = (Object.keys(DEMO_CREDENTIALS) as RoleCode[]).find(
        (role) =>
          DEMO_CREDENTIALS[role].username.toLowerCase() === credentials.username.trim().toLowerCase()
      );

      if (matchedRole && DEMO_CREDENTIALS[matchedRole].password === credentials.password) {
        const profile = DEMO_PROFILES[matchedRole];
        const permissions = (ROLES[profile.user.role]?.permissions || []) as string[];
        storage.set('user', profile.user);
        storage.set('tokens', profile.tokens);
        storage.set('permissions', permissions);
        return { user: profile.user, tokens: profile.tokens, permissions };
      }

      throw err;
    }
  },

  async verifyMfa(mfaToken: string, mfaCode: string): Promise<{ user: User; tokens: AuthTokens; permissions: string[] }> {
    const response = await apiClient.post<AuthResponse>('/auth/mfa/verify', {
      mfaToken,
      mfaCode,
    });

    const user = response.data.user!;
    const tokens: AuthTokens = {
      accessToken: response.data.accessToken!,
      refreshToken: response.data.refreshToken!,
      tokenType: 'Bearer',
      expiresIn: response.data.expiresIn || 3600,
    };
    const permissions = response.data.permissions || (ROLES[user.role]?.permissions as string[]) || [];

    storage.set('user', user);
    storage.set('tokens', tokens);
    storage.set('permissions', permissions);

    return { user, tokens, permissions };
  },

  async requestLoginOtp(mfaToken: string, method: 'SMS_OTP' | 'EMAIL_OTP'): Promise<{ success: boolean; destinationMasked: string; message: string }> {
    const res = await apiClient.post<{ success: boolean; data: { destinationMasked: string; message: string }; message: string }>('/auth/mfa/request-otp', {
      mfaToken,
      method,
    });
    return {
      success: true,
      destinationMasked: res.data?.destinationMasked || '',
      message: res.message || 'Verification code sent',
    };
  },

  async verifyOtp(
    param1: string | { identifier: string; otp?: string; otpCode?: string; purpose?: string },
    param2?: string,
    purpose?: string
  ): Promise<{ success: boolean; message: string; valid: boolean }> {
    let identifier = '';
    let otpCode = '';
    let purp = purpose;

    if (typeof param1 === 'object') {
      identifier = param1.identifier;
      otpCode = param1.otpCode || param1.otp || '';
      purp = param1.purpose || purpose;
    } else {
      identifier = param1;
      otpCode = param2 || '';
    }

    return apiClient.post<{ success: boolean; message: string; data?: { valid: boolean } }>('/auth/verify-otp', {
      identifier,
      otpCode,
      purpose: purp,
    }).then(res => ({
      success: true,
      message: res.message,
      valid: res.data?.valid ?? true,
    }));
  },

  async verifyAccount(
    param1: string | { identifier?: string; code?: string; token?: string },
    param2?: string
  ): Promise<{ success: boolean; message: string }> {
    let identifier = 'member_portal';
    let code = 'verified';

    if (typeof param1 === 'object') {
      identifier = param1.identifier || 'member_portal';
      code = param1.code || param1.token || 'verified';
    } else {
      identifier = param1;
      code = param2 || 'verified';
    }

    return apiClient.post<{ success: boolean; message: string }>('/auth/verify-account', {
      identifier,
      code,
    });
  },

  async switchRole(role: RoleCode): Promise<{ user: User; tokens: AuthTokens; permissions: string[] }> {
    const creds = DEMO_CREDENTIALS[role];
    try {
      const res = await this.login({ username: creds.username, password: creds.password });
      if (res.user && res.tokens) {
        return { user: res.user, tokens: res.tokens, permissions: res.permissions || [] };
      }
      throw new Error('MFA triggered during demo switch');
    } catch {
      const profile = DEMO_PROFILES[role];
      const permissions = (ROLES[profile.user.role]?.permissions || []) as string[];
      storage.set('user', profile.user);
      storage.set('tokens', profile.tokens);
      storage.set('permissions', permissions);
      return { user: profile.user, tokens: profile.tokens, permissions };
    }
  },

  async refreshToken(): Promise<{ accessToken: string; refreshToken: string } | null> {
    const currentTokens = this.getCurrentTokens();
    if (!currentTokens?.refreshToken) return null;

    try {
      const res = await apiClient.post<AuthResponse>('/auth/refresh', {
        refreshToken: currentTokens.refreshToken,
      });
      const newTokens: AuthTokens = {
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
        tokenType: 'Bearer',
        expiresIn: res.data.expiresIn,
      };
      storage.set('tokens', newTokens);
      if (res.data.user) storage.set('user', res.data.user);
      if (res.data.permissions) storage.set('permissions', res.data.permissions);
      return newTokens;
    } catch {
      this.logout();
      return null;
    }
  },

  async forgotPassword(identifier: string): Promise<{ success: boolean; message: string; debugOtp?: string }> {
    return apiClient.post<{ success: boolean; message: string; data?: { debugOtp?: string } }>('/auth/forgot-password', { identifier })
      .then((res) => ({ success: true, message: res.message, debugOtp: res.data?.debugOtp }));
  },

  async requestPasswordReset(identifier: string): Promise<{ success: boolean; message: string; debugOtp?: string }> {
    return this.forgotPassword(identifier);
  },

  async resetPassword(data: {
    identifier?: string;
    token?: string;
    otpCode?: string;
    newPassword: string;
    confirmPassword?: string;
  }): Promise<{ success: boolean; message: string }> {
    const payload = {
      identifier: data.identifier || sessionStorage.getItem('wabi_reset_identifier') || 'WB000143',
      otpCode: data.otpCode || data.token || '123456',
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword || data.newPassword,
    };
    return apiClient.post<{ success: boolean; message: string }>('/auth/reset-password', payload);
  },

  async changePassword(data: { currentPassword: string; newPassword: string; confirmPassword: string }): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>('/auth/change-password', data);
  },

  getCurrentUser(): User | null {
    return storage.get<User | null>('user', null);
  },

  getCurrentTokens(): AuthTokens | null {
    return storage.get<AuthTokens | null>('tokens', null);
  },

  getCurrentPermissions(): string[] {
    const user = this.getCurrentUser();
    if (!user) return [];
    const storedPerms = storage.get<string[]>('permissions', []);
    if (storedPerms.length > 0) return storedPerms;
    return (ROLES[user.role]?.permissions || []) as string[];
  },

  setStoredPermissions(permissions: string[]): void {
    storage.set('permissions', permissions);
  },

  async logout(): Promise<void> {
    const currentTokens = this.getCurrentTokens();
    if (currentTokens?.refreshToken) {
      try {
        await apiClient.post('/auth/logout', { refreshToken: currentTokens.refreshToken });
      } catch {
        // silent fail on logout network issues
      }
    }
    storage.remove('user');
    storage.remove('tokens');
    storage.remove('permissions');
  },
};

