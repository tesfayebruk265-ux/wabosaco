import { db } from '../db/database';
import {
  DbRiskAssessment,
  DbSecurityAlert,
  DbUser,
  DbMember,
} from '../db/schema';
import { cryptoUtils } from '../utils/crypto';
import { securityService } from './securityService';

export interface RiskFactor {
  rule: string;
  score: number;
  weight: number;
  description: string;
}

export interface RiskEvaluationRequest {
  contextType: 'LOGIN' | 'TRANSACTION' | 'WITHDRAWAL' | 'LOAN' | 'PASSWORD_RESET' | 'PROFILE_UPDATE';
  entityId?: string;
  user?: DbUser;
  member?: DbMember;
  amount?: number;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  location?: string;
  additionalDetails?: Record<string, any>;
}

export interface RiskEvaluationResult {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  actionTaken: 'ALLOWED' | 'CHALLENGE_MFA' | 'CHALLENGED_MFA' | 'REQUIRES_MANUAL_REVIEW' | 'BLOCKED';
  riskFactors: RiskFactor[];
  assessmentId: string;
  alertRaised?: DbSecurityAlert;
}

export const fraudRiskEngine = {
  /**
   * Evaluate risk for any action in real-time
   */
  evaluateRisk(req: RiskEvaluationRequest): RiskEvaluationResult {
    const factors: RiskFactor[] = [];
    const ip = req.ipAddress || '127.0.0.1';
    const now = new Date();
    const currentHour = now.getHours();

    // 1. Context: LOGIN
    if (req.contextType === 'LOGIN') {
      // Check device fingerprint
      if (req.user && req.deviceFingerprint) {
        const trusted = db.getTrustedDeviceByFingerprint(req.user.id, req.deviceFingerprint);
        if (!trusted) {
          factors.push({
            rule: 'NEW_UNRECOGNIZED_DEVICE',
            score: 25,
            weight: 1,
            description: 'Login from a new, unregistered device fingerprint',
          });
        } else if (trusted.isRevoked) {
          factors.push({
            rule: 'REVOKED_DEVICE_ACCESS',
            score: 65,
            weight: 1,
            description: 'Attempt to login from a previously revoked device',
          });
        }
      }

      // Check failed attempts history
      if (req.user && (req.user.failedLoginAttempts || 0) >= 3) {
        factors.push({
          rule: 'PRIOR_FAILED_ATTEMPTS',
          score: 20 + (req.user.failedLoginAttempts || 0) * 5,
          weight: 1,
          description: `User had ${req.user.failedLoginAttempts} recent failed authentication attempts`,
        });
      }

      // Check unusual time of day (e.g. 11 PM to 5 AM)
      if (currentHour >= 23 || currentHour < 5) {
        factors.push({
          rule: 'OFF_HOURS_ACCESS',
          score: 15,
          weight: 1,
          description: 'Login initiated during off-peak nighttime hours (11 PM - 5 AM)',
        });
      }

      // Check foreign or external IP
      if (ip.startsWith('196.') || ip.startsWith('197.') || ip.startsWith('102.')) {
        factors.push({
          rule: 'EXTERNAL_TELECOM_GATEWAY',
          score: 10,
          weight: 1,
          description: 'Access originated via external cellular/telecom gateway',
        });
      }
    }

    // 2. Context: TRANSACTION / WITHDRAWAL
    if (req.contextType === 'TRANSACTION' || req.contextType === 'WITHDRAWAL') {
      const amount = Number(req.amount || 0);

      // Large withdrawal / dual-control threshold (> 50,000 ETB)
      if (amount > 100000) {
        factors.push({
          rule: 'EXTREME_WITHDRAWAL_THRESHOLD',
          score: 55,
          weight: 1,
          description: `Withdrawal amount (ETB ${amount.toLocaleString()}) exceeds ETB 100,000 executive ceiling`,
        });
      } else if (amount >= 50000) {
        factors.push({
          rule: 'DUAL_CONTROL_THRESHOLD',
          score: 35,
          weight: 1,
          description: `Withdrawal amount (ETB ${amount.toLocaleString()}) requires dual-authorization approval`,
        });
      } else if (amount >= 20000) {
        factors.push({
          rule: 'SIGNIFICANT_OUTFLOW',
          score: 15,
          weight: 1,
          description: `Transaction amount (ETB ${amount.toLocaleString()}) is above average teller baseline`,
        });
      }

      // High-velocity frequency check (multiple withdrawals in 24 hours)
      if (req.member) {
        const recentTxns = db.getFinancialTransactions().filter((t) => t.memberId === req.member?.id);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const recentWithdrawals = recentTxns.filter(
          (t) => t.type === 'WITHDRAWAL' && t.createdAt > oneDayAgo
        );

        if (recentWithdrawals.length >= 3) {
          factors.push({
            rule: 'HIGH_VELOCITY_WITHDRAWALS',
            score: 40,
            weight: 1,
            description: `Member performed ${recentWithdrawals.length} cash withdrawals within the last 24 hours`,
          });
        } else if (recentWithdrawals.length >= 1 && amount > 25000) {
          factors.push({
            rule: 'REPEATED_HIGH_WITHDRAWAL',
            score: 25,
            weight: 1,
            description: 'Subsequent large withdrawal within 24 hours of prior disbursement',
          });
        }

        // Account status check
        if (req.member.status !== 'ACTIVE') {
          factors.push({
            rule: 'DORMANT_SUSPENDED_ACCOUNT',
            score: 75,
            weight: 1,
            description: `Transaction requested on non-active member account status: ${req.member.status}`,
          });
        }
      }
    }

    // 3. Context: LOAN
    if (req.contextType === 'LOAN') {
      const loanAmount = Number(req.amount || 0);
      if (req.member) {
        const savingsAccounts = db.getSavingAccounts().filter((s) => s.memberId === req.member?.id);
        const totalSavings = savingsAccounts.reduce((sum, s) => sum + (s.ledgerBalance || 0), 0);

        if (totalSavings > 0 && loanAmount > totalSavings * 3) {
          factors.push({
            rule: 'HIGH_LEVERAGE_LOAN_RATIO',
            score: 35,
            weight: 1,
            description: `Loan principal (ETB ${loanAmount.toLocaleString()}) exceeds 3x accumulated savings (ETB ${totalSavings.toLocaleString()})`,
          });
        }

        if (totalSavings <= 0) {
          factors.push({
            rule: 'ZERO_SAVINGS_LOAN_REQUEST',
            score: 50,
            weight: 1,
            description: 'Loan application submitted with zero verified voluntary/mandatory savings backing',
          });
        }
      }
    }

    // 4. Context: PASSWORD_RESET / PROFILE_UPDATE
    if (req.contextType === 'PASSWORD_RESET' || req.contextType === 'PROFILE_UPDATE') {
      if (req.user && req.deviceFingerprint) {
        const isKnown = db.getTrustedDeviceByFingerprint(req.user.id, req.deviceFingerprint);
        if (!isKnown) {
          factors.push({
            rule: 'SENSITIVE_MODIFICATION_UNKNOWN_DEVICE',
            score: 45,
            weight: 1,
            description: 'Critical credential/profile change initiated from unrecognized client fingerprint',
          });
        }
      }
    }

    // Compute final weighted risk score (clamped between 5 and 100)
    let totalScore = factors.reduce((sum, f) => sum + f.score * f.weight, 5);
    totalScore = Math.min(100, Math.max(5, totalScore));

    // Determine Risk Level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (totalScore >= 85) riskLevel = 'CRITICAL';
    else if (totalScore >= 70) riskLevel = 'HIGH';
    else if (totalScore >= 40) riskLevel = 'MEDIUM';

    // Determine recommended action
    let actionTaken: 'ALLOWED' | 'CHALLENGED_MFA' | 'REQUIRES_MANUAL_REVIEW' | 'BLOCKED' = 'ALLOWED';
    if (riskLevel === 'CRITICAL') actionTaken = 'BLOCKED';
    else if (riskLevel === 'HIGH') actionTaken = 'REQUIRES_MANUAL_REVIEW';
    else if (riskLevel === 'MEDIUM') actionTaken = 'CHALLENGED_MFA';

    const assessmentId = 'risk_' + cryptoUtils.generateUuid();

    const assessmentRecord: DbRiskAssessment = {
      id: assessmentId,
      contextType: req.contextType,
      entityId: req.entityId || req.user?.id || 'N/A',
      userId: req.user?.id || req.member?.userId || 'SYSTEM',
      userFullName: req.user?.fullName || req.member?.fullName || 'System User',
      memberId: req.member?.id,
      membershipNo: req.member?.membershipNo || req.user?.membershipNo,
      riskScore: totalScore,
      riskLevel,
      riskFactors: factors,
      actionTaken,
      ipAddress: ip,
      location: req.location || 'Addis Ababa (LAN/WAN)',
      details: {
        amount: req.amount,
        userAgent: req.userAgent,
        deviceFingerprint: req.deviceFingerprint,
        ...req.additionalDetails,
      },
      createdAt: now.toISOString(),
    };

    db.createRiskAssessment(assessmentRecord);

    // Auto-create Security Alert for HIGH or CRITICAL score
    let alertRecord: DbSecurityAlert | undefined;
    if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
      const alertNum = db.getNextAlertNumber();
      alertRecord = {
        id: 'alt_' + cryptoUtils.generateUuid(),
        alertNumber: alertNum,
        title: `${riskLevel} Risk Alert: ${req.contextType} (Score ${totalScore}/100)`,
        severity: riskLevel === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        category:
          req.contextType === 'LOGIN'
            ? 'SUSPICIOUS_LOGIN'
            : req.contextType === 'WITHDRAWAL' || req.contextType === 'TRANSACTION'
            ? 'UNUSUAL_TRANSACTION'
            : 'SECURITY_POLICY_VIOLATION',
        description: `Automated Risk Engine flagged high-risk score of ${totalScore} during ${req.contextType}. Top risk factor: ${
          factors[0]?.description || 'Multiple composite security anomalies detected'
        }.`,
        sourceIp: ip,
        userId: req.user?.id || req.member?.userId,
        userName: req.user?.fullName || req.member?.fullName,
        memberId: req.member?.id,
        membershipNo: req.member?.membershipNo,
        transactionId: req.entityId,
        status: 'OPEN',
        createdAt: now.toISOString(),
      };
      db.createSecurityAlert(alertRecord);

      securityService.recordSecurityEvent('SECURITY_POLICY_VIOLATION', {
        userId: req.user?.id || req.member?.userId,
        severity: riskLevel === 'CRITICAL' ? 'CRITICAL' : 'WARN',
        ipAddress: ip,
        userAgent: req.userAgent,
        details: {
          assessmentId,
          score: totalScore,
          contextType: req.contextType,
          alertNumber: alertNum,
        },
      });
    }

    return {
      riskScore: totalScore,
      riskLevel,
      actionTaken,
      riskFactors: factors,
      assessmentId,
      alertRaised: alertRecord,
    };
  },

  /**
   * Get all risk analytics & assessments
   */
  getRiskMetrics(): {
    totalAssessments: number;
    averageRiskScore: number;
    highRiskCount: number;
    criticalRiskCount: number;
    recentAssessments: DbRiskAssessment[];
  } {
    const list = db.getRiskAssessments();
    const totalAssessments = list.length;
    const totalScore = list.reduce((sum, r) => sum + r.riskScore, 0);
    const averageRiskScore = totalAssessments > 0 ? Math.round(totalScore / totalAssessments) : 15;
    const highRiskCount = list.filter((r) => r.riskLevel === 'HIGH').length;
    const criticalRiskCount = list.filter((r) => r.riskLevel === 'CRITICAL').length;

    return {
      totalAssessments,
      averageRiskScore,
      highRiskCount,
      criticalRiskCount,
      recentAssessments: list.slice(0, 20),
    };
  },
};
