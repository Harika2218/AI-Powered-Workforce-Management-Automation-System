import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Employee, UserRole } from '../types/api';
import { authApi } from '../api/auth';

interface AuthContextType {
  user: User | null;
  employee: Employee | null;
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ role: UserRole }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateEmployeeState: (emp: Employee) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [employee, setEmployee] = useState<Employee | null>(() => {
    const saved = localStorage.getItem('employee');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [role, setRole] = useState<UserRole | null>(() => (localStorage.getItem('role') as UserRole) || null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setUser(null);
      setEmployee(null);
      setRole(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await authApi.getMe();
      setUser(res.user);
      setEmployee(res.employee);
      setRole(res.user.role);
      localStorage.setItem('user', JSON.stringify(res.user));
      localStorage.setItem('role', res.user.role);
      if (res.employee) {
        localStorage.setItem('employee', JSON.stringify(res.employee));
      }
    } catch (err) {
      console.error('Failed to verify session token:', err);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await authApi.login({ email, password });
      localStorage.setItem('token', data.access_token);
      setToken(data.access_token);
      setRole(data.role);
      localStorage.setItem('role', data.role);

      // Fetch fresh profile data
      const me = await authApi.getMe();
      setUser(me.user);
      setEmployee(me.employee);
      localStorage.setItem('user', JSON.stringify(me.user));
      if (me.employee) {
        localStorage.setItem('employee', JSON.stringify(me.employee));
      }

      return { role: data.role };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('employee');
    setToken(null);
    setUser(null);
    setEmployee(null);
    setRole(null);
  };

  const updateEmployeeState = (emp: Employee) => {
    setEmployee(emp);
    localStorage.setItem('employee', JSON.stringify(emp));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        employee,
        token,
        role,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        refreshProfile,
        updateEmployeeState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
