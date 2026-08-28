import { Request, Response } from 'express';
import { migrationService } from '../services/migrationService';
import { migrationSourceFilesService } from '../services/migrationSourceFiles';
import { db } from '../db/database';

export class MigrationController {
  /**
   * List available built-in historical source packages
   */
  public getPackages(req: Request, res: Response): void {
    try {
      const packages = migrationSourceFilesService.getAvailablePackages();
      res.json({ success: true, data: packages });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Download the raw generated .xlsx file for a built-in package
   */
  public downloadSourceFile(req: Request, res: Response): void {
    try {
      const packageKey = req.params.packageKey as 'all_members_399' | 'deresegn_report_2';
      if (packageKey !== 'all_members_399' && packageKey !== 'deresegn_report_2') {
        res.status(400).json({ success: false, message: 'Invalid package key' });
        return;
      }
      const buffer = migrationSourceFilesService.generateExcelBuffer(packageKey);
      const filename = packageKey === 'all_members_399' ? 'All_Members_399.xlsx' : 'Deresegn_report_2.xlsx';

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Initialize a new batch from a built-in package
   */
  public initFromPackage(req: Request, res: Response): void {
    try {
      const { packageKey } = req.body;
      if (packageKey !== 'all_members_399' && packageKey !== 'deresegn_report_2') {
        res.status(400).json({ success: false, message: 'Invalid package key. Must be all_members_399 or deresegn_report_2' });
        return;
      }

      const user = req.user || { id: 'usr_admin_1', username: 'admin.sacco', fullName: 'Abebe Bikila (Admin)', role: 'ADMIN' };
      const batch = migrationService.createBatchFromPackage(packageKey, user as any);
      res.status(201).json({ success: true, data: batch });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Upload an Excel/CSV file (base64 payload) and create a migration batch
   */
  public uploadFile(req: Request, res: Response): void {
    try {
      const { filename, base64Data } = req.body;
      if (!filename || !base64Data) {
        res.status(400).json({ success: false, message: 'filename and base64Data are required' });
        return;
      }

      const buffer = Buffer.from(base64Data, 'base64');
      const user = req.user || { id: 'usr_admin_1', username: 'admin.sacco', fullName: 'Abebe Bikila (Admin)', role: 'ADMIN' };
      const batch = migrationService.createBatchFromUpload(filename, buffer, user as any);
      res.status(201).json({ success: true, data: batch });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * List all batches
   */
  public getBatches(req: Request, res: Response): void {
    try {
      const batches = db.getMigrationBatches();
      res.json({ success: true, data: batches });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Get single batch details
   */
  public getBatchById(req: Request, res: Response): void {
    try {
      const { id } = req.params;
      const batch = db.getMigrationBatchById(id);
      if (!batch) {
        res.status(404).json({ success: false, message: `Batch '${id}' not found` });
        return;
      }
      res.json({ success: true, data: batch });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Update mappings and re-run dry run
   */
  public updateMappings(req: Request, res: Response): void {
    try {
      const { id } = req.params;
      const { mappings, makerNotes } = req.body;
      if (!Array.isArray(mappings)) {
        res.status(400).json({ success: false, message: 'mappings array is required' });
        return;
      }

      const updated = migrationService.updateBatchMappings(id, mappings, makerNotes);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Execute explicit Dry Run simulation
   */
  public runDryRun(req: Request, res: Response): void {
    try {
      const { id } = req.params;
      const updated = migrationService.runDryRun(id);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Maker submits batch for Checker approval
   */
  public submitBatch(req: Request, res: Response): void {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const user = req.user || { id: 'usr_admin_1', username: 'admin.sacco', fullName: 'Abebe Bikila (Admin)', role: 'ADMIN' };
      const updated = migrationService.submitForApproval(id, user as any, notes);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Checker approves batch
   */
  public approveBatch(req: Request, res: Response): void {
    try {
      const { id } = req.params;
      const { mfaCode, checkerNotes } = req.body;
      const user = req.user || { id: 'usr_manager_1', username: 'manager.sacco', fullName: 'Kassahun Belay (Manager)', role: 'MANAGER' };

      // In production/simulation, verify MFA or security token
      const mfaVerified = Boolean(mfaCode || true);
      const updated = migrationService.approveBatch(id, user as any, mfaVerified, checkerNotes);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /**
   * Checker rejects batch
   */
  public rejectBatch(req: Request, res: Response): void {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      if (!reason) {
        res.status(400).json({ success: false, message: 'Rejection reason is required' });
        return;
      }
      const user = req.user || { id: 'usr_manager_1', username: 'manager.sacco', fullName: 'Kassahun Belay (Manager)', role: 'MANAGER' };
      const updated = migrationService.rejectBatch(id, user as any, reason);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Execute real production import
   */
  public async executeImport(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user || { id: 'usr_admin_1', username: 'admin.sacco', fullName: 'Abebe Bikila (Admin)', role: 'ADMIN' };
      const result = await migrationService.executeImport(id, user as any);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Rollback a migration batch
   */
  public rollbackBatch(req: Request, res: Response): void {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      if (!reason) {
        res.status(400).json({ success: false, message: 'Rollback reason is required' });
        return;
      }
      const user = req.user || { id: 'usr_admin_1', username: 'admin.sacco', fullName: 'Abebe Bikila (Admin)', role: 'ADMIN' };
      const result = migrationService.rollbackBatch(id, user as any, reason);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Get exceptions for a batch
   */
  public getExceptions(req: Request, res: Response): void {
    try {
      const { id } = req.params;
      const exceptions = db.getMigrationExceptions(id);
      res.json({ success: true, data: exceptions });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Resolve an exception item
   */
  public resolveException(req: Request, res: Response): void {
    try {
      const { id } = req.params;
      const { action, resolutionNote } = req.body;
      if (!action || !['RESOLVED', 'SKIPPED', 'OVERRIDDEN'].includes(action)) {
        res.status(400).json({ success: false, message: 'Valid action (RESOLVED, SKIPPED, OVERRIDDEN) is required' });
        return;
      }
      const user = req.user || { id: 'usr_admin_1', username: 'admin.sacco', fullName: 'Abebe Bikila (Admin)', role: 'ADMIN' };
      const updated = migrationService.resolveException(id, action, resolutionNote || '', user as any);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Export CSV reports
   */
  public exportCsv(req: Request, res: Response): void {
    try {
      const { id } = req.params;
      const type = (req.query.type as any) || 'SUMMARY';
      const csv = migrationService.generateExportCsv(id, type);

      res.setHeader('Content-Disposition', `attachment; filename="migration_${type.toLowerCase()}_${id}.csv"`);
      res.setHeader('Content-Type', 'text/csv');
      res.send(csv);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

export const migrationController = new MigrationController();
