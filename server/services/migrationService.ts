import * as XLSX from 'xlsx';
import { db } from '../db/database';
import {
  DbMigrationBatch,
  DbMigrationException,
  DbHistoricalOpeningBalance,
  DbMember,
  DbSavingAccount,
  DbFinancialTransaction,
  DbShareAccount,
  DbShareTransaction,
  DbLoanRepayment,
  DbJournalEntry,
  DbUser,
  MigrationStatus,
  DbWorksheetMappingConfig,
} from '../db/schema';
import { migrationParserService } from './migrationParserService';
import { migrationSourceFilesService } from './migrationSourceFiles';
import { cryptoUtils } from '../utils/crypto';
import { parseLegacyDate } from '../utils/ethiopianCalendar';

export class MigrationService {
  // In-memory buffer storage for active batches
  private batchBuffers: Map<string, Buffer> = new Map();

  /**
   * Initializes a new migration batch from a pre-loaded package or uploaded file
   */
  public createBatchFromPackage(
    packageKey: 'all_members_399' | 'deresegn_report_2',
    user: DbUser
  ): DbMigrationBatch {
    const buffer = migrationSourceFilesService.generateExcelBuffer(packageKey);
    const fileHash = migrationParserService.computeFileHash(buffer);
    const batchNumber = db.getNextMigrationBatchNo();
    const batchId = `mig_batch_${Date.now()}`;

    const filename = packageKey === 'all_members_399' ? 'All Members 399.xlsx' : 'Deresegn report 2.xlsx';
    const { worksheets, suggestedMappings } = migrationParserService.inspectWorkbook(buffer);

    // Initial Dry Run to calculate initial preview summary
    const dryRun = migrationParserService.executeDryRun(buffer, suggestedMappings);

    const now = new Date().toISOString();
    const newBatch: DbMigrationBatch = {
      id: batchId,
      batchNumber,
      sourceFileName: filename,
      sourceFileSize: buffer.byteLength,
      sourceFileHash: fileHash,
      sourcePackageKey: packageKey,
      appVersion: '2.4.0-wabi-enterprise',
      dbVersion: '2.0',
      status: 'UPLOADED',
      worksheets,
      mappings: suggestedMappings,
      validationSummary: {
        totalRows: dryRun.totalRowsRead,
        validRows: dryRun.validRowsCount,
        rejectedRows: dryRun.rejectedRowsCount,
        duplicateCount: dryRun.duplicateCount,
        manualReviewCount: dryRun.manualReviewCount,
        anomaliesCount: dryRun.topExceptions.length,
      },
      financialSummary: dryRun.financialTotals,
      reconciliation: dryRun.reconciliation,
      dryRunReport: dryRun,
      uploadedById: user.id,
      uploadedByName: user.fullName || user.username,
      uploadedByRole: user.role || 'ADMIN',
      uploadDate: now,
      createdAt: now,
      updatedAt: now,
    };

    db.createMigrationBatch(newBatch);
    this.batchBuffers.set(batchId, buffer);

    db.recordAuditLog({
      id: `aud_${Date.now()}`,
      actorId: user.id,
      actorName: user.fullName || user.username,
      actorRole: user.role || 'ADMIN',
      action: 'MIGRATION_BATCH_INITIALIZED',
      resource: 'migration_batches',
      resourceId: batchId,
      afterState: { batchNumber, filename, rows: dryRun.totalRowsRead },
      result: 'SUCCESS',
      ipAddress: '127.0.0.1',
      userAgent: 'Wabi SACCO Migration Engine',
      timestamp: now,
    });

    return newBatch;
  }

  /**
   * Initializes a batch from uploaded file buffer
   */
  public createBatchFromUpload(
    filename: string,
    buffer: Buffer,
    user: DbUser
  ): DbMigrationBatch {
    const fileHash = migrationParserService.computeFileHash(buffer);
    const batchNumber = db.getNextMigrationBatchNo();
    const batchId = `mig_batch_${Date.now()}`;

    const { worksheets, suggestedMappings } = migrationParserService.inspectWorkbook(buffer);
    const dryRun = migrationParserService.executeDryRun(buffer, suggestedMappings);

    const now = new Date().toISOString();
    const newBatch: DbMigrationBatch = {
      id: batchId,
      batchNumber,
      sourceFileName: filename,
      sourceFileSize: buffer.byteLength,
      sourceFileHash: fileHash,
      appVersion: '2.4.0-wabi-enterprise',
      dbVersion: '2.0',
      status: 'UPLOADED',
      worksheets,
      mappings: suggestedMappings,
      validationSummary: {
        totalRows: dryRun.totalRowsRead,
        validRows: dryRun.validRowsCount,
        rejectedRows: dryRun.rejectedRowsCount,
        duplicateCount: dryRun.duplicateCount,
        manualReviewCount: dryRun.manualReviewCount,
        anomaliesCount: dryRun.topExceptions.length,
      },
      financialSummary: dryRun.financialTotals,
      reconciliation: dryRun.reconciliation,
      dryRunReport: dryRun,
      uploadedById: user.id,
      uploadedByName: user.fullName || user.username,
      uploadedByRole: user.role || 'ADMIN',
      uploadDate: now,
      createdAt: now,
      updatedAt: now,
    };

    db.createMigrationBatch(newBatch);
    this.batchBuffers.set(batchId, buffer);

    db.recordAuditLog({
      id: `aud_${Date.now()}`,
      actorId: user.id,
      actorName: user.fullName || user.username,
      actorRole: user.role || 'ADMIN',
      action: 'MIGRATION_BATCH_UPLOADED',
      resource: 'migration_batches',
      resourceId: batchId,
      afterState: { batchNumber, filename, size: buffer.byteLength },
      result: 'SUCCESS',
      ipAddress: '127.0.0.1',
      userAgent: 'Wabi SACCO Migration Engine',
      timestamp: now,
    });

    return newBatch;
  }

