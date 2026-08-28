import { Request, Response } from 'express';
import { userService } from '../services/userService';
import { AuthError } from '../services/authService';
import { AppValidationError } from '../utils/validator';

export const userController = {
  getUsers(req: Request, res: Response): void {
    try {
      const { search, role, status, page, limit } = req.query;
      const result = userService.getUsers({
        search: search as string,
        role: role as string,
        status: status as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: result.users,
        pagination: result.pagination,
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

  getUserById(req: Request, res: Response): void {
    try {
      const user = userService.getUserById(req.params.id);
      res.status(200).json({
        success: true,
        statusCode: 200,
        data: user,
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

  createUser(req: Request, res: Response): void {
    try {
      const actor = req.user
        ? { id: req.user.id, name: req.user.fullName || req.user.username, role: req.user.role }
        : undefined;
      const newUser = userService.createUser(req.body, actor);

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'User created successfully',
        data: newUser,
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

  updateUser(req: Request, res: Response): void {
    try {
      const actor = req.user
        ? { id: req.user.id, name: req.user.fullName || req.user.username, role: req.user.role }
        : undefined;
      const updated = userService.updateUser(req.params.id, req.body, actor);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'User updated successfully',
        data: updated,
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

  deleteUser(req: Request, res: Response): void {
    try {
      const actor = req.user
        ? { id: req.user.id, name: req.user.fullName || req.user.username, role: req.user.role }
        : undefined;
      const result = userService.deleteUser(req.params.id, actor);

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

  activateUser(req: Request, res: Response): void {
    try {
      const actor = req.user
        ? { id: req.user.id, name: req.user.fullName || req.user.username, role: req.user.role }
        : undefined;
      const updated = userService.activateUser(req.params.id, actor);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Account activated successfully',
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

  deactivateUser(req: Request, res: Response): void {
    try {
      const actor = req.user
        ? { id: req.user.id, name: req.user.fullName || req.user.username, role: req.user.role }
        : undefined;
      const updated = userService.deactivateUser(req.params.id, actor);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Account deactivated successfully',
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

  adminResetPassword(req: Request, res: Response): void {
    try {
      const actor = req.user
        ? { id: req.user.id, name: req.user.fullName || req.user.username, role: req.user.role }
        : undefined;
      const result = userService.adminResetPassword(req.params.id, req.body?.newPassword, actor);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: result.message,
        data: result.temporaryPassword ? { temporaryPassword: result.temporaryPassword } : undefined,
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

  assignRole(req: Request, res: Response): void {
    try {
      const roleIdOrCode = req.body?.roleId || req.body?.roleCode || req.body?.role;
      const actor = req.user
        ? { id: req.user.id, name: req.user.fullName || req.user.username, role: req.user.role }
        : undefined;
      const updated = userService.assignRole(req.params.id, roleIdOrCode, actor);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Role assigned successfully',
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

  removeRole(req: Request, res: Response): void {
    try {
      const actor = req.user
        ? { id: req.user.id, name: req.user.fullName || req.user.username, role: req.user.role }
        : undefined;
      const updated = userService.removeRole(req.params.id, req.params.roleId, actor);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Role removed successfully',
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
};
