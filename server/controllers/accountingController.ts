import { Request, Response } from 'express';
import { accountingService } from '../services/accountingService';
import { db } from '../db/database';

class AccountingController {
  // ==========================================
  // CHART OF ACCOUNTS
  // ==========================================
  public getChartOfAccounts = async (req: Request, res: Response): Promise<void> => {
    try {
      const coa = accountingService.getChartOfAccounts();
      res.json({
        success: true,
        data: coa,
        requestId: req.requestId,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
        requestId: req.requestId,
      });
    }
  };

  public getAccountByCode = async (req: Request, res: Response): Promise<void> => {
    try {
      const account = accountingService.getAccountByCode(req.params.code);
      if (!account) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Account not found' },
          requestId: req.requestId,
        });
        return;
      }
      res.json({
        success: true,
        data: account,
        requestId: req.requestId,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
        requestId: req.requestId,
      });
    }
  };

  public createAccount = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = {
        id: req.user?.id || 'system',
        name: req.user?.fullName || req.user?.username || 'Staff User',
        role: req.user?.role || 'ACCOUNTANT',
      };
      const result = accountingService.createAccount(req.body, user);
      if (!result.success) {
        res.status(400).json({
          success: false,
          error: { code: 'CREATION_FAILED', message: result.error },
          requestId: req.requestId,
        });
        return;
      }
      res.status(201).json({
        success: true,
        data: result.account,
        message: 'GL Account created successfully.',
        requestId: req.requestId,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
        requestId: req.requestId,
      });
    }
  };

  public updateAccount = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = {
        id: req.user?.id || 'system',
        name: req.user?.fullName || req.user?.username || 'Staff User',
        role: req.user?.role || 'ACCOUNTANT',
      };
      const result = accountingService.updateAccount(req.params.id, req.body, user);
      if (!result.success) {
        res.status(400).json({
          success: false,
          error: { code: 'UPDATE_FAILED', message: result.error },
          requestId: req.requestId,
        });
        return;
      }
      res.json({
        success: true,
        data: result.account,
        message: 'GL Account updated successfully.',
        requestId: req.requestId,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
        requestId: req.requestId,
      });
    }
  };

  // ==========================================
  // GENERAL LEDGER & TRIAL BALANCE
  // ==========================================
  public getGeneralLedger = async (req: Request, res: Response): Promise<void> => {
    try {
      const { accountCode } = req.params;
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      const report = accountingService.getGeneralLedger(accountCode, startDate, endDate);
      res.json({
        success: true,
        data: report,
        requestId: req.requestId,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
        requestId: req.requestId,
      });
    }
  };

  public getTrialBalance = async (req: Request, res: Response): Promise<void> => {
    try {
      const { asOfDate } = req.query as { asOfDate?: string };
      const report = accountingService.getTrialBalance(asOfDate);
      res.json({
        success: true,
        data: report,
        requestId: req.requestId,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
        requestId: req.requestId,
      });
    }
  };

  // ==========================================
  // FINANCIAL STATEMENTS & RATIOS
  // ==========================================
  public getIncomeStatement = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      const report = accountingService.getIncomeStatement(startDate, endDate);
      res.json({
        success: true,
        data: report,
        requestId: req.requestId,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
        requestId: req.requestId,
      });
    }
  };

  public getBalanceSheet = async (req: Request, res: Response): Promise<void> => {
    try {
      const { asOfDate } = req.query as { asOfDate?: string };
      const report = accountingService.getBalanceSheet(asOfDate);
      res.json({
        success: true,
        data: report,
        requestId: req.requestId,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
        requestId: req.requestId,
      });
    }
  };

  public getFinancialRatios = async (req: Request, res: Response): Promise<void> => {
    try {
      const { asOfDate } = req.query as { asOfDate?: string };
      const report = accountingService.getFinancialRatios(asOfDate);
      res.json({
        success: true,
        data: report,
        requestId: req.requestId,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
        requestId: req.requestId,
      });
    }
  };

  // ==========================================
  // ACCOUNTING PERIODS
  // ==========================================
  public getAccountingPeriods = async (req: Request, res: Response): Promise<void> => {
    try {
      const periods = accountingService.getAccountingPeriods();
      res.json({
        success: true,
        data: periods,
        requestId: req.requestId,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
        requestId: req.requestId,
      });
    }
  };

  public createAccountingPeriod = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = {
        id: req.user?.id || 'system',
        name: req.user?.fullName || req.user?.username || 'Staff User',
        role: req.user?.role || 'ACCOUNTANT',
      };
      const result = accountingService.createAccountingPeriod(req.body, user);
      if (!result.success) {
        res.status(400).json({
          success: false,
          error: { code: 'CREATION_FAILED', message: result.error },
          requestId: req.requestId,
        });
        return;
      }
      res.status(201).json({
        success: true,
        data: result.period,
        message: 'Accounting period created successfully.',
        requestId: req.requestId,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
        requestId: req.requestId,
      });
    }
  };

  public closeAccountingPeriod = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = {
        id: req.user?.id || 'system',
        name: req.user?.fullName || req.user?.username || 'Staff User',
        role: req.user?.role || 'ACCOUNTANT',
      };
      const result = accountingService.closeAccountingPeriod(req.params.id, user);
      if (!result.success) {
        res.status(400).json({
          success: false,
          error: { code: 'CLOSE_FAILED', message: result.error },
          requestId: req.requestId,
        });
        return;
      }
      res.json({
        success: true,
        data: result.period,
        message: 'Accounting period closed successfully with audited legal surplus allocations.',
        requestId: req.requestId,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
        requestId: req.requestId,
      });
    }
  };

  public lockAccountingPeriod = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = {
        id: req.user?.id || 'system',
        name: req.user?.fullName || req.user?.username || 'Staff User',
        role: req.user?.role || 'AUDITOR',
      };
      const result = accountingService.lockAccountingPeriod(req.params.id, user);
      if (!result.success) {
        res.status(400).json({
          success: false,
          error: { code: 'LOCK_FAILED', message: result.error },
          requestId: req.requestId,
        });
        return;
      }
      res.json({
        success: true,
        data: result.period,
        message: 'Accounting period locked permanently against backdated modifications.',
        requestId: req.requestId,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
        requestId: req.requestId,
      });
    }
  };

  public reopenAccountingPeriod = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = {
        id: req.user?.id || 'system',
        name: req.user?.fullName || req.user?.username || 'Staff User',
        role: req.user?.role || 'AUDITOR',
      };
      const reason = req.body?.reason || 'Reopened by auditor authorization';
      const result = accountingService.reopenAccountingPeriod(req.params.id, reason, user);
      if (!result.success) {
        res.status(400).json({
          success: false,
          error: { code: 'REOPEN_FAILED', message: result.error },
          requestId: req.requestId,
        });
        return;
      }
      res.json({
        success: true,
        data: result.period,
        message: 'Accounting period reopened for adjustments.',
        requestId: req.requestId,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
        requestId: req.requestId,
      });
    }
  };

  // ==========================================
  // BANK RECONCILIATIONS
  // ==========================================
  public getBankReconciliations = async (req: Request, res: Response): Promise<void> => {
    try {
      const recons = accountingService.getBankReconciliations();
      res.json({
        success: true,
        data: recons,
        requestId: req.requestId,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
        requestId: req.requestId,
      });
    }
  };

  public getBankReconciliationById = async (req: Request, res: Response): Promise<void> => {
    try {
      const recon = accountingService.getBankReconciliationById(req.params.id);
      if (!recon) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Bank reconciliation statement not found' },
          requestId: req.requestId,
        });
        return;
      }
      res.json({
        success: true,
        data: recon,
        requestId: req.requestId,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
        requestId: req.requestId,
      });
    }
  };

  public createBankReconciliation = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = {
        id: req.user?.id || 'system',
        name: req.user?.fullName || req.user?.username || 'Staff User',
        role: req.user?.role || 'ACCOUNTANT',
      };
      const result = accountingService.createBankReconciliation(req.body, user);
      if (!result.success) {
        res.status(400).json({
          success: false,
          error: { code: 'CREATION_FAILED', message: result.error },
          requestId: req.requestId,
        });
        return;
      }
      res.status(201).json({
        success: true,
        data: result.reconciliation,
        message: 'Bank reconciliation completed and balanced with General Ledger.',
        requestId: req.requestId,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
        requestId: req.requestId,
      });
    }
  };

  // ==========================================
  // ANNUAL BUDGETS & VARIANCE
  // ==========================================
  public getAnnualBudgets = async (req: Request, res: Response): Promise<void> => {
    try {
      const budgets = accountingService.getAnnualBudgets();
      res.json({
        success: true,
        data: budgets,
        requestId: req.requestId,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
        requestId: req.requestId,
      });
    }
  };

  public getAnnualBudgetById = async (req: Request, res: Response): Promise<void> => {
    try {
      const budget = accountingService.getAnnualBudgetById(req.params.id);
      if (!budget) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Budget not found' },
          requestId: req.requestId,
        });
        return;
      }
      res.json({
        success: true,
        data: budget,
        requestId: req.requestId,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
        requestId: req.requestId,
      });
    }
  };

  public createAnnualBudget = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = {
        id: req.user?.id || 'system',
        name: req.user?.fullName || req.user?.username || 'Staff User',
        role: req.user?.role || 'ACCOUNTANT',
      };
      const result = accountingService.createAnnualBudget(req.body, user);
      if (!result.success) {
        res.status(400).json({
          success: false,
          error: { code: 'CREATION_FAILED', message: result.error },
          requestId: req.requestId,
        });
        return;
      }
      res.status(201).json({
        success: true,
        data: result.budget,
        message: 'Operating budget created successfully.',
        requestId: req.requestId,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
        requestId: req.requestId,
      });
    }
  };

  public approveAnnualBudget = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = {
        id: req.user?.id || 'system',
        name: req.user?.fullName || req.user?.username || 'Staff User',
        role: req.user?.role || 'GENERAL_MANAGER',
      };
      const result = accountingService.approveAnnualBudget(req.params.id, user);
      if (!result.success) {
        res.status(400).json({
          success: false,
          error: { code: 'APPROVAL_FAILED', message: result.error },
          requestId: req.requestId,
        });
        return;
      }
      res.json({
        success: true,
        data: result.budget,
        message: 'Annual operating budget approved and activated.',
        requestId: req.requestId,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
        requestId: req.requestId,
      });
    }
  };

  public getBudgetVarianceReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const year = req.query.fiscalYear ? parseInt(req.query.fiscalYear as string, 10) : undefined;
      const report = accountingService.getBudgetVarianceReport(year);
      res.json({
        success: true,
        data: report,
        requestId: req.requestId,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message },
        requestId: req.requestId,
      });
    }
  };
}

export const accountingController = new AccountingController();
