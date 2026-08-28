import React, { useState, useEffect } from 'react';
import { DataTable } from '../../components/table/DataTable';
import { ColumnDef } from '../../types/table';
import { formatCurrency, formatDateTime, formatDate } from '../../utils/formatters';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { TextInput } from '../../components/common/TextInput';
import { SelectInput } from '../../components/common/SelectInput';
import { Alert } from '../../components/common/Alert';
import { useToast } from '../../providers/ToastProvider';
import { useAuth } from '../../providers/AuthProvider';
import {
  Users,
  FileCheck,
  CheckCircle2,
  XCircle,
  Receipt,
  Scale,
  FileSpreadsheet,
  ShieldAlert,
  Settings,
  Eye,
  Plus,
  Filter,
  Download,
  Search,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  AlertTriangle,
  RefreshCw,
  Ban,
  UserCheck,
  UserX,
  FileText
} from 'lucide-react';
import { TransactionRecord, ApprovalRequest, BankReceiptSlip } from '../../types/financial';
import { memberApiService, ClientMember, ClientRegistrationRequest } from '../../services/memberApiService';

/* ==========================================================================
   1. MEMBERS DIRECTORY MODULE (PHASE 11 MEMBERSHIP MANAGEMENT)
   ========================================================================== */
export const MembersListView: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [members, setMembers] = useState<ClientMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<ClientMember | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'address' | 'employment' | 'nominees' | 'actions'>('profile');

  // Modal actions state
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [terminateModalOpen, setTerminateModalOpen] = useState(false);
  const [terminateReason, setTerminateReason] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const res = await memberApiService.getMembers();
      setMembers(res.members || []);
    } catch (err: any) {
      toastError('Failed to load members', err?.message || 'Could not fetch SACCO members list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleActivate = async (member: ClientMember) => {
    try {
      const res = await memberApiService.activateMember(member.id);
      success('Member Activated', `Member ${member.membershipNo} (${member.fullName}) has been activated.`);
      setSelectedMember(res.data);
      fetchMembers();
    } catch (err: any) {
      toastError('Activation Failed', err?.error?.message || err?.message || 'Could not activate member.');
    }
  };

  const handleSuspend = async () => {
    if (!selectedMember || !suspendReason.trim()) return;
    setIsProcessingAction(true);
    try {
      const res = await memberApiService.suspendMember(selectedMember.id, suspendReason.trim());
      success('Member Suspended', `Member ${selectedMember.membershipNo} has been suspended.`);
      setSelectedMember(res.data);
      setSuspendModalOpen(false);
      setSuspendReason('');
      fetchMembers();
    } catch (err: any) {
      toastError('Suspension Failed', err?.error?.message || err?.message || 'Could not suspend member.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleTerminate = async () => {
    if (!selectedMember || !terminateReason.trim()) return;
    setIsProcessingAction(true);
    try {
      const res = await memberApiService.terminateMember(selectedMember.id, terminateReason.trim());
      success('Member Terminated', `Membership ${selectedMember.membershipNo} has been terminated.`);
      setSelectedMember(res.data);
      setTerminateModalOpen(false);
      setTerminateReason('');
      fetchMembers();
    } catch (err: any) {
      toastError('Termination Failed', err?.error?.message || err?.message || 'Could not terminate member.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const columns: ColumnDef<ClientMember>[] = [
    {
      id: 'membershipNo',
      header: 'Member ID',
      accessorKey: 'membershipNo',
      sortable: true,
      cell: ({ row }) => (
        <span className="font-mono font-bold text-blue-600 dark:text-sky-400 bg-blue-50 dark:bg-blue-950/50 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 text-[15px]">
          {row.membershipNo}
        </span>
      ),
    },
    {
      id: 'fullName',
      header: 'Full Legal Name',
      accessorKey: 'fullName',
      sortable: true,
      cell: ({ row }) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-white text-[17px]">{row.fullName}</div>
          <div className="text-[14px] text-slate-400 font-mono mt-0.5">{row.nationalId}</div>
        </div>
      ),
    },
    {
      id: 'contact',
      header: 'Contact Info',
      cell: ({ row }) => (
        <div className="text-[16px]">
          <div className="text-slate-800 dark:text-slate-200 font-medium">{row.phoneNumber}</div>
          <div className="text-[14px] text-slate-400">{row.email}</div>
        </div>
      ),
    },
    {
      id: 'occupation',
      header: 'Occupation / Employer',
      cell: ({ row }) => (
        <div className="text-[16px]">
          <span className="font-medium text-slate-900 dark:text-slate-100">{row.occupation || 'N/A'}</span>
          <span className="text-[14px] text-slate-400 block">{row.employer || row.employmentType}</span>
        </div>
      ),
    },
    {
      id: 'joinDate',
      header: 'Membership Date',
      align: 'right',
      cell: ({ row }) => <span className="text-slate-600 dark:text-slate-400 text-[16px]">{formatDate(row.membershipDate || row.createdAt)}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      align: 'center',
      cell: ({ row }) => {
        const variant =
          row.status === 'ACTIVE'
            ? 'success'
            : row.status === 'SUSPENDED'
            ? 'warning'
            : row.status === 'TERMINATED'
            ? 'error'
            : 'neutral';
        return (
          <Badge variant={variant} size="md">
            {row.status}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Action',
      align: 'right',
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => { setSelectedMember(row); setActiveTab('profile'); }} className="h-[32px] text-[12.5px]">
          <Eye className="w-4 h-4 mr-1 text-[#16A34A]" /> View Full KYC
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-[#16A34A] uppercase tracking-wider">Membership Ledger</span>
          <h1 className="text-[24px] sm:text-[32px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">Member Directory & KYC Registry</h1>
          <p className="text-[15px] text-slate-500 dark:text-slate-400 max-w-3xl">
            Complete member records, residential details, 100% nominee beneficiary allocations, and account lifecycle controls.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={fetchMembers} leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />} className="h-[38px] text-[13px] px-3.5">
            Refresh Registry
          </Button>
        </div>
      </div>

      <DataTable
        data={members}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchPlaceholder="Search by name, sequential Member ID (WB000...), phone, national ID..."
        searchableKey={(item) => `${item.fullName} ${item.membershipNo} ${item.phoneNumber} ${item.nationalId} ${item.email}`}
      />

      {/* Comprehensive Member Profile Drawer / Modal */}
      {selectedMember && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedMember(null)}
          title={`Member Profile: ${selectedMember.fullName} (${selectedMember.membershipNo})`}
          size="lg"
          footer={
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-3">
                <span className="text-[16px] text-slate-500">Current Status:</span>
                <span
                  className={`text-[15px] font-bold px-3 py-1 rounded-lg ${
                    selectedMember.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : selectedMember.status === 'SUSPENDED'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                  }`}
                >
                  {selectedMember.status}
                </span>
              </div>
              <Button variant="secondary" size="md" onClick={() => setSelectedMember(null)} className="min-h-[52px] text-[18px] px-6">
                Close Profile
              </Button>
            </div>
          }
        >
          <div className="space-y-6 text-[16px]">
            {/* Header Identity Card */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <span className="text-slate-400 uppercase font-semibold text-[13px] tracking-wider">Sequential Member ID</span>
                <p className="font-mono font-bold text-blue-600 dark:text-sky-400 text-[20px] mt-1">{selectedMember.membershipNo}</p>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold text-[13px] tracking-wider">National Kebele ID</span>
                <p className="font-semibold text-slate-900 dark:text-white text-[17px] mt-1">{selectedMember.nationalId}</p>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold text-[13px] tracking-wider">Gender / DOB</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-[17px] mt-1">
                  {selectedMember.gender} • {formatDate(selectedMember.dateOfBirth)}
                </p>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold text-[13px] tracking-wider">Membership Date</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-[17px] mt-1">
                  {formatDate(selectedMember.membershipDate || selectedMember.createdAt)}
                </p>
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-[16px] font-semibold overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`pb-3 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'profile' ? 'border-blue-600 text-blue-600 dark:text-sky-400' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Contact & Emergency
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('address')}
                className={`pb-3 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'address' ? 'border-blue-600 text-blue-600 dark:text-sky-400' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Residence & Address
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('employment')}
                className={`pb-3 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'employment' ? 'border-blue-600 text-blue-600 dark:text-sky-400' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Employment & Income
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('nominees')}
                className={`pb-3 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'nominees' ? 'border-blue-600 text-blue-600 dark:text-sky-400' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Nominee Beneficiaries ({selectedMember.nominees?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('actions')}
                className={`pb-3 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'actions' ? 'border-blue-600 text-blue-600 dark:text-sky-400' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Staff Actions
              </button>
            </div>

            {/* TAB 1: CONTACT & EMERGENCY */}
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                  <h5 className="font-bold text-slate-900 dark:text-white text-[18px] flex items-center gap-2">
                    <Phone className="w-5 h-5 text-blue-600 dark:text-sky-400" /> Direct Contact Info
                  </h5>
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Mobile Phone:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{selectedMember.phoneNumber}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Email Address:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{selectedMember.email}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-500">Family Dependents:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{selectedMember.familyMembersCount || 0} members</span>
                  </div>
                </div>

                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                  <h5 className="font-bold text-slate-900 dark:text-white text-[18px] flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" /> Emergency Contact
                  </h5>
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Full Name:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{selectedMember.emergencyContact?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Relationship:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{selectedMember.emergencyContact?.relationship || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Phone Number:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{selectedMember.emergencyContact?.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-500">Address:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{selectedMember.emergencyContact?.address || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: RESIDENTIAL ADDRESS */}
            {activeTab === 'address' && (
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                <h5 className="font-bold text-slate-900 dark:text-white text-[18px] flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600 dark:text-sky-400" /> Official Residential Registration
                </h5>
                <div className="grid grid-cols-2 gap-6 pt-2">
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Region / City:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{selectedMember.address?.region || 'Addis Ababa'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Zone / Sub-City:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{selectedMember.address?.zone || 'Bole Subcity'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Woreda:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{selectedMember.address?.woreda || 'Woreda 03'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Kebele:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{selectedMember.address?.kebele || 'Kebele 07'}</span>
                  </div>
                </div>
                <div className="py-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <span className="text-slate-500">Specific House / Landmark:</span>
                  <p className="font-medium text-slate-800 dark:text-slate-200 mt-1">{selectedMember.address?.specificAddress || 'Not specified'}</p>
                </div>
              </div>
            )}

            {/* TAB 3: EMPLOYMENT & INCOME */}
            {activeTab === 'employment' && (
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                <h5 className="font-bold text-slate-900 dark:text-white text-[18px] flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-600 dark:text-sky-400" /> Occupation & Income Verification
                </h5>
                <div className="grid grid-cols-2 gap-6 pt-2">
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Occupation:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{selectedMember.occupation || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Employment Type:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{selectedMember.employmentType || 'Employed'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Employer / Business:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{selectedMember.employer || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Monthly Income:</span>
                    <span className="font-bold text-emerald-600 text-[18px]">{formatCurrency(selectedMember.monthlyIncome || 0)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: NOMINEES */}
            {activeTab === 'nominees' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Nominee Beneficiaries (Mandatory 100% Total):</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 text-[16px]">
                    Total: {selectedMember.nominees?.reduce((s, n) => s + (n.percentage || 0), 0) || 0}%
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {selectedMember.nominees && selectedMember.nominees.length > 0 ? (
                    selectedMember.nominees.map((nom, idx) => (
                      <div key={idx} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 shadow-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900 dark:text-white text-[17px]">
                            {nom.fullName} ({nom.relationship})
                          </span>
                          <span className="font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-lg text-[15px]">
                            {nom.percentage}% Share
                          </span>
                        </div>
                        <div className="text-[14px] text-slate-500 flex gap-6">
                          <span>Phone: <strong className="text-slate-700 dark:text-slate-300">{nom.phone}</strong></span>
                          <span>Address: <strong className="text-slate-700 dark:text-slate-300">{nom.address || 'N/A'}</strong></span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-[16px]">
                      No nominees registered.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: STAFF ACTIONS */}
            {activeTab === 'actions' && (
              <div className="p-6 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-4">
                <h5 className="font-bold text-slate-900 dark:text-white text-[18px]">Membership Lifecycle Management</h5>
                <p className="text-slate-600 dark:text-slate-400 text-[15px]">
                  Manage the member's account status. Suspending or terminating a member restricts transactions and updates the audit log.
                </p>

                <div className="flex flex-wrap gap-4 pt-2">
                  {selectedMember.status !== 'ACTIVE' && (
                    <Button
                      variant="success"
                      size="md"
                      onClick={() => handleActivate(selectedMember)}
                      leftIcon={<UserCheck className="w-5 h-5" />}
                      className="min-h-[52px] text-[18px] px-6"
                    >
                      Re-activate Member
                    </Button>
                  )}

                  {selectedMember.status === 'ACTIVE' && (
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => setSuspendModalOpen(true)}
                      className="border-amber-400 text-amber-800 hover:bg-amber-50 min-h-[52px] text-[18px] px-6"
                      leftIcon={<Ban className="w-5 h-5" />}
                    >
                      Suspend Membership
                    </Button>
                  )}

                  {selectedMember.status !== 'TERMINATED' && (
                    <Button
                      variant="danger"
                      size="md"
                      onClick={() => setTerminateModalOpen(true)}
                      leftIcon={<UserX className="w-5 h-5" />}
                      className="min-h-[52px] text-[18px] px-6"
                    >
                      Terminate Membership
                    </Button>
                  )}
                </div>

                {selectedMember.suspendedReason && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-200 text-[15px]">
                    <span className="font-bold">Suspension Reason:</span> {selectedMember.suspendedReason}
                  </div>
                )}

                {selectedMember.terminatedReason && (
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-900 dark:text-rose-200 text-[15px]">
                    <span className="font-bold">Termination Reason:</span> {selectedMember.terminatedReason}
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Suspend Reason Modal */}
      {suspendModalOpen && selectedMember && (
        <Modal
          isOpen={true}
          onClose={() => setSuspendModalOpen(false)}
          title={`Suspend Member ${selectedMember.membershipNo}`}
          size="md"
          footer={
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" size="sm" onClick={() => setSuspendModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleSuspend}
                isLoading={isProcessingAction}
                disabled={!suspendReason.trim()}
              >
                Confirm Suspension
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            <p className="text-slate-600">
              Please enter the mandatory audit reason for suspending member <strong>{selectedMember.fullName}</strong>.
            </p>
            <TextInput
              label="Suspension Reason"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="e.g. Failure to maintain mandatory savings / KYC update pending"
              required
            />
          </div>
        </Modal>
      )}

      {/* Terminate Reason Modal */}
      {terminateModalOpen && selectedMember && (
        <Modal
          isOpen={true}
          onClose={() => setTerminateModalOpen(false)}
          title={`Terminate Member ${selectedMember.membershipNo}`}
          size="md"
          footer={
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" size="sm" onClick={() => setTerminateModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleTerminate}
                isLoading={isProcessingAction}
                disabled={!terminateReason.trim()}
              >
                Confirm Termination
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            <p className="text-slate-600">
              Terminating a membership permanently revokes voting rights and queues share capital liquidation.
            </p>
            <TextInput
              label="Termination Reason"
              value={terminateReason}
              onChange={(e) => setTerminateReason(e.target.value)}
              placeholder="e.g. Voluntary withdrawal from cooperative / relocation"
              required
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

/* ==========================================================================
   2. RECEIPT VERIFICATION & ACCOUNTANT APPROVAL QUEUE (PHASE 11)
   ========================================================================== */
export const ReceiptVerificationView: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [requests, setRequests] = useState<ClientRegistrationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<ClientRegistrationRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');

  // Rejection modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await memberApiService.getRegistrationRequests({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      });
      setRequests(res.requests || []);
    } catch (err: any) {
      toastError('Failed to load queue', err?.message || 'Could not fetch registration requests.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleApprove = async (req: ClientRegistrationRequest) => {
    setIsProcessing(true);
    try {
      const res = await memberApiService.approveRegistrationRequest(req.id);
      success(
        'Application Approved!',
        `Assigned sequential Member ID ${res.membershipNo} to ${req.personalInfo.fullName}. User account created!`
      );
      setSelectedReq(null);
      fetchRequests();
    } catch (err: any) {
      toastError('Approval Failed', err?.error?.message || err?.message || 'Could not approve registration.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReq || !rejectReason.trim()) return;
    setIsProcessing(true);
    try {
      await memberApiService.rejectRegistrationRequest(selectedReq.id, rejectReason.trim());
      success('Application Rejected', `Marked ${selectedReq.applicationReference} as rejected.`);
      setRejectModalOpen(false);
      setSelectedReq(null);
      setRejectReason('');
      fetchRequests();
    } catch (err: any) {
      toastError('Rejection Failed', err?.error?.message || err?.message || 'Could not reject request.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Separation of duties check
  const isSelfUploaded =
    selectedReq &&
    user &&
    (selectedReq.contactInfo?.email?.toLowerCase() === user.email?.toLowerCase() ||
      selectedReq.contactInfo?.phoneNumber === user.phoneNumber);

  const columns: ColumnDef<ClientRegistrationRequest>[] = [
    {
      id: 'ref',
      header: 'App Reference',
      accessorKey: 'applicationReference',
      cell: ({ row }) => (
        <span className="font-mono font-bold text-blue-600 dark:text-sky-400 bg-blue-50 dark:bg-blue-950/50 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 text-[15px]">
          {row.applicationReference}
        </span>
      ),
    },
    {
      id: 'applicant',
      header: 'Applicant / National ID',
      cell: ({ row }) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-white text-[17px]">{row.personalInfo?.fullName}</div>
          <div className="text-[14px] text-slate-400 font-mono mt-0.5">{row.personalInfo?.nationalId}</div>
        </div>
      ),
    },
    {
      id: 'contact',
      header: 'Phone / Email',
      cell: ({ row }) => (
        <div className="text-[16px]">
          <div className="text-slate-800 dark:text-slate-200 font-medium">{row.contactInfo?.phoneNumber}</div>
          <div className="text-[14px] text-slate-400">{row.contactInfo?.email}</div>
        </div>
      ),
    },
    {
      id: 'bank',
      header: 'Payment Channel & FT Ref',
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-slate-800 dark:text-slate-200 text-[16px]">{row.payment?.paymentMethod || 'CBE'}</div>
          <div className="font-mono text-[14px] text-blue-700 dark:text-sky-400 font-bold">{row.payment?.referenceNumber}</div>
        </div>
      ),
    },
    {
      id: 'amount',
      header: 'Reg Fee',
      align: 'right',
      cell: ({ row }) => <span className="font-bold text-emerald-600 text-[17px]">ETB 1,000.00</span>,
    },
    {
      id: 'status',
      header: 'Status',
      align: 'center',
      cell: ({ row }) => {
        const variant =
          row.status === 'APPROVED' ? 'success' : row.status === 'REJECTED' ? 'error' : 'warning';
        return (
          <Badge variant={variant} size="md">
            {row.status}
          </Badge>
        );
      },
    },
    {
      id: 'action',
      header: 'Action',
      align: 'right',
      cell: ({ row }) => (
        <Button variant="outline" size="md" onClick={() => setSelectedReq(row)} className="min-h-[44px] text-[16px] px-4">
          Inspect & Verify
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-[#16A34A] uppercase tracking-wider">Accountant Verification Desk</span>
          <h1 className="text-[24px] sm:text-[32px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">Deposit Slip Verification Queue</h1>
          <p className="text-[15px] text-slate-500 dark:text-slate-400 max-w-3xl">
            Accountants verify bank transfer receipts against live bank statements before issuing official sequential Membership IDs (WB000xxx).
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <SelectInput
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'PENDING', label: 'Pending Verification' },
              { value: 'APPROVED', label: 'Approved (Membership Issued)' },
              { value: 'REJECTED', label: 'Rejected Slips' },
              { value: 'ALL', label: 'All Applications' },
            ]}
          />
          <Button variant="outline" size="sm" onClick={fetchRequests} leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />} className="h-[38px] text-[13px] px-3.5">
            Refresh
          </Button>
        </div>
      </div>

      <DataTable
        data={requests}
        columns={columns}
        keyExtractor={(r) => r.id}
        searchPlaceholder="Search by applicant name, app ref, bank FT no..."
        searchableKey={(r) => `${r.personalInfo?.fullName} ${r.applicationReference} ${r.payment?.referenceNumber} ${r.personalInfo?.nationalId}`}
      />

      {/* Slip Inspector & Approval Modal */}
      {selectedReq && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedReq(null)}
          title={`Verify Registration Application: ${selectedReq.applicationReference}`}
          size="lg"
          footer={
            <div className="flex justify-between items-center w-full">
              <div className="text-[15px] text-slate-500">
                Submitted: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatDateTime(selectedReq.submittedAt || selectedReq.createdAt)}</span>
              </div>
              <div className="flex gap-3">
                {selectedReq.status === 'PENDING' && (
                  <>
                    <Button variant="danger" size="md" onClick={() => setRejectModalOpen(true)} className="min-h-[52px] text-[18px] px-6">
                      Reject Slip (Provide Reason)
                    </Button>
                    <Button
                      variant="success"
                      size="md"
                      onClick={() => handleApprove(selectedReq)}
                      isLoading={isProcessing}
                      disabled={Boolean(isSelfUploaded)}
                      title={isSelfUploaded ? 'Separation of duties: Cannot approve your own registration.' : ''}
                      className="min-h-[52px] text-[18px] px-6"
                    >
                      Verify Slip & Issue WB ID
                    </Button>
                  </>
                )}
                {selectedReq.status !== 'PENDING' && (
                  <Button variant="secondary" size="md" onClick={() => setSelectedReq(null)} className="min-h-[52px] text-[18px] px-6">
                    Close
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-6 text-[16px]">
            {/* Separation of duties warning */}
            {isSelfUploaded && (
              <Alert variant="warning">
                <strong>Separation of Duties Enforced:</strong> You cannot verify or approve an application submitted with your own account credentials. Another accountant or administrator must perform this review.
              </Alert>
            )}

            {/* Application Overview */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div>
                <span className="text-slate-400 font-semibold text-[13px] uppercase tracking-wider">Applicant Name</span>
                <p className="font-bold text-slate-900 dark:text-white text-[18px] mt-1">{selectedReq.personalInfo?.fullName}</p>
                <p className="text-slate-500 font-mono text-[14px]">{selectedReq.personalInfo?.nationalId}</p>
              </div>
              <div>
                <span className="text-slate-400 font-semibold text-[13px] uppercase tracking-wider">Bank Channel & Reference</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-[17px] mt-1">{selectedReq.payment?.paymentMethod}</p>
                <p className="font-mono font-bold text-blue-700 dark:text-sky-400 text-[15px]">{selectedReq.payment?.referenceNumber}</p>
              </div>
              <div>
                <span className="text-slate-400 font-semibold text-[13px] uppercase tracking-wider">Registration Fee Paid</span>
                <p className="font-black text-emerald-600 text-[24px] mt-1">ETB 1,000.00</p>
                <p className="text-[14px] text-slate-500">Non-refundable Equity</p>
              </div>
            </div>

            {/* Receipt Preview */}
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
              <span className="font-bold text-slate-900 dark:text-white text-[17px]">Deposit Receipt Slip:</span>
              <div className="max-h-72 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
                {selectedReq.payment?.receiptUrl ? (
                  <img src={selectedReq.payment.receiptUrl} alt="Bank Slip" className="max-h-64 object-contain rounded-lg" />
                ) : (
                  <span className="text-slate-400 text-[16px]">No receipt slip image attached.</span>
                )}
              </div>
            </div>

            {/* Nominees Summary */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900 dark:text-white text-[17px]">Nominee Beneficiaries:</span>
                <span className="font-mono font-bold text-emerald-600 text-[16px]">
                  {selectedReq.nominees?.reduce((s, n) => s + (n.percentage || 0), 0) || 0}% Allocation
                </span>
              </div>
              <div className="space-y-2">
                {selectedReq.nominees?.map((n, idx) => (
                  <div key={idx} className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-700 text-[15px]">
                    <span className="text-slate-700 dark:text-slate-300">{n.fullName} ({n.relationship})</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{n.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Approval Effects info */}
            {selectedReq.status === 'PENDING' && (
              <div className="p-5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-2xl text-blue-900 dark:text-blue-200 space-y-2 text-[15px]">
                <p className="font-bold text-[17px]">Automated Approval Actions:</p>
                <p>• Automatically assigns the next sequential <strong>Membership ID (e.g. WB000001)</strong>.</p>
                <p>• Creates active member login credentials and links to the core ledger.</p>
                <p>• Credits SACCO Registration Fee revenue ledger account (ETB 1,000.00).</p>
                <p>• Generates an immutable cryptographic audit trail entry.</p>
              </div>
            )}

            {selectedReq.status === 'APPROVED' && (
              <div className="p-5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-900 dark:text-emerald-200 text-[15px]">
                <p className="font-bold text-[17px]">Approved & Issued Membership ID: <span className="font-mono text-[20px]">{selectedReq.membershipNo}</span></p>
                <p className="text-slate-600 dark:text-slate-400 mt-1">Reviewed by {selectedReq.reviewedByName || 'Accountant'} on {formatDateTime(selectedReq.reviewedAt || '')}</p>
              </div>
            )}

            {selectedReq.status === 'REJECTED' && (
              <div className="p-5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-900 dark:text-rose-200 text-[15px]">
                <p className="font-bold text-[17px]">Application Rejected:</p>
                <p className="italic mt-1">"{selectedReq.rejectionReason}"</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Reject Reason Modal */}
      {rejectModalOpen && selectedReq && (
        <Modal
          isOpen={true}
          onClose={() => setRejectModalOpen(false)}
          title={`Reject Application ${selectedReq.applicationReference}`}
          size="md"
          footer={
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" size="md" onClick={() => setRejectModalOpen(false)} className="min-h-[52px] text-[18px] px-6">
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleReject}
                isLoading={isProcessing}
                disabled={!rejectReason.trim()}
                className="min-h-[52px] text-[18px] px-6"
              >
                Confirm Rejection
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-[16px]">
            <p className="text-slate-600 dark:text-slate-400">
              Please provide the exact reason why this deposit slip is invalid (e.g., mismatched FT reference, blurred slip, insufficient amount). The applicant will see this reason in their status tracker.
            </p>
            <TextInput
              label="Rejection Reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Bank FT reference CBE-FT99812 not found in today's CBE statement"
              required
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

/* 3. APPROVAL CENTER MODULE (DUAL CONTROL) */
export const ApprovalCenterView: React.FC = () => {
  const { success } = useToast();
  const [requests, setRequests] = useState<ApprovalRequest[]>([
    {
      id: 'app_1',
      requestType: 'LOAN_APPROVAL',
      memberId: 77,
      memberName: 'Mulugeta Assefa',
      membershipNo: 'WB000077',
      amount: 150000.0,
      makerStaffId: 3,
      makerStaffName: 'Dawit Kebede (Accountant)',
      submissionDate: '2026-08-14T09:30:00Z',
      status: 'PENDING',
      riskLevel: 'LOW',
      description: '3.0x Multiplier Business Loan request (Compulsory Savings: ETB 65,000)',
    },
    {
      id: 'app_2',
      requestType: 'LARGE_WITHDRAWAL',
      memberId: 104,
      memberName: 'Birtukan Mamo',
      membershipNo: 'WB000104',
      amount: 75000.0,
      makerStaffId: 3,
      makerStaffName: 'Dawit Kebede (Accountant)',
      submissionDate: '2026-08-14T10:15:00Z',
      status: 'PENDING',
      riskLevel: 'MEDIUM',
      description: 'Voluntary savings liquidation exceeding ETB 50,000 dual-control threshold',
    },
    {
      id: 'app_3',
      requestType: 'TRANSACTION_REVERSAL',
      memberId: 143,
      memberName: 'Abebe Bikila Wolde',
      membershipNo: 'WB000143',
      amount: 1200.0,
      makerStaffId: 3,
      makerStaffName: 'Dawit Kebede (Accountant)',
      submissionDate: '2026-08-14T11:00:00Z',
      status: 'PENDING',
      riskLevel: 'HIGH',
      description: 'Duplicate posting reversal on CBE bank batch import',
    },
  ]);

  const handleAction = (id: string | number, approved: boolean) => {
    const item = requests.find((r) => r.id === id);
    setRequests(requests.filter((r) => r.id !== id));
    if (approved) {
      success('Authorized', `Dual-control authorization confirmed for ${item?.memberName}.`);
    } else {
      success('Rejected', `Request for ${item?.memberName} was rejected.`);
    }
  };

  const columns: ColumnDef<ApprovalRequest>[] = [
    {
      id: 'type',
      header: 'Request Type',
      cell: ({ row }) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white text-[17px]">{row.requestType.replace(/_/g, ' ')}</span>
          <span className="text-[14px] text-slate-400 font-mono block mt-0.5">{row.id}</span>
        </div>
      ),
    },
    {
      id: 'member',
      header: 'Member Beneficiary',
      cell: ({ row }) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white text-[17px]">{row.memberName}</span>
          <span className="font-mono text-[14px] text-slate-500 dark:text-slate-400 block mt-0.5">{row.membershipNo}</span>
        </div>
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      align: 'right',
      cell: ({ row }) => <span className="font-bold text-slate-900 dark:text-white text-[20px] tabular-nums">{formatCurrency(row.amount)}</span>,
    },
    {
      id: 'risk',
      header: 'Risk Level',
      align: 'center',
      cell: ({ row }) => (
        <Badge variant={row.riskLevel === 'HIGH' ? 'error' : row.riskLevel === 'MEDIUM' ? 'warning' : 'neutral'} size="md">
          {row.riskLevel}
        </Badge>
      ),
    },
    {
      id: 'maker',
      header: 'Initiated By',
      cell: ({ row }) => (
        <div className="text-[15px]">
          <span className="text-slate-700 dark:text-slate-300 font-medium">{row.makerStaffName}</span>
          <span className="text-[13px] text-slate-400 block mt-0.5">{formatDateTime(row.submissionDate)}</span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Dual Control Sign-Off',
      align: 'right',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 justify-end">
          <Button variant="ghost" size="md" onClick={() => handleAction(row.id, false)} className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 px-4 min-h-[44px] text-[16px]">
            Reject
          </Button>
          <Button variant="success" size="md" onClick={() => handleAction(row.id, true)} className="px-5 min-h-[44px] text-[16px] font-semibold">
            Authorize
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 text-left">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
        <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Dual Control Governance</span>
        <h1 className="text-[24px] sm:text-[32px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">Maker-Checker Authorization Center</h1>
        <p className="text-[15px] text-slate-500 dark:text-slate-400 max-w-3xl">High-value transactions and credit disbursements require secondary management sign-off to execute.</p>
      </div>

      <DataTable
        data={requests}
        columns={columns}
        keyExtractor={(r) => r.id}
      />
    </div>
  );
};

/* 4. GENERAL LEDGER TRANSACTIONS MODULE */
export const TransactionsLedgerView: React.FC = () => {
  const [txns] = useState<TransactionRecord[]>([
    {
      id: 'tx_1',
      transactionNo: 'TXN-2026-0814-001',
      accountNo: 'SAV-REG-00143',
      accountType: 'Compulsory Savings',
      memberId: 143,
      memberName: 'Abebe Bikila Wolde',
      type: 'DEPOSIT',
      debitAmount: null,
      creditAmount: 2500.0,
      runningBalance: 47500.0,
      paymentChannel: 'CBE_BANK',
      referenceNo: 'CBE-FT-88910',
      narration: 'Monthly regular savings deposit via CBE',
      timestamp: '2026-08-14T11:45:00Z',
      status: 'POSTED',
    },
    {
      id: 'tx_2',
      transactionNo: 'TXN-2026-0814-002',
      accountNo: 'SHR-00088',
      accountType: 'Equity Share Capital',
      memberId: 88,
      memberName: 'Tsedey Hailemariam',
      type: 'SHARE_PURCHASE',
      debitAmount: null,
      creditAmount: 5000.0,
      runningBalance: 25000.0,
      paymentChannel: 'TSEHAY_BANK',
      referenceNo: 'TSH-99120',
      narration: 'Purchased 10 additional shares',
      timestamp: '2026-08-14T10:30:00Z',
      status: 'POSTED',
    },
  ]);

  const columns: ColumnDef<TransactionRecord>[] = [
    {
      id: 'transactionNo',
      header: 'Txn Ref',
      accessorKey: 'transactionNo',
      cell: ({ row }) => <span className="font-mono font-bold text-blue-600 dark:text-sky-400 text-[12.5px]">{row.transactionNo}</span>,
    },
    {
      id: 'member',
      header: 'Member / Account',
      cell: ({ row }) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white text-[13px]">{row.memberName}</span>
          <span className="text-[11.5px] text-slate-500 dark:text-slate-400 block">{row.accountType} ({row.accountNo})</span>
        </div>
      ),
    },
    {
      id: 'narration',
      header: 'Narration & Channel',
      cell: ({ row }) => (
        <div>
          <span className="text-slate-800 dark:text-slate-200 text-[12.5px]">{row.narration}</span>
          <span className="text-[11px] text-slate-400 block">{row.paymentChannel} • {row.referenceNo}</span>
        </div>
      ),
    },
    {
      id: 'debit',
      header: 'Debit (DR)',
      align: 'right',
      cell: ({ row }) =>
        row.debitAmount ? (
          <span className="font-mono font-bold text-rose-600 text-[13px]">{formatCurrency(row.debitAmount)}</span>
        ) : (
          <span className="text-slate-300 dark:text-slate-600">—</span>
        ),
    },
    {
      id: 'credit',
      header: 'Credit (CR)',
      align: 'right',
      cell: ({ row }) =>
        row.creditAmount ? (
          <span className="font-mono font-bold text-emerald-600 text-[13px]">{formatCurrency(row.creditAmount)}</span>
        ) : (
          <span className="text-slate-300 dark:text-slate-600">—</span>
        ),
    },
    {
      id: 'balance',
      header: 'Balance',
      align: 'right',
      cell: ({ row }) => <span className="font-bold text-slate-900 dark:text-white text-[13px] tabular-nums">{formatCurrency(row.runningBalance)}</span>,
    },
    {
      id: 'date',
      header: 'Timestamp',
      align: 'right',
      cell: ({ row }) => <span className="text-slate-400 text-[11.5px]">{formatDateTime(row.timestamp)}</span>,
    },
  ];

  return (
    <div className="space-y-4 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-[#16A34A] uppercase tracking-wider">General Ledger</span>
          <h1 className="text-[24px] sm:text-[32px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">General Ledger Journal Postings</h1>
          <p className="text-[15px] text-slate-500 dark:text-slate-400 max-w-3xl">Real-time immutable financial transaction journal across all SACCO products.</p>
        </div>
        <Button variant="outline" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />} className="h-[38px] text-[13px] px-3.5">
          Export Journal (CSV)
        </Button>
      </div>

      <DataTable
        data={txns}
        columns={columns}
        keyExtractor={(t) => t.id}
        searchPlaceholder="Search journal by txn ref, member, narration..."
      />
    </div>
  );
};

/* 5. AUDIT LOGS MODULE */
export const AuditLogsView: React.FC = () => {
  const auditLogs = [
    {
      id: 1,
      action: 'APPROVE_MEMBER_REGISTRATION',
      entity: 'members',
      entityId: 'WB000003',
      staffName: 'Dawit Kebede (Accountant)',
      ipAddress: '197.156.70.15',
      timestamp: '2026-08-14T11:15:20Z',
      details: 'Approved registration request APP-2026-000101 and generated sequential Membership ID WB000003',
    },
    {
      id: 2,
      action: 'APPROVE_LOAN',
      entity: 'loans',
      entityId: 'LN-BUS-00077',
      staffName: 'Kassahun Belay (Manager)',
      ipAddress: '197.156.70.12',
      timestamp: '2026-08-14T10:30:15Z',
      details: 'Authorized ETB 150,000 Business Development Loan for Member WB000077',
    },
  ];

  return (
    <div className="space-y-4 text-left">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Compliance & Security</span>
        <h1 className="text-[24px] sm:text-[32px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">Change Data Capture & Security Audit Trail</h1>
        <p className="text-[15px] text-slate-500 dark:text-slate-400 max-w-3xl">Immutable cryptographic audit trail tracking all member lifecycle events, approvals, and overrides.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-2xs">
        {auditLogs.map((log) => (
          <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md text-[11.5px]">
                  {log.action}
                </span>
                <span className="text-slate-500 font-semibold">• {log.staffName}</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 text-[13px]">{log.details}</p>
            </div>
            <div className="text-right text-slate-400 text-[11.5px] font-mono shrink-0">
              <div>{formatDateTime(log.timestamp)}</div>
              <div className="mt-0.5">IP: {log.ipAddress}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* 6. ACCOUNTING & REPORTS & SETTINGS */
export const AccountingLedgerView: React.FC = () => (
  <div className="space-y-4 text-left">
    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
      <span className="text-[11px] font-bold text-[#16A34A] uppercase tracking-wider">Financial Hierarchy</span>
      <h1 className="text-[24px] sm:text-[32px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">Chart of Accounts & Trial Balance</h1>
      <p className="text-[15px] text-slate-500 dark:text-slate-400 max-w-3xl">Standardized 5-tier financial chart of accounts compliant with Ethiopian cooperative accounting rules.</p>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">1000 Assets</span>
        <div className="text-[24px] font-bold text-slate-900 dark:text-white tabular-nums">{formatCurrency(84720000)}</div>
      </div>
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">2000 Liabilities</span>
        <div className="text-[24px] font-bold text-slate-900 dark:text-white tabular-nums">{formatCurrency(48520000)}</div>
      </div>
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">3000 Equity Capital</span>
        <div className="text-[24px] font-bold text-slate-900 dark:text-white tabular-nums">{formatCurrency(12400000)}</div>
      </div>
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">4000/5000 Net Margin</span>
        <div className="text-[24px] font-bold text-emerald-600 tabular-nums">{formatCurrency(23800000)}</div>
      </div>
    </div>
  </div>
);

export const ReportsView: React.FC = () => (
  <div className="space-y-4 text-left">
    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
      <span className="text-[11px] font-bold text-blue-600 dark:text-sky-400 uppercase tracking-wider">Financial Intelligence</span>
      <h1 className="text-[24px] sm:text-[32px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">Financial Reports & Regulatory Statements</h1>
      <p className="text-[15px] text-slate-500 dark:text-slate-400 max-w-3xl">Automated balance sheet, income statements, liquidity ratios, and portfolio aging schedules.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <FileSpreadsheet className="w-6 h-6 text-blue-600 dark:text-sky-400" />
        <h3 className="font-semibold text-slate-900 dark:text-white text-[16px]">Balance Sheet Statement</h3>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-normal">Full institutional balance sheet with asset classifications and member equity reserves.</p>
        <Button variant="outline" size="sm" className="w-full h-[38px] text-[13px]">Generate PDF</Button>
      </div>
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
        <h3 className="font-semibold text-slate-900 dark:text-white text-[16px]">Income & Expense Statement</h3>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-normal">Loan interest earnings, deposit interest expenses, and net cooperative surplus.</p>
        <Button variant="outline" size="sm" className="w-full h-[38px] text-[13px]">Generate PDF</Button>
      </div>
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <FileSpreadsheet className="w-6 h-6 text-amber-600" />
        <h3 className="font-semibold text-slate-900 dark:text-white text-[16px]">Portfolio at Risk (PAR 30/60/90)</h3>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-normal">Loan delinquency aging brackets and NBE provisioning calculations.</p>
        <Button variant="outline" size="sm" className="w-full h-[38px] text-[13px]">Generate PDF</Button>
      </div>
    </div>
  </div>
);

export { EnterpriseSettingsView as SettingsView } from '../admin/EnterpriseSettingsView';
