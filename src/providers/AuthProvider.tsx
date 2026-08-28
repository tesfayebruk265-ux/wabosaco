import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, RoleCode, AuthState, LoginCredentials, LoginResult, AuthTokens } from '../types/auth';
import { PermissionCode } from '../types/rbac';
import { authService } from '../services/authService';
import { rbacManagementService } from '../services/rbacManagementService';
import { ROLES } from '../constants/roles';
import { useToast } from './ToastProvider';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<LoginResult>;
  verifyMfa: (mfaToken: string, mfaCode: string) => Promise<{ user: User }>;
  logout: () => void;
  switchRole: (role: RoleCode) => Promise<void>;
  setSession: (user: User, tokens: AuthTokens, permissions: string[]) => void;
  hasPermission: (permission: PermissionCode | string) => boolean;
  hasRole: (roles: RoleCode | RoleCode[]) => boolean;
  refreshPermissions: (roleOverride?: string) => Promise<void>;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser());
  const [tokens, setTokens] = useState<AuthTokens | null>(() => authService.getCurrentTokens());
  const [permissions, setPermissions] = useState<string[]>(() => authService.getCurrentPermissions());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { info, success } = useToast();

  const refreshPermissions = useCallback(async (roleOverride?: string) => {
    try {
      const activeRole = roleOverride || user?.role;
      if (!activeRole) return;

      const rolesRes = await rbacManagementService.getRoles();
      if (rolesRes.success && Array.isArray(rolesRes.data)) {
        const found = rolesRes.data.find(
          (r) => r.code.toUpperCase() === activeRole.toUpperCase() || r.id === activeRole
        );
        if (found && Array.isArray(found.permissions)) {
          setPermissions(found.permissions);
          authService.setStoredPermissions(found.permissions);
        }
      }
    } catch (err) {
      console.warn('Silent refresh of RBAC permissions failed:', err);
    }
  }, [user?.role]);

  // Listen for real-time permission updates dispatched from anywhere in the application
  useEffect(() => {
    const handlePermissionUpdate = (e: any) => {
      const targetRole = e?.detail?.roleCode;
      refreshPermissions(targetRole);
    };

    window.addEventListener('wabi:permissions_updated', handlePermissionUpdate);
    return () => {
      window.removeEventListener('wabi:permissions_updated', handlePermissionUpdate);
    };
  }, [refreshPermissions]);

  const login = async (credentials: LoginCredentials): Promise<LoginResult> => {
    setIsLoading(true);
    try {
      const res = await authService.login(credentials);
      if (res.user && res.tokens) {
        setUser(res.user);
        setTokens(res.tokens);
        setPermissions(res.permissions || []);
        success('Authentication Successful', `Welcome back, ${res.user.fullName}`);
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyMfa = async (mfaToken: string, mfaCode: string): Promise<{ user: User }> => {
    setIsLoading(true);
    try {
      const res = await authService.verifyMfa(mfaToken, mfaCode);
      setUser(res.user);
      setTokens(res.tokens);
      setPermissions(res.permissions || []);
      success('Two-Factor Authentication Confirmed', `Welcome back, ${res.user.fullName}`);
      return { user: res.user };
    } finally {
      setIsLoading(false);
    }
  };

  const setSession = (newUser: User, newTokens: AuthTokens, newPermissions: string[]) => {
    setUser(newUser);
    setTokens(newTokens);
    setPermissions(newPermissions);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setTokens(null);
    setPermissions([]);
    info('Session Ended', 'You have been safely signed out.');
  };

  const switchRole = async (newRole: RoleCode) => {
    setIsLoading(true);
    try {
      const res = await authService.switchRole(newRole);
      setUser(res.user);
      setTokens(res.tokens);
      setPermissions(res.permissions);
      // Also fetch live dynamic permissions from the roles database
      await refreshPermissions(newRole);
      success('Role Context Switched', `Active Profile: ${ROLES[newRole]?.name || newRole}`);
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = useCallback((permission: PermissionCode | string): boolean => {
    if (!user) return false;
    // System Administrators possess omnipotent platform access
    if (['ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(user.role.toUpperCase())) {
      return true;
    }
    return permissions.includes(permission);
  }, [user, permissions]);

  const hasRole = useCallback((roles: RoleCode | RoleCode[]): boolean => {
    if (!user) return false;
    const roleList = Array.isArray(roles) ? roles : [roles];
    return roleList.includes(user.role);
  }, [user]);

  const isStaff = user ? user.role !== 'MEMBER' : false;

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        isAuthenticated: !!user,
        isLoading,
        permissions,
        login,
        verifyMfa,
        logout,
        switchRole,
        setSession,
        hasPermission,
        hasRole,
        refreshPermissions,
        isStaff,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
