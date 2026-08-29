import React, { useState, useEffect } from 'react';
import {
  Users,
  KeyRound,
  Shield,
  Search,
  Plus,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Edit2,
  ShieldAlert,
  UserCheck,
  UserX,
  Trash2,
  SlidersHorizontal,
  Check,
  X,
  ChevronRight,
  Filter,
  CheckSquare,
  Square
} from 'lucide-react';
import {
  userManagementService,
  UserSummary,
} from '../../services/userManagementService';
import {
  rbacManagementService,
  RoleDetail,
  PermissionDetail,
} from '../../services/rbacManagementService';
import { useToast } from '../../providers/ToastProvider';
import { Button } from '../../components/common/Button';
import { TextInput } from '../../components/common/TextInput';
import { SelectInput } from '../../components/common/SelectInput';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatDateTime } from '../../utils/formatters';

const DEFAULT_ROLES: RoleDetail[] = [
  {
    id: 'role_admin',
    code: 'ADMIN',
    name: 'System Administrator',
    description: 'Full unconstrained platform governance, security control, tenant policies, and user administration.',
    portalPrefix: '/admin',
    isSystem: true,
    permissions: [
      'SYSTEM:USER:MANAGE', 'user.view', 'user.create', 'user.update', 'user.delete',
      'SYSTEM:ROLE:MANAGE', 'role.view', 'role.create', 'role.update', 'permission.view',
      'SYSTEM:SETTINGS:UPDATE', 'SYSTEM:AUDIT:VIEW:ALL', 'audit.view',
      'SYSTEM:SECURITY:VIEW', 'SYSTEM:SECURITY:MANAGE', 'SYSTEM:INCIDENT:MANAGE', 'SYSTEM:BACKUP:MANAGE', 'SYSTEM:COMPLIANCE:MANAGE',
      'MEMBER:PROFILE:VIEW:ALL', 'member.view', 'MEMBER:PROFILE:CREATE:ALL', 'member.create', 'MEMBER:PROFILE:UPDATE:ALL', 'member.update', 'MEMBER:PROFILE:RESTORE',
      'MEMBER:RECEIPT:VIEW:ALL', 'SAVING:ACCOUNT:VIEW:ALL', 'saving.view', 'SHARE:ACCOUNT:VIEW:ALL',
      'LOAN:APPLICATION:VIEW:ALL', 'loan.view', 'TXN:LEDGER:VIEW:ALL', 'transaction.view',
      'ACCOUNTING:COA:MANAGE', 'ACCOUNTING:AUDIT:VIEW:ALL',
      'REPORT:OPERATIONAL:EXPORT', 'report.export', 'REPORT:FINANCIAL:EXPORT', 'REPORT:DEFAULTERS:VIEW', 'REPORT:PREDICTIONS:VIEW', 'report.view',
    ],
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'role_manager',
    code: 'MANAGER',
    name: 'General Manager',
    description: 'Operational leadership, loan approvals, large transaction overrides, and financial performance supervision.',
    portalPrefix: '/staff',
    isSystem: true,
    permissions: [
      'LOAN:APPLICATION:APPROVE', 'loan.approve', 'LOAN:APPLICATION:REJECT', 'LOAN:APPLICATION:VIEW:ALL', 'loan.view', 'LOAN:PENALTY:WAIVE',
      'TXN:WITHDRAWAL:APPROVE:LARGE', 'TXN:REVERSAL:APPROVE', 'transaction.reverse',
      'MEMBER:PROFILE:DELETE:APPROVE', 'MEMBER:PROFILE:SUSPEND', 'MEMBER:PROFILE:VIEW:ALL', 'member.view',
      'SAVING:TIMEDEPOSIT:OVERRIDE', 'SAVING:INTEREST:APPROVE', 'SAVING:ACCOUNT:VIEW:ALL', 'saving.view',
      'SHARE:ACCOUNT:VIEW:ALL', 'TXN:LEDGER:VIEW:ALL', 'transaction.view',
      'REPORT:OPERATIONAL:EXPORT', 'report.export', 'REPORT:FINANCIAL:EXPORT', 'REPORT:DEFAULTERS:VIEW', 'REPORT:PREDICTIONS:VIEW', 'report.view',
      'SYSTEM:AUDIT:VIEW:ALL', 'audit.view', 'SYSTEM:SECURITY:VIEW',
    ],
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'role_accountant',
    code: 'ACCOUNTANT',
    name: 'Senior Accountant & Teller',
    description: 'Cashier deposit/withdrawal processing, bank transfer slip verification, general ledger journals, and disbursements.',
    portalPrefix: '/staff',
    isSystem: true,
    permissions: [
      'TXN:DEPOSIT:CREATE', 'transaction.create', 'TXN:WITHDRAWAL:CREATE', 'TXN:REVERSAL:REQUEST', 'TXN:LEDGER:VIEW:ALL', 'transaction.view',
      'MEMBER:RECEIPT:VIEW:ALL', 'MEMBER:RECEIPT:VERIFY', 'MEMBER:RECEIPT:APPROVE', 'MEMBER:RECEIPT:REJECT',
      'ACCOUNTING:COA:MANAGE', 'ACCOUNTING:JOURNAL:CREATE', 'ACCOUNTING:JOURNAL:POST', 'ACCOUNTING:STATEMENTS:GEN',
      'SAVING:ACCOUNT:VIEW:ALL', 'saving.view', 'SAVING:ACCOUNT:CREATE', 'SAVING:INTEREST:EXECUTE',
      'LOAN:DISBURSEMENT:EXECUTE', 'LOAN:REPAYMENT:RECORD', 'LOAN:SCHEDULE:PRINT', 'LOAN:APPLICATION:VIEW:ALL', 'loan.view',
      'SHARE:ACCOUNT:VIEW:ALL', 'SHARE:PURCHASE:PROCESS', 'SHARE:CONVERT:PROCESS',
      'MEMBER:PROFILE:VIEW:ALL', 'member.view',
      'REPORT:FINANCIAL:EXPORT', 'REPORT:OPERATIONAL:EXPORT', 'report.export', 'report.view',
    ],
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'role_auditor',
    code: 'AUDITOR',
    name: 'Chief Internal Auditor',
    description: 'Independent oversight, trial balance inspection, exception review, and immutable audit log analysis.',
    portalPrefix: '/staff',
    isSystem: true,
    permissions: [
      'SYSTEM:AUDIT:VIEW:ALL', 'audit.view',
      'ACCOUNTING:AUDIT:VIEW:ALL', 'ACCOUNTING:STATEMENTS:GEN',
      'REPORT:FINANCIAL:EXPORT', 'REPORT:OPERATIONAL:EXPORT', 'report.export', 'REPORT:DEFAULTERS:VIEW', 'report.view',
      'TXN:LEDGER:VIEW:ALL', 'transaction.view', 'MEMBER:PROFILE:VIEW:ALL', 'member.view',
      'SAVING:ACCOUNT:VIEW:ALL', 'saving.view', 'SHARE:ACCOUNT:VIEW:ALL', 'LOAN:APPLICATION:VIEW:ALL', 'loan.view',
      'SYSTEM:SECURITY:VIEW', 'SYSTEM:COMPLIANCE:MANAGE',
    ],
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'role_cs',
    code: 'CUSTOMER_SERVICE',
    name: 'Member Service Officer',
    description: 'Member onboarding, KYC document verification, helpdesk support ticketing, passbook queries, and live assistance.',
    portalPrefix: '/staff',
    isSystem: true,
    permissions: [
      'MEMBER:PROFILE:VIEW:ALL', 'member.view', 'MEMBER:PROFILE:CREATE:ALL', 'member.create', 'MEMBER:PROFILE:UPDATE:ALL', 'member.update',
      'MEMBER:RECEIPT:VIEW:ALL', 'SAVING:ACCOUNT:VIEW:ALL', 'saving.view', 'SHARE:ACCOUNT:VIEW:ALL',
      'LOAN:APPLICATION:VIEW:ALL', 'loan.view', 'LOAN:APPLICATION:CREATE', 'TXN:LEDGER:VIEW:ALL', 'transaction.view',
      'SUPPORT:TICKET:MANAGE:ALL', 'NOTIF:DISPATCH:MANUAL', 'NOTIF:HISTORY:VIEW:ALL',
    ],
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'role_member',
    code: 'MEMBER',
    name: 'SACCO Member',
    description: 'Member self-service portal, digital passbook, savings, shares and loan applications.',
    portalPrefix: '/member',
    isSystem: true,
    permissions: [
      'MEMBER:PROFILE:VIEW:OWN', 'MEMBER:PROFILE:UPDATE:OWN', 'MEMBER:PROFILE:CREATE:SELF', 'MEMBER:RECEIPT:UPLOAD:OWN',
      'SAVING:ACCOUNT:VIEW:OWN', 'SHARE:ACCOUNT:VIEW:OWN', 'SHARE:PURCHASE:INITIATE:OWN', 'SHARE:CONVERT:INITIATE:OWN',
      'LOAN:APPLICATION:CREATE:OWN', 'LOAN:APPLICATION:VIEW:OWN', 'TXN:PASSBOOK:VIEW:OWN',
      'SUPPORT:TICKET:CREATE:OWN', 'SUPPORT:TICKET:VIEW:OWN',
    ],
    createdAt: '2025-01-01T00:00:00Z',
  },
];

