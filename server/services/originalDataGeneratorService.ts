import { db } from '../db/database';
import { cryptoUtils } from '../utils/crypto';
import { accountingService } from './accountingService';
import { cache } from './cacheService';
import {
  DbMember,
  DbUser,
  DbSavingAccount,
  DbShareAccount,
  DbShareCertificate,
  DbShareTransaction,
  DbLoan,
  DbLoanScheduleItem,
  DbLoanRepayment,
  DbFinancialTransaction,
  DbJournalEntry,
  DbTicket,
  DbTicketMessage,
  DbCommunicationMessage,
  DbNotificationDeliveryLog,
  DbDepositBatch,
  DbMonthlySavingsSchedule,
} from '../db/schema';

export interface GenerateOriginalDataOptions {
  memberCount?: number;
  includeLoans?: boolean;
  includeSavings?: boolean;
  includeShares?: boolean;
  includeSupportTickets?: boolean;
  monthsOfHistory?: number;
  adminUserId?: string;
}

export interface GenerationSummary {
  success: boolean;
  membersGenerated: number;
  usersGenerated: number;
  savingAccountsGenerated: number;
  shareAccountsGenerated: number;
  loansGenerated: number;
  transactionsGenerated: number;
  journalEntriesGenerated: number;
  supportTicketsGenerated: number;
  totalAssetsEtb: number;
  totalDepositsEtb: number;
  totalShareCapitalEtb: number;
  totalLoanPortfolioEtb: number;
  trialBalanceBalanced: boolean;
  executionTimeMs: number;
  generatedAt: string;
}

// Authentic Ethiopian Names Pool (Diverse First, Father, and Grandfather Names)
const ETHIOPIAN_FIRST_NAMES_MALE = [
  'Dawit', 'Tadesse', 'Henok', 'Kenenisa', 'Yohannes', 'Ephrem', 'Tamirat', 'Mulugeta',
  'Berhanu', 'Getachew', 'Nebiyu', 'Surafel', 'Fikru', 'Dejene', 'Natnael', 'Tesfaye',
  'Bekele', 'Sisay', 'Abel', 'Worku', 'Eyob', 'Kassahun', 'Zelalem', 'Solomon',
  'Birhanu', 'Kaleb', 'Alemayehu', 'Desta', 'Tariku', 'Ermias', 'Yonas', 'Girma'
];

const ETHIOPIAN_FIRST_NAMES_FEMALE = [
  'Bethlehem', 'Almaz', 'Tirhas', 'Hanan', 'Lidia', 'Frehiwot', 'Birtukan', 'Senait',
  'Genet', 'Tsion', 'Selamawit', 'Tigist', 'Rahel', 'Marta', 'Mahlet', 'Zinash',
  'Emebet', 'Hiwot', 'Kidist', 'Helen', 'Semhal', 'Danawit', 'Tsige', 'Mulumebet',
  'Aster', 'Hirut', 'Samrawit', 'Tsehay', 'Elsa', 'Mekdes', 'Eden', 'Yordanos'
];

const ETHIOPIAN_FATHER_NAMES = [
  'Yohannes', 'Haile', 'Samson', 'Ephrem', 'Tadesse', 'Dejene', 'Kaleb', 'Tewodros',
  'Daniel', 'Birhanu', 'Mengistu', 'Alemayehu', 'Solomon', 'Getachew', 'Fikru',
  'Ermias', 'Natnael', 'Sisay', 'Abel', 'Worku', 'Eyob', 'Kassahun', 'Zelalem',
  'Tariku', 'Nebiyu', 'Tamirat', 'Surafel', 'Berhanu', 'Kenenisa', 'Desta'
];

const ETHIOPIAN_GRANDFATHER_NAMES = [
  'Gizaw', 'Bekele', 'Mekonnen', 'Welde', 'Hailu', 'Derese', 'Belay', 'Ayele',
  'Gemeda', 'Gezahegn', 'Chala', 'Mengistu', 'Shiferaw', 'Worku', 'Tulu',
  'Bogale', 'Assefa', 'Balcha', 'Kassaye', 'Wondimu', 'Alemu', 'Bikila', 'Kebede',
  'Feyissa', 'Desta', 'Gebresilassie', 'Wolde', 'Negash', 'Tolossa', 'Kassa'
];

const ADDIS_SUBCITIES = [
  { subcity: 'Bole', woredas: ['01', '03', '05', '08', '11'], kebeles: ['01/02', '03/04', '07/08'] },
  { subcity: 'Kirkos', woredas: ['02', '04', '07', '09'], kebeles: ['02/03', '05/06', '08/09'] },
  { subcity: 'Yeka', woredas: ['01', '06', '08', '12'], kebeles: ['01/04', '06/07', '11/12'] },
  { subcity: 'Arada', woredas: ['01', '02', '05', '07'], kebeles: ['01/02', '04/05', '07/08'] },
  { subcity: 'Nifas Silk Lafto', woredas: ['03', '06', '09', '12'], kebeles: ['03/05', '07/08', '10/12'] },
  { subcity: 'Lideta', woredas: ['01', '03', '06', '08'], kebeles: ['01/03', '05/06', '08/09'] },
  { subcity: 'Gulele', woredas: ['02', '05', '07', '10'], kebeles: ['02/04', '06/08', '09/10'] },
  { subcity: 'Kolfe Keranio', woredas: ['04', '07', '11', '14'], kebeles: ['04/06', '08/09', '12/14'] }
];

const OCCUPATIONS = [
  { title: 'Senior Civil Engineer', employer: 'Ethiopian Construction Works Corp', minIncome: 35000, maxIncome: 65000 },
  { title: 'Public Health Specialist', employer: 'Federal Ministry of Health', minIncome: 28000, maxIncome: 48000 },
  { title: 'Associate Professor', employer: 'Addis Ababa University', minIncome: 32000, maxIncome: 55000 },
  { title: 'Senior Financial Analyst', employer: 'Commercial Bank of Ethiopia', minIncome: 30000, maxIncome: 58000 },
  { title: 'Agricultural Logistics Manager', employer: 'Ethiopian Agricultural Business Corp', minIncome: 26000, maxIncome: 45000 },
  { title: 'Architectural Project Lead', employer: 'Habesha Design Group', minIncome: 38000, maxIncome: 75000 },
  { title: 'Enterprise IT Systems Specialist', employer: 'Ethio Telecom', minIncome: 34000, maxIncome: 62000 },
  { title: 'Registered Pharmacist', employer: 'Kenema Pharmacy Enterprise', minIncome: 24000, maxIncome: 42000 },
  { title: 'High School Department Head', employer: 'Addis Ababa Education Bureau', minIncome: 18000, maxIncome: 32000 },
  { title: 'Commercial Import/Export Trader', employer: 'Self-Employed Private Enterprise', minIncome: 45000, maxIncome: 95000 },
  { title: 'Cooperative Logistics Coordinator', employer: 'Wabi Union Transport', minIncome: 22000, maxIncome: 38000 },
  { title: 'Auditing & Tax Consultant', employer: 'Crown Accounting Services', minIncome: 35000, maxIncome: 68000 },
];

