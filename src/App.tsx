import React from 'react';
import { ToastProvider } from './providers/ToastProvider';
import { AuthProvider, useAuth } from './providers/AuthProvider';
import { NavigationProvider, useNavigation } from './providers/NavigationProvider';
import { LanguageProvider } from './providers/LanguageProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { SettingsProvider } from './providers/SettingsProvider';
import { ROUTES } from './constants/routes';

// Layouts & Guards
import { PublicLayout } from './components/layouts/PublicLayout';
import { StaffLayout } from './components/layouts/StaffLayout';
import { MemberLayout } from './components/layouts/MemberLayout';
import { AuthenticatedRoute } from './components/routing/RouteGuards';

// Public Pages
import { LandingPage } from './features/public/LandingPage';
import {
  AboutPage,
  SavingsProductsPage,
  LoanProductsPage,
  MembershipInfoPage,
  ContactPage,
  FAQPage,
  TermsPage,
  PrivacyPage,
} from './features/public/StaticPages';

// Public Authentication Pages
import { LoginPage } from './features/auth/LoginPage';
import { RegisterWizardPage } from './features/auth/RegisterWizardPage';
import { RegistrationSuccessPage } from './features/auth/RegistrationSuccessPage';
import { MfaChallengePage } from './features/auth/MfaChallengePage';
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './features/auth/ResetPasswordPage';
import { VerifyOtpPage, VerifyAccountPage } from './features/auth/VerifyOtpPage';

// Phase 16 BI & Analytics Views
import { ExecutiveDashboard } from './features/bi/ExecutiveDashboard';
import {
  ManagerDashboardView,
  AccountantDashboardView,
  AuditorDashboardView,
  CustomerServiceDashboardView,
} from './features/bi/RoleDashboards';
import { CentralReportsEngine } from './features/bi/CentralReportsEngine';
import { PredictiveForecastingView } from './features/bi/PredictiveForecastingView';
import {
  MembersListView,
  ReceiptVerificationView,
  AuditLogsView,
  AccountingLedgerView,
  SettingsView,
} from './features/staff/StaffModules';

// Phase 12 Savings & Financial Core Views
import { SavingsManagementView } from './features/savings/SavingsManagementView';
import { MakerCheckerApprovalCenter } from './features/savings/MakerCheckerApprovalCenter';
import { TransactionsLedgerView } from './features/savings/TransactionsLedgerView';

// Phase 13 Share Management View
import { SharesManagementView } from './features/shares/SharesManagementView';

// Phase 14 Loan Management Views
import { LoanManagementView } from './features/loans/LoanManagementView';
import { MemberLoanPortal } from './features/member/MemberLoanPortal';

// Phase 15 Accounting & Financial Statements View
import { AccountingManagementView } from './features/accounting/AccountingManagementView';

// Phase 17 Enterprise Communication & Notification Center
import { MemberNotificationCenter } from './features/member/MemberNotificationCenter';
import { CommunicationConsole } from './features/communication/CommunicationConsole';

// Phase 18 Enterprise CRM, Help Desk & Case Management Hub
import { CrmSupportHub } from './features/crm/CrmSupportHub';
import { MemberSupportPortal } from './features/member/MemberSupportPortal';

// Phase 20 Enterprise Administration & System Configuration
import { EnterpriseSettingsView } from './features/admin/EnterpriseSettingsView';
import { UserManagementView } from './features/admin/UserManagementView';
import { LegacyDataMigrationView } from './features/admin/LegacyDataMigrationView';

// Member Views
import {
  MemberDashboardView,
  MemberSavingsView,
  MemberSharesView,
  MemberPassbookView,
  MemberTransactionsView,
  MemberProfileView,
} from './features/member/MemberViews';

