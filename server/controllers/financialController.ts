import { Request, Response } from 'express';
import { db } from '../db/database';
import { financialService, PaymentChannel } from '../services/financialService';
import { SavingProductCode } from '../db/schema';

class FinancialController {
  // ==========================================
  // SAVING PRODUCTS
  // ==========================================
  public getProducts = async (req: Request, res: Response): Promise<void> => {
    const products = db.getSavingProducts();
    res.json({
      success: true,
      data: products,
      requestId: req.requestId,
    });
  };

  public getProductById = async (req: Request, res: Response): Promise<void> => {
    const product = db.getSavingProductById(req.params.id) || db.getSavingProductByCode(req.params.id as SavingProductCode);
    if (!product) {
      res.status(404).json({
        success: false,
        error: { code: 'PRODUCT_NOT_FOUND', message: 'Saving product was not found.' },
        requestId: req.requestId,
      });
      return;
    }
    res.json({
      success: true,
      data: product,
      requestId: req.requestId,
    });
  };

  public updateProduct = async (req: Request, res: Response): Promise<void> => {
    const updated = db.updateSavingProduct(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({
        success: false,
        error: { code: 'PRODUCT_NOT_FOUND', message: 'Saving product was not found.' },
        requestId: req.requestId,
      });
      return;
    }
    res.json({
      success: true,
      data: updated,
      message: 'Saving product configuration updated successfully.',
      requestId: req.requestId,
    });
  };

  // ==========================================
  // SAVING ACCOUNTS
  // ==========================================
  public getAccounts = async (req: Request, res: Response): Promise<void> => {
    const { memberId, productCode, search, status } = req.query;
    let accounts = db.getSavingAccounts();

    if (memberId) {
      accounts = accounts.filter((a) => a.memberId === String(memberId));
    }
    if (productCode) {
      accounts = accounts.filter((a) => a.productCode === String(productCode));
    }
    if (status) {
      accounts = accounts.filter((a) => a.status === String(status));
    }
    if (search) {
      const q = String(search).toLowerCase();
      accounts = accounts.filter(
        (a) =>
          a.accountNo.toLowerCase().includes(q) ||
          a.membershipNo.toLowerCase().includes(q) ||
          a.memberName.toLowerCase().includes(q)
      );
    }

    // Attach calculated available balance details to each account
    const enriched = accounts.map((acc) => {
      try {
        const bal = financialService.calculateAccountBalances(acc.id);
        return {
          ...acc,
          availableBalance: bal.availableBalance,
          clearedBalance: bal.clearedBalance,
          heldBalance: bal.heldBalance,
        };
      } catch {
        return acc;
      }
    });

    res.json({
      success: true,
      data: enriched,
      count: enriched.length,
      requestId: req.requestId,
    });
  };

  public getAccountById = async (req: Request, res: Response): Promise<void> => {
    const account = db.getSavingAccountById(req.params.id) || db.getSavingAccountByNo(req.params.id);
    if (!account) {
      res.status(404).json({
        success: false,
        error: { code: 'ACCOUNT_NOT_FOUND', message: 'Savings account not found.' },
        requestId: req.requestId,
      });
      return;
    }

    const balances = financialService.calculateAccountBalances(account.id);
    const member = db.getMemberById(account.memberId);
    const transactions = db
      .getFinancialTransactions()
      .filter((t) => t.accountId === account.id)
      .slice(0, 50);

    res.json({
      success: true,
      data: {
        account,
        balances,
        member: member
          ? {
              id: member.id,
              membershipNo: member.membershipNo,
              fullName: member.fullName,
              phone: member.phoneNumber,
              email: member.email,
              status: member.status,
            }
          : null,
        recentTransactions: transactions,
      },
      requestId: req.requestId,
    });
  };

