import { RoleCode } from './auth';
import { PermissionCode } from './rbac';

export type PortalType = 'PUBLIC' | 'AUTH' | 'STAFF' | 'MEMBER';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  iconName?: string;
  icon?: string;
  badge?: string | number;
  badgeVariant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
  requiredPermission?: PermissionCode;
  allowedRoles?: RoleCode[];
  children?: NavItem[];
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}
