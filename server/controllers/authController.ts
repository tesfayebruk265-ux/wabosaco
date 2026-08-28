import { Request, Response } from 'express';
import { authService, AuthError } from '../services/authService';
import { AppValidationError } from '../utils/validator';

export const authController = {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.login(req.body, {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        deviceInfo: (req.headers['x-device-info'] as string) || req.headers['user-agent'],
      });

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Authentication successful',
        data: result,
        requestId: req.requestId,
      });
    } catch (err: any) {
      if (err instanceof AppValidationError) {
        res.status(422).json({
          success: false,
          statusCode: 422,
          error: {
            code: 'VALIDATION_ERROR',
            message: err.message,
            details: err.details,
          },
          requestId: req.requestId,
        });
        return;
      }

      if (err instanceof AuthError) {
        res.status(err.statusCode).json({
          success: false,
          statusCode: err.statusCode,
          error: {
            code: err.code,
            message: err.message,
            details: err.details,
          },
          requestId: req.requestId,
        });
        return;
      }

      res.status(500).json({
        success: false,
        statusCode: 500,
        error: {
          code: 'SERVER_INTERNAL_ERROR',
          message: 'An unexpected internal error occurred during authentication.',
        },
        requestId: req.requestId,
      });
    }
  },

  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.body?.refreshToken;
      const result = await authService.refresh(refreshToken, {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Token successfully rotated',
        data: result,
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
        error: { code: 'SERVER_INTERNAL_ERROR', message: 'Failed to rotate refresh token.' },
        requestId: req.requestId,
      });
    }
  },

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.body?.refreshToken;
      const userId = req.user?.id;
      const result = await authService.logout(refreshToken, userId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: result.message,
        requestId: req.requestId,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        statusCode: 500,
        error: { code: 'SERVER_INTERNAL_ERROR', message: 'Failed to process logout.' },
        requestId: req.requestId,
      });
    }
  },

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { identifier } = req.body || {};
      const result = await authService.forgotPassword(identifier);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: result.message,
        data: result.debugOtp ? { debugOtp: result.debugOtp } : undefined,
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
        error: { code: 'SERVER_INTERNAL_ERROR', message: 'Failed to generate reset OTP.' },
        requestId: req.requestId,
      });
    }
  },

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.resetPassword(req.body);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: result.message,
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
        error: { code: 'SERVER_INTERNAL_ERROR', message: 'Failed to reset password.' },
        requestId: req.requestId,
      });
    }
  },

  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await authService.changePassword(userId, req.body);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: result.message,
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
        error: { code: 'SERVER_INTERNAL_ERROR', message: 'Failed to change password.' },
        requestId: req.requestId,
      });
    }
  },

  async getMe(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await authService.getMe(userId);
      res.status(200).json({
        success: true,
        statusCode: 200,
        data: result,
        requestId: req.requestId,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        statusCode: 500,
        error: { code: 'SERVER_INTERNAL_ERROR', message: 'Failed to retrieve profile.' },
        requestId: req.requestId,
      });
    }
  },

  async verifyMfa(req: Request, res: Response): Promise<void> {
    try {
      const { mfaToken, mfaCode } = req.body || {};
      if (!mfaToken || !mfaCode) {
        res.status(422).json({
          success: false,
          statusCode: 422,
          error: { code: 'VALIDATION_ERROR', message: 'mfaToken and mfaCode are required' },
          requestId: req.requestId,
        });
        return;
      }

      const result = await authService.verifyLoginMfa(mfaToken, mfaCode, {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        deviceInfo: (req.headers['x-device-info'] as string) || req.headers['user-agent'],
      });

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Two-factor authentication successful',
        data: result,
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
        error: { code: 'SERVER_INTERNAL_ERROR', message: 'Failed to verify MFA.' },
        requestId: req.requestId,
      });
    }
  },

  async requestLoginOtp(req: Request, res: Response): Promise<void> {
    try {
      const { mfaToken, method } = req.body || {};
      if (!mfaToken || !method) {
        res.status(422).json({
          success: false,
          statusCode: 422,
          error: { code: 'VALIDATION_ERROR', message: 'mfaToken and method are required' },
          requestId: req.requestId,
        });
        return;
      }

      const result = await authService.requestLoginOtp(mfaToken, method);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: result.message,
        data: result,
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
        error: { code: 'SERVER_INTERNAL_ERROR', message: 'Failed to dispatch OTP challenge.' },
        requestId: req.requestId,
      });
    }
  },

  async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const { identifier, otpCode, purpose } = req.body || {};
      const result = await authService.verifyOtp(identifier, otpCode, purpose);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: result.message,
        data: result,
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
        error: { code: 'SERVER_INTERNAL_ERROR', message: 'Failed to verify OTP.' },
        requestId: req.requestId,
      });
    }
  },

  async verifyAccount(req: Request, res: Response): Promise<void> {
    try {
      const { identifier, code } = req.body || {};
      const result = await authService.verifyAccount(identifier, code);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: result.message,
        data: result,
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
        error: { code: 'SERVER_INTERNAL_ERROR', message: 'Failed to verify account.' },
        requestId: req.requestId,
      });
    }
  },
};
