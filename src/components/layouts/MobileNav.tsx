import React from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { useNavigation } from '../../providers/NavigationProvider';
import { useLanguage, LanguageSwitcher } from '../../providers/LanguageProvider';
import { ThemeToggle } from '../../providers/ThemeProvider';
import { ROLE_STAFF_NAV_SECTIONS, MEMBER_NAV_SECTIONS, PUBLIC_NAV_ITEMS } from '../../constants/navigation';
import { RoleCode } from '../../types/auth';
import { ROLES } from '../../constants/roles';
import {
  LayoutDashboard,
  PiggyBank,
  PieChart,
  Landmark,
  BookOpen,
  X,
  LogOut,
  Building2,
  Users,
  Receipt,
  Scale,
  BarChart3,
  KeyRound,
  MessageSquare,
  LifeBuoy,
  Settings,
  FileCheck,
  CheckCircle2,
  ShieldAlert,
  UserCheck,
  UserSearch,
  FileSpreadsheet,
  Bell,
  Globe,
  Coins,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { ROUTES } from '../../constants/routes';

const ICON_MAP: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="w-5 h-5" />,
  Users: <Users className="w-5 h-5" />,
  PiggyBank: <PiggyBank className="w-5 h-5" />,
  PieChart: <PieChart className="w-5 h-5" />,
  Landmark: <Landmark className="w-5 h-5" />,
  Receipt: <Receipt className="w-5 h-5" />,
  Scale: <Scale className="w-5 h-5" />,
  BarChart3: <BarChart3 className="w-5 h-5" />,
  KeyRound: <KeyRound className="w-5 h-5" />,
  MessageSquare: <MessageSquare className="w-5 h-5" />,
  LifeBuoy: <LifeBuoy className="w-5 h-5" />,
  Settings: <Settings className="w-5 h-5" />,
  FileCheck: <FileCheck className="w-5 h-5" />,
  CheckCircle2: <CheckCircle2 className="w-5 h-5" />,
  ShieldAlert: <ShieldAlert className="w-5 h-5" />,
  BookOpen: <BookOpen className="w-5 h-5" />,
  UserCheck: <UserCheck className="w-5 h-5" />,
  UserSearch: <UserSearch className="w-5 h-5" />,
  FileSpreadsheet: <FileSpreadsheet className="w-5 h-5" />,
  Bell: <Bell className="w-5 h-5" />,
};

const AMHARIC_NAV_MAP: Record<string, string> = {
  'Overview & Passbook': 'አጠቃላይ እይታና ደብተር',
  'Dashboard': 'ዳሽቦርድ',
  'Savings Accounts': 'የቁጠባ ሒሳቦች',
  'Deposit Funds': 'ገንዘብ አስገባ (CBE/ፀሐይ)',
  'Loan Center': 'የብድር ማዕከል (4.0×)',
  'Share Capital': 'የአክሲዮን ካፒታል',
  'Digital Passbook': 'ዲጂታል የቁጠባ ደብተር',
  'Transactions': 'የዝውውር ታሪክ',
  'My Profile & KYC': 'መገለጫዬ እና KYC',
  'Support & Inquiries': 'የደንበኞች ድጋፍ',
  'Executive Workspace': 'የሥራ አመራር ክፍል',
  'Operations': 'የአሠራር ተግባራት',
  'Member Directory': 'የአባላት መዝገብ',
  'KYC Onboarding Queue': 'የKYC ማረጋገጫ ተራ',
  'Slip Clearances': 'የባንክ ደረሰኝ ማጽደቂያ',
  'Loan Applications': 'የብድር ጥያቄዎች',
  'Accounting & General Ledger': 'የሒሳብና ጄኔራል ሌጀር',
  'General Ledger': 'ጄኔራል ሌጀር (GL)',
  'Financial Statements': 'የፋይናንስ ሪፖርቶች',
  'Audit & Governance': 'የኦዲትና ቁጥጥር',
  'Audit Trails': 'የኦዲት መዝገብ',
  'System Administration': 'የሲስተም አስተዳደር',
  'User Roles & RBAC': 'የተጠቃሚዎች ፈቃድ',
  'System Settings': 'የሲስተም ቅንብሮች',
};

