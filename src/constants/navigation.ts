import { RoleCode } from '../types/auth';
import { NavItem, NavSection } from '../types/navigation';
import { ROUTES } from './routes';

export const PUBLIC_NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', href: ROUTES.PUBLIC.HOME, iconName: 'Home' },
  { id: 'about', label: 'About Us', href: ROUTES.PUBLIC.ABOUT, iconName: 'Info' },
  { id: 'savings', label: 'Savings Products', href: ROUTES.PUBLIC.SAVINGS, iconName: 'PiggyBank' },
  { id: 'loans', label: 'Loan Products', href: ROUTES.PUBLIC.LOANS, iconName: 'Coins' },
  { id: 'membership', label: 'Membership', href: ROUTES.PUBLIC.MEMBERSHIP, iconName: 'Users' },
  { id: 'contact', label: 'Contact', href: ROUTES.PUBLIC.CONTACT, iconName: 'Mail' },
  { id: 'faq', label: 'FAQ', href: ROUTES.PUBLIC.FAQ, iconName: 'HelpCircle' },
];

export const MEMBER_NAV_SECTIONS: NavSection[] = [
  {
    title: 'Core Portfolio',
    items: [
      { id: 'mem-dash', label: 'Dashboard', href: ROUTES.MEMBER.DASHBOARD, iconName: 'LayoutDashboard' },
      { id: 'mem-sav', label: 'My Savings', href: ROUTES.MEMBER.SAVINGS, iconName: 'PiggyBank' },
      { id: 'mem-shr', label: 'My Shares', href: ROUTES.MEMBER.SHARES, iconName: 'PieChart' },
      { id: 'mem-ln', label: 'My Loans', href: ROUTES.MEMBER.LOANS, iconName: 'Landmark' },
    ]
  },
  {
    title: 'Ledger & Records',
    items: [
      { id: 'mem-pbk', label: 'Digital Passbook', href: ROUTES.MEMBER.PASSBOOK, iconName: 'BookOpen' },
      { id: 'mem-txn', label: 'Transactions', href: ROUTES.MEMBER.TRANSACTIONS, iconName: 'Receipt' },
    ]
  },
  {
    title: 'Account Services',
    items: [
      { id: 'mem-ntf', label: 'Notifications', href: ROUTES.MEMBER.NOTIFICATIONS, iconName: 'Bell', badge: '3', badgeVariant: 'primary' },
      { id: 'mem-sup', label: 'Support & Inquiries', href: ROUTES.MEMBER.SUPPORT, iconName: 'LifeBuoy' },
      { id: 'mem-prf', label: 'My Profile & KYC', href: ROUTES.MEMBER.PROFILE, iconName: 'UserCheck' },
    ]
  }
];