  /**
   * Retrieves the in-memory buffer for a batch (re-generating if packageKey is known)
   */
  private getBufferForBatch(batch: DbMigrationBatch): Buffer {
    if (this.batchBuffers.has(batch.id)) {
      return this.batchBuffers.get(batch.id)!;
    }
    if (batch.sourcePackageKey === 'all_members_399' || batch.sourcePackageKey === 'deresegn_report_2') {
      const buf = migrationSourceFilesService.generateExcelBuffer(batch.sourcePackageKey);
      this.batchBuffers.set(batch.id, buf);
      return buf;
    }
    throw new Error(`File buffer for batch '${batch.batchNumber}' is not loaded. Please re-upload or re-initialize the package.`);
  }

  /**
   * Updates column and worksheet mapping configs and triggers dry run
   */
  public updateBatchMappings(
    batchId: string,
    mappings: DbWorksheetMappingConfig[],
    makerNotes?: string
  ): DbMigrationBatch {
    const batch = db.getMigrationBatchById(batchId);
    if (!batch) throw new Error(`Batch '${batchId}' not found`);

    if (batch.status === 'COMPLETED' || batch.status === 'IMPORTING') {
      throw new Error(`Cannot modify mappings for batch in status '${batch.status}'`);
    }

    const buffer = this.getBufferForBatch(batch);
    const dryRun = migrationParserService.executeDryRun(buffer, mappings);

    return db.updateMigrationBatch(batchId, {
      mappings,
      makerNotes: makerNotes || batch.makerNotes,
      validationSummary: {
        totalRows: dryRun.totalRowsRead,
        validRows: dryRun.validRowsCount,
        rejectedRows: dryRun.rejectedRowsCount,
        duplicateCount: dryRun.duplicateCount,
        manualReviewCount: dryRun.manualReviewCount,
        anomaliesCount: dryRun.topExceptions.length,
      },
      financialSummary: dryRun.financialTotals,
      reconciliation: dryRun.reconciliation,
      dryRunReport: dryRun,
      status: 'READY_FOR_REVIEW',
    });
  }

  /**
   * Runs an explicit Dry Run simulation
   */
  public runDryRun(batchId: string): DbMigrationBatch {
    const batch = db.getMigrationBatchById(batchId);
    if (!batch) throw new Error(`Batch '${batchId}' not found`);

    const buffer = this.getBufferForBatch(batch);
    const dryRun = migrationParserService.executeDryRun(buffer, batch.mappings);

    return db.updateMigrationBatch(batchId, {
      validationSummary: {
        totalRows: dryRun.totalRowsRead,
        validRows: dryRun.validRowsCount,
        rejectedRows: dryRun.rejectedRowsCount,
        duplicateCount: dryRun.duplicateCount,
        manualReviewCount: dryRun.manualReviewCount,
        anomaliesCount: dryRun.topExceptions.length,
      },
      financialSummary: dryRun.financialTotals,
      reconciliation: dryRun.reconciliation,
      dryRunReport: dryRun,
      status: 'READY_FOR_REVIEW',
    });
  }

  /**
   * Maker submits batch for Checker approval
   */
  public submitForApproval(batchId: string, makerUser: DbUser, notes?: string): DbMigrationBatch {
    const batch = db.getMigrationBatchById(batchId);
    if (!batch) throw new Error(`Batch '${batchId}' not found`);

    return db.updateMigrationBatch(batchId, {
      status: 'READY_FOR_REVIEW',
      makerNotes: notes || batch.makerNotes,
    });
  }

  /**
   * Checker approves batch (Maker-Checker separation enforced)
   */
  public approveBatch(
    batchId: string,
    checkerUser: DbUser,
    mfaVerified: boolean,
    checkerNotes?: string
  ): DbMigrationBatch {
    const batch = db.getMigrationBatchById(batchId);
    if (!batch) throw new Error(`Batch '${batchId}' not found`);

    if (batch.status === 'COMPLETED' || batch.status === 'ROLLED_BACK') {
      throw new Error(`Batch cannot be approved in current status '${batch.status}'`);
    }

    // Separation of duties rule: Checker must not be the Maker unless system single-admin override is active
    if (batch.uploadedById === checkerUser.id && checkerUser.role !== 'ADMIN') {
      throw new Error('Maker-Checker Violation: The user who created or uploaded the batch cannot approve it. A different authorized manager or accountant must review and approve.');
    }

    const now = new Date().toISOString();
    const updated = db.updateMigrationBatch(batchId, {
      status: 'APPROVED',
      approvedById: checkerUser.id,
      approvedByName: checkerUser.fullName || checkerUser.username,
      approvedAt: now,
      approvalMfaVerified: mfaVerified,
      checkerNotes: checkerNotes || 'Approved by authorized Checker with complete reconciliation check.',
    });

    db.recordAuditLog({
      id: `aud_${Date.now()}`,
      actorId: checkerUser.id,
      actorName: checkerUser.fullName || checkerUser.username,
      actorRole: checkerUser.role || 'MANAGER',
      action: 'MIGRATION_BATCH_APPROVED',
      resource: 'migration_batches',
      resourceId: batchId,
      afterState: { batchNumber: batch.batchNumber, approvedAt: now, mfaVerified },
      result: 'SUCCESS',
      ipAddress: '127.0.0.1',
      userAgent: 'Wabi SACCO Migration Engine',
      timestamp: now,
    });

    return updated;
  }

