import { Request, Response } from 'express';
import { shareService } from '../services/shareService';
import { db } from '../db/database';

export const shareController = {
  /**
   * GET /api/shares/accounts
   * Staff: View all member share accounts with filtering and pagination
   */
  async getAccounts(req: Request, res: Response) {
    try {
      const { query, status, complianceStatus, page, limit } = req.query;
      const result = shareService.getShareAccounts({
        query: query as string,
        status: status as string,
        complianceStatus: complianceStatus as any,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      });

      res.json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
        meta: {
          minRequiredShares: result.minRequiredShares,
          sharePrice: result.sharePrice,
        },
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'SHARE_ACCOUNTS_FETCH_ERROR', message: err.message },
      });
    }
  },

  /**
   * GET /api/shares/accounts/:id
   * Staff / Member: View single share account with certificate and history
   */
  async getAccountById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      // Member can only view their own account unless they have staff permissions
      if (req.user?.role === 'MEMBER') {
        const memberAccount = db.getShareAccountByMemberId(req.user.id) || db.getShareAccountByMemberId(req.user.membershipNo || '');
        if (memberAccount && memberAccount.id !== id && memberAccount.accountNo !== id && memberAccount.memberId !== id) {
          return res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: 'You can only access your own share account.' },
          });
        }
      }

      const result = shareService.getShareAccountDetails(id);
      res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      res.status(404).json({
        success: false,
        error: { code: 'SHARE_ACCOUNT_NOT_FOUND', message: err.message },
      });
    }
  },

  /**
   * GET /api/shares/me
   * Member Self-Service: Get authenticated member's share account and status
   */
  async getMyShareAccount(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' } });
      }

      const member = db.getMemberById(req.user.id) || (req.user.membershipNo ? db.getMemberByMembershipNo(req.user.membershipNo) : undefined);
      if (!member) {
        return res.status(404).json({ success: false, error: { code: 'MEMBER_NOT_FOUND', message: 'Member record not found.' } });
      }

      const account = shareService.getOrCreateShareAccount(member.id);
      const certificate = db.getShareCertificateByMemberId(member.id);
      const eligibility = shareService.getMemberEligibility(member.id);

      res.json({
        success: true,
        data: {
          account,
          certificate,
          eligibility,
        },
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'MY_SHARE_ACCOUNT_ERROR', message: err.message },
      });
    }
  },

  /**
   * GET /api/shares/me/transactions
   * Member Self-Service: Get authenticated member's share transaction ledger
   */
  async getMyTransactions(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' } });
      }

      const member = db.getMemberById(req.user.id) || (req.user.membershipNo ? db.getMemberByMembershipNo(req.user.membershipNo) : undefined);
      if (!member) {
        return res.status(404).json({ success: false, error: { code: 'MEMBER_NOT_FOUND', message: 'Member record not found.' } });
      }

      const { type, page, limit } = req.query;
      const result = shareService.getShareTransactions({
        memberId: member.id,
        type: type as string,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 50,
      });

      res.json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'MY_SHARE_TX_ERROR', message: err.message },
      });
    }
  },

  /**
   * GET /api/shares/me/eligibility
   * Member Self-Service: Check loan readiness, minimum 5 shares rule, and voluntary conversion options
   */
  async getMyEligibility(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' } });
      }

      const member = db.getMemberById(req.user.id) || (req.user.membershipNo ? db.getMemberByMembershipNo(req.user.membershipNo) : undefined);
      if (!member) {
        return res.status(404).json({ success: false, error: { code: 'MEMBER_NOT_FOUND', message: 'Member record not found.' } });
      }

      const eligibility = shareService.getMemberEligibility(member.id);
      res.json({
        success: true,
        data: eligibility,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'ELIGIBILITY_ERROR', message: err.message },
      });
    }
  },

  /**
   * GET /api/shares/me/certificate
   * Member Self-Service: Get active digital share certificate
   */
  async getMyCertificate(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' } });
      }

      const member = db.getMemberById(req.user.id) || (req.user.membershipNo ? db.getMemberByMembershipNo(req.user.membershipNo) : undefined);
      if (!member) {
        return res.status(404).json({ success: false, error: { code: 'MEMBER_NOT_FOUND', message: 'Member record not found.' } });
      }

      const certificate = db.getShareCertificateByMemberId(member.id);
      const account = shareService.getOrCreateShareAccount(member.id);

      res.json({
        success: true,
        data: {
          certificate,
          account,
          member: {
            id: member.id,
            membershipNo: member.membershipNo,
            fullName: member.fullName,
            membershipDate: member.membershipDate,
          },
        },
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'CERTIFICATE_FETCH_ERROR', message: err.message },
      });
    }
  },

  /**
   * POST /api/shares/purchase
   * Purchase shares directly (via Member self-service or Staff on member's behalf)
   */
  async purchaseShares(req: Request, res: Response) {
    try {
      const { memberId, numberOfShares, paymentMethod, bankReferenceNo, narration, idempotencyKey, receiptUrl } = req.body;

      let targetMemberId = memberId;
      // If member user, enforce target is themselves
      if (req.user?.role === 'MEMBER') {
        const mem = db.getMemberById(req.user.id) || (req.user.membershipNo ? db.getMemberByMembershipNo(req.user.membershipNo) : undefined);
        if (!mem) {
          return res.status(404).json({ success: false, error: { code: 'MEMBER_NOT_FOUND', message: 'Member not found.' } });
        }
        targetMemberId = mem.id;
      }

      if (!targetMemberId) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_MEMBER_ID', message: 'Target member ID is required.' },
        });
      }

      const result = shareService.purchaseShares({
        memberId: targetMemberId,
        numberOfShares: Number(numberOfShares),
        paymentMethod: paymentMethod || 'CBE_BANK',
        bankReferenceNo,
        narration,
        idempotencyKey,
        receiptUrl,
        performedById: req.user?.id || 'SYSTEM',
        performedByName: req.user?.fullName || req.user?.username || 'Authorized User',
        performedByRole: req.user?.role,
      });

      res.status(201).json({
        success: true,
        message: `Successfully purchased ${result.shareTransaction.numberOfShares} share(s).`,
        data: result,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'SHARE_PURCHASE_FAILED', message: err.message },
      });
    }
  },

  /**
   * POST /api/shares/convert
   * Convert Voluntary Savings into whole Equity Shares
   */
  async convertVoluntarySavings(req: Request, res: Response) {
    try {
      const { memberId, amountToConvert, narration, idempotencyKey } = req.body;

      let targetMemberId = memberId;
      if (req.user?.role === 'MEMBER') {
        const mem = db.getMemberById(req.user.id) || (req.user.membershipNo ? db.getMemberByMembershipNo(req.user.membershipNo) : undefined);
        if (!mem) {
          return res.status(404).json({ success: false, error: { code: 'MEMBER_NOT_FOUND', message: 'Member not found.' } });
        }
        targetMemberId = mem.id;
      }

      if (!targetMemberId) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_MEMBER_ID', message: 'Target member ID is required.' },
        });
      }

      const result = shareService.convertVoluntarySavingsToShares({
        memberId: targetMemberId,
        amountToConvert: Number(amountToConvert),
        narration,
        idempotencyKey,
        performedById: req.user?.id || 'SYSTEM',
        performedByName: req.user?.fullName || req.user?.username || 'Authorized User',
        performedByRole: req.user?.role,
      });

      res.status(201).json({
        success: true,
        message: `Successfully converted ${result.amountConverted.toLocaleString()} ETB into ${result.sharesPurchased} share(s). ${
          result.remainderKeptInSavings > 0
            ? `${result.remainderKeptInSavings.toLocaleString()} ETB remained in Voluntary Savings.`
            : ''
        }`,
        data: result,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'SHARE_CONVERSION_FAILED', message: err.message },
      });
    }
  },

  /**
   * GET /api/shares/transactions
   * Staff / Auditor: View all share transactions ledger
   */
  async getTransactions(req: Request, res: Response) {
    try {
      const { memberId, shareAccountId, type, paymentMethod, status, startDate, endDate, page, limit } = req.query;
      const result = shareService.getShareTransactions({
        memberId: memberId as string,
        shareAccountId: shareAccountId as string,
        type: type as string,
        paymentMethod: paymentMethod as string,
        status: status as string,
        startDate: startDate as string,
        endDate: endDate as string,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      });

      res.json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'SHARE_TX_FETCH_ERROR', message: err.message },
      });
    }
  },

  /**
   * GET /api/shares/transactions/:id
   * Get single transaction detail with GL journal reference
   */
  async getTransactionById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tx = db.getShareTransactionById(id);
      if (!tx) {
        return res.status(404).json({
          success: false,
          error: { code: 'TRANSACTION_NOT_FOUND', message: `Share transaction ${id} not found.` },
        });
      }

      let journalEntry;
      if (tx.journalEntryId) {
        journalEntry = db.getJournalEntries().find((j) => j.id === tx.journalEntryId);
      }

      let finTx;
      if (tx.financialTransactionId) {
        finTx = db.getFinancialTransactionById(tx.financialTransactionId);
      }

      res.json({
        success: true,
        data: {
          transaction: tx,
          journalEntry,
          financialTransaction: finTx,
        },
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'TRANSACTION_FETCH_ERROR', message: err.message },
      });
    }
  },

  /**
   * POST /api/shares/transactions/:id/reverse
   * Manager / Admin: Reverse a share transaction
   */
  async reverseTransaction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason || reason.trim().length < 5) {
        return res.status(400).json({
          success: false,
          error: { code: 'REASON_REQUIRED', message: 'A comprehensive justification reason is required for transaction reversal.' },
        });
      }

      const result = shareService.reverseShareTransaction({
        transactionId: id,
        reason: reason.trim(),
        performedById: req.user?.id || 'SYSTEM',
        performedByName: req.user?.fullName || req.user?.username || 'Authorized Official',
      });

      res.json({
        success: true,
        message: 'Share transaction successfully reversed.',
        data: result,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'REVERSAL_FAILED', message: err.message },
      });
    }
  },

  /**
   * GET /api/shares/reports/statistics
   * Aggregated Share Capital & Compliance Statistics
   */
  async getStatistics(req: Request, res: Response) {
    try {
      const stats = shareService.getShareStatistics();
      res.json({
        success: true,
        data: stats,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'STATS_FETCH_ERROR', message: err.message },
      });
    }
  },

  /**
   * GET /api/shares/reports/ownership
   * Top shareholders and ownership distribution
   */
  async getOwnershipReport(req: Request, res: Response) {
    try {
      const report = shareService.getOwnershipReport();
      res.json({
        success: true,
        data: report,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'OWNERSHIP_REPORT_ERROR', message: err.message },
      });
    }
  },

  /**
   * GET /api/shares/reports/non-compliant
   * Members below the 5-share requirement and shortfall analysis
   */
  async getNonCompliantReport(req: Request, res: Response) {
    try {
      const report = shareService.getNonCompliantMembersReport();
      res.json({
        success: true,
        data: report,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'NON_COMPLIANT_REPORT_ERROR', message: err.message },
      });
    }
  },

  /**
   * GET /api/shares/settings
   * Get Share System Parameters and historical price logs
   */
  async getSettings(req: Request, res: Response) {
    try {
      const settings = shareService.getShareSettings();
      res.json({
        success: true,
        data: settings,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'SETTINGS_FETCH_ERROR', message: err.message },
      });
    }
  },

  /**
   * PUT /api/shares/settings
   * Admin / Manager: Update share price, minimum required shares, and dividend rate
   */
  async updateSettings(req: Request, res: Response) {
    try {
      const { sharePrice, minRequiredShares, minShareValue, shareDividendRate, reason } = req.body;
      const updated = shareService.updateShareSettings(
        {
          sharePrice,
          minRequiredShares,
          minShareValue,
          shareDividendRate,
          reason,
        },
        req.user?.id || 'SYSTEM',
        req.user?.fullName || req.user?.username || 'Admin'
      );

      res.json({
        success: true,
        message: 'Share system parameters successfully updated.',
        data: updated,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'SETTINGS_UPDATE_ERROR', message: err.message },
      });
    }
  },

  /**
   * GET /api/shares/certificates/:id
   * Get certificate by ID
   */
  async getCertificateById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const cert = db.getShareCertificateById(id);
      if (!cert) {
        return res.status(404).json({
          success: false,
          error: { code: 'CERTIFICATE_NOT_FOUND', message: `Share certificate ${id} not found.` },
        });
      }

      res.json({
        success: true,
        data: cert,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'CERTIFICATE_FETCH_ERROR', message: err.message },
      });
    }
  },
};
