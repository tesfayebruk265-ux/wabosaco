import React, { useState, useEffect } from 'react';
import { useNavigation } from '../../providers/NavigationProvider';
import { useToast } from '../../providers/ToastProvider';
import { ROUTES } from '../../constants/routes';
import { authService } from '../../services/authService';
import {
  ShieldCheck,
  RotateCw,
  Clock,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';

export const VerifyOtpPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { success, error: toastError } = useToast();

  const [otpCode, setOtpCode] = useState<string>('123456');
  const [identifier, setIdentifier] = useState<string>('WB000143');
  const [timer, setTimer] = useState<number>(60);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const ident = sessionStorage.getItem('wabi_reset_identifier') || sessionStorage.getItem('wabi_mfa_identifier');
    if (ident) setIdentifier(ident);
  }, []);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) return;

    setIsVerifying(true);
    setErrorMessage(null);
    try {
      await authService.verifyOtp({
        identifier,
        otp: otpCode.trim(),
        purpose: 'RESET_PASSWORD',
      });
      success('OTP Verified', 'Verification code confirmed.');
      navigate(ROUTES.AUTH.RESET_PASSWORD);
    } catch (err: any) {
      const msg = err?.error?.message || err?.message || 'Invalid or expired OTP code.';
      setErrorMessage(msg);
      toastError('Verification Failed', msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || isResending) return;
    setIsResending(true);
    setErrorMessage(null);
    try {
      await authService.requestPasswordReset(identifier);
      setTimer(60);
      success('New OTP Dispatched', `A fresh OTP code was sent.`);
    } catch (err: any) {
      toastError('Resend Failed', err?.message || 'Could not resend OTP.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 text-left">
      <div className="w-full max-w-md bg-white rounded-[18px] shadow-2xl p-6 sm:p-10 border border-[#E2E8F0] space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-[#F0FDF4] text-[#16A34A] rounded-2xl flex items-center justify-center mx-auto shadow-xs border border-[#BBF7D0]">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Security Code Verification</h1>
          <p className="text-sm text-[#475569]">
            Enter the 6-digit authentication token sent to your device.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl flex items-start gap-2 text-xs text-[#B91C1C]">
            <AlertCircle className="w-4 h-4 text-[#EF4444] mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-[#0F172A]">6-Digit Code</label>
            <input
              type="text"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="123456"
              autoFocus
              required
              className="w-full text-center font-mono font-bold text-2xl tracking-widest px-4 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-[#16A34A] text-[#0F172A]"
            />
          </div>

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full h-[52px] bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-[18px] rounded-xl shadow-lg shadow-[#16A34A]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isVerifying ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Verifying Token...</span>
              </>
            ) : (
              <>
                <span>Confirm Code</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="pt-3 flex items-center justify-between text-sm text-[#475569] border-t border-[#E2E8F0]">
          <button
            type="button"
            onClick={() => navigate(ROUTES.AUTH.LOGIN)}
            className="hover:text-[#0F172A] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
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

export const VerifyAccountPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { success, error: toastError } = useToast();

  const [token, setToken] = useState<string>('act_demo_token');
  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    setIsActivating(true);
    setErrorMessage(null);
    try {
      await authService.verifyAccount({ token: token.trim() });
      setIsSuccess(true);
      success('Account Activated', 'Your Wabi SACCO profile is now active and ready for use.');
    } catch (err: any) {
      const msg = err?.error?.message || err?.message || 'Invalid or expired activation link.';
      setErrorMessage(msg);
      toastError('Activation Failed', msg);
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 text-left">
      <div className="w-full max-w-md bg-white rounded-[18px] shadow-2xl p-6 sm:p-10 border border-[#E2E8F0] space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-[#F0FDF4] text-[#16A34A] rounded-2xl flex items-center justify-center mx-auto shadow-xs border border-[#BBF7D0]">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Account Activation</h1>
          <p className="text-sm text-[#475569]">
            Confirm your membership credential to activate your electronic portal access.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl flex items-start gap-2 text-xs text-[#B91C1C]">
            <AlertCircle className="w-4 h-4 text-[#EF4444] mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="space-y-4">
            <div className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl text-sm text-[#15803D] space-y-2">
              <p className="font-bold">✓ Portal Access Confirmed</p>
              <p>Your membership account has been verified and unlocked. You may now sign in using your credentials.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate(ROUTES.AUTH.LOGIN)}
              className="w-full h-[52px] bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-[18px] rounded-xl shadow-lg shadow-[#16A34A]/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Proceed to Sign In</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleActivate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-[#0F172A]">Verification Token / Code</label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Activation Token"
                required
                className="w-full px-4 py-3 text-[16px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A] text-[#0F172A]"
              />
            </div>

            <button
              type="submit"
              disabled={isActivating}
              className="w-full h-[52px] bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-[18px] rounded-xl shadow-lg shadow-[#16A34A]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isActivating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Activating Account...</span>
                </>
              ) : (
                <>
                  <span>Activate Membership Profile</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="pt-3 border-t border-[#E2E8F0] text-center">
          <button
            type="button"
            onClick={() => navigate(ROUTES.AUTH.LOGIN)}
            className="text-sm font-semibold text-[#475569] hover:text-[#0F172A] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};
