import React, { useState, useEffect } from 'react';
import {
  Building2,
  Sliders,
  Calendar,
  Flag,
  Hash,
  FileText,
  Bell,
  Globe,
  Palette,
  Activity,
  Download,
  Upload,
  History,
  Save,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Cpu,
  HardDrive,
  Database,
  Lock,
  Search,
  ExternalLink,
  Info,
  Server,
  Zap,
  Edit3,
  MapPin,
  Phone,
} from 'lucide-react';
import {
  adminService,
  OrganizationProfile,
  WorkingCalendar,
  FeatureFlag,
  LocalizationPack,
  NumberingSystem,
  DocumentConfig,
  BrandingTheme,
  SystemSettings,
  SystemHealthData,
  ConfigAuditLog,
  PublicHoliday,
  SpecialClosure,
  SaccoBranchLocation,
  SaccoDepositBankAccount,
} from '../../services/adminService';
import { useToast } from '../../providers/ToastProvider';
import { useAuth } from '../../providers/AuthProvider';
import { useLanguage } from '../../providers/LanguageProvider';
import { useSettings, DEFAULT_SETTINGS, DEFAULT_INSTITUTION_PROFILE } from '../../providers/SettingsProvider';
import { ThemeToggle, useTheme } from '../../providers/ThemeProvider';
import { Button } from '../../components/common/Button';
import { TextInput } from '../../components/common/TextInput';
import { TextareaInput } from '../../components/common/TextareaInput';
import { SelectInput } from '../../components/common/SelectInput';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { DevOpsPerformanceCenter } from './DevOpsPerformanceCenter';
import { ProductionDataManagementView } from './ProductionDataManagementView';
import { LegacyDataMigrationView } from './LegacyDataMigrationView';

type AdminTab =
  | 'org'
  | 'rules'
  | 'calendar'
  | 'flags'
  | 'numbering'
  | 'documents'
  | 'notifications'
  | 'localization'
  | 'branding'
  | 'health'
  | 'devops'
  | 'production_data'
  | 'legacy_migration'
  | 'import_export'
  | 'audit';

type RulesSubTab =
  | 'institution'
  | 'branches'
  | 'banks'
  | 'savings'
  | 'shares'
  | 'loans'
  | 'accounting'
  | 'security';

const DEFAULT_ORG_PROFILE: OrganizationProfile = {
  id: 'org_main_wabi',
  name: 'Wabi Savings and Credit Cooperative Society Ltd.',
  shortName: 'Wabi SACCO',
  logoUrl: '/assets/wabi-logo.png',
  address: {
    street: 'Lideta High Court Area, Helen Bldg 3rd Floor',
    city: 'Addis Ababa',
    subcity: 'Lideta Subcity',
    woreda: 'Woreda 04',
    region: 'Addis Ababa',
    postalCode: '1000',
    country: 'Ethiopia',
  },
  phones: {
    primary: '+251 978 434 141',
    secondary: '+251 927 011 111',
    hotline: '8844',
  },
  email: 'info@wabisacco.et',
  website: 'https://wabisacco.et',
  tin: '0049281729',
  businessLicense: 'ET-COOP/AA/042',
  registrationNumber: 'FED/COOP/2021/089',
  workingHours: {
    weekdays: '8:00 AM - 5:00 PM',
    saturdays: '8:30 AM - 12:30 PM',
    sundays: 'Closed',
  },
  coordinates: {
    latitude: 9.0125,
    longitude: 38.7468,
    locationName: 'Lideta Helen Building, Addis Ababa',
  },
  timeZone: 'Africa/Addis_Ababa',
  currency: 'ETB',
  language: 'en',
  fiscalYear: {
    startMonth: 7,
    endMonth: 6,
    currentYear: '2026/2027',
  },
  dateFormat: 'YYYY-MM-DD',
  numberFormat: 'STANDARD',
};

const DEFAULT_WORKING_CALENDAR: WorkingCalendar = {
  id: 'cal_wabi_standard',
  businessDays: [1, 2, 3, 4, 5],
  saturdayWorking: true,
  saturdayWorkingHours: '08:30 - 12:30',
  weekendDays: [0, 6],
  dailyWorkingHours: {
    start: '08:30',
    end: '17:30',
    lunchBreakStart: '12:30',
    lunchBreakEnd: '13:30',
  },
  holidays: [
    { id: 'hol_01', name: 'Ethiopian New Year (Enkutatash)', localName: 'እንቁጣጣሽ', date: '2026-09-11', isRecurring: true, description: 'First day of the Ethiopian calendar year (Meskerem 1)' },
    { id: 'hol_02', name: 'Finding of the True Cross (Meskel)', localName: 'መስቀል', date: '2026-09-27', isRecurring: true, description: 'Commemoration of discovery of True Cross (Meskerem 17)' },
    { id: 'hol_03', name: 'Mawlid (Birth of the Prophet Muhammad)', localName: 'መውሊድ', date: '2026-09-05', isRecurring: true, description: 'Islamic religious holiday' },
    { id: 'hol_04', name: 'Ethiopian Christmas (Genna)', localName: 'ገና', date: '2027-01-07', isRecurring: true, description: 'Orthodox Christmas celebration (Tahsas 29)' },
    { id: 'hol_05', name: 'Epiphany (Timket)', localName: 'ጥምቀት', date: '2027-01-19', isRecurring: true, description: 'Commemoration of Baptism of Jesus (Tir 11)' },
    { id: 'hol_06', name: 'Victory of Adwa Day', localName: 'የአድዋ ድል በዓል', date: '2027-03-02', isRecurring: true, description: 'Commemoration of historic victory at Battle of Adwa' },
    { id: 'hol_07', name: 'Good Friday (Siklet)', localName: 'ስቅለት', date: '2027-04-30', isRecurring: true, description: 'Orthodox Holy Christian Friday' },
    { id: 'hol_08', name: 'Ethiopian Easter (Fasika)', localName: 'ፋሲካ', date: '2027-05-02', isRecurring: true, description: 'Orthodox Resurrection Sunday' },
    { id: 'hol_09', name: 'Eid al-Fitr', localName: 'ኢድ አል-ፈጥር', date: '2027-03-31', isRecurring: true, description: 'End of Ramadan celebrations' },
    { id: 'hol_10', name: 'Patriots Victory Day', localName: 'የአርበኞች ቀን', date: '2027-05-05', isRecurring: true, description: 'Celebration of liberation in 1941 (Miyazya 27)' },
    { id: 'hol_11', name: 'Eid al-Adha (Arefa)', localName: 'አረፋ', date: '2027-06-07', isRecurring: true, description: 'Feast of Sacrifice' },
    { id: 'hol_12', name: 'Downfall of the Derg', localName: 'ግንቦት 20', date: '2027-05-28', isRecurring: true, description: 'National Day (Ginbot 20)' },
  ],
  specialClosures: [
    { id: 'cls_01', title: 'Annual General Assembly (AGM) 2026', startDate: '2026-10-24', endDate: '2026-10-24', reason: 'Official delegate attendance at Wabi SACCO Annual General Meeting', status: 'PLANNED', approvedBy: 'Board of Directors' },
    { id: 'cls_02', title: 'Fiscal Year-End Financial Audit Closeout', startDate: '2027-07-08', endDate: '2027-07-09', reason: 'Annual ledger closeout, interest postings reconciliation, and vault count', status: 'PLANNED', approvedBy: 'General Manager' },
  ],
  updatedAt: '2026-08-16T00:00:00Z',
};

const DEFAULT_FEATURE_FLAGS: FeatureFlag[] = [
  { key: 'ENABLE_TELEGRAM_NOTIFICATIONS', name: 'Telegram Bot Notifications', description: 'Real-time transaction alerts and OTP codes delivered via Telegram official bot channel', category: 'CHANNELS', isEnabled: true, requiresMfaToToggle: false, updatedAt: '2026-08-16T00:00:00Z' },
  { key: 'ENABLE_SMS_GATEWAY', name: 'Ethio Telecom SMS Gateway', description: 'Deliver SMS receipts and 2FA authentication codes via direct shortcode channel', category: 'CHANNELS', isEnabled: true, requiresMfaToToggle: true, updatedAt: '2026-08-16T00:00:00Z' },
  { key: 'ENABLE_ONLINE_MEMBER_REGISTRATION', name: 'Public Member Self-Registration', description: 'Allow prospective members to apply, submit KYC, and upload deposit slips online', category: 'CORE', isEnabled: true, requiresMfaToToggle: false, updatedAt: '2026-08-16T00:00:00Z' },
  { key: 'ENABLE_TIME_DEPOSITS', name: 'Term & Fixed Deposits Module', description: 'Enable fixed term deposit agreements with maturity certificates and auto-rollovers', category: 'CORE', isEnabled: true, requiresMfaToToggle: false, updatedAt: '2026-08-16T00:00:00Z' },
  { key: 'ENABLE_SHARE_VOLUNTARY_CONVERSION', name: 'Voluntary Savings Share Conversion', description: 'Permit members to instantly purchase additional share equity using voluntary savings balances', category: 'CORE', isEnabled: true, requiresMfaToToggle: false, updatedAt: '2026-08-16T00:00:00Z' },
  { key: 'ENABLE_MAKER_CHECKER_DUAL_CONTROL', name: 'Maker-Checker Dual Control Enforcement', description: 'Require four-eyes manager sign-off on transactions and withdrawals over threshold', category: 'SECURITY', isEnabled: true, requiresMfaToToggle: true, updatedAt: '2026-08-16T00:00:00Z' },
  { key: 'ENABLE_MEMBER_SUPPORT_LIVE_CHAT', name: 'Real-Time Member Support Chat', description: 'Interactive help desk live messaging between members and Customer Service Officers', category: 'CHANNELS', isEnabled: true, requiresMfaToToggle: false, updatedAt: '2026-08-16T00:00:00Z' },
  { key: 'ENABLE_AI_PREDICTIVE_FRAUD_ENGINE', name: 'Predictive AI Risk & Fraud Scoring', description: 'Real-time machine evaluation of transaction velocity, geolocation anomalies, and credit delinquency', category: 'INNOVATION', isEnabled: true, requiresMfaToToggle: true, updatedAt: '2026-08-16T00:00:00Z' },
  { key: 'ENABLE_BIOMETRIC_MFA_ENFORCEMENT', name: 'Mandatory Multi-Factor Authentication', description: 'Enforce TOTP / SMS OTP verification for all staff and privileged financial operations', category: 'SECURITY', isEnabled: true, requiresMfaToToggle: true, updatedAt: '2026-08-16T00:00:00Z' },
  { key: 'ENABLE_AUTOMATED_INTEREST_POSTING', name: 'Automated Scheduled Interest Runs', description: 'Execute periodic monthly and semi-annual savings interest calculations automatically', category: 'CORE', isEnabled: true, requiresMfaToToggle: true, updatedAt: '2026-08-16T00:00:00Z' },
];

const DEFAULT_NUMBERING_SYSTEM: NumberingSystem = {
  membershipId: { prefix: 'WB', sequenceLength: 6, currentNumber: 150, pattern: '{PREFIX}{SEQ:6}' },
  transactionId: { prefix: 'WBS', sequenceLength: 8, currentNumber: 110, pattern: '{PREFIX}-{YYYY}-{SEQ:8}' },
  journalNumber: { prefix: 'JNL', sequenceLength: 6, currentNumber: 110, pattern: '{PREFIX}-{YYYY}-{SEQ:6}' },
  voucherNumber: { prefix: 'VCH', sequenceLength: 6, currentNumber: 50, pattern: '{PREFIX}-{YYYY}-{SEQ:6}' },
  loanNumber: { prefix: 'LN', sequenceLength: 6, currentNumber: 45, pattern: '{PREFIX}-{YYYY}-{SEQ:6}' },
  ticketNumber: { prefix: 'TKT', sequenceLength: 5, currentNumber: 25, pattern: '{PREFIX}-{YYYY}-{SEQ:5}' },
  receiptNumber: { prefix: 'RCP', sequenceLength: 6, currentNumber: 90, pattern: '{PREFIX}-{YYYY}-{SEQ:6}' },
  shareCertificateNumber: { prefix: 'CERT-WB', sequenceLength: 4, currentNumber: 150, pattern: '{PREFIX}-{YYYY}-{SEQ:4}' },
  updatedAt: '2026-08-16T00:00:00Z',
};

const DEFAULT_DOCUMENT_CONFIG: DocumentConfig = {
  maxUploadSizeMb: 15,
  allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xlsx'],
  imageCompressionQuality: 85,
  maxImageDimensionPx: 2048,
  retentionYears: {
    memberKyc: 10,
    loanDocuments: 10,
    financialReceipts: 7,
    auditTrail: 5,
    systemLogs: 3,
  },
  storageProvider: 'LOCAL',
  updatedAt: '2026-08-16T00:00:00Z',
};

