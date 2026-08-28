import React from 'react';
import { useNavigation } from '../../providers/NavigationProvider';
import { useLanguage, LanguageSwitcher } from '../../providers/LanguageProvider';
import { ThemeToggle } from '../../providers/ThemeProvider';
import { ROUTES } from '../../constants/routes';
import { THEME } from '../../constants/theme';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export const AuthLayout: React.FC<{ children: React.ReactNode; title: string; subtitle?: string }> = ({
  children,
  title,
  subtitle,
}) => {
  const { navigate } = useNavigation();
  const { t, isAmharic } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC] dark:bg-slate-950 text-[#0F172A] dark:text-slate-100 relative transition-colors duration-200">
      {/* Top back link & Controls */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(ROUTES.PUBLIC.HOME)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#475569] dark:text-slate-400 hover:text-[#16A34A] dark:hover:text-emerald-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isAmharic ? 'ወደ ዋና ገጽ ተመለስ' : 'Return to Public Portal'}</span>
        </button>

        <div className="flex items-center gap-2">
          <LanguageSwitcher variant="pill" />
          <ThemeToggle variant="icon" />
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md mt-6 sm:mt-0">
        {/* Brand */}
        <div className="flex flex-col items-center text-center">
          <div
            onClick={() => navigate(ROUTES.PUBLIC.HOME)}
            className="w-14 h-14 rounded-2xl bg-[#16A34A] flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-[#16A34A]/20 mb-3 cursor-pointer hover:bg-[#15803D] transition-colors"
          >
            W
          </div>
          <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white tracking-tight">{t('app_name', THEME.institution.name)}</h2>
          <p className="text-sm text-[#475569] dark:text-slate-400 mt-0.5">
            {isAmharic ? 'የገንዘብ ቁጠባና ብድር ኅብረት ሥራ ማህበር' : 'Enterprise Core Banking & SACCO Platform'}
          </p>
        </div>

        <div className="mt-8 bg-white dark:bg-slate-900 py-8 px-6 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/60 rounded-[18px] border border-[#E2E8F0] dark:border-slate-800 sm:px-10 transition-colors duration-200">
          <div className="mb-6">
            <h3 className="text-[22px] font-bold text-[#0F172A] dark:text-white tracking-tight">{title}</h3>
            {subtitle && <p className="text-sm text-[#475569] dark:text-slate-400 mt-1">{subtitle}</p>}
          </div>

          {children}
        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#475569] dark:text-slate-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
          <span>{isAmharic ? 'በ256-ቢት TLS የተጠበቀ የፋይናንስ ሥርዓት' : '256-bit TLS Encrypted Financial Core'}</span>
        </div>
      </div>
    </div>
  );
};
