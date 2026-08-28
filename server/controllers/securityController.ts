import { Request, Response } from 'express';
import { db } from '../db/database';
import { mfaService } from '../services/mfaService';
import { fraudRiskEngine } from '../services/fraudRiskEngine';
import { backupDisasterService } from '../services/backupDisasterService';
import { complianceService } from '../services/complianceService';
import { securityService } from '../services/securityService';
import { cryptoUtils } from '../utils/crypto';
import { DbSecurityAlert, DbSecurityIncident, DbRoleMfaPolicy, DbPasswordPolicy } from '../db/schema';

export const securityController = {
  // ==========================================
  // 1. MFA MANAGEMENT
  // ==========================================

  async getMfaStatus(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const config = db.getUserMfaConfig(user.id);
      const rolePolicy = db.getRoleMfaPolicy(user.role);

      res.status(200).json({
        success: true,
        data: {
          isEnabled: config?.isEnabled || false,
          methods: config?.methods || ['TOTP', 'EMAIL_OTP'],
          preferredMethod: config?.preferredMethod || 'TOTP',
          enforcedByRole: rolePolicy?.isMandatory || false,
          backupCodesCount: (config?.backupCodes || []).filter((b) => !b.used).length,
          lastUpdated: config?.updatedAt,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async setupTotp(req: Request, res: Response): Promise<void> {
    try {
      const user = db.getUserById(req.user!.id);
      if (!user) {
        res.status(404).json({ success: false, error: { message: 'User not found' } });
        return;
      }

      const setupData = mfaService.setupTotp(user);
      res.status(200).json({
        success: true,
        message: 'TOTP secret generated successfully. Scan QR code or enter secret into Authenticator App.',
        data: setupData,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async confirmTotp(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body || {};
      if (!token) {
        res.status(400).json({ success: false, error: { message: '6-digit token is required' } });
        return;
      }

      const result = mfaService.confirmTotp(req.user!.id, token);
      if (!result.success) {
        res.status(400).json({ success: false, error: { message: result.message } });
        return;
      }

      res.status(200).json({ success: true, message: result.message });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async regenerateBackupCodes(req: Request, res: Response): Promise<void> {
    try {
      const codes = mfaService.regenerateBackupCodes(req.user!.id);
      res.status(200).json({
        success: true,
        message: 'New backup codes generated. Store them in a secure physical or password manager vault.',
        data: { backupCodes: codes },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async disableMfa(req: Request, res: Response): Promise<void> {
    try {
      const targetUserId = req.body?.userId || req.user!.id;
      const success = mfaService.disableMfa(targetUserId, req.user!.id);
      res.status(200).json({
        success,
        message: success ? 'MFA disabled successfully.' : 'Failed to disable MFA.',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async getRoleMfaPolicies(req: Request, res: Response): Promise<void> {
    try {
      const policies = db.getRoleMfaPolicies();
      res.status(200).json({ success: true, data: policies });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async updateRoleMfaPolicy(req: Request, res: Response): Promise<void> {
    try {
      const { role, isMandatory, allowedMethods, gracePeriodDays } = req.body || {};
      if (!role) {
        res.status(400).json({ success: false, error: { message: 'Role is required' } });
        return;
      }

      const policy = db.updateRoleMfaPolicy(role, {
        isMandatory: !!isMandatory,
        allowedMethods: allowedMethods || ['TOTP', 'SMS_OTP', 'EMAIL_OTP'],
        gracePeriodDays: gracePeriodDays ?? 7,
      });

      res.status(200).json({ success: true, message: 'Role MFA policy updated', data: policy });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  // ==========================================
  // 2. ACTIVE SESSIONS & TRUSTED DEVICES
  // ==========================================

  async getActiveSessions(req: Request, res: Response): Promise<void> {
    try {
      const isSuper = req.user!.role === 'ADMIN' || req.user!.role === 'AUDITOR';
      const targetUserId = req.query.all === 'true' && isSuper ? undefined : req.user!.id;
      const sessions = db.getSessions({ userId: targetUserId, isActive: true });
      const currentTokenId = (req.user as any)?.jti || (req.user as any)?.accessTokenId;

      res.status(200).json({
        success: true,
        data: sessions.map((s) => ({
          ...s,
          isCurrentSession: s.id === currentTokenId || s.accessTokenId === currentTokenId,
        })),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async terminateSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const success = db.terminateSession(sessionId);

      securityService.recordSecurityEvent('SECURITY_POLICY_VIOLATION', {
        userId: req.user!.id,
        severity: 'INFO',
        details: { action: 'SESSION_MANUALLY_TERMINATED', sessionId },
      });

      res.status(200).json({
        success,
        message: success ? 'Session terminated successfully.' : 'Session not found or already terminated.',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async terminateAllOtherSessions(req: Request, res: Response): Promise<void> {
    try {
      const currentSessionId = (req.user as any)?.jti || (req.user as any)?.accessTokenId || '';
      const revokedCount = db.terminateUserOtherSessions(req.user!.id, currentSessionId);

      res.status(200).json({
        success: true,
        message: `Successfully terminated ${revokedCount} other active sessions.`,
        revokedCount,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async getTrustedDevices(req: Request, res: Response): Promise<void> {
    try {
      const isSuper = req.user!.role === 'ADMIN';
      const targetUserId = req.query.all === 'true' && isSuper ? undefined : req.user!.id;
      const devices = db.getTrustedDevices(targetUserId);
      res.status(200).json({ success: true, data: devices });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async revokeTrustedDevice(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;
      const success = db.revokeTrustedDevice(deviceId);

      securityService.recordSecurityEvent('SECURITY_POLICY_VIOLATION', {
        userId: req.user!.id,
        severity: 'WARN',
        details: { action: 'DEVICE_TRUST_REVOKED', deviceId },
      });

      res.status(200).json({
        success,
        message: success ? 'Trusted device access revoked.' : 'Device not found.',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  // ==========================================
  // 3. FRAUD & RISK ENGINE
  // ==========================================

  async evaluateRisk(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body || {};
      let user = body.userId ? db.getUserById(body.userId) : undefined;
      let member = body.memberId ? db.getMemberById(body.memberId) : undefined;

      const result = fraudRiskEngine.evaluateRisk({
        contextType: body.contextType || 'TRANSACTION',
        entityId: body.entityId,
        user,
        member,
        amount: body.amount,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        deviceFingerprint: body.deviceFingerprint,
        location: body.location,
        additionalDetails: body.details,
      });

      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async getRiskAssessments(req: Request, res: Response): Promise<void> {
    try {
      const assessments = db.getRiskAssessments();
      res.status(200).json({ success: true, data: assessments });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async getRiskMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = fraudRiskEngine.getRiskMetrics();
      res.status(200).json({ success: true, data: metrics });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  // ==========================================
  // 4. SECURITY ALERTS & INCIDENTS
  // ==========================================

  async getSecurityAlerts(req: Request, res: Response): Promise<void> {
    try {
      const { status, severity, category } = req.query as any;
      const alerts = db.getSecurityAlerts({ status, severity, category });
      res.status(200).json({ success: true, data: alerts });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async updateSecurityAlert(req: Request, res: Response): Promise<void> {
    try {
      const { alertId } = req.params;
      const updates = req.body || {};
      const updated = db.updateSecurityAlert(alertId, updates);
      if (!updated) {
        res.status(404).json({ success: false, error: { message: 'Alert not found' } });
        return;
      }

      res.status(200).json({ success: true, message: 'Security alert updated', data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async createSecurityAlert(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body || {};
      const alertNumber = db.getNextAlertNumber();
      const alert: DbSecurityAlert = {
        id: 'alt_' + cryptoUtils.generateUuid(),
        alertNumber,
        title: body.title || 'Security Anomaly Alert',
        severity: body.severity || 'HIGH',
        category: body.category || 'SECURITY_POLICY_VIOLATION',
        description: body.description || '',
        sourceIp: req.ip,
        userId: body.userId,
        userName: body.userName,
        memberId: body.memberId,
        status: 'OPEN',
        assignedTo: body.assignedTo,
        createdAt: new Date().toISOString(),
      };

      db.createSecurityAlert(alert);
      res.status(201).json({ success: true, message: 'Security alert created', data: alert });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async getSecurityIncidents(req: Request, res: Response): Promise<void> {
    try {
      const { status, severity } = req.query as any;
      const incidents = db.getSecurityIncidents({ status, severity });
      res.status(200).json({ success: true, data: incidents });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async createSecurityIncident(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body || {};
      const incidentNumber = db.getNextIncidentNumber();
      const now = new Date().toISOString();

      const incident: DbSecurityIncident = {
        id: 'inc_' + cryptoUtils.generateUuid(),
        incidentNumber,
        title: body.title || 'Formal Security Incident',
        category: body.category || 'UNAUTHORIZED_ACCESS_ATTEMPT',
        severity: body.severity || 'HIGH',
        status: 'INVESTIGATING',
        affectedResource: body.affectedResource || 'Core Banking Application',
        assignedInvestigatorId: body.assignedInvestigatorId || req.user!.id,
        assignedInvestigatorName: body.assignedInvestigatorName || req.user!.fullName,
        summary: body.summary || '',
        timeline: [
          {
            id: 'tl_01',
            timestamp: now,
            action: 'Incident Created & Assigned',
            actor: req.user!.fullName,
            notes: 'Formal investigation initiated.',
          },
        ],
        evidence: body.evidence || [],
        createdAt: now,
        updatedAt: now,
      };

      db.createSecurityIncident(incident);
      res.status(201).json({ success: true, message: 'Security incident logged', data: incident });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async updateSecurityIncident(req: Request, res: Response): Promise<void> {
    try {
      const { incidentId } = req.params;
      const updates = req.body || {};
      const updated = db.updateSecurityIncident(incidentId, updates);
      if (!updated) {
        res.status(404).json({ success: false, error: { message: 'Incident not found' } });
        return;
      }

      res.status(200).json({ success: true, message: 'Incident updated', data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async addIncidentTimelineEvent(req: Request, res: Response): Promise<void> {
    try {
      const { incidentId } = req.params;
      const { action, notes } = req.body || {};
      const event = {
        id: 'tl_' + cryptoUtils.generateUuid(),
        timestamp: new Date().toISOString(),
        action: action || 'Forensic Investigation Update',
        actor: req.user!.fullName,
        notes: notes || '',
      };

      const updated = db.addIncidentTimeline(incidentId, event);
      if (!updated) {
        res.status(404).json({ success: false, error: { message: 'Incident not found' } });
        return;
      }

      res.status(200).json({ success: true, message: 'Timeline event appended', data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  // ==========================================
  // 5. BACKUP & DISASTER RECOVERY
  // ==========================================

  async getBackupRecords(req: Request, res: Response): Promise<void> {
    try {
      const backups = db.getBackupRecords();
      res.status(200).json({ success: true, data: backups });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async createBackup(req: Request, res: Response): Promise<void> {
    try {
      const type = req.body?.backupType || 'MANUAL';
      const result = backupDisasterService.createBackup(type, req.user?.fullName || 'ADMIN');
      res.status(201).json({
        success: true,
        message: 'Cryptographically verified database backup created successfully.',
        data: result.backup,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async verifyBackup(req: Request, res: Response): Promise<void> {
    try {
      const { backupId } = req.params;
      const result = backupDisasterService.verifyBackup(backupId);
      res.status(200).json({ success: result.success, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async downloadBackup(req: Request, res: Response): Promise<void> {
    try {
      const { backupId } = req.params;
      const backup = db.getBackupRecordById(backupId);
      if (!backup) {
        res.status(404).json({ success: false, error: { message: 'Backup record not found' } });
        return;
      }

      const snapshot = db.getDatabaseSnapshot();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="wabi_sacco_backup_${backup.backupNumber}.json"`);
      res.send(JSON.stringify(snapshot, null, 2));
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async getDisasterRecoveryPlan(req: Request, res: Response): Promise<void> {
    try {
      const plan = backupDisasterService.getDisasterRecoveryPlan();
      res.status(200).json({ success: true, data: plan });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async updateDisasterRecoveryPlan(req: Request, res: Response): Promise<void> {
    try {
      const plan = backupDisasterService.updateDisasterRecoveryPlan(req.body || {});
      res.status(200).json({ success: true, message: 'Disaster Recovery Plan updated', data: plan });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async triggerEmergencyLockdown(req: Request, res: Response): Promise<void> {
    try {
      const { reason } = req.body || {};
      if (!reason) {
        res.status(400).json({ success: false, error: { message: 'Reason for emergency lockdown is mandatory' } });
        return;
      }

      const result = backupDisasterService.triggerEmergencyLockdown(req.user?.fullName || req.user?.id || 'ADMIN', reason);
      res.status(200).json({
        success: true,
        message: 'EMERGENCY LOCKDOWN ENGAGED. All active sessions invalidated.',
        data: result,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  // ==========================================
  // 6. COMPLIANCE & GOVERNANCE
  // ==========================================

  async getComplianceStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = complianceService.evaluateCompliance();
      res.status(200).json({ success: true, data: status });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async recordAccessReview(req: Request, res: Response): Promise<void> {
    try {
      const { notes } = req.body || {};
      const status = complianceService.recordAccessReview(req.user?.fullName || req.user?.id || 'ADMIN', notes);
      res.status(200).json({
        success: true,
        message: 'Periodic access control review successfully logged.',
        data: status,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  // ==========================================
  // 7. PASSWORD POLICIES
  // ==========================================

  async getPasswordPolicy(req: Request, res: Response): Promise<void> {
    try {
      const policy = db.getPasswordPolicy();
      res.status(200).json({ success: true, data: policy });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async updatePasswordPolicy(req: Request, res: Response): Promise<void> {
    try {
      const updates = req.body as Partial<DbPasswordPolicy>;
      const policy = db.updatePasswordPolicy(updates, req.user!.id);

      securityService.recordSecurityEvent('SECURITY_POLICY_VIOLATION', {
        actorId: req.user!.id,
        severity: 'WARN',
        details: { action: 'PASSWORD_POLICY_UPDATED', updates },
      });

      res.status(200).json({ success: true, message: 'Password policy updated', data: policy });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  // ==========================================
  // 8. SECURITY LOGS & AUDIT
  // ==========================================

  async getLoginHistory(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const history = securityService.getLoginHistory(limit);
      res.status(200).json({ success: true, statusCode: 200, data: history, requestId: req.requestId });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async getSecurityEvents(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const events = securityService.getSecurityEvents(limit);
      res.status(200).json({ success: true, statusCode: 200, data: events, requestId: req.requestId });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const logs = securityService.getAuditLogs(limit);
      res.status(200).json({ success: true, statusCode: 200, data: logs, requestId: req.requestId });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  async getSecurityOverview(req: Request, res: Response): Promise<void> {
    try {
      const alerts = db.getSecurityAlerts();
      const incidents = db.getSecurityIncidents();
      const backups = db.getBackupRecords();
      const compliance = complianceService.evaluateCompliance();
      const riskMetrics = fraudRiskEngine.getRiskMetrics();
      const sessions = db.getSessions();
      const mfaConfigs = db.getMfaConfigs();

      res.status(200).json({
        success: true,
        data: {
          openAlertsCount: alerts.filter((a) => a.status === 'OPEN' || a.status === 'ACKNOWLEDGED').length,
          criticalAlertsCount: alerts.filter((a) => a.severity === 'CRITICAL' && a.status !== 'RESOLVED').length,
          activeIncidentsCount: incidents.filter((i) => i.status !== 'CLOSED').length,
          activeSessionsCount: sessions.length,
          mfaEnrolledUsersCount: mfaConfigs.filter((m) => m.isEnabled).length,
          lastBackupDate: backups[0]?.createdAt || null,
          complianceScore: compliance.overallScore,
          averageRiskScore: riskMetrics.averageRiskScore,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  },
};
