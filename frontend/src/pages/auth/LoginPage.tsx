import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, Eye, EyeOff, AlertCircle, AlertTriangle, UserCheck } from 'lucide-react';
import { API_BASE_URL, isLocalhostApi, isProductionOrigin } from '../../api/client';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fillCredentials = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password);
      // Route based on role
      if (res.role === 'HR') {
        navigate('/hr');
      } else if (res.role === 'MANAGER') {
        navigate('/manager');
      } else {
        navigate('/employee');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (!err.response) {
        // Network Error, Mixed Content, or backend not reachable
        setError(
          `Cannot connect to backend API (${API_BASE_URL}). If deployed on Vercel, ensure your backend server is running and VITE_API_URL is configured in Vercel Project Settings.`
        );
        return;
      }

      const status = err.response.status;
      const detail = err.response.data?.detail;

      if (status === 401) {
        setError(
          typeof detail === 'string'
            ? detail
            : 'Invalid email or password. Please verify your credentials.'
        );
      } else if (status === 403) {
        setError(
          typeof detail === 'string'
            ? detail
            : 'Your account is inactive. Please activate your account first.'
        );
      } else {
        setError(
          typeof detail === 'string'
            ? detail
            : `Server returned error (${status}). Please try again later.`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-[#46513F] flex items-center justify-center text-white shadow-md">
            <span className="font-extrabold text-lg tracking-tight">WF</span>
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-[#242321]">
          Welcome back
        </h2>
        <p className="mt-1 text-center text-xs text-[#78756F]">
          Sign in to your enterprise workforce management account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-[#FFFDF9] py-8 px-6 shadow-sm border border-[#D8D4CC] rounded-2xl sm:px-10">
          {isProductionOrigin && isLocalhostApi && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <span className="font-semibold block mb-0.5">Backend URL Notice:</span>
                This app is running online at <code className="bg-amber-100 px-1 py-0.5 rounded text-[11px] font-mono">{typeof window !== 'undefined' ? window.location.origin : ''}</code>, but the API URL is pointing to <code className="bg-amber-100 px-1 py-0.5 rounded text-[11px] font-mono">{API_BASE_URL}</code>. In Vercel Project Settings &rarr; Environment Variables, configure <code className="bg-amber-100 px-1 py-0.5 rounded text-[11px] font-mono">VITE_API_URL</code> to connect to your backend.
              </div>
            </div>
          )}

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-[#C8755A]/10 border border-[#C8755A]/30 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#C8755A] mt-0.5 shrink-0" />
              <p className="text-xs text-[#C8755A] font-medium leading-relaxed">{error}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-[#242321] mb-1">
                Email Address
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
                  className="block w-full pl-10 pr-3 py-2 text-xs border border-[#D8D4CC] rounded-lg bg-[#FFFDF9] text-[#242321] focus:ring-2 focus:ring-[#46513F]/20 focus:border-[#46513F] outline-none transition-all placeholder:text-[#78756F]/60"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#242321]">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-medium text-[#78756F] hover:text-[#46513F] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-[#78756F]" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-10 py-2 text-xs border border-[#D8D4CC] rounded-lg bg-[#FFFDF9] text-[#242321] focus:ring-2 focus:ring-[#46513F]/20 focus:border-[#46513F] outline-none transition-all placeholder:text-[#78756F]/60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#78756F] hover:text-[#242321] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-xs text-xs font-bold text-white bg-[#46513F] hover:bg-[#46513F]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#46513F] transition-all disabled:opacity-60 cursor-pointer"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </div>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-5 pt-4 border-t border-[#D8D4CC]/50">
            <p className="text-[11px] font-semibold text-[#78756F] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-[#46513F]" />
              Quick Fill Demo Accounts
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('josiah.harris@company.com', 'Password123!')}
                className="py-1.5 px-2 text-[11px] font-medium bg-[#F7F5F0] hover:bg-[#EAE6DE] text-[#242321] rounded-lg border border-[#D8D4CC] transition-colors text-center cursor-pointer"
                title="Employee: Josiah Harris"
              >
                Employee
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('alexander.wright@company.com', 'Password123!')}
                className="py-1.5 px-2 text-[11px] font-medium bg-[#F7F5F0] hover:bg-[#EAE6DE] text-[#242321] rounded-lg border border-[#D8D4CC] transition-colors text-center cursor-pointer"
                title="Manager: Alexander Wright"
              >
                Manager
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('sarah.jenkins@company.com', 'Password123!')}
                className="py-1.5 px-2 text-[11px] font-medium bg-[#F7F5F0] hover:bg-[#EAE6DE] text-[#242321] rounded-lg border border-[#D8D4CC] transition-colors text-center cursor-pointer"
                title="HR Admin: Sarah Jenkins"
              >
                HR Admin
              </button>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-[#D8D4CC]/70 text-center">
            <p className="text-xs text-[#78756F]">
              First time here?{' '}
              <Link
                to="/activate"
                className="font-semibold text-[#46513F] hover:underline transition-colors"
              >
                Activate your account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
