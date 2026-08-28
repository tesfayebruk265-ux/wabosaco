import React, { useState, useEffect } from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { useNavigation } from '../../providers/NavigationProvider';
import { ROUTES } from '../../constants/routes';
import {
  ShieldCheck,
  Smartphone,
  Mail,
  Key,
  ArrowRight,
  ArrowLeft,
  RotateCw,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { authService } from '../../services/authService';
import { useToast } from '../../providers/ToastProvider';

export const MfaChallengePage: React.FC = () => {
  const { verifyMfa, isLoading } = useAuth();
  const { navigate } = useNavigation();
  const { success, error: toastError } = useToast();

  const [mfaToken, setMfaToken] = useState<string>('');
  const [identifier, setIdentifier] = useState<string>('');
  const [destinationMasked, setDestinationMasked] = useState<string>('+251 91 **** 44');
  const [mfaType, setMfaType] = useState<'SMS' | 'EMAIL' | 'TOTP' | 'BACKUP'>('SMS');
  const [code, setCode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState<number>(60);
  const [isResending, setIsResending] = useState<boolean>(false);

  useEffect(() => {
    const token = sessionStorage.getItem('wabi_mfa_token');
    const ident = sessionStorage.getItem('wabi_mfa_identifier');
    const dest = sessionStorage.getItem('wabi_mfa_destination');

    if (!token) {
      // No active challenge, redirect to login
      navigate(ROUTES.AUTH.LOGIN);
      return;
    }
    setMfaToken(token);
    if (ident) setIdentifier(ident);
    if (dest) setDestinationMasked(dest);
  }, [navigate]);

  // Countdown timer for code resend
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = code.trim().replace(/\s+/g, '');
    if (!cleanCode) {
      setError('Please enter your 6-digit authentication code.');
      return;
    }

    try {
      const res = await verifyMfa(mfaToken, cleanCode);
      sessionStorage.removeItem('wabi_mfa_token');
      sessionStorage.removeItem('wabi_mfa_identifier');
      sessionStorage.removeItem('wabi_mfa_destination');

      // Check for returnUrl
      const returnUrl = sessionStorage.getItem('wabi_auth_return_url');
      if (returnUrl && !returnUrl.startsWith('/login') && !returnUrl.startsWith('/mfa')) {
        sessionStorage.removeItem('wabi_auth_return_url');
        navigate(returnUrl);
        return;
      }

      const role = res.user.role;
      if (role === 'ADMIN') navigate(ROUTES.STAFF.ADMIN_DASHBOARD);
      else if (role === 'MANAGER') navigate(ROUTES.STAFF.MANAGER_DASHBOARD);
      else if (role === 'ACCOUNTANT') navigate(ROUTES.STAFF.ACCOUNTANT_DASHBOARD);
      else if (role === 'AUDITOR') navigate(ROUTES.STAFF.AUDITOR_DASHBOARD);
      else if (role === 'CUSTOMER_SERVICE') navigate(ROUTES.STAFF.CS_DASHBOARD);
      else navigate(ROUTES.MEMBER.DASHBOARD);
    } catch (err: any) {
      setError(
        err?.error?.message ||
        err?.message ||
        'Invalid verification code. Please check your authenticator code or request a new OTP.'
      );
    }
  };

  const handleResend = async () => {
    if (timer > 0 || isResending) return;
    setIsResending(true);
    setError(null);
    try {
      // Re-trigger OTP request
      await authService.requestPasswordReset(identifier || 'WB000143');
      setTimer(60);
      success('Verification Code Dispatched', `A new OTP has been sent to ${destinationMasked}.`);
    } catch (err: any) {
      toastError('Resend Failed', err?.message || 'Could not dispatch OTP.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md bg-white rounded-[18px] shadow-2xl p-8 sm:p-10 border border-[#E2E8F0] text-left space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-[#F0FDF4] text-[#16A34A] rounded-2xl flex items-center justify-center mx-auto shadow-xs border border-[#BBF7D0]">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Two-Factor Authentication</h1>
          <p className="text-sm text-[#475569]">
            Extra layer of protection required for Wabi SACCO financial operations.
          </p>
        </div>

        {/* Challenge Method Selector */}
        <div className="grid grid-cols-4 gap-1.5 p-1.5 bg-[#F1F5F9] rounded-xl text-xs font-semibold text-[#475569]">
          <button
            type="button"
            onClick={() => setMfaType('SMS')}
            className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
              mfaType === 'SMS' ? 'bg-white text-[#16A34A] shadow-xs font-bold' : 'hover:text-[#0F172A]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" /> SMS
          </button>
          <button
            type="button"
            onClick={() => setMfaType('EMAIL')}
            className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
              mfaType === 'EMAIL' ? 'bg-white text-[#16A34A] shadow-xs font-bold' : 'hover:text-[#0F172A]'
            }`}
          >
            <Mail className="w-3.5 h-3.5" /> Email
          </button>
          <button
            type="button"
            onClick={() => setMfaType('TOTP')}
            className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
              mfaType === 'TOTP' ? 'bg-white text-[#16A34A] shadow-xs font-bold' : 'hover:text-[#0F172A]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> App
          </button>
          <button
            type="button"
            onClick={() => setMfaType('BACKUP')}
            className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
              mfaType === 'BACKUP' ? 'bg-white text-[#16A34A] shadow-xs font-bold' : 'hover:text-[#0F172A]'
            }`}
          >
            <Key className="w-3.5 h-3.5" /> Code
          </button>
        </div>

        {/* Instructions banner */}
        <div className="p-3.5 bg-[#F0FDF4] rounded-xl border border-[#BBF7D0] text-xs text-[#15803D]">
          {mfaType === 'SMS' && (
            <p>
              We sent a 6-digit OTP code to your registered mobile number ending in <strong className="font-bold">{destinationMasked}</strong>.
            </p>
          )}
          {mfaType === 'EMAIL' && (
            <p>
              We sent a verification code to your registered email address on file.
            </p>
          )}
          {mfaType === 'TOTP' && (
            <p>
              Enter the dynamic 6-digit code generated by your Authenticator app (Google Authenticator, Microsoft Authenticator, or Duo).
            </p>
          )}
          {mfaType === 'BACKUP' && (
            <p>
              Enter one of your 8-digit emergency recovery codes provided during account provisioning.
            </p>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl flex items-start gap-2 text-xs text-[#B91C1C]">
            <AlertCircle className="w-4 h-4 text-[#EF4444] mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Verification Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-[#0F172A]">
              {mfaType === 'BACKUP' ? 'Emergency Backup Code' : '6-Digit Security Code'}
            </label>
            <input
              type="text"
              maxLength={mfaType === 'BACKUP' ? 12 : 8}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={mfaType === 'BACKUP' ? 'XXXX-XXXX' : '123 456'}
              autoFocus
              required
              className="w-full text-center text-2xl font-mono font-bold tracking-widest px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-[#16A34A] transition-colors text-[#0F172A]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-[52px] bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-[18px] rounded-xl shadow-lg shadow-[#16A34A]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Validating Security Token...</span>
              </>
            ) : (
              <>
                <span>Confirm & Sign In</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Resend & Timer */}
        <div className="pt-3 flex items-center justify-between text-sm text-[#475569] border-t border-[#E2E8F0]">
          <button
            type="button"
            onClick={() => navigate(ROUTES.AUTH.LOGIN)}
            className="inline-flex items-center gap-1.5 hover:text-[#0F172A] font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </button>

          {timer > 0 ? (
            <span className="flex items-center gap-1 text-slate-400 font-mono text-xs font-semibold">
              <Clock className="w-3.5 h-3.5" /> Resend in {timer}s
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="inline-flex items-center gap-1 text-[#16A34A] hover:text-[#15803D] font-bold cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} /> Resend OTP
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
