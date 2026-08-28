import { db } from '../db/database';
import { DbLoginHistory, DbSecurityEvent, DbAuditLog } from '../db/schema';
import { cryptoUtils } from '../utils/crypto';

export const securityService = {
  recordLoginAttempt(
    identifier: string,
    status: 'SUCCESS' | 'FAILED',
    options: {
      userId?: string | null;
      failureReason?: string;
      ipAddress?: string;
      userAgent?: string;
      deviceInfo?: string;
    } = {}
  ): void {
    const entry: DbLoginHistory = {
      id: 'log_' + cryptoUtils.generateUuid(),
      userId: options.userId || null,
      identifierAttempted: identifier,
      status,
      failureReason: options.failureReason || null,
      ipAddress: options.ipAddress || '127.0.0.1',
      userAgent: options.userAgent || 'Unknown Agent',
      deviceInfo: options.deviceInfo || 'Standard Browser',
      timestamp: new Date().toISOString(),
    };
    db.recordLoginAttempt(entry);
  },

  recordSecurityEvent(
    eventType: DbSecurityEvent['eventType'],
    options: {
      userId?: string | null;
      actorId?: string | null;
      severity?: 'INFO' | 'WARN' | 'CRITICAL';
      ipAddress?: string;
      userAgent?: string;
      details?: Record<string, any>;
    } = {}
  ): void {
    const event: DbSecurityEvent = {
      id: 'sec_' + cryptoUtils.generateUuid(),
      eventType,
      userId: options.userId || null,
      actorId: options.actorId || null,
      severity: options.severity || 'INFO',
      ipAddress: options.ipAddress || '127.0.0.1',
      userAgent: options.userAgent || 'Unknown Agent',
      details: options.details || {},
      timestamp: new Date().toISOString(),
    };
    db.recordSecurityEvent(event);
  },

  recordAuditLog(
    actor: { id: string; name: string; role: string },
    action: string,
    resource: string,
    resourceId: string,
    options: {
      beforeState?: Record<string, any> | null;
      afterState?: Record<string, any> | null;
      result?: 'SUCCESS' | 'FAILURE';
      ipAddress?: string;
      userAgent?: string;
    } = {}
  ): void {
    const log: DbAuditLog = {
      id: 'aud_' + cryptoUtils.generateUuid(),
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action,
      resource,
      resourceId,
      beforeState: options.beforeState || null,
      afterState: options.afterState || null,
      result: options.result || 'SUCCESS',
      ipAddress: options.ipAddress || '127.0.0.1',
      userAgent: options.userAgent || 'Unknown Agent',
      timestamp: new Date().toISOString(),
    };
    db.recordAuditLog(log);
  },

  getLoginHistory(limit = 100): DbLoginHistory[] {
    return db.getLoginHistory(limit);
  },

  getSecurityEvents(limit = 100): DbSecurityEvent[] {
    return db.getSecurityEvents(limit);
  },

  getAuditLogs(limit = 100): DbAuditLog[] {
    return db.getAuditLogs(limit);
  },
};
