import { useAuth } from '../providers/AuthProvider';
import { PermissionCode } from '../types/rbac';
import { RoleCode } from '../types/auth';

export function usePermission() {
  const { hasPermission, hasRole, user, permissions } = useAuth();

  return {
    can: (permission: PermissionCode | string) => hasPermission(permission),
    isRole: (role: RoleCode | RoleCode[]) => hasRole(role),
    currentRole: user?.role,
    allPermissions: permissions,
  };
}
