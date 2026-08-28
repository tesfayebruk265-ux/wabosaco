import React, { useState, useEffect } from 'react';
import { useNavigation } from '../../providers/NavigationProvider';
import { useLanguage } from '../../providers/LanguageProvider';
import { useSettings } from '../../providers/SettingsProvider';
import { ROUTES } from '../../constants/routes';
import { Button } from '../../components/common/Button';
import {
  Shield,
  PiggyBank,
  TrendingUp,
  Landmark,
  ArrowRight,
  Sparkles,
  Calculator,
  HelpCircle,
  Coins,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Building2,
  Lock,
  PhoneCall,
  Check,
  Star,
  Users
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { t, isAmharic } = useLanguage();
  const { regularYield, voluntaryYield, timeDepositYield, loanMultiplier, sharePrice, institution } = useSettings();

  // Interactive Calculator State
  const [calcTab, setCalcTab] = useState<'SAVINGS' | 'LOANS'>('SAVINGS');
  const [monthlySavings, setMonthlySavings] = useState<number>(2500);
  const [savingsDurationYears, setSavingsDurationYears] = useState<number>(3);
  const [savingsYieldRate, setSavingsYieldRate] = useState<number>(regularYield);

  const [compulsoryBaseForLoan, setCompulsoryBaseForLoan] = useState<number>(50000);
  const [loanTermMonths, setLoanTermMonths] = useState<number>(24);
  const [loanInterestRate, setLoanInterestRate] = useState<number>(13.5);

  useEffect(() => {
    setSavingsYieldRate(regularYield);
  }, [regularYield]);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Calculations
  const monthlyRate = savingsYieldRate / 100 / 12;
  const totalMonths = savingsDurationYears * 12;
  const totalDeposited = monthlySavings * totalMonths;
  const futureValue =
    monthlyRate > 0
      ? monthlySavings * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate)
      : totalDeposited;
  const totalInterestEarned = Math.max(0, futureValue - totalDeposited);

  // Dynamic Loan Multiplier
  const maxLoanEligible = compulsoryBaseForLoan * loanMultiplier;
  const loanMonthlyRate = loanInterestRate / 100 / 12;
  const monthlyRepayment =
    loanMonthlyRate > 0
      ? (maxLoanEligible * (loanMonthlyRate * Math.pow(1 + loanMonthlyRate, loanTermMonths))) /
        (Math.pow(1 + loanMonthlyRate, loanTermMonths) - 1)
      : maxLoanEligible / loanTermMonths;
  const totalLoanRepaid = monthlyRepayment * loanTermMonths;
  const totalLoanInterest = Math.max(0, totalLoanRepaid - maxLoanEligible);

  const faqs = [
    {
      q: isAmharic
        ? 'የ4.0× እጥፍ የብድር ማባዣ እንዴት ይሰራል?'
        : 'How does the 4.0× credit multiplier work?',
      a: isAmharic
        ? 'አንድ አባል ለ4 ተከታታይ ወራት መደበኛ የግዴታ ቁጠባውን (ቢያንስ 500 ብር በወር) ከቆጠበ በኋላ፣ ከተጠራቀመው መደበኛ ቁጠባው እስከ አራት እጥፍ (4.0×) ድረስ የብድር ጥያቄ የማቅረብ መብት ያገኛል።'
        : 'After maintaining 4 consecutive months of regular compulsory savings, active members qualify to apply for loans up to four times (4.0×) their accumulated compulsory regular savings balance, backed by member savings pledges and cooperative guarantor covenants.',
    },
    {
      q: isAmharic
        ? 'ገንዘብ ወደ ዋቢ ሣኮ ሒሳብ እንዴት ማስገባት እችላለሁ?'
        : 'How do I deposit funds into my Wabi SACCO accounts?',
      a: isAmharic
        ? 'በኢትዮጵያ ንግድ ባንክ (CBE)፣ በሲቢኢ ብር (CBE Birr) ወይም በፀሐይ ባንክ በኩል በቀጥታ ማስገባት ይችላሉ። ገንዘቡን ካስገቡ በኋላ የባንክ ደረሰኝዎን በሞባይል ፎቶ በማንሳት በፖርታልዎ ላይ ሲያስገቡ በ1 የሥራ ቀን ውስጥ ይረጋገጣል።'
        : 'You can deposit directly via Commercial Bank of Ethiopia (CBE) branch transfer, CBE Birr mobile wallet, or Tsehay Bank channels. Once paid, simply upload your bank transaction receipt in your Member Portal for rapid 1-business-day clearance by our accounting team.',
    },
    {
      q: isAmharic
        ? 'የአክሲዮን ካፒታል ዓመታዊ የትርፍ ድርሻ ክፍፍል እንዴት ይሰላል?'
        : 'What is the dividend policy on Equity Shares?',
      a: isAmharic
        ? 'የአክሲዮን ካፒታል (አንድ አክሲዮን 500 ብር) በጠቅላላ ጉባዔው የድምፅ ባለቤትነት መብት የሚሰጥ ሲሆን፣ ማህበሩ በበጀት ዓመቱ መጨረሻ ከሚያገኘው የተጣራ ትርፍ ላይ በሕጉ መሠረት የትርፍ ድርሻ (Dividend) ይከፈላቸዋል።'
        : 'Statutory Equity Shares (par value ETB 500.00 each) confer voting rights in the General Assembly and earn annual dividend distributions derived from net cooperative operational surplus after mandatory statutory reserve allocations.',
    },
    {
      q: isAmharic
        ? 'ዋቢ ሣኮ በኢትዮጵያ ሕጋዊ ፈቃድ ያለው ተቋም ነው?'
        : 'Is Wabi SACCO officially licensed in Ethiopia?',
      a: isAmharic
        ? 'አዎ። ዋቢ ሣኮ በፌዴራል ኅብረት ሥራ ኤጀንሲ በአዋጅ ቁጥር 985/2009 መሠረት በሕግ የተመዘገበና ቁጥጥር የሚደረግበት፣ ሙሉ የኦዲትና የሒሳብ መዝገብ ያለው አስተማማኝ ተቋም ነው።'
        : 'Yes. Wabi SACCO is fully registered and regulated under the Federal Cooperative Proclamation 985/2016 by the Federal Cooperative Agency, operating with verified double-entry General Ledger auditability.',
    },
  ];

  return (
    <div className="flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 pt-10 pb-16 lg:pt-16 lg:pb-24 overflow-hidden">
        {/* Ambient Gradient Flares */}
        <div className="absolute top-0 right-1/4 w-[700px] h-[700px] bg-sky-400/10 dark:bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-[600px] h-[600px] bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 xl:gap-16 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 xl:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#F0FDF4] dark:bg-emerald-950/60 border border-[#BBF7D0] dark:border-emerald-800 text-[#15803D] dark:text-emerald-300 text-xs font-bold rounded-full shadow-xs">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Sparkles className="w-3.5 h-3.5 text-[#16A34A] dark:text-emerald-400" />
                <span>{t('hero_badge', 'Next-Generation Ethiopian Cooperative Banking')}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-slate-950 dark:text-white tracking-tight leading-[1.1]">
                {t('hero_title_prefix', 'Ethical Wealth Growth & Modern')}{' '}
                <span className="text-[#16A34A] dark:text-emerald-400">
                  {t('hero_title_highlight', 'Cooperative Finance')}
                </span>{' '}
                {t('hero_title_suffix', 'for Ethiopia.')}
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl font-normal">
                {t('hero_description', 'Wabi SACCO combines member solidarity with institutional digital rigor. Enjoy competitive compound savings yields (12.5%–15.0%), transparent 4.0× credit multipliers, and real-time digital passbooks — 100% compliant with Federal Cooperative guidelines.')}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate(ROUTES.AUTH.REGISTER)}
                  className="bg-[#16A34A] hover:bg-[#15803D] text-white font-black shadow-lg shadow-[#16A34A]/20 border-0 px-8 py-4 text-base"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  {t('hero_cta_join', 'Join Wabi SACCO')}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => {
                    const el = document.getElementById('calculator-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="font-bold border-[#E2E8F0] dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-[#F0FDF4] dark:hover:bg-slate-800 px-6 py-4 text-base bg-white dark:bg-slate-800"
                  leftIcon={<Calculator className="w-5 h-5 text-[#16A34A] dark:text-emerald-400" />}
                >
                  {t('hero_cta_calc', 'Try Growth Calculator')}
                </Button>
              </div>

              {/* Verified Trust Badges */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-6 max-w-2xl">
                <div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white">{regularYield.toFixed(1)}%–{timeDepositYield.toFixed(1)}%</div>
                  <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold mt-0.5">{t('stat_yield_label', 'Annual Savings Yield')}</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#16A34A] dark:text-emerald-400">{loanMultiplier.toFixed(1)}× Max</div>
                  <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold mt-0.5">{t('stat_mult_label', 'Credit Multiplier')}</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#15803D] dark:text-emerald-500">{sharePrice} ETB</div>
                  <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold mt-0.5">{t('stat_share_label', 'Share Par Value')}</div>
                </div>
              </div>
            </div>

            {/* Right Showcase: Interactive Live Passbook Card */}
            <div className="lg:col-span-5 xl:col-span-5 relative w-full flex justify-center lg:justify-end">
              <div className="relative w-full max-w-lg xl:max-w-xl bg-gradient-to-b from-[#14532D] via-[#0f3d20] to-slate-950 p-6 sm:p-8 rounded-3xl text-white shadow-2xl border border-[#166534]">
                {/* Header of Passbook */}
                <div className="flex items-center justify-between pb-5 border-b border-[#166534]">
                  <div className="flex items-center gap-3">
                    <img
                      src="/logo.png"
                      alt="Wabi SACCO Logo"
                      className="w-11 h-11 rounded-full object-contain bg-white p-0.5 shadow-xs ring-1 ring-white/20"
                    />
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-white leading-tight">
                        {t('passbook_card_title', 'Wabi SACCO Digital Passbook')}
                      </h4>
                      <p className="text-[10px] sm:text-xs text-slate-400 font-mono">ACC-2026-08819</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] sm:text-xs font-extrabold border border-emerald-500/40 uppercase tracking-wider">
                    {t('passbook_verified', 'VERIFIED ACTIVE')}
                  </span>
                </div>

                {/* Balance Display */}
                <div className="py-5 space-y-2">
                  <span className="text-[11px] sm:text-xs text-slate-400 font-medium uppercase tracking-wider">
                    {t('passbook_accumulated_bal', 'Total Accumulated Balance')}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                      128,450.00
                    </span>
                    <span className="text-sm sm:text-base font-bold text-emerald-400">ETB</span>
                  </div>
                </div>

                {/* Sub balances breakdown */}
                <div className="grid grid-cols-2 gap-3.5 py-4 border-y border-slate-800/80">
                  <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] sm:text-xs text-slate-400 block font-medium">
                      {t('passbook_compulsory_bal', 'Regular Compulsory')}
                    </span>
                    <span className="text-sm sm:text-base font-bold text-slate-200">84,000 ETB</span>
                    <span className="text-[9px] sm:text-[10px] text-emerald-400 block mt-0.5">+{regularYield.toFixed(1)}% p.a.</span>
                  </div>
                  <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] sm:text-xs text-slate-400 block font-medium">
                      {t('passbook_voluntary_bal', 'Voluntary Demand')}
                    </span>
                    <span className="text-sm sm:text-base font-bold text-slate-200">44,450 ETB</span>
                    <span className="text-[9px] sm:text-[10px] text-sky-400 block mt-0.5">+{voluntaryYield.toFixed(1)}% p.a.</span>
                  </div>
                </div>

                {/* Shares and Loan limit pills */}
                <div className="pt-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-amber-400" />
                      {t('passbook_shares_title', `Equity Shares (Par ${sharePrice})`)}
                    </span>
                    <span className="font-bold text-amber-300">20 Shares ({(20 * sharePrice).toLocaleString()} ETB)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm bg-emerald-950/40 p-3 rounded-xl border border-emerald-800/50">
                    <span className="text-emerald-300 flex items-center gap-1.5 font-semibold">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      {t('passbook_credit_limit_title', `${loanMultiplier.toFixed(1)}× Credit Limit`)}
                    </span>
                    <span className="font-black text-emerald-400">{(84000 * loanMultiplier).toLocaleString()} ETB</span>
                  </div>
                </div>

                {/* Button inside card */}
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.AUTH.LOGIN)}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    <span>{t('passbook_login_btn', 'Sign In to Your Member Portal')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE FINANCIAL MODELING CALCULATOR */}
      <section id="calculator-section" className="py-16 sm:py-24 bg-slate-100/70 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded-full text-xs font-black uppercase tracking-wider">
              <Calculator className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
              {t('calc_badge', 'Interactive Financial Modeling Tool')}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('calc_title', 'Calculate Your Growth & Loan Eligibility')}
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
              {t('calc_desc', 'Experience the mathematical power of cooperative compounding and our 4.0× credit multiplier.')}
            </p>

            {/* Toggle Tabs */}
            <div className="pt-4 flex justify-center">
              <div className="inline-flex p-1.5 bg-slate-200/80 dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setCalcTab('SAVINGS')}
                  className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                    calcTab === 'SAVINGS'
                      ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t('calc_tab_savings', 'Compound Savings Growth')}
                </button>
                <button
                  type="button"
                  onClick={() => setCalcTab('LOANS')}
                  className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                    calcTab === 'LOANS'
                      ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t('calc_tab_loans', `${loanMultiplier.toFixed(1)}× Loan Multiplier & Repayment`)}
                </button>
              </div>
            </div>
          </div>

          {/* Calculator Body */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl overflow-hidden p-6 sm:p-10 lg:p-12">
            {calcTab === 'SAVINGS' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center">
                {/* Sliders on Left */}
                <div className="lg:col-span-7 space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                        {t('calc_monthly_contrib', 'Monthly Contribution (ETB)')}
                      </label>
                      <span className="text-sm sm:text-base font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                        {monthlySavings.toLocaleString()} ETB / mo
                      </span>
                    </div>
                    <input
                      type="range"
                      min={500}
                      max={25000}
                      step={250}
                      value={monthlySavings}
                      onChange={(e) => setMonthlySavings(Number(e.target.value))}
                      className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[11px] sm:text-xs text-slate-400 mt-1 font-medium">
                      <span>500 ETB</span>
                      <span>10,000 ETB</span>
                      <span>25,000 ETB</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                        {t('calc_savings_duration', 'Savings Duration (Years)')}
                      </label>
                      <span className="text-sm sm:text-base font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                        {savingsDurationYears} {isAmharic ? 'ዓመታት' : 'Years'} ({totalMonths} {isAmharic ? 'ወራት' : 'Months'})
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={1}
                      value={savingsDurationYears}
                      onChange={(e) => setSavingsDurationYears(Number(e.target.value))}
                      className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[11px] sm:text-xs text-slate-400 mt-1 font-medium">
                      <span>1 {isAmharic ? 'ዓመት' : 'Year'}</span>
                      <span>5 {isAmharic ? 'ዓመታት' : 'Years'}</span>
                      <span>10 {isAmharic ? 'ዓመታት' : 'Years'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 block mb-2">
                      {t('calc_scheme_label', 'Savings Product Scheme')}
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: t('calc_scheme_regular', `Regular (${regularYield.toFixed(1)}%)`), rate: regularYield },
                        { label: t('calc_scheme_voluntary', `Voluntary (${voluntaryYield.toFixed(1)}%)`), rate: voluntaryYield },
                        { label: t('calc_scheme_fixed', `Fixed Term (${timeDepositYield.toFixed(1)}%)`), rate: timeDepositYield },
                      ].map((scheme) => (
                        <button
                          key={scheme.label}
                          type="button"
                          onClick={() => setSavingsYieldRate(scheme.rate)}
                          className={`p-3 rounded-xl text-xs sm:text-sm font-bold border text-center transition-all cursor-pointer ${
                            savingsYieldRate === scheme.rate
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {scheme.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Results Card on Right */}
                <div className="lg:col-span-5 bg-gradient-to-br from-blue-900 via-slate-900 to-slate-950 text-white p-6 sm:p-8 lg:p-10 rounded-3xl shadow-xl space-y-6">
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-sky-400 uppercase tracking-wider block mb-1">
                      {t('calc_proj_maturity', 'Projected Maturity Value')}
                    </span>
                    <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                      {Math.round(futureValue).toLocaleString()} <span className="text-xl sm:text-2xl font-bold text-emerald-400">ETB</span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-800 text-xs sm:text-sm">
                    <div className="flex justify-between items-center text-slate-300">
                      <span>{t('calc_total_deposited', 'Total Principal Deposited:')}</span>
                      <span className="font-bold text-white">{totalDeposited.toLocaleString()} ETB</span>
                    </div>
                    <div className="flex justify-between items-center text-emerald-400 font-bold">
                      <span>{t('calc_interest_gain', 'Compound Interest Gain:')}</span>
                      <span>+{Math.round(totalInterestEarned).toLocaleString()} ETB</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                      <span>{t('calc_effective_growth', 'Effective Growth:')}</span>
                      <span className="font-bold text-sky-300">
                        +{((totalInterestEarned / (totalDeposited || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => navigate(ROUTES.AUTH.REGISTER)}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold"
                  >
                    {t('calc_start_saving_btn', 'Start Saving Today')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center">
                {/* Sliders on Left */}
                <div className="lg:col-span-7 space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                        {t('calc_loan_base', 'Compulsory Savings Base (ETB)')}
                      </label>
                      <span className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        {compulsoryBaseForLoan.toLocaleString()} ETB
                      </span>
                    </div>
                    <input
                      type="range"
                      min={5000}
                      max={200000}
                      step={5000}
                      value={compulsoryBaseForLoan}
                      onChange={(e) => setCompulsoryBaseForLoan(Number(e.target.value))}
                      className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                    <div className="flex justify-between text-[11px] sm:text-xs text-slate-400 mt-1 font-medium">
                      <span>5,000 ETB</span>
                      <span>100,000 ETB</span>
                      <span>200,000 ETB</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                        {t('calc_loan_term', 'Repayment Duration (Months)')}
                      </label>
                      <span className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        {loanTermMonths} {isAmharic ? 'ወራት' : 'Months'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={6}
                      max={48}
                      step={6}
                      value={loanTermMonths}
                      onChange={(e) => setLoanTermMonths(Number(e.target.value))}
                      className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                    <div className="flex justify-between text-[11px] sm:text-xs text-slate-400 mt-1 font-medium">
                      <span>6 {isAmharic ? 'ወራት' : 'Months'}</span>
                      <span>24 {isAmharic ? 'ወራት' : 'Months'}</span>
                      <span>48 {isAmharic ? 'ወራት' : 'Months'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 block mb-2">
                      {t('calc_loan_category', 'Loan Category')}
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: t('calc_loan_cat_emergency', 'Emergency (12.0%)'), rate: 12.0 },
                        { label: t('calc_loan_cat_business', 'Business (13.5%)'), rate: 13.5 },
                        { label: t('calc_loan_cat_asset', 'Asset/Vehicle (14.0%)'), rate: 14.0 },
                      ].map((cat) => (
                        <button
                          key={cat.rate}
                          type="button"
                          onClick={() => setLoanInterestRate(cat.rate)}
                          className={`p-3 rounded-xl text-xs sm:text-sm font-bold border text-center transition-all cursor-pointer ${
                            loanInterestRate === cat.rate
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Results Card on Right */}
                <div className="lg:col-span-5 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white p-6 sm:p-8 lg:p-10 rounded-3xl shadow-xl space-y-6">
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                      {t('calc_loan_multiplier_result', `Eligible Credit Multiplier (${loanMultiplier.toFixed(1)}×)`)}
                    </span>
                    <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                      {maxLoanEligible.toLocaleString()} <span className="text-xl sm:text-2xl font-bold text-emerald-400">ETB</span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-800 text-xs sm:text-sm">
                    <div className="flex justify-between items-center text-slate-300">
                      <span>{t('calc_loan_monthly_inst', 'Monthly Amortized Installment:')}</span>
                      <span className="font-bold text-white">{Math.round(monthlyRepayment).toLocaleString()} ETB / mo</span>
                    </div>
                    <div className="flex justify-between items-center text-amber-400 font-bold">
                      <span>{t('calc_loan_total_interest', 'Total Interest Payable:')}</span>
                      <span>{Math.round(totalLoanInterest).toLocaleString()} ETB</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                      <span>{t('calc_loan_req_months', 'Required Savings Months:')}</span>
                      <span className="font-bold text-emerald-300">{isAmharic ? '4 ወራት' : '4 Months'} (Min. 500 ETB)</span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => navigate(ROUTES.PUBLIC.LOANS)}
                    className="w-full bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white font-bold"
                  >
                    {t('calc_loan_view_guide_btn', 'View Loan Guidelines')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. FOUR PILLARS OF INSTITUTIONAL RIGOR */}
      <section className="py-16 sm:py-24 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              {isAmharic ? 'የማህበሩ መርሆዎች' : 'Institutional Foundations'}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('pillars_title', 'Four Pillars of Financial Security')}
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
              {t('pillars_desc', 'Designed with strict cooperative principles, dual-control governance, and transparent interest accruals.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8">
            <div className="p-7 sm:p-8 bg-slate-50 dark:bg-slate-800/80 rounded-3xl border border-slate-200/80 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-lg transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold shadow-xs">
                <PiggyBank className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('pillar_1_title', 'Compulsory Regular Savings')}</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('pillar_1_desc', 'Mandatory monthly deposits (min. ETB 500) that serve as your foundational collateral for 4.0× credit multipliers.')}
              </p>
            </div>

            <div className="p-7 sm:p-8 bg-slate-50 dark:bg-slate-800/80 rounded-3xl border border-slate-200/80 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-500 hover:shadow-lg transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold shadow-xs">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('pillar_2_title', 'Voluntary Liquid Savings')}</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('pillar_2_desc', 'High-yield flexible demand savings. Deposit anytime via CBE Birr or Tsehay Bank with 3-day liquidity notice protection.')}
              </p>
            </div>

            <div className="p-7 sm:p-8 bg-slate-50 dark:bg-slate-800/80 rounded-3xl border border-slate-200/80 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-500 hover:shadow-lg transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold shadow-xs">
                <Landmark className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('pillar_3_title', 'Affordable Credit Lines')}</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('pillar_3_desc', 'Low-interest emergency, business development, and asset loans with transparent French amortization schedules.')}
              </p>
            </div>

            <div className="p-7 sm:p-8 bg-slate-50 dark:bg-slate-800/80 rounded-3xl border border-slate-200/80 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-500 hover:shadow-lg transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold shadow-xs">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('pillar_4_title', 'Double-Entry Ledger')}</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('pillar_4_desc', 'Immutable General Ledger journals and full maker-checker dual authorization protecting all institutional funds.')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ONBOARDING ROADMAP */}
      <section className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
              {isAmharic ? 'የምዝገባ ቅደም ተከተል' : 'Instant Enrollment'}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('onboarding_title', 'Join in Three Seamless Steps')}
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
              {t('onboarding_desc', 'Digital membership registration without long branch queues.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 xl:gap-10 relative">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white font-black text-base flex items-center justify-center mb-6 shadow-md shadow-blue-600/20">
                1
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">{t('onboarding_step1_title', 'Submit Online KYC Registration')}</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('onboarding_step1_desc', 'Provide your National ID / Passport, Kebele residence information, employer details, and designated nominees via our secure form.')}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white font-black text-base flex items-center justify-center mb-6 shadow-md shadow-emerald-600/20">
                2
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">{t('onboarding_step2_title', 'Deposit Initial Shares & Fee')}</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('onboarding_step2_desc', 'Deposit the registration fee (ETB 1,000) and statutory minimum shares (5 shares @ ETB 500 = ETB 2,500) via CBE or Tsehay Bank slip.')}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-2xl bg-sky-600 text-white font-black text-base flex items-center justify-center mb-6 shadow-md shadow-sky-600/20">
                3
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">{t('onboarding_step3_title', 'Access Portal & 4.0× Loans')}</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('onboarding_step3_desc', 'Receive instant portal credentials, download signed digital passbooks, track daily interest accruals, and apply for loan multipliers.')}
              </p>
            </div>
          </div>

          <div className="mt-14 text-center">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate(ROUTES.AUTH.REGISTER)}
              className="bg-[#16A34A] hover:bg-[#15803D] text-white font-bold px-10 py-4 text-base shadow-lg shadow-[#16A34A]/20"
            >
              {t('onboarding_cta_btn', 'Start Member Registration Now')}
            </Button>
          </div>
        </div>
      </section>

      {/* 5. FREQUENTLY ASKED QUESTIONS */}
      <section className="py-16 sm:py-24 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 lg:px-12">
          <div className="text-center mb-14 space-y-3">
            <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest">
              {t('faq_hero_badge', 'Knowledge Base')}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('faq_heading', 'Frequently Asked Questions')}
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
              {t('faq_subheading', 'Clear, transparent answers on membership covenants, credit policies, and deposit clearances.')}
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all duration-200 bg-slate-50/50 dark:bg-slate-800/50"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between font-bold text-slate-900 dark:text-white text-sm sm:text-base hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed border-t border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-900">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION BANNER */}
      <section className="relative py-16 sm:py-24 bg-gradient-to-r from-blue-900 via-slate-900 to-slate-950 text-white overflow-hidden">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 text-center relative z-10 space-y-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-extrabold border border-emerald-500/30">
              <Users className="w-3.5 h-3.5" />
              <span>{t('cta_banner_active_members', 'Over 15,000+ Active Members Across Ethiopia')}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              {t('cta_banner_title', 'Build Your Financial Future with Wabi SACCO Society Today.')}
            </h2>

            <p className="text-slate-300 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed">
              {t('cta_banner_desc', 'Join the cooperative movement that puts member growth, ethical interest returns, and digital transparency first.')}
            </p>

            <div className="pt-4 flex flex-wrap justify-center gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate(ROUTES.AUTH.REGISTER)}
                className="bg-[#16A34A] hover:bg-[#15803D] text-white font-black px-10 py-4 text-base shadow-xl"
              >
                {t('cta_banner_open_btn', 'Open Your Member Account')}
              </Button>
              <Button
                variant="dark"
                size="lg"
                onClick={() => navigate(ROUTES.PUBLIC.CONTACT)}
                className="font-bold border-slate-700 text-white hover:bg-slate-800 px-10 py-4 text-base bg-slate-900/90 hover:border-slate-500 shadow-md"
              >
                {t('cta_banner_contact_btn', 'Contact Head Office')}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
