import { Request, Response } from 'express';
import { rbacService } from '../services/rbacService';
import { securityService } from '../services/securityService';
import { AuthError } from '../services/authService';
import { AppValidationError } from '../utils/validator';

export const roleController = {
  getRoles(req: Request, res: Response): void {
    try {
      const roles = rbacService.getRoles();
      res.status(200).json({
        success: true,
        statusCode: 200,
        data: roles,
        requestId: req.requestId,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        statusCode: 500,
        error: { code: 'SERVER_INTERNAL_ERROR', message: err.message },
        requestId: req.requestId,
      });
    }
  },

  getRoleById(req: Request, res: Response): void {
    try {
      const role = rbacService.getRoleById(req.params.id);
      res.status(200).json({
        success: true,
        statusCode: 200,
        data: role,
        requestId: req.requestId,
      });
    } catch (err: any) {
      if (err instanceof AuthError) {
        res.status(err.statusCode).json({
          success: false,
          statusCode: err.statusCode,
          error: { code: err.code, message: err.message },
          requestId: req.requestId,
        });
        return;
      }
      res.status(500).json({
        success: false,
        statusCode: 500,
        error: { code: 'SERVER_INTERNAL_ERROR', message: err.message },
        requestId: req.requestId,
      });
    }
  },

  createRole(req: Request, res: Response): void {
    try {
      const actor = req.user
        ? { id: req.user.id, name: req.user.fullName || req.user.username, role: req.user.role }
        : undefined;
      const role = rbacService.createRole(req.body, actor);

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Role created successfully',
        data: role,
        requestId: req.requestId,
      });
    } catch (err: any) {
      if (err instanceof AppValidationError) {
        res.status(422).json({
          success: false,
          statusCode: 422,
          error: { code: 'VALIDATION_ERROR', message: err.message, details: err.details },
          requestId: req.requestId,
        });
        return;
      }
      res.status(500).json({
        success: false,
        statusCode: 500,
        error: { code: 'SERVER_INTERNAL_ERROR', message: err.message },
        requestId: req.requestId,
      });
    }
  },

  updateRole(req: Request, res: Response): void {
    try {
      const actor = req.user
        ? { id: req.user.id, name: req.user.fullName || req.user.username, role: req.user.role }
        : undefined;
      const updated = rbacService.updateRole(req.params.id, req.body, actor);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Role updated successfully',
        data: updated,
        requestId: req.requestId,
      });
    } catch (err: any) {
      if (err instanceof AuthError) {
        res.status(err.statusCode).json({
          success: false,
          statusCode: err.statusCode,
          error: { code: err.code, message: err.message },
          requestId: req.requestId,
        });
        return;
      }
      res.status(500).json({
        success: false,
        statusCode: 500,
        error: { code: 'SERVER_INTERNAL_ERROR', message: err.message },
        requestId: req.requestId,
      });
    }
  },

  deleteRole(req: Request, res: Response): void {
    try {
      const actor = req.user
        ? { id: req.user.id, name: req.user.fullName || req.user.username, role: req.user.role }
        : undefined;
      const result = rbacService.deleteRole(req.params.id, actor);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: result.message,
        requestId: req.requestId,
      });
    } catch (err: any) {
      if (err instanceof AuthError) {
        res.status(err.statusCode).json({
          success: false,
          statusCode: err.statusCode,
          error: { code: err.code, message: err.message },
          requestId: req.requestId,
        });
        return;
      }
      res.status(500).json({
        success: false,
        statusCode: 500,
        error: { code: 'SERVER_INTERNAL_ERROR', message: err.message },
        requestId: req.requestId,
      });
    }
  },
};

export const permissionController = {
  getPermissions(req: Request, res: Response): void {
    try {
      const perms = rbacService.getPermissions();
      res.status(200).json({
        success: true,
        statusCode: 200,
        data: perms,
        requestId: req.requestId,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        statusCode: 500,
        error: { code: 'SERVER_INTERNAL_ERROR', message: err.message },
        requestId: req.requestId,
      });
    }
  },
};

export const securityController = {
  getLoginHistory(req: Request, res: Response): void {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const history = securityService.getLoginHistory(limit);
      res.status(200).json({
        success: true,
        statusCode: 200,
        data: history,
        requestId: req.requestId,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        statusCode: 500,
        error: { code: 'SERVER_INTERNAL_ERROR', message: err.message },
        requestId: req.requestId,
      });
    }
  },

  getSecurityEvents(req: Request, res: Response): void {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const events = securityService.getSecurityEvents(limit);
      res.status(200).json({
        success: true,
        statusCode: 200,
        data: events,
        requestId: req.requestId,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        statusCode: 500,
        error: { code: 'SERVER_INTERNAL_ERROR', message: err.message },
        requestId: req.requestId,
      });
    }
  },

  getAuditLogs(req: Request, res: Response): void {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const logs = securityService.getAuditLogs(limit);
      res.status(200).json({
        success: true,
        statusCode: 200,
        data: logs,
        requestId: req.requestId,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        statusCode: 500,
        error: { code: 'SERVER_INTERNAL_ERROR', message: err.message },
        requestId: req.requestId,
      });
    }
  },
};
