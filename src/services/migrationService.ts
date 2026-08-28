import { apiClient } from './apiClient';
import {
  MigrationBatch,
  MigrationException,
  SourcePackageInfo,
  WorksheetMappingConfig,
} from '../types/migration';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

export const migrationClientService = {
  /**
   * Get available built-in source packages
   */
  async getPackages(): Promise<ApiResponse<SourcePackageInfo[]>> {
    return apiClient.get<ApiResponse<SourcePackageInfo[]>>('/migration/packages');
  },

  /**
   * Initialize a new batch from a built-in package
   */
  async initFromPackage(packageKey: 'all_members_399' | 'deresegn_report_2'): Promise<ApiResponse<MigrationBatch>> {
    return apiClient.post<ApiResponse<MigrationBatch>>('/migration/init-package', { packageKey });
  },

  /**
   * Upload an Excel/CSV file (base64)
   */
  async uploadFile(filename: string, base64Data: string): Promise<ApiResponse<MigrationBatch>> {
    return apiClient.post<ApiResponse<MigrationBatch>>('/migration/upload', { filename, base64Data });
  },

  /**
   * Get all migration batches
   */
  async getBatches(): Promise<ApiResponse<MigrationBatch[]>> {
    return apiClient.get<ApiResponse<MigrationBatch[]>>('/migration/batches');
  },

  /**
   * Get a batch by ID
   */
  async getBatchById(id: string): Promise<ApiResponse<MigrationBatch>> {
    return apiClient.get<ApiResponse<MigrationBatch>>(`/migration/batches/${id}`);
  },

  /**
   * Update mappings and re-run dry run
   */
  async updateMappings(
    id: string,
    mappings: WorksheetMappingConfig[],
    makerNotes?: string
  ): Promise<ApiResponse<MigrationBatch>> {
    return apiClient.put<ApiResponse<MigrationBatch>>(`/migration/batches/${id}/mappings`, { mappings, makerNotes });
  },

  /**
   * Execute Dry Run simulation
   */
  async runDryRun(id: string): Promise<ApiResponse<MigrationBatch>> {
    return apiClient.post<ApiResponse<MigrationBatch>>(`/migration/batches/${id}/dry-run`, {});
  },

  /**
   * Maker submits batch for Checker approval
   */
  async submitBatch(id: string, notes?: string): Promise<ApiResponse<MigrationBatch>> {
    return apiClient.post<ApiResponse<MigrationBatch>>(`/migration/batches/${id}/submit`, { notes });
  },

  /**
   * Checker approves batch
   */
  async approveBatch(id: string, mfaCode?: string, checkerNotes?: string): Promise<ApiResponse<MigrationBatch>> {
    return apiClient.post<ApiResponse<MigrationBatch>>(`/migration/batches/${id}/approve`, { mfaCode, checkerNotes });
  },

  /**
   * Checker rejects batch
   */
  async rejectBatch(id: string, reason: string): Promise<ApiResponse<MigrationBatch>> {
    return apiClient.post<ApiResponse<MigrationBatch>>(`/migration/batches/${id}/reject`, { reason });
  },

  /**
   * Execute real production import
   */
  async executeImport(id: string): Promise<ApiResponse<MigrationBatch>> {
    return apiClient.post<ApiResponse<MigrationBatch>>(`/migration/batches/${id}/import`, {});
  },

  /**
   * Rollback a migration batch
   */
  async rollbackBatch(
    id: string,
    reason: string
  ): Promise<ApiResponse<{ success: boolean; deletedCounts: Record<string, number>; batch: MigrationBatch }>> {
    return apiClient.post<ApiResponse<{ success: boolean; deletedCounts: Record<string, number>; batch: MigrationBatch }>>(
      `/migration/batches/${id}/rollback`,
      { reason }
    );
  },

  /**
   * Get exceptions for a batch
   */
  async getExceptions(batchId: string): Promise<ApiResponse<MigrationException[]>> {
    return apiClient.get<ApiResponse<MigrationException[]>>(`/migration/batches/${batchId}/exceptions`);
  },

  /**
   * Resolve an exception item
   */
  async resolveException(
    id: string,
    action: 'RESOLVED' | 'SKIPPED' | 'OVERRIDDEN',
    resolutionNote?: string
  ): Promise<ApiResponse<MigrationException>> {
    return apiClient.post<ApiResponse<MigrationException>>(`/migration/exceptions/${id}/resolve`, {
      action,
      resolutionNote,
    });
  },

  /**
   * Download source file helper
   */
  getDownloadSourceFileUrl(packageKey: string): string {
    return `/api/migration/source-file/${packageKey}`;
  },

  /**
   * Export CSV url
   */
  getExportCsvUrl(batchId: string, type: 'SUMMARY' | 'MEMBERS' | 'FINANCIAL' | 'EXCEPTIONS'): string {
    return `/api/migration/batches/${batchId}/export?type=${type}`;
  },
};
