import React, { createContext, useContext, useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useLanguage } from './LanguageProvider';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  isDark: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'wabi_sacco_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
    return 'light';
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Listen to OS system theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };

    setSystemIsDark(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const resolvedTheme: 'light' | 'dark' = theme === 'system' ? (systemIsDark ? 'dark' : 'light') : theme;
  const isDark = resolvedTheme === 'dark';

  // Apply or remove .dark class to root document element and body, and set color-scheme
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      if (body) {
        body.classList.add('dark');
        body.setAttribute('data-theme', 'dark');
      }
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.removeAttribute('data-theme');
      if (body) {
        body.classList.remove('dark');
        body.removeAttribute('data-theme');
      }
      root.style.colorScheme = 'light';
    }
  }, [isDark]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
  };

  const toggleTheme = () => {
    const next: ThemeMode = isDark ? 'light' : 'dark';
    setTheme(next);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        isDark,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export interface ThemeToggleProps {
  variant?: 'icon' | 'pill' | 'button' | 'segmented';
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'icon',
  className = '',
  showLabel = false,
}) => {
  const { theme, resolvedTheme, isDark, setTheme, toggleTheme } = useTheme();
  const { isAmharic } = useLanguage();

  if (variant === 'segmented') {
    return (
      <div
        className={`inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 ${className}`}
        role="group"
        aria-label="Theme selection"
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            theme === 'light'
              ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          title={isAmharic ? 'ብርሃን ገጽታ' : 'Light Mode'}
        >
          <Sun className="w-3.5 h-3.5" />
          {showLabel && <span>{isAmharic ? 'ብርሃን' : 'Light'}</span>}
        </button>

        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            theme === 'dark'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-sky-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          title={isAmharic ? 'ጨለማ ገጽታ' : 'Dark Mode'}
        >
          <Moon className="w-3.5 h-3.5" />
          {showLabel && <span>{isAmharic ? 'ጨለማ' : 'Dark'}</span>}
        </button>

        <button
          type="button"
          onClick={() => setTheme('system')}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            theme === 'system'
              ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          title={isAmharic ? 'የስርዓቱ ገጽታ' : 'System Default'}
        >
          <Monitor className="w-3.5 h-3.5" />
          {showLabel && <span>{isAmharic ? 'ሲስተም' : 'Auto'}</span>}
        </button>
      </div>
    );
  }

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs backdrop-blur-xs transition-all cursor-pointer ${className}`}
        aria-label={
          isDark
            ? isAmharic
              ? 'ወደ ብርሃን ገጽታ ቀይር'
              : 'Switch to light mode'
            : isAmharic
            ? 'ወደ ጨለማ ገጽታ ቀይር'
            : 'Switch to dark mode'
        }
        title={
          isDark
            ? isAmharic
              ? 'ወደ ብርሃን ገጽታ ቀይር'
              : 'Switch to Light Mode'
            : isAmharic
            ? 'ወደ ጨለማ ገጽታ ቀይር'
            : 'Switch to Dark Mode'
        }
      >
        {isDark ? (
          <>
            <Sun className="w-3.5 h-3.5 text-amber-400 animate-in spin-in-180 duration-300" />
            <span>{isAmharic ? 'ብርሃን' : 'Light'}</span>
          </>
        ) : (
          <>
            <Moon className="w-3.5 h-3.5 text-sky-600 animate-in spin-in-180 duration-300" />
            <span>{isAmharic ? 'ጨለማ' : 'Dark'}</span>
          </>
        )}
      </button>
    );
  }

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 transition-colors cursor-pointer ${className}`}
      >
        {isDark ? (
          <>
            <Sun className="w-4 h-4 text-amber-400" />
            <span>{isAmharic ? 'ብርሃን ገጽታ' : 'Light Theme'}</span>
          </>
        ) : (
          <>
            <Moon className="w-4 h-4 text-blue-600" />
            <span>{isAmharic ? 'ጨለማ ገጽታ' : 'Dark Theme'}</span>
          </>
        )}
      </button>
    );
  }

  // Default 'icon' button variant
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${className}`}
      aria-label={
        isDark
          ? isAmharic
            ? 'ወደ ብርሃን ገጽታ ቀይር'
            : 'Switch to light mode'
          : isAmharic
          ? 'ወደ ጨለማ ገጽታ ቀይር'
          : 'Switch to dark mode'
      }
      title={
        isDark
          ? isAmharic
            ? 'ወደ ብርሃን ገጽታ ቀይር'
            : 'Switch to Light Mode'
          : isAmharic
          ? 'ወደ ጨለማ ገጽታ ቀይር'
          : 'Switch to Dark Mode'
      }
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700 dark:text-slate-300 transition-transform hover:-rotate-12" />
      )}
    </button>
  );
};
