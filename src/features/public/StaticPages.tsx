import React, { useState } from 'react';
import { useNavigation } from '../../providers/NavigationProvider';
import { useLanguage } from '../../providers/LanguageProvider';
import { useSettings } from '../../providers/SettingsProvider';
import { ROUTES } from '../../constants/routes';
import { Button } from '../../components/common/Button';
import {
  PiggyBank,
  ShieldCheck,
  Check,
  ArrowRight,
  Clock,
  HelpCircle,
  Phone,
  Mail,
  MapPin,
  Building2,
  Users,
  Award,
  Sparkles,
  TrendingUp,
  Landmark,
  Coins,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  Scale,
  Lock,
  Send,
  Search,
  CheckCircle2,
  FileText,
  BadgeCheck,
  AlertCircle,
  Compass,
  HeartHandshake
} from 'lucide-react';
import { THEME } from '../../constants/theme';

// ==========================================
// 1. ABOUT PAGE (ስለ ማህበሩ)
// ==========================================
export const AboutPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { t, isAmharic } = useLanguage();
  const { institution } = useSettings();

  const milestones = [
    {
      year: '2020',
      title: isAmharic ? 'መመስረትና ሕጋዊ ምዝገባ' : 'Foundation & Charter',
      desc: isAmharic
        ? 'በአዲስ አበባ ከተማ በ150 መሥራች አባላት በፌዴራል ኅብረት ሥራ ኤጀንሲ አዋጅ ቁጥር 985/2009 መሠረት በይፋ ተመዘገበ።'
        : 'Officially registered under the Federal Cooperative Agency Proclamation 985/2016 with 150 founding professionals in Addis Ababa.',
    },
    {
      year: '2022',
      title: isAmharic ? 'የአገልግሎትና የዲጂታል መስፋፋት' : 'Branch & Digital Expansion',
      desc: isAmharic
        ? 'አገልግሎቱን ወደ አዳማ፣ ሐዋሳ እና ድሬዳዋ በማስፋፋት የመጀመሪያውን ዘመናዊ ዲጂታል የቁጠባ ደብተር ሥርዓት ተግባራዊ አደረገ።'
        : 'Expanded physical operations to Adama, Hawassa, and Dire Dawa while launching the first-generation digital passbook system.',
    },
    {
      year: '2024',
      title: isAmharic ? 'የ10,000+ አባላት ምዕራፍ' : '10,000+ Member Landmark',
      desc: isAmharic
        ? 'ከ10,000 በላይ ንቁ አባላትን እና ከ150 ሚሊዮን ብር በላይ የቁጠባ ካፒታል በማሰባሰብ ከንጹሕ የውጭ ኦዲት ሪፖርት ጋር አጠናቀቀ።'
        : 'Surpassed 10,000 active members and ETB 150 Million in active member savings portfolio with 100% clean audits.',
    },
    {
      year: '2026',
      title: isAmharic ? 'ዘመናዊ የዲጂታል ባንክ ሥርዓት' : 'Core Banking Modernization',
      desc: isAmharic
        ? 'ባለ ሁለት ደረጃ ፈቃጅና አጽዳቂ (Maker-Checker) የሒሳብ መዝገብ፣ የቀጥታ የባንክ ክፍያ ማረጋገጫና ፈጣን ዲጂታል አገልግሎቶችን አሟላ።'
        : 'Deployed state-of-the-art dual-control ledger architecture, instant CBE/Tsehay reconciliation, and real-time passbook statements.',
    },
  ];

  const boardMembers = [
    {
      name: isAmharic ? 'አቶ ዮሐንስ ኃይለማሪያም' : 'Ato Yohannes Hailemariam',
      role: isAmharic ? 'የሥራ አመራር ቦርድ ሰብሳቢ' : 'Chairman, Board of Directors',
      desc: isAmharic ? 'ከ20 ዓመታት በላይ በኢትዮጵያ ፋይናንስ ዘርፍ ከፍተኛ የአመራር ልምድ ያላቸው።' : 'Over 20 years of executive leadership in Ethiopian banking and financial governance.',
    },
    {
      name: isAmharic ? 'ወ/ሮ ጽጌረዳ ታደሰ' : 'W/ro Tsigereda Tadesse',
      role: isAmharic ? 'የኦዲትና ቁጥጥር ኮሚቴ ሰብሳቢ' : 'Chairperson, Audit & Risk Committee',
      desc: isAmharic ? 'የተመሰከረላቸው የሂሳብና የኦዲት ባለሙያ፣ የውስጥ ቁጥጥር ሥርዓት መሪ።' : 'Certified internal auditor and public accountant leading enterprise risk supervision.',
    },
    {
      name: isAmharic ? 'ዶ/ር በለጠ አበራ' : 'Dr. Belete Abera',
      role: isAmharic ? 'የብድርና ኢንቨስትመንት ኮሚቴ ሰብሳቢ' : 'Head of Credit & Underwriting',
      desc: isAmharic ? 'በኢኮኖሚክስ የዶክትሬት ዲግሪ ያላቸውና በማክሮ ኢኮኖሚ ትንተና የተካኑ።' : 'PhD in Development Economics specializing in cooperative credit underwriting.',
    },
    {
      name: isAmharic ? 'አቶ ዳንኤል ካሳሁን' : 'Ato Daniel Kassahun',
      role: isAmharic ? 'ዋና ሥራ አስፈፃሚ (General Manager)' : 'General Manager & CEO',
      desc: isAmharic ? 'የማህበሩን ዕለታዊ ሥራዎችን፣ የዲጂታል ቴክኖሎጂና የአባላት አገልግሎትን የሚመሩ።' : 'Overseeing day-to-day SACCO operations, digital modernization, and member satisfaction.',
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-16 sm:py-20 text-center border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 space-y-4">
          <span className="px-3.5 py-1.5 rounded-full bg-blue-500/20 text-sky-300 text-xs font-bold border border-blue-500/30">
            {t('about_hero_badge', 'Ethiopian Cooperative Excellence')}
          </span>
          <h1 className="text-3xl sm:text-5xl font-black">
            {isAmharic ? (institution?.amharicName || 'ስለ ዋቢ የገንዘብ ቁጠባና ብድር ኅብረት ሥራ ማህበር') : `About ${institution?.name || 'Wabi SACCO'}`}
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
            {isAmharic ? (institution?.amharicSlogan || 'ፍትሐዊ የሀብት ዕድገትና ዘመናዊ የኅብረት ሥራ ፋይናንስ ለኢትዮጵያ') : (institution?.slogan || 'Empowering Ethiopian communities through transparent member ownership and digital cooperative banking.')}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 py-16 space-y-16">
        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">{t('about_mission_title', 'Our Mission')}</h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              {t('about_mission_desc', 'To provide safe, transparent, and technology-driven savings and credit solutions that foster wealth accumulation, business growth, and financial independence for all members across Ethiopia.')}
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">{t('about_vision_title', 'Our Vision')}</h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              {t('about_vision_desc', 'To be the most trusted, digitally advanced, and financially resilient savings and credit cooperative society in East Africa by 2030.')}
            </p>
          </div>
        </div>

        {/* Regulatory Governance Banner */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{t('legal_compliance', 'Regulatory Compliance')}</span>
            <h3 className="text-xl sm:text-2xl font-bold">{institution?.legalName || 'Wabi Savings and Credit Cooperative Society Ltd.'}</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              {t('legal_compliance_desc', `Officially chartered under License No. ${institution?.licenseNumber || 'ET-COOP/AA/042'} and Federal Cooperative Proclamation 985/2016. Governed by dual-sign-off internal control architecture.`)}
            </p>
          </div>
          <div className="px-6 py-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-center flex-shrink-0">
            <div className="text-xs text-slate-400">{t('license_number_label', 'Official License')}</div>
            <div className="text-lg font-mono font-black text-emerald-400 mt-0.5">{institution?.licenseNumber || 'ET-COOP/AA/042'}</div>
          </div>
        </div>

        {/* Growth Milestones Timeline */}
        <div className="space-y-8">
          <h3 className="text-2xl font-bold text-slate-900 text-center">{t('milestones_title', 'Our Institutional Journey')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {milestones.map((m, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 relative overflow-hidden">
                <div className="text-3xl font-black text-blue-600/20 absolute top-3 right-4 font-mono">{m.year}</div>
                <div className="text-xs font-black px-2.5 py-1 rounded bg-blue-50 text-blue-700 inline-block">{m.year}</div>
                <h4 className="font-bold text-slate-900 text-sm">{m.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Governance Board */}
        <div className="space-y-8">
          <h3 className="text-2xl font-bold text-slate-900 text-center">{t('board_title', 'Leadership & Executive Governance')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {boardMembers.map((b, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-3 shadow-xs">
                <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-slate-200 mx-auto flex items-center justify-center text-slate-700 font-bold text-xl">
                  {b.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{b.name}</h4>
                  <span className="text-xs font-semibold text-blue-600 block mt-0.5">{b.role}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. SAVINGS PRODUCTS PAGE (የቁጠባ ዓይነቶች)
// ==========================================
export const SavingsProductsPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { t, isAmharic } = useLanguage();
  const { regularYield, voluntaryYield, timeDepositYield, minMonthlySaving, loanMultiplier } = useSettings();

  const products = [
    {
      title: isAmharic ? 'መደበኛ የግዴታ ቁጠባ' : 'Compulsory Regular Savings',
      rate: `${regularYield.toFixed(1)}% p.a.`,
      badge: isAmharic ? 'የብድር መነሻ' : 'Core Credit Basis',
      desc: isAmharic
        ? `ለሁሉም የማህበሩ አባላት ግዴታ የሆነ ወርሃዊ ተቀማጭ (ቢያንስ ${minMonthlySaving} ብር በወር)። ለ${loanMultiplier.toFixed(1)}× እጥፍ የብድር ጥያቄ ዋና መያዣ ሆኖ ያገለግላል።`
        : `Mandatory recurring monthly deposit required from every active member. Acts as the primary collateral base for your ${loanMultiplier.toFixed(1)}× loan credit line.`,
      features: isAmharic
        ? [
            `አነስተኛ ወርሃዊ ተቀማጭ፡ ${minMonthlySaving} የኢትዮጵያ ብር`,
            `የ${loanMultiplier.toFixed(1)}× እጥፍ የብድር ማባዣ መብት ያስገኛል`,
            'ዓመታዊ ወለድ በየወሩ ይሰላል',
            'ከ4 ወራት ቆይታ በኋላ ብድር ያስፈቅዳል',
          ]
        : [
            `Minimum monthly deposit: ETB ${minMonthlySaving}.00`,
            `Enables up to ${loanMultiplier.toFixed(1)}× credit multipliers`,
            'Monthly compound interest calculation',
            'Qualifies for loans after 4 consecutive months',
          ],
      color: 'blue',
    },
    {
      title: isAmharic ? 'የፍላጎት ተቀማጭ (ተለዋዋጭ) ቁጠባ' : 'Voluntary Liquid Demand Savings',
      rate: `${voluntaryYield.toFixed(1)}% p.a.`,
      badge: isAmharic ? 'ተለዋዋጭና ከፍተኛ ወለድ' : 'High Liquidity',
      desc: isAmharic
        ? 'በማንኛውም ጊዜ ተጨማሪ ገንዘብ በማስገባት ከፍተኛ ወለድ የሚያገኙበትና በ3 ቀናት ቅድመ ማስታወቂያ ማውጣት የሚችሉበት የቁጠባ ዓይነት።'
        : 'Flexible demand savings for surplus funds. Deposit anytime with higher compound interest yield and withdraw with 3 business days notice.',
      features: isAmharic
        ? [
            'ገደብ የሌለው ተቀማጭ በሲቢኢ ብርና በባንክ',
            `ከባንክ ተራ ቁጠባ የላቀ ${voluntaryYield.toFixed(1)}% ዓመታዊ ወለድ`,
            'በ3 ቀናት ማስታወቂያ ማውጣት ይቻላል',
            'በዲጂታል ፖርታል በቅጽበት መከታተል',
          ]
        : [
            'No ceiling limit on voluntary deposits',
            `Competitive ${voluntaryYield.toFixed(1)}% annual compounding rate`,
            'Withdrawal with standard 3-day notice',
            'Track balance in real-time via digital passbook',
          ],
      color: 'emerald',
    },
    {
      title: isAmharic ? 'የሕፃናት ትምህርት የቁጠባ ፈንድ' : 'Children Educational Savings Fund',
      rate: '14.0% p.a.',
      badge: isAmharic ? 'ለቤተሰብ ዋስትና' : 'Family Wealth',
      desc: isAmharic
        ? 'ለልጆች የወደፊት የከፍተኛ ትምህርት እና የሕይወት መጀመሪያ የተዘጋጀ፣ ከፍተኛ ወለድና ዓመታዊ ጉርሻ ያለው የቁጠባ ዓይነት።'
        : 'Targeted long-term savings designed to finance children\'s university tuition, professional training, and financial head-start.',
      features: isAmharic
        ? [
            'ለልጆች በወላጆች ስም የሚከፈት',
            '14.0% ከፍተኛ ዓመታዊ የተደመረ ወለድ',
            'በዓመታዊ በዓላት ተጨማሪ የቦነስ ወለድ',
            'የሕፃናት ስም በደብተር ላይ ይሰየማል',
          ]
        : [
            'Opened in child\'s legal name under guardian trusteeship',
            '14.0% premium compounded annual return',
            'Annual educational bonus interest credit',
            'Special commemorative certificate of deposit',
          ],
      color: 'amber',
    },
    {
      title: isAmharic ? 'የጊዜ ገደብ የቁጠባ ሠርተፊኬት (Fixed Deposit)' : 'Fixed Time Term Deposit',
      rate: `Up to ${timeDepositYield.toFixed(1)}% p.a.`,
      badge: isAmharic ? 'ከፍተኛ ትርፍ' : 'Maximum Yield',
      desc: isAmharic
        ? 'ከ6 ወራት እስከ 3 ዓመታት ለሚቆይ የተወሰነ ጊዜ የሚቀመጥ ትልቅ ገንዘብ ሲሆን፣ በኢትዮጵያ ውስጥ ከፍተኛውን የቁጠባ ወለድ ያረጋግጣል።'
        : 'High-yield contractual time deposit certificate for institutional and private capital with fixed guaranteed maturity payouts.',
      features: isAmharic
        ? [
            'የቆይታ ጊዜ፡ 6፣ 12፣ 24፣ ወይም 36 ወራት',
            'ከ12.5% እስከ 15.0% የተረጋገጠ ዓመታዊ ወለድ',
            'አነስተኛ መነሻ ተቀማጭ፡ 50,000 ብር',
            'ወለዱን በየሩብ ዓመቱ ወይም በብድር መጨረሻ መቀበል',
          ]
        : [
            'Terms: 6, 12, 24, or 36 months maturity',
            '12.5% to 15.0% guaranteed fixed APR',
            'Minimum principal: ETB 50,000.00',
            'Quarterly interest payouts or compound maturity rollover',
          ],
      color: 'purple',
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-16 sm:py-20 text-center border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 space-y-4">
          <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            {t('savings_hero_badge', 'Guaranteed Compounding Growth')}
          </span>
          <h1 className="text-3xl sm:text-5xl font-black">{t('savings_hero_title', 'Cooperative Savings Products')}</h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
            {t('savings_hero_desc', 'Transparent interest rates, zero hidden ledger maintenance deductions, and full auditability backed by Federal Cooperative laws.')}
          </p>
        </div>
      </section>

      {/* Products Grid */}
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 py-16 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {products.map((p, i) => (
            <div key={i} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-slate-100 text-slate-800 text-xs font-bold rounded-full border border-slate-200">
                    {p.badge}
                  </span>
                  <span className="text-xl font-black text-emerald-600">{p.rate}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">{p.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{p.desc}</p>
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  {p.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate(ROUTES.AUTH.REGISTER)}
                className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold"
              >
                {t('savings_open_btn', 'Open Account')}
              </Button>
            </div>
          ))}
        </div>

        {/* Bank Deposit Clearance Callout */}
        <div className="bg-gradient-to-r from-blue-900 to-sky-900 text-white p-8 rounded-3xl space-y-4">
          <div className="flex items-center gap-3">
            <Landmark className="w-8 h-8 text-sky-300" />
            <h4 className="text-lg font-bold">{t('bank_accounts_title', 'Official Institutional Bank Accounts for Deposits')}</h4>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            {t('bank_accounts_desc', 'Deposit via Commercial Bank of Ethiopia (CBE A/C: 1000123456789) or Tsehay Bank (A/C: 2000987654321). Upload your transaction slip in your portal for instant clearance.')}
          </p>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. LOAN PRODUCTS PAGE (የብድር አገልግሎት)
// ==========================================
export const LoanProductsPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { t, isAmharic } = useLanguage();

  const loans = [
    {
      title: isAmharic ? 'የአስቸኳይ ጊዜ አጭር ብድር' : 'Emergency & Rapid Relief Loan',
      rate: '12.0% APR',
      maxTerm: isAmharic ? 'እስከ 12 ወራት' : 'Up to 12 Months',
      multiplier: '1.5× Savings Base',
      desc: isAmharic
        ? 'ለድንገተኛ የሕክምና፣ የትምህርት ቤት ክፍያ ወይም አጣዳፊ ወጪዎች የተዘጋጀ ፈጣን የብድር ዓይነት (በ24 ሰዓት ውስጥ የሚለቀቅ)።'
        : 'Rapid liquidity disbursed within 24 hours for urgent medical, family, or unforeseen cashflow constraints.',
      requirements: isAmharic
        ? ['ቢያንስ 4 ወራት መደበኛ ቁጠባ', 'የአንድ አባል ዋስትና', 'ፈጣን የ24 ሰዓት ውሳኔ']
        : ['Minimum 4 months active membership', 'Single co-member guarantor', '24-hour rapid disbursement'],
    },
    {
      title: isAmharic ? 'የንግድና ሥራ ማስፋፊያ ብድር' : 'Business Development & SME Loan',
      rate: '13.5% APR',
      maxTerm: isAmharic ? 'እስከ 36 ወራት' : 'Up to 36 Months',
      multiplier: '4.0× Savings Base',
      desc: isAmharic
        ? 'ለንግድ ሥራ ማስጀመሪያ፣ ሸቀጥ መግዣ ወይም የሥራ ማስኬጃ ካፒታል የሚሰጥ የ4.0× እጥፍ ዋና የብድር አገልግሎት።'
        : 'Core 4.0× multiplier credit line providing working capital, inventory expansion, and commercial upgrades.',
      requirements: isAmharic
        ? ['ሙሉ 4.0× የብድር ማባዣ', 'የንግድ ፈቃድ ወይም የስራ እቅድ', 'ሁለት የአባላት ዋስትናዎች']
        : ['Full 4.0× credit multiplier eligible', 'Business license or income verification', 'Two co-member guarantors'],
    },
    {
      title: isAmharic ? 'የቋሚ ንብረትና ተሽከርካሪ ብድር' : 'Asset & Vehicle Financing Facility',
      rate: '14.0% APR',
      maxTerm: isAmharic ? 'እስከ 48 ወራት' : 'Up to 48 Months',
      multiplier: '4.0× Savings Base',
      desc: isAmharic
        ? 'ቤት ለመስራት፣ መሬት ለመግዛት ወይም ተሽከርካሪና ማሽነሪዎችን ለመግዛት የሚሰጥ የረጅም ጊዜ የብድር ዓይነት።'
        : 'Long-term financing for residential home construction, motor vehicle purchases, or commercial equipment acquisition.',
      requirements: isAmharic
        ? ['የፕሮፎርማ ደረሰኝ ማቅረብ', 'እስከ 48 ወራት ወርሃዊ አከፋፈል', 'የንብረቱ ሕጋዊ ሰነድ መያዣ']
        : ['Pro-forma invoice required', 'Up to 48 months amortized schedule', 'Lien or collateral registry'],
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-16 sm:py-20 text-center border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 space-y-4">
          <span className="px-3.5 py-1.5 rounded-full bg-blue-500/20 text-sky-300 text-xs font-bold border border-blue-500/30">
            {t('loans_hero_badge', 'Cooperative Credit Facilities')}
          </span>
          <h1 className="text-3xl sm:text-5xl font-black">{t('loans_hero_title', 'Fair & Transparent Loan Products')}</h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
            {t('loans_hero_desc', 'Empowering member investments through our standard 4.0× credit multiplier with straightforward French amortization.')}
          </p>
        </div>
      </section>

      {/* Credit Covenant Alert */}
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 py-10">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 sm:p-8 flex items-start gap-4 text-blue-900">
          <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm sm:text-base">{t('loan_policy_title', 'Cooperative Credit Covenant: 4-Month Savings Rule')}</h4>
            <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">
              {t('loan_policy_desc', 'To protect cooperative solvency, loan applicants must maintain an active membership with at least 4 consecutive months of regular compulsory savings contributions (min. ETB 500/month). Your approved credit ceiling is calculated as 4.0× your total accumulated compulsory savings.')}
            </p>
          </div>
        </div>

        {/* Loan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
          {loans.map((loan, idx) => (
            <div key={idx} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                    {loan.multiplier}
                  </span>
                  <span className="text-lg font-black text-slate-900">{loan.rate}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{loan.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{loan.desc}</p>
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="text-xs font-bold text-slate-700">
                    {t('loan_max_duration', 'Max Duration:')} <span className="text-blue-600">{loan.maxTerm}</span>
                  </div>
                  {loan.requirements.map((req, rIdx) => (
                    <div key={rIdx} className="flex items-center gap-2 text-xs text-slate-600">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{req}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate(ROUTES.AUTH.LOGIN)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {t('loan_check_eligibility', 'Check Eligibility')}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. MEMBERSHIP INFO PAGE (የአባልነት መስፈርቶች)
// ==========================================
export const MembershipInfoPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { t, isAmharic } = useLanguage();
  const { registrationFee, minRequiredShares, sharePrice, minMonthlySaving, totalCapitalRequired } = useSettings();

  const kycDocs = [
    {
      title: isAmharic ? 'ሕጋዊ የታደሰ መታወቂያ' : 'Valid National ID or Passport',
      desc: isAmharic ? 'የቀበሌ መታወቂያ፣ የኢትዮጵያ ፌዴራል መታወቂያ (Fayda)፣ ወይም የፓስፖርት ኮፒ' : 'Kebele Resident Card, Ethiopian Fayda Digital ID, or valid Passport.',
    },
    {
      title: isAmharic ? '2 የቅርብ ጊዜ ጉርድ ፎቶግራፍ' : 'Two Recent Passport Photographs',
      desc: isAmharic ? 'ለአባልነት ማህደርና ለዲጂታል ደብተር የሚሆን የ3×4 ጉርድ ፎቶ' : 'Clear color photos for physical ledger records and digital verification.',
    },
    {
      title: isAmharic ? 'የሥራ ወይም የገቢ ማስረጃ' : 'Proof of Income / Employment',
      desc: isAmharic ? 'የመሥሪያ ቤት ደብዳቤ፣ የደመወዝ ወረቀት ወይም የንግድ ፈቃድ' : 'Official employer letter, salary slip, or registered commercial trade license.',
    },
    {
      title: isAmharic ? 'የውርስ ወራሽ (Nominee) መረጃ' : 'Designated Legal Nominee Information',
      desc: isAmharic ? 'የወራሽ ሙሉ ስም፣ የስልክ ቁጥርና ሕጋዊ የመታወቂያ መረጃ' : 'Full legal name, phone number, and beneficiary identification for estate records.',
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-16 sm:py-20 text-center border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 space-y-4">
          <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            {t('membership_hero_badge', 'Member Onboarding')}
          </span>
          <h1 className="text-3xl sm:text-5xl font-black">{t('membership_hero_title', 'Membership Requirements & Steps')}</h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
            {t('membership_hero_desc', 'Become a co-owner of Wabi SACCO Society with equal voting rights and institutional dividend participation.')}
          </p>
        </div>
      </section>

      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 py-16 space-y-12">
        {/* Capital Breakdown Table */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-xl font-bold text-slate-900">{t('capital_req_title', 'Mandatory Initial Capital Requirement')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">{t('reg_fee_label', '1. Registration Fee')}</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{registrationFee.toLocaleString()} ETB</div>
              <span className="text-[11px] text-slate-500 block mt-1">{t('reg_fee_sub', 'One-time administrative onboarding fee')}</span>
            </div>
            <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200">
              <span className="text-xs text-blue-700 font-medium">{t('equity_shares_label', '2. Statutory Equity Shares')}</span>
              <div className="text-2xl font-black text-blue-800 mt-1">{(minRequiredShares * sharePrice).toLocaleString()} ETB</div>
              <span className="text-[11px] text-blue-600 block mt-1">
                {t('equity_shares_sub', `${minRequiredShares} Shares @ ETB ${sharePrice} par value (Earns Dividends)`)}
              </span>
            </div>
            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200">
              <span className="text-xs text-emerald-700 font-medium">{t('first_month_savings_label', '3. First Month Savings')}</span>
              <div className="text-2xl font-black text-emerald-800 mt-1">{minMonthlySaving.toLocaleString()} ETB</div>
              <span className="text-[11px] text-emerald-600 block mt-1">{t('first_month_savings_sub', 'Monthly compulsory recurring deposit')}</span>
            </div>
          </div>
          <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold">{t('total_initial_capital', 'Total initial capital required to activate full membership:')}</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400">{totalCapitalRequired.toLocaleString()} ETB</span>
          </div>
        </div>

        {/* KYC Docs */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-900 text-center">{t('kyc_docs_title', 'Required KYC Identification Documents')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {kycDocs.map((doc, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{doc.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{doc.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center pt-4">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate(ROUTES.AUTH.REGISTER)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-10"
          >
            {t('start_reg_btn', 'Start Your Membership Registration')}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 5. CONTACT PAGE (አድራሻና እውቂያ)
// ==========================================
export const ContactPage: React.FC = () => {
  const { t, isAmharic } = useLanguage();
  const { institution, branches, bankAccounts } = useSettings();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', phone: '', email: '', subject: '', message: '' });
    }, 6000);
  };

  const hotline1 = institution?.hotline1 || '+251 978 434 141';
  const hotline2 = institution?.hotline2 || '+251 927 011 111';
  const saccoEmail = institution?.email || 'info@wabisacco.et';
  const headAddress = isAmharic
    ? (institution?.headOfficeAddressAmharic || 'ልደታ ከፍተኛ ፍርድ ቤት ፊት ለፊት፣ ሄለን ህንፃ 3ኛ ፎቅ፣ አዲስ አበባ')
    : (institution?.headOfficeAddress || 'Helen Bldg 3rd Floor, in front of Lideta High Court, Addis Ababa');

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-16 sm:py-20 text-center border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 space-y-4">
          <span className="px-3.5 py-1.5 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold border border-sky-500/30">
            {t('contact_hero_badge', 'Member Support & Branches')}
          </span>
          <h1 className="text-3xl sm:text-5xl font-black">{t('contact_hero_title', 'Contact Wabi SACCO Society')}</h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
            {t('contact_hero_desc', 'Our member service desk and accounting team are available to assist with deposit reconciliations, loan consultations, and general inquiries.')}
          </p>
        </div>
      </section>

      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 py-16 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-xl font-bold text-slate-900">{t('contact_hq_title', 'Headquarters Office')}</h3>
              <div className="space-y-4 text-xs sm:text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-slate-900 block">{isAmharic ? 'ዋናው መሥሪያ ቤት (አድራሻ)' : 'Headquarters Address'}</span>
                    <p className="text-slate-800 font-medium leading-relaxed">
                      {headAddress}
                    </p>
                    <p className="text-xs text-slate-500">
                      {isAmharic ? (institution?.headOfficeAddress || 'Opposite Helen Building, in front of Lideta High Court, 3rd Floor') : (institution?.headOfficeAddressAmharic || 'ልደታ ከፍተኛ ፍርድ ቤት ፊት ለፊት፣ ሄለን ህንፃ ፊት ለፊት፣ 3ኛ ፎቅ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">{t('contact_phone_label', 'Member Services Hotline')}</span>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <a href={`tel:${hotline1.replace(/\s+/g, '')}`} className="text-blue-600 hover:text-blue-800 font-mono font-semibold transition-colors">{hotline1}</a>
                      {hotline2 && (
                        <>
                          <span className="text-slate-400">/</span>
                          <a href={`tel:${hotline2.replace(/\s+/g, '')}`} className="text-blue-600 hover:text-blue-800 font-mono font-semibold transition-colors">{hotline2}</a>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">{t('contact_email_label', 'Official Correspondence')}</span>
                    <a href={`mailto:${saccoEmail}`} className="text-amber-700 hover:text-amber-900 font-medium transition-colors">{saccoEmail}</a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">{t('contact_hours_label', 'Working Hours')}</span>
                    <span>{t('contact_hours_val', 'Mon – Fri: 8:00 AM – 5:00 PM | Saturday: 8:00 AM – 12:30 PM (EAT)')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Deposit Verification accounts */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-3">
              <h4 className="text-sm font-bold text-emerald-400">{t('deposit_channels', 'Authorized Commercial Deposit Channels')}</h4>
              <div className="space-y-2.5 text-xs">
                {bankAccounts && bankAccounts.length > 0 ? (
                  bankAccounts.map((b) => (
                    <div key={b.id || b.accountNumber} className="flex justify-between items-center border-b border-slate-800 pb-2 last:border-0 last:pb-0">
                      <div>
                        <div className="text-slate-200 font-medium flex items-center gap-1.5">
                          {b.bankName}
                          {b.isDefault && (
                            <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1.5 py-0.2 rounded font-bold">
                              PRIMARY
                            </span>
                          )}
                        </div>
                        {b.branch && <div className="text-[10px] text-slate-500">{b.branch}</div>}
                      </div>
                      <span className="font-mono font-bold text-emerald-400 tracking-wider">{b.accountNumber}</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">Commercial Bank of Ethiopia (CBE)</span>
                      <span className="font-mono font-bold text-white">1000123456789</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tsehay Bank</span>
                      <span className="font-mono font-bold text-white">2000987654321</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Inquiry Form */}
          <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-2">{t('contact_form_title', 'Send an Inquiry')}</h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-6">
              {t('contact_form_desc', 'Our support team responds within 1 business day.')}
            </p>

            {submitted ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-900">{t('contact_form_success_title', 'Inquiry Transmitted Successfully')}</h4>
                <p className="text-xs text-emerald-700">
                  {t('contact_form_success_desc', 'Thank you for contacting Wabi SACCO. A member service representative will reach out to you shortly.')}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('contact_form_name', 'Full Legal Name *')}</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('contact_form_phone', 'Phone Number *')}</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+251 9..."
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('contact_form_email', 'Email Address')}</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('contact_form_subject', 'Inquiry Subject *')}</label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('contact_form_message', 'Your Message *')}</label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600"
                  ></textarea>
                </div>

                <Button variant="primary" size="md" type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-bold">
                  {t('contact_form_send_btn', 'Submit Inquiry')}
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Dynamic Branch Locations Section */}
        {branches && branches.length > 0 && (
          <div className="space-y-6 pt-6 border-t border-slate-200">
            <div className="text-center space-y-1">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{t('branch_network', 'Branch & Service Center Network')}</span>
              <h3 className="text-2xl font-black text-slate-900">{t('branch_network_title', 'Visit Our Physical Offices')}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {branches.map((br) => (
                <div key={br.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    {br.isMainBranch && (
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase">
                        Head Office
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{isAmharic ? (br.nameAmharic || br.name) : br.name}</h4>
                    <p className="text-xs text-slate-500 mt-1 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                      <span>{isAmharic ? (br.addressAmharic || br.address) : br.address}</span>
                    </p>
                  </div>
                  {br.phone && (
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-xs text-blue-600 font-mono font-semibold">
                      <Phone className="w-3.5 h-3.5 text-blue-500" />
                      <a href={`tel:${br.phone.replace(/\s+/g, '')}`}>{br.phone}</a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 6. FAQ PAGE (ተደጋጋሚ ጥያቄዎች)
// ==========================================
export const FAQPage: React.FC = () => {
  const { t, isAmharic } = useLanguage();
  const { loanMultiplier, regularYield, voluntaryYield, timeDepositYield, registrationFee, minRequiredShares, sharePrice, minMonthlySaving, totalCapitalRequired, bankAccounts } = useSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const categories = [
    { id: 'ALL', label: t('faq_cat_all', 'ALL') },
    { id: 'SAVINGS', label: t('faq_cat_savings', 'SAVINGS') },
    { id: 'LOANS', label: t('faq_cat_loans', 'LOANS') },
    { id: 'MEMBERSHIP', label: t('faq_cat_membership', 'MEMBERSHIP') },
    { id: 'PAYMENTS', label: t('faq_cat_payments', 'PAYMENTS') },
  ];

  const primaryBank = bankAccounts?.find((b) => b.isDefault) || bankAccounts?.[0];
  const primaryBankText = primaryBank
    ? `${primaryBank.bankName} (${primaryBank.accountNumber})`
    : 'CBE (1000123456789)';

  const allFaqs = [
    {
      cat: 'LOANS',
      q: isAmharic ? `የ${loanMultiplier.toFixed(1)}× እጥፍ የብድር ማባዣ ምጣኔ እንዴት ይሰራል?` : `How does the ${loanMultiplier.toFixed(1)}× loan multiplier work?`,
      a: isAmharic
        ? `አንድ አባል ለ4 ተከታታይ ወራት መደበኛ የግዴታ ቁጠባውን (ቢያንስ ${minMonthlySaving} ብር በወር) ከቆጠበ በኋላ፣ ከተጠራቀመው መደበኛ ቁጠባው እስከ ${loanMultiplier.toFixed(1)} እጥፍ (${loanMultiplier.toFixed(1)}×) ድረስ የብድር ጥያቄ የማቅረብ መብት ያገኛል።`
        : `After 4 consecutive months of regular compulsory contributions (min. ETB ${minMonthlySaving}/month), you can apply for up to ${loanMultiplier.toFixed(1)} times (${loanMultiplier.toFixed(1)}×) your accumulated compulsory regular savings balance, backed by member savings pledges and cooperative guarantor covenants.`,
    },
    {
      cat: 'SAVINGS',
      q: isAmharic ? 'የቁጠባ ወለድ ምጣኔዎች ስንት ናቸው? እንዴትስ ይሰላሉ?' : 'What are the savings interest rates and compounding periods?',
      a: isAmharic
        ? `መደበኛ ቁጠባ ${regularYield.toFixed(1)}%፣ የፍላጎት ተቀማጭ ${voluntaryYield.toFixed(1)}%፣ የሕፃናት ቁጠባ 14.0%፣ እንዲሁም የጊዜ ገደብ ተቀማጭ እስከ ${timeDepositYield.toFixed(1)}% ዓመታዊ ወለድ ያስገኛሉ። ወለዱ በየወሩ በቀሪ ሒሳብ ላይ ይሰላል።`
        : `Compulsory Regular earns ${regularYield.toFixed(1)}% p.a., Voluntary Demand earns ${voluntaryYield.toFixed(1)}% p.a., Children Educational earns 14.0% p.a., and Fixed Term Certificates earn up to ${timeDepositYield.toFixed(1)}% p.a. Interest compounds monthly on average daily balances.`,
    },
    {
      cat: 'MEMBERSHIP',
      q: isAmharic ? 'የአባልነት መመዝገቢያና የአክሲዮን ክፍያዎች ስንት ናቸው?' : 'What are the required membership fees and equity shares?',
      a: isAmharic
        ? `አዲስ አባል ለመሆን ${registrationFee.toLocaleString()} ብር የአንድ ጊዜ የምዝገባ ክፍያ፣ ${(minRequiredShares * sharePrice).toLocaleString()} ብር የ${minRequiredShares} አክሲዮን መግዣ (በ${sharePrice} ብር)፣ እና ${minMonthlySaving} ብር የመጀመሪያ ወር ቁጠባ (በአጠቃላይ ${totalCapitalRequired.toLocaleString()} ብር) ያስፈልጋል።`
        : `Initial activation requires: ETB ${registrationFee.toLocaleString()} (one-time non-refundable registration fee), ETB ${(minRequiredShares * sharePrice).toLocaleString()} (statutory ${minRequiredShares} shares @ ETB ${sharePrice} par value), and ETB ${minMonthlySaving} (first month compulsory deposit) = Total ETB ${totalCapitalRequired.toLocaleString()}.`,
    },
    {
      cat: 'PAYMENTS',
      q: isAmharic ? 'ገንዘብ በባንክ ካስገባሁ በኋላ እንዴት በፖርታል ማረጋገጥ እችላለሁ?' : 'How do I upload and verify my bank deposit slip?',
      a: isAmharic
        ? `በ${primaryBankText} በኩል ገንዘብ ካስገቡ በኋላ፣ የደረሰኝ ፎቶ በማንሳት በፖርታልዎ ላይ "Deposit Funds" በሚለው ክፍል ያስገቡ። በ1 የሥራ ቀን ውስጥ ይረጋገጣል።`
        : `Deposit via ${primaryBankText}, take a photo/screenshot of the bank receipt, and upload it via the "Deposit Funds" module in your Member Portal. The accounting desk clears verified slips within 1 business day.`,
    },
    {
      cat: 'LOANS',
      q: isAmharic ? 'የብድር ዋስትና (Guarantor) መስፈርቶች ምንድን ናቸው?' : 'What are the guarantor requirements for loans?',
      a: isAmharic
        ? 'አነስተኛ ብድሮች የአንድ ንቁ አባል ዋስትና ሲያስፈልጋቸው፣ የንግድና የቋሚ ንብረት ብድሮች የሁለት ንቁ አባላት ወይም ሕጋዊ የንብረት ዋስትና ይፈልጋሉ።'
        : 'Emergency loans require one active co-member guarantor. Business loans and larger credit lines require two verified active members whose own savings pledges support the facility, or registered asset lien documentation.',
    },
    {
      cat: 'SAVINGS',
      q: isAmharic ? 'ከተቀማጭ ገንዘቤ ላይ ማውጣት የምችለው መቼ ነው?' : 'How can I withdraw funds from my savings accounts?',
      a: isAmharic
        ? 'የፍላጎት ተቀማጭ (Voluntary Savings) በ3 የሥራ ቀናት ማስታወቂያ በማንኛውም ጊዜ ማውጣት ይቻላል። መደበኛ የግዴታ ቁጠባ ግን ከአባልነት እስካልተለቀቀ ድረስ ለብድር መያዣነት ተቀምጦ ይቆያል።'
        : 'Voluntary liquid demand savings can be withdrawn with 3 business days written notice. Compulsory regular savings remain preserved as long as membership is active to serve as collateral for credit facilities.',
    },
  ];

  const filtered = allFaqs.filter((f) => {
    const matchesCat = activeCategory === 'ALL' || f.cat === activeCategory;
    const matchesSearch =
      !searchTerm ||
      f.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.a.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-16 sm:py-20 text-center border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 space-y-4">
          <span className="px-3.5 py-1.5 rounded-full bg-blue-500/20 text-sky-300 text-xs font-bold border border-blue-500/30">
            {t('faq_hero_badge', 'Knowledge Base')}
          </span>
          <h1 className="text-3xl sm:text-5xl font-black">{t('faq_hero_title', 'Frequently Asked Questions')}</h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
            {t('faq_hero_desc', 'Everything you need to know about cooperative accounts, loan multipliers, and banking operations.')}
          </p>

          {/* Search bar */}
          <div className="max-w-md mx-auto pt-4 relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-7" />
            <input
              type="text"
              placeholder={t('faq_search_placeholder', 'Search questions (e.g. 4.0x multiplier, CBE deposit, interest)...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-2xl py-3.5 pl-12 pr-4 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-sky-400"
            />
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Accordions */}
        <div className="space-y-4">
          {filtered.map((item, idx) => {
            const isOpen = expandedIndex === idx;
            return (
              <div key={idx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => setExpandedIndex(isOpen ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between font-bold text-slate-900 text-sm sm:text-base hover:bg-slate-50 transition-colors"
                >
                  <span>{item.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-slate-600 text-xs sm:text-sm leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 7. TERMS PAGE (የአጠቃቀምና የአባልነት ደንቦች)
// ==========================================
export const TermsPage: React.FC = () => {
  const { t, isAmharic } = useLanguage();

  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
            {t('terms_badge', 'Institutional By-Laws & Legal Framework')}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
            {t('terms_title', 'Wabi SACCO Terms of Membership & Service')}
          </h1>
          <p className="text-xs text-slate-500">
            {t('terms_version', 'Effective Version: 2026.1 • Approved by the General Assembly & Board of Directors')}
          </p>
        </div>

        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm space-y-8 text-slate-700 text-xs sm:text-sm leading-relaxed">
          <section className="space-y-2">
            <h3 className="text-base font-bold text-slate-900">{t('terms_sec1_title', '1. Membership Qualification & Admission')}</h3>
            <p>
              {isAmharic
                ? 'የዋቢ ሣኮ አባል ለመሆን አመልካቹ ቢያንስ 18 ዓመት የሞላው፣ በኢትዮጵያ ሕግ መሠረት የመዋዋል መብት ያለው፣ የመመዝገቢያ ክፍያ (1,000 ብር) እና ቢያንስ 5 አክሲዮኖችን (2,500 ብር) የገዛ መሆን አለበት።'
                : 'Membership in Wabi Savings and Credit Cooperative Society is open to any Ethiopian citizen aged 18 years or older with full legal contractual capacity. Admission is completed upon payment of the non-refundable registration fee (ETB 1,000) and purchase of the statutory minimum 5 equity shares (ETB 2,500).'}
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-slate-900">{t('terms_sec2_title', '2. Savings Accounts & Interest Accrual')}</h3>
            <p>
              {isAmharic
                ? 'እያንዳንዱ አባል በየወሩ ቢያንስ 500 ብር መደበኛ የግዴታ ቁጠባ የማስገባት ግዴታ አለበት። ወለድ በየወሩ ተሰልቶ በየበጀት ዓመቱ መጨረሻ በይፋ በሂሳብ መዝገብ ላይ ይደመራል።'
                : 'Every registered active member agrees to contribute a minimum monthly compulsory savings deposit of ETB 500.00. Interest is calculated on the average daily ledger balance and credited in accordance with cooperative accounting standards.'}
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-slate-900">{t('terms_sec3_title', '3. Loan Origination & Multiplier Covenants')}</h3>
            <p>
              {isAmharic
                ? 'ብድር ለመጠየቅ አባሉ ቢያንስ ለ4 ተከታታይ ወራት መደበኛ ቁጠባ የቆጠበ መሆን አለበት። የሚፈቀደው የብድር ጣሪያ ከተጠራቀመው መደበኛ ቁጠባ 4.0× እጥፍ ይሆናል። የብድር ክፍያዎች በፈረንሳይኛ ስሌት (French Amortization) መሠረት በወርሃዊ እኩል ክፍፍል ይፈጸማሉ።'
                : 'Loan eligibility requires a minimum of 4 consecutive months of uninterrupted compulsory savings. Credit facilities are strictly capped at 4.0× the accumulated compulsory savings base and repaid through standard monthly French amortized schedules.'}
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-slate-900">{t('terms_sec4_title', '4. Deposit Slip Verification & Audit')}</h3>
            <p>
              {isAmharic
                ? 'በኢትዮጵያ ንግድ ባንክ ወይም በፀሐይ ባንክ በኩል የተደረጉ ተቀማጮች በባንክ ደረሰኝ ማረጋገጫ በኩል በሂሳብ ክፍሉ በ1 የሥራ ቀን ውስጥ ይረጋገጣሉ። የውሸት ደረሰኝ ማቅረብ ከአባልነት ያሰናብታል።'
                : 'Direct bank deposits must be validated with official commercial bank transaction numbers. Falsification of bank deposit receipts constitutes immediate grounds for membership termination and legal restitution.'}
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-slate-900">{t('terms_sec5_title', '5. Termination of Membership')}</h3>
            <p>
              {isAmharic
                ? 'አንድ አባል በራሱ ፍላጎት ከአባልነት ለመልቀቅ የ60 ቀናት የጽሑፍ ማስታወቂያ መስጠት አለበት። ያላለቀ የብድር ወይም የዋስትና እዳ ከሌለበት የቁጠባና የአክሲዮን ካፒታሉ በሙሉ ተመላሽ ይደረግለታል።'
                : 'A member may withdraw from the society upon providing 60 days written notice, provided all outstanding loan obligations and guarantor liabilities are fully settled.'}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 8. PRIVACY PAGE (የግላዊነት ፖሊሲ)
// ==========================================
export const PrivacyPage: React.FC = () => {
  const { t, isAmharic } = useLanguage();

  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
            {t('privacy_badge', 'Data Protection & Privacy Policy')}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
            {t('privacy_title', 'Wabi SACCO Privacy Policy')}
          </h1>
          <p className="text-xs text-slate-500">
            {t('privacy_version', 'Compliance: Ethiopian Federal Data Protection & Financial Privacy Directives')}
          </p>
        </div>

        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm space-y-8 text-slate-700 text-xs sm:text-sm leading-relaxed">
          <section className="space-y-2">
            <h3 className="text-base font-bold text-slate-900">{t('privacy_sec1_title', '1. Information We Collect')}</h3>
            <p>
              {isAmharic
                ? 'ዋቢ ሣኮ የአባላትን ሙሉ ስም፣ የስልክ ቁጥር፣ የኢሜይል አድራሻ፣ የብሔራዊ መታወቂያ ኮፒ፣ የነዋሪነት ማስረጃ እና የባንክ ዝውውር መረጃዎችን በአባልነት ምዝገባ ወቅት ይሰበስባል።'
                : 'We collect member personal identification data including full legal name, national ID/passport copies, residential address proofs, contact phone numbers, employment verifications, and designated nominee records.'}
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-slate-900">{t('privacy_sec2_title', '2. Purpose of Data Processing')}</h3>
            <p>
              {isAmharic
                ? 'የተሰበሰበው መረጃ የቁጠባ ሒሳብ ለማስተዳደር፣ ብድር ለማጽደቅ፣ ሕጋዊ የኦዲት መዛግብትን ለመጠበቅ እና የጠቅላላ ጉባዔ መረጃዎችን ለአባላት ለማድረስ ብቻ ጥቅም ላይ ይውላል።'
                : 'Collected information is processed exclusively for cooperative account maintenance, regulatory credit underwriting, General Assembly voter verification, and statutory audit filings.'}
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-slate-900">{t('privacy_sec3_title', '3. Information Security & Encryption')}</h3>
            <p>
              {isAmharic
                ? 'ሁሉም የአባላት መረጃዎችና የፋይናንስ ዝውውሮች በ256-ቢት TLS ኢንክሪፕሽን የተጠበቁ ሲሆኑ፣ በደህንነታቸው በተጠበቁ ሰርቨሮች ላይ ይመዘገባሉ።'
                : 'All digital member records and financial transaction journals are protected with 256-bit TLS encryption in transit and encrypted storage at rest with strict role-based access controls.'}
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-slate-900">{t('privacy_sec4_title', '4. Third-Party Disclosures')}</h3>
            <p>
              {isAmharic
                ? 'የአባላት መረጃ ለንግድ ማስታወቂያ ወይም ለሦስተኛ ወገን በምንም ዓይነት ሁኔታ አይሸጥም። ለፌዴራል ኅብረት ሥራ ኤጀንሲ እና ለሕጋዊ የፍርድ ቤት ትዕዛዝ ብቻ በሕጉ መሠረት ሊቀርብ ይችላል።'
                : 'We do not sell, license, or monetize member data to third-party commercial marketing entities. Data is only shared with statutory auditors and regulatory authorities as required under Federal Cooperative proclamations.'}
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-slate-900">{t('privacy_sec5_title', '5. Member Rights & Data Access')}</h3>
            <p>
              {isAmharic
                ? 'እያንዳንዱ አባል የራሱን የፋይናንስ መዝገብ፣ የተጠራቀመ ወለድ፣ የብድር ታሪክና የግል መረጃ በዲጂታል ፖርታሉ አማካኝነት በማንኛውም ሰዓት የመመልከትና የማውረድ ሙሉ መብት አለው።'
                : 'Members retain full rights to inspect, review, and download their complete passbook ledgers, audit trails, and KYC documentation at any time through the digital member portal.'}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
