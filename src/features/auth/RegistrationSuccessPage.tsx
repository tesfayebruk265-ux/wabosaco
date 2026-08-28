import React, { useState, useEffect } from 'react';
import { useNavigation } from '../../providers/NavigationProvider';
import { useToast } from '../../providers/ToastProvider';
import { ROUTES } from '../../constants/routes';
import {
  CheckCircle2,
  Copy,
  Clock,
  Search,
  ArrowRight,
  Printer,
} from 'lucide-react';

export const RegistrationSuccessPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { success } = useToast();

  const [applicationRef, setApplicationRef] = useState<string>('APP-2026-000102');
  const [applicantName, setApplicantName] = useState<string>('Cooperative Applicant');
  const [ftRef, setFtRef] = useState<string>('CBE-FT262109849201');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const ref = sessionStorage.getItem('wabi_recent_application_ref');
    const name = sessionStorage.getItem('wabi_recent_applicant_name');
    const ft = sessionStorage.getItem('wabi_recent_ft_ref');

    if (ref) setApplicationRef(ref);
    if (name) setApplicantName(name);
    if (ft) setFtRef(ft);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(applicationRef);
    setCopied(true);
    success('Copied to Clipboard', applicationRef);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 text-left">
      <div className="w-full max-w-2xl bg-white rounded-[18px] shadow-2xl p-6 sm:p-10 border border-[#E2E8F0] space-y-6">
        
        {/* Success Icon & Heading */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-[#F0FDF4] text-[#16A34A] rounded-3xl flex items-center justify-center mx-auto shadow-xs border border-[#BBF7D0]">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Application Submitted Successfully!</h1>
          <p className="text-sm text-[#475569]">
            Your Wabi SACCO membership dossier has been submitted and queued for accountant verification.
          </p>
        </div>

        {/* Reference Highlight Box */}
        <div className="p-6 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#475569] uppercase tracking-wider">Application Tracking Reference:</span>
            <span className="text-[12px] font-bold text-[#15803D] bg-[#DCFCE7] px-3 py-0.5 rounded-full border border-[#86EFAC]">
              Under Review
            </span>
          </div>

          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-[#E2E8F0]">
            <span className="font-mono text-2xl font-black text-[#0F172A] tracking-wide select-all">
              {applicationRef}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-[#475569] pt-1">
            <div>
              <span className="text-slate-400">Applicant:</span>
              <p className="font-bold text-[#0F172A]">{applicantName}</p>
            </div>
            <div>
              <span className="text-slate-400">Bank FT Reference:</span>
              <p className="font-mono font-bold text-[#15803D]">{ftRef}</p>
            </div>
          </div>
        </div>

        {/* Accountant Review & SLA Timeline */}
        <div className="p-6 bg-[#F0FDF4] rounded-2xl border border-[#BBF7D0] space-y-3">
          <h2 className="text-sm font-bold text-[#14532D] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#16A34A]" /> Accountant Verification Process & SLA:
          </h2>
          <div className="space-y-2 text-xs text-[#15803D] leading-relaxed">
            <p>
              1. <strong>Bank Statement Matching:</strong> The SACCO Accounting Desk reconciles your bank deposit slip reference (<code>{ftRef}</code>) with cleared bank statements within <strong>1 business day</strong>.
            </p>
            <p>
              2. <strong>Account Verification & Activation:</strong> Once the accountant approves your payment slip, your membership account is activated.
            </p>
            <p>
              3. <strong>Immediate Sign-In:</strong> You can then log in at any time using your registered <strong>Email Address</strong> and <strong>Password</strong> to access your savings, purchase equity shares, and apply for loans.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="h-[48px] px-4 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Print Summary
          </button>

          <button
            type="button"
            onClick={() => navigate(ROUTES.AUTH.FORGOT_PASSWORD)}
            className="h-[48px] px-4 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" /> Track Status
          </button>

          <button
            type="button"
            onClick={() => navigate(ROUTES.AUTH.LOGIN)}
            className="h-[48px] px-4 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs rounded-xl shadow-lg shadow-[#16A34A]/20 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Go to Login</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
