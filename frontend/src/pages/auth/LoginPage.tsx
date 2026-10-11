import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../../api/client';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        setError(
          `Cannot connect to backend server (${API_BASE_URL}). Please verify your backend server is running and reachable.`
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-[#2563EB] flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <span className="font-extrabold text-lg tracking-tight">WF</span>
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-[#172033]">
          Welcome back
        </h2>
        <p className="mt-1 text-center text-xs text-[#64748B]">
          Sign in to your enterprise workforce management account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-[#E2E8F0] rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#DC2626] mt-0.5 shrink-0" />
              <p className="text-xs text-[#DC2626] font-medium leading-relaxed">{error}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">
                Email Address
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
                Password
              </label>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-[#64748B]" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
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

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm shadow-blue-500/20 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2563EB] transition-all disabled:opacity-60 cursor-pointer"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-[#E2E8F0] text-center">
            <p className="text-xs text-[#64748B]">
              First time here?{' '}
              <Link
                to="/activate"
                className="font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline transition-colors"
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
