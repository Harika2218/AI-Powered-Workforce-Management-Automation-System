import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#D8D4CC] border-t-[#46513F] rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-medium text-[#78756F]">Loading workforce workspace...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect to their respective authorized root
    if (role === 'HR') return <Navigate to="/hr" replace />;
    if (role === 'MANAGER') return <Navigate to="/manager" replace />;
    return <Navigate to="/employee" replace />;
  }

  return <>{children}</>;
};
