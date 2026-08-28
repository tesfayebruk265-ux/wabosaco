export type RoleCode = 
  | 'ADMIN'
  | 'MANAGER'
  | 'ACCOUNTANT'
  | 'AUDITOR'
  | 'CUSTOMER_SERVICE'
  | 'MEMBER';

export interface User {
  id: number | string;
  username: string;
  email: string;
  fullName: string;
  role: RoleCode;
  membershipNo?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  isActive: boolean;
  requiresMfa?: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number; // in seconds
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: string[];
}

export interface LoginCredentials {
  username: string;
  password: string;
  mfaCode?: string;
}

export interface AuthResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    accessToken?: string;
    refreshToken?: string;
    tokenType?: string;
    expiresIn?: number;
    user?: User;
    permissions?: string[];
    mfaRequired?: boolean;
    mfaToken?: string;
    methods?: string[];
    preferredMethod?: string;
    destinationMasked?: string;
  };
}

export interface LoginResult {
  mfaRequired?: boolean;
  mfaToken?: string;
  methods?: string[];
  preferredMethod?: string;
  destinationMasked?: string;
  user?: User;
  tokens?: AuthTokens;
  permissions?: string[];
}

export interface ForgotPasswordRequest {
  identifier: string; // phone or email
}

export interface ResetPasswordRequest {
  identifier: string;
  otpCode: string;
  newPassword: string;
  confirmPassword: string;
}