const DEFAULT_BRANDING_THEME: BrandingTheme = {
  themeMode: 'LIGHT',
  primaryColor: '#2563eb',
  secondaryColor: '#0d9488',
  accentColor: '#f59e0b',
  logoUrl: '/assets/wabi-logo.png',
  faviconUrl: '/assets/wabi-logo.png',
  loginBackgroundUrl: '',
  displayFont: 'Plus Jakarta Sans',
  bodyFont: 'Inter',
  borderRadiusPx: 8,
  updatedAt: '2026-08-16T00:00:00Z',
};

const DEFAULT_LOCALIZATION_PACKS: LocalizationPack[] = [
  {
    languageCode: 'en',
    languageName: 'English',
    nativeName: 'English (US)',
    isDefault: true,
    isRtl: false,
    totalKeys: 42,
    translations: {
      'app.title': 'Wabi SACCO Management System',
      'app.tagline': 'Enterprise Financial Cooperatives Platform',
      'nav.dashboard': 'Dashboard',
      'nav.members': 'Member Master',
      'nav.savings': 'Savings Accounts',
      'nav.shares': 'Share Capital',
      'nav.loans': 'Loan Portfolio',
      'nav.accounting': 'Chart of Accounts & GL',
      'nav.reports': 'Central Reports Hub',
      'nav.settings': 'Administration & System Configuration',
      'common.save': 'Save Changes',
      'common.cancel': 'Cancel',
      'common.edit': 'Edit',
      'common.delete': 'Delete',
      'common.search': 'Search records...',
      'common.status': 'Status',
      'common.actions': 'Actions',
      'common.active': 'Active',
      'common.pending': 'Pending',
      'common.approved': 'Approved',
      'common.rejected': 'Rejected',
    },
    updatedAt: '2026-08-16T00:00:00Z',
  },
  {
    languageCode: 'am',
    languageName: 'Amharic',
    nativeName: 'አማርኛ',
    isDefault: false,
    isRtl: false,
    totalKeys: 42,
    translations: {
      'app.title': 'ዋቢ የቁጠባና ብድር ኅብረት ሥራ ማኔጅመንት ሲስተም',
      'app.tagline': 'የላቀ የገንዘብ ተቋማት ፕላትፎርም',
      'nav.dashboard': 'ዳሽቦርድ',
      'nav.members': 'የአባላት መዝገብ',
      'nav.savings': 'የቁጠባ ሂሳቦች',
      'nav.shares': 'የአክሲዮን ካፒታል',
      'nav.loans': 'የብድር አገልግሎት',
      'nav.accounting': 'የሂሳብ መደቦችና አጠቃላይ ሌጀር',
      'nav.reports': 'የሪፖርቶች ማዕከል',
      'nav.settings': 'የአስተዳደርና ሲስተም ቅንብሮች',
      'common.save': 'ለውጦችን መዝግብ',
      'common.cancel': 'ሰርዝ',
      'common.edit': 'አስተካክል',
      'common.delete': 'አስወግድ',
      'common.search': 'መዝገቦችን ፈልግ...',
      'common.status': 'ሁኔታ',
      'common.actions': 'ተግባራት',
      'common.active': 'ንቁ',
      'common.pending': 'በመጠባበቅ ላይ',
      'common.approved': 'የጸደቀ',
      'common.rejected': 'ውድቅ የተደረገ',
    },
    updatedAt: '2026-08-16T00:00:00Z',
  },
  {
    languageCode: 'om',
    languageName: 'Afaan Oromoo',
    nativeName: 'Afaan Oromoo',
    isDefault: false,
    isRtl: false,
    totalKeys: 42,
    translations: {
      'app.title': 'Sirna Bulchiinsa Waldaa Qusannaa fi Liqaa Waabii',
      'app.tagline': 'Dhaabbata Faayinaansii Gamtaa Sadarkaa Ol’aanaa',
      'nav.dashboard': 'Gabaasa Waliigalaa',
      'nav.members': 'Galmee Miseensotaa',
      'nav.savings': 'Herreega Qusannaa',
      'nav.shares': 'Kaappitaala Aksiyoonaa',
      'nav.loans': 'Tajaajila Liqaa',
      'nav.accounting': 'Akkaawuntii fi Leejara Waliigalaa',
      'nav.reports': 'Giddugala Gabaasaa',
      'nav.settings': 'Bulchiinsaa fi Qindaa’ina Sirnichaa',
      'common.save': 'Jijjiirama Galmeessi',
      'common.cancel': 'Dhiisi',
      'common.edit': 'Gulaali',
      'common.delete': 'Haqi',
      'common.search': 'Galmee barbaadi...',
      'common.status': 'Haala',
      'common.actions': 'Tarkaanfiiwwan',
      'common.active': 'Hojirra kan jiru',
      'common.pending': 'Eeggachaa kan jiru',
      'common.approved': 'Kan mirkanaa’e',
      'common.rejected': 'Kufaa kan ta’e',
    },
    updatedAt: '2026-08-16T00:00:00Z',
  },
];

const DEFAULT_HEALTH_DATA: SystemHealthData = {
  server: {
    status: 'OPERATIONAL',
    uptimeSeconds: 86400,
    nodeVersion: 'v20.18.0',
    platform: 'Linux / Vercel Edge Serverless',
    hostname: 'wabi-sacco-core-01',
    timeZone: 'Africa/Addis_Ababa',
    currentTime: new Date().toISOString(),
  },
  resources: {
    cpuCount: 8,
    cpuModel: 'Intel Core Enterprise vCPU',
    cpuLoadAverage: [0.12, 0.08, 0.05],
    memoryUsageMb: 245,
    memoryTotalMb: 1024,
    memoryPercent: 24,
    processMemoryMb: 85,
  },
  database: {
    engine: 'Wabi SACCO ACID JSON Engine v2.4',
    schemaVersion: '2026.08.20',
    totalCollections: 24,
    recordCounts: {
      members: 150,
      activeMembers: 142,
      savingsAccounts: 185,
      loans: 45,
      activeLoans: 38,
      transactions: 2450,
      journals: 110,
    },
    lastSnapshotSync: new Date().toISOString(),
    status: 'HEALTHY',
  },
  services: [
    { name: 'Core Banking Engine', status: 'ONLINE', latencyMs: 2.1 },
    { name: 'Accounting & GL Tier-5', status: 'ONLINE', latencyMs: 3.4 },
    { name: 'Ethio Telecom SMS Gateway', status: 'ONLINE', latencyMs: 18.2 },
    { name: 'Telegram Bot Verification Webhook', status: 'ONLINE', latencyMs: 14.5 },
    { name: 'AI Predictive Fraud & Credit Scorer', status: 'ONLINE', latencyMs: 4.8 },
  ],
  alertsSummary: {
    openSecurityAlerts: 0,
    systemErrorsLast24h: 0,
  },
};

