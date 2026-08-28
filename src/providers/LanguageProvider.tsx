import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLanguage, TRANSLATIONS, TranslationDictionary } from '../locales/translations';
import { Globe } from 'lucide-react';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  toggleLanguage: () => void;
  t: (key: keyof TranslationDictionary | string, defaultVal?: string) => string;
  isAmharic: boolean;
  dict: TranslationDictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('wabi_sacco_lang');
    return saved === 'am' || saved === 'en' ? saved : 'en';
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('wabi_sacco_lang', lang);
  };

  const toggleLanguage = () => {
    const next = language === 'en' ? 'am' : 'en';
    setLanguage(next);
  };

  useEffect(() => {
    document.documentElement.lang = language;
    if (language === 'am') {
      document.documentElement.classList.add('lang-am');
      document.documentElement.classList.remove('lang-en');
      document.body.classList.add('lang-am');
      document.body.classList.remove('lang-en');
    } else {
      document.documentElement.classList.add('lang-en');
      document.documentElement.classList.remove('lang-am');
      document.body.classList.add('lang-en');
      document.body.classList.remove('lang-am');
    }
  }, [language]);

  const dict = TRANSLATIONS[language] || TRANSLATIONS.en;

  const t = (key: keyof TranslationDictionary | string, defaultVal?: string): string => {
    if (key in dict) {
      return (dict as any)[key];
    }
    // Fallback to English dictionary if exists
    if (key in TRANSLATIONS.en) {
      return (TRANSLATIONS.en as any)[key];
    }
    return defaultVal || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        isAmharic: language === 'am',
        dict,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageSwitcher: React.FC<{
  variant?: 'pill' | 'compact' | 'button';
  className?: string;
}> = ({ variant = 'pill', className = '' }) => {
  const { language, setLanguage, toggleLanguage, isAmharic } = useLanguage();

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 hover:border-emerald-300 bg-white/80 backdrop-blur-xs transition-colors shadow-2xs ${className}`}
        title={isAmharic ? 'Switch to English' : 'ወደ አማርኛ ቀይር'}
      >
        <Globe className="w-3.5 h-3.5 text-[#16A34A]" />
        <span>{language === 'am' ? 'አማ' : 'EN'}</span>
      </button>
    );
  }

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] hover:bg-[#DCFCE7] transition-colors ${className}`}
      >
        <Globe className="w-4 h-4 text-[#16A34A]" />
        <span>{language === 'en' ? '🇪🇹 አማርኛ' : '🇺🇸 English'}</span>
      </button>
    );
  }

  return (
    <div className={`inline-flex items-center p-0.5 bg-[#F1F5F9] dark:bg-slate-800 rounded-full border border-[#E2E8F0] dark:border-slate-700 ${className}`}>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-3 py-1 text-[12px] font-bold rounded-full transition-all cursor-pointer ${
          language === 'en'
            ? 'bg-[#16A34A] text-white shadow-xs font-bold'
            : 'text-[#475569] hover:text-[#0F172A] dark:text-slate-400 dark:hover:text-white'
        }`}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => setLanguage('am')}
        className={`px-3 py-1 text-[12px] font-bold rounded-full transition-all cursor-pointer ${
          language === 'am'
            ? 'bg-[#16A34A] text-white shadow-xs font-bold'
            : 'text-[#475569] hover:text-[#0F172A] dark:text-slate-400 dark:hover:text-white'
        }`}
      >
        አማርኛ
      </button>
    </div>
  );
};
