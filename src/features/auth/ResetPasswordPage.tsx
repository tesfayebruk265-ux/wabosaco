import React, { useState } from 'react';
import { useNavigation } from '../../providers/NavigationProvider';
import { useToast } from '../../providers/ToastProvider';
import { ROUTES } from '../../constants/routes';
import { authService } from '../../services/authService';
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { success, error: toastError } = useToast();

  const [otpCode, setOtpCode] = useState<string>('123456');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Real-time password strength calculations
  const hasLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

  const criteriaCount = [hasLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  const strengthLabel =
    criteriaCount <= 2 ? 'Weak' : criteriaCount === 3 ? 'Fair' : criteriaCount === 4 ? 'Good' : 'Strong';
  const strengthColor =
    criteriaCount <= 2 ? 'bg-rose-500' : criteriaCount === 3 ? 'bg-amber-500' : criteriaCount === 4 ? 'bg-[#16A34A]' : 'bg-[#15803D]';

  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!otpCode.trim()) {
      setErrorMessage('Please enter the 6-digit OTP code sent to your device.');
      return;
    }
    if (criteriaCount < 4) {
      setErrorMessage('Password must meet at least 4 of the security criteria.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation password do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.resetPassword({
        token: otpCode.trim(),
        newPassword,
      });
      success('Password Successfully Reset', 'You can now sign in using your new password.');
      navigate(ROUTES.AUTH.LOGIN);
    } catch (err: any) {
      const msg = err?.error?.message || err?.message || 'Invalid or expired OTP code.';
      setErrorMessage(msg);
      toastError('Reset Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 text-left">
      <div className="w-full max-w-md bg-white rounded-[18px] shadow-2xl p-6 sm:p-10 border border-[#E2E8F0] space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-[#F0FDF4] text-[#16A34A] rounded-2xl flex items-center justify-center mx-auto shadow-xs border border-[#BBF7D0]">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Create New Password</h1>
          <p className="text-sm text-[#475569]">
            Configure a strong password to protect your SACCO financial holdings.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl flex items-start gap-2 text-xs text-[#B91C1C]">
            <AlertCircle className="w-4 h-4 text-[#EF4444] mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* OTP Code */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-[#0F172A]">6-Digit Verification OTP Code</label>
            <input
              type="text"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="123456"
              required
              className="w-full text-center font-mono font-bold text-xl tracking-widest px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A] text-[#0F172A]"
            />
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-[#0F172A]">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full px-4 py-3 text-[16px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A] text-[#0F172A] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Strength Meter Bar & Checklist */}
          {newPassword.length > 0 && (
            <div className="space-y-2 p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-xs">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-[#475569]">Password Strength:</span>
                <span className={`px-2 py-0.5 rounded text-white text-[10px] ${strengthColor}`}>
                  {strengthLabel}
                </span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${strengthColor} transition-all duration-300`}
                  style={{ width: `${(criteriaCount / 5) * 100}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-1 text-[11px] text-[#475569] pt-1">
                <span className={hasLength ? 'text-[#15803D] font-bold' : ''}>
                  {hasLength ? '✓' : '○'} 8+ characters
                </span>
                <span className={hasUpper ? 'text-[#15803D] font-bold' : ''}>
                  {hasUpper ? '✓' : '○'} Uppercase letter
                </span>
                <span className={hasLower ? 'text-[#15803D] font-bold' : ''}>
                  {hasLower ? '✓' : '○'} Lowercase letter
                </span>
                <span className={hasNumber ? 'text-[#15803D] font-bold' : ''}>
                  {hasNumber ? '✓' : '○'} Number
                </span>
                <span className={hasSpecial ? 'text-[#15803D] font-bold' : ''}>
                  {hasSpecial ? '✓' : '○'} Special symbol
                </span>
              </div>
            </div>
          )}

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-[#0F172A]">Confirm New Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full px-4 py-3 text-[16px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A] text-[#0F172A]"
            />
            {confirmPassword.length > 0 && (
              <p className={`text-[12px] font-semibold ${passwordsMatch ? 'text-[#15803D]' : 'text-[#EF4444]'}`}>
                {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !passwordsMatch || criteriaCount < 4}
            className="w-full h-[52px] bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-[18px] rounded-xl shadow-lg shadow-[#16A34A]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving New Password...</span>
              </>
            ) : (
              <>
                <span>Save New Password & Sign In</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

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