const DEFAULT_PERMISSIONS: PermissionDetail[] = [
  { id: 'perm_user_manage', code: 'SYSTEM:USER:MANAGE', name: 'Manage Users', module: 'System', description: 'Create, update, deactivate users' },
  { id: 'perm_user_view', code: 'user.view', name: 'View Users', module: 'System', description: 'View user accounts' },
  { id: 'perm_user_create', code: 'user.create', name: 'Create Users', module: 'System', description: 'Create new user accounts' },
  { id: 'perm_user_update', code: 'user.update', name: 'Update Users', module: 'System', description: 'Update existing user accounts' },
  { id: 'perm_user_delete', code: 'user.delete', name: 'Delete Users', module: 'System', description: 'Delete or remove users' },
  { id: 'perm_role_manage', code: 'SYSTEM:ROLE:MANAGE', name: 'Manage Roles', module: 'System', description: 'Configure roles & permissions' },
  { id: 'perm_role_view', code: 'role.view', name: 'View Roles', module: 'System', description: 'View system roles' },
  { id: 'perm_role_create', code: 'role.create', name: 'Create Roles', module: 'System', description: 'Create new roles' },
  { id: 'perm_role_update', code: 'role.update', name: 'Update Roles', module: 'System', description: 'Update role permissions' },
  { id: 'perm_permission_view', code: 'permission.view', name: 'View Permissions', module: 'System', description: 'View system permissions' },
  { id: 'perm_settings_update', code: 'SYSTEM:SETTINGS:UPDATE', name: 'Update System Settings', module: 'System', description: 'Configure SACCO parameters' },
  { id: 'perm_audit_view_all', code: 'SYSTEM:AUDIT:VIEW:ALL', name: 'View All Audit Logs', module: 'System', description: 'Access audit trail' },
  { id: 'perm_audit_view', code: 'audit.view', name: 'View Audit Logs', module: 'System', description: 'View audit logs' },
  { id: 'perm_security_view', code: 'SYSTEM:SECURITY:VIEW', name: 'View Security Dashboard', module: 'System', description: 'Access security overview and risk scores' },
  { id: 'perm_security_manage', code: 'SYSTEM:SECURITY:MANAGE', name: 'Manage Security & MFA', module: 'System', description: 'Configure MFA policies, unlock accounts, sessions' },
  { id: 'perm_incident_manage', code: 'SYSTEM:INCIDENT:MANAGE', name: 'Manage Security Incidents', module: 'System', description: 'Investigate and resolve security incidents' },
  { id: 'perm_backup_manage', code: 'SYSTEM:BACKUP:MANAGE', name: 'Manage Backups & DR', module: 'System', description: 'Trigger backups and verify restore plans' },
  { id: 'perm_compliance_manage', code: 'SYSTEM:COMPLIANCE:MANAGE', name: 'Manage Compliance', module: 'System', description: 'Review regulatory compliance and access' },
  { id: 'perm_mem_view_all', code: 'MEMBER:PROFILE:VIEW:ALL', name: 'View All Member Profiles', module: 'Members', description: 'Search & view any member' },
  { id: 'perm_mem_view', code: 'member.view', name: 'View Member', module: 'Members', description: 'View member records' },
  { id: 'perm_mem_view_own', code: 'MEMBER:PROFILE:VIEW:OWN', name: 'View Own Member Profile', module: 'Members', description: 'View authenticated member profile' },
  { id: 'perm_mem_create_all', code: 'MEMBER:PROFILE:CREATE:ALL', name: 'Register New Member', module: 'Members', description: 'Staff member onboarding' },
  { id: 'perm_mem_create', code: 'member.create', name: 'Create Member', module: 'Members', description: 'Register member account' },
  { id: 'perm_mem_create_self', code: 'MEMBER:PROFILE:CREATE:SELF', name: 'Self Registration', module: 'Members', description: 'Public membership registration' },
  { id: 'perm_mem_update_all', code: 'MEMBER:PROFILE:UPDATE:ALL', name: 'Update All Member Profiles', module: 'Members', description: 'Staff KYC update' },
  { id: 'perm_mem_update', code: 'member.update', name: 'Update Member', module: 'Members', description: 'Update member details' },
  { id: 'perm_rcp_upload_own', code: 'MEMBER:RECEIPT:UPLOAD:OWN', name: 'Upload Own Deposit Receipt', module: 'Receipts', description: 'Upload payment slip' },
  { id: 'perm_rcp_view_all', code: 'MEMBER:RECEIPT:VIEW:ALL', name: 'View All Receipts', module: 'Receipts', description: 'View pending receipt queue' },
  { id: 'perm_rcp_verify', code: 'MEMBER:RECEIPT:VERIFY', name: 'Verify Bank Slip', module: 'Receipts', description: 'Accountant match slip' },
  { id: 'perm_rcp_approve', code: 'MEMBER:RECEIPT:APPROVE', name: 'Approve Receipt', module: 'Receipts', description: 'Approve & post deposit' },
  { id: 'perm_sav_view_all', code: 'SAVING:ACCOUNT:VIEW:ALL', name: 'View All Savings Accounts', module: 'Savings', description: 'Staff view all savings' },
  { id: 'perm_sav_view', code: 'saving.view', name: 'View Savings', module: 'Savings', description: 'View savings accounts' },
  { id: 'perm_shr_view_all', code: 'SHARE:ACCOUNT:VIEW:ALL', name: 'View All Share Accounts', module: 'Shares', description: 'Staff view member shares' },
  { id: 'perm_ln_view_all', code: 'LOAN:APPLICATION:VIEW:ALL', name: 'View All Loan Applications', module: 'Loans', description: 'Staff view all loans' },
  { id: 'perm_ln_view', code: 'loan.view', name: 'View Loans', module: 'Loans', description: 'View loan records' },
  { id: 'perm_txn_dep_create', code: 'TXN:DEPOSIT:CREATE', name: 'Create Deposit Transaction', module: 'Transactions', description: 'Cashier deposit entry' },
  { id: 'perm_txn_wdr_create', code: 'TXN:WITHDRAWAL:CREATE', name: 'Create Withdrawal Transaction', module: 'Transactions', description: 'Cashier withdrawal entry' },
  { id: 'perm_txn_led_view_all', code: 'TXN:LEDGER:VIEW:ALL', name: 'View All Transaction Ledgers', module: 'Transactions', description: 'Staff view transactions' },
  { id: 'perm_acc_coa_man', code: 'ACCOUNTING:COA:MANAGE', name: 'Manage Chart of Accounts', module: 'Accounting', description: 'Create & configure GL accounts' },
  { id: 'perm_acc_jnl_crt', code: 'ACCOUNTING:JOURNAL:CREATE', name: 'Create Journal Voucher', module: 'Accounting', description: 'Prepare manual journal entries' },
  { id: 'perm_rep_ops_exp', code: 'REPORT:OPERATIONAL:EXPORT', name: 'Export Operational Reports', module: 'Reports', description: 'Download CSV/PDF reports' },
  { id: 'perm_rep_fin_exp', code: 'REPORT:FINANCIAL:EXPORT', name: 'Export Financial Reports', module: 'Reports', description: 'Download regulatory reports' },
  { id: 'perm_sup_tkt_man_all', code: 'SUPPORT:TICKET:MANAGE:ALL', name: 'Manage All Support Tickets', module: 'Support', description: 'CS resolve member tickets' },
];