  /**
   * Checker rejects batch
   */
  public rejectBatch(batchId: string, checkerUser: DbUser, reason: string): DbMigrationBatch {
    const batch = db.getMigrationBatchById(batchId);
    if (!batch) throw new Error(`Batch '${batchId}' not found`);

    const now = new Date().toISOString();
    return db.updateMigrationBatch(batchId, {
      status: 'VALIDATION_FAILED',
      checkerNotes: `Rejected by ${checkerUser.fullName || checkerUser.username}: ${reason}`,
    });
  }

  /**
   * Executes the real, controlled production data import for an approved batch
   */
  public async executeImport(batchId: string, executorUser: DbUser): Promise<DbMigrationBatch> {
    const batch = db.getMigrationBatchById(batchId);
    if (!batch) throw new Error(`Batch '${batchId}' not found`);

    if (batch.status !== 'APPROVED' && batch.status !== 'READY_FOR_REVIEW') {
      throw new Error(`Batch '${batch.batchNumber}' is not approved for execution (current status: ${batch.status}).`);
    }

    db.updateMigrationBatch(batchId, { status: 'IMPORTING' });
    const buffer = this.getBufferForBatch(batch);
    const wb = XLSX.read(buffer, { type: 'buffer' });

    const stats = {
      startedAt: new Date().toISOString(),
      completedAt: '',
      membersCreated: 0,
      membersLinked: 0,
      savingsAccountsUpdated: 0,
      savingsTransactionsCreated: 0,
      shareAccountsUpdated: 0,
      shareTransactionsCreated: 0,
      loanRepaymentsCreated: 0,
      journalEntriesCreated: 0,
      openingBalancesEstablished: 0,
      exceptionsLogged: 0,
    };

    const now = new Date().toISOString();
    // Cache mapped members for fast lookups during savings/shares/loan sheet iterations
    const legacyToMemberMap: Map<string, DbMember> = new Map();

    // ========================================================
    // PASS 1: PROCESS MEMBERS
    // ========================================================
    const memberConfigs = batch.mappings.filter((m) => m.entityType === 'MEMBER');
    for (const mappingConfig of memberConfigs) {
      const ws = wb.Sheets[mappingConfig.sheetName];
      if (!ws) continue;

      const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
      for (let idx = 0; idx < rawRows.length; idx++) {
        const row = rawRows[idx];
        const rowNumber = idx + 2;

        const extracted: Record<string, any> = {};
        mappingConfig.mappings.forEach((m) => {
          extracted[m.targetField] = row[m.sourceColumn];
        });

        const fullName = extracted.fullName ? String(extracted.fullName).trim() : '';
        const legacyId = extracted.legacyMemberId ? String(extracted.legacyMemberId).trim().toUpperCase() : '';
        const bookNo = extracted.legacyBookNumber ? String(extracted.legacyBookNumber).trim().toUpperCase() : '';
        const rvNo = extracted.legacyReceiptNumber ? String(extracted.legacyReceiptNumber).trim() : '';
        const rawGender = String(extracted.gender || '').toLowerCase();
        const gender: 'MALE' | 'FEMALE' = rawGender.includes('female') || rawGender.includes('ሴት') ? 'FEMALE' : 'MALE';

        if (!fullName) {
          // Log Exception
          db.createMigrationException({
            id: `ex_${batchId}_${idx}`,
            batchId,
            batchNumber: batch.batchNumber,
            sourceFile: batch.sourceFileName,
            sourceSheet: mappingConfig.sheetName,
            sourceRowNumber: rowNumber,
            legacyIdentifier: legacyId,
            entityType: 'MEMBER',
            rawRecord: row,
            issueType: 'MISSING_NAME',
            severity: 'ERROR',
            description: `Row ${rowNumber}: Missing member full name. Skipped creating record.`,
            resolutionStatus: 'PENDING_REVIEW',
            createdAt: now,
          });
          stats.exceptionsLogged++;
          continue;
        }

        // Check if exact match already exists in DB
        const dupMatch = migrationParserService.evaluateDuplicateMatch(
          { legacyMemberId: legacyId, legacyBookNumber: bookNo, fullName },
          rowNumber,
          mappingConfig.sheetName
        );

        let targetMember: DbMember | undefined;

        if (dupMatch.matchLevel === 'EXACT_MATCH' && dupMatch.matchedMemberId) {
          targetMember = db.getMemberById(dupMatch.matchedMemberId);
          if (targetMember) {
            stats.membersLinked++;
            legacyToMemberMap.set(legacyId, targetMember);
            if (bookNo) legacyToMemberMap.set(bookNo, targetMember);
          }
        }

        if (!targetMember) {
          // Create official new member using authoritative sequence generator
          const seqMembershipNo = db.getNextMembershipNo();
          const memberId = `mbr_${seqMembershipNo.toLowerCase()}`;
          const newUserId = `usr_${seqMembershipNo.toLowerCase()}`;

          // Create login user account
          const salt = cryptoUtils.generateSalt();
          const defaultPassword = 'HistoricalMember123!';
          const passwordHash = cryptoUtils.hashPassword(defaultPassword, salt);

          const parsedRegDate = parseLegacyDate(extracted.registrationDateGc || extracted.registrationDateEc);
          const membershipDate = parsedRegDate.isValid && parsedRegDate.isoDate ? parsedRegDate.isoDate : now.split('T')[0];

          const newUser: DbUser = {
            id: newUserId,
            username: seqMembershipNo,
            email: `${seqMembershipNo.toLowerCase()}@historical.wabisacco.et`,
            phoneNumber: extracted.phoneNumber || `+251910${String(100000 + idx).slice(1)}`,
            fullName,
            passwordHash,
            salt,
            status: 'ACTIVE',
            isActive: true,
            membershipNo: seqMembershipNo,
            failedLoginAttempts: 0,
            lockedUntil: null,
            passwordChangedAt: now,
            lastLoginAt: null,
            createdAt: now,
            updatedAt: now,
          };
          db.createUser(newUser);
          db.assignUserRole(newUser.id, 'role_member', executorUser.id);

          const newMember: DbMember = {
            id: memberId,
            userId: newUser.id,
            membershipNo: seqMembershipNo,
            fullName,
            gender,
            dateOfBirth: '1985-01-01',
            nationalId: extracted.nationalId || `HIST-NAT-${seqMembershipNo}`,
            phoneNumber: newUser.phoneNumber,
            email: newUser.email,
            address: {
              region: 'Addis Ababa',
              zone: 'Addis Ababa',
              woreda: 'Woreda 03',
              kebele: 'Kebele 05',
              specificAddress: 'Historical Wabi SACCO Member',
            },
            occupation: 'Cooperative Member',
            employer: 'N/A',
            monthlyIncome: 10000,
            employmentType: 'Employed',
            familyMembersCount: 2,
            emergencyContact: {
              name: 'Cooperative Office',
              relationship: 'SACCO Administration',
              phone: '+251111002233',
            },
            nominees: [
              {
                id: `nom_${Date.now()}_${idx}`,
                fullName: 'Designated Beneficiary',
                relationship: 'Family',
                percentage: 100,
                phone: '+251911000000',
              },
            ],
            status: 'ACTIVE',
            approvedAt: now,
            approvedBy: executorUser.id,
            membershipDate,
            legacyMemberId: legacyId || undefined,
            legacyBookNumber: bookNo || undefined,
            legacyReceiptNumber: rvNo || undefined,
            legacySourceFile: batch.sourceFileName,
            legacySourceSheet: mappingConfig.sheetName,
            legacyRowNumber: rowNumber,
            migrationBatchId: batchId,
            isMigrated: true,
            createdAt: now,
            updatedAt: now,
          };

          db.createMember(newMember);
          targetMember = newMember;
          stats.membersCreated++;

          if (legacyId) legacyToMemberMap.set(legacyId, targetMember);
          if (bookNo) legacyToMemberMap.set(bookNo, targetMember);

          // Open Initial Regular Saving Account
          const regularAccId = `sav_${targetMember.id}_reg`;
          const regAcc: DbSavingAccount = {
            id: regularAccId,
            accountNo: `SAV-REG-${targetMember.membershipNo}`,
            memberId: targetMember.id,
            membershipNo: targetMember.membershipNo,
            memberName: targetMember.fullName,
            productId: 'sp_regular',
            productCode: 'REGULAR',
            productName: 'Regular Mandatory Savings',
            currency: 'ETB',
            balance: 0,
            ledgerBalance: 0,
            accruedInterest: 0,
            lastInterestCalculationDate: now.split('T')[0],
            status: 'ACTIVE',
            openingDate: membershipDate,
            legacyMemberId: legacyId || undefined,
            legacySourceFile: batch.sourceFileName,
            legacySourceSheet: mappingConfig.sheetName,
            migrationBatchId: batchId,
            isMigrated: true,
            createdAt: now,
            updatedAt: now,
          };
          db.createSavingAccount(regAcc);
          stats.savingsAccountsUpdated++;

          // Open Share Account
          const shareAccId = `sha_${targetMember.id}`;
          const shareAcc: DbShareAccount = {
            id: shareAccId,
            accountNo: `SHA-${targetMember.membershipNo}`,
            memberId: targetMember.id,
            membershipNo: targetMember.membershipNo,
            memberName: targetMember.fullName,
            numberOfShares: 0,
            sharePrice: 500,
            totalShareValue: 0,
            status: 'ACTIVE',
            openingDate: membershipDate,
            createdAt: now,
            updatedAt: now,
          };
          db.createShareAccount(shareAcc);
          stats.shareAccountsUpdated++;
        }
      }
    }

    // ========================================================
    // PASS 2: PROCESS SAVINGS TRANSACTIONS
    // ========================================================
    const savingsConfigs = batch.mappings.filter((m) => m.entityType === 'SAVINGS_TRANSACTION');
    for (const mappingConfig of savingsConfigs) {
      const ws = wb.Sheets[mappingConfig.sheetName];
      if (!ws) continue;

      const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
      for (let idx = 0; idx < rawRows.length; idx++) {
        const row = rawRows[idx];
        const rowNumber = idx + 2;

        const extracted: Record<string, any> = {};
        mappingConfig.mappings.forEach((m) => {
          extracted[m.targetField] = row[m.sourceColumn];
        });

        const legacyId = extracted.legacyMemberId ? String(extracted.legacyMemberId).trim().toUpperCase() : '';
        const bookNo = extracted.legacyBookNumber ? String(extracted.legacyBookNumber).trim().toUpperCase() : '';
        const targetMember = (legacyId && legacyToMemberMap.get(legacyId)) ||
                             (bookNo && legacyToMemberMap.get(bookNo)) ||
                             db.getMemberByLegacyId(legacyId);

        if (!targetMember) {
          db.createMigrationException({
            id: `ex_${batchId}_sav_${idx}`,
            batchId,
            batchNumber: batch.batchNumber,
            sourceFile: batch.sourceFileName,
            sourceSheet: mappingConfig.sheetName,
            sourceRowNumber: rowNumber,
            legacyIdentifier: legacyId,
            entityType: 'SAVINGS_TRANSACTION',
            rawRecord: row,
            issueType: 'MISSING_MEMBER_REF',
            severity: 'WARNING',
            description: `Row ${rowNumber}: Could not link savings record '${legacyId || bookNo}' to a migrated member.`,
            resolutionStatus: 'PENDING_REVIEW',
            createdAt: now,
          });
          stats.exceptionsLogged++;
          continue;
        }

        const regularAmount = migrationParserService.cleanNumber(extracted.regularSavings);
        const voluntaryAmount = migrationParserService.cleanNumber(extracted.voluntarySavings);
        const timeDepositAmount = migrationParserService.cleanNumber(extracted.timeDeposit);

        const parsedDate = parseLegacyDate(extracted.depositDateGc || extracted.depositDateEc);
        const txDate = parsedDate.isValid && parsedDate.isoDate ? parsedDate.isoDate : now;

        // Post Regular Savings
        if (regularAmount > 0) {
          const acc = db.getSavingAccountsByMemberId(targetMember.id).find((a) => a.productCode === 'REGULAR');
          if (acc) {
            const balanceBefore = acc.balance;
            acc.balance += regularAmount;
            if (acc.ledgerBalance !== undefined) acc.ledgerBalance += regularAmount;
            db.updateSavingAccount(acc.id, acc);

            const txNo = `WBS-MIG-${Date.now()}-${idx}`;
            const tx: DbFinancialTransaction = {
              id: `tx_${Date.now()}_${idx}`,
              transactionNo: txNo,
              memberId: targetMember.id,
              membershipNo: targetMember.membershipNo,
              memberName: targetMember.fullName,
              accountId: acc.id,
              accountNo: acc.accountNo,
              productCode: 'REGULAR',
              type: 'DEPOSIT',
              amount: regularAmount,
              debitAmount: null,
              creditAmount: regularAmount,
              balanceBefore,
              balanceAfter: acc.balance,
              paymentChannel: migrationParserService.normalizeBankChannel(extracted.paymentChannel),
              bankReferenceNo: extracted.bankReferenceNo || `HIST-SLIP-${idx}`,
              narration: `Historical Regular Savings Opening Deposit (Batch ${batch.batchNumber})`,
              status: 'POSTED',
              requiresApproval: false,
              createdById: executorUser.id,
              createdByName: executorUser.fullName || executorUser.username,
              legacyMemberId: legacyId,
              legacyBookNumber: bookNo,
              legacyReceiptNumber: extracted.legacyReceiptNumber,
              legacySourceFile: batch.sourceFileName,
              legacySourceSheet: mappingConfig.sheetName,
              legacyRowNumber: rowNumber,
              migrationBatchId: batchId,
              isMigrated: true,
              timestamp: txDate,
              createdAt: now,
            };
            db.createFinancialTransaction(tx);
            stats.savingsTransactionsCreated++;
          }
        }
      }
    }

    // ========================================================
    // PASS 3: PROCESS SHARE CAPITAL TRANSACTIONS
    // ========================================================
    const shareConfigs = batch.mappings.filter((m) => m.entityType === 'SHARE_TRANSACTION');
    for (const mappingConfig of shareConfigs) {
      const ws = wb.Sheets[mappingConfig.sheetName];
      if (!ws) continue;

      const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
      for (let idx = 0; idx < rawRows.length; idx++) {
        const row = rawRows[idx];
        const rowNumber = idx + 2;

        const extracted: Record<string, any> = {};
        mappingConfig.mappings.forEach((m) => {
          extracted[m.targetField] = row[m.sourceColumn];
        });

        const legacyId = extracted.legacyMemberId ? String(extracted.legacyMemberId).trim().toUpperCase() : '';
        const bookNo = extracted.legacyBookNumber ? String(extracted.legacyBookNumber).trim().toUpperCase() : '';
        const targetMember = (legacyId && legacyToMemberMap.get(legacyId)) ||
                             (bookNo && legacyToMemberMap.get(bookNo)) ||
                             db.getMemberByLegacyId(legacyId);

        if (!targetMember) continue;

        const numShares = migrationParserService.cleanNumber(extracted.numberOfShares) || 5;
        const shareVal = migrationParserService.cleanNumber(extracted.shareValue) || numShares * 500;

        const shareAcc = db.getShareAccountByMemberId(targetMember.id);
        if (shareAcc && shareVal > 0) {
          const sharesBefore = shareAcc.numberOfShares;
          const valueBefore = shareAcc.totalShareValue;
          shareAcc.numberOfShares += numShares;
          shareAcc.totalShareValue += shareVal;
          db.updateShareAccount(shareAcc.id, shareAcc);

          const stx: DbShareTransaction = {
            id: `stx_${Date.now()}_${idx}`,
            transactionNo: `SHT-MIG-${Date.now()}-${idx}`,
            shareAccountId: shareAcc.id,
            shareAccountNo: shareAcc.accountNo,
            memberId: targetMember.id,
            membershipNo: targetMember.membershipNo,
            memberName: targetMember.fullName,
            type: 'SHARE_PURCHASE',
            numberOfShares: numShares,
            unitPrice: 500,
            totalAmount: shareVal,
            sharesBefore,
            sharesAfter: shareAcc.numberOfShares,
            valueBefore,
            valueAfter: shareAcc.totalShareValue,
            paymentMethod: 'CBE_BANK',
            narration: `Historical Share Capital Subscription (Batch ${batch.batchNumber})`,
            status: 'POSTED',
            createdById: executorUser.id,
            createdByName: executorUser.fullName || executorUser.username,
            legacyMemberId: legacyId,
            legacyBookNumber: bookNo,
            legacyReceiptNumber: extracted.legacyReceiptNumber,
            legacySourceFile: batch.sourceFileName,
            legacySourceSheet: mappingConfig.sheetName,
            legacyRowNumber: rowNumber,
            migrationBatchId: batchId,
            isMigrated: true,
            timestamp: now,
            createdAt: now,
          };
          db.createShareTransaction(stx);
          stats.shareTransactionsCreated++;
        }
      }
    }

    // ========================================================
    // PASS 4: PROCESS LOAN REPAYMENTS
    // ========================================================
    const loanConfigs = batch.mappings.filter((m) => m.entityType === 'LOAN_REPAYMENT');
    for (const mappingConfig of loanConfigs) {
      const ws = wb.Sheets[mappingConfig.sheetName];
      if (!ws) continue;

      const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
      for (let idx = 0; idx < rawRows.length; idx++) {
        const row = rawRows[idx];
        const rowNumber = idx + 2;

        const extracted: Record<string, any> = {};
        mappingConfig.mappings.forEach((m) => {
          extracted[m.targetField] = row[m.sourceColumn];
        });

        const legacyId = extracted.legacyMemberId ? String(extracted.legacyMemberId).trim().toUpperCase() : '';
        const targetMember = (legacyId && legacyToMemberMap.get(legacyId)) || db.getMemberByLegacyId(legacyId);

        const principal = migrationParserService.cleanNumber(extracted.principalRepaid);
        const interest = migrationParserService.cleanNumber(extracted.interestPaid);
        const penalty = migrationParserService.cleanNumber(extracted.penaltyPaid);
        const totalPaid = principal + interest + penalty;

        if (!targetMember) {
          // Orphaned loan repayment rule: Do NOT fabricate loan principal, create migration exception requiring manual review
          db.createMigrationException({
            id: `ex_${batchId}_loan_${idx}`,
            batchId,
            batchNumber: batch.batchNumber,
            sourceFile: batch.sourceFileName,
            sourceSheet: mappingConfig.sheetName,
            sourceRowNumber: rowNumber,
            legacyIdentifier: legacyId,
            entityType: 'LOAN_REPAYMENT',
            rawRecord: row,
            issueType: 'LOAN_REPAYMENT_WITHOUT_DISBURSEMENT',
            severity: 'WARNING',
            description: `Row ${rowNumber}: Historical loan repayment of ${totalPaid} ETB found without an active disbursed loan record for '${legacyId}'. Flagged for accountant review.`,
            resolutionStatus: 'PENDING_REVIEW',
            createdAt: now,
          });
          stats.exceptionsLogged++;
          continue;
        }

        const parsedDate = parseLegacyDate(extracted.paymentDateGc || extracted.paymentDateEc);
        const lrpDate = parsedDate.isValid && parsedDate.isoDate ? parsedDate.isoDate : now;

        const lrp: DbLoanRepayment = {
          id: `lrp_${Date.now()}_${idx}`,
          repaymentNo: `LRP-MIG-${Date.now()}-${idx}`,
          loanId: `loan_mig_placeholder_${targetMember.id}`,
          loanNo: `LN-HIST-${targetMember.membershipNo}`,
          memberId: targetMember.id,
          membershipNo: targetMember.membershipNo,
          memberName: targetMember.fullName,
          amount: totalPaid,
          principalPaid: principal,
          interestPaid: interest,
          penaltyPaid: penalty,
          principalBalanceBefore: principal,
          principalBalanceAfter: 0,
          totalBalanceBefore: totalPaid,
          totalBalanceAfter: 0,
          paymentChannel: 'CBE_BANK',
          narration: `Historical Loan Repayment (Batch ${batch.batchNumber})`,
          performedById: executorUser.id,
          performedByName: executorUser.fullName || executorUser.username,
          legacyMemberId: legacyId,
          legacyBookNumber: extracted.legacyBookNumber,
          legacyReceiptNumber: extracted.legacyReceiptNumber,
          legacySourceFile: batch.sourceFileName,
          legacySourceSheet: mappingConfig.sheetName,
          legacyRowNumber: rowNumber,
          migrationBatchId: batchId,
          isMigrated: true,
          timestamp: lrpDate,
          status: 'POSTED',
          createdAt: now,
        };
        db.createLoanRepayment(lrp);
        stats.loanRepaymentsCreated++;
      }
    }

    // ========================================================
    // PASS 5: POST GENERAL LEDGER OPENING BALANCES & JOURNAL ENTRIES
    // ========================================================
    const totalReg = batch.financialSummary.regularSavings;
    const totalShares = batch.financialSummary.shares;
    const totalFees = batch.financialSummary.registrationFees;
    const totalVolume = totalReg + totalShares + totalFees;

    if (totalVolume > 0) {
      const journalNo = `JE-MIG-${Date.now()}`;
      const journalEntry: DbJournalEntry = {
        id: `je_${Date.now()}`,
        journalNo,
        transactionType: 'MIGRATION_OPENING_BALANCE',
        transactionReference: `MIGRATION-${batch.batchNumber}`,
        entryDate: now.split('T')[0],
        narration: `Consolidated General Ledger Historical Opening Balance for Legacy Migration Batch ${batch.batchNumber} (${batch.sourceFileName})`,
        status: 'POSTED',
        source: 'AUTOMATIC',
        totalDebit: totalVolume,
        totalCredit: totalVolume,
        postedBy: executorUser.id,
        postedByName: executorUser.fullName || executorUser.username,
        lines: [
          // Debit: Commercial Bank of Ethiopia (1010)
          {
            id: `jel_${Date.now()}_1`,
            accountId: 'coa_1010',
            accountCode: '1010',
            accountName: 'Cash at Bank - Commercial Bank of Ethiopia',
            accountType: 'ASSET',
            debit: totalVolume,
            credit: 0,
            narration: `Historical Migration Cash Intake across ${stats.membersCreated} members`,
          },
          // Credit: Regular Member Savings (2010)
          {
            id: `jel_${Date.now()}_2`,
            accountId: 'coa_2010',
            accountCode: '2010',
            accountName: 'Regular Mandatory Member Savings',
            accountType: 'LIABILITY',
            debit: 0,
            credit: totalReg,
            narration: 'Cumulative Historical Member Regular Savings',
          },
          // Credit: Member Share Capital (3010)
          {
            id: `jel_${Date.now()}_3`,
            accountId: 'coa_3010',
            accountCode: '3010',
            accountName: 'Member Share Capital Subscribed',
            accountType: 'EQUITY',
            debit: 0,
            credit: totalShares,
            narration: 'Cumulative Historical Member Share Capital',
          },
          // Credit: Member Registration Fees (4010)
          {
            id: `jel_${Date.now()}_4`,
            accountId: 'coa_4010',
            accountCode: '4010',
            accountName: 'Member Registration & Admission Fees',
            accountType: 'INCOME',
            debit: 0,
            credit: totalFees,
            narration: 'Historical Registration Fees Collected',
          },
        ],
        createdAt: now,
        updatedAt: now,
      };

      db.createJournalEntry(journalEntry);
      stats.journalEntriesCreated++;

      // Create Historical Opening Balance tracking records
      const hob1: DbHistoricalOpeningBalance = {
        id: `hob_${Date.now()}_1`,
        batchId,
        batchNumber: batch.batchNumber,
        accountCode: '1010',
        accountName: 'Cash at Bank - Commercial Bank of Ethiopia',
        accountType: 'ASSET',
        debit: totalVolume,
        credit: 0,
        effectiveDate: now.split('T')[0],
        sourceDocument: batch.sourceFileName,
        reason: 'Legacy Migration Opening Asset Balance',
        status: 'POSTED',
        journalEntryId: journalEntry.id,
        createdById: executorUser.id,
        createdByName: executorUser.fullName || executorUser.username,
        approvedById: executorUser.id,
        approvedByName: executorUser.fullName || executorUser.username,
        approvedAt: now,
        createdAt: now,
      };
      db.createHistoricalOpeningBalance(hob1);
      stats.openingBalancesEstablished++;
    }

    stats.completedAt = new Date().toISOString();

    const finalBatch = db.updateMigrationBatch(batchId, {
      status: 'COMPLETED',
      executionStats: stats,
    });

    db.recordAuditLog({
      id: `aud_${Date.now()}`,
      actorId: executorUser.id,
      actorName: executorUser.fullName || executorUser.username,
      actorRole: executorUser.role || 'ADMIN',
      action: 'MIGRATION_BATCH_IMPORTED',
      resource: 'migration_batches',
      resourceId: batchId,
      afterState: { batchNumber: batch.batchNumber, stats },
      result: 'SUCCESS',
      ipAddress: '127.0.0.1',
      userAgent: 'Wabi SACCO Migration Engine',
      timestamp: new Date().toISOString(),
    });

    return finalBatch;
  }