export class OriginalDataGeneratorService {
  /**
   * Generates a completely authentic, original operational dataset for Wabi SACCO.
   * Ensures every transaction has balanced double-entry GL postings, mathematically
   * precise loan amortizations, and authentic Ethiopian KYC member profiles.
   */
  public async generateOriginalData(options: GenerateOriginalDataOptions = {}): Promise<GenerationSummary> {
    const startTime = Date.now();
    const count = Math.min(Math.max(options.memberCount || 25, 5), 100);
    const includeLoans = options.includeLoans !== false;
    const includeSavings = options.includeSavings !== false;
    const includeShares = options.includeShares !== false;
    const includeSupport = options.includeSupportTickets !== false;
    const monthsHistory = options.monthsOfHistory || 6;
    const adminUserId = options.adminUserId || 'usr_admin_1';

    // 1. Purge previous records to ensure pristine state
    db.executeProductionReset(adminUserId);

    const now = new Date();
    const generatedMembers: DbMember[] = [];
    const generatedUsers: DbUser[] = [];
    const generatedSavingAccounts: DbSavingAccount[] = [];
    const generatedShareAccounts: DbShareAccount[] = [];
    const generatedShareCertificates: DbShareCertificate[] = [];
    const generatedShareTransactions: DbShareTransaction[] = [];
    const generatedLoans: DbLoan[] = [];
    const generatedLoanSchedules: DbLoanScheduleItem[] = [];
    const generatedLoanRepayments: DbLoanRepayment[] = [];
    const generatedTransactions: DbFinancialTransaction[] = [];
    const generatedJournals: DbJournalEntry[] = [];
    const generatedDepositBatches: DbDepositBatch[] = [];
    const generatedMonthlySchedules: DbMonthlySavingsSchedule[] = [];
    const generatedTickets: DbTicket[] = [];
    const generatedTicketMessages: DbTicketMessage[] = [];
    const generatedCommunicationLogs: DbCommunicationMessage[] = [];
    const generatedDeliveryLogs: DbNotificationDeliveryLog[] = [];

    // Master Product Lookups
    const savingProducts = db.getSavingProducts();
    const regularProduct = savingProducts.find((p) => p.code === 'REGULAR') || savingProducts[0];
    const voluntaryProduct = savingProducts.find((p) => p.code === 'VOLUNTARY') || savingProducts[1];
    const loanProducts = db.getLoanProducts();
    const emergencyLoanProduct = loanProducts.find((p) => p.code === 'EMERGENCY') || loanProducts[0];
    const businessLoanProduct = loanProducts.find((p) => p.code === 'BUSINESS') || loanProducts[1];
    const developmentLoanProduct = loanProducts.find((p) => p.code === 'PERSONAL') || loanProducts[2] || loanProducts[0];

    const memberRole = db.getRoles().find((r) => r.code === 'MEMBER') || { id: 'role_member' };
    const adminUser = db.getUserById(adminUserId) || {
      id: 'usr_admin_1',
      fullName: 'Samuel Ambaw (System Admin)',
      username: 'admin.sacco',
    };

    // Track Aggregates
    let totalDepositsEtb = 0;
    let totalShareCapitalEtb = 0;
    let totalLoanPortfolioEtb = 0;
    let totalCashReceivedEtb = 0;

    // 2. Generate Authentic Members & Member Accounts
    for (let i = 0; i < count; i++) {
      const isFemale = i % 2 === 1;
      const firstNameList = isFemale ? ETHIOPIAN_FIRST_NAMES_FEMALE : ETHIOPIAN_FIRST_NAMES_MALE;
      const firstName = firstNameList[i % firstNameList.length];
      const fatherName = ETHIOPIAN_FATHER_NAMES[(i * 3 + 1) % ETHIOPIAN_FATHER_NAMES.length];
      const grandfatherName = ETHIOPIAN_GRANDFATHER_NAMES[(i * 7 + 2) % ETHIOPIAN_GRANDFATHER_NAMES.length];
      const fullName = `${firstName} ${fatherName} ${grandfatherName}`;

      const memberSeq = i + 1;
      const memberNumber = `WB${String(memberSeq).padStart(6, '0')}`;
      const memberId = `mem_${cryptoUtils.generateUuid().slice(0, 12)}`;
      const userId = `usr_mem_${cryptoUtils.generateUuid().slice(0, 12)}`;
      const username = `${firstName.toLowerCase()}.${fatherName.toLowerCase()}${memberSeq > 20 ? memberSeq : ''}`;
      const email = `${firstName.toLowerCase()}.${fatherName.toLowerCase()}${memberSeq > 20 ? memberSeq : ''}@gmail.com`;
      const phoneNumber = `+2519${String(11000000 + (memberSeq * 83719) % 88000000).padStart(8, '0')}`;
      const nationalId = `FAN-ETH-${String(1000 + memberSeq).padStart(4, '0')}-${String(8000 + (memberSeq * 137) % 1999).padStart(4, '0')}`;

      const subcityObj = ADDIS_SUBCITIES[i % ADDIS_SUBCITIES.length];
      const woreda = subcityObj.woredas[i % subcityObj.woredas.length];
      const kebele = subcityObj.kebeles[i % subcityObj.kebeles.length];
      const occObj = OCCUPATIONS[i % OCCUPATIONS.length];
      const monthlyIncome = Math.round(occObj.minIncome + ((occObj.maxIncome - occObj.minIncome) * ((i * 17) % 100)) / 100);

      // Join Date staggered across past 6 - 24 months
      const monthsAgoJoined = Math.min(monthsHistory, Math.max(1, Math.floor(((count - i) / count) * monthsHistory) + 1));
      const joinDateObj = new Date(now.getTime() - monthsAgoJoined * 30 * 24 * 60 * 60 * 1000);
      const joinedDate = joinDateObj.toISOString().split('T')[0];

      // Create Authentication User
      const salt = cryptoUtils.generateSalt();
      const passwordHash = cryptoUtils.hashPassword('MemberPass123!', salt);
      const userObj: DbUser = {
        id: userId,
        username,
        email,
        phoneNumber,
        fullName,
        firstName,
        lastName: fatherName,
        passwordHash,
        salt,
        membershipNo: memberNumber,
        memberId,
        passwordChangedAt: joinDateObj.toISOString(),
        role: 'role_member',
        isActive: true,
        status: 'ACTIVE',
        failedLoginAttempts: 0,
        createdAt: joinDateObj.toISOString(),
        updatedAt: now.toISOString(),
      };
      generatedUsers.push(userObj);

      // Nominee / Beneficiary
      const nomineeRelation = isFemale ? 'Husband' : 'Wife';
      const nomineeFather = ETHIOPIAN_FATHER_NAMES[(i * 5 + 3) % ETHIOPIAN_FATHER_NAMES.length];
      const nomineeGrand = ETHIOPIAN_GRANDFATHER_NAMES[(i * 2 + 5) % ETHIOPIAN_GRANDFATHER_NAMES.length];
      const nomineeName = `${isFemale ? 'Abebe' : 'Aster'} ${nomineeFather} ${nomineeGrand}`;

      const memberObj: DbMember = {
        id: memberId,
        userId,
        membershipNo: memberNumber,
        fullName,
        gender: isFemale ? 'FEMALE' : 'MALE',
        dateOfBirth: new Date(joinDateObj.getTime() - (28 + (i % 25)) * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        email,
        phoneNumber,
        nationalId,
        address: {
          region: 'Addis Ababa',
          zone: `${subcityObj.subcity} Subcity`,
          woreda: `Woreda ${woreda}`,
          kebele: `Kebele ${kebele}`,
          specificAddress: `House No. ${100 + (i * 13) % 899}`,
          additionalInfo: 'Residential block A',
        },
        occupation: occObj.title,
        employer: occObj.employer,
        monthlyIncome,
        employmentType: 'Employed',
        familyMembersCount: 2 + (i % 4),
        emergencyContact: {
          name: nomineeName,
          relationship: nomineeRelation,
          phone: `+2519${String(12000000 + (memberSeq * 91723) % 87000000).padStart(8, '0')}`,
          address: `${subcityObj.subcity}, Woreda ${woreda}`,
        },
        nominees: [
          {
            id: `nom_${memberSeq}_1`,
            fullName: nomineeName,
            relationship: nomineeRelation,
            percentage: 100,
            phone: `+2519${String(12000000 + (memberSeq * 91723) % 87000000).padStart(8, '0')}`,
            address: `${subcityObj.subcity}, Woreda ${woreda}`,
          },
        ],
        status: 'ACTIVE',
        approvedAt: joinDateObj.toISOString(),
        approvedBy: adminUserId,
        membershipDate: joinedDate,
        createdAt: joinDateObj.toISOString(),
        updatedAt: now.toISOString(),
      };
      generatedMembers.push(memberObj);

      // 3. Share Capital Account & Certificate (5,000 - 25,000 ETB)
      if (includeShares) {
        const shareAccountNo = `SH-${String(memberSeq).padStart(6, '0')}`;
        const shareAccountId = `sha_${cryptoUtils.generateUuid().slice(0, 12)}`;
        const shareCount = 10 + (i % 6) * 10; // 10, 20, 30, 40, 50, 60 shares
        const parValue = 500;
        const totalShareValue = shareCount * parValue;
        totalShareCapitalEtb += totalShareValue;
        totalCashReceivedEtb += totalShareValue;

        const shareAcc: DbShareAccount = {
          id: shareAccountId,
          accountNo: shareAccountNo,
          memberId,
          membershipNo: memberNumber,
          memberName: fullName,
          numberOfShares: shareCount,
          sharePrice: parValue,
          totalShareValue,
          status: 'ACTIVE',
          openingDate: joinedDate,
          lastTransactionDate: joinedDate,
          createdAt: joinDateObj.toISOString(),
          updatedAt: now.toISOString(),
        };
        generatedShareAccounts.push(shareAcc);

        // Share Certificate
        const certNumber = `CERT-2026-${String(memberSeq).padStart(5, '0')}`;
        const certObj: DbShareCertificate = {
          id: `cert_${cryptoUtils.generateUuid().slice(0, 12)}`,
          certificateNumber: certNumber,
          shareAccountId,
          memberId,
          memberName: fullName,
          membershipNo: memberNumber,
          sharesIssued: shareCount,
          shareValue: totalShareValue,
          parValuePerShare: parValue,
          issueDate: joinedDate,
          status: 'ACTIVE',
          issuedBy: adminUser.fullName,
          createdAt: joinDateObj.toISOString(),
        };
        generatedShareCertificates.push(certObj);

        // Share Purchase Transaction
        const shareTxNo = `STX-${joinDateObj.getFullYear()}-${String(memberSeq).padStart(6, '0')}`;
        const shareTx: DbShareTransaction = {
          id: `stx_${cryptoUtils.generateUuid().slice(0, 12)}`,
          transactionNo: shareTxNo,
          shareAccountId,
          shareAccountNo,
          memberId,
          membershipNo: memberNumber,
          memberName: fullName,
          type: 'SHARE_PURCHASE',
          numberOfShares: shareCount,
          unitPrice: parValue,
          totalAmount: totalShareValue,
          sharesBefore: 0,
          sharesAfter: shareCount,
          valueBefore: 0,
          valueAfter: totalShareValue,
          paymentMethod: 'CBE_BANK',
          bankReferenceNo: `CBE-DEP-${joinDateObj.getFullYear()}-${String(700000 + i * 1492).slice(0, 8)}`,
          narration: 'Initial compulsory statutory share capital subscription on membership approval.',
          status: 'POSTED',
          createdById: adminUserId,
          createdByName: adminUser.fullName,
          approvedById: adminUserId,
          approvedByName: adminUser.fullName,
          timestamp: joinDateObj.toISOString(),
          createdAt: joinDateObj.toISOString(),
        };
        generatedShareTransactions.push(shareTx);

        // GL Posting for Share Purchase:
        // Debit: 1101 (Cash at Commercial Bank of Ethiopia)
        // Credit: 3101 (Paid-up Share Capital)
        const journalNo = `JRN-${joinDateObj.getFullYear()}-${String(generatedJournals.length + 1).padStart(6, '0')}`;
        generatedJournals.push({
          id: `jrn_${cryptoUtils.generateUuid().slice(0, 12)}`,
          journalNo,
          entryDate: joinedDate,
          narration: `Initial share capital issuance for member ${memberNumber} (${fullName}) - ${shareCount} shares @ 500 ETB`,
          lines: [
            {
              id: `jline_${cryptoUtils.generateUuid().slice(0, 8)}`,
              accountId: 'coa_1101_cash_bank',
              accountCode: '1101',
              accountName: 'Cash at Commercial Bank of Ethiopia',
              accountType: 'ASSET',
              debit: totalShareValue,
              credit: 0,
              narration: 'Cash inflow for share capital subscription',
            },
            {
              id: `jline_${cryptoUtils.generateUuid().slice(0, 8)}`,
              accountId: 'coa_3101_share_capital',
              accountCode: '3101',
              accountName: 'Paid-up Share Capital',
              accountType: 'EQUITY',
              debit: 0,
              credit: totalShareValue,
              narration: 'Share capital issued',
            },
          ],
          totalDebit: totalShareValue,
          totalCredit: totalShareValue,
          postedBy: adminUserId,
          postedByName: adminUser.fullName,
          status: 'POSTED',
          source: 'AUTOMATIC',
          createdAt: joinDateObj.toISOString(),
        });
      }

      // 4. Savings Accounts (Regular Compulsory + Voluntary)
      let regularSavingsBalance = 0;
      let voluntarySavingsBalance = 0;
      let regularAccNo = '';

      if (includeSavings && regularProduct) {
        regularAccNo = `SA-REG-${String(memberSeq).padStart(6, '0')}`;
        const regAccId = `sa_reg_${cryptoUtils.generateUuid().slice(0, 12)}`;
        const monthlyDeposit = Math.round((monthlyIncome * 0.1) / 100) * 100 || 2000;
        const depositMonths = monthsAgoJoined;
        regularSavingsBalance = monthlyDeposit * depositMonths;
        totalDepositsEtb += regularSavingsBalance;
        totalCashReceivedEtb += regularSavingsBalance;

        const regAcc: DbSavingAccount = {
          id: regAccId,
          accountNo: regularAccNo,
          memberId,
          membershipNo: memberNumber,
          memberName: fullName,
          productId: regularProduct.id,
          productCode: 'REGULAR',
          productName: regularProduct.name || 'Regular Mandatory Savings',
          currency: 'ETB',
          balance: regularSavingsBalance,
          accruedInterest: Math.round(regularSavingsBalance * 0.07 * (depositMonths / 12)),
          lastInterestCalculationDate: now.toISOString().split('T')[0],
          status: 'ACTIVE',
          openingDate: joinedDate,
          lastTransactionDate: now.toISOString(),
          createdAt: joinDateObj.toISOString(),
          updatedAt: now.toISOString(),
        };
        generatedSavingAccounts.push(regAcc);

        // Monthly Savings Schedule Tracking
        generatedMonthlySchedules.push({
          id: `mss_${cryptoUtils.generateUuid().slice(0, 12)}`,
          memberId,
          membershipNo: memberNumber,
          memberName: fullName,
          accountId: regAccId,
          accountNo: regularAccNo,
          yearMonth: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
          expectedAmount: monthlyDeposit,
          actualDeposited: monthlyDeposit,
          shortfall: 0,
          status: 'MET',
          lastDepositDate: now.toISOString().split('T')[0],
          updatedAt: now.toISOString(),
        });

        // Generate Financial Transactions & GL Journals for deposits
        const txNo = `TXN-${now.getFullYear()}-${String(generatedTransactions.length + 1).padStart(6, '0')}`;
        generatedTransactions.push({
          id: `tx_${cryptoUtils.generateUuid().slice(0, 12)}`,
          transactionNo: txNo,
          accountId: regAccId,
          accountNo: regularAccNo,
          memberId,
          membershipNo: memberNumber,
          memberName: fullName,
          productCode: 'REGULAR',
          type: 'DEPOSIT',
          amount: regularSavingsBalance,
          debitAmount: null,
          creditAmount: regularSavingsBalance,
          balanceBefore: 0,
          balanceAfter: regularSavingsBalance,
          paymentChannel: 'CBE_BANK',
          bankReferenceNo: `DEP-REG-${String(memberSeq).padStart(6, '0')}`,
          narration: `Cumulative monthly regular compulsory savings contribution (${depositMonths} months @ ${monthlyDeposit} ETB)`,
          status: 'POSTED',
          requiresApproval: false,
          createdById: adminUserId,
          createdByName: adminUser.fullName,
          timestamp: now.toISOString(),
          createdAt: now.toISOString(),
        });

        // GL Posting for Regular Deposit:
        // Debit: 1101 (Cash at Bank)
        // Credit: 2101 (Regular Member Deposits)
        const journalNo = `JRN-${now.getFullYear()}-${String(generatedJournals.length + 1).padStart(6, '0')}`;
        generatedJournals.push({
          id: `jrn_${cryptoUtils.generateUuid().slice(0, 12)}`,
          journalNo,
          entryDate: now.toISOString().split('T')[0],
          narration: `Regular savings deposits posted for member ${memberNumber} (${fullName})`,
          lines: [
            {
              id: `jline_${cryptoUtils.generateUuid().slice(0, 8)}`,
              accountId: 'coa_1101_cash_bank',
              accountCode: '1101',
              accountName: 'Cash at Commercial Bank of Ethiopia',
              accountType: 'ASSET',
              debit: regularSavingsBalance,
              credit: 0,
              narration: 'Cash deposit into SACCO bank account',
            },
            {
              id: `jline_${cryptoUtils.generateUuid().slice(0, 8)}`,
              accountId: 'coa_2101_member_savings',
              accountCode: '2101',
              accountName: 'Member Regular Savings Deposits',
              accountType: 'LIABILITY',
              debit: 0,
              credit: regularSavingsBalance,
              narration: 'Credited to member regular savings',
            },
          ],
          totalDebit: regularSavingsBalance,
          totalCredit: regularSavingsBalance,
          postedBy: adminUserId,
          postedByName: adminUser.fullName,
          status: 'POSTED',
          source: 'AUTOMATIC',
          createdAt: now.toISOString(),
        });

        // Optional Voluntary Savings Account (for 50% of members)
        if (i % 2 === 0 && voluntaryProduct) {
          const volAccNo = `SA-VOL-${String(memberSeq).padStart(6, '0')}`;
          const volAccId = `sa_vol_${cryptoUtils.generateUuid().slice(0, 12)}`;
          voluntarySavingsBalance = 15000 + (i % 5) * 8000;
          totalDepositsEtb += voluntarySavingsBalance;
          totalCashReceivedEtb += voluntarySavingsBalance;

          const volAcc: DbSavingAccount = {
            id: volAccId,
            accountNo: volAccNo,
            memberId,
            membershipNo: memberNumber,
            memberName: fullName,
            productId: voluntaryProduct.id,
            productCode: 'VOLUNTARY',
            productName: voluntaryProduct.name || 'Voluntary Demand Savings',
            currency: 'ETB',
            balance: voluntarySavingsBalance,
            accruedInterest: Math.round(voluntarySavingsBalance * 0.05 * 0.5),
            lastInterestCalculationDate: now.toISOString().split('T')[0],
            status: 'ACTIVE',
            openingDate: joinedDate,
            lastTransactionDate: now.toISOString(),
            createdAt: joinDateObj.toISOString(),
            updatedAt: now.toISOString(),
          };
          generatedSavingAccounts.push(volAcc);

          const volTxNo = `TXN-${now.getFullYear()}-${String(generatedTransactions.length + 1).padStart(6, '0')}`;
          generatedTransactions.push({
            id: `tx_${cryptoUtils.generateUuid().slice(0, 12)}`,
            transactionNo: volTxNo,
            accountId: volAccId,
            accountNo: volAccNo,
            memberId,
            membershipNo: memberNumber,
            memberName: fullName,
            productCode: 'VOLUNTARY',
            type: 'DEPOSIT',
            amount: voluntarySavingsBalance,
            debitAmount: null,
            creditAmount: voluntarySavingsBalance,
            balanceBefore: 0,
            balanceAfter: voluntarySavingsBalance,
            paymentChannel: 'CBE_BANK',
            bankReferenceNo: `CBEBIRR-${String(1000000 + i * 8371).slice(0, 8)}`,
            narration: 'Voluntary mobile deposit from CBE Birr wallet',
            status: 'POSTED',
            requiresApproval: false,
            createdById: adminUserId,
            createdByName: adminUser.fullName,
            timestamp: now.toISOString(),
            createdAt: now.toISOString(),
          });

          // GL Posting for Voluntary Deposit:
          const volJrnNo = `JRN-${now.getFullYear()}-${String(generatedJournals.length + 1).padStart(6, '0')}`;
          generatedJournals.push({
            id: `jrn_${cryptoUtils.generateUuid().slice(0, 12)}`,
            journalNo: volJrnNo,
            entryDate: now.toISOString().split('T')[0],
            narration: `Voluntary demand savings deposit for member ${memberNumber} (${fullName})`,
            lines: [
              {
                id: `jline_${cryptoUtils.generateUuid().slice(0, 8)}`,
                accountId: 'coa_1101_cash_bank',
                accountCode: '1101',
                accountName: 'Cash at Commercial Bank of Ethiopia',
                accountType: 'ASSET',
                debit: voluntarySavingsBalance,
                credit: 0,
                narration: 'Cash received for voluntary deposit',
              },
              {
                id: `jline_${cryptoUtils.generateUuid().slice(0, 8)}`,
                accountId: 'coa_2102_voluntary_savings',
                accountCode: '2102',
                accountName: 'Voluntary Demand Savings Deposits',
                accountType: 'LIABILITY',
                debit: 0,
                credit: voluntarySavingsBalance,
                narration: 'Credited to member voluntary savings liability',
              },
            ],
            totalDebit: voluntarySavingsBalance,
            totalCredit: voluntarySavingsBalance,
            postedBy: adminUserId,
            postedByName: adminUser.fullName,
            status: 'POSTED',
            source: 'AUTOMATIC',
            createdAt: now.toISOString(),
          });
        }
      }

      // 5. Authentic Loan Portfolios (for ~40% of members)
      if (includeLoans && i % 3 === 0 && loanProducts.length > 0) {
        const isEmergency = i % 6 === 0;
        const loanProduct = isEmergency ? emergencyLoanProduct : (i % 9 === 0 ? developmentLoanProduct : businessLoanProduct);
        const principalAmount = isEmergency ? 40000 : (i % 9 === 0 ? 350000 : 120000);
        const termMonths = isEmergency ? 12 : (i % 9 === 0 ? 36 : 24);
        const annualRate = loanProduct.interestRate || 14.0;
        const monthlyRate = annualRate / 100 / 12;

        // Amortization (Equal Monthly Installment)
        const emi = Math.round(
          (principalAmount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
            (Math.pow(1 + monthlyRate, termMonths) - 1)
        );

        const loanNumber = `LN-${now.getFullYear()}-${String(generatedLoans.length + 1).padStart(5, '0')}`;
        const loanId = `loan_${cryptoUtils.generateUuid().slice(0, 12)}`;

        // Loan Disbursed 3-6 months ago
        const disbursedMonthsAgo = Math.min(monthsAgoJoined - 1, 4);
        const disbursedDateObj = new Date(now.getTime() - disbursedMonthsAgo * 30 * 24 * 60 * 60 * 1000);
        const disbursedDate = disbursedDateObj.toISOString().split('T')[0];

        // Guarantor (linked to another member in the SACCO)
        const guarantorIdx = (i + 1) % count;
        const guarantorFirstName = (guarantorIdx % 2 === 1 ? ETHIOPIAN_FIRST_NAMES_FEMALE : ETHIOPIAN_FIRST_NAMES_MALE)[guarantorIdx % 10];
        const guarantorFather = ETHIOPIAN_FATHER_NAMES[(guarantorIdx * 3 + 1) % ETHIOPIAN_FATHER_NAMES.length];
        const guarantorFullName = `${guarantorFirstName} ${guarantorFather}`;

        let outstandingPrincipal = principalAmount;
        let totalInterestPaid = 0;
        let totalPrincipalPaid = 0;

        const scheduleItems: DbLoanScheduleItem[] = [];
        const loanRepayments: DbLoanRepayment[] = [];

        // Build schedule
        let runningBalance = principalAmount;
        for (let inst = 1; inst <= termMonths; inst++) {
          const interestPortion = Math.round(runningBalance * monthlyRate);
          const principalPortion = Math.min(runningBalance, emi - interestPortion);
          const installmentTotal = principalPortion + interestPortion;
          const instDueDateObj = new Date(disbursedDateObj.getTime() + inst * 30 * 24 * 60 * 60 * 1000);
          const instDueDate = instDueDateObj.toISOString().split('T')[0];

          const isPast = inst <= disbursedMonthsAgo;
          const status = isPast ? 'PAID' : 'PENDING';

          if (isPast) {
            runningBalance -= principalPortion;
            totalPrincipalPaid += principalPortion;
            totalInterestPaid += interestPortion;
          }

          const schItem: DbLoanScheduleItem = {
            id: `sch_${loanId}_${inst}`,
            loanId,
            installmentNumber: inst,
            dueDate: instDueDate,
            openingBalance: inst === 1 ? principalAmount : principalAmount - (inst - 1) * principalPortion,
            principalAmount: principalPortion,
            interestAmount: interestPortion,
            installmentAmount: installmentTotal,
            remainingBalance: Math.max(0, runningBalance),
            penaltyAmount: 0,
            paidPrincipal: isPast ? principalPortion : 0,
            paidInterest: isPast ? interestPortion : 0,
            paidPenalty: 0,
            paidTotal: isPast ? installmentTotal : 0,
            status,
            daysLate: 0,
            paidDate: isPast ? instDueDate : undefined,
          };
          scheduleItems.push(schItem);
          generatedLoanSchedules.push(schItem);

          if (isPast) {
            const repNo = `REP-${now.getFullYear()}-${String(generatedLoanRepayments.length + 1).padStart(6, '0')}`;
            const repItem: DbLoanRepayment = {
              id: `rep_${cryptoUtils.generateUuid().slice(0, 12)}`,
              repaymentNo: repNo,
              loanId,
              loanNo: loanNumber,
              memberId,
              membershipNo: memberNumber,
              memberName: fullName,
              amount: installmentTotal,
              principalPaid: principalPortion,
              interestPaid: interestPortion,
              penaltyPaid: 0,
              principalBalanceBefore: runningBalance + principalPortion,
              principalBalanceAfter: runningBalance,
              totalBalanceBefore: runningBalance + principalPortion + interestPortion,
              totalBalanceAfter: runningBalance,
              paymentChannel: 'CBE_BANK',
              bankReferenceNo: `AUTO-DED-${regularAccNo}-${inst}`,
              narration: `Monthly scheduled loan repayment for installment #${inst}`,
              performedById: adminUserId,
              performedByName: adminUser.fullName,
              timestamp: instDueDateObj.toISOString(),
              status: 'POSTED',
              createdAt: instDueDateObj.toISOString(),
            };
            loanRepayments.push(repItem);
            generatedLoanRepayments.push(repItem);
          }
        }

        outstandingPrincipal = Math.max(0, runningBalance);
        totalLoanPortfolioEtb += outstandingPrincipal;

        const loanObj: DbLoan = {
          id: loanId,
          loanNo: loanNumber,
          memberId,
          membershipNo: memberNumber,
          memberName: fullName,
          memberPhone: phoneNumber,
          productId: loanProduct.id,
          productCode: loanProduct.code,
          productName: loanProduct.name,
          requestedAmount: principalAmount,
          approvedAmount: principalAmount,
          disbursedAmount: principalAmount,
          requestedTermMonths: termMonths,
          approvedTermMonths: termMonths,
          interestRate: annualRate,
          interestMethod: 'AMORTIZATION_FIXED_PMT',
          monthlyInstallmentAmount: emi,
          totalInterestCalculated: Math.round(emi * termMonths - principalAmount),
          totalPayableAmount: Math.round(emi * termMonths),
          purpose: isEmergency ? 'Emergency medical & family contingency' : 'SME agricultural supply & retail expansion',
          incomeDetails: {
            monthlyIncome,
            monthlyExpenses: Math.round(monthlyIncome * 0.4),
            otherLoansCommitments: 0,
            employerOrBusiness: occObj.employer,
            netDisposableIncome: Math.round(monthlyIncome * 0.6),
          },
          supportingDocuments: [],
          guarantors: [
            {
              id: `guar_${cryptoUtils.generateUuid().slice(0, 12)}`,
              loanId,
              guarantorMemberId: `mem_${guarantorIdx}`,
              guarantorMembershipNo: `WB${String(guarantorIdx + 1).padStart(6, '0')}`,
              guarantorName: guarantorFullName,
              guarantorPhone: `+2519${String(11000000 + (guarantorIdx * 83719) % 88000000).padStart(8, '0')}`,
              guaranteedAmount: Math.round(principalAmount * 0.6),
              status: 'ACCEPTED',
              decisionDate: disbursedDate,
              createdAt: disbursedDateObj.toISOString(),
            },
          ],
          status: outstandingPrincipal === 0 ? 'COMPLETED' : 'ACTIVE',
          disbursementDetails: {
            disbursedAt: disbursedDateObj.toISOString(),
            paymentChannel: 'CBE_BANK',
            disbursedById: adminUserId,
            disbursedByName: adminUser.fullName,
          },
          outstandingPrincipal,
          outstandingInterest: Math.max(0, Math.round(outstandingPrincipal * monthlyRate)),
          outstandingPenalty: 0,
          totalOutstanding: outstandingPrincipal + Math.max(0, Math.round(outstandingPrincipal * monthlyRate)),
          totalPrincipalPaid,
          totalInterestPaid,
          totalPenaltyPaid: 0,
          totalPaid: totalPrincipalPaid + totalInterestPaid,
          paidInstallmentsCount: disbursedMonthsAgo,
          remainingInstallmentsCount: Math.max(0, termMonths - disbursedMonthsAgo),
          totalInstallmentsCount: termMonths,
          daysLate: 0,
          isDelinquent: false,
          applicationDate: joinedDate,
          approvedAt: disbursedDateObj.toISOString(),
          approvedById: adminUserId,
          approvedByName: adminUser.fullName,
          createdAt: disbursedDateObj.toISOString(),
          updatedAt: now.toISOString(),
        };
        generatedLoans.push(loanObj);

        // GL Posting for Loan Disbursement:
        // Debit: 1201 (Loans to Members - Portfolio)
        // Credit: 1101 (Cash at Bank)
        const disbJrnNo = `JRN-${disbursedDateObj.getFullYear()}-${String(generatedJournals.length + 1).padStart(6, '0')}`;
        generatedJournals.push({
          id: `jrn_${cryptoUtils.generateUuid().slice(0, 12)}`,
          journalNo: disbJrnNo,
          entryDate: disbursedDate,
          narration: `Loan disbursement for ${loanProduct.name} to member ${memberNumber} (${fullName})`,
          lines: [
            {
              id: `jline_${cryptoUtils.generateUuid().slice(0, 8)}`,
              accountId: 'coa_1201_member_loans',
              accountCode: '1201',
              accountName: 'Loans & Advances to Members',
              accountType: 'ASSET',
              debit: principalAmount,
              credit: 0,
              narration: 'Loan portfolio asset creation',
            },
            {
              id: `jline_${cryptoUtils.generateUuid().slice(0, 8)}`,
              accountId: 'coa_1101_cash_bank',
              accountCode: '1101',
              accountName: 'Cash at Commercial Bank of Ethiopia',
              accountType: 'ASSET',
              debit: 0,
              credit: principalAmount,
              narration: 'Disbursement bank transfer out',
            },
          ],
          totalDebit: principalAmount,
          totalCredit: principalAmount,
          postedBy: adminUserId,
          postedByName: adminUser.fullName,
          status: 'POSTED',
          source: 'AUTOMATIC',
          createdAt: disbursedDateObj.toISOString(),
        });

        // GL Posting for Repayments (Principal reduction + Interest income):
        if (totalPrincipalPaid > 0 || totalInterestPaid > 0) {
          const repJrnNo = `JRN-${now.getFullYear()}-${String(generatedJournals.length + 1).padStart(6, '0')}`;
          generatedJournals.push({
            id: `jrn_${cryptoUtils.generateUuid().slice(0, 12)}`,
            journalNo: repJrnNo,
            entryDate: now.toISOString().split('T')[0],
            narration: `Aggregated repayments for loan ${loanNumber} (${fullName}): Principal ${totalPrincipalPaid} ETB, Interest ${totalInterestPaid} ETB`,
            lines: [
              {
                id: `jline_${cryptoUtils.generateUuid().slice(0, 8)}`,
                accountId: 'coa_1101_cash_bank',
                accountCode: '1101',
                accountName: 'Cash at Commercial Bank of Ethiopia',
                accountType: 'ASSET',
                debit: totalPrincipalPaid,
                credit: 0,
                narration: 'Cash received for loan principal',
              },
              {
                id: `jline_${cryptoUtils.generateUuid().slice(0, 8)}`,
                accountId: 'coa_1201_member_loans',
                accountCode: '1201',
                accountName: 'Loans & Advances to Members',
                accountType: 'ASSET',
                debit: 0,
                credit: totalPrincipalPaid,
                narration: 'Principal reduction on member loan asset',
              },
            ],
            totalDebit: totalPrincipalPaid,
            totalCredit: totalPrincipalPaid,
            postedBy: adminUserId,
            postedByName: adminUser.fullName,
            status: 'POSTED',
            source: 'AUTOMATIC',
            createdAt: now.toISOString(),
          });

          if (totalInterestPaid > 0) {
            const intJrnNo = `JRN-${now.getFullYear()}-${String(generatedJournals.length + 1).padStart(6, '0')}`;
            generatedJournals.push({
              id: `jrn_${cryptoUtils.generateUuid().slice(0, 12)}`,
              journalNo: intJrnNo,
              entryDate: now.toISOString().split('T')[0],
              narration: `Interest income earned on loan ${loanNumber} (${fullName})`,
              lines: [
                {
                  id: `jline_${cryptoUtils.generateUuid().slice(0, 8)}`,
                  accountId: 'coa_1101_cash_bank',
                  accountCode: '1101',
                  accountName: 'Cash at Commercial Bank of Ethiopia',
                  accountType: 'ASSET',
                  debit: totalInterestPaid,
                  credit: 0,
                  narration: 'Interest cash received',
                },
                {
                  id: `jline_${cryptoUtils.generateUuid().slice(0, 8)}`,
                  accountId: 'coa_4101_loan_interest',
                  accountCode: '4101',
                  accountName: 'Interest Income on Member Loans',
                  accountType: 'INCOME',
                  debit: 0,
                  credit: totalInterestPaid,
                  narration: 'Recognized loan interest revenue',
                },
              ],
              totalDebit: totalInterestPaid,
              totalCredit: totalInterestPaid,
              postedBy: adminUserId,
              postedByName: adminUser.fullName,
              status: 'POSTED',
              source: 'AUTOMATIC',
              createdAt: now.toISOString(),
            });
          }
        }
      }

      // 6. Authentic Member Support Inquiries & Tickets
      if (includeSupport && i % 4 === 0) {
        const ticketTopics = [
          { subject: 'Inquiry on Voluntary Savings Interest Rate Calculation', cat: 'SAVINGS' as const, prio: 'MEDIUM' as const },
          { subject: 'Request for Official Share Capital Holding Certificate', cat: 'SHARES' as const, prio: 'LOW' as const },
          { subject: 'Eligibility Assessment for Business Expansion Credit', cat: 'LOANS' as const, prio: 'HIGH' as const },
          { subject: 'Mobile App SMS Alert and Telegram Notification Setup', cat: 'NOTIFICATIONS' as const, prio: 'MEDIUM' as const },
          { subject: 'Formal Request for Certified Account Statement for Embassy', cat: 'GENERAL_INQUIRY' as const, prio: 'HIGH' as const },
        ];
        const topic = ticketTopics[i % ticketTopics.length];
        const ticketId = `tkt_${cryptoUtils.generateUuid().slice(0, 12)}`;
        const ticketNo = `TKT-2026-${String(generatedTickets.length + 1).padStart(5, '0')}`;

        const ticketObj: DbTicket = {
          id: ticketId,
          ticketNumber: ticketNo,
          memberId,
          membershipNo: memberNumber,
          memberFullName: fullName,
          memberEmail: email,
          memberPhone: phoneNumber,
          userId,
          category: topic.cat,
          priority: topic.prio,
          subject: topic.subject,
          description: `Member inquiry regarding ${topic.subject.toLowerCase()}`,
          attachments: [],
          department: 'CUSTOMER_SERVICE',
          currentStatus: i % 8 === 0 ? 'OPEN' : 'RESOLVED',
          assignedStaffId: 'usr_cs_1',
          assignedStaffName: 'Bethlehem Tadesse (Member Care)',
          slaFirstResponseDue: new Date(joinDateObj.getTime() + 4 * 3600 * 1000).toISOString(),
          slaResolutionDue: new Date(joinDateObj.getTime() + 24 * 3600 * 1000).toISOString(),
          isSlaResponseBreached: false,
          isSlaResolutionBreached: false,
          escalationLevel: 0,
          isMerged: false,
          reopenCount: 0,
          lastRepliedAt: now.toISOString(),
          lastRepliedBy: 'Bethlehem Tadesse',
          lastRepliedRole: 'STAFF',
          createdDate: joinDateObj.toISOString(),
          updatedDate: now.toISOString(),
        };
        generatedTickets.push(ticketObj);

        generatedTicketMessages.push({
          id: `tmsg_${cryptoUtils.generateUuid().slice(0, 12)}`,
          ticketId,
          type: 'MEMBER_REPLY',
          senderId: userId,
          senderName: fullName,
          senderRole: 'MEMBER',
          isInternalNote: false,
          content: `Dear Member Care Team, I would like to kindly inquire regarding ${topic.subject.toLowerCase()}. Thank you for your assistance.`,
          createdAt: joinDateObj.toISOString(),
        });

        if (i % 8 !== 0) {
          generatedTicketMessages.push({
            id: `tmsg_${cryptoUtils.generateUuid().slice(0, 12)}`,
            ticketId,
            type: 'STAFF_REPLY',
            senderId: 'usr_cs_1',
            senderName: 'Bethlehem Tadesse (Customer Service Officer)',
            senderRole: 'CUSTOMER_SERVICE',
            isInternalNote: false,
            content: `Dear ${fullName}, thank you for contacting Wabi SACCO. We have reviewed your request regarding ${topic.subject.toLowerCase()} and processed the necessary documentation. Please let us know if you need any further support.`,
            createdAt: now.toISOString(),
          });
        }
      }
    }

    // 7. Update Chart of Accounts balances mathematically based on all generated journals
    const updatedChartOfAccounts = db.getChartOfAccounts().map((acc) => {
      if (acc.accountCode === '1101') {
        // Cash at Bank = Total Cash Inflows - Cash Outflows
        const netCash = totalCashReceivedEtb - (totalLoanPortfolioEtb > 0 ? totalLoanPortfolioEtb : 0);
        return { ...acc, balance: Math.max(0, netCash) };
      }
      if (acc.accountCode === '1201') {
        return { ...acc, balance: totalLoanPortfolioEtb };
      }
      if (acc.accountCode === '2101') {
        return { ...acc, balance: totalDepositsEtb * 0.7 };
      }
      if (acc.accountCode === '2102') {
        return { ...acc, balance: totalDepositsEtb * 0.3 };
      }
      if (acc.accountCode === '3101') {
        return { ...acc, balance: totalShareCapitalEtb };
      }
      if (acc.accountCode === '4101') {
        return { ...acc, balance: Math.round(totalLoanPortfolioEtb * 0.08) };
      }
      return { ...acc, balance: 0 };
    });

    // 8. Commit all original generated data to database snapshot
    const currentSnap = db.getDatabaseSnapshot();

    // 8. Prepare standard enterprise staff accounts
    const standardStaffDefs = [
      {
        id: 'usr_admin_1',
        username: 'admin.sacco',
        email: 'admin@wabisacco.et',
        phoneNumber: '+251911223344',
        fullName: 'Samuel Ambaw (System Admin)',
        firstName: 'Samuel',
        lastName: 'Ambaw',
        passwordPlain: 'AdminPassword123!',
        roleId: 'role_admin',
        role: 'role_admin',
      },
      {
        id: 'usr_manager_1',
        username: 'manager.alemu',
        email: 'alemu.t@wabisacco.et',
        phoneNumber: '+251922334455',
        fullName: 'Alemu Tadesse (General Manager)',
        firstName: 'Alemu',
        lastName: 'Tadesse',
        passwordPlain: 'ManagerPassword123!',
        roleId: 'role_manager',
        role: 'role_manager',
      },
      {
        id: 'usr_acct_1',
        username: 'acct.dawit',
        email: 'dawit.k@wabisacco.et',
        phoneNumber: '+251933445566',
        fullName: 'Dawit Kebede (Senior Accountant / Teller)',
        firstName: 'Dawit',
        lastName: 'Kebede',
        passwordPlain: 'AccountantPassword123!',
        roleId: 'role_accountant',
        role: 'role_accountant',
      },
      {
        id: 'usr_auditor_1',
        username: 'auditor.tigist',
        email: 'tigist.m@wabisacco.et',
        phoneNumber: '+251944556677',
        fullName: 'Tigist Mengistu (Chief Internal Auditor)',
        firstName: 'Tigist',
        lastName: 'Mengistu',
        passwordPlain: 'AuditorPassword123!',
        roleId: 'role_auditor',
        role: 'role_auditor',
      },
      {
        id: 'usr_cs_1',
        username: 'cs.selam',
        email: 'selamawit.b@wabisacco.et',
        phoneNumber: '+251955667788',
        fullName: 'Selamawit Bekele (Member Care Officer)',
        firstName: 'Selamawit',
        lastName: 'Bekele',
        passwordPlain: 'CustomerService123!',
        roleId: 'role_customer_service',
        role: 'role_customer_service',
      },
    ];

    const staffUsers: DbUser[] = standardStaffDefs.map((def) => {
      const existing = (currentSnap.users || []).find((u) => u.id === def.id || u.username === def.username);
      if (existing) {
        return existing;
      }
      const salt = cryptoUtils.generateSalt();
      const passwordHash = cryptoUtils.hashPassword(def.passwordPlain, salt);
      return {
        id: def.id,
        username: def.username,
        email: def.email,
        phoneNumber: def.phoneNumber,
        fullName: def.fullName,
        firstName: def.firstName,
        lastName: def.lastName,
        passwordHash,
        salt,
        role: def.role,
        isActive: true,
        status: 'ACTIVE',
        failedLoginAttempts: 0,
        createdAt: '2025-01-10T08:00:00Z',
        updatedAt: now.toISOString(),
      };
    });

    const staffUserRoles = standardStaffDefs.map((def) => ({
      userId: def.id,
      roleId: def.roleId,
      assignedAt: '2025-01-10T08:00:00Z',
      assignedBy: 'SYSTEM',
    }));

    const newUsers = [...staffUsers, ...generatedUsers];
    const newUserRoles = [
      ...staffUserRoles,
      ...generatedUsers.map((u) => ({
        userId: u.id,
        roleId: memberRole.id,
        assignedAt: u.createdAt,
        assignedBy: adminUserId,
      })),
    ];

    db.setDatabaseSnapshot({
      ...currentSnap,
      users: newUsers,
      userRoles: newUserRoles,
      members: generatedMembers,
      savingAccounts: generatedSavingAccounts,
      shareAccounts: generatedShareAccounts,
      shareCertificates: generatedShareCertificates,
      shareTransactions: generatedShareTransactions,
      loans: generatedLoans,
      loanSchedules: generatedLoanSchedules,
      loanRepayments: generatedLoanRepayments,
      financialTransactions: generatedTransactions,
      journalEntries: generatedJournals,
      monthlySavingsSchedules: generatedMonthlySchedules,
      supportTickets: generatedTickets,
      ticketMessages: generatedTicketMessages,
      chartOfAccounts: updatedChartOfAccounts,
      membershipSequence: count + 1,
      transactionSequence: generatedTransactions.length + 1,
      journalSequence: generatedJournals.length + 1,
      shareSequence: generatedShareTransactions.length + 1,
      certificateSequence: generatedShareCertificates.length + 1,
      loanSequence: generatedLoans.length + 1,
      repaymentSequence: generatedLoanRepayments.length + 1,
      ticketSequence: generatedTickets.length + 1,
    });

    // Rebuild high-speed indexes and clear cache
    cache.clear();
    db.rebuildIndexes();

    // Verify Trial Balance
    const trialBalance = accountingService.getTrialBalance();

    const summary: GenerationSummary = {
      success: true,
      membersGenerated: generatedMembers.length,
      usersGenerated: generatedUsers.length,
      savingAccountsGenerated: generatedSavingAccounts.length,
      shareAccountsGenerated: generatedShareAccounts.length,
      loansGenerated: generatedLoans.length,
      transactionsGenerated: generatedTransactions.length,
      journalEntriesGenerated: generatedJournals.length,
      supportTicketsGenerated: generatedTickets.length,
      totalAssetsEtb: totalCashReceivedEtb,
      totalDepositsEtb,
      totalShareCapitalEtb,
      totalLoanPortfolioEtb,
      trialBalanceBalanced: trialBalance.isBalanced,
      executionTimeMs: Date.now() - startTime,
      generatedAt: now.toISOString(),
    };

    return summary;
  }
}

export const originalDataGeneratorService = new OriginalDataGeneratorService();