const DEFAULT_USERS: UserSummary[] = [
  {
    id: 'usr_admin_1',
    username: 'admin.sacco',
    email: 'admin@wabisacco.et',
    phoneNumber: '+251911223344',
    fullName: 'Samuel Ambaw (System Admin)',
    role: 'ADMIN',
    roles: [{ id: 'role_admin', code: 'ADMIN', name: 'System Administrator' }],
    status: 'ACTIVE',
    isActive: true,
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2026-08-29T10:00:00Z',
  },
  {
    id: 'usr_manager_1',
    username: 'manager.alemu',
    email: 'alemu.t@wabisacco.et',
    phoneNumber: '+251922334455',
    fullName: 'Alemu Tadesse (General Manager)',
    role: 'MANAGER',
    roles: [{ id: 'role_manager', code: 'MANAGER', name: 'General Manager' }],
    status: 'ACTIVE',
    isActive: true,
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2026-08-29T10:00:00Z',
  },
  {
    id: 'usr_acct_1',
    username: 'acct.dawit',
    email: 'dawit.k@wabisacco.et',
    phoneNumber: '+251933445566',
    fullName: 'Dawit Kebede (Senior Accountant / Teller)',
    role: 'ACCOUNTANT',
    roles: [{ id: 'role_accountant', code: 'ACCOUNTANT', name: 'Senior Accountant & Teller' }],
    status: 'ACTIVE',
    isActive: true,
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2026-08-29T10:00:00Z',
  },
  {
    id: 'usr_auditor_1',
    username: 'auditor.tigist',
    email: 'tigist.m@wabisacco.et',
    phoneNumber: '+251944556677',
    fullName: 'Tigist Mengistu (Chief Internal Auditor)',
    role: 'AUDITOR',
    roles: [{ id: 'role_auditor', code: 'AUDITOR', name: 'Chief Internal Auditor' }],
    status: 'ACTIVE',
    isActive: true,
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2026-08-29T10:00:00Z',
  },
  {
    id: 'usr_cs_1',
    username: 'cs.selam',
    email: 'selamawit.b@wabisacco.et',
    phoneNumber: '+251955667788',
    fullName: 'Selamawit Bekele (Member Care Officer)',
    role: 'CUSTOMER_SERVICE',
    roles: [{ id: 'role_cs', code: 'CUSTOMER_SERVICE', name: 'Member Service Officer' }],
    status: 'ACTIVE',
    isActive: true,
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2026-08-29T10:00:00Z',
  },
];

