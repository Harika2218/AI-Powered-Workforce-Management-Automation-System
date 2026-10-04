import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';

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
      const detail = err.response?.data?.detail;
      setError(
        typeof detail === 'string'
          ? detail
          : 'Invalid email or password. Please verify your credentials.'
      );
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
              <label className="block text-xs font-semibold text-[#242321] mb-1">
                Password
              </label>
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
