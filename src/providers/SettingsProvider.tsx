import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { SystemSettings, SaccoInstitutionProfile, SaccoBranchLocation, SaccoDepositBankAccount } from '../types/financial';
import { adminService } from '../services/adminService';

const DEFAULT_INSTITUTION_PROFILE: SaccoInstitutionProfile = {
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
  branchLocations: [
    {
      id: 'branch_main_lideta',
      name: 'Lideta Head Office & Main Branch',
      nameAmharic: 'የልደታ ዋና ቅርንጫፍና አስተዳደር ጽ/ቤት',
      address: 'Helen Bldg 3rd Floor, in front of Lideta High Court, Addis Ababa',
      addressAmharic: 'ልደታ ከፍተኛ ፍርድ ቤት ፊት ለፊት፣ ሄለን ህንፃ 3ኛ ፎቅ፣ አዲስ አበባ',
      phone: '+251 978 434 141',
      isMainBranch: true,
    },
    {
      id: 'branch_bole',
      name: 'Bole Medhanialem Service Center',
      nameAmharic: 'የቦሌ መድኃኔዓለም አገልግሎት ማዕከል',
      address: 'Behind Edna Mall, Robel Plaza 2nd Floor, Bole, Addis Ababa',
      addressAmharic: 'ቦሌ መድኃኔዓለም ኤድናሞል ጀርባ፣ ሮቤል ፕላዛ 2ኛ ፎቅ፣ አዲስ አበባ',
      phone: '+251 927 011 111',
      isMainBranch: false,
    },
    {
      id: 'branch_piassa',
      name: 'Arada / Piassa Service Desk',
      nameAmharic: 'የአራዳ / ፒያሳ አገልግሎት ማዕከል',
      address: 'De Gaulle Square, Commercial Center 1st Floor, Arada, Addis Ababa',
      addressAmharic: 'ደጎል አደባባይ፣ የንግድ ማዕከል 1ኛ ፎቅ፣ አራዳ፣ አዲስ አበባ',
      phone: '+251 911 223 344',
      isMainBranch: false,
    },
  ],
  bankAccounts: [
    {
      id: 'bank_cbe_main',
      bankName: 'Commercial Bank of Ethiopia (CBE)',
      accountName: 'Wabi SACCO Society Ltd.',
      accountNumber: '1000348920192',
      branch: 'Lideta Branch',
      isDefault: true,
    },
    {
      id: 'bank_tsehay',
      bankName: 'Tsehay Bank',
      accountName: 'Wabi SACCO Society Ltd.',
      accountNumber: '0023910293841',
      branch: 'Churchill Road Branch',
      isDefault: false,
    },
    {
      id: 'bank_cbebirr',
      bankName: 'CBE Birr Short Code',
      accountName: 'Wabi SACCO Society Merchant',
      accountNumber: '894201',
      branch: 'Digital Wallet',
      isDefault: false,
    },
  ],
};

const DEFAULT_SETTINGS: SystemSettings = {
  largeWithdrawalThreshold: 50000,
  regularMinMonthlySaving: 500,
  voluntaryHoldingDays: 3,
  allowOverdraft: false,
  institutionName: 'Wabi Savings and Credit Cooperative Society Ltd.',
  baseCurrency: 'ETB',
  sharePrice: 500,
  minRequiredShares: 5,
  minShareValue: 2500,
  shareDividendRate: 14.5,
  registrationFee: 1000,
  defaultLoanInterestRate: 14.0,
  loanLatePenaltyRatePercent: 2.0,
  loanLateGraceDays: 5,
  loanMaxActivePerMember: 1,
  loanMaxGuaranteePerMember: 3,
  loanMinContinuousSavingsMonths: 4,
  loanMinMonthlySavingsAmount: 500,
  loanMinShareRequirement: 5,
  loanSavingsMultiplier: 4.0,
  institutionProfile: DEFAULT_INSTITUTION_PROFILE,
  savingsRules: {
    regularMinMonthlySaving: 500,
    regularMinOpeningBalance: 100,
    regularInterestRate: 12.5,
    voluntaryMinDeposit: 0,
    voluntaryHoldingDays: 3,
    voluntaryInterestRate: 13.5,
    childrenMinMonthlySaving: 200,
    childrenInterestRate: 14.0,
    childrenMaxAgeYears: 18,
    timeDepositMinAmount: 5000,
    timeDepositPenaltyPercent: 2.0,
    timeDepositInterestRates: {
      months3: 13.0,
      months6: 14.0,
      months12: 15.0,
      months24: 15.5,
      months36: 16.0,
    },
    interestCalculationPeriod: 'MONTHLY',
    withdrawalWaitingPeriodDays: 3,
  },
  shareRules: {
    sharePrice: 500,
    minRequiredShares: 5,
    maxAllowedShares: 2000,
    minShareValue: 2500,
    shareDividendRate: 14.5,
    allowVoluntaryConversion: true,
    shareTransferLockMonths: 12,
    shareTransferFeePercent: 1.0,
    maxShareholdingPercentage: 10.0,
  },
  loanRules: {
    defaultInterestRate: 14.0,
    latePenaltyRatePercent: 2.0,
    lateGraceDays: 5,
    maxActiveLoansPerMember: 1,
    maxGuaranteesPerMember: 3,
    minContinuousSavingsMonths: 4,
    savingsMultiplier: 4.0,
    minShareRequirement: 5,
    makerCheckerThreshold: 50000,
    managerApprovalThreshold: 150000,
    boardApprovalThreshold: 500000,
    maxLoanTermMonths: 48,
  },
};

