import { Request, Response } from 'express';
import { db } from '../db/database';
import { loanService } from '../services/loanService';
import { DbUser } from '../db/schema';

// Helper to get authenticated user from request
function getAuthUser(req: Request): DbUser | null {
  return (req as any).user || null;
}

export class LoanController {
  // ==========================================
  // LOAN PRODUCTS
  // ==========================================

  public getProducts(req: Request, res: Response): void {
    try {
      const products = db.getLoanProducts();
      res.json({ success: true, data: products });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public getProductById(req: Request, res: Response): void {
    try {
      const { id } = req.params;
      const product = db.getLoanProductById(id);
      if (!product) {
        res.status(404).json({ success: false, error: 'Loan product not found' });
        return;
      }
      res.json({ success: true, data: product });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public createProduct(req: Request, res: Response): void {
    try {
      const user = getAuthUser(req);
      const {
        code,
        name,
        description,
        minAmount,
        maxAmount,
        interestRate,
        interestMethod,
        maxTerm,
        gracePeriod,
        requiresGuarantor,
        minGuarantors,
        maxGuarantors,
        savingsMultiplier,
        glAssetAccountId,
        glInterestIncomeAccountId,
      } = req.body;

      if (!code || !name || !minAmount || !maxAmount || !interestRate || !maxTerm) {
        res.status(400).json({ success: false, error: 'Missing required loan product fields' });
        return;
      }

      const existing = db.getLoanProductById(code);
      if (existing) {
        res.status(400).json({ success: false, error: `Product code '${code}' already exists` });
        return;
      }

      const newProduct = db.createLoanProduct({
        id: `lp_${code.toLowerCase()}_${Date.now()}`,
        code: code.toUpperCase() as any,
        name,
        description: description || '',
        minAmount: Number(minAmount),
        maxAmount: Number(maxAmount),
        interestRate: Number(interestRate),
        interestMethod: interestMethod || 'AMORTIZATION_FIXED_PMT',
        maxTerm: Number(maxTerm),
        gracePeriod: Number(gracePeriod || 0),
        requiresGuarantor: Boolean(requiresGuarantor),
        minGuarantors: Number(minGuarantors || (requiresGuarantor ? 1 : 0)),
        maxGuarantors: Number(maxGuarantors || (requiresGuarantor ? 2 : 0)),
        savingsMultiplier: Number(savingsMultiplier || 4.0),
        status: 'ACTIVE',
        glAssetAccountId: glAssetAccountId || '1210-LN-PER',
        glInterestIncomeAccountId: glInterestIncomeAccountId || '4010-INT-INC',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      res.status(201).json({ success: true, data: newProduct });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public updateProduct(req: Request, res: Response): void {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updated = db.updateLoanProduct(id, updates);
      if (!updated) {
        res.status(404).json({ success: false, error: 'Loan product not found' });
        return;
      }
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // LOAN CALCULATOR
  // ==========================================

  public calculateAmortization(req: Request, res: Response): void {
    try {
      const { principal, interestRate, termMonths, gracePeriodMonths, startDate } = req.body;
      if (!principal || !interestRate || !termMonths) {
        res.status(400).json({ success: false, error: 'Principal, interestRate, and termMonths are required' });
        return;
      }

      const result = loanService.calculateAmortization(
        Number(principal),
        Number(interestRate),
        Number(termMonths),
        Number(gracePeriodMonths || 0),
        startDate
      );

      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // ELIGIBILITY CHECK
  // ==========================================

  public checkEligibility(req: Request, res: Response): void {
    try {
      const user = getAuthUser(req);
      const memberId = req.params.memberId || (user ? user.memberId || user.username : '');
      const { productCode, amount } = req.query;

      if (!memberId) {
        res.status(400).json({ success: false, error: 'Member identifier is required' });
        return;
      }

      const report = loanService.evaluateEligibility(
        memberId,
        productCode as string | undefined,
        amount ? Number(amount) : undefined
      );

      res.json({ success: true, data: report });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // LOAN APPLICATION WORKFLOW
  // ==========================================

  public apply(req: Request, res: Response): void {
    try {
      const user = getAuthUser(req);
      const payload = req.body;

      // If user is a member, enforce memberId to be their own
      if (user && user.role === 'MEMBER') {
        const member = db.getMembers().find(
          (m) => m.id === user.memberId || m.membershipNo.toLowerCase() === user.username.toLowerCase()
        );
        if (member) {
          payload.memberId = member.id;
        }
      }

      if (!payload.memberId || !payload.productId || !payload.requestedAmount || !payload.requestedTermMonths) {
        res.status(400).json({ success: false, error: 'Missing required loan application fields' });
        return;
      }

      const newLoan = loanService.applyForLoan(payload, user || undefined);
      res.status(201).json({ success: true, data: newLoan });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  public getMyApplications(req: Request, res: Response): void {
    try {
      const user = getAuthUser(req);
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const member = db.getMembers().find(
        (m) => m.id === user.memberId || m.membershipNo.toLowerCase() === user.username.toLowerCase()
      );
      const memberId = member ? member.id : user.username;

      const loans = db.getLoansByMemberId(memberId);
      res.json({ success: true, data: loans });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public getMyActiveLoan(req: Request, res: Response): void {
    try {
      const user = getAuthUser(req);
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const member = db.getMembers().find(
        (m) => m.id === user.memberId || m.membershipNo.toLowerCase() === user.username.toLowerCase()
      );
      const memberId = member ? member.id : user.username;

      const loan = db.getActiveLoanByMemberId(memberId);
      if (!loan) {
        res.json({ success: true, data: null });
        return;
      }

      const schedule = db.getLoanSchedules(loan.id);
      const repayments = db.getLoanRepayments(loan.id);

      res.json({
        success: true,
        data: {
          loan,
          schedule,
          repayments,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public getMyGuarantorRequests(req: Request, res: Response): void {
    try {
      const user = getAuthUser(req);
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const member = db.getMembers().find(
        (m) => m.id === user.memberId || m.membershipNo.toLowerCase() === user.username.toLowerCase()
      );
      const memberId = member ? member.id : user.username;
      const membershipNo = member ? member.membershipNo : user.username;

      const loans = db.getLoans();
      const requests: Array<{ loan: any; guarantorRecord: any }> = [];

      loans.forEach((l) => {
        const g = (l.guarantors || []).find(
          (item) => item.guarantorMemberId === memberId || item.guarantorMembershipNo === membershipNo
        );
        if (g) {
          requests.push({
            loan: {
              id: l.id,
              loanNo: l.loanNo,
              memberName: l.memberName,
              membershipNo: l.membershipNo,
              productName: l.productName,
              requestedAmount: l.requestedAmount,
              requestedTermMonths: l.requestedTermMonths,
              purpose: l.purpose,
              status: l.status,
              createdAt: l.createdAt,
            },
            guarantorRecord: g,
          });
        }
      });

      res.json({ success: true, data: requests });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public respondGuarantor(req: Request, res: Response): void {
    try {
      const user = getAuthUser(req);
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { loanId, accept, notes } = req.body;
      if (!loanId || accept === undefined) {
        res.status(400).json({ success: false, error: 'loanId and accept decision boolean are required' });
        return;
      }

      const member = db.getMembers().find(
        (m) => m.id === user.memberId || m.membershipNo.toLowerCase() === user.username.toLowerCase()
      );
      const memberId = member ? member.id : user.username;

      const updated = loanService.respondToGuarantorRequest(loanId, memberId, Boolean(accept), notes);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // STAFF QUEUES & APPLICATION MANAGEMENT
  // ==========================================

  public getApplications(req: Request, res: Response): void {
    try {
      const { status, memberId, productCode } = req.query;
      let loans = db.getLoans();

      if (status) {
        const statuses = (status as string).split(',');
        loans = loans.filter((l) => statuses.includes(l.status));
      }
      if (memberId) {
        loans = loans.filter((l) => l.memberId === memberId || l.membershipNo === memberId);
      }
      if (productCode) {
        loans = loans.filter((l) => l.productCode === productCode);
      }

      res.json({ success: true, data: loans });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public getApplicationById(req: Request, res: Response): void {
    try {
      const { id } = req.params;
      const loan = db.getLoanById(id);
      if (!loan) {
        res.status(404).json({ success: false, error: 'Loan not found' });
        return;
      }

      const schedule = db.getLoanSchedules(loan.id);
      const repayments = db.getLoanRepayments(loan.id);

      res.json({
        success: true,
        data: {
          loan,
          schedule,
          repayments,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public reviewApplication(req: Request, res: Response): void {
    try {
      const user = getAuthUser(req);
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const { approved, notes } = req.body;

      if (approved === undefined || !notes) {
        res.status(400).json({ success: false, error: 'Approved status and review notes are required' });
        return;
      }

      const updated = loanService.reviewLoanApplication(id, user, Boolean(approved), notes);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  public approveApplication(req: Request, res: Response): void {
    try {
      const user = getAuthUser(req);
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const { approved, approvedAmount, approvedTermMonths, approvedRate, notes } = req.body;

      if (approved === undefined) {
        res.status(400).json({ success: false, error: 'Approved boolean status is required' });
        return;
      }

      const updated = loanService.approveLoanApplication(
        id,
        user,
        Boolean(approved),
        approvedAmount ? Number(approvedAmount) : undefined,
        approvedTermMonths ? Number(approvedTermMonths) : undefined,
        approvedRate !== undefined ? Number(approvedRate) : undefined,
        notes
      );

      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  public disburse(req: Request, res: Response): void {
    try {
      const user = getAuthUser(req);
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const { paymentChannel, bankReferenceNo, destinationAccountId } = req.body;

      if (!paymentChannel) {
        res.status(400).json({ success: false, error: 'Disbursement paymentChannel is required' });
        return;
      }

      const disbursed = loanService.disburseLoan({
        loanId: id,
        paymentChannel,
        bankReferenceNo,
        destinationAccountId,
        disbursedBy: user,
      });

      res.json({ success: true, data: disbursed });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // REPAYMENTS & SCHEDULES
  // ==========================================

  public getSchedule(req: Request, res: Response): void {
    try {
      const { id } = req.params;
      const schedule = db.getLoanSchedules(id);
      res.json({ success: true, data: schedule });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public getRepayments(req: Request, res: Response): void {
    try {
      const { loanId, memberId } = req.query;
      const repayments = db.getLoanRepayments(loanId as string | undefined, memberId as string | undefined);
      res.json({ success: true, data: repayments });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public recordRepayment(req: Request, res: Response): void {
    try {
      const user = getAuthUser(req);
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { loanId, amount, paymentChannel, bankReferenceNo, sourceSavingAccountId, narration, receiptUrl } = req.body;

      if (!loanId || !amount || !paymentChannel) {
        res.status(400).json({ success: false, error: 'loanId, amount, and paymentChannel are required' });
        return;
      }

      const repayment = loanService.recordRepayment({
        loanId,
        amount: Number(amount),
        paymentChannel,
        bankReferenceNo,
        sourceSavingAccountId,
        narration,
        receiptUrl,
        performedBy: user,
      });

      res.status(201).json({ success: true, data: repayment });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // DELINQUENCY & PENALTY ENGINE
  // ==========================================

  public processOverdue(req: Request, res: Response): void {
    try {
      const result = loanService.scanAndProcessOverdueLoans();
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public waivePenalty(req: Request, res: Response): void {
    try {
      const user = getAuthUser(req);
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const { installmentNumber, reason } = req.body;

      if (!installmentNumber || !reason) {
        res.status(400).json({ success: false, error: 'installmentNumber and reason are required' });
        return;
      }

      const updated = loanService.waivePenalty(id, Number(installmentNumber), user, reason);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // ==========================================
  // REPORTS & STATEMENTS
  // ==========================================

  public getPortfolioSummary(req: Request, res: Response): void {
    try {
      const summary = loanService.getPortfolioSummary();
      res.json({ success: true, data: summary });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public getAgingReport(req: Request, res: Response): void {
    try {
      const aging = loanService.getAgingReport();
      res.json({ success: true, data: aging });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public getProductReport(req: Request, res: Response): void {
    try {
      const productStats = loanService.getProductTypeReport();
      res.json({ success: true, data: productStats });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public getStatement(req: Request, res: Response): void {
    try {
      const { id } = req.params;
      const loan = db.getLoanById(id);
      if (!loan) {
        res.status(404).json({ success: false, error: 'Loan not found' });
        return;
      }

      const schedule = db.getLoanSchedules(loan.id);
      const repayments = db.getLoanRepayments(loan.id);
      const member = db.getMembers().find((m) => m.id === loan.memberId);

      res.json({
        success: true,
        data: {
          statementDate: new Date().toISOString(),
          loan,
          member,
          schedule,
          repayments,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const loanController = new LoanController();