const AppRouter: React.FC = () => {
  const { currentPath } = useNavigation();

  // 1. PUBLIC MARKETING & POLICY ROUTES
  if (currentPath === ROUTES.PUBLIC.HOME) {
    return (
      <PublicLayout>
        <LandingPage />
      </PublicLayout>
    );
  }
  if (currentPath === ROUTES.PUBLIC.ABOUT) {
    return (
      <PublicLayout>
        <AboutPage />
      </PublicLayout>
    );
  }
  if (currentPath === ROUTES.PUBLIC.SAVINGS) {
    return (
      <PublicLayout>
        <SavingsProductsPage />
      </PublicLayout>
    );
  }
  if (currentPath === ROUTES.PUBLIC.LOANS) {
    return (
      <PublicLayout>
        <LoanProductsPage />
      </PublicLayout>
    );
  }
  if (currentPath === ROUTES.PUBLIC.MEMBERSHIP) {
    return (
      <PublicLayout>
        <MembershipInfoPage />
      </PublicLayout>
    );
  }
  if (currentPath === ROUTES.PUBLIC.CONTACT) {
    return (
      <PublicLayout>
        <ContactPage />
      </PublicLayout>
    );
  }
  if (currentPath === ROUTES.PUBLIC.FAQ) {
    return (
      <PublicLayout>
        <FAQPage />
      </PublicLayout>
    );
  }
  if (currentPath === ROUTES.PUBLIC.TERMS) {
    return (
      <PublicLayout>
        <TermsPage />
      </PublicLayout>
    );
  }
  if (currentPath === ROUTES.PUBLIC.PRIVACY) {
    return (
      <PublicLayout>
        <PrivacyPage />
      </PublicLayout>
    );
  }

  // 2. PUBLIC AUTHENTICATION ROUTES
  if (currentPath === ROUTES.AUTH.LOGIN) {
    return <LoginPage />;
  }
  if (currentPath === ROUTES.AUTH.REGISTER) {
    return <RegisterWizardPage />;
  }
  if (currentPath === ROUTES.AUTH.REGISTRATION_SUCCESS) {
    return <RegistrationSuccessPage />;
  }
  if (currentPath === ROUTES.AUTH.MFA) {
    return <MfaChallengePage />;
  }
  if (currentPath === ROUTES.AUTH.FORGOT_PASSWORD) {
    return <ForgotPasswordPage />;
  }
  if (currentPath === ROUTES.AUTH.RESET_PASSWORD) {
    return <ResetPasswordPage />;
  }
  if (currentPath === ROUTES.AUTH.VERIFY_OTP) {
    return <VerifyOtpPage />;
  }
  if (currentPath === ROUTES.AUTH.VERIFY_ACCOUNT) {
    return <VerifyAccountPage />;
  }

  // 3. MEMBER PORTAL ROUTES (GUARDED)
  if (currentPath === '/member' || currentPath.startsWith('/member/')) {
    let memberContent = <MemberDashboardView />;
    if (currentPath === ROUTES.MEMBER.SAVINGS) memberContent = <MemberSavingsView />;
    else if (currentPath === ROUTES.MEMBER.SHARES) memberContent = <MemberSharesView />;
    else if (currentPath === ROUTES.MEMBER.LOANS) memberContent = <MemberLoanPortal />;
    else if (currentPath === ROUTES.MEMBER.PASSBOOK) memberContent = <MemberPassbookView />;
    else if (currentPath === ROUTES.MEMBER.TRANSACTIONS) memberContent = <MemberTransactionsView />;
    else if (currentPath === ROUTES.MEMBER.PROFILE) memberContent = <MemberProfileView />;
    else if (currentPath === ROUTES.MEMBER.NOTIFICATIONS) memberContent = <MemberNotificationCenter />;
    else if (currentPath === ROUTES.MEMBER.SUPPORT) memberContent = <MemberSupportPortal />;

    return (
      <AuthenticatedRoute requiredRole="MEMBER">
        <MemberLayout>{memberContent}</MemberLayout>
      </AuthenticatedRoute>
    );
  }

  // 4. STAFF DASHBOARD & WORKSTATION ROUTES (GUARDED)
  if (
    currentPath.startsWith('/admin') ||
    currentPath.startsWith('/manager') ||
    currentPath.startsWith('/accountant') ||
    currentPath.startsWith('/auditor') ||
    currentPath.startsWith('/customer-service') ||
    currentPath.startsWith('/staff')
  ) {
    let staffContent = <ExecutiveDashboard />;

    // Role Dashboards
    if (currentPath === ROUTES.STAFF.ADMIN_DASHBOARD || currentPath === ROUTES.STAFF.BI_DASHBOARD) {
      staffContent = <ExecutiveDashboard />;
    } else if (currentPath === ROUTES.STAFF.MANAGER_DASHBOARD) {
      staffContent = <ManagerDashboardView />;
    } else if (currentPath === ROUTES.STAFF.ACCOUNTANT_DASHBOARD) {
      staffContent = <AccountantDashboardView />;
    } else if (currentPath === ROUTES.STAFF.AUDITOR_DASHBOARD) {
      staffContent = <AuditorDashboardView />;
    } else if (currentPath === ROUTES.STAFF.CS_DASHBOARD) {
      staffContent = <CustomerServiceDashboardView />;
    }

    // Operational Modules
    else if (currentPath === ROUTES.STAFF.MEMBERS) staffContent = <MembersListView />;
    else if (currentPath === ROUTES.STAFF.RECEIPT_VERIFICATION) staffContent = <ReceiptVerificationView />;
    else if (currentPath === ROUTES.STAFF.APPROVAL_CENTER) staffContent = <MakerCheckerApprovalCenter />;
    else if (currentPath === ROUTES.STAFF.SAVINGS) staffContent = <SavingsManagementView />;
    else if (currentPath === ROUTES.STAFF.SHARES) staffContent = <SharesManagementView />;
    else if (currentPath === ROUTES.STAFF.LOANS) staffContent = <LoanManagementView />;
    else if (currentPath === ROUTES.STAFF.TRANSACTIONS) staffContent = <TransactionsLedgerView />;
    else if (currentPath === ROUTES.STAFF.ACCOUNTING) staffContent = <AccountingManagementView />;
    else if (currentPath === ROUTES.STAFF.REPORTS) staffContent = <CentralReportsEngine />;
    else if (currentPath === ROUTES.STAFF.FORECASTING) staffContent = <PredictiveForecastingView />;
    else if (currentPath === ROUTES.STAFF.AUDIT_LOGS) staffContent = <AuditLogsView />;
    else if (currentPath === ROUTES.STAFF.MIGRATION) staffContent = <LegacyDataMigrationView />;
    else if (currentPath === ROUTES.STAFF.NOTIFICATIONS) staffContent = <CommunicationConsole />;
    else if (currentPath === ROUTES.STAFF.SUPPORT) staffContent = <CrmSupportHub />;
    else if (currentPath === ROUTES.STAFF.USERS_ROLES) staffContent = <UserManagementView />;
    else if (currentPath === ROUTES.STAFF.SETTINGS) staffContent = <EnterpriseSettingsView />;

    return (
      <AuthenticatedRoute requiredRole={['ADMIN', 'MANAGER', 'ACCOUNTANT', 'AUDITOR', 'CUSTOMER_SERVICE']}>
        <StaffLayout>{staffContent}</StaffLayout>
      </AuthenticatedRoute>
    );
  }

  // Fallback -> Landing Page
  return (
    <PublicLayout>
      <LandingPage />
    </PublicLayout>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <LanguageProvider>
        <ThemeProvider>
          <SettingsProvider>
            <AuthProvider>
              <NavigationProvider>
                <AppRouter />
              </NavigationProvider>
            </AuthProvider>
          </SettingsProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ToastProvider>
  );
}

