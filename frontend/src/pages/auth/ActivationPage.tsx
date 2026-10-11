import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { KeyRound, Mail, Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const ActivationPage: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
      await authApi.activate({
        email,
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setSuccess(true);
    } catch (err: any) {
      console.error('Activation error:', err);
      if (!err.response) {
        setError('Cannot connect to backend server. Please verify your backend API is reachable.');
        return;
      }
      const detail = err.response?.data?.detail;
      setError(
        typeof detail === 'string'
          ? detail
          : 'Activation failed. Please ensure your token and registered email are correct.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-[#2563EB] flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <KeyRound className="w-6 h-6" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-[#172033]">
          Activate Your Account
        </h2>
        <p className="mt-1 text-center text-xs text-[#64748B]">
          Complete your onboarding by verifying your activation token and creating a password
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-[#E2E8F0] rounded-2xl sm:px-10">
          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-[#16A34A] flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-[#172033]">Account Activated Successfully</h3>
              <p className="text-xs text-[#64748B]">
                Your credentials have been securely registered. You can now log into your workforce portal.
              </p>
              <div className="pt-4">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#2563EB] text-white text-xs font-bold hover:bg-[#1D4ED8] transition-all cursor-pointer shadow-sm shadow-blue-500/20"
                >
                  Continue to Login
                </button>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-[#DC2626] mt-0.5 shrink-0" />
                  <p className="text-xs text-[#DC2626] font-medium leading-relaxed">{error}</p>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">
                    Registered Email
                  </label>
                  <div className="relative rounded-lg">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-[#64748B]" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="block w-full pl-10 pr-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#172033] focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] outline-none transition-all placeholder:text-[#94A3B8]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">
                    Verification Code / Activation Token
                  </label>
                  <div className="relative rounded-lg">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound className="h-4 w-4 text-[#64748B]" />
                    </div>
                    <input
                      type="text"
                      required
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="e.g. ACTIVATE-HR-TEST"
                      className="block w-full pl-10 pr-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#172033] focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] outline-none transition-all placeholder:text-[#94A3B8]"
                    />
                  </div>
                  <p className="text-[10px] text-[#64748B] mt-1">
                    Demo Token: <code className="font-mono text-[#2563EB] bg-blue-50 px-1 py-0.5 rounded">ACTIVATE-HR-TEST</code> for <code className="font-mono text-[#2563EB] bg-blue-50 px-1 py-0.5 rounded">priya.sharma@company.com</code>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">
                    New Password
                  </label>
                  <div className="relative rounded-lg">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-[#64748B]" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="block w-full pl-10 pr-10 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#172033] focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] outline-none transition-all placeholder:text-[#94A3B8]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#64748B] hover:text-[#172033] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">
                    Confirm Password
                  </label>
                  <div className="relative rounded-lg">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-[#64748B]" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="block w-full pl-10 pr-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#172033] focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] outline-none transition-all placeholder:text-[#94A3B8]"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm shadow-blue-500/20 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#2563EB] transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {loading ? 'Activating Account...' : 'Activate Account'}
                  </button>
                </div>
              </form>

              <div className="mt-6 pt-5 border-t border-[#E2E8F0] text-center">
                <p className="text-xs text-[#64748B]">
                  Already activated?{' '}
                  <Link
                    to="/login"
                    className="font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline transition-colors"
                  >
                    Back to Login
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