export const EnterpriseSettingsView: React.FC = () => {
  const { user } = useAuth();
  const { refreshSettings } = useSettings();
  const { success, error, warning, info } = useToast();
  const showToast = (msg: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    if (type === 'success') success(msg);
    else if (type === 'error') error(msg);
    else if (type === 'warning') warning(msg);
    else info(msg);
  };
  const [activeTab, setActiveTab] = useState<AdminTab>('rules');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Core Data States with solid defaults
  const [orgProfile, setOrgProfile] = useState<OrganizationProfile>(DEFAULT_ORG_PROFILE);
  const [workingCalendar, setWorkingCalendar] = useState<WorkingCalendar>(DEFAULT_WORKING_CALENDAR);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>(DEFAULT_FEATURE_FLAGS);
  const [localizationPacks, setLocalizationPacks] = useState<LocalizationPack[]>(DEFAULT_LOCALIZATION_PACKS);
  const [numberingSystem, setNumberingSystem] = useState<NumberingSystem>(DEFAULT_NUMBERING_SYSTEM);
  const [nextNumbersPreview, setNextNumbersPreview] = useState<Record<string, string>>({
    membershipId: 'WB000151',
    transactionId: 'WBS-2026-00000111',
    journalNumber: 'JNL-2026-000111',
    voucherNumber: 'VCH-2026-000051',
    loanNumber: 'LN-2026-000046',
    ticketNumber: 'TKT-2026-00026',
    receiptNumber: 'RCP-2026-000091',
    shareCertificateNumber: 'CERT-WB-2026-0151',
  });
  const [documentConfig, setDocumentConfig] = useState<DocumentConfig>(DEFAULT_DOCUMENT_CONFIG);
  const [brandingTheme, setBrandingTheme] = useState<BrandingTheme>(DEFAULT_BRANDING_THEME);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [healthData, setHealthData] = useState<SystemHealthData | null>(DEFAULT_HEALTH_DATA);
  const [auditLogs, setAuditLogs] = useState<ConfigAuditLog[]>([]);

  // Sub-tab states
  const [rulesSubTab, setRulesSubTab] = useState<RulesSubTab>('institution');
  const [selectedLanguageCode, setSelectedLanguageCode] = useState('en');
  const [langSearch, setLangSearch] = useState('');
  const [auditFilterCategory, setAuditFilterCategory] = useState('ALL');

  // Branch & Bank Account Modals
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<SaccoBranchLocation | null>(null);
  const [newBranch, setNewBranch] = useState<Omit<SaccoBranchLocation, 'id'>>({
    name: '',
    nameAmharic: '',
    address: '',
    addressAmharic: '',
    phone: '',
    isMainBranch: false,
  });

  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [newBank, setNewBank] = useState<Omit<SaccoDepositBankAccount, 'id'>>({
    bankName: '',
    accountName: '',
    accountNumber: '',
    branch: '',
    isDefault: false,
  });

  // Modals & Dialogs
  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [pendingSaveAction, setPendingSaveAction] = useState<((reason: string) => Promise<void>) | null>(null);
  const [changeReason, setChangeReason] = useState('');

  // Add Holiday Modal
  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ name: '', localName: '', date: '', isRecurring: true, description: '' });

  // Add Closure Modal
  const [closureModalOpen, setClosureModalOpen] = useState(false);
  const [newClosure, setNewClosure] = useState({ title: '', startDate: '', endDate: '', reason: '', status: 'PLANNED' as const });

  // Import Data State
  const [importEntity, setImportEntity] = useState('members');
  const [importJsonText, setImportJsonText] = useState('');
  const [importPreviewResult, setImportPreviewResult] = useState<any>(null);

  // Translation Edit Modal
  const [editTransModalOpen, setEditTransModalOpen] = useState(false);
  const [editingTransKey, setEditingTransKey] = useState('');
  const [editingTransValue, setEditingTransValue] = useState('');

  // Initial Load with resilient Promise.allSettled
  const fetchAllData = async () => {
    try {
      const results = await Promise.allSettled([
        adminService.getOrganizationProfile(),
        adminService.getWorkingCalendar(),
        adminService.getFeatureFlags(),
        adminService.getLocalizationPacks(),
        adminService.getNumberingSystem(),
        adminService.previewNextNumbers(),
        adminService.getDocumentConfig(),
        adminService.getBrandingTheme(),
        adminService.getSystemSettings(),
        adminService.getSystemHealth(),
        adminService.getConfigAuditLogs(),
      ]);

      const [
        orgRes,
        calRes,
        flagsRes,
        locRes,
        numRes,
        numPrevRes,
        docRes,
        brandRes,
        settingsRes,
        healthRes,
        auditRes,
      ] = results;

      if (orgRes.status === 'fulfilled' && orgRes.value?.success && orgRes.value.data) setOrgProfile(orgRes.value.data);
      if (calRes.status === 'fulfilled' && calRes.value?.success && calRes.value.data) setWorkingCalendar(calRes.value.data);
      if (flagsRes.status === 'fulfilled' && flagsRes.value?.success && flagsRes.value.data) setFeatureFlags(flagsRes.value.data);
      if (locRes.status === 'fulfilled' && locRes.value?.success && locRes.value.data) setLocalizationPacks(locRes.value.data);
      if (numRes.status === 'fulfilled' && numRes.value?.success && numRes.value.data) setNumberingSystem(numRes.value.data);
      if (numPrevRes.status === 'fulfilled' && numPrevRes.value?.success && numPrevRes.value.data) setNextNumbersPreview(numPrevRes.value.data);
      if (docRes.status === 'fulfilled' && docRes.value?.success && docRes.value.data) setDocumentConfig(docRes.value.data);
      if (brandRes.status === 'fulfilled' && brandRes.value?.success && brandRes.value.data) setBrandingTheme(brandRes.value.data);
      if (settingsRes.status === 'fulfilled' && settingsRes.value?.success && settingsRes.value.data) setSystemSettings(settingsRes.value.data);
      if (healthRes.status === 'fulfilled' && healthRes.value?.success && healthRes.value.data) setHealthData(healthRes.value.data);
      if (auditRes.status === 'fulfilled' && auditRes.value?.success && auditRes.value.data) setAuditLogs(auditRes.value.data);
    } catch {
      // Retain fallback defaults
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Request Save with Change Reason Modal
  const triggerSaveWithReason = (action: (reason: string) => Promise<void>) => {
    setPendingSaveAction(() => action);
    setChangeReason('');
    setReasonModalOpen(true);
  };

  const handleConfirmSaveReason = async () => {
    if (!pendingSaveAction) return;
    const reasonToUse = changeReason.trim() || 'Administrative parameter update by System Administrator';
    setIsSaving(true);
    setReasonModalOpen(false);
    try {
      await pendingSaveAction(reasonToUse);
      showToast('Configuration updated successfully', 'success');
      // Refresh audit logs
      const auditRes = await adminService.getConfigAuditLogs();
      if (auditRes?.success && auditRes.data) setAuditLogs(auditRes.data);
    } catch (err: any) {
      showToast(err.message || err.error?.message || 'Failed to apply configuration', 'error');
    } finally {
      setIsSaving(false);
      setPendingSaveAction(null);
    }
  };

  // 1. Organization Profile Save
  const handleSaveOrgProfile = () => {
    if (!orgProfile) return;
    triggerSaveWithReason(async (reason) => {
      const res = await adminService.updateOrganizationProfile(orgProfile, reason);
      if (res.success) {
        setOrgProfile(res.data);
        await refreshSettings();
        showToast('Organization legal profile updated successfully', 'success');
      }
    });
  };

  // 2. Business Rules Save
  const handleSaveBusinessRules = () => {
    if (!systemSettings) return;
    triggerSaveWithReason(async (reason) => {
      const res = await adminService.updateSystemSettingsSection(rulesSubTab, systemSettings, reason);
      if (res.success) {
        setSystemSettings(res.data);
        await refreshSettings();
        showToast(`${rulesSubTab.toUpperCase()} configuration parameters updated in real-time`, 'success');
      }
    });
  };

  // 3. Working Calendar Save
  const handleSaveWorkingCalendar = () => {
    if (!workingCalendar) return;
    triggerSaveWithReason(async (reason) => {
      const res = await adminService.updateWorkingCalendar(workingCalendar, reason);
      if (res.success) {
        setWorkingCalendar(res.data);
        showToast('Working calendar updated successfully', 'success');
      }
    });
  };

  // 4. Feature Flag Toggle
  const handleToggleFeatureFlag = async (key: string, currentState: boolean) => {
    try {
      const res = await adminService.toggleFeatureFlag(key, !currentState);
      if (res.success) {
        setFeatureFlags((prev) => prev.map((f) => (f.key === key ? res.data : f)));
        showToast(res.message, 'success');
        const auditRes = await adminService.getConfigAuditLogs();
        if (auditRes.success) setAuditLogs(auditRes.data);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle flag', 'error');
    }
  };

  // 5. Numbering System Save
  const handleSaveNumbering = () => {
    if (!numberingSystem) return;
    triggerSaveWithReason(async () => {
      const res = await adminService.updateNumberingSystem(numberingSystem);
      if (res.success) {
        setNumberingSystem(res.data);
        const prevRes = await adminService.previewNextNumbers();
        if (prevRes.success) setNextNumbersPreview(prevRes.data);
        showToast('ID sequences and numbering rules updated', 'success');
      }
    });
  };

  // 6. Document Config Save
  const handleSaveDocumentConfig = () => {
    if (!documentConfig) return;
    triggerSaveWithReason(async () => {
      const res = await adminService.updateDocumentConfig(documentConfig);
      if (res.success) {
        setDocumentConfig(res.data);
        showToast('Document rules updated successfully', 'success');
      }
    });
  };

  // 7. Branding Save
  const handleSaveBranding = () => {
    if (!brandingTheme) return;
    triggerSaveWithReason(async () => {
      const res = await adminService.updateBrandingTheme(brandingTheme);
      if (res.success) {
        setBrandingTheme(res.data);
        showToast('Branding and theme customized successfully', 'success');
      }
    });
  };

  // 8. Holidays Add/Delete
  const handleAddHoliday = async () => {
    if (!newHoliday.name || !newHoliday.date) {
      showToast('Name and date are required', 'warning');
      return;
    }
    try {
      const res = await adminService.addPublicHoliday(newHoliday);
      if (res.success) {
        showToast('Holiday added', 'success');
        setHolidayModalOpen(false);
        setNewHoliday({ name: '', localName: '', date: '', isRecurring: true, description: '' });
        const calRes = await adminService.getWorkingCalendar();
        if (calRes.success) setWorkingCalendar(calRes.data);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to add holiday', 'error');
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      const res = await adminService.deletePublicHoliday(id);
      if (res.success) {
        showToast('Holiday removed', 'success');
        const calRes = await adminService.getWorkingCalendar();
        if (calRes.success) setWorkingCalendar(calRes.data);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to remove holiday', 'error');
    }
  };

  // 9. Special Closure Add/Delete
  const handleAddClosure = async () => {
    if (!newClosure.title || !newClosure.startDate || !newClosure.endDate) {
      showToast('Title, start date, and end date are required', 'warning');
      return;
    }
    try {
      const res = await adminService.addSpecialClosure({
        ...newClosure,
        approvedBy: user ? user.fullName || user.username : 'General Manager',
      });
      if (res.success) {
        showToast('Special closure recorded', 'success');
        setClosureModalOpen(false);
        setNewClosure({ title: '', startDate: '', endDate: '', reason: '', status: 'PLANNED' });
        const calRes = await adminService.getWorkingCalendar();
        if (calRes.success) setWorkingCalendar(calRes.data);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to add closure', 'error');
    }
  };

  const handleDeleteClosure = async (id: string) => {
    try {
      const res = await adminService.deleteSpecialClosure(id);
      if (res.success) {
        showToast('Closure deleted', 'success');
        const calRes = await adminService.getWorkingCalendar();
        if (calRes.success) setWorkingCalendar(calRes.data);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to remove closure', 'error');
    }
  };

  // 10. Localization Key Edit
  const handleSaveTranslationKey = async () => {
    const currentPack = localizationPacks.find((p) => p.languageCode === selectedLanguageCode);
    if (!currentPack) return;

    try {
      const updatedTranslations = {
        ...currentPack.translations,
        [editingTransKey]: editingTransValue,
      };
      const res = await adminService.updateLocalizationPack(selectedLanguageCode, updatedTranslations);
      if (res.success) {
        setLocalizationPacks((prev) =>
          prev.map((p) => (p.languageCode === selectedLanguageCode ? res.data : p))
        );
        showToast(`Translation updated for ${editingTransKey}`, 'success');
        setEditTransModalOpen(false);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update translation', 'error');
    }
  };

  // Branch Management Handlers
  const handleSaveBranch = () => {
    if (!newBranch.name || !newBranch.address) {
      showToast('Branch name and address are required', 'warning');
      return;
    }
    if (!systemSettings) return;
    const currentProfile = systemSettings.institutionProfile || {
      name: 'Wabi SACCO',
      amharicName: 'ዋቢ የገንዘብ ቁጠባና ብድር ኅብረት ሥራ ማህበር',
      legalName: 'Wabi Savings and Credit Cooperative Society Ltd.',
      legalNameAmharic: 'የዋቢ የገንዘብ ቁጠባና ብድር ኅብረት ሥራ ማህበር ኃ/የተ/የግ/ማ',
      licenseNumber: 'ET-COOP/AA/042',
      slogan: 'Ethical Wealth Growth & Modern Cooperative Finance for Ethiopia',
      amharicSlogan: 'ፍትሐዊ የሀብት ዕድገትና ዘመናዊ የኅብረት ሥራ ፋይናንስ ለኢትዮጵያ',
      email: 'info@wabisacco.et',
      hotline1: '+251 978 434 141',
      hotline2: '+251 927 011 111',
      supportTelegram: '@wabbisaccobot',
      headOfficeAddress: 'Helen Bldg 3rd Floor, in front of Lideta High Court, Addis Ababa, Ethiopia',
      headOfficeAddressAmharic: 'ልደታ ከፍተኛ ፍርድ ቤት ፊት ለፊት፣ ሄለን ህንፃ 3ኛ ፎቅ፣ አዲስ አበባ፣ ኢትዮጵያ',
      registrationFee: 1000,
      branchLocations: [],
      bankAccounts: [],
    };

    let updatedBranches: SaccoBranchLocation[];
    if (editingBranch) {
      updatedBranches = (currentProfile.branchLocations || []).map((b) =>
        b.id === editingBranch.id ? { ...newBranch, id: editingBranch.id } : b
      );
    } else {
      updatedBranches = [
        ...(currentProfile.branchLocations || []),
        { ...newBranch, id: 'branch_' + Date.now() },
      ];
    }

    setSystemSettings({
      ...systemSettings,
      institutionProfile: {
        ...currentProfile,
        branchLocations: updatedBranches,
      },
    });
    setBranchModalOpen(false);
    setEditingBranch(null);
    setNewBranch({
      name: '',
      nameAmharic: '',
      address: '',
      addressAmharic: '',
      phone: '',
      isMainBranch: false,
    });
    showToast('Branch location updated. Click "Save Branches" to persist changes.', 'info');
  };

  const handleDeleteBranch = (id: string) => {
    if (!systemSettings?.institutionProfile) return;
    const updatedBranches = systemSettings.institutionProfile.branchLocations.filter((b) => b.id !== id);
    setSystemSettings({
      ...systemSettings,
      institutionProfile: {
        ...systemSettings.institutionProfile,
        branchLocations: updatedBranches,
      },
    });
    showToast('Branch removed. Click "Save Branches" to persist changes.', 'info');
  };

  // Bank Account Handlers
  const handleSaveBank = () => {
    if (!newBank.bankName || !newBank.accountNumber) {
      showToast('Bank name and account number are required', 'warning');
      return;
    }
    if (!systemSettings) return;
    const currentProfile = systemSettings.institutionProfile || {
      name: 'Wabi SACCO',
      amharicName: 'ዋቢ የገንዘብ ቁጠባና ብድር ኅብረት ሥራ ማህበር',
      legalName: 'Wabi Savings and Credit Cooperative Society Ltd.',
      legalNameAmharic: 'የዋቢ የገንዘብ ቁጠባና ብድር ኅብረት ሥራ ማህበር ኃ/የተ/የግ/ማ',
      licenseNumber: 'ET-COOP/AA/042',
      slogan: 'Ethical Wealth Growth & Modern Cooperative Finance for Ethiopia',
      amharicSlogan: 'ፍትሐዊ የሀብት ዕድገትና ዘመናዊ የኅብረት ሥራ ፋይናንስ ለኢትዮጵያ',
      email: 'info@wabisacco.et',
      hotline1: '+251 978 434 141',
      hotline2: '+251 927 011 111',
      supportTelegram: '@wabbisaccobot',
      headOfficeAddress: 'Helen Bldg 3rd Floor, in front of Lideta High Court, Addis Ababa, Ethiopia',
      headOfficeAddressAmharic: 'ልደታ ከፍተኛ ፍርድ ቤት ፊት ለፊት፣ ሄለን ህንፃ 3ኛ ፎቅ፣ አዲስ አበባ፣ ኢትዮጵያ',
      registrationFee: 1000,
      branchLocations: [],
      bankAccounts: [],
    };

    const updatedBanks = [
      ...(currentProfile.bankAccounts || []),
      { ...newBank, id: 'bank_' + Date.now() },
    ];

    setSystemSettings({
      ...systemSettings,
      institutionProfile: {
        ...currentProfile,
        bankAccounts: updatedBanks,
      },
    });
    setBankModalOpen(false);
    setNewBank({
      bankName: '',
      accountName: '',
      accountNumber: '',
      branch: '',
      isDefault: false,
    });
    showToast('Deposit bank account added. Click "Save Banks" to persist changes.', 'info');
  };

  const handleDeleteBank = (id: string) => {
    if (!systemSettings?.institutionProfile) return;
    const updatedBanks = systemSettings.institutionProfile.bankAccounts.filter((b) => b.id !== id);
    setSystemSettings({
      ...systemSettings,
      institutionProfile: {
        ...systemSettings.institutionProfile,
        bankAccounts: updatedBanks,
      },
    });
    showToast('Bank account removed. Click "Save Banks" to persist changes.', 'info');
  };

  const handleToggleDefaultBank = (id: string) => {
    if (!systemSettings?.institutionProfile) return;
    const updatedBanks = systemSettings.institutionProfile.bankAccounts.map((b) => ({
      ...b,
      isDefault: b.id === id,
    }));
    setSystemSettings({
      ...systemSettings,
      institutionProfile: {
        ...systemSettings.institutionProfile,
        bankAccounts: updatedBanks,
      },
    });
    showToast('Default bank account set. Click "Save Banks" to persist changes.', 'info');
  };

  // 11. Data Import Preview / Commit
  const handlePreviewImport = async () => {
    if (!importJsonText.trim()) {
      showToast('Please enter or paste JSON records', 'warning');
      return;
    }
    try {
      const records = JSON.parse(importJsonText);
      if (!Array.isArray(records)) {
        showToast('JSON payload must be an array of records', 'error');
        return;
      }
      const res = await adminService.importData(importEntity, records, 'PREVIEW');
      if (res.success) {
        setImportPreviewResult(res.data);
        showToast('Validation successful. Ready for ingestion.', 'success');
      }
    } catch (err: any) {
      showToast(`Invalid JSON or schema error: ${err.message}`, 'error');
    }
  };

  const handleCommitImport = async () => {
    if (!importPreviewResult) return;
    try {
      const records = JSON.parse(importJsonText);
      const res = await adminService.importData(importEntity, records, 'COMMIT');
      if (res.success) {
        showToast(res.message, 'success');
        setImportJsonText('');
        setImportPreviewResult(null);
        const auditRes = await adminService.getConfigAuditLogs();
        if (auditRes.success) setAuditLogs(auditRes.data);
      }
    } catch (err: any) {
      showToast(err.message || 'Import commit failed', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-slate-500 font-medium animate-pulse">
          Loading Enterprise Administration Engine...
        </p>
      </div>
    );
  }

  const tabsList: { id: AdminTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'org', label: 'Organization Profile', icon: <Building2 className="w-4 h-4" /> },
    { id: 'rules', label: 'Business Policies', icon: <Sliders className="w-4 h-4" /> },
    { id: 'calendar', label: 'Working Calendar', icon: <Calendar className="w-4 h-4" /> },
    { id: 'flags', label: 'Feature Flags', icon: <Flag className="w-4 h-4" />, badge: `${featureFlags.filter((f) => f.isEnabled).length}/${featureFlags.length}` },
    { id: 'numbering', label: 'ID Sequences', icon: <Hash className="w-4 h-4" /> },
    { id: 'documents', label: 'Document Rules', icon: <FileText className="w-4 h-4" /> },
    { id: 'notifications', label: 'Gateways & SMS', icon: <Bell className="w-4 h-4" /> },
    { id: 'localization', label: 'Languages', icon: <Globe className="w-4 h-4" /> },
    { id: 'branding', label: 'Branding & Theme', icon: <Palette className="w-4 h-4" /> },
    { id: 'health', label: 'System Health', icon: <Activity className="w-4 h-4" />, badge: 'ONLINE' },
    { id: 'devops', label: 'DevOps & Performance', icon: <Zap className="w-4 h-4 text-orange-500" />, badge: 'P21' },
    { id: 'production_data', label: 'Production Cleanup', icon: <Database className="w-4 h-4 text-emerald-600" />, badge: 'P24' },
    { id: 'legacy_migration', label: 'Legacy Data Migration', icon: <FileSpreadsheet className="w-4 h-4 text-emerald-700" />, badge: 'P25' },
    { id: 'import_export', label: 'Data Hub', icon: <Download className="w-4 h-4" /> },
    { id: 'audit', label: 'Config Audit', icon: <History className="w-4 h-4" />, badge: `${auditLogs.length}` },
  ];

  const currentPack = localizationPacks.find((p) => p.languageCode === selectedLanguageCode);
  const filteredTranslations = currentPack
    ? Object.entries(currentPack.translations).filter(
        ([k, v]) =>
          k.toLowerCase().includes(langSearch.toLowerCase()) ||
          String(v).toLowerCase().includes(langSearch.toLowerCase())
      )
    : [];

  const filteredAuditLogs =
    auditFilterCategory === 'ALL'
      ? auditLogs
      : auditLogs.filter((l) => l.category === auditFilterCategory);

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Enterprise Administration & System Configuration
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Centralized institutional parameters, regulatory policies, financial multipliers, and infrastructure telemetry.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAllData}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh State
          </Button>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Dual-Control Enforced</span>
          </div>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/80 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {tabsList.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap select-none ${
                isActive
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* 1. ORGANIZATION PROFILE TAB */}
      {/* ========================================================= */}
      {activeTab === 'org' && orgProfile && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Cooperative Legal Profile & Headquarters</h2>
              <p className="text-xs text-slate-500">
                Official institutional identity registered with the Federal Cooperative Commission of Ethiopia.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
              onClick={handleSaveOrgProfile}
            >
              Save Profile Changes
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <TextInput
              label="Full Legal Institution Name"
              value={orgProfile.name}
              onChange={(e) => setOrgProfile({ ...orgProfile, name: e.target.value })}
              required
            />
            <TextInput
              label="Short Name / Acronym"
              value={orgProfile.shortName}
              onChange={(e) => setOrgProfile({ ...orgProfile, shortName: e.target.value })}
              required
            />
            <TextInput
              label="Brand Logo URL / Asset"
              value={orgProfile.logoUrl}
              onChange={(e) => setOrgProfile({ ...orgProfile, logoUrl: e.target.value })}
            />

            <TextInput
              label="Tax Identification Number (TIN)"
              value={orgProfile.tin}
              onChange={(e) => setOrgProfile({ ...orgProfile, tin: e.target.value })}
              required
            />
            <TextInput
              label="Business License Number"
              value={orgProfile.businessLicense}
              onChange={(e) => setOrgProfile({ ...orgProfile, businessLicense: e.target.value })}
              required
            />
            <TextInput
              label="Federal Registration Number"
              value={orgProfile.registrationNumber}
              onChange={(e) => setOrgProfile({ ...orgProfile, registrationNumber: e.target.value })}
              required
            />
          </div>

          {/* Physical Address Section */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              Registered Physical Address
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <TextInput
                label="Street Address / Building"
                value={orgProfile.address.street}
                onChange={(e) =>
                  setOrgProfile({
                    ...orgProfile,
                    address: { ...orgProfile.address, street: e.target.value },
                  })
                }
              />
              <TextInput
                label="Subcity / Kifle Ketema"
                value={orgProfile.address.subcity}
                onChange={(e) =>
                  setOrgProfile({
                    ...orgProfile,
                    address: { ...orgProfile.address, subcity: e.target.value },
                  })
                }
              />
              <TextInput
                label="Woreda"
                value={orgProfile.address.woreda}
                onChange={(e) =>
                  setOrgProfile({
                    ...orgProfile,
                    address: { ...orgProfile.address, woreda: e.target.value },
                  })
                }
              />
              <TextInput
                label="City"
                value={orgProfile.address.city}
                onChange={(e) =>
                  setOrgProfile({
                    ...orgProfile,
                    address: { ...orgProfile.address, city: e.target.value },
                  })
                }
              />
              <TextInput
                label="Region / State"
                value={orgProfile.address.region}
                onChange={(e) =>
                  setOrgProfile({
                    ...orgProfile,
                    address: { ...orgProfile.address, region: e.target.value },
                  })
                }
              />
              <TextInput
                label="Postal Code (P.O. Box)"
                value={orgProfile.address.postalCode}
                onChange={(e) =>
                  setOrgProfile({
                    ...orgProfile,
                    address: { ...orgProfile.address, postalCode: e.target.value },
                  })
                }
              />
            </div>
          </div>

          {/* Contact & Hours */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              Official Communications & Working Hours
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <TextInput
                label="Primary Phone"
                value={orgProfile.phones.primary}
                onChange={(e) =>
                  setOrgProfile({
                    ...orgProfile,
                    phones: { ...orgProfile.phones, primary: e.target.value },
                  })
                }
              />
              <TextInput
                label="Secondary Phone"
                value={orgProfile.phones.secondary || ''}
                onChange={(e) =>
                  setOrgProfile({
                    ...orgProfile,
                    phones: { ...orgProfile.phones, secondary: e.target.value },
                  })
                }
              />
              <TextInput
                label="Emergency Hotline / Shortcode"
                value={orgProfile.phones.hotline || ''}
                onChange={(e) =>
                  setOrgProfile({
                    ...orgProfile,
                    phones: { ...orgProfile.phones, hotline: e.target.value },
                  })
                }
              />
              <TextInput
                label="Official Email"
                value={orgProfile.email}
                onChange={(e) => setOrgProfile({ ...orgProfile, email: e.target.value })}
              />
              <TextInput
                label="Official Website"
                value={orgProfile.website}
                onChange={(e) => setOrgProfile({ ...orgProfile, website: e.target.value })}
              />
              <TextInput
                label="Weekday Operating Hours"
                value={orgProfile.workingHours.weekdays}
                onChange={(e) =>
                  setOrgProfile({
                    ...orgProfile,
                    workingHours: { ...orgProfile.workingHours, weekdays: e.target.value },
                  })
                }
              />
            </div>
          </div>

          {/* Financial Fiscal Year & Locales */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              Fiscal Year & Localization Defaults
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <TextInput
                label="Current Fiscal Cycle Label"
                value={orgProfile.fiscalYear.currentYear}
                onChange={(e) =>
                  setOrgProfile({
                    ...orgProfile,
                    fiscalYear: { ...orgProfile.fiscalYear, currentYear: e.target.value },
                  })
                }
              />
              <SelectInput
                label="Base Currency"
                value={orgProfile.currency}
                options={[
                  { value: 'ETB', label: 'ETB - Ethiopian Birr (ብር)' },
                  { value: 'USD', label: 'USD - US Dollar ($)' },
                ]}
                onChange={(val) => setOrgProfile({ ...orgProfile, currency: val })}
              />
              <SelectInput
                label="Standard Date Format"
                value={orgProfile.dateFormat}
                options={[
                  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO 8601)' },
                  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (Standard)' },
                ]}
                onChange={(val) => setOrgProfile({ ...orgProfile, dateFormat: val })}
              />
              <TextInput
                label="Time Zone"
                value={orgProfile.timeZone}
                onChange={(e) => setOrgProfile({ ...orgProfile, timeZone: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. BUSINESS RULES & FINANCIAL POLICIES */}
      {/* ========================================================= */}
      {activeTab === 'rules' && systemSettings && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Financial Products & Business Rules Engine</h2>
              <p className="text-xs text-slate-500">
                Institutional thrift multipliers, interest schedules, reserve percentages, and dual-control thresholds.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
              onClick={handleSaveBusinessRules}
            >
              Save {rulesSubTab.toUpperCase()} Rules
            </Button>
          </div>

          {/* Sub-tabs for Business Rules */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
            {[
              { id: 'institution', label: '🏛 Profile & Contacts' },
              { id: 'branches', label: '📍 Branches & Locations' },
              { id: 'banks', label: '💳 Deposit Bank Accounts' },
              { id: 'savings', label: '💰 Savings & Yields' },
              { id: 'shares', label: '📈 Share Capital' },
              { id: 'loans', label: '💳 Loan Underwriting & Multiplier' },
              { id: 'accounting', label: '📑 Reserves & Accounting' },
              { id: 'security', label: '🛡 Security & Limits' },
            ].map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setRulesSubTab(sub.id as any)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                  rulesSubTab === sub.id
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {/* 1. Institution Profile & Contacts */}
          {rulesSubTab === 'institution' && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50/80 dark:bg-blue-950/40 rounded-xl border border-blue-200/80 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200 flex items-center justify-between">
                <div>
                  <span className="font-bold">Institutional Identity & Live Contacts:</span> Any updates here immediately update the website top bar, header, footers, static pages, and the Telegram bot in real-time.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <TextInput
                  label="SACCO Display Name (English)"
                  value={systemSettings.institutionProfile?.name || systemSettings.institutionName || 'Wabi SACCO'}
                  onChange={(e) => {
                    const prof = systemSettings.institutionProfile || ({} as any);
                    setSystemSettings({
                      ...systemSettings,
                      institutionName: e.target.value,
                      institutionProfile: { ...prof, name: e.target.value },
                    });
                  }}
                  required
                />
                <TextInput
                  label="SACCO Name (Amharic / አማርኛ)"
                  value={systemSettings.institutionProfile?.amharicName || 'ዋቢ የገንዘብ ቁጠባና ብድር ኅብረት ሥራ ማህበር'}
                  onChange={(e) => {
                    const prof = systemSettings.institutionProfile || ({} as any);
                    setSystemSettings({
                      ...systemSettings,
                      institutionProfile: { ...prof, amharicName: e.target.value },
                    });
                  }}
                  required
                />
                <TextInput
                  label="Legal Registered Name"
                  value={systemSettings.institutionProfile?.legalName || 'Wabi Savings and Credit Cooperative Society Ltd.'}
                  onChange={(e) => {
                    const prof = systemSettings.institutionProfile || ({} as any);
                    setSystemSettings({
                      ...systemSettings,
                      institutionProfile: { ...prof, legalName: e.target.value },
                    });
                  }}
                  required
                />

                <TextInput
                  label="Federal License Number"
                  value={systemSettings.institutionProfile?.licenseNumber || 'ET-COOP/AA/042'}
                  onChange={(e) => {
                    const prof = systemSettings.institutionProfile || ({} as any);
                    setSystemSettings({
                      ...systemSettings,
                      institutionProfile: { ...prof, licenseNumber: e.target.value },
                    });
                  }}
                  required
                />
                <TextInput
                  label="Primary Customer Hotline"
                  value={systemSettings.institutionProfile?.hotline1 || '+251 978 434 141'}
                  onChange={(e) => {
                    const prof = systemSettings.institutionProfile || ({} as any);
                    setSystemSettings({
                      ...systemSettings,
                      institutionProfile: { ...prof, hotline1: e.target.value },
                    });
                  }}
                  required
                />
                <TextInput
                  label="Secondary Customer Hotline"
                  value={systemSettings.institutionProfile?.hotline2 || '+251 927 011 111'}
                  onChange={(e) => {
                    const prof = systemSettings.institutionProfile || ({} as any);
                    setSystemSettings({
                      ...systemSettings,
                      institutionProfile: { ...prof, hotline2: e.target.value },
                    });
                  }}
                  required
                />

                <TextInput
                  label="Official Support Email"
                  type="email"
                  value={systemSettings.institutionProfile?.email || 'info@wabisacco.et'}
                  onChange={(e) => {
                    const prof = systemSettings.institutionProfile || ({} as any);
                    setSystemSettings({
                      ...systemSettings,
                      institutionProfile: { ...prof, email: e.target.value },
                    });
                  }}
                  required
                />
                <TextInput
                  label="Official Telegram Bot Username"
                  value={systemSettings.institutionProfile?.supportTelegram || '@wabbisaccobot'}
                  onChange={(e) => {
                    const prof = systemSettings.institutionProfile || ({} as any);
                    setSystemSettings({
                      ...systemSettings,
                      institutionProfile: { ...prof, supportTelegram: e.target.value },
                    });
                  }}
                  required
                />
                <TextInput
                  label="New Member Registration Fee (ETB)"
                  type="number"
                  value={systemSettings.registrationFee ?? systemSettings.institutionProfile?.registrationFee ?? 1000}
                  onChange={(e) => {
                    const fee = Number(e.target.value);
                    const prof = systemSettings.institutionProfile || ({} as any);
                    setSystemSettings({
                      ...systemSettings,
                      registrationFee: fee,
                      institutionProfile: { ...prof, registrationFee: fee },
                    });
                  }}
                  required
                  helperText="One-time mandatory membership admission fee"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
                <TextInput
                  label="Institutional Slogan (English)"
                  value={systemSettings.institutionProfile?.slogan || 'Ethical Wealth Growth & Modern Cooperative Finance for Ethiopia'}
                  onChange={(e) => {
                    const prof = systemSettings.institutionProfile || ({} as any);
                    setSystemSettings({
                      ...systemSettings,
                      institutionProfile: { ...prof, slogan: e.target.value },
                    });
                  }}
                />
                <TextInput
                  label="Institutional Slogan (Amharic / አማርኛ)"
                  value={systemSettings.institutionProfile?.amharicSlogan || 'ፍትሐዊ የሀብት ዕድገትና ዘመናዊ የኅብረት ሥራ ፋይናንስ ለኢትዮጵያ'}
                  onChange={(e) => {
                    const prof = systemSettings.institutionProfile || ({} as any);
                    setSystemSettings({
                      ...systemSettings,
                      institutionProfile: { ...prof, amharicSlogan: e.target.value },
                    });
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
                <TextInput
                  label="Head Office Address (English)"
                  value={systemSettings.institutionProfile?.headOfficeAddress || 'Helen Bldg 3rd Floor, in front of Lideta High Court, Addis Ababa, Ethiopia'}
                  onChange={(e) => {
                    const prof = systemSettings.institutionProfile || ({} as any);
                    setSystemSettings({
                      ...systemSettings,
                      institutionProfile: { ...prof, headOfficeAddress: e.target.value },
                    });
                  }}
                />
                <TextInput
                  label="Head Office Address (Amharic / አማርኛ)"
                  value={systemSettings.institutionProfile?.headOfficeAddressAmharic || 'ልደታ ከፍተኛ ፍርድ ቤት ፊት ለፊት፣ ሄለን ህንፃ 3ኛ ፎቅ፣ አዲስ አበባ፣ ኢትዮጵያ'}
                  onChange={(e) => {
                    const prof = systemSettings.institutionProfile || ({} as any);
                    setSystemSettings({
                      ...systemSettings,
                      institutionProfile: { ...prof, headOfficeAddressAmharic: e.target.value },
                    });
                  }}
                />
              </div>
            </div>
          )}

          {/* 2. Branches & Service Locations */}
          {rulesSubTab === 'branches' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Physical Branch Network & Service Desks</h3>
                  <p className="text-xs text-slate-500">
                    Locations displayed on public contact pages, footer navigation, and registration wizards.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => {
                    setEditingBranch(null);
                    setNewBranch({
                      name: '',
                      nameAmharic: '',
                      address: '',
                      addressAmharic: '',
                      phone: '',
                      isMainBranch: false,
                    });
                    setBranchModalOpen(true);
                  }}
                >
                  Add Branch Location
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(systemSettings.institutionProfile?.branchLocations || []).map((branch) => (
                  <div
                    key={branch.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 transition-all space-y-3 relative shadow-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{branch.name}</h4>
                          {branch.isMainBranch && (
                            <Badge variant="primary" size="sm">Head Office</Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{branch.nameAmharic}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBranch(branch);
                            setNewBranch({
                              name: branch.name,
                              nameAmharic: branch.nameAmharic,
                              address: branch.address,
                              addressAmharic: branch.addressAmharic,
                              phone: branch.phone,
                              isMainBranch: !!branch.isMainBranch,
                            });
                            setBranchModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBranch(branch.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{branch.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <span className="w-3.5 text-center font-bold">አማ</span>
                        <span className="truncate">{branch.addressAmharic}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-slate-700 font-semibold pt-1">
                        <Phone className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                        <span>{branch.phone}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Deposit Bank Accounts */}
          {rulesSubTab === 'banks' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Official SACCO Deposit Accounts & Payment Channels</h3>
                  <p className="text-xs text-slate-500">
                    Accounts provided to members for direct bank deposits, slip uploads, and mobile money transfers.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => setBankModalOpen(true)}
                >
                  Add Bank Account
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(systemSettings.institutionProfile?.bankAccounts || []).map((acc) => (
                  <div
                    key={acc.id}
                    className={`p-5 rounded-2xl border transition-all space-y-3 relative shadow-xs ${
                      acc.isDefault ? 'bg-blue-50/40 border-blue-300 ring-1 ring-blue-400' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{acc.bankName}</h4>
                          {acc.isDefault && <Badge variant="success" size="sm">Primary</Badge>}
                        </div>
                        <p className="text-xs text-slate-500">{acc.branch || 'Branch'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteBank(acc.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-3">
                      <div className="text-[11px] text-slate-500 uppercase tracking-wider">Account Number</div>
                      <div className="font-mono text-base font-bold text-slate-900 tracking-wider">
                        {acc.accountNumber}
                      </div>
                      <div className="text-[11px] text-slate-500 pt-1">
                        Holder: <span className="font-medium text-slate-800">{acc.accountName}</span>
                      </div>
                    </div>

                    {!acc.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleToggleDefaultBank(acc.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold pt-1 transition-colors block"
                      >
                        Set as Primary Account
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Savings Policy */}
          {rulesSubTab === 'savings' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <TextInput
                  label="Regular Compulsory Monthly Savings Min (ETB)"
                  type="number"
                  value={systemSettings.savingsRules?.regularMinMonthlySaving ?? systemSettings.regularMinMonthlySaving}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    const rules = systemSettings.savingsRules || ({} as any);
                    setSystemSettings({
                      ...systemSettings,
                      regularMinMonthlySaving: val,
                      savingsRules: { ...rules, regularMinMonthlySaving: val },
                    });
                  }}
                  helperText="Minimum mandatory monthly contribution per member"
                />
                <TextInput
                  label="Regular Compulsory Savings Annual Yield (%)"
                  type="number"
                  step="0.1"
                  value={systemSettings.savingsRules?.regularInterestRate ?? 12.5}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    const rules = systemSettings.savingsRules || ({} as any);
                    setSystemSettings({
                      ...systemSettings,
                      savingsRules: { ...rules, regularInterestRate: val },
                    });
                  }}
                  helperText="Promoted on landing page and calculators"
                />
                <TextInput
                  label="Voluntary Demand Savings Annual Yield (%)"
                  type="number"
                  step="0.1"
                  value={systemSettings.savingsRules?.voluntaryInterestRate ?? 13.5}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    const rules = systemSettings.savingsRules || ({} as any);
                    setSystemSettings({
                      ...systemSettings,
                      savingsRules: { ...rules, voluntaryInterestRate: val },
                    });
                  }}
                  helperText="Calculated on average daily balance"
                />

                <TextInput
                  label="12-Month Fixed Time Deposit Yield (%)"
                  type="number"
                  step="0.1"
                  value={systemSettings.savingsRules?.timeDepositInterestRates?.months12 ?? 15.0}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    const rules = systemSettings.savingsRules || ({} as any);
                    setSystemSettings({
                      ...systemSettings,
                      savingsRules: {
                        ...rules,
                        timeDepositInterestRates: {
                          ...(rules.timeDepositInterestRates || {}),
                          months12: val,
                        },
                      },
                    });
                  }}
                  helperText="Premium rate for 1-year certificate deposits"
                />
                <TextInput
                  label="Voluntary Savings Holding Days"
                  type="number"
                  value={systemSettings.voluntaryHoldingDays}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      voluntaryHoldingDays: Number(e.target.value),
                    })
                  }
                  helperText="Lock-in holding window before withdrawal eligibility"
                />
                <TextInput
                  label="Large Withdrawal Audit Ceiling (ETB)"
                  type="number"
                  value={systemSettings.largeWithdrawalThreshold}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      largeWithdrawalThreshold: Number(e.target.value),
                    })
                  }
                  helperText="Triggers 4-eyes supervisor authorization"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="font-bold text-slate-800">Dynamic Savings Tier Distribution</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-600">
                  <div>• Regular Compulsory: <span className="font-semibold text-slate-900">{systemSettings.savingsRules?.regularInterestRate ?? 12.5}% p.a.</span></div>
                  <div>• Voluntary Demand: <span className="font-semibold text-slate-900">{systemSettings.savingsRules?.voluntaryInterestRate ?? 13.5}% p.a.</span></div>
                  <div>• Fixed Time Certificate: <span className="font-semibold text-slate-900">{systemSettings.savingsRules?.timeDepositInterestRates?.months12 ?? 15.0}% p.a.</span></div>
                </div>
              </div>
            </div>
          )}

          {/* 5. Share Capital Policy */}
          {rulesSubTab === 'shares' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <TextInput
                  label="Par Value per Share (ETB)"
                  type="number"
                  value={systemSettings.sharePrice}
                  onChange={(e) => {
                    const price = Number(e.target.value);
                    const minS = systemSettings.minRequiredShares || 5;
                    const rules = systemSettings.shareRules || ({} as any);
                    setSystemSettings({
                      ...systemSettings,
                      sharePrice: price,
                      minShareValue: minS * price,
                      shareRules: { ...rules, sharePrice: price, minShareValue: minS * price },
                    });
                  }}
                  helperText="Statutory unit cost per cooperative equity share"
                />
                <TextInput
                  label="Minimum Mandatory Shares for Membership"
                  type="number"
                  value={systemSettings.minRequiredShares}
                  onChange={(e) => {
                    const minS = Number(e.target.value);
                    const price = systemSettings.sharePrice || 500;
                    const rules = systemSettings.shareRules || ({} as any);
                    setSystemSettings({
                      ...systemSettings,
                      minRequiredShares: minS,
                      minShareValue: minS * price,
                      shareRules: { ...rules, minRequiredShares: minS, minShareValue: minS * price },
                    });
                  }}
                  helperText="Required for voting rights and loan eligibility"
                />
                <TextInput
                  label="Annual Dividend Distribution Rate (%)"
                  type="number"
                  step="0.1"
                  value={systemSettings.shareDividendRate}
                  onChange={(e) => {
                    const div = Number(e.target.value);
                    const rules = systemSettings.shareRules || ({} as any);
                    setSystemSettings({
                      ...systemSettings,
                      shareDividendRate: div,
                      shareRules: { ...rules, shareDividendRate: div },
                    });
                  }}
                  helperText="Projected annual dividend payout percentage"
                />
              </div>

              <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 text-xs space-y-1">
                <div className="font-bold text-blue-900">Minimum Capital Threshold:</div>
                <p className="text-blue-800">
                  With {systemSettings.minRequiredShares} mandatory shares @ {systemSettings.sharePrice} ETB each, the minimum equity contribution for a new member is <span className="font-bold">{(systemSettings.minRequiredShares * systemSettings.sharePrice).toLocaleString()} ETB</span>.
                </p>
              </div>
            </div>
          )}

          {/* 6. Loan Underwriting Policy */}
          {rulesSubTab === 'loans' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <TextInput
                  label="Thrift Savings Multiplier Ceiling"
                  type="number"
                  step="0.1"
                  value={systemSettings.loanSavingsMultiplier}
                  onChange={(e) => {
                    const mult = Number(e.target.value);
                    const rules = systemSettings.loanRules || ({} as any);
                    setSystemSettings({
                      ...systemSettings,
                      loanSavingsMultiplier: mult,
                      loanRules: { ...rules, savingsMultiplier: mult },
                    });
                  }}
                  helperText="Max borrowing capacity = multiplier × compulsory savings"
                />
                <TextInput
                  label="Minimum Consecutive Savings Required (Months)"
                  type="number"
                  value={systemSettings.loanMinContinuousSavingsMonths}
                  onChange={(e) => {
                    const m = Number(e.target.value);
                    const rules = systemSettings.loanRules || ({} as any);
                    setSystemSettings({
                      ...systemSettings,
                      loanMinContinuousSavingsMonths: m,
                      loanRules: { ...rules, minContinuousSavingsMonths: m },
                    });
                  }}
                  helperText="Mandatory waiting months before credit eligibility"
                />
                <TextInput
                  label="Base Loan Interest Rate (% p.a.)"
                  type="number"
                  step="0.5"
                  value={systemSettings.defaultLoanInterestRate}
                  onChange={(e) => {
                    const rate = Number(e.target.value);
                    const rules = systemSettings.loanRules || ({} as any);
                    setSystemSettings({
                      ...systemSettings,
                      defaultLoanInterestRate: rate,
                      loanRules: { ...rules, defaultInterestRate: rate },
                    });
                  }}
                  helperText="Standard declining balance annual interest"
                />

                <TextInput
                  label="Late Payment Penalty Rate (% per month)"
                  type="number"
                  step="0.5"
                  value={systemSettings.loanLatePenaltyRatePercent}
                  onChange={(e) => {
                    const p = Number(e.target.value);
                    const rules = systemSettings.loanRules || ({} as any);
                    setSystemSettings({
                      ...systemSettings,
                      loanLatePenaltyRatePercent: p,
                      loanRules: { ...rules, latePenaltyRatePercent: p },
                    });
                  }}
                />
                <TextInput
                  label="Grace Period (Days)"
                  type="number"
                  value={systemSettings.loanLateGraceDays}
                  onChange={(e) => {
                    const g = Number(e.target.value);
                    const rules = systemSettings.loanRules || ({} as any);
                    setSystemSettings({
                      ...systemSettings,
                      loanLateGraceDays: g,
                      loanRules: { ...rules, lateGraceDays: g },
                    });
                  }}
                />
                <TextInput
                  label="Maximum Loan Repayment Tenure (Months)"
                  type="number"
                  value={systemSettings.loanRules?.maxLoanTermMonths || 48}
                  onChange={(e) => {
                    const t = Number(e.target.value);
                    const rules = systemSettings.loanRules || ({} as any);
                    setSystemSettings({
                      ...systemSettings,
                      loanRules: { ...rules, maxLoanTermMonths: t },
                    });
                  }}
                />
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-1">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Live Policy Enforcement
                </div>
                <p className="text-amber-800">
                  Changes to the <span className="font-bold">{systemSettings.loanSavingsMultiplier}× Multiplier</span> and <span className="font-bold">{systemSettings.loanMinContinuousSavingsMonths} Months Waiting Period</span> are immediately enforced on all member loan eligibility calculators and loan application wizards.
                </p>
              </div>
            </div>
          )}

          {/* 7. Accounting & Reserves */}
          {rulesSubTab === 'accounting' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <TextInput
                  label="Statutory Reserve Allocation (%)"
                  type="number"
                  value={systemSettings.accountingStatutoryReservePercent || 30}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      accountingStatutoryReservePercent: Number(e.target.value),
                    })
                  }
                  helperText="Mandated by Ethiopian Cooperative Proclamation"
                />
                <TextInput
                  label="General Reserve Allocation (%)"
                  type="number"
                  value={systemSettings.accountingLegalReservePercent || 15}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      accountingLegalReservePercent: Number(e.target.value),
                    })
                  }
                  helperText="Cooperative liquidity stabilization reserve"
                />
                <TextInput
                  label="Fiscal Year Start Month"
                  type="number"
                  min={1}
                  max={12}
                  value={systemSettings.accountingFiscalYearStartMonth || 7}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      accountingFiscalYearStartMonth: Number(e.target.value),
                    })
                  }
                  helperText="Month 7 = July (Hamle 1 in Ethiopian Calendar)"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="font-bold text-slate-900 mb-2">Automated GL Integration Controls</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Real-time transaction posting to Tier-5 General Ledger</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Automated end-of-month interest expense journalization</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 8. Security & Limits */}
          {rulesSubTab === 'security' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <TextInput
                  label="Maker-Checker Approval Threshold (ETB)"
                  type="number"
                  value={systemSettings.secMakerCheckerThreshold || systemSettings.largeWithdrawalThreshold || 50000}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      secMakerCheckerThreshold: Number(e.target.value),
                    })
                  }
                  helperText="Transactions exceeding this limit mandate secondary officer sign-off"
                />
                <TextInput
                  label="Maximum Failed Login Attempts"
                  type="number"
                  value={systemSettings.secMaxFailedLogins || 5}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      secMaxFailedLogins: Number(e.target.value),
                    })
                  }
                  helperText="Temporary lock on consecutive authentication failures"
                />
                <TextInput
                  label="Session Inactivity Timeout (Minutes)"
                  type="number"
                  value={systemSettings.secSessionInactivityMinutes || 15}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      secSessionInactivityMinutes: Number(e.target.value),
                    })
                  }
                  helperText="Automatic logout when idle"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. WORKING CALENDAR & ETHIOPIAN HOLIDAYS */}
      {/* ========================================================= */}
      {activeTab === 'calendar' && workingCalendar && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Operating Schedule & Business Hours</h2>
                <p className="text-xs text-slate-500">
                  Standard branch operating days and daily working shifts.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                isLoading={isSaving}
                leftIcon={<Save className="w-4 h-4" />}
                onClick={handleSaveWorkingCalendar}
              >
                Save Calendar Settings
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <TextInput
                label="Branch Opening Time"
                type="time"
                value={workingCalendar.dailyWorkingHours.start}
                onChange={(e) =>
                  setWorkingCalendar({
                    ...workingCalendar,
                    dailyWorkingHours: {
                      ...workingCalendar.dailyWorkingHours,
                      start: e.target.value,
                    },
                  })
                }
              />
              <TextInput
                label="Branch Closing Time"
                type="time"
                value={workingCalendar.dailyWorkingHours.end}
                onChange={(e) =>
                  setWorkingCalendar({
                    ...workingCalendar,
                    dailyWorkingHours: {
                      ...workingCalendar.dailyWorkingHours,
                      end: e.target.value,
                    },
                  })
                }
              />
              <TextInput
                label="Saturday Half-Day Schedule"
                value={workingCalendar.saturdayWorkingHours}
                onChange={(e) =>
                  setWorkingCalendar({
                    ...workingCalendar,
                    saturdayWorkingHours: e.target.value,
                  })
                }
              />
            </div>
          </div>

          {/* Public Holidays */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Ethiopian Official Public Holidays</h3>
                <p className="text-xs text-slate-500">
                  Statutory non-business holidays recognized for loan penalty interest waivers.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setHolidayModalOpen(true)}
              >
                Add Public Holiday
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Holiday Name</th>
                    <th className="py-2.5 px-3">Local Name (አማርኛ)</th>
                    <th className="py-2.5 px-3">Scheduled Date</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {workingCalendar.holidays.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{h.name}</td>
                      <td className="py-2.5 px-3 text-slate-700 font-medium">{h.localName || '—'}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{h.date}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant={h.isRecurring ? 'info' : 'neutral'}>
                          {h.isRecurring ? 'Annual Recurring' : 'One-Time'}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">{h.description || '—'}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteHoliday(h.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Special Planned Closures */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Planned Special Closures & Assemblies</h3>
                <p className="text-xs text-slate-500">
                  Cooperative General Assembly sessions, audit closeouts, and scheduled maintenance.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setClosureModalOpen(true)}
              >
                Schedule Special Closure
              </Button>
            </div>

            <div className="space-y-3">
              {workingCalendar.specialClosures.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{c.title}</span>
                      <Badge variant="warning">{c.status}</Badge>
                    </div>
                    <p className="text-slate-600">{c.reason}</p>
                    <div className="text-[11px] text-slate-400">
                      Approved By: <span className="font-medium text-slate-600">{c.approvedBy}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right font-mono text-slate-600 font-semibold">
                      {c.startDate} {c.startDate !== c.endDate ? `to ${c.endDate}` : ''}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteClosure(c.id)}
                      className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. ENTERPRISE FEATURE FLAGS */}
      {/* ========================================================= */}
      {activeTab === 'flags' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">Enterprise Feature Flag Management</h2>
            <p className="text-xs text-slate-500">
              Dynamically activate or deactivate functional capabilities and experimental modules across all channels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featureFlags.map((flag) => {
              const categoryBadgeColors: Record<string, string> = {
                CORE: 'bg-blue-50 text-blue-700 border-blue-200',
                CHANNELS: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                SECURITY: 'bg-rose-50 text-rose-700 border-rose-200',
                INNOVATION: 'bg-purple-50 text-purple-700 border-purple-200',
              };

              return (
                <div
                  key={flag.key}
                  className={`p-4 rounded-xl border transition-all ${
                    flag.isEnabled
                      ? 'bg-white border-slate-200 shadow-xs'
                      : 'bg-slate-50/60 border-slate-200/60 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            categoryBadgeColors[flag.category] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {flag.category}
                        </span>
                        {flag.requiresMfaToToggle && (
                          <span className="text-[10px] font-semibold text-rose-600 flex items-center gap-0.5">
                            <Lock className="w-3 h-3" /> Privileged
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm">{flag.name}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">{flag.description}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleFeatureFlag(flag.key, flag.isEnabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        flag.isEnabled ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          flag.isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Key: {flag.key}</span>
                    <span>Updated: {formatDateTime(flag.updatedAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. NUMBERING SYSTEM & SEQUENCE GENERATOR */}
      {/* ========================================================= */}
      {activeTab === 'numbering' && numberingSystem && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">ID Sequences & Numbering Formats</h2>
              <p className="text-xs text-slate-500">
                Configure prefixes, zero-padding length, and automated sequence counters across all core financial entities.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
              onClick={handleSaveNumbering}
            >
              Save Sequence Formats
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { key: 'membershipId', label: 'Member Account ID', entity: 'Members' },
              { key: 'transactionId', label: 'Teller Transaction Ref', entity: 'Receipts & Vouchers' },
              { key: 'journalNumber', label: 'General Journal Entry', entity: 'Accounting JV' },
              { key: 'voucherNumber', label: 'Payment Voucher ID', entity: 'Disbursements' },
              { key: 'loanNumber', label: 'Loan Account Number', entity: 'Credit Facilities' },
              { key: 'ticketNumber', label: 'Support Ticket ID', entity: 'Member Inquiries' },
              { key: 'receiptNumber', label: 'Cash Receipt Ref', entity: 'Teller Deposits' },
              { key: 'shareCertificateNumber', label: 'Share Certificate Number', entity: 'Equity Holdings' },
            ].map(({ key, label, entity }) => {
              const config = (numberingSystem as any)[key];
              const preview = nextNumbersPreview[key] || 'PREVIEW-001';

              return (
                <div key={key} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{label}</h3>
                      <p className="text-[11px] text-slate-500">Entity: {entity}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">Next Generated</span>
                      <span className="font-mono font-bold text-xs bg-blue-100 text-blue-900 px-2 py-0.5 rounded">
                        {preview}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <TextInput
                      label="Prefix"
                      value={config.prefix}
                      onChange={(e) =>
                        setNumberingSystem({
                          ...numberingSystem,
                          [key]: { ...config, prefix: e.target.value },
                        })
                      }
                    />
                    <TextInput
                      label="Digits"
                      type="number"
                      value={config.sequenceLength}
                      onChange={(e) =>
                        setNumberingSystem({
                          ...numberingSystem,
                          [key]: { ...config, sequenceLength: Number(e.target.value) },
                        })
                      }
                    />
                    <TextInput
                      label="Current Sequence"
                      type="number"
                      value={config.currentNumber}
                      onChange={(e) =>
                        setNumberingSystem({
                          ...numberingSystem,
                          [key]: { ...config, currentNumber: Number(e.target.value) },
                        })
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. DOCUMENT STORAGE & RETENTION RULES */}
      {/* ========================================================= */}
      {activeTab === 'documents' && documentConfig && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Document Upload & Regulatory Retention</h2>
              <p className="text-xs text-slate-500">
                File upload restrictions, automated image optimization, and regulatory archival periods.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
              onClick={handleSaveDocumentConfig}
            >
              Save Document Rules
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <TextInput
              label="Max Upload Size (MB)"
              type="number"
              value={documentConfig.maxUploadSizeMb}
              onChange={(e) =>
                setDocumentConfig({
                  ...documentConfig,
                  maxUploadSizeMb: Number(e.target.value),
                })
              }
              helperText="Maximum allowed file size per KYC/Receipt attachment"
            />
            <TextInput
              label="Image Compression Quality (%)"
              type="number"
              value={documentConfig.imageCompressionQuality}
              onChange={(e) =>
                setDocumentConfig({
                  ...documentConfig,
                  imageCompressionQuality: Number(e.target.value),
                })
              }
            />
            <SelectInput
              label="Primary Storage Provider"
              value={documentConfig.storageProvider}
              options={[
                { value: 'LOCAL', label: 'Local Encrypted Storage' },
                { value: 'S3_COMPATIBLE', label: 'MinIO / S3 Compatible Object Store' },
                { value: 'GCS', label: 'Google Cloud Storage' },
              ]}
              onChange={(val) =>
                setDocumentConfig({ ...documentConfig, storageProvider: val as any })
              }
            />
          </div>

          {/* Retention Periods */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              Statutory Retention Schedules (Years)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {[
                { key: 'memberKyc', label: 'Member KYC & IDs' },
                { key: 'loanDocuments', label: 'Loan Agreements' },
                { key: 'financialReceipts', label: 'Financial Receipts' },
                { key: 'auditTrail', label: 'Audit Trail Records' },
                { key: 'systemLogs', label: 'System Telemetry' },
              ].map(({ key, label }) => (
                <div key={key} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-xs font-semibold text-slate-700 block">{label}</span>
                  <div className="flex items-center gap-2">
                    <TextInput
                      type="number"
                      value={(documentConfig.retentionYears as any)[key]}
                      onChange={(e) =>
                        setDocumentConfig({
                          ...documentConfig,
                          retentionYears: {
                            ...documentConfig.retentionYears,
                            [key]: Number(e.target.value),
                          },
                        })
                      }
                    />
                    <span className="text-xs text-slate-400 font-bold">Yrs</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. NOTIFICATION CHANNELS & GATEWAYS */}
      {/* ========================================================= */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">Notification Channels & Delivery Gateways</h2>
            <p className="text-xs text-slate-500">
              Integrations for Ethio Telecom Shortcode SMS, Telegram Bot dispatch, and SMTP Email service.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* SMS Gateway */}
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-sm">SMS Shortcode Gateway</h3>
                </div>
                <Badge variant="success">CONNECTED</Badge>
              </div>
              <p className="text-xs text-slate-500">
                Ethio Telecom direct API gateway delivering OTP codes and instant transaction deposit SMS alerts.
              </p>
              <TextInput label="Sender ID / Mask" defaultValue="WABI-SACCO" readOnly />
              <TextInput label="API Endpoint URL" defaultValue="https://api.ethiotelecom.et/sms/v2" readOnly />
              <Button variant="outline" size="sm" className="w-full">
                Send Test SMS Ping
              </Button>
            </div>

            {/* Telegram Bot */}
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-sky-500" />
                  <h3 className="font-bold text-slate-900 text-sm">Telegram Bot Broadcast</h3>
                </div>
                <Badge variant="success">ACTIVE</Badge>
              </div>
              <p className="text-xs text-slate-500">
                Official Telegram Bot (@WabiSaccoBot) for instant loan approval and savings notices.
              </p>
              <TextInput label="Bot Handle" defaultValue="@WabiSaccoOfficialBot" readOnly />
              <TextInput label="Channel ID" defaultValue="-10018928372" readOnly />
              <Button variant="outline" size="sm" className="w-full">
                Test Webhook Delivery
              </Button>
            </div>

            {/* SMTP Mailer */}
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Transactional Email (SMTP)</h3>
                </div>
                <Badge variant="success">ONLINE</Badge>
              </div>
              <p className="text-xs text-slate-500">
                Monthly passbook e-statements, loan schedule PDF attachments, and audit alerts.
              </p>
              <TextInput label="SMTP Host" defaultValue="smtp.wabisacco.et:587" readOnly />
              <TextInput label="From Address" defaultValue="notifications@wabisacco.et" readOnly />
              <Button variant="outline" size="sm" className="w-full">
                Send Test Email
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 8. LOCALIZATION & LANGUAGE PACKS */}
      {/* ========================================================= */}
      {activeTab === 'localization' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Localization & Multilingual Dictionaries</h2>
              <p className="text-xs text-slate-500">
                Manage UI translations for English, Amharic (አማርኛ), and Afaan Oromoo.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {localizationPacks.map((pack) => (
                <button
                  key={pack.languageCode}
                  type="button"
                  onClick={() => setSelectedLanguageCode(pack.languageCode)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    selectedLanguageCode === pack.languageCode
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {pack.nativeName} ({pack.languageCode.toUpperCase()})
                </button>
              ))}
            </div>
          </div>

          {/* Search Translation Keys */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search translation key or value..."
                value={langSearch}
                onChange={(e) => setLangSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <span className="text-xs text-slate-500">
              Showing <span className="font-bold text-slate-900">{filteredTranslations.length}</span> of{' '}
              {currentPack?.totalKeys || 0} keys
            </span>
          </div>

          {/* Key Value Dictionary Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-1/3">Translation Key</th>
                  <th className="py-2.5 px-3 w-1/2">
                    Translated Text ({currentPack?.languageName})
                  </th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTranslations.map(([key, val]) => (
                  <tr key={key} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{key}</td>
                    <td className="py-2.5 px-3 text-slate-900 font-medium">{val}</td>
                    <td className="py-2.5 px-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingTransKey(key);
                          setEditingTransValue(val);
                          setEditTransModalOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 9. BRANDING & THEME CUSTOMIZER */}
      {/* ========================================================= */}
      {activeTab === 'branding' && brandingTheme && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Branding & Visual Customizer</h2>
              <p className="text-xs text-slate-500">
                Customize institution brand colors, typography hierarchy, and border radius metrics.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
              onClick={handleSaveBranding}
            >
              Apply Theme Styles
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <TextInput
                label="Primary Brand Color"
                type="color"
                value={brandingTheme.primaryColor}
                onChange={(e) =>
                  setBrandingTheme({ ...brandingTheme, primaryColor: e.target.value })
                }
              />
              <TextInput
                label="Secondary Brand Color"
                type="color"
                value={brandingTheme.secondaryColor}
                onChange={(e) =>
                  setBrandingTheme({ ...brandingTheme, secondaryColor: e.target.value })
                }
              />
              <TextInput
                label="Accent Color"
                type="color"
                value={brandingTheme.accentColor}
                onChange={(e) =>
                  setBrandingTheme({ ...brandingTheme, accentColor: e.target.value })
                }
              />
            </div>

            <div className="space-y-4">
              <SelectInput
                label="Display Heading Font"
                value={brandingTheme.displayFont}
                options={[
                  { value: 'Coolvetica, Plus Jakarta Sans', label: 'Coolvetica (Primary English Display)' },
                  { value: 'ETH_B_gofa, Noto Sans Ethiopic', label: 'ETH_B_gofa (Primary Amharic Display)' },
                  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans (Modern)' },
                  { value: 'Outfit', label: 'Outfit' },
                  { value: 'Inter', label: 'Inter (Clean)' },
                ]}
                onChange={(val) => setBrandingTheme({ ...brandingTheme, displayFont: val })}
              />
              <SelectInput
                label="Body Typography Font"
                value={brandingTheme.bodyFont}
                options={[
                  { value: 'Coolvetica, Plus Jakarta Sans', label: 'Coolvetica & ETH_B_gofa (Institution Standard)' },
                  { value: 'Inter', label: 'Inter (High Readability)' },
                  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans' },
                  { value: 'Roboto', label: 'Roboto' },
                ]}
                onChange={(val) => setBrandingTheme({ ...brandingTheme, bodyFont: val })}
              />
              <TextInput
                label="Card Corner Radius (px)"
                type="number"
                value={brandingTheme.borderRadiusPx}
                onChange={(e) =>
                  setBrandingTheme({ ...brandingTheme, borderRadiusPx: Number(e.target.value) })
                }
              />

              {/* Theme Mode Preference Selector */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Appearance Theme Mode (Light / Dark)
                </label>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    Active System Visual Theme
                  </span>
                  <ThemeToggle variant="segmented" showLabel />
                </div>
              </div>
            </div>

            {/* Live Visual Preview Mockup Card */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Live Brand Preview Mockup
              </span>
              <div
                className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2.5"
                style={{ borderRadius: `${brandingTheme.borderRadiusPx}px` }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: brandingTheme.primaryColor }}
                  />
                  <span className="font-bold text-xs text-slate-900 dark:text-white">Wabi SACCO Portal</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Preview of interactive button and theme styling accents.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    className="text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs cursor-pointer"
                    style={{ backgroundColor: brandingTheme.primaryColor }}
                  >
                    Primary Action
                  </button>
                  <button
                    type="button"
                    className="text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs cursor-pointer"
                    style={{ backgroundColor: brandingTheme.secondaryColor }}
                  >
                    Secondary
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 10. SYSTEM HEALTH & INFRASTRUCTURE MONITORING */}
      {/* ========================================================= */}
      {activeTab === 'health' && healthData && (
        <div className="space-y-6">
          {/* Top Telemetry Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-400">Server Uptime</span>
                <Server className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {Math.floor(healthData.server.uptimeSeconds / 3600)}h{' '}
                {Math.floor((healthData.server.uptimeSeconds % 3600) / 60)}m
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold">Status: Operational</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-400">Memory Utilization</span>
                <Cpu className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {healthData.resources.memoryPercent}%
              </div>
              <div className="text-[11px] text-slate-500">
                {healthData.resources.memoryUsageMb} MB / {healthData.resources.memoryTotalMb} MB
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-400">Total Registered Members</span>
                <Database className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {healthData.database.recordCounts.members || 0}
              </div>
              <div className="text-[11px] text-slate-500">
                Active: {healthData.database.recordCounts.activeMembers || 0} members
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-400">Active Loan Accounts</span>
                <Zap className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {healthData.database.recordCounts.activeLoans || 0}
              </div>
              <div className="text-[11px] text-slate-500">
                Total Facilities: {healthData.database.recordCounts.loans || 0}
              </div>
            </div>
          </div>

          {/* Microservices Latency Health Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Microservice Latency & Engine Telemetry</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Service Subsystem</th>
                    <th className="py-2.5 px-3">Operational Status</th>
                    <th className="py-2.5 px-3">Response Latency</th>
                    <th className="py-2.5 px-3 text-right">Health Light</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {healthData.services.map((svc) => (
                    <tr key={svc.name} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{svc.name}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant={svc.status === 'ONLINE' ? 'success' : 'danger'}>
                          {svc.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">
                        {svc.latencyMs} ms
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 11. DEVOPS & PERFORMANCE CENTER */}
      {/* ========================================================= */}
      {activeTab === 'devops' && <DevOpsPerformanceCenter />}

      {/* ========================================================= */}
      {/* 12. PRODUCTION DATA CLEANUP & RESET (PHASE 24) */}
      {/* ========================================================= */}
      {activeTab === 'production_data' && <ProductionDataManagementView />}

      {/* ========================================================= */}
      {/* 13. LEGACY DATA MIGRATION & RECONCILIATION (PHASE 25) */}
      {/* ========================================================= */}
      {activeTab === 'legacy_migration' && <LegacyDataMigrationView />}

      {/* ========================================================= */}
      {/* 14. DATA IMPORT & EXPORT CENTER */}
      {/* ========================================================= */}
      {activeTab === 'import_export' && (
        <div className="space-y-6">
          {/* Data Export Cards */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Institutional Data Export Center</h2>
              <p className="text-xs text-slate-500">
                Download point-in-time full database records formatted for external regulatory reporting or backup archives.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              {[
                { key: 'members', label: 'Members Directory', count: healthData?.database.recordCounts.members },
                { key: 'savings', label: 'Savings Accounts', count: healthData?.database.recordCounts.savingsAccounts },
                { key: 'loans', label: 'Loan Portfolios', count: healthData?.database.recordCounts.loans },
                { key: 'transactions', label: 'Financial Transactions', count: healthData?.database.recordCounts.transactions },
                { key: 'journals', label: 'General Ledger Journals', count: healthData?.database.recordCounts.journals },
                { key: 'auditLogs', label: 'Audit Trail Records', count: auditLogs.length },
                { key: 'all', label: 'Full System Snapshot', count: 'Complete' },
              ].map(({ key, label, count }) => (
                <div key={key} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{label}</h3>
                    <span className="text-xs text-slate-500">Records: {count ?? '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-[11px]"
                      onClick={() => adminService.exportData(key, 'json')}
                    >
                      JSON
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1 text-[11px]"
                      onClick={() => adminService.exportData(key, 'csv')}
                    >
                      CSV
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Batch Data Ingestion Wizard */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Batch Data Import & Ingestion Wizard</h2>
              <p className="text-xs text-slate-500">
                Bulk ingest structured JSON records with automatic pre-flight schema validation and audit logging.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <SelectInput
                  label="Target Database Collection"
                  value={importEntity}
                  options={[
                    { value: 'members', label: 'Members' },
                    { value: 'savings', label: 'Savings Accounts' },
                    { value: 'loans', label: 'Loans' },
                    { value: 'transactions', label: 'Transactions' },
                  ]}
                  onChange={(val) => setImportEntity(val)}
                />
              </div>

              <TextareaInput
                label="JSON Data Payload (Array of Objects)"
                placeholder='[ { "fullName": "Abebe Bikila", "phoneNumber": "+251911223344", ... } ]'
                rows={5}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
              />

              <div className="flex items-center gap-3">
                <Button variant="outline" size="md" onClick={handlePreviewImport}>
                  Validate & Preview Data
                </Button>
                {importPreviewResult && (
                  <Button variant="primary" size="md" onClick={handleCommitImport}>
                    Commit Ingestion ({importPreviewResult.validation.validCount} records)
                  </Button>
                )}
              </div>

              {importPreviewResult && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-2">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Validation Succeeded: {importPreviewResult.validation.validCount} valid records
                  </div>
                  <pre className="bg-white p-3 rounded-lg border border-emerald-200 text-slate-800 font-mono text-[11px] overflow-x-auto max-h-40">
                    {JSON.stringify(importPreviewResult.sample, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 12. CONFIGURATION AUDIT TRAIL */}
      {/* ========================================================= */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">System Configuration Audit Trail</h2>
              <p className="text-xs text-slate-500">
                Immutable chronological log of all setting mutations, feature flag toggles, and parameter changes.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <SelectInput
                label=""
                value={auditFilterCategory}
                options={[
                  { value: 'ALL', label: 'All Categories' },
                  { value: 'ORGANIZATION', label: 'Organization' },
                  { value: 'SAVINGS_RULES', label: 'Savings Rules' },
                  { value: 'SHARE_RULES', label: 'Share Rules' },
                  { value: 'LOAN_RULES', label: 'Loan Rules' },
                  { value: 'FEATURE_FLAGS', label: 'Feature Flags' },
                  { value: 'WORKING_CALENDAR', label: 'Working Calendar' },
                  { value: 'LOCALIZATION', label: 'Localization' },
                  { value: 'NUMBERING_SYSTEM', label: 'Numbering System' },
                ]}
                onChange={(val) => setAuditFilterCategory(val)}
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredAuditLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-medium">
                No configuration changes recorded for this filter.
              </div>
            ) : (
              filteredAuditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="primary">{log.category}</Badge>
                      <span className="font-bold text-slate-900">{log.settingKey}</span>
                      <span className="text-slate-400">• by {log.changedByName}</span>
                    </div>
                    <div className="text-right text-[11px] text-slate-400 font-mono">
                      {formatDateTime(log.timestamp)}
                    </div>
                  </div>

                  {log.reason && (
                    <p className="text-slate-700 bg-white p-2 rounded-lg border border-slate-200/60 font-medium">
                      Reason: {log.reason}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="p-2 bg-rose-50 rounded border border-rose-100 text-rose-800 truncate">
                      Old: {JSON.stringify(log.oldValue)}
                    </div>
                    <div className="p-2 bg-emerald-50 rounded border border-emerald-100 text-emerald-800 truncate">
                      New: {JSON.stringify(log.newValue)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Change Reason Modal */}
      <Modal
        isOpen={reasonModalOpen}
        onClose={() => setReasonModalOpen(false)}
        title="Administrative Authorization & Change Reason"
        description="Dual-control governance requires recording a justification for modifying institutional parameters."
      >
        <div className="space-y-4 text-xs">
          <TextareaInput
            label="Reason for Configuration Change"
            placeholder="e.g. Approved in Board of Directors Minute #44/2026 for annual savings rate adjustment..."
            rows={3}
            value={changeReason}
            onChange={(e) => setChangeReason(e.target.value)}
            required
          />

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button variant="outline" size="sm" onClick={() => setReasonModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSaving}
              onClick={handleConfirmSaveReason}
            >
              Authorize & Apply Change
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Public Holiday Modal */}
      <Modal
        isOpen={holidayModalOpen}
        onClose={() => setHolidayModalOpen(false)}
        title="Add Ethiopian Public Holiday"
        description="Register a new statutory holiday to waive delinquency penalties."
      >
        <div className="space-y-4 text-xs">
          <TextInput
            label="Holiday Name (English)"
            placeholder="e.g. Ethiopian Christmas (Genna)"
            value={newHoliday.name}
            onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
            required
          />
          <TextInput
            label="Local Name (አማርኛ / Afaan Oromoo)"
            placeholder="e.g. ገና"
            value={newHoliday.localName}
            onChange={(e) => setNewHoliday({ ...newHoliday, localName: e.target.value })}
          />
          <TextInput
            label="Date (YYYY-MM-DD)"
            type="date"
            value={newHoliday.date}
            onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
            required
          />
          <TextInput
            label="Description / Cultural Note"
            placeholder="e.g. Commemoration of discovery of True Cross"
            value={newHoliday.description}
            onChange={(e) => setNewHoliday({ ...newHoliday, description: e.target.value })}
          />

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button variant="outline" size="sm" onClick={() => setHolidayModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddHoliday}>
              Save Holiday
            </Button>
          </div>
        </div>
      </Modal>

      {/* Schedule Special Closure Modal */}
      <Modal
        isOpen={closureModalOpen}
        onClose={() => setClosureModalOpen(false)}
        title="Schedule Special Branch Closure"
        description="Plan general assembly, system maintenance, or audit branch closures."
      >
        <div className="space-y-4 text-xs">
          <TextInput
            label="Event / Closure Title"
            placeholder="e.g. Annual General Assembly 2026"
            value={newClosure.title}
            onChange={(e) => setNewClosure({ ...newClosure, title: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <TextInput
              label="Start Date"
              type="date"
              value={newClosure.startDate}
              onChange={(e) => setNewClosure({ ...newClosure, startDate: e.target.value })}
              required
            />
            <TextInput
              label="End Date"
              type="date"
              value={newClosure.endDate}
              onChange={(e) => setNewClosure({ ...newClosure, endDate: e.target.value })}
              required
            />
          </div>
          <TextareaInput
            label="Justification / Resolution Details"
            placeholder="Reason for scheduled downtime..."
            rows={2}
            value={newClosure.reason}
            onChange={(e) => setNewClosure({ ...newClosure, reason: e.target.value })}
          />

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button variant="outline" size="sm" onClick={() => setClosureModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddClosure}>
              Record Closure
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Translation Modal */}
      <Modal
        isOpen={editTransModalOpen}
        onClose={() => setEditTransModalOpen(false)}
        title={`Edit Translation: ${editingTransKey}`}
        description={`Updating language dictionary value for ${currentPack?.languageName}.`}
      >
        <div className="space-y-4 text-xs">
          <TextareaInput
            label="Translated String"
            rows={3}
            value={editingTransValue}
            onChange={(e) => setEditingTransValue(e.target.value)}
            required
          />
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button variant="outline" size="sm" onClick={() => setEditTransModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveTranslationKey}>
              Update Dictionary
            </Button>
          </div>
        </div>
      </Modal>

      {/* Branch Location Modal */}
      <Modal
        isOpen={branchModalOpen}
        onClose={() => {
          setBranchModalOpen(false);
          setEditingBranch(null);
        }}
        title={editingBranch ? 'Edit Branch Location' : 'Add New Branch Location'}
        description="Physical branch office or service desk details displayed across the website."
      >
        <div className="space-y-4 text-xs">
          <TextInput
            label="Branch Name (English)"
            placeholder="e.g. Bole Medhanialem Service Center"
            value={newBranch.name}
            onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
            required
          />
          <TextInput
            label="Branch Name (Amharic / አማርኛ)"
            placeholder="e.g. የቦሌ መድኃኔዓለም አገልግሎት ማዕከል"
            value={newBranch.nameAmharic}
            onChange={(e) => setNewBranch({ ...newBranch, nameAmharic: e.target.value })}
            required
          />
          <TextInput
            label="Physical Address (English)"
            placeholder="e.g. Robel Plaza 2nd Floor, Bole, Addis Ababa"
            value={newBranch.address}
            onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
            required
          />
          <TextInput
            label="Physical Address (Amharic / አማርኛ)"
            placeholder="e.g. ሮቤል ፕላዛ 2ኛ ፎቅ፣ ቦሌ፣ አዲስ አበባ"
            value={newBranch.addressAmharic}
            onChange={(e) => setNewBranch({ ...newBranch, addressAmharic: e.target.value })}
            required
          />
          <TextInput
            label="Branch Direct Phone / Hotline"
            placeholder="e.g. +251 927 011 111"
            value={newBranch.phone}
            onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })}
            required
          />

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isMainBranchCheck"
              checked={newBranch.isMainBranch}
              onChange={(e) => setNewBranch({ ...newBranch, isMainBranch: e.target.checked })}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isMainBranchCheck" className="text-xs text-slate-700 font-medium cursor-pointer">
              Set as Principal Head Office Branch
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setBranchModalOpen(false);
                setEditingBranch(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveBranch}>
              {editingBranch ? 'Update Location' : 'Add Location'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Deposit Bank Account Modal */}
      <Modal
        isOpen={bankModalOpen}
        onClose={() => setBankModalOpen(false)}
        title="Add SACCO Deposit Bank Account"
        description="Official bank or digital money account provided to members for deposits."
      >
        <div className="space-y-4 text-xs">
          <TextInput
            label="Bank / Financial Institution Name"
            placeholder="e.g. Commercial Bank of Ethiopia (CBE)"
            value={newBank.bankName}
            onChange={(e) => setNewBank({ ...newBank, bankName: e.target.value })}
            required
          />
          <TextInput
            label="Account Number / Merchant Shortcode"
            placeholder="e.g. 1000348920192"
            value={newBank.accountNumber}
            onChange={(e) => setNewBank({ ...newBank, accountNumber: e.target.value })}
            required
          />
          <TextInput
            label="Official Account Holder Name"
            placeholder="e.g. Wabi SACCO Society Ltd."
            value={newBank.accountName}
            onChange={(e) => setNewBank({ ...newBank, accountName: e.target.value })}
            required
          />
          <TextInput
            label="Bank Branch Office"
            placeholder="e.g. Lideta Branch / Digital Wallet"
            value={newBank.branch}
            onChange={(e) => setNewBank({ ...newBank, branch: e.target.value })}
          />

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isDefaultBankCheck"
              checked={newBank.isDefault}
              onChange={(e) => setNewBank({ ...newBank, isDefault: e.target.checked })}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isDefaultBankCheck" className="text-xs text-slate-700 font-medium cursor-pointer">
              Set as Default / Primary Deposit Account
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setBankModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveBank}>
              Save Bank Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
