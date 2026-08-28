import React, { useState } from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { useNavigation } from '../../providers/NavigationProvider';
import { useLanguage, LanguageSwitcher } from '../../providers/LanguageProvider';
import { ROUTES } from '../../constants/routes';
import { THEME } from '../../constants/theme';
import {
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  Landmark,
  Building2,
  AlertCircle,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const { navigate } = useNavigation();
  const { t, isAmharic } = useLanguage();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLocked(false);

    if (!identifier.trim()) {
      setError(
        isAmharic
          ? 'እባክዎ የአባልነት መታወቂያ ቁጥር፣ የተጠቃሚ ስም፣ ኢሜይል ወይም ስልክ ቁጥር ያስገቡ።'
          : 'Please enter your Membership ID, username, email, or phone number.'
      );
      return;
    }
    if (!password) {
      setError(isAmharic ? 'እባክዎ የይለፍ ቃልዎን ያስገቡ።' : 'Please enter your password.');
      return;
    }

    try {
      const res = await login({ username: identifier.trim(), password });

      // If MFA is challenged
      if (res.mfaRequired && res.mfaToken) {
        sessionStorage.setItem('wabi_mfa_token', res.mfaToken);
        sessionStorage.setItem('wabi_mfa_identifier', identifier.trim());
        if (res.destinationMasked) {
          sessionStorage.setItem('wabi_mfa_destination', res.destinationMasked);
        }
        navigate(ROUTES.AUTH.MFA);
        return;
      }

      // Clear returnUrl from session storage
      const returnUrl = sessionStorage.getItem('wabi_auth_return_url');
      sessionStorage.removeItem('wabi_auth_return_url');

      const userRole = res.user?.role || 'MEMBER';

      // Check if returnUrl is compatible with user role
      if (returnUrl && !returnUrl.startsWith('/login') && !returnUrl.startsWith('/register') && returnUrl !== '/') {
        const isStaffRoute =
          returnUrl.startsWith('/staff') ||
          returnUrl.startsWith('/admin') ||
          returnUrl.startsWith('/accountant') ||
          returnUrl.startsWith('/manager') ||
          returnUrl.startsWith('/auditor') ||
          returnUrl.startsWith('/customer-service');
        const isMemberRoute = returnUrl.startsWith('/member');

        if (userRole === 'MEMBER' && !isStaffRoute) {
          navigate(returnUrl);
          return;
        } else if (userRole !== 'MEMBER' && !isMemberRoute) {
          navigate(returnUrl);
          return;
        }
      }

      // Default route based on role
      if (userRole === 'ADMIN') navigate(ROUTES.STAFF.ADMIN_DASHBOARD);
      else if (userRole === 'MANAGER') navigate(ROUTES.STAFF.MANAGER_DASHBOARD);
      else if (userRole === 'ACCOUNTANT') navigate(ROUTES.STAFF.ACCOUNTANT_DASHBOARD);
      else if (userRole === 'AUDITOR') navigate(ROUTES.STAFF.AUDITOR_DASHBOARD);
      else if (userRole === 'CUSTOMER_SERVICE') navigate(ROUTES.STAFF.CS_DASHBOARD);
      else navigate(ROUTES.MEMBER.DASHBOARD);
    } catch (err: any) {
      const errorMsg =
        err?.error?.message ||
        err?.message ||
        (isAmharic
          ? 'የተሳሳተ መረጃ ገብቷል። እባክዎ መለያዎን እና የይለፍ ቃልዎን ያረጋግጡ።'
          : 'Invalid credentials. Please verify your identifier and password.');
      setError(errorMsg);

      if (err?.error?.code === 'AUTH_ACCOUNT_LOCKED' || errorMsg.includes('locked')) {
        setIsLocked(true);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#16A34A]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Two-Column Card Container */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-200/80">
        
        {/* LEFT COLUMN: INSTITUTIONAL BRANDING & TRUST PILLARS */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#14532D] via-[#0f3d20] to-slate-950 text-white p-8 lg:p-10 flex flex-col justify-between relative">
          <div className="space-y-6">
            {/* Logo & Brand Header */}
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Wabi SACCO Logo"
                className="w-14 h-14 rounded-full object-contain bg-white p-1 shadow-lg ring-2 ring-emerald-400/30"
              />
              <div>
                <h1 className="text-xl font-black text-white">{t('app_name', THEME.institution.name)}</h1>
                <p className="text-[11px] text-emerald-200 font-medium">
                  {isAmharic ? 'የገንዘብ ቁጠባና ብድር ኅብረት ሥራ ማህበር' : 'Savings & Credit Cooperative Society'}
                </p>
              </div>
            </div>

            {/* Value Proposition */}
            <div className="pt-4 space-y-2">
              <h2 className="text-2xl font-bold leading-snug text-white">
                {isAmharic
                  ? 'በኅብረት ሥራ መርሆዎች የዳበረ አስተማማኝ የፋይናንስ ዕድገት።'
                  : 'Empowering Financial Resilience Through Cooperative Solidarity.'}
              </h2>
              <p className="text-xs text-emerald-100/80 leading-relaxed">
                {isAmharic
                  ? 'ከፍተኛ ወለድ የሚያስገኙ የቁጠባ ሒሳቦችዎን፣ አክሲዮንዎን፣ የ4.0× እጥፍ የብድር እድልዎን እና ዲጂታል ደብተርዎን በቀጥታ ይቆጣጠሩ።'
                  : 'Access your high-yield savings accounts, equity shares, 4.0× loan multiplier credit lines, and real-time passbook ledger.'}
              </p>
            </div>

            {/* Key Trust Pillars */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <Building2 className="w-5 h-5 text-emerald-300 mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-xs font-bold text-white">
                    {isAmharic ? '100% በአባላት ባለቤትነት የሚመራ' : '100% Member-Owned Society'}
                  </h3>
                  <p className="text-[11px] text-emerald-100/70">
                    {isAmharic ? 'አባላት ዓመታዊ የትርፍ ድርሻ የሚያገኙበት ፍትሐዊ ሥርዓት።' : 'Cooperative governance where members earn annual dividends.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <Landmark className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-xs font-bold text-white">
                    {isAmharic ? 'ሕጋዊ ቁጥጥርና ፈቃድ' : 'Regulatory Compliance'}
                  </h3>
                  <p className="text-[11px] text-emerald-100/70">
                    {isAmharic ? 'በፌዴራል ኅብረት ሥራ ኤጀንሲ ሕግጋት ሙሉ በሙሉ የተመዘገበ።' : 'Full statutory adherence to Federal Cooperative Agency standards.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <ShieldCheck className="w-5 h-5 text-emerald-300 mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-xs font-bold text-white">
                    {isAmharic ? '256-ቢት TLS የደህንነት ጥበቃ' : '256-Bit TLS Core Security'}
                  </h3>
                  <p className="text-[11px] text-emerald-100/70">
                    {isAmharic ? 'አስተማማኝ የሒሳብ መዝገብና ፈቃጅ-አጽዳቂ (Maker-Checker) ቁጥጥር።' : 'Automated double-entry audit trails and cryptographic session controls.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Support Contact */}
          <div className="pt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-emerald-200">
            <span>{isAmharic ? 'የደንበኞች ድጋፍ' : 'Support'}: +251 11 667 8900</span>
            <button
              type="button"
              onClick={() => navigate(ROUTES.PUBLIC.HOME)}
              className="text-emerald-300 hover:text-white font-semibold transition-colors cursor-pointer"
            >
              {isAmharic ? 'ዋና ገጽ →' : 'Public Portal →'}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: SIGN-IN FORM & PROFILE SWITCHER */}
        <div className="lg:col-span-7 p-8 sm:p-10 lg:p-12 flex flex-col justify-between bg-white text-left">
          <div className="space-y-6">
            
            {/* Header with Language Switcher */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#16A34A] uppercase tracking-wider">
                  {isAmharic ? 'ደህንነቱ የተጠበቀ መግቢያ' : 'Secure Access'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-[#15803D] bg-[#F0FDF4] px-2.5 py-0.5 rounded-full border border-[#BBF7D0]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" /> {isAmharic ? 'ሲስተም ዝግጁ ነው' : 'System Online'}
                  </span>
                  <LanguageSwitcher variant="pill" />
                </div>
              </div>
              <h2 className="text-2xl font-black text-[#0F172A] mt-1">
                {t('login', 'Sign in to your account')}
              </h2>
              <p className="text-xs text-[#475569] mt-0.5">
                {isAmharic
                  ? 'የተመዘገቡበትን መለያና የይለፍ ቃል በማስገባት ወደ ፖርታልዎ ይግቡ።'
                  : 'Enter your registered credentials to access your SACCO workstation or member portal.'}
              </p>
            </div>

            {/* Error & Lockout Alert */}
            {error && (
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                  isLocked
                    ? 'bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C]'
                    : 'bg-[#FFFBEB] border-[#FDE68A] text-[#B45309]'
                }`}
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-[#EF4444]" />
                <div className="space-y-1">
                  <p className="font-bold">{isLocked ? (isAmharic ? 'የደህንነት መዘጋት ገጥሞታል' : 'Security Lockout Active') : (isAmharic ? 'የመግቢያ ማሳሰቢያ' : 'Sign-In Notice')}</p>
                  <p>{error}</p>
                  {isLocked && (
                    <p className="text-[11px] text-[#B91C1C] font-medium">
                      {isAmharic
                        ? 'እባክዎ የተወሰነ ደቂቃ ይጠብቁ ወይም በአቅራቢያዎ የሚገኘውን ቅርንጫፍ ወይም support@wabisacco.et ያነጋግሩ።'
                        : 'Please wait for the lockout duration or contact your branch administrator at support@wabisacco.et.'}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Identifier Input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#0F172A]">
                  {isAmharic
                    ? 'የኢሜይል አድራሻ፣ የአባልነት መለያ ወይም የተጠቃሚ ስም'
                    : 'Email Address, Membership ID, or Username'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="login-identifier-input"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={isAmharic ? 'ምሳሌ፡ abebe.bikila@example.com ወይም WB000143' : 'e.g. abebe.bikila@example.com or WB000143'}
                    required
                    className="w-full px-4 py-3 text-[16px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-[#16A34A] transition-colors text-[#0F172A]"
                  />
                </div>
                <p className="text-[11px] text-[#475569]">
                  {isAmharic
                    ? 'አዲስ የተመዘገቡ አባላት፡ በሂሳብ ክፍሉ ከጸደቀ በኋላ የተመዘገቡበትን ኢሜይልና የይለፍ ቃል ይጠቀሙ።'
                    : 'Newly registered members: Use your registered email address and password once verified by the accountant.'}
                </p>
              </div>

              {/* Password Input with Show/Hide Toggle */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#0F172A]">{t('password', 'Password')}</label>
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.AUTH.FORGOT_PASSWORD)}
                    className="text-[12px] font-bold text-[#16A34A] hover:text-[#15803D] cursor-pointer"
                  >
                    {isAmharic ? 'የይለፍ ቃል ረሱ?' : 'Forgot password?'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="login-password-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full px-4 py-3 text-[16px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-[#16A34A] transition-colors text-[#0F172A] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember device checkbox */}
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#475569] font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-[#16A34A] rounded border-[#E2E8F0] focus:ring-[#16A34A]"
                  />
                  <span>{isAmharic ? 'ይህንን መሳሪያ ለ30 ቀናት አስታውስ' : 'Remember this device for 30 days'}</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[52px] px-6 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-[18px] rounded-xl shadow-lg shadow-[#16A34A]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{isAmharic ? 'መረጃ በማረጋገጥ ላይ...' : 'Verifying Credentials...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isAmharic ? 'ወደ ዋቢ ሣኮ ግባ' : 'Sign In to Wabi SACCO'}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Register Callout */}
            <div className="pt-4 border-t border-[#E2E8F0] text-center space-y-2">
              <p className="text-xs text-[#475569]">
                {isAmharic ? 'አዲስ አባል ነዎት?' : 'New to Wabi SACCO?'}{' '}
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.AUTH.REGISTER)}
                  className="font-bold text-[#16A34A] hover:text-[#15803D] transition-colors cursor-pointer"
                >
                  {isAmharic ? 'ለአባልነት ይመዝገቡ →' : 'Register for Cooperative Membership →'}
                </button>
              </p>
              <div>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.AUTH.FORGOT_PASSWORD)}
                  className="text-[11px] text-[#475569] hover:text-[#0F172A] underline decoration-slate-300 cursor-pointer"
                >
                  {isAmharic ? 'የይለፍ ቃል ለመቀየር ወይም ለማስተካከል' : 'Track Existing Application or Reset Password'}
                </button>
              </div>
            </div>
          </div>

          {/* Legal / Policy Footer Links */}
          <div className="pt-6 border-t border-[#E2E8F0] flex items-center justify-center gap-4 text-[11px] text-[#475569]">
            <button
              type="button"
              onClick={() => navigate(ROUTES.PUBLIC.TERMS)}
              className="hover:text-[#0F172A] transition-colors cursor-pointer"
            >
              {t('terms', 'Terms of Membership')}
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => navigate(ROUTES.PUBLIC.PRIVACY)}
              className="hover:text-[#0F172A] transition-colors cursor-pointer"
            >
              {t('privacy', 'Privacy Policy')}
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => navigate(ROUTES.PUBLIC.FAQ)}
              className="hover:text-[#0F172A] transition-colors cursor-pointer"
            >
              {t('faq', 'Help & FAQs')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
