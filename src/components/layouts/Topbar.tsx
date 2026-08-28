import React, { useState } from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { useNavigation } from '../../providers/NavigationProvider';
import { useLanguage, LanguageSwitcher } from '../../providers/LanguageProvider';
import { ThemeToggle } from '../../providers/ThemeProvider';
import { Breadcrumbs } from '../common/Breadcrumbs';
import { Search, Bell, Menu, UserCircle, LogOut } from 'lucide-react';
import { ROLES } from '../../constants/roles';
import { DropdownMenu } from '../common/DropdownMenu';
import { ROUTES } from '../../constants/routes';
import { GlobalSearchModal } from '../../features/bi/GlobalSearchModal';

export const Topbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { breadcrumbs, navigate, setIsMobileDrawerOpen } = useNavigation();
  const { isAmharic } = useLanguage();
  const [unreadNotifs] = useState(3);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const role = user?.role || 'MEMBER';
  const roleDef = ROLES[role];

  return (
    <header className="h-[56px] bg-white dark:bg-[#1E293B] border-b border-[#E5E7EB] dark:border-slate-700 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-2xs transition-colors duration-200 shrink-0">
      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Left: Mobile Menu Toggle & Breadcrumbs */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => setIsMobileDrawerOpen(true)}
          className="md:hidden p-1.5 -ml-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-[#E8F5E9] dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-4.5 h-4.5" />
        </button>

        <div className="hidden sm:block">
          {(breadcrumbs || []).length > 0 ? (
            <Breadcrumbs items={breadcrumbs || []} onNavigate={navigate} />
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold text-[#111827] dark:text-white">
                {isAmharic ? 'ዋቢ ሣኮ የፋይናንስ ሥርዓት' : 'Wabi SACCO Enterprise'}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 bg-[#E8F5E9] dark:bg-emerald-950/60 text-[#1B5E20] dark:text-emerald-300 font-semibold rounded border border-[#C8E6C9] dark:border-emerald-800">
                Core v2.4
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions, Language Switcher, Theme Toggle, Notifications, User Menu */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Quick Search Button (Staff Only) */}
        {role !== 'MEMBER' && (
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="hidden lg:flex items-center gap-2 px-2.5 py-1 text-[12.5px] font-medium text-[#6B7280] dark:text-slate-400 bg-[#F8FAFC] dark:bg-slate-800 hover:bg-[#E8F5E9] dark:hover:bg-slate-700 hover:text-[#2E7D32] border border-[#E5E7EB] dark:border-slate-700 rounded-lg transition-all cursor-pointer min-h-[32px]"
          >
            <Search className="w-3.5 h-3.5 text-[#2E7D32]" />
            <span>{isAmharic ? 'ፈጣን ፍለጋ (አባል / ዝውውር)...' : 'Quick Lookup...'}</span>
            <kbd className="text-[10px] font-mono bg-white dark:bg-slate-900 px-1.5 py-0.2 border border-[#E5E7EB] dark:border-slate-600 rounded text-[#6B7280] dark:text-slate-400">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Live Currency Symbol Banner */}
        <div className="hidden md:flex items-center gap-1 px-2.5 py-1 bg-[#E8F5E9] dark:bg-emerald-950/40 border border-[#C8E6C9] dark:border-emerald-800 rounded-md text-[12px] font-semibold text-[#1B5E20] dark:text-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32] animate-pulse" />
          <span>{isAmharic ? 'የኢትዮጵያ ብር (ETB)' : 'ETB / Birr'}</span>
        </div>

        {/* Topbar Language Switcher */}
        <LanguageSwitcher variant="pill" />

        {/* Topbar Theme Toggle */}
        <ThemeToggle variant="icon" />

        {/* Notification Bell */}
        <button
          type="button"
          onClick={() => navigate(role === 'MEMBER' ? ROUTES.MEMBER.NOTIFICATIONS : ROUTES.STAFF.NOTIFICATIONS)}
          className="relative p-1.5 text-slate-600 dark:text-slate-300 hover:text-[#2E7D32] dark:hover:text-emerald-400 hover:bg-[#E8F5E9] dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-4.5 h-4.5" />
          {unreadNotifs > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#2E7D32] rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
          )}
        </button>

        {/* User Dropdown */}
        <DropdownMenu
          align="right"
          trigger={
            <button
              type="button"
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none"
            >
              <div className="w-8 h-8 rounded-full bg-[#2E7D32] text-white flex items-center justify-center font-bold text-xs">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-[13px] font-semibold text-[#111827] dark:text-white leading-tight">
                  {user?.fullName || 'User'}
                </span>
                <span className="text-[11px] text-[#6B7280] dark:text-slate-400 leading-tight">
                  {roleDef?.name || role}
                </span>
              </div>
            </button>
          }
          items={[
            {
              id: 'profile',
              label: isAmharic ? 'መገለጫዬ' : 'My Profile & Security',
              icon: <UserCircle className="w-4 h-4" />,
              onClick: () => navigate(role === 'MEMBER' ? ROUTES.MEMBER.PROFILE : ROUTES.STAFF.SETTINGS),
            },
            {
              id: 'logout',
              label: isAmharic ? 'ውጣ' : 'Sign Out',
              icon: <LogOut className="w-4 h-4" />,
              destructive: true,
              onClick: () => {
                logout();
                navigate(ROUTES.PUBLIC.HOME);
              },
            },
          ]}
        />
      </div>
    </header>
  );
};
