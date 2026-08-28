import React from 'react';
import { useNavigation } from '../../providers/NavigationProvider';
import { useAuth } from '../../providers/AuthProvider';
import { useLanguage, LanguageSwitcher } from '../../providers/LanguageProvider';
import { useSettings } from '../../providers/SettingsProvider';
import { ThemeToggle } from '../../providers/ThemeProvider';
import { PUBLIC_NAV_ITEMS } from '../../constants/navigation';
import { ROUTES } from '../../constants/routes';
import { THEME } from '../../constants/theme';
import { Button } from '../common/Button';
import {
  Shield,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Menu,
  X,
  Sparkles,
  Building2,
  Lock,
  CheckCircle2,
  ChevronRight,
  Send,
  Globe
} from 'lucide-react';
import { cn } from '../../utils/cn';

export const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentPath, navigate } = useNavigation();
  const { user } = useAuth();
  const { t, isAmharic, language } = useLanguage();
  const { institution, sharePrice } = useSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [subscriberEmail, setSubscriberEmail] = React.useState('');
  const [isSubscribed, setIsSubscribed] = React.useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (subscriberEmail) {
      setIsSubscribed(true);
      setTimeout(() => setIsSubscribed(false), 5000);
      setSubscriberEmail('');
    }
  };

  // Translated public navigation items
  const navItems = [
    { id: 'home', label: t('home', 'Home'), href: ROUTES.PUBLIC.HOME },
    { id: 'about', label: t('about', 'About Us'), href: ROUTES.PUBLIC.ABOUT },
    { id: 'savings', label: t('savings', 'Savings Products'), href: ROUTES.PUBLIC.SAVINGS },
    { id: 'loans', label: t('loans', 'Loan Products'), href: ROUTES.PUBLIC.LOANS },
    { id: 'membership', label: t('membership', 'Membership'), href: ROUTES.PUBLIC.MEMBERSHIP },
    { id: 'contact', label: t('contact', 'Contact'), href: ROUTES.PUBLIC.CONTACT },
    { id: 'faq', label: t('faq', 'FAQ'), href: ROUTES.PUBLIC.FAQ },
  ];

  const hotline1 = institution?.hotline1 || '+251 978 434 141';
  const hotline2 = institution?.hotline2 || '+251 927 011 111';
  const saccoEmail = institution?.email || 'info@wabisacco.et';
  const saccoName = isAmharic ? (institution?.amharicName || 'ዋቢ ሳኮ') : (institution?.name || 'Wabi SACCO');
  const headAddress = isAmharic
    ? (institution?.headOfficeAddressAmharic || 'ልደታ ከፍተኛ ፍርድ ቤት ፊት ለፊት፣ ሄለን ህንፃ 3ኛ ፎቅ፣ አዲስ አበባ')
    : (institution?.headOfficeAddress || 'Helen Bldg 3rd Floor, in front of Lideta High Court, Addis Ababa');
  const legalName = isAmharic
    ? (institution?.legalNameAmharic || 'የዋቢ የገንዘብ ቁጠባና ብድር ኅብረት ሥራ ማህበር ኃ/የተ/የግ/ማ')
    : (institution?.legalName || 'Wabi Savings and Credit Cooperative Society Ltd.');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-600 selection:text-white antialiased transition-colors duration-200">
      {/* Top Advisory Banner */}
      <div className="bg-slate-950 text-slate-300 text-xs py-2 px-4 sm:px-8 border-b border-slate-800/80 relative z-40 overflow-hidden">
        <div className="w-full max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3 px-2 sm:px-4 lg:px-8">
          {/* Left: Contact Hotlines */}
          <div className="flex items-center gap-2 text-slate-300 font-medium">
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <a href={`tel:${hotline1.replace(/\s+/g, '')}`} className="hover:text-white transition-colors">{hotline1}</a>
            {hotline2 && (
              <>
                <span className="text-slate-600">/</span>
                <a href={`tel:${hotline2.replace(/\s+/g, '')}`} className="hover:text-white transition-colors">{hotline2}</a>
              </>
            )}
          </div>

          {/* Right: Core Share Par Value, Language Switcher, Theme Switch */}
          <div className="flex items-center gap-3 sm:gap-4 text-xs font-medium ml-auto">
            <span className="text-amber-400 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              {t('par_value_badge', `Core Share Par Value: ETB ${sharePrice.toFixed(2)}`)}
            </span>

            {/* Language Switcher & Dark Mode Toggle */}
            <div className="flex items-center gap-1.5">
              <LanguageSwitcher variant="pill" className="scale-90 origin-right" />
              <ThemeToggle variant="icon" className="text-slate-300 hover:text-white hover:bg-slate-800 p-1.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Glassmorphic Navigation Header */}
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-30 shadow-xs transition-colors duration-200">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <div
            onClick={() => navigate(ROUTES.PUBLIC.HOME)}
            className="flex items-center gap-3.5 cursor-pointer group select-none"
          >
            <div className="relative">
              <img
                src="/logo.png"
                alt="Wabi SACCO Logo"
                className="w-12 h-12 rounded-full object-contain bg-white p-0.5 shadow-md ring-2 ring-emerald-500/20 group-hover:scale-105 transition-all duration-300"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#22C55E] rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black text-[#0F172A] dark:text-white tracking-tight group-hover:text-[#16A34A] dark:group-hover:text-emerald-400 transition-colors">
                  {t('app_name', THEME.institution.name)}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F0FDF4] dark:bg-emerald-950/60 text-[#15803D] dark:text-emerald-300 border border-[#BBF7D0] dark:border-emerald-800 uppercase">
                  SACCO
                </span>
              </div>
              <p className="text-[11px] text-[#475569] dark:text-slate-400 font-semibold tracking-wider">
                {isAmharic ? 'የገንዘብ ቁጠባና ብድር ኅብረት ሥራ ማህበር' : 'Cooperative Financial Society'}
              </p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center space-x-1 bg-[#F1F5F9] dark:bg-slate-800/70 p-1.5 rounded-xl border border-[#E2E8F0] dark:border-slate-700/70">
            {navItems.map((item) => {
              const isActive = currentPath === item.href;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.href)}
                  className={cn(
                    'px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer',
                    isActive
                      ? 'text-[#16A34A] dark:text-emerald-300 bg-white dark:bg-slate-700 shadow-xs font-extrabold'
                      : 'text-[#475569] dark:text-slate-300 hover:text-[#0F172A] dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/50'
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Quick Actions & Dark Mode Toggle */}
          <div className="flex items-center gap-2">
            <ThemeToggle variant="icon" className="hidden sm:inline-flex" />

            {/* Auth Buttons: Clear Sign In and Sign Up (Open Account) */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(ROUTES.AUTH.LOGIN)}
              className="font-bold border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Lock className="w-3.5 h-3.5 mr-1 text-[#16A34A] dark:text-emerald-400" />
              {t('login', 'Sign In')}
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(ROUTES.AUTH.REGISTER)}
              className="bg-[#16A34A] hover:bg-[#15803D] text-white shadow-sm font-bold"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-100" />
              {t('register', 'Sign Up')}
            </Button>

            {/* Active Session Portal Shortcut */}
            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (user.role === 'MEMBER') navigate(ROUTES.MEMBER.DASHBOARD);
                  else if (user.role === 'ADMIN') navigate(ROUTES.STAFF.ADMIN_DASHBOARD);
                  else if (user.role === 'MANAGER') navigate(ROUTES.STAFF.MANAGER_DASHBOARD);
                  else if (user.role === 'ACCOUNTANT') navigate(ROUTES.STAFF.ACCOUNTANT_DASHBOARD);
                  else if (user.role === 'AUDITOR') navigate(ROUTES.STAFF.AUDITOR_DASHBOARD);
                  else if (user.role === 'CUSTOMER_SERVICE') navigate(ROUTES.STAFF.CS_DASHBOARD);
                  else navigate(ROUTES.PUBLIC.HOME);
                }}
                className="hidden xl:inline-flex border-emerald-600/40 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/40 font-bold"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                {user.role === 'MEMBER' ? t('member_portal', 'My Portal') : t('staff_portal', 'Staff Portal')}
              </Button>
            )}

            {/* Mobile hamburger menu */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-3 shadow-xl animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 px-1">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-emerald-600" />
                {isAmharic ? 'ቋንቋ ይምረጡ' : 'Select Language'}
              </span>
              <LanguageSwitcher variant="pill" />
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 px-1">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {isAmharic ? 'ገጽታ' : 'Theme Mode'}
              </span>
              <ThemeToggle variant="segmented" showLabel />
            </div>

            <div className="grid grid-cols-1 gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    navigate(item.href);
                    setMobileMenuOpen(false);
                  }}
                  className={cn(
                    'w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold flex items-center justify-between transition-colors',
                    currentPath === item.href
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-sky-300 border border-blue-100 dark:border-blue-900/60'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  )}
                >
                  <span>{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              ))}
            </div>

            {/* Mobile Auth Buttons */}
            <div className="pt-2 grid grid-cols-2 gap-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  navigate(ROUTES.AUTH.LOGIN);
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-center font-bold"
              >
                <Lock className="w-3.5 h-3.5 mr-1 text-[#16A34A]" />
                {t('login', 'Sign In')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  navigate(ROUTES.AUTH.REGISTER);
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                {t('register', 'Sign Up')}
              </Button>
            </div>

            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (user.role === 'MEMBER') navigate(ROUTES.MEMBER.DASHBOARD);
                  else if (user.role === 'ADMIN') navigate(ROUTES.STAFF.ADMIN_DASHBOARD);
                  else navigate(ROUTES.STAFF.MANAGER_DASHBOARD);
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-center border-emerald-600/40 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/40 font-bold"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                {user.role === 'MEMBER' ? t('member_portal', 'Open Member Portal') : t('staff_portal', 'Open Staff Portal')}
              </Button>
            )}
          </div>
        )}
      </header>

      {/* Main Public Page Body */}
      <main className="flex-1 w-full">{children}</main>

      {/* Institutional Enterprise Footer */}
      <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800/80 relative overflow-hidden">
        {/* Ambient Backing Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 pt-16 pb-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
            {/* Column 1: Brand & Identity */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="Wabi SACCO Logo"
                  className="w-11 h-11 rounded-full object-contain bg-white p-0.5 shadow-md ring-1 ring-white/20"
                />
                <div>
                  <span className="text-lg font-black text-white tracking-tight">{t('app_name', THEME.institution.name)}</span>
                  <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                    {t('app_legal_name', 'Savings & Credit Cooperative Society Ltd.')}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                {t('footer_desc', 'Wabi Savings and Credit Cooperative Society (SACCO) is a member-owned, licensed, and regulated financial institution committed to ethical savings compounding, 4.0× credit access, and modern digital passbooks.')}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 font-bold text-[11px] flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isAmharic ? 'የፈቃድ ቁጥር፡ ET-COOP/AA/042' : 'Licensed SACCO No. ET-COOP/AA/042'}</span>
                </div>
                <LanguageSwitcher variant="compact" />
              </div>
            </div>

            {/* Column 2: Financial Products */}
            <div>
              <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-emerald-500 pl-2">
                {t('financial_products', 'Financial Products')}
              </h5>
              <ul className="space-y-2.5 font-medium">
                <li>
                  <button
                    onClick={() => navigate(ROUTES.PUBLIC.SAVINGS)}
                    className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 text-left"
                  >
                    <span>{isAmharic ? 'መደበኛ የግዴታ ቁጠባ (12.5%)' : 'Compulsory Regular (12.5%)'}</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate(ROUTES.PUBLIC.SAVINGS)}
                    className="hover:text-emerald-400 transition-colors text-left"
                  >
                    {isAmharic ? 'የፍላጎት ተቀማጭ ቁጠባ (13.5%)' : 'Voluntary Liquid Savings (13.5%)'}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate(ROUTES.PUBLIC.SAVINGS)}
                    className="hover:text-emerald-400 transition-colors text-left"
                  >
                    {isAmharic ? 'የሕፃናት ትምህርት ፈንድ (14.0%)' : 'Children Educational Fund (14.0%)'}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate(ROUTES.PUBLIC.SAVINGS)}
                    className="hover:text-emerald-400 transition-colors text-left"
                  >
                    {isAmharic ? 'የጊዜ ገደብ ተቀማጭ (እስከ 15.0%)' : 'Fixed Time Deposits (Up to 15.0%)'}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate(ROUTES.PUBLIC.LOANS)}
                    className="hover:text-emerald-400 transition-colors text-left"
                  >
                    {isAmharic ? 'የ4.0× እጥፍ የብድር አገልግሎት' : '4.0× Credit Multiplier Loans'}
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Governance & Members */}
            <div>
              <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-sky-500 pl-2">
                {isAmharic ? 'የኅብረት ሥራ አመራር' : 'Co-op Governance'}
              </h5>
              <ul className="space-y-2.5 font-medium">
                <li>
                  <button
                    onClick={() => navigate(ROUTES.PUBLIC.MEMBERSHIP)}
                    className="hover:text-sky-400 transition-colors text-left"
                  >
                    {t('membership', 'Membership Onboarding')}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate(ROUTES.PUBLIC.ABOUT)}
                    className="hover:text-sky-400 transition-colors text-left"
                  >
                    {isAmharic ? 'መተዳደሪያ ደንብና የቦርድ ቻርተር' : 'By-Laws & Board Charter'}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate(ROUTES.PUBLIC.FAQ)}
                    className="hover:text-sky-400 transition-colors text-left"
                  >
                    {isAmharic ? 'የትርፍ ድርሻ ስሌት ደንቦች' : 'Dividend Calculation Rules'}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate(ROUTES.PUBLIC.TERMS)}
                    className="hover:text-sky-400 transition-colors text-left"
                  >
                    {isAmharic ? 'የባንክ ደረሰኝ ማረጋገጫ መመሪያ' : 'Deposit Slip Verification Guide'}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate(ROUTES.AUTH.LOGIN)}
                    className="hover:text-sky-400 transition-colors text-left"
                  >
                    {t('passbook_login_btn', 'Member Digital Portal Login')}
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Head Office & Live Updates */}
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider border-l-2 border-amber-500 pl-2">
                {t('headquarters', 'Headquarters & Support')}
              </h5>
              <div className="space-y-3 text-slate-400 text-xs">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-white font-medium">
                      {headAddress}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {isAmharic ? (institution?.headOfficeAddress || 'Opposite Helen Building, in front of Lideta High Court, 3rd Floor') : (institution?.headOfficeAddressAmharic || 'ልደታ ከፍተኛ ፍርድ ቤት ፊት ለፊት፣ ሄለን ህንፃ ፊት ለፊት፣ 3ኛ ፎቅ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-sky-400 flex-shrink-0" />
                  <div className="flex flex-wrap items-center gap-2">
                    <a href={`tel:${hotline1.replace(/\s+/g, '')}`} className="hover:text-sky-300 font-mono transition-colors">{hotline1}</a>
                    {hotline2 && (
                      <>
                        <span className="text-slate-600">|</span>
                        <a href={`tel:${hotline2.replace(/\s+/g, '')}`} className="hover:text-sky-300 font-mono transition-colors">{hotline2}</a>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <a href={`mailto:${saccoEmail}`} className="hover:text-amber-300 transition-colors">{saccoEmail}</a>
                </div>
              </div>

              {/* SMS / Email Advisory Subscription Box */}
              <div className="pt-2">
                <span className="block text-[11px] font-bold text-white mb-1.5">
                  {t('newsletter_title', 'SACCO Member Bulletin')}
                </span>
                <form onSubmit={handleSubscribe} className="flex items-center gap-1.5">
                  <input
                    type="email"
                    required
                    placeholder={isAmharic ? 'የኢሜይል አድራሻዎን ያስገቡ' : 'Enter your email'}
                    value={subscriberEmail}
                    onChange={(e) => setSubscriberEmail(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 w-full"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex-shrink-0"
                    title={t('subscribe', 'Subscribe')}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
                {isSubscribed && (
                  <span className="text-[10px] text-emerald-400 font-semibold block mt-1">
                    ✓ {t('subscribed_msg', 'Thank you! You have successfully subscribed to the SACCO Bulletin.')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Legal & Regulatory Disclaimer */}
          <div className="mt-14 pt-8 border-t border-slate-800/80 flex flex-col lg:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
            <div className="flex items-center gap-2 text-center lg:text-left">
              <span>© {new Date().getFullYear()} {legalName}</span>
              <span>•</span>
              <span className="text-slate-400">
                {t('license_label', `License: ${institution?.licenseNumber || 'ET-COOP/AA/042'}`)} • {t('copyright', 'Regulated under Ethiopian Cooperative Proclamation 985/2016.')}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <button
                type="button"
                onClick={() => navigate(ROUTES.PUBLIC.PRIVACY)}
                className="hover:text-slate-300 transition-colors"
              >
                {t('privacy', 'Data Privacy Policy')}
              </button>
              <button
                type="button"
                onClick={() => navigate(ROUTES.PUBLIC.TERMS)}
                className="hover:text-slate-300 transition-colors"
              >
                {t('terms', 'Membership By-Laws')}
              </button>
              <button
                type="button"
                onClick={() => navigate(ROUTES.PUBLIC.FAQ)}
                className="hover:text-slate-300 transition-colors"
              >
                {t('faq', 'FAQ')}
              </button>
              <button
                type="button"
                onClick={() => navigate(ROUTES.PUBLIC.CONTACT)}
                className="hover:text-slate-300 transition-colors"
              >
                {t('contact', 'Contact & Branches')}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
