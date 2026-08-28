export const API_CONFIG = {
  BASE_URL: ((import.meta as any).env?.VITE_API_BASE_URL as string) || '/api/v1',
  TIMEOUT_MS: 15000,
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Accept-Language': 'en',
  },
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh',
      FORGOT_PASSWORD: '/auth/forgot-password',
      RESET_PASSWORD: '/auth/reset-password',
      ME: '/auth/me',
    },
    MEMBERS: {
      LIST: '/members',
      REGISTER: '/members/register',
      DETAILS: (id: string | number) => `/members/${id}`,
      RECEIPTS_PENDING: '/members/receipts/pending',
      VERIFY_RECEIPT: (id: string | number) => `/members/receipts/${id}/verify`,
    },
    SAVINGS: {
      ACCOUNTS: '/savings/accounts',
      MY_ACCOUNTS: '/savings/accounts/my',
      DEPOSIT: '/savings/deposits',
      WITHDRAW: '/savings/withdrawals',
      PASSBOOK: (id: string | number) => `/savings/accounts/${id}/passbook`,
    },
    SHARES: {
      MY_SHARES: '/shares/accounts/my',
      BUY: '/shares/purchases',
      CONVERT: '/shares/convert-voluntary',
    },
    LOANS: {
      APPLICATIONS: '/loans/applications',
      MY_LOANS: '/loans/applications/my',
      APPLY: '/loans/applications',
      APPROVE: (id: string | number) => `/loans/applications/${id}/approve`,
      REPAY: (id: string | number) => `/loans/${id}/repayments`,
      SCHEDULE: (id: string | number) => `/loans/${id}/repayment-schedule`,
    },
    TRANSACTIONS: {
      LIST: '/transactions',
      REVERSALS: '/transactions/reversals',
    },
    DASHBOARD: {
      ADMIN: '/dashboards/admin',
      MANAGER: '/dashboards/manager',
      ACCOUNTANT: '/dashboards/accountant',
      AUDITOR: '/dashboards/auditor',
      CUSTOMER_SERVICE: '/dashboards/customer-service',
      MEMBER: '/dashboards/member',
    }
  }
};
