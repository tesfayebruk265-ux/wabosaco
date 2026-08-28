import { Request, Response } from 'express';
import { biService } from '../services/biService';
import { reportService } from '../services/reportService';
import { forecastingService } from '../services/forecastingService';
import { searchService } from '../services/searchService';
import { db } from '../db/database';
import { DbScheduledReport } from '../db/schema';

class BiController {
  // ==========================================
  // DASHBOARDS
  // ==========================================
  public getExecutiveDashboard(req: Request, res: Response): void {
    try {
      const data = biService.getExecutiveDashboard({
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      });
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  }

  public getAccountantDashboard(req: Request, res: Response): void {
    try {
      const data = biService.getAccountantDashboard();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  }

  public getManagerDashboard(req: Request, res: Response): void {
    try {
      const data = biService.getManagerDashboard();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  }

  public getAuditorDashboard(req: Request, res: Response): void {
    try {
      const data = biService.getAuditorDashboard();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  }

  public getCustomerServiceDashboard(req: Request, res: Response): void {
    try {
      const data = biService.getCustomerServiceDashboard();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  }

  public getMemberDashboard(req: Request, res: Response): void {
    try {
      const memberId = (req.params.memberId || (req.user as any)?.memberId || req.user?.id) as string;
      const data = biService.getMemberDashboard(memberId);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  }

  // Dashboard Widget Configurations
  public getWidgetConfig(req: Request, res: Response): void {
    try {
      const userId = req.user?.id || 'system';
      const role = req.user?.role || 'ADMIN';
      const config = db.getDashboardWidgetConfig(userId, role);
      res.json({ success: true, data: config || null });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  }

  public saveWidgetConfig(req: Request, res: Response): void {
    try {
      const userId = req.user?.id || 'system';
      const role = req.user?.role || 'ADMIN';
      const { widgets, layout } = req.body;

      const saved = db.saveDashboardWidgetConfig({
        id: `cfg_${userId}_${role}`,
        userId,
        role,
        widgets: widgets || [],
        layout: layout || {},
        updatedAt: new Date().toISOString(),
      });

      res.json({ success: true, data: saved });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  }

  // ==========================================
  // REPORTS
  // ==========================================
  public getReport(req: Request, res: Response): void {
    try {
      const { reportType } = req.params;
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        memberId: req.query.memberId as string,
        membershipNo: req.query.membershipNo as string,
        savingType: req.query.savingType as string,
        loanType: req.query.loanType as string,
        shareType: req.query.shareType as string,
        transactionType: req.query.transactionType as string,
        status: req.query.status as string,
        paymentMethod: req.query.paymentMethod as string,
        minAmount: req.query.minAmount ? Number(req.query.minAmount) : undefined,
        maxAmount: req.query.maxAmount ? Number(req.query.maxAmount) : undefined,
        accountCode: req.query.accountCode as string,
        officer: req.query.officer as string,
        branch: req.query.branch as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 25,
      };

      const result = reportService.generateReport(reportType, filters, req.user);

      // Audit report generation
      db.createAuditLog({
        id: `aud_rep_${Date.now()}`,
        action: 'GENERATE_REPORT',
        resource: 'REPORTS',
        resourceId: reportType,
        actorId: req.user?.id || 'system',
        actorName: req.user?.fullName || req.user?.username || 'Staff User',
        actorRole: req.user?.role || 'ADMIN',
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'API Client',
        result: 'SUCCESS',
        afterState: { title: result.title, filters, totalRecords: result.pagination.totalCount },
        timestamp: new Date().toISOString(),
      });

      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  }

  public exportReport(req: Request, res: Response): void {
    try {
      const { reportType } = req.params;
      const format = (req.query.format as string) || 'csv';

      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        memberId: req.query.memberId as string,
        savingType: req.query.savingType as string,
        loanType: req.query.loanType as string,
        status: req.query.status as string,
        accountCode: req.query.accountCode as string,
        limit: 10000, // full dataset for export
      };

      const result = reportService.generateReport(reportType, filters, req.user);

      // Audit export operation
      db.createAuditLog({
        id: `aud_exp_${Date.now()}`,
        action: 'EXPORT_REPORT',
        resource: 'REPORTS',
        resourceId: reportType,
        actorId: req.user?.id || 'system',
        actorName: req.user?.fullName || req.user?.username || 'Staff User',
        actorRole: req.user?.role || 'ADMIN',
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'API Client',
        result: 'SUCCESS',
        afterState: { title: result.title, format, totalRecords: result.data.length },
        timestamp: new Date().toISOString(),
      });

      if (format.toLowerCase() === 'csv') {
        const csv = reportService.exportToCSV(result);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${reportType}_report_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
        return;
      }

      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  }

  // ==========================================
  // PREDICTIVE ANALYTICS & FORECASTS
  // ==========================================
  public getSavingsForecast(req: Request, res: Response): void {
    try {
      const months = req.query.months ? Number(req.query.months) : 6;
      const data = forecastingService.getSavingsForecast(months);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  }

  public getLoanGrowthForecast(req: Request, res: Response): void {
    try {
      const months = req.query.months ? Number(req.query.months) : 6;
      const data = forecastingService.getLoanGrowthForecast(months);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  }

  public getCashFlowForecast(req: Request, res: Response): void {
    try {
      const months = req.query.months ? Number(req.query.months) : 6;
      const data = forecastingService.getCashFlowForecast(months);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  }

  public getRevenueExpenseForecast(req: Request, res: Response): void {
    try {
      const months = req.query.months ? Number(req.query.months) : 6;
      const data = forecastingService.getRevenueExpenseForecast(months);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  }

  public getExpectedLoanCollections(req: Request, res: Response): void {
    try {
      const months = req.query.months ? Number(req.query.months) : 6;
      const data = forecastingService.getExpectedLoanCollections(months);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  }

  public getMemberGrowthForecast(req: Request, res: Response): void {
    try {
      const months = req.query.months ? Number(req.query.months) : 6;
      const data = forecastingService.getMemberGrowthForecast(months);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  }

  public getDefaultRiskAnalysis(req: Request, res: Response): void {
    try {
      const data = forecastingService.getDefaultRiskAnalysis();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  }

  public getProductTrends(req: Request, res: Response): void {
    try {
      const data = forecastingService.getProductTrends();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  }

  // ==========================================
  // GLOBAL SEARCH
  // ==========================================
  public globalSearch(req: Request, res: Response): void {
    try {
      const q = req.query.q as string;
      const limit = req.query.limit ? Number(req.query.limit) : 25;
      const isMemberOnly = req.user?.role === 'MEMBER';
      const data = searchService.search(q, limit, {
        isMemberOnly,
        memberId: req.user?.id,
        membershipNo: req.user?.membershipNo,
      });
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  }

  // ==========================================
  // SCHEDULED REPORTS
  // ==========================================
  public getScheduledReports(req: Request, res: Response): void {
    try {
      const reports = db.getScheduledReports();
      res.json({ success: true, data: reports });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  }

  public createScheduledReport(req: Request, res: Response): void {
    try {
      const { title, reportType, frequency, format, recipients, filters } = req.body;
      if (!title || !reportType || !frequency) {
        res.status(400).json({ success: false, error: { message: 'Title, reportType, and frequency are required' } });
        return;
      }

      const scheduleNo = db.getNextScheduledReportNo();
      const newSchedule: DbScheduledReport = {
        id: `sch_${Date.now()}`,
        scheduleNo,
        title,
        reportType,
        frequency: frequency || 'MONTHLY',
        format: format || 'PDF',
        recipients: Array.isArray(recipients) ? recipients : [recipients || 'admin@wabisacco.et'],
        filters: filters || {},
        lastRunAt: null,
        nextRunAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'ACTIVE',
        createdById: req.user?.id || 'system',
        createdByName: req.user?.fullName || req.user?.username || 'Staff User',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const created = db.createScheduledReport(newSchedule);

      db.createAuditLog({
        id: `aud_sch_${Date.now()}`,
        action: 'CREATE_SCHEDULED_REPORT',
        resource: 'SCHEDULED_REPORTS',
        resourceId: created.id,
        actorId: req.user?.id || 'system',
        actorName: req.user?.fullName || req.user?.username || 'Staff User',
        actorRole: req.user?.role || 'ADMIN',
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'API Client',
        result: 'SUCCESS',
        afterState: { scheduleNo: created.scheduleNo, title: created.title, frequency: created.frequency },
        timestamp: new Date().toISOString(),
      });

      res.status(201).json({ success: true, data: created });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  }

  public runScheduledReportNow(req: Request, res: Response): void {
    try {
      const { id } = req.params;
      const schedule = db.getScheduledReportById(id);
      if (!schedule) {
        res.status(404).json({ success: false, error: { message: 'Scheduled report not found' } });
        return;
      }

      // Generate the report
      const result = reportService.generateReport(schedule.reportType, schedule.filters, req.user);

      // Update schedule last run time
      const updated = db.updateScheduledReport(id, {
        lastRunAt: new Date().toISOString(),
        lastStatusMessage: `Report generated successfully with ${result.data.length} records. Delivered to ${schedule.recipients.join(', ')}`,
      });

      db.createAuditLog({
        id: `aud_schrun_${Date.now()}`,
        action: 'EXECUTE_SCHEDULED_REPORT',
        resource: 'SCHEDULED_REPORTS',
        resourceId: id,
        actorId: req.user?.id || 'system',
        actorName: req.user?.fullName || req.user?.username || 'Staff User',
        actorRole: req.user?.role || 'ADMIN',
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'API Client',
        result: 'SUCCESS',
        afterState: { scheduleNo: schedule.scheduleNo, title: schedule.title, recordsCount: result.data.length },
        timestamp: new Date().toISOString(),
      });

      res.json({
        success: true,
        message: `Scheduled report '${schedule.title}' successfully executed.`,
        data: {
          schedule: updated,
          report: result,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  }

  public deleteScheduledReport(req: Request, res: Response): void {
    try {
      const { id } = req.params;
      const deleted = db.deleteScheduledReport(id);
      if (!deleted) {
        res.status(404).json({ success: false, error: { message: 'Scheduled report not found' } });
        return;
      }

      res.json({ success: true, message: 'Scheduled report deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  }
}

export const biController = new BiController();