export const ROLE_STAFF_NAV_SECTIONS: Record<Exclude<RoleCode, 'MEMBER'>, NavSection[]> = {
  ADMIN: [
    {
      title: 'Executive Cockpit',
      items: [
        { id: 'adm-dash', label: 'Dashboard', href: ROUTES.STAFF.ADMIN_DASHBOARD, iconName: 'LayoutDashboard' },
        { id: 'adm-mem', label: 'Member Master', href: ROUTES.STAFF.MEMBERS, iconName: 'Users', requiredPermission: 'MEMBER:PROFILE:VIEW:ALL' as any },
      ]
    },
    {
      title: 'Financial Products',
      items: [
        { id: 'adm-sav', label: 'Savings Accounts', href: ROUTES.STAFF.SAVINGS, iconName: 'PiggyBank', requiredPermission: 'SAVING:ACCOUNT:VIEW:ALL' as any },
        { id: 'adm-shr', label: 'Share Capital', href: ROUTES.STAFF.SHARES, iconName: 'PieChart', requiredPermission: 'SHARE:ACCOUNT:VIEW:ALL' as any },
        { id: 'adm-ln', label: 'Loan Portfolio', href: ROUTES.STAFF.LOANS, iconName: 'Landmark', requiredPermission: 'LOAN:APPLICATION:VIEW:ALL' as any },
        { id: 'adm-txn', label: 'All Transactions', href: ROUTES.STAFF.TRANSACTIONS, iconName: 'Receipt', requiredPermission: 'TXN:LEDGER:VIEW:ALL' as any },
      ]
    },
    {
      title: 'Finance & Compliance',
      items: [
        { id: 'adm-acc', label: 'Chart of Accounts & GL', href: ROUTES.STAFF.ACCOUNTING, iconName: 'Scale', requiredPermission: 'ACCOUNTING:GL:VIEW' as any },
        { id: 'adm-mig', label: 'Legacy Data Migration', href: ROUTES.STAFF.MIGRATION, iconName: 'Database', requiredPermission: 'SYSTEM:SETTINGS:UPDATE' as any },
        { id: 'adm-rep', label: 'Central Reports Hub', href: ROUTES.STAFF.REPORTS, iconName: 'FileSpreadsheet', requiredPermission: 'REPORT:VIEW:ALL' as any },
        { id: 'adm-fc', label: 'Predictive Analytics & AI', href: ROUTES.STAFF.FORECASTING, iconName: 'Sparkles', requiredPermission: 'BI:DASHBOARD:EXECUTIVE' as any },
        { id: 'adm-aud', label: 'System Audit Logs', href: ROUTES.STAFF.AUDIT_LOGS, iconName: 'ShieldAlert', requiredPermission: 'SYSTEM:AUDIT:VIEW:ALL' as any },
      ]
    },
    {
      title: 'System Administration',
      items: [
        { id: 'adm-usr', label: 'Users & Roles', href: ROUTES.STAFF.USERS_ROLES, iconName: 'KeyRound', requiredPermission: 'SYSTEM:ROLE:MANAGE' as any },
        { id: 'adm-ntf', label: 'Communications & SMS', href: ROUTES.STAFF.NOTIFICATIONS, iconName: 'MessageSquare', requiredPermission: 'NOTIFICATION:SMS:SEND' as any },
        { id: 'adm-sup', label: 'Support Desk', href: ROUTES.STAFF.SUPPORT, iconName: 'LifeBuoy', requiredPermission: 'SUPPORT:TICKET:VIEW:ALL' as any },
        { id: 'adm-set', label: 'System Settings', href: ROUTES.STAFF.SETTINGS, iconName: 'Settings', requiredPermission: 'SYSTEM:SETTINGS:UPDATE' as any },
      ]
    }
  ],
  MANAGER: [
    {
      title: 'Management Overview',
      items: [
        { id: 'mgr-dash', label: 'Manager Dashboard', href: ROUTES.STAFF.MANAGER_DASHBOARD, iconName: 'LayoutDashboard' },
        { id: 'mgr-app', label: 'Approval Center', href: ROUTES.STAFF.APPROVAL_CENTER, iconName: 'CheckCircle2', badge: '5', badgeVariant: 'warning', requiredPermission: 'LOAN:APPLICATION:APPROVE' as any },
      ]
    },
    {
      title: 'Portfolio & Risk',
      items: [
        { id: 'mgr-mem', label: 'Members', href: ROUTES.STAFF.MEMBERS, iconName: 'Users', requiredPermission: 'MEMBER:PROFILE:VIEW:ALL' as any },
        { id: 'mgr-sav', label: 'Savings', href: ROUTES.STAFF.SAVINGS, iconName: 'PiggyBank', requiredPermission: 'SAVING:ACCOUNT:VIEW:ALL' as any },
        { id: 'mgr-shr', label: 'Shares', href: ROUTES.STAFF.SHARES, iconName: 'PieChart', requiredPermission: 'SHARE:ACCOUNT:VIEW:ALL' as any },
        { id: 'mgr-ln', label: 'Loan Underwriting', href: ROUTES.STAFF.LOANS, iconName: 'Landmark', requiredPermission: 'LOAN:APPLICATION:VIEW:ALL' as any },
        { id: 'mgr-txn', label: 'Transactions', href: ROUTES.STAFF.TRANSACTIONS, iconName: 'Receipt', requiredPermission: 'TXN:LEDGER:VIEW:ALL' as any },
      ]
    },
    {
      title: 'Oversight & Reports',
      items: [
        { id: 'mgr-mig', label: 'Legacy Data Migration', href: ROUTES.STAFF.MIGRATION, iconName: 'Database', requiredPermission: 'SYSTEM:SETTINGS:UPDATE' as any },
        { id: 'mgr-rep', label: 'Central Reports Hub', href: ROUTES.STAFF.REPORTS, iconName: 'FileSpreadsheet', requiredPermission: 'REPORT:VIEW:ALL' as any },
        { id: 'mgr-fc', label: 'Predictive Forecasting', href: ROUTES.STAFF.FORECASTING, iconName: 'Sparkles', requiredPermission: 'BI:DASHBOARD:EXECUTIVE' as any },
        { id: 'mgr-ntf', label: 'Alerts & Outbox', href: ROUTES.STAFF.NOTIFICATIONS, iconName: 'Bell', requiredPermission: 'NOTIFICATION:SMS:SEND' as any },
        { id: 'mgr-aud', label: 'Audit Trail', href: ROUTES.STAFF.AUDIT_LOGS, iconName: 'Shield', requiredPermission: 'SYSTEM:AUDIT:VIEW:ALL' as any },
      ]
    }
  ],
  ACCOUNTANT: [
    {
      title: 'Operations Desk',
      items: [
        { id: 'acc-dash', label: 'Accountant Desk', href: ROUTES.STAFF.ACCOUNTANT_DASHBOARD, iconName: 'LayoutDashboard' },
        { id: 'acc-rcp', label: 'Receipt Verification', href: ROUTES.STAFF.RECEIPT_VERIFICATION, iconName: 'FileCheck', badge: '3', badgeVariant: 'primary', requiredPermission: 'MEMBER:RECEIPT:VIEW:ALL' as any },
        { id: 'acc-mem', label: 'Members Register', href: ROUTES.STAFF.MEMBERS, iconName: 'Users', requiredPermission: 'MEMBER:PROFILE:VIEW:ALL' as any },
      ]
    },
    {
      title: 'Financial Processing',
      items: [
        { id: 'acc-sav', label: 'Savings & Deposits', href: ROUTES.STAFF.SAVINGS, iconName: 'PiggyBank', requiredPermission: 'SAVING:ACCOUNT:VIEW:ALL' as any },
        { id: 'acc-shr', label: 'Share Purchases', href: ROUTES.STAFF.SHARES, iconName: 'PieChart', requiredPermission: 'SHARE:ACCOUNT:VIEW:ALL' as any },
        { id: 'acc-ln', label: 'Loan Disbursements', href: ROUTES.STAFF.LOANS, iconName: 'Landmark', requiredPermission: 'LOAN:APPLICATION:VIEW:ALL' as any },
        { id: 'acc-txn', label: 'Daily Teller Transactions', href: ROUTES.STAFF.TRANSACTIONS, iconName: 'Receipt', requiredPermission: 'TXN:LEDGER:VIEW:ALL' as any },
      ]
    },
    {
      title: 'Books & Ledgers',
      items: [
        { id: 'acc-gl', label: 'General Ledger & JV', href: ROUTES.STAFF.ACCOUNTING, iconName: 'Scale', requiredPermission: 'ACCOUNTING:GL:VIEW' as any },
        { id: 'acc-mig', label: 'Legacy Data Migration', href: ROUTES.STAFF.MIGRATION, iconName: 'Database', requiredPermission: 'SYSTEM:SETTINGS:UPDATE' as any },
        { id: 'acc-rep', label: 'Statements & Reports', href: ROUTES.STAFF.REPORTS, iconName: 'FileSpreadsheet', requiredPermission: 'REPORT:VIEW:ALL' as any },
      ]
    }
  ],
  AUDITOR: [
    {
      title: 'Audit Inspection',
      items: [
        { id: 'aud-dash', label: 'Audit Dashboard', href: ROUTES.STAFF.AUDITOR_DASHBOARD, iconName: 'LayoutDashboard' },
        { id: 'aud-gl', label: 'General Ledger (R/O)', href: ROUTES.STAFF.ACCOUNTING, iconName: 'Scale', requiredPermission: 'ACCOUNTING:GL:VIEW' as any },
        { id: 'aud-txn', label: 'Transaction Trail', href: ROUTES.STAFF.TRANSACTIONS, iconName: 'Receipt', requiredPermission: 'TXN:LEDGER:VIEW:ALL' as any },
        { id: 'aud-rep', label: 'Financial Statements', href: ROUTES.STAFF.REPORTS, iconName: 'BarChart3', requiredPermission: 'REPORT:VIEW:ALL' as any },
        { id: 'aud-log', label: 'Change Data Capture Logs', href: ROUTES.STAFF.AUDIT_LOGS, iconName: 'ShieldAlert', requiredPermission: 'SYSTEM:AUDIT:VIEW:ALL' as any },
      ]
    }
  ],
  CUSTOMER_SERVICE: [
    {
      title: 'Support & Service',
      items: [
        { id: 'csr-dash', label: 'Service Dashboard', href: ROUTES.STAFF.CUSTOMER_SERVICE_DASHBOARD, iconName: 'LayoutDashboard' },
        { id: 'csr-mem', label: 'Member KYC Lookup', href: ROUTES.STAFF.MEMBERS, iconName: 'UserSearch', requiredPermission: 'MEMBER:PROFILE:VIEW:ALL' as any },
        { id: 'csr-sup', label: 'Support Tickets', href: ROUTES.STAFF.SUPPORT, iconName: 'LifeBuoy', badge: '4', badgeVariant: 'warning', requiredPermission: 'SUPPORT:TICKET:VIEW:ALL' as any },
        { id: 'csr-ntf', label: 'Broadcast SMS', href: ROUTES.STAFF.NOTIFICATIONS, iconName: 'MessageSquare', requiredPermission: 'NOTIFICATION:SMS:SEND' as any },
      ]
    }
  ]
};