  public getMyAccounts = async (req: Request, res: Response): Promise<void> => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      return;
    }

    const member = db.getMemberByUserId(user.id);
    if (!member) {
      res.json({ success: true, data: [] });
      return;
    }

    const accounts = db.getSavingAccountsByMemberId(member.id);
    const enriched = accounts.map((acc) => {
      const bal = financialService.calculateAccountBalances(acc.id);
      return {
        ...acc,
        availableBalance: bal.availableBalance,
        clearedBalance: bal.clearedBalance,
        heldBalance: bal.heldBalance,
        holdingBatches: bal.holdingBatches,
      };
    });

    res.json({
      success: true,
      data: enriched,
      requestId: req.requestId,
    });
  };

  public openAccount = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const {
        memberId,
        productCode,
        initialDeposit,
        paymentChannel,
        bankReferenceNo,
        guardianName,
        guardianRelationship,
        termMonths,
        expectedMaturityDate,
        maturityAction,
      } = req.body;

      if (!memberId || !productCode) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'memberId and productCode are required.' },
          requestId: req.requestId,
        });
        return;
      }

      const account = financialService.openSavingAccount({
        memberId,
        productCode,
        initialDeposit: initialDeposit ? Number(initialDeposit) : undefined,
        paymentChannel,
        bankReferenceNo,
        guardianName,
        guardianRelationship,
        termMonths: termMonths ? Number(termMonths) : undefined,
        expectedMaturityDate,
        maturityAction,
        performedById: user.id,
        performedByName: user.fullName || user.username || 'Staff',
      });

      res.status(201).json({
        success: true,
        data: account,
        message: `Savings account ${account.accountNo} opened successfully.`,
        requestId: req.requestId,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'ACCOUNT_OPENING_FAILED', message: err.message },
        requestId: req.requestId,
      });
    }
  };

  // ==========================================
  // TRANSACTIONS: DEPOSITS, WITHDRAWALS, TRANSFERS
  // ==========================================
  public deposit = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { accountId, amount, paymentChannel, bankReferenceNo, narration, idempotencyKey } = req.body;

      if (!accountId || !amount || !paymentChannel) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'accountId, amount, and paymentChannel are required.' },
          requestId: req.requestId,
        });
        return;
      }

      const transaction = financialService.executeDeposit({
        accountId,
        amount: Number(amount),
        paymentChannel,
        bankReferenceNo,
        narration,
        idempotencyKey,
        performedById: user.id,
        performedByName: user.fullName || user.username || 'Staff',
      });

      res.status(201).json({
        success: true,
        data: transaction,
        message: `Deposit of ${Number(amount).toLocaleString()} ETB posted successfully. Transaction No: ${transaction.transactionNo}`,
        requestId: req.requestId,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'DEPOSIT_FAILED', message: err.message },
        requestId: req.requestId,
      });
    }
  };

  public withdraw = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { accountId, amount, paymentChannel, bankReferenceNo, narration, reason, idempotencyKey } = req.body;

      if (!accountId || !amount || !paymentChannel) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'accountId, amount, and paymentChannel are required.' },
          requestId: req.requestId,
        });
        return;
      }

      const result = financialService.executeWithdrawal({
        accountId,
        amount: Number(amount),
        paymentChannel,
        bankReferenceNo,
        narration,
        reason,
        idempotencyKey,
        performedById: user.id,
        performedByName: user.fullName || user.username,
      });

      if (result.requiresApproval) {
        res.status(202).json({
          success: true,
          data: result.transaction,
          requiresApproval: true,
          approvalId: result.approvalId,
          message: `Large withdrawal of ${Number(amount).toLocaleString()} ETB requires Manager approval before disbursement. Routed to Maker-Checker queue.`,
          requestId: req.requestId,
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: result.transaction,
        requiresApproval: false,
        message: `Withdrawal of ${Number(amount).toLocaleString()} ETB posted successfully. Transaction No: ${result.transaction.transactionNo}`,
        requestId: req.requestId,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'WITHDRAWAL_FAILED', message: err.message },
        requestId: req.requestId,
      });
    }
  };

  public transfer = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { sourceAccountId, destinationAccountId, amount, narration, idempotencyKey } = req.body;

      if (!sourceAccountId || !destinationAccountId || !amount) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'sourceAccountId, destinationAccountId, and amount are required.' },
          requestId: req.requestId,
        });
        return;
      }

      const result = financialService.executeTransfer({
        sourceAccountId,
        destinationAccountId,
        amount: Number(amount),
        narration,
        idempotencyKey,
        performedById: user.id,
        performedByName: user.fullName || user.username,
      });

      res.status(201).json({
        success: true,
        data: result,
        message: `Internal transfer of ${Number(amount).toLocaleString()} ETB completed successfully.`,
        requestId: req.requestId,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'TRANSFER_FAILED', message: err.message },
        requestId: req.requestId,
      });
    }
  };

  public reverseTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const userRoles = db.getUserRoles(user.id);
      const primaryRole = userRoles[0]?.code || 'USER';
      const { reason } = req.body;

      if (!reason) {
        res.status(400).json({
          success: false,
          error: { code: 'REASON_REQUIRED', message: 'A formal justification reason is required for transaction reversals.' },
          requestId: req.requestId,
        });
        return;
      }

      const reversalTx = financialService.reverseTransaction({
        transactionId: req.params.id,
        reason,
        performedById: user.id,
        performedByName: user.fullName || user.username,
        performedByRole: primaryRole,
      });

      res.status(200).json({
        success: true,
        data: reversalTx,
        message: `Transaction reversed successfully with compensating transaction ${reversalTx.transactionNo}.`,
        requestId: req.requestId,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'REVERSAL_FAILED', message: err.message },
        requestId: req.requestId,
      });
    }
  };

  // ==========================================
  // MAKER-CHECKER FINANCIAL APPROVAL QUEUE
  // ==========================================
  public getApprovals = async (req: Request, res: Response): Promise<void> => {
    const { status, type } = req.query;
    let approvals = db.getFinancialApprovals();

    if (status) {
      approvals = approvals.filter((a) => a.status === String(status));
    }
    if (type) {
      approvals = approvals.filter((a) => a.requestType === String(type));
    }

    res.json({
      success: true,
      data: approvals,
      count: approvals.length,
      requestId: req.requestId,
    });
  };

  public approveApprovalRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const userRoles = db.getUserRoles(user.id);
      const primaryRole = userRoles[0]?.code || 'USER';
      const { decision, comments } = req.body;

      if (!decision || !['APPROVED', 'REJECTED'].includes(decision)) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_DECISION', message: 'decision must be either APPROVED or REJECTED.' },
          requestId: req.requestId,
        });
        return;
      }

      const result = financialService.approveFinancialRequest({
        approvalId: req.params.id,
        reviewerId: user.id,
        reviewerName: user.fullName || user.username,
        reviewerRole: primaryRole,
        decision,
        comments,
      });

      res.json({
        success: true,
        data: result,
        message: `Financial approval request ${decision === 'APPROVED' ? 'approved and executed' : 'rejected'} successfully.`,
        requestId: req.requestId,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'APPROVAL_ACTION_FAILED', message: err.message },
        requestId: req.requestId,
      });
    }
  };

  // ==========================================
  // FINANCIAL LEDGER & AUDIT
  // ==========================================
  public getTransactions = async (req: Request, res: Response): Promise<void> => {
    const { accountId, memberId, productCode, type, status, startDate, endDate, search, limit } = req.query;
    let transactions = db.getFinancialTransactions();

    if (accountId) {
      transactions = transactions.filter((t) => t.accountId === String(accountId));
    }
    if (memberId) {
      transactions = transactions.filter((t) => t.memberId === String(memberId));
    }
    if (productCode) {
      transactions = transactions.filter((t) => t.productCode === String(productCode));
    }
    if (type) {
      transactions = transactions.filter((t) => t.type === String(type));
    }
    if (status) {
      transactions = transactions.filter((t) => t.status === String(status));
    }
    if (startDate) {
      transactions = transactions.filter((t) => t.timestamp >= String(startDate));
    }
    if (endDate) {
      transactions = transactions.filter((t) => t.timestamp <= String(endDate));
    }
    if (search) {
      const q = String(search).toLowerCase();
      transactions = transactions.filter(
        (t) =>
          t.transactionNo.toLowerCase().includes(q) ||
          t.accountNo.toLowerCase().includes(q) ||
          t.membershipNo.toLowerCase().includes(q) ||
          t.memberName.toLowerCase().includes(q) ||
          (t.bankReferenceNo && t.bankReferenceNo.toLowerCase().includes(q))
      );
    }

    const max = limit ? Number(limit) : 200;
    const paged = transactions.slice(0, max);

    res.json({
      success: true,
      data: paged,
      count: paged.length,
      totalCount: transactions.length,
      requestId: req.requestId,
    });
  };

  public getTransactionById = async (req: Request, res: Response): Promise<void> => {
    const tx = db.getFinancialTransactionById(req.params.id) || db.getFinancialTransactionByNo(req.params.id);
    if (!tx) {
      res.status(404).json({
        success: false,
        error: { code: 'TRANSACTION_NOT_FOUND', message: 'Transaction not found.' },
        requestId: req.requestId,
      });
      return;
    }

    const journal = db.getJournalEntries().find((j) => j.transactionId === tx.id || j.transactionReference === tx.transactionNo);
    const account = db.getSavingAccountById(tx.accountId);

    res.json({
      success: true,
      data: {
        transaction: tx,
        journal,
        account,
      },
      requestId: req.requestId,
    });
  };

  public getMyTransactions = async (req: Request, res: Response): Promise<void> => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      return;
    }

    const member = db.getMemberByUserId(user.id);
    if (!member) {
      res.json({ success: true, data: [] });
      return;
    }

    const transactions = db
      .getFinancialTransactions()
      .filter((t) => t.memberId === member.id)
      .slice(0, 100);

    res.json({
      success: true,
      data: transactions,
      count: transactions.length,
      requestId: req.requestId,
    });
  };

  // ==========================================
  // COMPULSORY MONTHLY SAVINGS MONITORING
  // ==========================================
  public getMonthlySchedules = async (req: Request, res: Response): Promise<void> => {
    const { yearMonth, memberId, status } = req.query;
    let schedules = db.getMonthlySavingsSchedules();

    if (yearMonth) {
      schedules = schedules.filter((s) => s.yearMonth === String(yearMonth));
    }
    if (memberId) {
      schedules = schedules.filter((s) => s.memberId === String(memberId));
    }
    if (status) {
      schedules = schedules.filter((s) => s.status === String(status));
    }

    res.json({
      success: true,
      data: schedules,
      count: schedules.length,
      requestId: req.requestId,
    });
  };

  public getMyMonthlySchedule = async (req: Request, res: Response): Promise<void> => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      return;
    }

    const member = db.getMemberByUserId(user.id);
    if (!member) {
      res.json({ success: true, data: [] });
      return;
    }

    const schedules = db.getMonthlySavingsSchedules().filter((s) => s.memberId === member.id);
    res.json({
      success: true,
      data: schedules,
      requestId: req.requestId,
    });
  };

  // ==========================================
  // GENERAL LEDGER: CHART OF ACCOUNTS & JOURNALS
  // ==========================================
  public getChartOfAccounts = async (req: Request, res: Response): Promise<void> => {
    const accounts = db.getChartOfAccounts();
    res.json({
      success: true,
      data: accounts,
      requestId: req.requestId,
    });
  };

  public getJournalEntries = async (req: Request, res: Response): Promise<void> => {
    const { startDate, endDate, search, limit } = req.query;
    let journals = db.getJournalEntries();

    if (startDate) {
      journals = journals.filter((j) => j.date >= String(startDate));
    }
    if (endDate) {
      journals = journals.filter((j) => j.date <= String(endDate));
    }
    if (search) {
      const q = String(search).toLowerCase();
      journals = journals.filter(
        (j) =>
          j.journalNo.toLowerCase().includes(q) ||
          j.transactionReference.toLowerCase().includes(q) ||
          j.narration.toLowerCase().includes(q)
      );
    }

    const max = limit ? Number(limit) : 200;
    const paged = journals.slice(0, max);

    res.json({
      success: true,
      data: paged,
      count: paged.length,
      totalCount: journals.length,
      requestId: req.requestId,
    });
  };

  // ==========================================
  // BATCH INTEREST POSTING & SYSTEM SETTINGS
  // ==========================================
  public runBatchInterest = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { productCode, effectiveDate } = req.body;

      const run = financialService.runBatchInterestPosting({
        productCode,
        effectiveDate,
        performedById: user.id,
        performedByName: user.fullName || user.username,
      });

      res.status(200).json({
        success: true,
        data: run,
        message: `Batch interest calculation completed successfully. Processed ${run.totalAccountsProcessed} accounts for a total of ${run.totalInterestAmount.toLocaleString()} ETB.`,
        requestId: req.requestId,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'INTEREST_RUN_FAILED', message: err.message },
        requestId: req.requestId,
      });
    }
  };

  public getInterestRuns = async (req: Request, res: Response): Promise<void> => {
    const runs = db.getInterestPostingRuns();
    res.json({
      success: true,
      data: runs,
      requestId: req.requestId,
    });
  };

  public getSystemSettings = async (req: Request, res: Response): Promise<void> => {
    const settings = db.getSystemSettings();
    res.json({
      success: true,
      data: settings,
      requestId: req.requestId,
    });
  };

  public updateSystemSettings = async (req: Request, res: Response): Promise<void> => {
    const updated = db.updateSystemSettings(req.body);
    res.json({
      success: true,
      data: updated,
      message: 'System financial settings updated successfully.',
      requestId: req.requestId,
    });
  };
}

export const financialController = new FinancialController();