export const MobileNavDrawer: React.FC = () => {
  const { user, logout } = useAuth();
  const { currentPath, navigate, isMobileDrawerOpen, setIsMobileDrawerOpen } = useNavigation();
  const { t, isAmharic } = useLanguage();

  if (!isMobileDrawerOpen) return null;

  const role = user?.role || 'MEMBER';
  const roleDef = ROLES[role];

  const sections = user
    ? role === 'MEMBER'
      ? MEMBER_NAV_SECTIONS
      : ROLE_STAFF_NAV_SECTIONS[role as Exclude<RoleCode, 'MEMBER'>] || []
    : [];

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity"
        onClick={() => setIsMobileDrawerOpen(false)}
      />

      {/* Drawer panel */}
      <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#14532D] text-white z-10 shadow-2xl border-r border-[#166534]">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-[#166534] bg-[#0f3d20]">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Wabi SACCO Logo"
              className="w-10 h-10 rounded-full object-contain bg-white p-0.5 shadow-sm ring-1 ring-white/20"
            />
            <div>
              <span className="text-base font-bold text-white block leading-tight">{t('app_name', 'Wabi SACCO')}</span>
              <span className="text-[11px] text-emerald-200 font-semibold uppercase">{user ? roleDef.name : 'Public'}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(false)}
            className="p-2 text-emerald-200 hover:text-white rounded-lg hover:bg-[#166534]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language & Theme bar */}
        <div className="px-4 py-2.5 bg-[#0f3d20]/70 border-b border-[#166534] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-200">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isAmharic ? 'ቋንቋ' : 'Language'}</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="pill" />
            <ThemeToggle variant="icon" />
          </div>
        </div>

        {/* Links */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          {user ? (
            sections.map((section, sIdx) => {
              const sectionTitle = isAmharic && section.title ? (AMHARIC_NAV_MAP[section.title] || section.title) : section.title;
              return (
                <div key={sIdx} className="space-y-1.5">
                  {sectionTitle && (
                    <div className="px-3.5 py-1 text-[13px] font-bold uppercase tracking-wider text-emerald-300/80">
                      {sectionTitle}
                    </div>
                  )}
                  {section.items.map((item) => {
                    const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
                    const label = isAmharic ? (AMHARIC_NAV_MAP[item.label] || item.label) : item.label;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          navigate(item.href);
                          setIsMobileDrawerOpen(false);
                        }}
                        className={cn(
                          'w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-[18px] font-medium transition-all text-left min-h-[52px] cursor-pointer',
                          isActive
                            ? 'bg-[#16A34A] text-white font-bold shadow-md'
                            : 'text-emerald-100 hover:text-white hover:bg-[#166534]'
                        )}
                      >
                        <span className={cn('flex-shrink-0', isActive ? 'text-white' : 'text-emerald-200')}>
                          {ICON_MAP[item.iconName] || <Building2 className="w-6 h-6" />}
                        </span>
                        <span className="flex-1 leading-snug">{label}</span>
                        {item.badge && (
                          <span className="text-[13px] font-bold px-2.5 py-0.5 rounded-full bg-[#22C55E] text-slate-900">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })
          ) : (
            <div className="space-y-1.5">
              <div className="px-3.5 py-1 text-[13px] font-bold uppercase tracking-wider text-emerald-300/80">
                {isAmharic ? 'የገጽ ማውጫ' : 'Public Pages'}
              </div>
              {PUBLIC_NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    navigate(item.href);
                    setIsMobileDrawerOpen(false);
                  }}
                  className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-[18px] font-medium text-emerald-100 hover:text-white hover:bg-[#166534] text-left min-h-[52px] cursor-pointer"
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {user && (
          <div className="p-4 border-t border-[#166534] bg-[#0f3d20] flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#16A34A] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                {user.fullName.charAt(0)}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[16px] font-bold text-white truncate">{user.fullName}</span>
                <span className="text-[13px] text-emerald-200 truncate">{user.email}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                logout();
                setIsMobileDrawerOpen(false);
              }}
              className="p-2.5 text-emerald-200 hover:text-rose-300 hover:bg-[#166534] rounded-xl transition-colors cursor-pointer"
              title={isAmharic ? 'ውጣ' : 'Sign out'}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const MemberBottomNav: React.FC = () => {
  const { currentPath, navigate } = useNavigation();
  const { isAmharic } = useLanguage();

  const items = [
    {
      id: 'dashboard',
      label: isAmharic ? 'ዳሽቦርድ' : 'Dashboard',
      icon: <LayoutDashboard className="w-6 h-6" />,
      href: ROUTES.MEMBER.DASHBOARD,
    },
    {
      id: 'savings',
      label: isAmharic ? 'ቁጠባ' : 'Savings',
      icon: <PiggyBank className="w-6 h-6" />,
      href: ROUTES.MEMBER.SAVINGS,
    },
    {
      id: 'shares',
      label: isAmharic ? 'አክሲዮን' : 'Shares',
      icon: <Coins className="w-6 h-6" />,
      href: ROUTES.MEMBER.SHARES,
    },
    {
      id: 'loans',
      label: isAmharic ? 'ብድር' : 'Loans',
      icon: <Landmark className="w-6 h-6" />,
      href: ROUTES.MEMBER.LOANS,
    },
    {
      id: 'passbook',
      label: isAmharic ? 'ደብተር' : 'Passbook',
      icon: <BookOpen className="w-6 h-6" />,
      href: ROUTES.MEMBER.PASSBOOK,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white dark:bg-slate-900 border-t border-[#E2E8F0] dark:border-slate-800 z-40 flex items-center justify-around px-2 shadow-lg transition-colors duration-200">
      {items.map((item) => {
        const isActive = currentPath === item.href;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => navigate(item.href)}
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full text-[14px] font-semibold transition-colors cursor-pointer',
              isActive
                ? 'text-[#16A34A] dark:text-emerald-400 font-bold'
                : 'text-[#475569] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white'
            )}
          >
            {item.icon}
            <span className="mt-1">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
