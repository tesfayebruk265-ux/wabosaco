import React, { useState } from 'react';
import { useNavigation } from '../../providers/NavigationProvider';
import { useToast } from '../../providers/ToastProvider';
import { ROUTES } from '../../constants/routes';
import { authService } from '../../services/authService';
import { memberApiService } from '../../services/memberApiService';
import {
  KeyRound,
  Search,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'PASSWORD' | 'TRACKER'>('PASSWORD');

  // Password Recovery State
  const [identifier, setIdentifier] = useState<string>('WB000143');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [recoverySent, setRecoverySent] = useState<boolean>(false);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);

  // Application Tracker State
  const [trackerRef, setTrackerRef] = useState<string>('APP-2026-000101');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [appStatus, setAppStatus] = useState<any | null>(null);

  // Re-upload Form State
  const [reuploadMethod, setReuploadMethod] = useState<'CBE' | 'Tsehay Bank' | 'Bank Transfer'>('CBE');
  const [reuploadRef, setReuploadRef] = useState<string>('');
  const [reuploadUrl, setReuploadUrl] = useState<string>('');
  const [isReuploading, setIsReuploading] = useState<boolean>(false);

  const handlePasswordResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await authService.requestPasswordReset(identifier.trim());
      setRecoverySent(true);
      if (res.debugOtp) {
        setDebugOtp(res.debugOtp);
      }
      sessionStorage.setItem('wabi_reset_identifier', identifier.trim());
      success('OTP Code Dispatched', 'Check your registered mobile SMS or Email inbox.');
    } catch (err: any) {
      // Always show generic success for privacy, but handle unexpected errors
      setRecoverySent(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearchApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackerRef.trim()) return;

    setIsSearching(true);
    try {
      const res = await memberApiService.getRegistrationStatus(trackerRef.trim());
      setAppStatus(res.data);
      success('Application Found', `Status: ${res.data.status}`);
    } catch (err: any) {
      toastError('Not Found', err?.error?.message || err?.message || 'Application reference not found.');
      setAppStatus(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleReuploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reuploadRef.trim() || !reuploadUrl) {
      toastError('Missing Information', 'Please provide a valid bank reference and uploaded receipt image.');
      return;
    }

    setIsReuploading(true);
    try {
      await memberApiService.reuploadReceipt(appStatus.applicationReference, {
        paymentMethod: reuploadMethod,
        referenceNumber: reuploadRef.trim(),
        receiptUrl: reuploadUrl,
      });
      success('Replacement Slip Uploaded', 'Accountant queue updated for priority verification.');
      const refreshed = await memberApiService.getRegistrationStatus(appStatus.applicationReference);
      setAppStatus(refreshed.data);
    } catch (err: any) {
      toastError('Upload Failed', err?.error?.message || err?.message || 'Failed to re-upload slip.');
    } finally {
      setIsReuploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 text-left">
      <div className="w-full max-w-lg bg-white rounded-[18px] shadow-2xl p-6 sm:p-10 border border-[#E2E8F0] space-y-6">
        
        {/* Toggle Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-[#F1F5F9] rounded-2xl text-[16px] font-bold text-[#475569]">
          <button
            type="button"
            onClick={() => setActiveTab('PASSWORD')}
            className={`py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'PASSWORD' ? 'bg-white text-[#16A34A] shadow-xs' : 'hover:text-[#0F172A]'
            }`}
          >
            <KeyRound className="w-4 h-4" /> Reset Password
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('TRACKER')}
            className={`py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'TRACKER' ? 'bg-white text-[#16A34A] shadow-xs' : 'hover:text-[#0F172A]'
            }`}
          >
            <Search className="w-4 h-4" /> Track Application
          </button>
        </div>

        {/* =========================================================================
            TAB 1: FORGOT PASSWORD REQUEST
            ========================================================================= */}
        {activeTab === 'PASSWORD' && (
          <div className="space-y-5 animate-in fade-in">
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Account Recovery</h1>
              <p className="text-sm text-[#475569]">
                Enter your registered Membership ID, username, email, or phone number.
              </p>
            </div>

            {recoverySent ? (
              <div className="space-y-4">
                <div className="p-4 bg-[#F0FDF4] rounded-2xl border border-[#BBF7D0] text-sm text-[#15803D] space-y-2">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-5 h-5 text-[#16A34A]" /> Recovery Instructions Dispatched
                  </p>
                  <p className="text-[#15803D] leading-relaxed">
                    If an active Wabi SACCO profile matches <strong className="font-mono">{identifier}</strong>, a 6-digit OTP verification code has been dispatched via SMS and registered email.
                  </p>
                </div>

                {/* Sandbox / Evaluation Banner */}
                {debugOtp && (
                  <div className="p-3.5 bg-[#F0FDF4] border border-[#86EFAC] rounded-xl space-y-1.5 text-xs text-[#15803D]">
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1 text-[#15803D]">
                        <Sparkles className="w-3.5 h-3.5" /> Sandbox Test Mode OTP:
                      </span>
                      <span className="font-mono bg-[#DCFCE7] px-2.5 py-0.5 rounded text-[#14532D] font-black tracking-wider text-sm">
                        {debugOtp}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#15803D]">
                      Use this verification code on the password reset screen to complete the demonstration.
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => navigate(ROUTES.AUTH.RESET_PASSWORD)}
                  className="w-full h-[52px] bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-[18px] rounded-xl shadow-lg shadow-[#16A34A]/20 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Enter OTP Code & Reset Password</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordResetRequest} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-[#0F172A]">
                    Membership ID / Username / Email / Phone
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. WB000143 or +2519..."
                    required
                    className="w-full px-4 py-3 text-[16px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:bg-white focus:ring-2 focus:ring-[#16A34A] text-[#0F172A]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-[52px] bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-[18px] rounded-xl shadow-lg shadow-[#16A34A]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Recovery OTP Code</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 2: TRACK APPLICATION & RE-UPLOAD SLIP
            ========================================================================= */}
        {activeTab === 'TRACKER' && (
          <div className="space-y-5 animate-in fade-in">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-black text-[#0F172A] tracking-tight">Application Tracker</h2>
              <p className="text-sm text-[#475569]">
                Track accountant verification or re-upload a corrected bank receipt.
              </p>
            </div>

            <form onSubmit={handleSearchApplication} className="flex gap-2">
              <input
                type="text"
                value={trackerRef}
                onChange={(e) => setTrackerRef(e.target.value)}
                placeholder="APP-2026-XXXXXX"
                required
                className="flex-1 px-4 py-3 text-[16px] font-mono font-bold bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:bg-white text-[#0F172A]"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-5 py-3 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-sm rounded-xl transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Track</span>
              </button>
            </form>

            {appStatus && (
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-3 text-sm">
                <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                  <span className="font-mono font-bold text-[#0F172A]">{appStatus.applicationReference}</span>
                  <span
                    className={`px-3 py-1 rounded-full font-bold text-xs ${
                      appStatus.status === 'APPROVED'
                        ? 'bg-[#DCFCE7] text-[#15803D]'
                        : appStatus.status === 'REJECTED'
                        ? 'bg-[#FEE2E2] text-[#B91C1C]'
                        : 'bg-[#FEF3C7] text-[#B45309]'
                    }`}
                  >
                    {appStatus.status}
                  </span>
                </div>

                <div className="space-y-1 text-[#475569]">
                  <p>Applicant: <strong className="text-[#0F172A]">{appStatus.personalInfo?.fullName}</strong></p>
                  <p>Bank FT Reference: <code className="font-mono text-[#15803D] font-bold">{appStatus.payment?.referenceNumber}</code></p>
                </div>

                {appStatus.status === 'APPROVED' && (
                  <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl space-y-1.5 text-[#15803D]">
                    <p className="font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A]" /> Membership Cleared!
                    </p>
                    <p>Official Membership No: <strong className="font-mono text-sm">{appStatus.membershipNo}</strong></p>
                    <button
                      type="button"
                      onClick={() => navigate(ROUTES.AUTH.LOGIN)}
                      className="w-full mt-1 h-[44px] bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-lg text-sm cursor-pointer"
                    >
                      Sign In Now
                    </button>
                  </div>
                )}

                {appStatus.status === 'REJECTED' && (
                  <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl space-y-3 text-rose-950">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-[#EF4444] mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold">Accountant Review Feedback:</p>
                        <p className="text-[#B91C1C] italic">"{appStatus.rejectionReason || 'Invalid FT Reference'}"</p>
                      </div>
                    </div>

                    <form onSubmit={handleReuploadSubmit} className="bg-white p-3.5 rounded-xl border border-[#FECACA] space-y-2.5">
                      <span className="font-bold text-[#0F172A] block text-xs">Re-upload Replacement Slip:</span>
                      <input
                        type="text"
                        placeholder="Correct Bank FT Reference Number"
                        value={reuploadRef}
                        onChange={(e) => setReuploadRef(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg"
                      />
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => setReuploadUrl(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-[#F0FDF4] file:text-[#15803D]"
                      />
                      <button
                        type="submit"
                        disabled={isReuploading}
                        className="w-full h-[44px] bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs rounded-lg disabled:opacity-50 cursor-pointer"
                      >
                        {isReuploading ? 'Uploading Slip...' : 'Submit Replacement Receipt'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Back Link */}
        <div className="pt-3 border-t border-[#E2E8F0] text-center">
          <button
            type="button"
            onClick={() => navigate(ROUTES.AUTH.LOGIN)}
            className="text-sm font-semibold text-[#475569] hover:text-[#0F172A] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Login Portal
          </button>
        </div>
      </div>
    </div>
  );
};