interface SettingsContextType {
  settings: SystemSettings;
  institution: SaccoInstitutionProfile;
  isLoading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
  updateSettings: (
    section: string,
    updates: Partial<SystemSettings>,
    changeReason?: string
  ) => Promise<{ success: boolean; data?: SystemSettings; message?: string; error?: string }>;
  // Dynamic Convenience Getters
  sharePrice: number;
  minRequiredShares: number;
  minShareCapital: number;
  loanMultiplier: number;
  minMonthlySaving: number;
  registrationFee: number;
  totalCapitalRequired: number;
  regularYield: number;
  voluntaryYield: number;
  timeDepositYield: number;
  defaultLoanRate: number;
  emergencyLoanRate: number;
  businessLoanRate: number;
  assetLoanRate: number;
  branches: SaccoBranchLocation[];
  bankAccounts: SaccoDepositBankAccount[];
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      // First try public endpoint (works even without authentication)
      const res = await fetch('/api/public/system-settings');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setSettings((prev) => ({
            ...prev,
            ...json.data,
            institutionProfile: {
              ...DEFAULT_INSTITUTION_PROFILE,
              ...(json.data.institutionProfile || {}),
            },
            savingsRules: {
              ...prev.savingsRules,
              ...(json.data.savingsRules || {}),
            },
            shareRules: {
              ...prev.shareRules,
              ...(json.data.shareRules || {}),
            },
            loanRules: {
              ...prev.loanRules,
              ...(json.data.loanRules || {}),
            },
          }));
          setError(null);
          return;
        }
      }
    } catch (err: any) {
      console.warn('[SettingsProvider] Public settings fetch fallback to defaults:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (
    section: string,
    updates: Partial<SystemSettings>,
    changeReason?: string
  ) => {
    try {
      const res = await adminService.updateSystemSettingsSection(section, updates, changeReason);
      if (res.success && res.data) {
        setSettings((prev) => ({
          ...prev,
          ...res.data,
          institutionProfile: {
            ...prev.institutionProfile,
            ...(res.data.institutionProfile || {}),
          },
          savingsRules: {
            ...prev.savingsRules,
            ...(res.data.savingsRules || {}),
          },
          shareRules: {
            ...prev.shareRules,
            ...(res.data.shareRules || {}),
          },
          loanRules: {
            ...prev.loanRules,
            ...(res.data.loanRules || {}),
          },
        }));
        return { success: true, data: res.data, message: res.message };
      }
      return { success: false, error: res.message || 'Failed to update settings' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error updating settings' };
    }
  };

  const institution = settings.institutionProfile || DEFAULT_INSTITUTION_PROFILE;
  const sharePrice = settings.shareRules?.sharePrice || settings.sharePrice || 500;
  const minRequiredShares = settings.shareRules?.minRequiredShares || settings.minRequiredShares || 5;
  const minShareCapital = minRequiredShares * sharePrice;
  const loanMultiplier = settings.loanRules?.savingsMultiplier || settings.loanSavingsMultiplier || 4.0;
  const minMonthlySaving = settings.savingsRules?.regularMinMonthlySaving || settings.regularMinMonthlySaving || 500;
  const registrationFee = settings.registrationFee ?? institution.registrationFee ?? 1000;
  const totalCapitalRequired = registrationFee + minShareCapital + minMonthlySaving;

  const regularYield = settings.savingsRules?.regularInterestRate || 12.5;
  const voluntaryYield = settings.savingsRules?.voluntaryInterestRate || 13.5;
  const timeDepositYield = settings.savingsRules?.timeDepositInterestRates?.months12 || 15.0;

  const defaultLoanRate = settings.loanRules?.defaultInterestRate || settings.defaultLoanInterestRate || 14.0;
  const emergencyLoanRate = 12.0;
  const businessLoanRate = 13.5;
  const assetLoanRate = defaultLoanRate;

  const branches = institution.branchLocations || DEFAULT_INSTITUTION_PROFILE.branchLocations;
  const bankAccounts = institution.bankAccounts || DEFAULT_INSTITUTION_PROFILE.bankAccounts;

  return (
    <SettingsContext.Provider
      value={{
        settings,
        institution,
        isLoading,
        error,
        refreshSettings: fetchSettings,
        updateSettings,
        sharePrice,
        minRequiredShares,
        minShareCapital,
        loanMultiplier,
        minMonthlySaving,
        registrationFee,
        totalCapitalRequired,
        regularYield,
        voluntaryYield,
        timeDepositYield,
        defaultLoanRate,
        emergencyLoanRate,
        businessLoanRate,
        assetLoanRate,
        branches,
        bankAccounts,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