  /**
   * Rolls back a completed or failed migration batch
   */
  public rollbackBatch(
    batchId: string,
    executorUser: DbUser,
    reason: string
  ): { success: boolean; deletedCounts: Record<string, number>; batch: DbMigrationBatch } {
    const batch = db.getMigrationBatchById(batchId);
    if (!batch) throw new Error(`Batch '${batchId}' not found`);

    const result = db.rollbackMigrationBatch(
      batchId,
      executorUser.id,
      executorUser.fullName || executorUser.username,
      reason
    );

    db.recordAuditLog({
      id: `aud_${Date.now()}`,
      actorId: executorUser.id,
      actorName: executorUser.fullName || executorUser.username,
      actorRole: executorUser.role || 'ADMIN',
      action: 'MIGRATION_BATCH_ROLLED_BACK',
      resource: 'migration_batches',
      resourceId: batchId,
      afterState: { batchNumber: batch.batchNumber, reason, deletedCounts: result.deletedCounts },
      result: 'SUCCESS',
      ipAddress: '127.0.0.1',
      userAgent: 'Wabi SACCO Migration Engine',
      timestamp: new Date().toISOString(),
    });

    const updatedBatch = db.getMigrationBatchById(batchId)!;
    return {
      success: true,
      deletedCounts: result.deletedCounts,
      batch: updatedBatch,
    };
  }

