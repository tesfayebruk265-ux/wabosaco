import React from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { useNavigation } from '../../providers/NavigationProvider';
import { useLanguage } from '../../providers/LanguageProvider';
import { ROLE_STAFF_NAV_SECTIONS, MEMBER_NAV_SECTIONS } from '../../constants/navigation';
import { ROLES } from '../../constants/roles';
import { RoleCode } from '../../types/auth';
import { ROUTES } from '../../constants/routes';
import {
  LayoutDashboard,
  Users,
  PiggyBank,
  PieChart,
  Landmark,
  Receipt,
  Scale,
  BarChart3,
  KeyRound,
  MessageSquare,
  LifeBuoy,
  Settings,
  FileCheck,
  CheckCircle2,
  Shield,
  ShieldAlert,
  BookOpen,
  UserCheck,
  UserSearch,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2,
  FileSpreadsheet,
  Bell,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const ICON_MAP: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="w-[18px] h-[18px]" />,
  Users: <Users className="w-[18px] h-[18px]" />,
  PiggyBank: <PiggyBank className="w-[18px] h-[18px]" />,
  PieChart: <PieChart className="w-[18px] h-[18px]" />,
  Landmark: <Landmark className="w-[18px] h-[18px]" />,
  Receipt: <Receipt className="w-[18px] h-[18px]" />,
  Scale: <Scale className="w-[18px] h-[18px]" />,
  BarChart3: <BarChart3 className="w-[18px] h-[18px]" />,
  KeyRound: <KeyRound className="w-[18px] h-[18px]" />,
  MessageSquare: <MessageSquare className="w-[18px] h-[18px]" />,
  LifeBuoy: <LifeBuoy className="w-[18px] h-[18px]" />,
  Settings: <Settings className="w-[18px] h-[18px]" />,
  FileCheck: <FileCheck className="w-[18px] h-[18px]" />,
  CheckCircle2: <CheckCircle2 className="w-[18px] h-[18px]" />,
  Shield: <Shield className="w-[18px] h-[18px]" />,
  ShieldAlert: <ShieldAlert className="w-[18px] h-[18px]" />,
  BookOpen: <BookOpen className="w-[18px] h-[18px]" />,
  UserCheck: <UserCheck className="w-[18px] h-[18px]" />,
  UserSearch: <UserSearch className="w-[18px] h-[18px]" />,
  FileSpreadsheet: <FileSpreadsheet className="w-[18px] h-[18px]" />,
  Bell: <Bell className="w-[18px] h-[18px]" />,
  Sparkles: <Sparkles className="w-[18px] h-[18px]" />,
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

export const Sidebar: React.FC = () => {
  const { user, logout, switchRole, hasPermission } = useAuth();
  const { currentPath, navigate, isSidebarCollapsed, toggleSidebar } = useNavigation();
  const { t, isAmharic } = useLanguage();

  const role = user?.role || 'MEMBER';
  const roleDef = ROLES[role] || { name: role };

  const rawSections =
    role === 'MEMBER'
      ? MEMBER_NAV_SECTIONS
      : ROLE_STAFF_NAV_SECTIONS[role as Exclude<RoleCode, 'MEMBER'>] || [];

  // Filter sections dynamically based on active user role permissions
  const sections = rawSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        // System Administrator bypass
        if (user?.role === 'ADMIN') return true;
        // Check atomic permission requirement if specified
        if (item.requiredPermission) {
          return hasPermission(item.requiredPermission);
        }
        return true;
      }),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col bg-[#1B5E20] dark:bg-[#0F172A] text-white border-r border-[#14532D] dark:border-slate-800 transition-all duration-200 select-none z-30 h-screen sticky top-0 shadow-xs',
        isSidebarCollapsed ? 'w-[72px]' : 'w-[220px]'
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-3.5 h-[56px] border-b border-[#14532D] dark:border-slate-800 bg-[#0F3812] dark:bg-[#0F172A] shrink-0">
        <div
          onClick={() => navigate(role === 'MEMBER' ? '/member/dashboard' : `/${role.toLowerCase().replace('_', '-')}/dashboard`)}
          className="flex items-center gap-2.5 cursor-pointer overflow-hidden group"
        >
          <img
            src="/logo.png"
            alt="Wabi SACCO Logo"
            className="w-8 h-8 rounded-full object-contain bg-white p-0.5 shadow-xs flex-shrink-0 group-hover:scale-105 transition-transform"
          />
          {!isSidebarCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-[14.5px] font-bold text-white tracking-tight flex items-center gap-1.5 leading-tight">
                {t('app_name', 'Wabi SACCO')}
                <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
              </span>
              <span className="text-[10.5px] text-emerald-200/90 dark:text-slate-400 truncate uppercase tracking-wider font-semibold">
                {roleDef.name}
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={toggleSidebar}
          className="p-1 rounded-md text-emerald-200 hover:text-white hover:bg-[#2E7D32]/60 dark:hover:bg-slate-800 transition-colors focus:outline-none cursor-pointer"
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Staff Administrative Switcher */}
      {!isSidebarCollapsed && user?.role === 'ADMIN' && (
        <div className="px-2.5 py-2 border-b border-[#14532D] dark:border-slate-800 bg-[#0F3812]/80 dark:bg-slate-900 shrink-0">
          <div className="flex items-center justify-between mb-1 px-0.5">
            <span className="text-[10px] uppercase font-bold text-emerald-200 dark:text-slate-400 tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" /> {isAmharic ? 'የሥራ ኃላፊነት' : 'Role Workstation'}
            </span>
          </div>
          <select
            value={role}
            onChange={(e) => {
              const newRole = e.target.value as RoleCode;
              switchRole(newRole).then(() => {
                if (newRole === 'MEMBER') navigate(ROUTES.MEMBER.DASHBOARD);
                else if (newRole === 'ADMIN') navigate(ROUTES.STAFF.ADMIN_DASHBOARD);
                else if (newRole === 'MANAGER') navigate(ROUTES.STAFF.MANAGER_DASHBOARD);
                else if (newRole === 'ACCOUNTANT') navigate(ROUTES.STAFF.ACCOUNTANT_DASHBOARD);
                else if (newRole === 'AUDITOR') navigate(ROUTES.STAFF.AUDITOR_DASHBOARD);
                else if (newRole === 'CUSTOMER_SERVICE') navigate(ROUTES.STAFF.CS_DASHBOARD);
              });
            }}
            className="w-full text-[12px] font-medium bg-[#2E7D32]/80 dark:bg-slate-800 border border-emerald-500/30 dark:border-slate-700 text-white rounded-lg px-2 py-1.5 focus:outline-none focus:border-emerald-400 cursor-pointer min-h-[30px]"
          >
            <option value="ADMIN" className="bg-[#1B5E20] dark:bg-slate-900 text-white">Administrator</option>
            <option value="MANAGER" className="bg-[#1B5E20] dark:bg-slate-900 text-white">General Manager</option>
            <option value="ACCOUNTANT" className="bg-[#1B5E20] dark:bg-slate-900 text-white">Senior Accountant</option>
            <option value="AUDITOR" className="bg-[#1B5E20] dark:bg-slate-900 text-white">Internal Auditor</option>
            <option value="CUSTOMER_SERVICE" className="bg-[#1B5E20] dark:bg-slate-900 text-white">Customer Service</option>
          </select>
        </div>
      )}

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-3.5 custom-scrollbar">
        {sections.map((section, sIdx) => {
          const sectionTitle = isAmharic && section.title ? (AMHARIC_NAV_MAP[section.title] || section.title) : section.title;
          return (
            <div key={sIdx} className="space-y-1">
              {!isSidebarCollapsed && sectionTitle && (
                <div className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-200/70 dark:text-slate-400">
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
                    onClick={() => navigate(item.href)}
                    title={isSidebarCollapsed ? label : undefined}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 group relative min-h-[36px] cursor-pointer',
                      isActive
                        ? 'bg-[#2E7D32] dark:bg-emerald-600 text-white font-semibold shadow-2xs'
                        : 'text-emerald-100/90 dark:text-slate-300 hover:text-white hover:bg-[#2E7D32]/50 dark:hover:bg-slate-800'
                    )}
                  >
                    <span
                      className={cn(
                        'flex-shrink-0 transition-transform group-hover:scale-105',
                        isActive ? 'text-white' : 'text-emerald-200 dark:text-slate-400 group-hover:text-white'
                      )}
                    >
                      {ICON_MAP[item.iconName || item.icon || ''] || <LayoutDashboard className="w-[18px] h-[18px]" />}
                    </span>
                    {!isSidebarCollapsed && <span className="truncate text-left">{label}</span>}
                    {item.badge && !isSidebarCollapsed && (
                      <span className="ml-auto bg-[#DC2626] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* User Footer Profile */}
      <div className="p-2 border-t border-[#14532D] dark:border-slate-800 bg-[#0F3812] dark:bg-[#0F172A] shrink-0">
        <div className="flex items-center justify-between gap-1.5 p-1.5 rounded-lg hover:bg-[#2E7D32]/40 dark:hover:bg-slate-800 transition-colors">
          <div
            onClick={() => navigate(role === 'MEMBER' ? '/member/profile' : '/staff/settings')}
            className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer overflow-hidden"
          >
            <div className="w-7 h-7 rounded-full bg-[#2E7D32] dark:bg-slate-700 text-white flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-400/40">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-[12.5px] font-semibold text-white truncate leading-tight">
                  {user?.fullName || 'Active User'}
                </span>
                <span className="text-[11px] text-emerald-200/80 dark:text-slate-400 truncate">
                  {user?.email || user?.username}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              logout();
              navigate(ROUTES.PUBLIC.HOME);
            }}
            className="text-emerald-200/80 hover:text-white dark:text-slate-400 dark:hover:text-rose-400 p-1.5 rounded-md hover:bg-rose-900/30 transition-colors cursor-pointer shrink-0"
            title={t('logout', 'Sign Out')}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
