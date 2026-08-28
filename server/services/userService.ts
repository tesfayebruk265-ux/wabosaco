import { db } from '../db/database';
import { DbUser } from '../db/schema';
import { cryptoUtils } from '../utils/crypto';
import { validator, AppValidationError } from '../utils/validator';
import { AuthError } from './authService';
import { securityService } from './securityService';

export const userService = {
  getUsers(options: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}): { users: any[]; pagination: { total: number; page: number; limit: number; totalPages: number } } {
    let list = db.getUsers();

    if (options.search) {
      const q = options.search.toLowerCase().trim();
      list = list.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.membershipNo && u.membershipNo.toLowerCase().includes(q)) ||
          (u.phoneNumber && u.phoneNumber.includes(q))
      );
    }

    if (options.role) {
      const roleFilter = options.role.toUpperCase();
      list = list.filter((u) => {
        const uRoles = db.getUserRoles(u.id);
        return uRoles.some((r) => r.code === roleFilter);
      });
    }

    if (options.status) {
      const statusFilter = options.status.toUpperCase();
      list = list.filter((u) => u.status === statusFilter || (statusFilter === 'ACTIVE' && u.isActive));
    }

    const total = list.length;
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(options.limit) || 20));
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const paged = list.slice(offset, offset + limit);

    const users = paged.map((u) => {
      const roles = db.getUserRoles(u.id);
      return {
        id: u.id,
        username: u.username,
        email: u.email,
        phoneNumber: u.phoneNumber,
        fullName: u.fullName,
        role: roles[0]?.code || 'MEMBER',
        roles: roles.map((r) => ({ id: r.id, code: r.code, name: r.name })),
        status: u.status,
        isActive: u.isActive,
        membershipNo: u.membershipNo,
        avatarUrl: u.avatarUrl,
        failedLoginAttempts: u.failedLoginAttempts,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      };
    });

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  },

  getUserById(id: string): any {
    const user = db.getUserById(id);
    if (!user) {
      throw new AuthError('USER_NOT_FOUND', `User with ID ${id} not found`, 404);
    }
    const roles = db.getUserRoles(user.id);
    const permissions = db.getUserPermissions(user.id);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      fullName: user.fullName,
      role: roles[0]?.code || 'MEMBER',
      roles: roles.map((r) => ({ id: r.id, code: r.code, name: r.name })),
      permissions,
      status: user.status,
      isActive: user.isActive,
      membershipNo: user.membershipNo,
      avatarUrl: user.avatarUrl,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },

  createUser(
    body: any,
    actor?: { id: string; name: string; role: string }
  ): any {
    const validated = validator.validateCreateUserBody(body);

    // Uniqueness checks
    const existingUser = db.getUsers().find(
      (u) =>
        u.username.toLowerCase() === validated.username.toLowerCase() ||
        u.email.toLowerCase() === validated.email.toLowerCase() ||
        (validated.membershipNo && u.membershipNo && u.membershipNo.toLowerCase() === validated.membershipNo.toLowerCase())
    );

    if (existingUser) {
      if (existingUser.username.toLowerCase() === validated.username.toLowerCase()) {
        throw new AppValidationError('Username is already registered.', [{ field: 'username', issue: 'Username is taken' }]);
      }
      if (existingUser.email.toLowerCase() === validated.email.toLowerCase()) {
        throw new AppValidationError('Email is already registered.', [{ field: 'email', issue: 'Email is taken' }]);
      }
      if (validated.membershipNo && existingUser.membershipNo?.toLowerCase() === validated.membershipNo.toLowerCase()) {
        throw new AppValidationError('Membership number already exists.', [{ field: 'membershipNo', issue: 'Duplicate membership number' }]);
      }
    }

    const defaultPassword = validated.password || 'WabiSacco@2026';
    const salt = cryptoUtils.generateSalt();
    const passwordHash = cryptoUtils.hashPassword(defaultPassword, salt);
    const now = new Date().toISOString();
    const newUserId = 'usr_' + cryptoUtils.generateUuid();

    const newUser: DbUser = {
      id: newUserId,
      username: validated.username,
      email: validated.email,
      phoneNumber: validated.phoneNumber,
      fullName: validated.fullName,
      passwordHash,
      salt,
      status: 'ACTIVE',
      isActive: true,
      membershipNo: validated.membershipNo,
      avatarUrl: body.avatarUrl,
      failedLoginAttempts: 0,
      lockedUntil: null,
      passwordChangedAt: now,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    };

    db.createUser(newUser);

    // Assign Role
    const targetRole = db.getRoles().find((r) => r.code === validated.role) || db.getRoles().find((r) => r.code === 'MEMBER');
    if (targetRole) {
      db.assignUserRole(newUserId, targetRole.id, actor?.id || 'SYSTEM');
    }

    if (actor) {
      securityService.recordAuditLog(actor, 'CREATE_USER', 'users', newUserId, {
        afterState: { username: validated.username, role: validated.role, email: validated.email },
      });
      securityService.recordSecurityEvent('ROLE_CHANGE', {
        userId: newUserId,
        actorId: actor.id,
        severity: 'INFO',
        details: { action: 'INITIAL_ROLE_ASSIGNMENT', role: targetRole?.code },
      });
    }

    return this.getUserById(newUserId);
  },

  updateUser(
    id: string,
    body: any,
    actor?: { id: string; name: string; role: string }
  ): any {
    const user = db.getUserById(id);
    if (!user) {
      throw new AuthError('USER_NOT_FOUND', `User with ID ${id} not found`, 404);
    }

    const updates: Partial<DbUser> = {};
    if (body.fullName && typeof body.fullName === 'string') updates.fullName = body.fullName.trim();
    if (body.phoneNumber && validator.isValidPhone(body.phoneNumber)) updates.phoneNumber = body.phoneNumber.trim();
    if (body.avatarUrl) updates.avatarUrl = body.avatarUrl;
    if (body.email && validator.isValidEmail(body.email)) {
      const emailConflict = db.getUsers().find((u) => u.id !== id && u.email.toLowerCase() === body.email.trim().toLowerCase());
      if (emailConflict) {
        throw new AppValidationError('Email already in use by another account.', [{ field: 'email', issue: 'Email conflict' }]);
      }
      updates.email = body.email.trim().toLowerCase();
    }
    if (body.status && ['ACTIVE', 'DEACTIVATED', 'LOCKED', 'PENDING_VERIFICATION'].includes(body.status)) {
      updates.status = body.status;
      updates.isActive = body.status === 'ACTIVE';
    }
    if (body.password && typeof body.password === 'string' && body.password.length >= 6) {
      const salt = user.salt || cryptoUtils.generateSalt();
      updates.salt = salt;
      updates.passwordHash = cryptoUtils.hashPassword(body.password, salt);
    }

    // Update role assignment in userRoles table if role is specified
    if (body.role && typeof body.role === 'string') {
      const newRole = db.getRoleById(body.role);
      if (newRole) {
        db.setUserRoles(id, [newRole.id], actor?.id);
      }
    }

    const beforeState = { ...user };
    const updated = db.updateUser(id, updates);

    if (actor) {
      securityService.recordAuditLog(actor, 'UPDATE_USER', 'users', id, {
        beforeState: { fullName: beforeState.fullName, email: beforeState.email, phoneNumber: beforeState.phoneNumber, status: beforeState.status },
        afterState: { ...updates, role: body.role },
      });
    }

    return this.getUserById(id);
  },

  activateUser(id: string, actor?: { id: string; name: string; role: string }): any {
    const user = db.getUserById(id);
    if (!user) {
      throw new AuthError('USER_NOT_FOUND', `User with ID ${id} not found`, 404);
    }

    db.updateUser(id, {
      status: 'ACTIVE',
      isActive: true,
      lockedUntil: null,
      failedLoginAttempts: 0,
    });

    if (actor) {
      securityService.recordAuditLog(actor, 'ACTIVATE_USER', 'users', id, {
        beforeState: { status: user.status, isActive: user.isActive },
        afterState: { status: 'ACTIVE', isActive: true },
      });
      securityService.recordSecurityEvent('ACCOUNT_ACTIVATION', {
        userId: id,
        actorId: actor.id,
        severity: 'INFO',
      });
    }

    return this.getUserById(id);
  },

  deactivateUser(id: string, actor?: { id: string; name: string; role: string }): any {
    const user = db.getUserById(id);
    if (!user) {
      throw new AuthError('USER_NOT_FOUND', `User with ID ${id} not found`, 404);
    }

    // Safety mechanism: Check if this user is the last active Administrator
    const userRoles = db.getUserRoles(id);
    const isAdmin = userRoles.some((r) => r.code === 'ADMIN');
    if (isAdmin && user.isActive && db.countActiveAdmins() <= 1) {
      throw new AuthError(
        'SAFETY_LAST_ADMIN_PROTECTION',
        'Cannot deactivate the last remaining active System Administrator in the organization.',
        403
      );
    }

    db.updateUser(id, {
      status: 'DEACTIVATED',
      isActive: false,
    });

    db.revokeAllUserTokens(id);

    if (actor) {
      securityService.recordAuditLog(actor, 'DEACTIVATE_USER', 'users', id, {
        beforeState: { status: user.status, isActive: user.isActive },
        afterState: { status: 'DEACTIVATED', isActive: false },
      });
      securityService.recordSecurityEvent('ACCOUNT_DEACTIVATION', {
        userId: id,
        actorId: actor.id,
        severity: 'WARN',
      });
    }

    return this.getUserById(id);
  },

  deleteUser(id: string, actor?: { id: string; name: string; role: string }): { success: boolean; message: string } {
    const user = db.getUserById(id);
    if (!user) {
      throw new AuthError('USER_NOT_FOUND', `User with ID ${id} not found`, 404);
    }

    // Safety check
    const userRoles = db.getUserRoles(id);
    const isAdmin = userRoles.some((r) => r.code === 'ADMIN');
    if (isAdmin && user.isActive && db.countActiveAdmins() <= 1) {
      throw new AuthError(
        'SAFETY_LAST_ADMIN_PROTECTION',
        'Cannot delete the last remaining active System Administrator in the organization.',
        403
      );
    }

    db.deleteUser(id);
    db.revokeAllUserTokens(id);

    if (actor) {
      securityService.recordAuditLog(actor, 'DELETE_USER', 'users', id, {
        beforeState: { username: user.username, email: user.email },
      });
    }

    return { success: true, message: `User ${user.username} successfully deleted.` };
  },

  adminResetPassword(
    id: string,
    newPassword?: string,
    actor?: { id: string; name: string; role: string }
  ): { success: boolean; message: string; temporaryPassword?: string } {
    const user = db.getUserById(id);
    if (!user) {
      throw new AuthError('USER_NOT_FOUND', `User with ID ${id} not found`, 404);
    }

    const passToUse = newPassword || 'WabiReset@' + Math.floor(1000 + Math.random() * 9000);
    const passVal = validator.validatePassword(passToUse);
    if (!passVal.isValid) {
      throw new AppValidationError('Password policy violation', passVal.errors.map((e) => ({ issue: e })));
    }

    const salt = cryptoUtils.generateSalt();
    const hash = cryptoUtils.hashPassword(passToUse, salt);

    db.updateUser(id, {
      passwordHash: hash,
      salt,
      passwordChangedAt: new Date().toISOString(),
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    db.revokeAllUserTokens(id);

    if (actor) {
      securityService.recordAuditLog(actor, 'ADMIN_RESET_PASSWORD', 'users', id);
      securityService.recordSecurityEvent('PASSWORD_RESET', {
        userId: id,
        actorId: actor.id,
        severity: 'WARN',
        details: { resetBy: 'ADMINISTRATOR' },
      });
    }

    return {
      success: true,
      message: 'Password successfully updated by administrator.',
      temporaryPassword: !newPassword ? passToUse : undefined,
    };
  },

  assignRole(
    userId: string,
    roleIdOrCode: string,
    actor?: { id: string; name: string; role: string }
  ): any {
    const user = db.getUserById(userId);
    if (!user) {
      throw new AuthError('USER_NOT_FOUND', `User with ID ${userId} not found`, 404);
    }

    const role = db.getRoleById(roleIdOrCode);
    if (!role) {
      throw new AuthError('ROLE_NOT_FOUND', `Role ${roleIdOrCode} does not exist`, 404);
    }

    db.assignUserRole(userId, role.id, actor?.id || 'SYSTEM');

    if (actor) {
      securityService.recordAuditLog(actor, 'ASSIGN_ROLE', 'user_roles', `${userId}:${role.id}`, {
        afterState: { roleCode: role.code, roleName: role.name },
      });
      securityService.recordSecurityEvent('ROLE_CHANGE', {
        userId,
        actorId: actor.id,
        severity: 'INFO',
        details: { assignedRole: role.code },
      });
    }

    return this.getUserById(userId);
  },

  removeRole(
    userId: string,
    roleIdOrCode: string,
    actor?: { id: string; name: string; role: string }
  ): any {
    const user = db.getUserById(userId);
    if (!user) {
      throw new AuthError('USER_NOT_FOUND', `User with ID ${userId} not found`, 404);
    }

    const role = db.getRoleById(roleIdOrCode);
    if (!role) {
      throw new AuthError('ROLE_NOT_FOUND', `Role ${roleIdOrCode} does not exist`, 404);
    }

    // Safety check: Cannot remove admin role from last active admin
    if (role.code === 'ADMIN' && user.isActive && db.countActiveAdmins() <= 1) {
      throw new AuthError(
        'SAFETY_LAST_ADMIN_PROTECTION',
        'Cannot remove Administrator role from the last active Administrator.',
        403
      );
    }

    db.removeUserRole(userId, role.id);

    if (actor) {
      securityService.recordAuditLog(actor, 'REMOVE_ROLE', 'user_roles', `${userId}:${role.id}`, {
        beforeState: { roleCode: role.code },
      });
      securityService.recordSecurityEvent('ROLE_CHANGE', {
        userId,
        actorId: actor.id,
        severity: 'WARN',
        details: { removedRole: role.code },
      });
    }

    return this.getUserById(userId);
  },
};