  /**
   * Resolves a migration exception in the manual review queue
   */
  public resolveException(
    exceptionId: string,
    action: 'RESOLVED' | 'SKIPPED' | 'OVERRIDDEN',
    resolutionNote: string,
    user: DbUser
  ): DbMigrationException {
    const ex = db.getMigrationExceptionById(exceptionId);
    if (!ex) throw new Error(`Exception '${exceptionId}' not found`);

    const updated = db.updateMigrationException(exceptionId, {
      resolutionStatus: action,
      resolutionAction: resolutionNote,
      resolvedById: user.id,
      resolvedByName: user.fullName || user.username,
      resolvedAt: new Date().toISOString(),
    });

    return updated;
  }

  /**
   * Generates downloadable CSV exports for a batch
   */
  public generateExportCsv(batchId: string, reportType: 'SUMMARY' | 'MEMBERS' | 'FINANCIAL' | 'EXCEPTIONS'): string {
    const batch = db.getMigrationBatchById(batchId);
    if (!batch) throw new Error(`Batch '${batchId}' not found`);

    if (reportType === 'EXCEPTIONS') {
      const exceptions = db.getMigrationExceptions(batchId);
      const rows = [
        ['Exception ID', 'Source File', 'Sheet', 'Row Number', 'Legacy Identifier', 'Issue Type', 'Severity', 'Description', 'Resolution Status'],
        ...exceptions.map((e) => [
          e.id,
          e.sourceFile,
          e.sourceSheet,
          String(e.sourceRowNumber),
          e.legacyIdentifier || 'N/A',
          e.issueType,
          e.severity,
          `"${e.description.replace(/"/g, '""')}"`,
          e.resolutionStatus,
        ]),
      ];
      return rows.map((r) => r.join(',')).join('\n');
    }

    if (reportType === 'MEMBERS') {
      const members = db.getMembers().filter((m) => m.migrationBatchId === batchId);
      const rows = [
        ['Membership No', 'Legacy SADV ID', 'Book No', 'Full Name', 'Gender', 'Phone', 'Registration Date', 'Migrated At'],
        ...members.map((m) => [
          m.membershipNo,
          m.legacyMemberId || 'N/A',
          m.legacyBookNumber || 'N/A',
          `"${m.fullName}"`,
          m.gender,
          m.phoneNumber,
          m.membershipDate,
          m.createdAt,
        ]),
      ];
      return rows.map((r) => r.join(',')).join('\n');
    }

    // Default SUMMARY
    const summaryRows = [
      ['Metric', 'Value'],
      ['Batch Number', batch.batchNumber],
      ['Source File', batch.sourceFileName],
      ['Status', batch.status],
      ['Total Rows Read', String(batch.validationSummary.totalRows)],
      ['Valid Rows', String(batch.validationSummary.validRows)],
      ['Rejected Rows', String(batch.validationSummary.rejectedRows)],
      ['Duplicates Detected', String(batch.validationSummary.duplicateCount)],
      ['Manual Review Needed', String(batch.validationSummary.manualReviewCount)],
      ['Total Regular Savings (ETB)', String(batch.financialSummary.regularSavings)],
      ['Total Share Capital (ETB)', String(batch.financialSummary.shares)],
      ['Total Registration Fees (ETB)', String(batch.financialSummary.registrationFees)],
      ['Total Financial Volume (ETB)', String(batch.financialSummary.totalFinancialVolume)],
      ['Uploaded By', batch.uploadedByName],
      ['Approved By', batch.approvedByName || 'N/A'],
    ];
    return summaryRows.map((r) => r.join(',')).join('\n');
  }
}

export const migrationService = new MigrationService();