export const UserManagementView: React.FC = () => {
  const { success, error, warning, info } = useToast();
  const showToast = (msg: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    if (type === 'success') success(msg);
    else if (type === 'error') error(msg);
    else if (type === 'warning') warning(msg);
    else info(msg);
  };

  const [users, setUsers] = useState<UserSummary[]>(DEFAULT_USERS);
  const [roles, setRoles] = useState<RoleDetail[]>(DEFAULT_ROLES);
  const [permissions, setPermissions] = useState<PermissionDetail[]>(DEFAULT_PERMISSIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'permissions'>('roles');

  // Create User Modal
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    fullName: '',
    role: 'ACCOUNTANT',
    password: '',
    membershipNo: '',
  });

  // Edit User Modal
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserSummary | null>(null);

  // Selected Role for Permissions Matrix
  const [selectedRole, setSelectedRole] = useState<RoleDetail | null>(DEFAULT_ROLES[0]);
  const [rolePermSearch, setRolePermSearch] = useState('');
  const [rolePermModuleFilter, setRolePermModuleFilter] = useState('ALL');

  // Edit Role & Permissions Modal
  const [editRoleModalOpen, setEditRoleModalOpen] = useState(false);
  const [roleEditForm, setRoleEditForm] = useState<{
    id: string;
    code: string;
    name: string;
    description: string;
    portalPrefix: string;
    isSystem: boolean;
    permissions: string[];
  }>({
    id: '',
    code: '',
    name: '',
    description: '',
    portalPrefix: '/staff',
    isSystem: false,
    permissions: [],
  });
  const [modalPermSearch, setModalPermSearch] = useState('');
  const [modalModuleFilter, setModalModuleFilter] = useState('ALL');

  // Create Custom Role Modal
  const [createRoleModalOpen, setCreateRoleModalOpen] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState<{
    code: string;
    name: string;
    description: string;
    portalPrefix: string;
    permissions: string[];
  }>({
    code: '',
    name: '',
    description: '',
    portalPrefix: '/staff',
    permissions: [],
  });

  const fetchUsersAndRoles = async (keepSelectedRoleId?: string) => {
    try {
      const results = await Promise.allSettled([
        userManagementService.getUsers({ limit: 100 }),
        rbacManagementService.getRoles(),
        rbacManagementService.getPermissions(),
      ]);

      const [usersRes, rolesRes, permRes] = results;

      if (usersRes.status === 'fulfilled' && usersRes.value?.success && usersRes.value.data) {
        setUsers(usersRes.value.data);
      }
      if (rolesRes.status === 'fulfilled' && rolesRes.value?.success && rolesRes.value.data) {
        const fetchedRoles = rolesRes.value.data;
        setRoles(fetchedRoles);
        if (keepSelectedRoleId) {
          const found = fetchedRoles.find((r) => r.id === keepSelectedRoleId);
          setSelectedRole(found || fetchedRoles[0] || null);
        } else if (!selectedRole && fetchedRoles.length > 0) {
          setSelectedRole(fetchedRoles[0]);
        } else if (selectedRole) {
          const found = fetchedRoles.find((r) => r.id === selectedRole.id);
          setSelectedRole(found || fetchedRoles[0] || null);
        }
      }
      if (permRes.status === 'fulfilled' && permRes.value?.success && permRes.value.data) {
        setPermissions(permRes.value.data);
      }
    } catch {
      // Retain default roles, users, and permissions
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndRoles();
  }, []);

  // Available unique modules across permissions
  const allModules = Array.from(new Set(permissions.map((p) => p.module))).sort();

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.fullName || !newUser.phoneNumber) {
      showToast('Please fill all required user fields', 'warning');
      return;
    }
    try {
      const res = await userManagementService.createUser(newUser);
      if (res.success) {
        showToast(res.message || 'User account created successfully', 'success');
        setCreateUserModalOpen(false);
        setNewUser({
          username: '',
          email: '',
          phoneNumber: '',
          fullName: '',
          role: 'ACCOUNTANT',
          password: '',
          membershipNo: '',
        });
        fetchUsersAndRoles();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to create user', 'error');
    }
  };

  const handleToggleUserStatus = async (user: UserSummary) => {
    const newStatus = user.status === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE';
    try {
      const res = await userManagementService.updateUserStatus(user.id, newStatus);
      if (res.success) {
        showToast(`User status changed to ${newStatus}`, 'success');
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, status: newStatus, isActive: newStatus === 'ACTIVE' } : u))
        );
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update user status', 'error');
    }
  };

  const handleUnlockUser = async (userId: string) => {
    try {
      const res = await userManagementService.unlockUser(userId);
      if (res.success) {
        showToast('User account unlocked', 'success');
        fetchUsersAndRoles();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to unlock user', 'error');
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      const res = await userManagementService.updateUser(editingUser.id, {
        fullName: editingUser.fullName,
        email: editingUser.email,
        phoneNumber: editingUser.phoneNumber,
        role: editingUser.role,
      });
      if (res.success) {
        showToast('User profile updated', 'success');
        setEditUserModalOpen(false);
        fetchUsersAndRoles();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update user', 'error');
    }
  };

  // Open Edit Role & Permissions Modal
  const openEditRoleModal = (role: RoleDetail) => {
    setRoleEditForm({
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      portalPrefix: role.portalPrefix || '/staff',
      isSystem: role.isSystem,
      permissions: [...role.permissions],
    });
    setModalPermSearch('');
    setModalModuleFilter('ALL');
    setEditRoleModalOpen(true);
  };

  // Toggle permission in role edit modal
  const handleToggleModalPermission = (permCode: string) => {
    setRoleEditForm((prev) => {
      const exists = prev.permissions.includes(permCode);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((p) => p !== permCode)
          : [...prev.permissions, permCode],
      };
    });
  };

  // Select / Deselect all visible permissions in modal
  const handleSelectAllVisibleModal = (select: boolean) => {
    const visibleCodes = filteredModalPermissions.map((p) => p.code);
    setRoleEditForm((prev) => {
      if (select) {
        const combined = new Set([...prev.permissions, ...visibleCodes]);
        return { ...prev, permissions: Array.from(combined) };
      } else {
        return {
          ...prev,
          permissions: prev.permissions.filter((p) => !visibleCodes.includes(p)),
        };
      }
    });
  };

  // Save Role and Permissions changes
  const handleSaveRole = async () => {
    if (!roleEditForm.name.trim()) {
      showToast('Role name cannot be empty', 'warning');
      return;
    }
    setIsSavingRole(true);
    try {
      const res = await rbacManagementService.updateRole(roleEditForm.id, {
        name: roleEditForm.name.trim(),
        description: roleEditForm.description.trim(),
        portalPrefix: roleEditForm.portalPrefix.trim(),
        permissions: roleEditForm.permissions,
      });
      if (res.success) {
        showToast(`Role "${res.data.name}" updated with ${roleEditForm.permissions.length} permissions.`, 'success');
        setEditRoleModalOpen(false);
        // Dispatch live event to immediately sync workstation session and UI permissions
        window.dispatchEvent(
          new CustomEvent('wabi:permissions_updated', { detail: { roleCode: res.data.code } })
        );
        await fetchUsersAndRoles(roleEditForm.id);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update role permissions', 'error');
    } finally {
      setIsSavingRole(false);
    }
  };

  // Quick single-click remove permission directly from role view
  const handleRemovePermissionFromRole = async (role: RoleDetail, permCodeToRemove: string) => {
    const updatedPerms = role.permissions.filter((p) => p !== permCodeToRemove);
    try {
      const res = await rbacManagementService.updateRole(role.id, {
        permissions: updatedPerms,
      });
      if (res.success) {
        showToast(`Removed "${permCodeToRemove}" from ${role.name}`, 'info');
        // Dispatch live event to immediately sync workstation session and UI permissions
        window.dispatchEvent(
          new CustomEvent('wabi:permissions_updated', { detail: { roleCode: role.code } })
        );
        await fetchUsersAndRoles(role.id);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to remove permission', 'error');
    }
  };

  // Create Custom Role Handler
  const handleCreateCustomRole = async () => {
    if (!newRoleForm.code.trim() || !newRoleForm.name.trim()) {
      showToast('Please provide both Role Code and Name', 'warning');
      return;
    }
    try {
      const res = await rbacManagementService.createRole({
        code: newRoleForm.code.trim().toUpperCase(),
        name: newRoleForm.name.trim(),
        description: newRoleForm.description.trim(),
        portalPrefix: newRoleForm.portalPrefix.trim() || '/staff',
        permissions: newRoleForm.permissions,
      });
      if (res.success) {
        showToast(`Custom role "${res.data.name}" created successfully!`, 'success');
        setCreateRoleModalOpen(false);
        setNewRoleForm({
          code: '',
          name: '',
          description: '',
          portalPrefix: '/staff',
          permissions: [],
        });
        await fetchUsersAndRoles(res.data.id);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to create custom role', 'error');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phoneNumber.includes(searchQuery);

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Filter permissions in the selected role view
  const assignedPermissionsList = (selectedRole?.permissionsList || permissions.filter((p) => selectedRole?.permissions.includes(p.code))).filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(rolePermSearch.toLowerCase()) ||
      p.code.toLowerCase().includes(rolePermSearch.toLowerCase()) ||
      p.description.toLowerCase().includes(rolePermSearch.toLowerCase());
    const matchesModule = rolePermModuleFilter === 'ALL' || p.module === rolePermModuleFilter;
    return matchesSearch && matchesModule;
  });

  // Filter permissions inside modal editor
  const filteredModalPermissions = permissions.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(modalPermSearch.toLowerCase()) ||
      p.code.toLowerCase().includes(modalPermSearch.toLowerCase()) ||
      p.description.toLowerCase().includes(modalPermSearch.toLowerCase());
    const matchesModule = modalModuleFilter === 'ALL' || p.module === modalModuleFilter;
    return matchesSearch && matchesModule;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <LoadingSpinner size="md" />
        <p className="text-[13px] text-slate-500 font-medium">Loading Identity & Access Management...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-left max-w-[1600px] mx-auto pb-8">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/10 dark:bg-blue-950 text-blue-600 dark:text-sky-400 flex items-center justify-center font-bold">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-[20px] sm:text-[22px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
              User Accounts & Role Permissions (RBAC)
            </h1>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
              Staff workstation identities, granular privilege assignment, and governance controls.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchUsersAndRoles()}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            className="min-h-[34px] text-[13px]"
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateUserModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="min-h-[34px] text-[13px]"
          >
            Create Staff Account
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'roles', label: 'Role Definitions & Permissions Matrix', count: roles.length, icon: <Shield className="w-3.5 h-3.5" /> },
          { id: 'users', label: 'Staff Accounts Register', count: users.length, icon: <Users className="w-3.5 h-3.5" /> },
          { id: 'permissions', label: 'Atomic Permissions Catalog', count: permissions.length, icon: <Lock className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-[12.5px] font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === tab.id ? 'bg-blue-800 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ========================================================= */}
      {/* 1. ROLES MATRIX TAB (PRIMARY FOR ROLE & PERMISSION EDITING) */}
      {/* ========================================================= */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
          {/* Left Column: Roles List (4 cols) */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-[14px]">System & Custom Roles</h3>
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400">Select a role to configure permissions</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateRoleModalOpen(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="min-h-[30px] text-[12px] px-2.5"
              >
                Add Role
              </Button>
            </div>

            <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
              {roles.map((r) => {
                const isSelected = selectedRole?.id === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRole(r)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 shadow-xs ring-1 ring-blue-500/20'
                        : 'bg-slate-50/60 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-slate-100/80 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[13px] text-slate-900 dark:text-white">{r.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                          {r.code}
                        </span>
                      </div>
                      <Badge variant={r.isSystem ? 'neutral' : 'info'} size="sm">
                        {r.isSystem ? 'System Core' : 'Custom'}
                      </Badge>
                    </div>

                    <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {r.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 mt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-[11px] text-blue-700 dark:text-sky-400 font-bold flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        {r.permissions.length} Atomic Permissions
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditRoleModal(r);
                        }}
                        className="text-[11.5px] font-bold text-blue-600 hover:text-blue-800 dark:text-sky-400 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit Access
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Role Permission Matrix Explorer (8 cols) */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 sm:p-5 space-y-3.5">
            {selectedRole ? (
              <>
                {/* Header with Title, Code, and Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-white text-[16px]">{selectedRole.name}</h3>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-sky-300 font-bold">
                        {selectedRole.code}
                      </span>
                      <Badge variant="primary" size="sm">
                        {selectedRole.permissions.length} Assigned Permissions
                      </Badge>
                    </div>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{selectedRole.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => openEditRoleModal(selectedRole)}
                      leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
                      className="min-h-[34px] text-[12.5px] px-3.5"
                    >
                      Configure Permissions
                    </Button>
                  </div>
                </div>

                {/* Filter and Search within Role Permissions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200/80 dark:border-slate-700">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder={`Filter ${selectedRole.name} permissions...`}
                      value={rolePermSearch}
                      onChange={(e) => setRolePermSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1 text-[12px] bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden"
                    />
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
                    <span className="text-slate-400 font-medium px-1">Module:</span>
                    {['ALL', ...allModules].map((mod) => (
                      <button
                        key={mod}
                        type="button"
                        onClick={() => setRolePermModuleFilter(mod)}
                        className={`px-2 py-0.5 rounded font-bold whitespace-nowrap transition-colors cursor-pointer ${
                          rolePermModuleFilter === mod
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {mod}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Assigned Permissions Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[520px] overflow-y-auto pr-1">
                  {assignedPermissionsList.length > 0 ? (
                    assignedPermissionsList.map((perm) => (
                      <div
                        key={perm.id || perm.code}
                        className="p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 text-[12px] space-y-1 hover:border-slate-300 dark:hover:border-slate-600 transition-colors group relative"
                      >
                        <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between gap-1">
                          <span className="truncate pr-1">{perm.name}</span>
                          <span className="text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-sky-300 px-1.5 py-0.2 rounded shrink-0">
                            {perm.module}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">
                          {perm.description}
                        </p>
                        <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-slate-400 dark:text-slate-500">
                          <span className="truncate">{perm.code}</span>
                          <button
                            type="button"
                            title={`Revoke ${perm.name} from ${selectedRole.name}`}
                            onClick={() => handleRemovePermissionFromRole(selectedRole, perm.code)}
                            className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/60 p-1 rounded transition-colors flex items-center gap-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-12 text-slate-400 text-[12.5px]">
                      No permissions match your filter in this role. Click <strong>Configure Permissions</strong> to assign more.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-slate-400 text-[13px]">
                Select a role from the left to inspect and configure its permissions matrix.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. USERS TAB */}
      {/* ========================================================= */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 sm:p-5 space-y-3.5">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search staff by name, username, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-4 py-1.5 text-[12.5px] bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <SelectInput
                label=""
                value={roleFilter}
                options={[
                  { value: 'ALL', label: 'All Roles' },
                  ...roles.map((r) => ({ value: r.code, label: r.name })),
                ]}
                onChange={(val) => setRoleFilter(val)}
              />
              <SelectInput
                label=""
                value={statusFilter}
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  { value: 'ACTIVE', label: 'Active Only' },
                  { value: 'DEACTIVATED', label: 'Deactivated' },
                ]}
                onChange={(val) => setStatusFilter(val)}
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
            <table className="w-full text-[12.5px] text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">User Details</th>
                  <th className="py-2.5 px-3">Role Assignment</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Security / Lockout</th>
                  <th className="py-2.5 px-3">Last Login</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">{u.fullName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">@{u.username} • {u.email}</div>
                      <div className="text-[11px] text-slate-400">{u.phoneNumber}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant="primary" size="sm">{u.role}</Badge>
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant={u.status === 'ACTIVE' ? 'success' : 'danger'} size="sm">
                        {u.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3">
                      {(u.failedLoginAttempts || 0) > 0 ? (
                        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>{u.failedLoginAttempts} failed attempts</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Clean</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Never'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {(u.failedLoginAttempts || 0) >= 3 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Unlock Account"
                            onClick={() => handleUnlockUser(u.id)}
                            className="p-1"
                          >
                            <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Edit User Details"
                          onClick={() => {
                            setEditingUser(u);
                            setEditUserModalOpen(true);
                          }}
                          className="p-1"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title={u.status === 'ACTIVE' ? 'Deactivate User' : 'Activate User'}
                          onClick={() => handleToggleUserStatus(u)}
                          className="p-1"
                        >
                          {u.status === 'ACTIVE' ? (
                            <UserX className="w-3.5 h-3.5 text-rose-600" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. PERMISSIONS CATALOG TAB */}
      {/* ========================================================= */}
      {activeTab === 'permissions' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 sm:p-5 space-y-3.5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <h3 className="font-bold text-slate-900 dark:text-white text-[15px]">Complete Atomic Permissions Catalog</h3>
            <p className="text-[12px] text-slate-500 dark:text-slate-400">
              Cooperative microservice authorization policies across accounting, teller, loan underwriting, and audit.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {permissions.map((p) => (
              <div key={p.id} className="p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 text-[12px] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">{p.name}</span>
                  <span className="text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded">
                    {p.module}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{p.description}</p>
                <div className="text-[10px] font-mono text-blue-700 dark:text-sky-400 font-semibold">{p.code}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT ROLE & CONFIGURE PERMISSIONS MATRIX */}
      {/* ========================================================= */}
      <Modal
        isOpen={editRoleModalOpen}
        onClose={() => setEditRoleModalOpen(false)}
        title={`Configure Role & Permissions: ${roleEditForm.name}`}
        description="Selectively assign or revoke atomic authorization policies for this SACCO workstation role."
        size="xl"
      >
        <div className="space-y-4 text-[12.5px]">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
            <TextInput
              label="Role Display Name"
              value={roleEditForm.name}
              onChange={(e) => setRoleEditForm({ ...roleEditForm, name: e.target.value })}
              required
            />
            <TextInput
              label="Role Code"
              value={roleEditForm.code}
              disabled={roleEditForm.isSystem}
              onChange={(e) => setRoleEditForm({ ...roleEditForm, code: e.target.value })}
              required
            />
            <TextInput
              label="Workstation Route Prefix"
              value={roleEditForm.portalPrefix}
              placeholder="/staff"
              onChange={(e) => setRoleEditForm({ ...roleEditForm, portalPrefix: e.target.value })}
              required
            />
          </div>

          <TextInput
            label="Role Scope & Description"
            value={roleEditForm.description}
            onChange={(e) => setRoleEditForm({ ...roleEditForm, description: e.target.value })}
          />

          {/* Permissions Matrix Header & Search */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[13px] text-slate-900 dark:text-white">Atomic Permissions Matrix</span>
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  {roleEditForm.permissions.length} of {permissions.length} Selected
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAllVisibleModal(true)}
                  className="text-[11.5px] font-bold text-blue-600 hover:text-blue-800 dark:text-sky-400 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-slate-800"
                >
                  Select All Visible
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => handleSelectAllVisibleModal(false)}
                  className="text-[11.5px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Deselect All Visible
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search atomic permissions by name, code or description..."
                  value={modalPermSearch}
                  onChange={(e) => setModalPermSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              {/* Module Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto py-1 text-[11px]">
                {['ALL', ...allModules].map((mod) => (
                  <button
                    key={mod}
                    type="button"
                    onClick={() => setModalModuleFilter(mod)}
                    className={`px-2 py-0.5 rounded font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      modalModuleFilter === mod
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {mod}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Checkbox Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[380px] overflow-y-auto pr-1 p-1">
            {filteredModalPermissions.map((perm) => {
              const isChecked = roleEditForm.permissions.includes(perm.code);
              return (
                <div
                  key={perm.id || perm.code}
                  onClick={() => handleToggleModalPermission(perm.code)}
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-start gap-2.5 select-none ${
                    isChecked
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="pt-0.5">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`font-bold text-[12px] truncate ${isChecked ? 'text-emerald-900 dark:text-emerald-200' : 'text-slate-900 dark:text-white'}`}>
                        {perm.name}
                      </span>
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                        {perm.module}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{perm.description}</p>
                    <div className="text-[9.5px] font-mono text-slate-400 truncate mt-0.5">{perm.code}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
            <span className="text-[11.5px] text-slate-500 font-medium">
              Changes take effect immediately across all active sessions for this role.
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditRoleModalOpen(false)}
                className="min-h-[34px] text-[12.5px]"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveRole}
                isLoading={isSavingRole}
                leftIcon={<Check className="w-3.5 h-3.5" />}
                className="min-h-[34px] text-[12.5px] px-4"
              >
                Save Role & Permissions
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL: CREATE CUSTOM ROLE */}
      {/* ========================================================= */}
      <Modal
        isOpen={createRoleModalOpen}
        onClose={() => setCreateRoleModalOpen(false)}
        title="Create New Custom System Role"
        description="Define a new organizational role with tailored operational and security privileges."
        size="md"
      >
        <div className="space-y-3.5 text-[12.5px]">
          <div className="grid grid-cols-2 gap-3">
            <TextInput
              label="Role Code (e.g. LOAN_OFFICER)"
              placeholder="LOAN_OFFICER"
              value={newRoleForm.code}
              onChange={(e) => setNewRoleForm({ ...newRoleForm, code: e.target.value.toUpperCase() })}
              required
            />
            <TextInput
              label="Role Name"
              placeholder="e.g. Senior Credit Officer"
              value={newRoleForm.name}
              onChange={(e) => setNewRoleForm({ ...newRoleForm, name: e.target.value })}
              required
            />
          </div>

          <TextInput
            label="Workstation Route Prefix"
            placeholder="/staff"
            value={newRoleForm.portalPrefix}
            onChange={(e) => setNewRoleForm({ ...newRoleForm, portalPrefix: e.target.value })}
          />

          <TextInput
            label="Description"
            placeholder="Operational scope, approval ceilings and responsibilities"
            value={newRoleForm.description}
            onChange={(e) => setNewRoleForm({ ...newRoleForm, description: e.target.value })}
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateRoleModalOpen(false)}
              className="min-h-[34px] text-[12.5px]"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateCustomRole}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="min-h-[34px] text-[12.5px]"
            >
              Create Role
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL: CREATE USER */}
      {/* ========================================================= */}
      <Modal
        isOpen={createUserModalOpen}
        onClose={() => setCreateUserModalOpen(false)}
        title="Create New Staff Account"
        description="Provision a cooperative workstation identity with role-based credentials."
      >
        <div className="space-y-3.5 text-[12.5px]">
          <TextInput
            label="Full Name"
            placeholder="e.g. Almaz Bekele"
            value={newUser.fullName}
            onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <TextInput
              label="Username"
              placeholder="e.g. almaz.b"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              required
            />
            <TextInput
              label="Phone Number"
              placeholder="+251911223344"
              value={newUser.phoneNumber}
              onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
              required
            />
          </div>
          <TextInput
            label="Email Address"
            type="email"
            placeholder="almaz@wabisacco.et"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <SelectInput
              label="Workstation Role"
              value={newUser.role}
              options={roles.map((r) => ({ value: r.code, label: r.name }))}
              onChange={(val) => setNewUser({ ...newUser, role: val })}
            />
            <TextInput
              label="Initial Password"
              type="password"
              placeholder="Min 8 chars, 1 digit, 1 symbol"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateUserModalOpen(false)}
              className="min-h-[34px] text-[12.5px]"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateUser}
              className="min-h-[34px] text-[12.5px]"
            >
              Provision Account
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL: EDIT USER */}
      {/* ========================================================= */}
      <Modal
        isOpen={editUserModalOpen}
        onClose={() => setEditUserModalOpen(false)}
        title="Edit Staff Account Profile"
        description="Update contact information and assigned administrative role."
      >
        {editingUser && (
          <div className="space-y-3.5 text-[12.5px]">
            <TextInput
              label="Full Name"
              value={editingUser.fullName}
              onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
              required
            />
            <TextInput
              label="Email Address"
              type="email"
              value={editingUser.email}
              onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
              required
            />
            <TextInput
              label="Phone Number"
              value={editingUser.phoneNumber}
              onChange={(e) => setEditingUser({ ...editingUser, phoneNumber: e.target.value })}
              required
            />
            <SelectInput
              label="Assigned Role"
              value={editingUser.role}
              options={roles.map((r) => ({ value: r.code, label: r.name }))}
              onChange={(val) => setEditingUser({ ...editingUser, role: val })}
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditUserModalOpen(false)}
                className="min-h-[34px] text-[12.5px]"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleUpdateUser}
                className="min-h-[34px] text-[12.5px]"
              >
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
