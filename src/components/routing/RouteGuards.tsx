import React, { useEffect } from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { useNavigation } from '../../providers/NavigationProvider';
import { RoleCode } from '../../types/auth';
import { PermissionCode } from '../../types/rbac';
import { ROUTES } from '../../constants/routes';
import { ShieldAlert, LogIn, ArrowLeft } from 'lucide-react';
import { Button } from '../common/Button';

export const AuthenticatedRoute: React.FC<{ children: React.ReactNode; requiredRole?: RoleCode | RoleCode[] }> = ({
  children,
  requiredRole,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { navigate, currentPath } = useNavigation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Store current path so login can return user here
      sessionStorage.setItem('wabi_auth_return_url', currentPath);
      navigate(ROUTES.AUTH.LOGIN);
    }
  }, [isAuthenticated, isLoading, currentPath, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Verifying session security credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user.role)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black text-slate-900">Access Restricted (403)</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your active role <strong className="text-slate-900">({user.role})</strong> does not possess authorization to view this enterprise workstation module.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  if (user.role === 'MEMBER') navigate(ROUTES.MEMBER.DASHBOARD);
                  else if (user.role === 'ADMIN') navigate(ROUTES.STAFF.ADMIN_DASHBOARD);
                  else if (user.role === 'MANAGER') navigate(ROUTES.STAFF.MANAGER_DASHBOARD);
                  else if (user.role === 'ACCOUNTANT') navigate(ROUTES.STAFF.ACCOUNTANT_DASHBOARD);
                  else if (user.role === 'AUDITOR') navigate(ROUTES.STAFF.AUDITOR_DASHBOARD);
                  else if (user.role === 'CUSTOMER_SERVICE') navigate(ROUTES.STAFF.CS_DASHBOARD);
                  else navigate(ROUTES.PUBLIC.HOME);
                }}
              >
                Return to My Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export const PermissionRoute: React.FC<{
  children: React.ReactNode;
  permissions: PermissionCode | PermissionCode[] | string | string[];
}> = ({ children, permissions }) => {
  const { hasPermission, user } = useAuth();
  const { navigate } = useNavigation();

  const reqList = Array.isArray(permissions) ? permissions : [permissions];
  const hasAccess = reqList.some((perm) => hasPermission(perm));

  if (!hasAccess) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4 max-w-lg mx-auto my-12">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Permission Denied</h3>
        <p className="text-xs text-slate-500">
          Your role credentials lack the required permission code: <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-600 font-mono">{reqList.join(', ')}</code>.
        </p>
        <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.MEMBER.DASHBOARD)}>
          Go Back
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};
