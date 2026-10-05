import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { Mail, KeyRound, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<'request' | 'reset' | 'completed'>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authApi.forgotPassword(email);
      // In development/testing, backend returns reset_token directly in response
      if (res.reset_token) {
        setToken(res.reset_token);
      }
      setStep('reset');
    } catch (err: any) {
      console.error('Forgot password error:', err);
      if (!err.response) {
        setError('Cannot connect to backend server. Please verify your backend API is reachable.');
      } else {
        setError(err.response?.data?.detail || 'Unable to process reset request. Please check the email.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setStep('completed');
    } catch (err: any) {
      console.error('Password reset error:', err);
      if (!err.response) {
        setError('Cannot connect to backend server. Please verify your backend API is reachable.');
      } else {
        setError(err.response?.data?.detail || 'Reset failed. Token may be invalid or expired.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-[#C99A52] flex items-center justify-center text-white shadow-md">
            <Lock className="w-6 h-6" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-[#242321]">
          Reset Password
        </h2>
        <p className="mt-1 text-center text-xs text-[#78756F]">
          {step === 'request'
            ? 'Enter your registered email to receive a password reset token'
            : step === 'reset'
            ? 'Enter your reset token and your new password'
            : 'Your password has been successfully updated'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-[#FFFDF9] py-8 px-6 shadow-sm border border-[#D8D4CC] rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-[#C8755A]/10 border border-[#C8755A]/30 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#C8755A] mt-0.5 shrink-0" />
              <p className="text-xs text-[#C8755A] font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {step === 'request' && (
            <form className="space-y-4" onSubmit={handleRequestToken}>
              <div>
                <label className="block text-xs font-semibold text-[#242321] mb-1">
                  Registered Email Address
                </label>
                <div className="relative rounded-lg">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-[#78756F]" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="block w-full pl-10 pr-3 py-2 text-xs border border-[#D8D4CC] rounded-lg bg-[#FFFDF9] text-[#242321] focus:ring-2 focus:ring-[#46513F]/20 focus:border-[#46513F] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#46513F] text-white text-xs font-bold hover:bg-[#46513F]/90 transition-all cursor-pointer shadow-xs disabled:opacity-60"
                >
                  {loading ? 'Submitting...' : 'Send Reset Code'}
                </button>
              </div>
            </form>
          )}

          {step === 'reset' && (
            <form className="space-y-4" onSubmit={handleResetPassword}>
              <div>
                <label className="block text-xs font-semibold text-[#242321] mb-1">
                  Reset Token
                </label>
                <div className="relative rounded-lg">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-4 w-4 text-[#78756F]" />
                  </div>
                  <input
                    type="text"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Enter reset token"
                    className="block w-full pl-10 pr-3 py-2 text-xs border border-[#D8D4CC] rounded-lg bg-[#FFFDF9] text-[#242321] focus:ring-2 focus:ring-[#46513F]/20 focus:border-[#46513F] outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#242321] mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="block w-full px-3 py-2 text-xs border border-[#D8D4CC] rounded-lg bg-[#FFFDF9] text-[#242321] focus:ring-2 focus:ring-[#46513F]/20 focus:border-[#46513F] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#242321] mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="block w-full px-3 py-2 text-xs border border-[#D8D4CC] rounded-lg bg-[#FFFDF9] text-[#242321] focus:ring-2 focus:ring-[#46513F]/20 focus:border-[#46513F] outline-none transition-all"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#46513F] text-white text-xs font-bold hover:bg-[#46513F]/90 transition-all cursor-pointer shadow-xs disabled:opacity-60"
                >
                  {loading ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}

          {step === 'completed' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#71806B]/15 text-[#46513F] flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-[#242321]">Password Reset Complete</h3>
              <p className="text-xs text-[#78756F]">
                Your password has been changed. You can now log into your account with your new credentials.
              </p>
              <div className="pt-4">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#46513F] text-white text-xs font-bold hover:bg-[#46513F]/90 transition-all cursor-pointer shadow-xs"
                >
                  Continue to Login
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-[#D8D4CC]/70 text-center">
            <Link
              to="/login"
              className="text-xs font-semibold text-[#46513F] hover:underline transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
