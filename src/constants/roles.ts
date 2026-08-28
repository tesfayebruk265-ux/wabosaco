import { RoleCode } from '../types/auth';
import { RoleDefinition } from '../types/rbac';

export const ROLES: Record<RoleCode, RoleDefinition> = {
  ADMIN: {
    code: 'ADMIN',
    name: 'System Administrator',
    description: 'Full system control, user management, security and settings.',
    portalPrefix: '/admin',
    isSystem: true,
    permissions: [
      'SYSTEM:USER:MANAGE',
      'SYSTEM:ROLE:MANAGE',
      'SYSTEM:SETTINGS:UPDATE',
      'SYSTEM:AUDIT:VIEW:ALL',
      'MEMBER:PROFILE:VIEW:ALL',
      'MEMBER:PROFILE:CREATE:ALL',
      'MEMBER:PROFILE:UPDATE:ALL',
      'MEMBER:PROFILE:RESTORE',
      'MEMBER:RECEIPT:VIEW:ALL',
      'SAVING:ACCOUNT:VIEW:ALL',
      'SHARE:ACCOUNT:VIEW:ALL',
      'LOAN:APPLICATION:VIEW:ALL',
      'TXN:LEDGER:VIEW:ALL',
      'ACCOUNTING:COA:MANAGE',
      'ACCOUNTING:AUDIT:VIEW:ALL',
      'REPORT:OPERATIONAL:EXPORT',
      'REPORT:FINANCIAL:EXPORT',
      'REPORT:DEFAULTERS:VIEW',
      'REPORT:PREDICTIONS:VIEW'
    ]
  },
  MANAGER: {
    code: 'MANAGER',
    name: 'General Manager',
    description: 'Credit authorization, large withdrawal sign-off, reversals & overrides.',
    portalPrefix: '/manager',
    isSystem: true,
    permissions: [
      'LOAN:APPLICATION:APPROVE',
      'LOAN:APPLICATION:REJECT',
      'LOAN:APPLICATION:VIEW:ALL',
      'LOAN:PENALTY:WAIVE',
      'TXN:WITHDRAWAL:APPROVE:LARGE',
      'TXN:REVERSAL:APPROVE',
      'MEMBER:PROFILE:DELETE:APPROVE',
      'MEMBER:PROFILE:SUSPEND',
      'MEMBER:PROFILE:VIEW:ALL',
      'SAVING:TIMEDEPOSIT:OVERRIDE',
      'SAVING:INTEREST:APPROVE',
      'SAVING:ACCOUNT:VIEW:ALL',
      'SHARE:ACCOUNT:VIEW:ALL',
      'TXN:LEDGER:VIEW:ALL',
      'REPORT:OPERATIONAL:EXPORT',
      'REPORT:FINANCIAL:EXPORT',
      'REPORT:DEFAULTERS:VIEW',
      'REPORT:PREDICTIONS:VIEW',
      'SYSTEM:AUDIT:VIEW:ALL'
    ]
  },
  ACCOUNTANT: {
    code: 'ACCOUNTANT',
    name: 'Senior Accountant / Cashier',
    description: 'Receipt verification, deposits, withdrawals, general ledger posting.',
    portalPrefix: '/accountant',
    isSystem: true,
    permissions: [
      'MEMBER:RECEIPT:VERIFY',
      'MEMBER:RECEIPT:APPROVE',
      'MEMBER:RECEIPT:REJECT',
      'MEMBER:RECEIPT:VIEW:ALL',
      'MEMBER:PROFILE:VIEW:ALL',
      'MEMBER:PROFILE:ACTIVATE',
      'TXN:DEPOSIT:CREATE',
      'TXN:WITHDRAWAL:CREATE',
      'TXN:REVERSAL:REQUEST',
      'TXN:LEDGER:VIEW:ALL',
      'SAVING:ACCOUNT:VIEW:ALL',
      'SAVING:ACCOUNT:CREATE',
      'SAVING:INTEREST:EXECUTE',
      'SHARE:ACCOUNT:VIEW:ALL',
      'SHARE:PURCHASE:PROCESS',
      'SHARE:CONVERT:PROCESS',
      'LOAN:APPLICATION:VERIFY',
      'LOAN:DISBURSEMENT:EXECUTE',
      'LOAN:REPAYMENT:RECORD',
      'LOAN:APPLICATION:VIEW:ALL',
      'ACCOUNTING:COA:MANAGE',
      'ACCOUNTING:JOURNAL:CREATE',
      'ACCOUNTING:JOURNAL:POST',
      'ACCOUNTING:STATEMENTS:GEN',
      'REPORT:OPERATIONAL:EXPORT',
      'REPORT:FINANCIAL:EXPORT'
    ]
  },
  AUDITOR: {
    code: 'AUDITOR',
    name: 'Internal Auditor',
    description: 'Independent inspection, read-only ledgers, trial balances, and audit feeds.',
    portalPrefix: '/auditor',
    isSystem: true,
    permissions: [
      'SYSTEM:AUDIT:VIEW:ALL',
      'ACCOUNTING:AUDIT:VIEW:ALL',
      'ACCOUNTING:STATEMENTS:GEN',
      'TXN:LEDGER:VIEW:ALL',
      'MEMBER:PROFILE:VIEW:ALL',
      'SAVING:ACCOUNT:VIEW:ALL',
      'SHARE:ACCOUNT:VIEW:ALL',
      'LOAN:APPLICATION:VIEW:ALL',
      'REPORT:OPERATIONAL:EXPORT',
      'REPORT:FINANCIAL:EXPORT',
      'REPORT:DEFAULTERS:VIEW'
    ]
  },
  CUSTOMER_SERVICE: {
    code: 'CUSTOMER_SERVICE',
    name: 'Customer Service Officer',
    description: 'Member inquiries, KYC profile lookup, support tickets, and SMS alerts.',
    portalPrefix: '/customer-service',
    isSystem: true,
    permissions: [
      'MEMBER:PROFILE:VIEW:ALL',
      'SUPPORT:TICKET:MANAGE:ALL',
      'NOTIF:DISPATCH:MANUAL',
      'NOTIF:HISTORY:VIEW:ALL',
      'LOAN:APPLICATION:VIEW:ALL',
      'SAVING:ACCOUNT:VIEW:ALL'
    ]
  },
  MEMBER: {
    code: 'MEMBER',
    name: 'SACCO Member',
    description: 'Self-service passbook, savings, shares, loan origination, and profile.',
    portalPrefix: '/member',
    isSystem: true,
    permissions: [
      'MEMBER:PROFILE:VIEW:OWN',
      'MEMBER:PROFILE:UPDATE:OWN',
      'MEMBER:RECEIPT:UPLOAD:OWN',
      'SAVING:ACCOUNT:VIEW:OWN',
      'SHARE:ACCOUNT:VIEW:OWN',
      'SHARE:PURCHASE:INITIATE:OWN',
      'SHARE:CONVERT:INITIATE:OWN',
      'LOAN:APPLICATION:CREATE:OWN',
      'LOAN:APPLICATION:VIEW:OWN',
      'TXN:PASSBOOK:VIEW:OWN',
      'SUPPORT:TICKET:CREATE:OWN',
      'SUPPORT:TICKET:VIEW:OWN'
    ]
  }
};
