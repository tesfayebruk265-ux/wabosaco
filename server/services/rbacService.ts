import { db } from '../db/database';
import { DbRole, DbPermission } from '../db/schema';
import { cryptoUtils } from '../utils/crypto';
import { AppValidationError } from '../utils/validator';
import { AuthError } from './authService';
import { securityService } from './securityService';

export const rbacService = {
  getRoles(): any[] {
    const roles = db.getRoles();
    return roles.map((r) => {
      const perms = db.getPermissionsByRoleId(r.id);
      return {
        ...r,
        permissions: perms.map((p) => p.code),
        permissionsList: perms,
      };
    });
  },

  getRoleById(idOrCode: string): any {
    const role = db.getRoleById(idOrCode);
    if (!role) {
      throw new AuthError('ROLE_NOT_FOUND', `Role ${idOrCode} not found`, 404);
    }
    const perms = db.getPermissionsByRoleId(role.id);
    return {
      ...role,
      permissions: perms.map((p) => p.code),
      permissionsList: perms,
    };
  },

  createRole(
    body: any,
    actor?: { id: string; name: string; role: string }
  ): any {
    const { code, name, description, portalPrefix, permissions } = body || {};
    const details: any[] = [];

    if (!code || typeof code !== 'string') details.push({ field: 'code', issue: 'Role code is required.' });
    if (!name || typeof name !== 'string') details.push({ field: 'name', issue: 'Role name is required.' });

    if (details.length > 0) {
      throw new AppValidationError('Role validation failed', details);
    }

    const cleanCode = (code as string).trim().toUpperCase();
    if (db.getRoleById(cleanCode)) {
      throw new AppValidationError('Role code already exists', [{ field: 'code', issue: 'Role code is already taken' }]);
    }

    const newRole: DbRole = {
      id: 'role_' + cryptoUtils.generateUuid(),
      code: cleanCode as any,
      name: (name as string).trim(),
      description: (description || '').trim(),
      portalPrefix: portalPrefix || '/staff',
      isSystem: false,
      createdAt: new Date().toISOString(),
    };

    db.createRole(newRole);

    if (Array.isArray(permissions) && permissions.length > 0) {
      const allPerms = db.getPermissions();
      const permIds = permissions
        .map((pCode) => allPerms.find((p) => p.code === pCode || p.id === pCode)?.id)
        .filter((id): id is string => !!id);
      db.setRolePermissions(newRole.id, permIds);
    }

    if (actor) {
      securityService.recordAuditLog(actor, 'CREATE_ROLE', 'roles', newRole.id, {
        afterState: { code: newRole.code, name: newRole.name },
      });
      securityService.recordSecurityEvent('ROLE_CHANGE', {
        actorId: actor.id,
        severity: 'INFO',
        details: { action: 'CREATED_CUSTOM_ROLE', roleCode: newRole.code },
      });
    }

    return this.getRoleById(newRole.id);
  },

  updateRole(
    idOrCode: string,
    body: any,
    actor?: { id: string; name: string; role: string }
  ): any {
    const role = db.getRoleById(idOrCode);
    if (!role) {
      throw new AuthError('ROLE_NOT_FOUND', `Role ${idOrCode} not found`, 404);
    }

    const updates: Partial<DbRole> = {};
    if (body.name && typeof body.name === 'string') updates.name = body.name.trim();
    if (body.description !== undefined) updates.description = body.description;
    if (body.portalPrefix) updates.portalPrefix = body.portalPrefix;

    db.updateRole(role.id, updates);

    if (Array.isArray(body.permissions)) {
      const allPerms = db.getPermissions();
      const permIds = body.permissions
        .map((pCode: string) => allPerms.find((p) => p.code === pCode || p.id === pCode)?.id)
        .filter((id: string | undefined): id is string => !!id);
      db.setRolePermissions(role.id, permIds);
    }

    if (actor) {
      securityService.recordAuditLog(actor, 'UPDATE_ROLE', 'roles', role.id, {
        afterState: { ...updates, permissions: body.permissions },
      });
      securityService.recordSecurityEvent('PERMISSION_CHANGE', {
        actorId: actor.id,
        severity: 'WARN',
        details: { roleCode: role.code, permissionsCount: body.permissions?.length },
      });
    }

    return this.getRoleById(role.id);
  },

  deleteRole(
    idOrCode: string,
    actor?: { id: string; name: string; role: string }
  ): { success: boolean; message: string } {
    const role = db.getRoleById(idOrCode);
    if (!role) {
      throw new AuthError('ROLE_NOT_FOUND', `Role ${idOrCode} not found`, 404);
    }

    if (role.isSystem) {
      throw new AuthError('SYSTEM_ROLE_PROTECTED', 'System default roles (ADMIN, MANAGER, etc.) cannot be deleted.', 403);
    }

    db.deleteRole(role.id);

    if (actor) {
      securityService.recordAuditLog(actor, 'DELETE_ROLE', 'roles', role.id, {
        beforeState: { code: role.code, name: role.name },
      });
    }

    return { success: true, message: `Role ${role.code} deleted successfully.` };
  },

  getPermissions(): DbPermission[] {
    return db.getPermissions();
  },

  getPermissionById(idOrCode: string): DbPermission {
    const perm = db.getPermissions().find((p) => p.id === idOrCode || p.code === idOrCode);
    if (!perm) {
      throw new AuthError('PERMISSION_NOT_FOUND', `Permission ${idOrCode} not found`, 404);
    }
    return perm;
  },
};
