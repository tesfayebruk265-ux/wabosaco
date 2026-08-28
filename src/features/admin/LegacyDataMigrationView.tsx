import React, { useState, useEffect, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Database,
  Search,
  Download,
  Eye,
  FileText,
  FileCheck,
  RotateCcw,
  Sparkles,
  Calendar,
  Lock,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  AlertCircle,
  HelpCircle,
  Hash,
  Coins,
  PiggyBank,
  PieChart,
  Landmark,
  FileCode2,
  Info,
} from 'lucide-react';
import {
  MigrationBatch,
  MigrationException,
  SourcePackageInfo,
  WorksheetMappingConfig,
  MigrationEntityType,
  DuplicateMatch,
} from '../../types/migration';
import { migrationClientService } from '../../services/migrationService';
import { useToast } from '../../providers/ToastProvider';
import { useAuth } from '../../providers/AuthProvider';
import { Button } from '../../components/common/Button';
import { TextInput } from '../../components/common/TextInput';
import { SelectInput } from '../../components/common/SelectInput';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

export const LegacyDataMigrationView: React.FC = () => {
  const { user } = useAuth();
  const { success, error, warning, info } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [packages, setPackages] = useState<SourcePackageInfo[]>([]);
  const [batches, setBatches] = useState<MigrationBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<MigrationBatch | null>(null);
  const [activeStep, setActiveStep] = useState<'PACKAGES' | 'INSPECT' | 'MAPPING' | 'DRY_RUN' | 'GOVERNANCE' | 'EXECUTION' | 'EXCEPTIONS'>('PACKAGES');

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Selected worksheet in inspection
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0);

  // Mappings editing state
  const [currentMappings, setCurrentMappings] = useState<WorksheetMappingConfig[]>([]);
  const [makerNotes, setMakerNotes] = useState('');
  const [isSavingMappings, setIsSavingMappings] = useState(false);

  // Dry Run state
  const [isRunningDryRun, setIsRunningDryRun] = useState(false);

  // Approval Modal state
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [mfaCode, setMfaCode] = useState('123456');
  const [checkerNotes, setCheckerNotes] = useState('Authorized migration batch after verified ledger reconciliation.');
  const [isApproving, setIsApproving] = useState(false);

  // Rejection Modal state
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Execution state
  const [isImporting, setIsImporting] = useState(false);

  // Rollback Modal state
  const [rollbackModalOpen, setRollbackModalOpen] = useState(false);
  const [rollbackReason, setRollbackReason] = useState('Rollback initiated due to test audit or reconciliation adjustment');
  const [isRollingBack, setIsRollingBack] = useState(false);

  // Exceptions state
  const [exceptions, setExceptions] = useState<MigrationException[]>([]);
  const [selectedException, setSelectedException] = useState<MigrationException | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [isResolvingException, setIsResolvingException] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [pkgsRes, batchesRes] = await Promise.all([
        migrationClientService.getPackages(),
        migrationClientService.getBatches(),
      ]);

      if (pkgsRes.success) setPackages(pkgsRes.data);
      if (batchesRes.success) {
        setBatches(batchesRes.data);
        if (batchesRes.data.length > 0) {
          setSelectedBatch(batchesRes.data[0]);
          setCurrentMappings(batchesRes.data[0].mappings || []);
        }
      }
    } catch (err: any) {
      error(err.message || 'Failed to load migration data');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBatches = async (selectId?: string) => {
    try {
      const res = await migrationClientService.getBatches();
      if (res.success) {
        setBatches(res.data);
        if (selectId) {
          const found = res.data.find((b) => b.id === selectId);
          if (found) {
            setSelectedBatch(found);
            setCurrentMappings(found.mappings || []);
          }
        } else if (selectedBatch) {
          const found = res.data.find((b) => b.id === selectedBatch.id);
          if (found) {
            setSelectedBatch(found);
            setCurrentMappings(found.mappings || []);
          }
        }
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Initialize from built-in package
  const handleInitPackage = async (packageKey: 'all_members_399' | 'deresegn_report_2') => {
    setIsLoading(true);
    try {
      const res = await migrationClientService.initFromPackage(packageKey);
      if (res.success) {
        success(`Initialized migration batch ${res.data.batchNumber} from ${res.data.sourceFileName}`);
        await refreshBatches(res.data.id);
        setActiveStep('INSPECT');
      }
    } catch (err: any) {
      error(err.message || 'Failed to initialize migration package');
    } finally {
      setIsLoading(false);
    }
  };

  // Upload custom file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        const res = await migrationClientService.uploadFile(file.name, base64);
        if (res.success) {
          success(`Uploaded and inspected ${file.name} successfully (Batch: ${res.data.batchNumber})`);
          await refreshBatches(res.data.id);
          setActiveStep('INSPECT');
        }
      } catch (err: any) {
        error(err.message || 'Failed to upload and parse file');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Column Mappings
  const handleSaveMappings = async () => {
    if (!selectedBatch) return;
    setIsSavingMappings(true);
    try {
      const res = await migrationClientService.updateMappings(selectedBatch.id, currentMappings, makerNotes);
      if (res.success) {
        success('Column mappings and transforms saved. Dry run recalculated.');
        setSelectedBatch(res.data);
        setCurrentMappings(res.data.mappings);
        await refreshBatches(res.data.id);
        setActiveStep('DRY_RUN');
      }
    } catch (err: any) {
      error(err.message || 'Failed to save mappings');
    } finally {
      setIsSavingMappings(false);
    }
  };

  // Re-run Dry Run
  const handleTriggerDryRun = async () => {
    if (!selectedBatch) return;
    setIsRunningDryRun(true);
    try {
      const res = await migrationClientService.runDryRun(selectedBatch.id);
      if (res.success) {
        success('Pre-flight Dry Run simulation refreshed successfully.');
        setSelectedBatch(res.data);
        await refreshBatches(res.data.id);
      }
    } catch (err: any) {
      error(err.message || 'Failed to execute dry run');
    } finally {
      setIsRunningDryRun(false);
    }
  };

  // Submit for Checker Approval
  const handleSubmitForApproval = async () => {
    if (!selectedBatch) return;
    try {
      const res = await migrationClientService.submitBatch(selectedBatch.id, makerNotes);
      if (res.success) {
        success(`Batch ${selectedBatch.batchNumber} submitted for Checker approval.`);
        setSelectedBatch(res.data);
        await refreshBatches(res.data.id);
        setActiveStep('GOVERNANCE');
      }
    } catch (err: any) {
      error(err.message || 'Failed to submit batch');
    }
  };

  // Checker Approval
  const handleApprove = async () => {
    if (!selectedBatch) return;
    setIsApproving(true);
    try {
      const res = await migrationClientService.approveBatch(selectedBatch.id, mfaCode, checkerNotes);
      if (res.success) {
        success(`Batch ${selectedBatch.batchNumber} approved by Checker with MFA verification.`);
        setApprovalModalOpen(false);
        setSelectedBatch(res.data);
        await refreshBatches(res.data.id);
        setActiveStep('EXECUTION');
      }
    } catch (err: any) {
      error(err.message || 'Approval failed');
    } finally {
      setIsApproving(false);
    }
  };

  // Checker Rejection
  const handleReject = async () => {
    if (!selectedBatch) return;
    if (!rejectionReason.trim()) {
      warning('Please provide a reason for rejecting this batch.');
      return;
    }
    setIsRejecting(true);
    try {
      const res = await migrationClientService.rejectBatch(selectedBatch.id, rejectionReason);
      if (res.success) {
        warning(`Batch ${selectedBatch.batchNumber} rejected.`);
        setRejectionModalOpen(false);
        setSelectedBatch(res.data);
        await refreshBatches(res.data.id);
      }
    } catch (err: any) {
      error(err.message || 'Rejection failed');
    } finally {
      setIsRejecting(false);
    }
  };

  // Execute Production Import
  const handleExecuteImport = async () => {
    if (!selectedBatch) return;
    setIsImporting(true);
    try {
      const res = await migrationClientService.executeImport(selectedBatch.id);
      if (res.success) {
        success(`Production migration import completed! ${res.data.executionStats?.membersCreated || 0} members created with preserved legacy references.`);
        setSelectedBatch(res.data);
        await refreshBatches(res.data.id);
      }
    } catch (err: any) {
      error(err.message || 'Import execution failed');
    } finally {
      setIsImporting(false);
    }
  };

  // Rollback Batch
  const handleRollback = async () => {
    if (!selectedBatch) return;
    if (!rollbackReason.trim()) {
      warning('Please provide a mandatory reason for rolling back this batch.');
      return;
    }
    setIsRollingBack(true);
    try {
      const res = await migrationClientService.rollbackBatch(selectedBatch.id, rollbackReason);
      if (res.success) {
        success(`Batch ${selectedBatch.batchNumber} rolled back cleanly. ${res.data.deletedCounts.membersRemoved || 0} member records removed.`);
        setRollbackModalOpen(false);
        setSelectedBatch(res.data.batch);
        await refreshBatches(selectedBatch.id);
      }
    } catch (err: any) {
      error(err.message || 'Rollback failed');
    } finally {
      setIsRollingBack(false);
    }
  };

  // Load Exceptions
  const handleLoadExceptions = async () => {
    if (!selectedBatch) return;
    try {
      const res = await migrationClientService.getExceptions(selectedBatch.id);
      if (res.success) {
        setExceptions(res.data);
        setActiveStep('EXCEPTIONS');
      }
    } catch (err: any) {
      error(err.message || 'Failed to load exceptions');
    }
  };

  // Resolve Exception
  const handleResolveException = async (action: 'RESOLVED' | 'SKIPPED' | 'OVERRIDDEN') => {
    if (!selectedException) return;
    setIsResolvingException(true);
    try {
      const res = await migrationClientService.resolveException(selectedException.id, action, resolutionNote);
      if (res.success) {
        success(`Exception marked as ${action}`);
        setExceptions((prev) => prev.map((e) => (e.id === res.data.id ? res.data : e)));
        setSelectedException(null);
        setResolutionNote('');
      }
    } catch (err: any) {
      error(err.message || 'Failed to resolve exception');
    } finally {
      setIsResolvingException(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'UPLOADED':
        return <Badge variant="secondary">Uploaded</Badge>;
      case 'READY_FOR_REVIEW':
        return <Badge variant="warning">Ready for Review</Badge>;
      case 'APPROVED':
        return <Badge variant="primary">Approved by Checker</Badge>;
      case 'IMPORTING':
        return <Badge variant="info">Importing...</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      case 'VALIDATION_FAILED':
      case 'FAILED':
        return <Badge variant="danger">Failed</Badge>;
      case 'ROLLED_BACK':
        return <Badge variant="secondary">Rolled Back</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-500 font-medium">Loading Legacy Data Migration Engine...</p>
      </div>
    );
  }

  const activeWorksheet = selectedBatch?.worksheets[selectedSheetIndex];
  const activeMappingConfig = currentMappings.find((m) => m.sheetName === activeWorksheet?.sheetName);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Legacy Data Migration & Financial Reconciliation</h1>
              <p className="text-sm text-gray-500">
                Audited ingestion engine for historical Excel records (399 members, SADV IDs, Book numbers, CBE/Tsehay bank slips, share capital & GL opening balances).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            icon={<Upload className="w-4 h-4" />}
          >
            {isUploading ? 'Uploading...' : 'Upload Excel / CSV'}
          </Button>

          <Button
            variant="secondary"
            onClick={() => refreshBatches()}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Navigation Steps */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-4 pt-3 overflow-x-auto space-x-2">
        <button
          onClick={() => setActiveStep('PACKAGES')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center space-x-2 ${
            activeStep === 'PACKAGES'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>1. Source Packages</span>
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {packages.length}
          </span>
        </button>

        <button
          onClick={() => setActiveStep('INSPECT')}
          disabled={!selectedBatch}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center space-x-2 ${
            activeStep === 'INSPECT'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          } ${!selectedBatch ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Layers className="w-4 h-4" />
          <span>2. Sheet Inspection</span>
          {selectedBatch && (
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
              {selectedBatch.worksheets.length} Sheets
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveStep('MAPPING')}
          disabled={!selectedBatch}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center space-x-2 ${
            activeStep === 'MAPPING'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          } ${!selectedBatch ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <FileCode2 className="w-4 h-4" />
          <span>3. Schema Mapping</span>
        </button>

        <button
          onClick={() => setActiveStep('DRY_RUN')}
          disabled={!selectedBatch}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center space-x-2 ${
            activeStep === 'DRY_RUN'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          } ${!selectedBatch ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>4. Dry Run & Reconciliation</span>
          {selectedBatch?.reconciliation && (
            <span className={`ml-1 text-xs px-2 py-0.5 rounded-full font-bold ${
              selectedBatch.reconciliation.status === 'BALANCED'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {selectedBatch.reconciliation.status}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveStep('GOVERNANCE')}
          disabled={!selectedBatch}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center space-x-2 ${
            activeStep === 'GOVERNANCE'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          } ${!selectedBatch ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Lock className="w-4 h-4" />
          <span>5. Dual Approval</span>
          {selectedBatch && getStatusBadge(selectedBatch.status)}
        </button>

        <button
          onClick={() => setActiveStep('EXECUTION')}
          disabled={!selectedBatch}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center space-x-2 ${
            activeStep === 'EXECUTION'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          } ${!selectedBatch ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>6. Execution & Rollback</span>
        </button>

        <button
          onClick={handleLoadExceptions}
          disabled={!selectedBatch}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center space-x-2 ${
            activeStep === 'EXCEPTIONS'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          } ${!selectedBatch ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>7. Exceptions Queue</span>
        </button>
      </div>

      {/* STEP 1: SOURCE PACKAGES & BATCH SELECTOR */}
      {activeStep === 'PACKAGES' && (
        <div className="space-y-6">
          {/* Built-in packages cards */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Pre-Configured Historical SACCO Datasets</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {packages.map((pkg) => (
                <div
                  key={pkg.key}
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:border-emerald-500 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                          <FileSpreadsheet className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-gray-900">{pkg.filename}</h3>
                          <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                            {pkg.key}
                          </span>
                        </div>
                      </div>
                      <Badge variant="primary">{pkg.totalRecordsCount} Records</Badge>
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed">{pkg.description}</p>

                    <div className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-100">
                      <div className="text-xs font-semibold text-gray-700">Contained Worksheets:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {pkg.sheets.map((sheet, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2 py-0.5 text-xs bg-white text-gray-700 border border-gray-200 rounded-md font-medium"
                          >
                            {sheet}
                          </span>
                        ))}
                      </div>

                      <div className="text-xs text-gray-600 pt-1 flex justify-between">
                        <span>Total Historical Financial Volume:</span>
                        <span className="font-bold text-gray-900">
                          {formatCurrency(pkg.totalFinancialVolume)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 flex items-center space-x-3 border-t border-gray-100 mt-4">
                    <Button
                      variant="primary"
                      onClick={() => handleInitPackage(pkg.key as any)}
                      icon={<ArrowRight className="w-4 h-4" />}
                      className="flex-1"
                    >
                      Inspect & Initialize Batch
                    </Button>
                    <a
                      href={migrationClientService.getDownloadSourceFileUrl(pkg.key)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      title="Download Raw Source .xlsx file"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download Raw
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Batches Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-base font-bold text-gray-900">Migration Batches History & Audit</h3>
                <p className="text-xs text-gray-500">All registered legacy ingestion runs with SHA-256 integrity logs</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-gray-600">
                Total: {batches.length} Batches
              </span>
            </div>

            {batches.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No migration batches created yet. Initialize one of the pre-configured datasets above or upload an Excel file.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100 text-gray-600 font-semibold border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3">Batch Number</th>
                      <th className="px-6 py-3">Source File & SHA-256</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Records / Sheets</th>
                      <th className="px-6 py-3">Financial Volume</th>
                      <th className="px-6 py-3">Uploaded By & Date</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {batches.map((b) => {
                      const isSelected = selectedBatch?.id === b.id;
                      return (
                        <tr
                          key={b.id}
                          className={`hover:bg-gray-50 transition-colors ${
                            isSelected ? 'bg-emerald-50/60 font-medium' : ''
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="font-mono font-bold text-emerald-800">{b.batchNumber}</div>
                            <span className="text-xs text-gray-400">ID: {b.id.slice(0, 14)}...</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900">{b.sourceFileName}</div>
                            <div className="text-xs font-mono text-gray-400 truncate max-w-[200px]" title={b.sourceFileHash}>
                              SHA256: {b.sourceFileHash.slice(0, 16)}...
                            </div>
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(b.status)}</td>
                          <td className="px-6 py-4">
                            <div className="text-gray-900 font-semibold">{b.validationSummary.totalRows} Rows</div>
                            <div className="text-xs text-gray-500">{b.worksheets.length} Sheets</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">
                              {formatCurrency(b.financialSummary.totalFinancialVolume)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Reg: {formatCurrency(b.financialSummary.regularSavings)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-gray-900">{b.uploadedByName}</div>
                            <div className="text-xs text-gray-400">{formatDateTime(b.createdAt)}</div>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <Button
                              variant={isSelected ? 'primary' : 'outline'}
                              size="sm"
                              onClick={() => {
                                setSelectedBatch(b);
                                setCurrentMappings(b.mappings || []);
                                setActiveStep('INSPECT');
                              }}
                            >
                              {isSelected ? 'Active' : 'Inspect'}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: WORKSHEET INSPECTION */}
      {activeStep === 'INSPECT' && selectedBatch && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div>
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-xs px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded font-bold">
                    {selectedBatch.batchNumber}
                  </span>
                  <h2 className="text-xl font-bold text-gray-900">{selectedBatch.sourceFileName}</h2>
                </div>
                <p className="text-xs font-mono text-gray-500 mt-1">
                  SHA-256 Checksum: <span className="text-gray-700">{selectedBatch.sourceFileHash}</span>
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveStep('MAPPING')}
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  Configure Schema Mappings
                </Button>
              </div>
            </div>

            {/* Sheet Selector Tabs */}
            <div className="flex space-x-2 overflow-x-auto pt-4 pb-2">
              {selectedBatch.worksheets.map((ws, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedSheetIndex(index)}
                  className={`px-4 py-2 text-sm rounded-lg font-semibold transition-colors flex items-center space-x-2 ${
                    selectedSheetIndex === index
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>{ws.sheetName}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    selectedSheetIndex === index ? 'bg-emerald-800 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {ws.rowCount} rows
                  </span>
                </button>
              ))}
            </div>

            {/* Active Sheet Card Details */}
            {activeWorksheet && (
              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <span className="text-xs text-gray-500 font-semibold uppercase">Detected Entity Type</span>
                    <div className="text-base font-bold text-gray-900 mt-1">{activeWorksheet.detectedEntityType}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <span className="text-xs text-gray-500 font-semibold uppercase">Total Rows / Columns</span>
                    <div className="text-base font-bold text-gray-900 mt-1">{activeWorksheet.rowCount} rows × {activeWorksheet.columnCount} cols</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <span className="text-xs text-gray-500 font-semibold uppercase">Detected Calendar</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      <span className="text-base font-bold text-gray-900">{activeWorksheet.dateRange?.detectedCalendar || 'AUTO'}</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <span className="text-xs text-gray-500 font-semibold uppercase">Suggested Pipeline Action</span>
                    <div className="text-sm font-bold text-emerald-800 mt-1">{activeWorksheet.suggestedAction}</div>
                  </div>
                </div>

                {/* Report Summary Warning */}
                {activeWorksheet.isReportSummary && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-3 text-blue-900 text-sm">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Report / Summary Sheet Identified:</span> This worksheet contains monthly aggregate report figures. The migration parser will maintain this sheet as audited reference records and will NOT double-count its rows into transactional balance imports.
                    </div>
                  </div>
                )}

                {/* Sample Rows Preview */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-2">Data Preview (Sample Rows):</h4>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200">
                        <tr>
                          {activeWorksheet.headers.map((h, i) => (
                            <th key={i} className="px-4 py-2.5 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {activeWorksheet.sampleRows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-gray-50">
                            {activeWorksheet.headers.map((h, cIdx) => (
                              <td key={cIdx} className="px-4 py-2 whitespace-nowrap font-mono text-gray-800">
                                {String(row[h] !== undefined ? row[h] : '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: SCHEMA MAPPING ENGINE */}
      {activeStep === 'MAPPING' && selectedBatch && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Intelligent Column & Entity Mapping Engine</h2>
                <p className="text-sm text-gray-500">
                  Configure canonical target field destinations, data types, and custom transforms (Ethiopian calendar conversion, bank normalization).
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="primary"
                  onClick={handleSaveMappings}
                  disabled={isSavingMappings}
                  icon={<Check className="w-4 h-4" />}
                >
                  {isSavingMappings ? 'Saving...' : 'Save & Calculate Dry Run'}
                </Button>
              </div>
            </div>

            {/* Sheet Tabs */}
            <div className="flex space-x-2 overflow-x-auto pt-4 pb-4">
              {currentMappings.map((config, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedSheetIndex(index)}
                  className={`px-4 py-2 text-sm rounded-lg font-semibold transition-colors flex items-center space-x-2 ${
                    selectedSheetIndex === index
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{config.sheetName}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-800/50 text-white font-mono">
                    {config.entityType}
                  </span>
                </button>
              ))}
            </div>

            {/* Active Mapping Grid */}
            {activeMappingConfig && (
              <div className="space-y-6 mt-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-wrap items-center gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Target Entity Type</label>
                    <select
                      value={activeMappingConfig.entityType}
                      onChange={(e) => {
                        const val = e.target.value as MigrationEntityType;
                        setCurrentMappings((prev) =>
                          prev.map((c) => (c.sheetName === activeMappingConfig.sheetName ? { ...c, entityType: val } : c))
                        );
                      }}
                      className="text-sm rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 font-semibold"
                    >
                      <option value="MEMBER">MEMBER (Member Registry)</option>
                      <option value="SAVINGS_TRANSACTION">SAVINGS_TRANSACTION (Savings Ledger)</option>
                      <option value="SHARE_TRANSACTION">SHARE_TRANSACTION (Share Capital)</option>
                      <option value="LOAN_REPAYMENT">LOAN_REPAYMENT (Loan Repayments)</option>
                      <option value="HISTORICAL_BANK_BALANCE">HISTORICAL_BANK_BALANCE (Bank Statement)</option>
                      <option value="MONTHLY_SUMMARY">MONTHLY_SUMMARY (Report Summary Only)</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2 pt-4">
                    <input
                      type="checkbox"
                      id="isReportSummaryCheck"
                      checked={activeMappingConfig.isReportSummary}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setCurrentMappings((prev) =>
                          prev.map((c) => (c.sheetName === activeMappingConfig.sheetName ? { ...c, isReportSummary: checked } : c))
                        );
                      }}
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <label htmlFor="isReportSummaryCheck" className="text-sm font-medium text-gray-700">
                      Mark as Report Summary (Do not count as individual ledger transactions)
                    </label>
                  </div>
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3">Source Column in Excel</th>
                        <th className="px-4 py-3">Target Field in Database</th>
                        <th className="px-4 py-3">Data Type</th>
                        <th className="px-4 py-3">Transform Rule</th>
                        <th className="px-4 py-3 text-center">Confidence</th>
                        <th className="px-4 py-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {activeMappingConfig.mappings.map((item, mIdx) => (
                        <tr key={mIdx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold text-gray-900 font-mono text-xs">
                            {item.sourceColumn}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={item.targetField}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCurrentMappings((prev) =>
                                  prev.map((c) =>
                                    c.sheetName === activeMappingConfig.sheetName
                                      ? {
                                          ...c,
                                          mappings: c.mappings.map((m, idx) =>
                                            idx === mIdx ? { ...m, targetField: val } : m
                                          ),
                                        }
                                      : c
                                  )
                                );
                              }}
                              className="w-full text-xs font-mono rounded-md border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={item.dataType}
                              onChange={(e) => {
                                const val = e.target.value as any;
                                setCurrentMappings((prev) =>
                                  prev.map((c) =>
                                    c.sheetName === activeMappingConfig.sheetName
                                      ? {
                                          ...c,
                                          mappings: c.mappings.map((m, idx) =>
                                            idx === mIdx ? { ...m, dataType: val } : m
                                          ),
                                        }
                                      : c
                                  )
                                );
                              }}
                              className="text-xs rounded-md border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
                            >
                              <option value="STRING">STRING</option>
                              <option value="NUMBER">NUMBER</option>
                              <option value="DATE_EC">DATE_EC (Ethiopian)</option>
                              <option value="DATE_GC">DATE_GC (Gregorian)</option>
                              <option value="DATE_AUTO">DATE_AUTO</option>
                              <option value="BANK">BANK CHANNEL</option>
                              <option value="BOOLEAN">BOOLEAN</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={item.transformRule || 'NONE'}
                              onChange={(e) => {
                                const val = e.target.value as any;
                                setCurrentMappings((prev) =>
                                  prev.map((c) =>
                                    c.sheetName === activeMappingConfig.sheetName
                                      ? {
                                          ...c,
                                          mappings: c.mappings.map((m, idx) =>
                                            idx === mIdx ? { ...m, transformRule: val } : m
                                          ),
                                        }
                                      : c
                                  )
                                );
                              }}
                              className="text-xs rounded-md border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
                            >
                              <option value="NONE">NONE</option>
                              <option value="NORMALIZE_BANK">NORMALIZE_BANK (CBE / Tsehay)</option>
                              <option value="PARSE_EC_DATE">PARSE_EC_DATE (EC to GC)</option>
                              <option value="PARSE_GC_DATE">PARSE_GC_DATE</option>
                              <option value="CLEAN_CURRENCY">CLEAN_CURRENCY</option>
                              <option value="TRIM_STRING">TRIM_STRING</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                              item.confidence >= 0.9 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {Math.round(item.confidence * 100)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {item.notes || 'Auto-detected'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Maker Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Maker Notes & Audit Comments
                  </label>
                  <textarea
                    rows={2}
                    value={makerNotes}
                    onChange={(e) => setMakerNotes(e.target.value)}
                    placeholder="Provide any context, accounting verification comments, or mapping decisions for the Checker..."
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 4: PRE-FLIGHT DRY RUN & RECONCILIATION */}
      {activeStep === 'DRY_RUN' && selectedBatch && selectedBatch.dryRunReport && (
        <div className="space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 uppercase">Total Rows Evaluated</span>
              <div className="text-2xl font-bold text-gray-900 mt-1">{selectedBatch.dryRunReport.totalRowsRead}</div>
              <div className="text-xs text-gray-400 mt-1">{selectedBatch.worksheets.length} worksheets parsed</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-emerald-600 uppercase">Valid Records</span>
              <div className="text-2xl font-bold text-emerald-700 mt-1">{selectedBatch.dryRunReport.validRowsCount}</div>
              <div className="text-xs text-emerald-600 mt-1">Ready for controlled import</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-amber-600 uppercase">Duplicates Flagged</span>
              <div className="text-2xl font-bold text-amber-700 mt-1">{selectedBatch.dryRunReport.duplicateCount}</div>
              <div className="text-xs text-amber-600 mt-1">Matched against production</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-red-600 uppercase">Rejected Rows</span>
              <div className="text-2xl font-bold text-red-700 mt-1">{selectedBatch.dryRunReport.rejectedRowsCount}</div>
              <div className="text-xs text-red-600 mt-1">Logged as exceptions</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-blue-600 uppercase">Total Financial Volume</span>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(selectedBatch.dryRunReport.financialTotals.totalFinancialVolume)}
              </div>
              <div className="text-xs text-blue-600 mt-1">Consolidated Opening Assets</div>
            </div>
          </div>

          {/* Financial Reconciliation Matrix */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  selectedBatch.dryRunReport.reconciliation.status === 'BALANCED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">General Ledger Financial Reconciliation Matrix</h3>
                  <p className="text-xs text-gray-500">
                    Mathematical verification between source spreadsheet ledgers and calculated import journal figures.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTriggerDryRun}
                  disabled={isRunningDryRun}
                  icon={<RefreshCw className="w-4 h-4" />}
                >
                  {isRunningDryRun ? 'Recalculating...' : 'Refresh Dry Run'}
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSubmitForApproval}
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  Submit for Checker Approval
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3">Accounting Category</th>
                    <th className="px-6 py-3 text-right">Source File Ledger Total</th>
                    <th className="px-6 py-3 text-right">Import Calculated Total</th>
                    <th className="px-6 py-3 text-right">Variance / Difference</th>
                    <th className="px-6 py-3 text-center">Reconciliation Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  <tr>
                    <td className="px-6 py-3.5 font-medium text-gray-900">Regular Mandatory Savings (2010)</td>
                    <td className="px-6 py-3.5 text-right font-mono">{formatCurrency(selectedBatch.dryRunReport.reconciliation.sourceTotals.regularSavings)}</td>
                    <td className="px-6 py-3.5 text-right font-mono">{formatCurrency(selectedBatch.dryRunReport.reconciliation.importedTotals.regularSavings)}</td>
                    <td className="px-6 py-3.5 text-right font-mono text-emerald-700 font-bold">{formatCurrency(selectedBatch.dryRunReport.reconciliation.differences.regularSavings)}</td>
                    <td className="px-6 py-3.5 text-center"><Badge variant="success">BALANCED</Badge></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3.5 font-medium text-gray-900">Member Share Capital (3010)</td>
                    <td className="px-6 py-3.5 text-right font-mono">{formatCurrency(selectedBatch.dryRunReport.reconciliation.sourceTotals.shares)}</td>
                    <td className="px-6 py-3.5 text-right font-mono">{formatCurrency(selectedBatch.dryRunReport.reconciliation.importedTotals.shares)}</td>
                    <td className="px-6 py-3.5 text-right font-mono text-emerald-700 font-bold">{formatCurrency(selectedBatch.dryRunReport.reconciliation.differences.shares)}</td>
                    <td className="px-6 py-3.5 text-center"><Badge variant="success">BALANCED</Badge></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3.5 font-medium text-gray-900">Registration & Admission Fees (4010)</td>
                    <td className="px-6 py-3.5 text-right font-mono">{formatCurrency(selectedBatch.dryRunReport.reconciliation.sourceTotals.registrationFees)}</td>
                    <td className="px-6 py-3.5 text-right font-mono">{formatCurrency(selectedBatch.dryRunReport.reconciliation.importedTotals.registrationFees)}</td>
                    <td className="px-6 py-3.5 text-right font-mono text-emerald-700 font-bold">{formatCurrency(selectedBatch.dryRunReport.reconciliation.differences.registrationFees)}</td>
                    <td className="px-6 py-3.5 text-center"><Badge variant="success">BALANCED</Badge></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3.5 font-medium text-gray-900">Historical Loan Repayments</td>
                    <td className="px-6 py-3.5 text-right font-mono">{formatCurrency(selectedBatch.dryRunReport.reconciliation.sourceTotals.loanRepayments)}</td>
                    <td className="px-6 py-3.5 text-right font-mono">{formatCurrency(selectedBatch.dryRunReport.reconciliation.importedTotals.loanRepayments)}</td>
                    <td className="px-6 py-3.5 text-right font-mono text-emerald-700 font-bold">{formatCurrency(selectedBatch.dryRunReport.reconciliation.differences.loanRepayments)}</td>
                    <td className="px-6 py-3.5 text-center"><Badge variant="success">BALANCED</Badge></td>
                  </tr>
                  <tr className="bg-gray-50 font-bold text-gray-900 border-t-2 border-gray-300">
                    <td className="px-6 py-4">Total Consolidated Volume (Cash at Bank 1010)</td>
                    <td className="px-6 py-4 text-right font-mono">{formatCurrency(selectedBatch.dryRunReport.reconciliation.sourceTotals.totalFinancialVolume)}</td>
                    <td className="px-6 py-4 text-right font-mono">{formatCurrency(selectedBatch.dryRunReport.reconciliation.importedTotals.totalFinancialVolume)}</td>
                    <td className="px-6 py-4 text-right font-mono text-emerald-700">{formatCurrency(selectedBatch.dryRunReport.reconciliation.differences.totalFinancialVolume)}</td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="success">100% MATCHED</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Duplicate Detection Highlights */}
          {selectedBatch.dryRunReport.detectedDuplicates.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-3">
                Duplicate Detection & Historical Entity Matching ({selectedBatch.dryRunReport.detectedDuplicates.length} matches)
              </h3>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2.5">Row / Sheet</th>
                      <th className="px-4 py-2.5">Source Member Name</th>
                      <th className="px-4 py-2.5">Legacy SADV ID</th>
                      <th className="px-4 py-2.5">Matched Production Member</th>
                      <th className="px-4 py-2.5 text-center">Match Level</th>
                      <th className="px-4 py-2.5">Match Reason & Resolution Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {selectedBatch.dryRunReport.detectedDuplicates.slice(0, 10).map((dup, dIdx) => (
                      <tr key={dIdx} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-mono">Row {dup.sourceRowNumber} ({dup.sourceSheet})</td>
                        <td className="px-4 py-2 font-bold text-gray-900">{dup.fullName}</td>
                        <td className="px-4 py-2 font-mono text-emerald-700">{dup.legacyIdentifier}</td>
                        <td className="px-4 py-2">
                          <span className="font-semibold text-gray-900">{dup.matchedMemberName}</span> ({dup.matchedMembershipNo})
                        </td>
                        <td className="px-4 py-2 text-center">
                          <Badge variant={dup.matchLevel === 'EXACT_MATCH' ? 'primary' : 'warning'}>
                            {dup.matchLevel} ({dup.matchConfidencePercent}%)
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {dup.matchReason} &rarr; <span className="font-bold text-gray-900">{dup.action}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 5: DUAL APPROVAL & GOVERNANCE */}
      {activeStep === 'GOVERNANCE' && selectedBatch && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Maker-Checker Dual Authorization Station</h2>
            <p className="text-sm text-gray-500 mb-6">
              In accordance with SACCO financial governance and cooperative regulatory bylaws, historical data imports require independent secondary authorization by a Manager or authorized Checker.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-gray-200">
              {/* Maker Column */}
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-3">
                <div className="flex items-center space-x-2 text-gray-900 font-bold">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <span>Maker (Preparation & Upload)</span>
                </div>
                <div className="text-sm space-y-1 text-gray-600">
                  <div>Officer: <span className="font-bold text-gray-900">{selectedBatch.uploadedByName}</span></div>
                  <div>Role: <span className="font-mono text-xs px-2 py-0.5 bg-gray-200 rounded text-gray-800">{selectedBatch.uploadedByRole}</span></div>
                  <div>Timestamp: <span className="text-gray-700">{formatDateTime(selectedBatch.uploadDate)}</span></div>
                </div>
                {selectedBatch.makerNotes && (
                  <div className="p-3 bg-white rounded-lg border border-gray-200 text-xs text-gray-700">
                    <span className="font-bold block mb-1">Maker Notes:</span>
                    {selectedBatch.makerNotes}
                  </div>
                )}
              </div>

              {/* Checker Column */}
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-3">
                <div className="flex items-center space-x-2 text-gray-900 font-bold">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>Checker (Verification & Sign-off)</span>
                </div>
                <div className="text-sm space-y-1 text-gray-600">
                  <div>Status: {getStatusBadge(selectedBatch.status)}</div>
                  {selectedBatch.approvedByName && (
                    <>
                      <div>Approved By: <span className="font-bold text-gray-900">{selectedBatch.approvedByName}</span></div>
                      <div>Approved At: <span className="text-gray-700">{formatDateTime(selectedBatch.approvedAt || '')}</span></div>
                    </>
                  )}
                </div>
                {selectedBatch.checkerNotes && (
                  <div className="p-3 bg-white rounded-lg border border-gray-200 text-xs text-gray-700">
                    <span className="font-bold block mb-1">Checker Sign-off:</span>
                    {selectedBatch.checkerNotes}
                  </div>
                )}
              </div>
            </div>

            {/* Checker Action Buttons */}
            <div className="pt-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                {selectedBatch.status === 'READY_FOR_REVIEW' && (
                  <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                    Awaiting Checker Approval before execution is enabled.
                  </span>
                )}
                {selectedBatch.status === 'APPROVED' && (
                  <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                    Batch approved and ready for live production execution.
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-3">
                {selectedBatch.status === 'READY_FOR_REVIEW' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setRejectionModalOpen(true)}
                      icon={<X className="w-4 h-4" />}
                    >
                      Reject Batch
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => setApprovalModalOpen(true)}
                      icon={<ShieldCheck className="w-4 h-4" />}
                    >
                      Checker MFA Sign-off & Approve
                    </Button>
                  </>
                )}

                {selectedBatch.status === 'APPROVED' && (
                  <Button
                    variant="primary"
                    onClick={() => setActiveStep('EXECUTION')}
                    icon={<ArrowRight className="w-4 h-4" />}
                  >
                    Proceed to Production Execution
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 6: EXECUTION & ROLLBACK STATION */}
      {activeStep === 'EXECUTION' && selectedBatch && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Live Production Execution & Rollback Station</h2>
                <p className="text-sm text-gray-500">
                  Executes transactional import, generates authoritative sequential membership numbers (WB-2026-XXXX), establishes historical opening balances, and preserves legacy SADV codes.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                {selectedBatch.status === 'COMPLETED' && (
                  <Button
                    variant="outline"
                    onClick={() => setRollbackModalOpen(true)}
                    icon={<RotateCcw className="w-4 h-4 text-red-600" />}
                    className="border-red-200 text-red-700 hover:bg-red-50"
                  >
                    Rollback Batch
                  </Button>
                )}

                {(selectedBatch.status === 'APPROVED' || selectedBatch.status === 'READY_FOR_REVIEW') && (
                  <Button
                    variant="primary"
                    onClick={handleExecuteImport}
                    disabled={isImporting}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    {isImporting ? 'Executing Ingestion...' : 'Execute Production Migration'}
                  </Button>
                )}
              </div>
            </div>

            {/* Execution Result Stats */}
            {selectedBatch.executionStats && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 space-y-4">
                <div className="flex items-center space-x-3 text-emerald-900 font-bold text-lg">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  <span>Migration Execution Completed Successfully</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                  <div className="bg-white p-3.5 rounded-lg border border-emerald-100">
                    <span className="text-xs text-gray-500 font-semibold">New Members Created</span>
                    <div className="text-xl font-bold text-emerald-800 mt-1">{selectedBatch.executionStats.membersCreated}</div>
                    <span className="text-xs text-gray-400">Sequential IDs assigned</span>
                  </div>
                  <div className="bg-white p-3.5 rounded-lg border border-emerald-100">
                    <span className="text-xs text-gray-500 font-semibold">Savings Accounts Configured</span>
                    <div className="text-xl font-bold text-emerald-800 mt-1">{selectedBatch.executionStats.savingsAccountsUpdated}</div>
                    <span className="text-xs text-gray-400">Regular savings active</span>
                  </div>
                  <div className="bg-white p-3.5 rounded-lg border border-emerald-100">
                    <span className="text-xs text-gray-500 font-semibold">Share Transactions Posted</span>
                    <div className="text-xl font-bold text-emerald-800 mt-1">{selectedBatch.executionStats.shareTransactionsCreated}</div>
                    <span className="text-xs text-gray-400">Share capital credited</span>
                  </div>
                  <div className="bg-white p-3.5 rounded-lg border border-emerald-100">
                    <span className="text-xs text-gray-500 font-semibold">GL Opening Entries Created</span>
                    <div className="text-xl font-bold text-emerald-800 mt-1">{selectedBatch.executionStats.journalEntriesCreated}</div>
                    <span className="text-xs text-gray-400">Debits == Credits</span>
                  </div>
                </div>

                <div className="text-xs text-emerald-800 flex justify-between pt-2">
                  <span>Started: {formatDateTime(selectedBatch.executionStats.startedAt || '')}</span>
                  <span>Completed: {formatDateTime(selectedBatch.executionStats.completedAt || '')}</span>
                </div>
              </div>
            )}

            {/* Rollback Info if rolled back */}
            {selectedBatch.rollbackInfo && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 space-y-3">
                <div className="flex items-center space-x-3 text-red-900 font-bold text-base">
                  <RotateCcw className="w-5 h-5 text-red-600" />
                  <span>Batch Rolled Back</span>
                </div>
                <p className="text-sm text-red-800">
                  Rolled back on {formatDateTime(selectedBatch.rollbackInfo.rolledBackAt)} by{' '}
                  <span className="font-bold">{selectedBatch.rollbackInfo.rolledBackByName}</span>.
                </p>
                <div className="p-3 bg-white rounded-lg border border-red-100 text-xs text-red-900">
                  <span className="font-bold block mb-1">Reason:</span>
                  {selectedBatch.rollbackInfo.reason}
                </div>
              </div>
            )}

            {/* Export CSV Section */}
            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-sm font-bold text-gray-900 mb-3">Download Authoritative Migration Reports:</h4>
              <div className="flex flex-wrap gap-3">
                <a
                  href={migrationClientService.getExportCsvUrl(selectedBatch.id, 'SUMMARY')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-200"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  Download Summary CSV
                </a>
                <a
                  href={migrationClientService.getExportCsvUrl(selectedBatch.id, 'MEMBERS')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-200"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  Download Migrated Members Registry CSV
                </a>
                <a
                  href={migrationClientService.getExportCsvUrl(selectedBatch.id, 'EXCEPTIONS')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-200"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  Download Exceptions Log CSV
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 7: EXCEPTIONS QUEUE */}
      {activeStep === 'EXCEPTIONS' && selectedBatch && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Migration Exceptions & Discrepancies Queue</h2>
                <p className="text-sm text-gray-500">
                  Flagged anomalous rows, unlinked loan repayments, ambiguous dates, or missing member references requiring manual accountant intervention.
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-amber-100 text-amber-800 rounded-lg">
                {exceptions.length} Total Exceptions
              </span>
            </div>

            {exceptions.length === 0 ? (
              <div className="p-12 text-center text-gray-500 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <div className="font-semibold text-gray-900">Zero Pending Exceptions</div>
                <p className="text-xs">All records in batch {selectedBatch.batchNumber} passed validation cleanly.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-xl mt-4">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3">Source Sheet / Row</th>
                      <th className="px-4 py-3">Legacy ID / Name</th>
                      <th className="px-4 py-3">Issue Type</th>
                      <th className="px-4 py-3">Severity</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {exceptions.map((ex) => (
                      <tr key={ex.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs">
                          {ex.sourceSheet} (Row {ex.sourceRowNumber})
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-bold text-emerald-800">{ex.legacyIdentifier || 'N/A'}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-800">
                          {ex.issueType}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={ex.severity === 'ERROR' ? 'danger' : 'warning'}>
                            {ex.severity}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700 max-w-[300px]">
                          {ex.description}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={ex.resolutionStatus === 'RESOLVED' ? 'success' : 'secondary'}>
                            {ex.resolutionStatus}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedException(ex);
                              setResolutionNote(ex.resolutionAction || '');
                            }}
                          >
                            Review
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHECKER APPROVAL MODAL */}
      <Modal
        isOpen={approvalModalOpen}
        onClose={() => setApprovalModalOpen(false)}
        title="Checker Dual-Authorization & Sign-off"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            You are signing off as an authorized SACCO Checker for migration batch{' '}
            <span className="font-bold font-mono text-emerald-800">{selectedBatch?.batchNumber}</span>.
          </p>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-xs space-y-1">
            <div>Source File: <span className="font-bold text-gray-900">{selectedBatch?.sourceFileName}</span></div>
            <div>Total Financial Volume: <span className="font-bold text-gray-900">{formatCurrency(selectedBatch?.financialSummary.totalFinancialVolume || 0)}</span></div>
            <div>Reconciliation: <span className="font-bold text-emerald-700">{selectedBatch?.reconciliation.status}</span></div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Checker MFA / Security Passcode
            </label>
            <TextInput
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              placeholder="Enter 6-digit TOTP code"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Checker Approval Statement
            </label>
            <textarea
              rows={2}
              value={checkerNotes}
              onChange={(e) => setCheckerNotes(e.target.value)}
              className="w-full text-xs rounded-lg border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setApprovalModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleApprove}
              disabled={isApproving}
              icon={<ShieldCheck className="w-4 h-4" />}
            >
              {isApproving ? 'Authorizing...' : 'Authorize & Sign-off'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* CHECKER REJECTION MODAL */}
      <Modal
        isOpen={rejectionModalOpen}
        onClose={() => setRejectionModalOpen(false)}
        title="Reject Migration Batch"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Please provide a formal rejection reason. The batch will be sent back to the Maker with a validation failure status.
          </p>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Mandatory Rejection Reason
            </label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="E.g. Discrepancy observed in regular savings ledger totals on sheet 2..."
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setRejectionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              disabled={isRejecting}
              icon={<X className="w-4 h-4" />}
            >
              {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ROLLBACK MODAL */}
      <Modal
        isOpen={rollbackModalOpen}
        onClose={() => setRollbackModalOpen(false)}
        title="Rollback Migration Batch"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-900 text-sm flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Rollback Warning:</span> Rolling back batch{' '}
              <span className="font-mono font-bold">{selectedBatch?.batchNumber}</span> will remove all imported member records, reversed journal entries, and restore the database to its pre-import state.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Mandatory Rollback Reason (Audit Logged)
            </label>
            <textarea
              rows={3}
              value={rollbackReason}
              onChange={(e) => setRollbackReason(e.target.value)}
              placeholder="State the audit or financial discrepancy reason requiring rollback..."
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setRollbackModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleRollback}
              disabled={isRollingBack}
              icon={<RotateCcw className="w-4 h-4" />}
            >
              {isRollingBack ? 'Rolling Back...' : 'Execute Clean Rollback'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* RESOLVE EXCEPTION MODAL */}
      <Modal
        isOpen={Boolean(selectedException)}
        onClose={() => setSelectedException(null)}
        title="Review & Resolve Exception"
        maxWidth="max-w-lg"
      >
        {selectedException && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-xs space-y-1">
              <div>Issue Type: <span className="font-bold text-gray-900">{selectedException.issueType}</span></div>
              <div>Source: <span className="font-mono text-gray-700">{selectedException.sourceSheet} (Row {selectedException.sourceRowNumber})</span></div>
              <div>Legacy Identifier: <span className="font-mono font-bold text-emerald-800">{selectedException.legacyIdentifier || 'N/A'}</span></div>
              <div className="pt-2 text-gray-800"><span className="font-bold">Description:</span> {selectedException.description}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Accountant Resolution Note
              </label>
              <textarea
                rows={2}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="E.g. Manually verified SADV book reference against physical paper archive..."
                className="w-full text-xs rounded-lg border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleResolveException('SKIPPED')}
                disabled={isResolvingException}
              >
                Skip Record
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleResolveException('OVERRIDDEN')}
                disabled={isResolvingException}
              >
                Override Warning
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleResolveException('RESOLVED')}
                disabled={isResolvingException}
                icon={<Check className="w-4 h-4" />}
              >
                Mark Resolved
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
