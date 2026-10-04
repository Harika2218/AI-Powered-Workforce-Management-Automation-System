import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { ActivationPage } from './pages/auth/ActivationPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';

// HR Pages
import { HRDashboardPage } from './pages/hr/HRDashboardPage';

// Manager Pages
import { ManagerDashboardPage } from './pages/manager/ManagerDashboardPage';

// Employee Pages
import { EmployeeDashboardPage } from './pages/employee/EmployeeDashboardPage';
import { ProfilePage } from './pages/employee/ProfilePage';

// Shared Module Pages
import { WorkforcePage } from './pages/workforce/WorkforcePage';
import { AttendancePage } from './pages/attendance/AttendancePage';
import { LeavePage } from './pages/leave/LeavePage';
import { ShiftsPage } from './pages/shifts/ShiftsPage';
import { TimesheetsPage } from './pages/timesheets/TimesheetsPage';
import { PayrollPage } from './pages/payroll/PayrollPage';
import { PerformancePage } from './pages/performance/PerformancePage';
import { AnalyticsPage } from './pages/analytics/AnalyticsPage';
import { AIAssistantPage } from './pages/ai/AIAssistantPage';
import { AuditLogPage } from './pages/audit/AuditLogPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';

const RootRedirect: React.FC = () => {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#D8D4CC] border-t-[#46513F] rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-[#78756F]">Loading workforce workspace...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'HR') return <Navigate to="/hr" replace />;
  if (role === 'MANAGER') return <Navigate to="/manager" replace />;
  return <Navigate to="/employee" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/activate" element={<ActivationPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* HR Role Routes */}
          <Route
            path="/hr"
            element={
              <ProtectedRoute allowedRoles={['HR']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HRDashboardPage />} />
            <Route path="workforce" element={<WorkforcePage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="leave" element={<LeavePage />} />
            <Route path="shifts" element={<ShiftsPage />} />
            <Route path="timesheets" element={<TimesheetsPage />} />
            <Route path="payroll" element={<PayrollPage />} />
            <Route path="performance" element={<PerformancePage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="ai-assistant" element={<AIAssistantPage />} />
            <Route path="audit" element={<AuditLogPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>

          {/* Manager Role Routes */}
          <Route
            path="/manager"
            element={
              <ProtectedRoute allowedRoles={['MANAGER', 'HR']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ManagerDashboardPage />} />
            <Route path="team" element={<WorkforcePage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="leave" element={<LeavePage />} />
            <Route path="shifts" element={<ShiftsPage />} />
            <Route path="timesheets" element={<TimesheetsPage />} />
            <Route path="performance" element={<PerformancePage />} />
            <Route path="ai-assistant" element={<AIAssistantPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>

          {/* Employee Role Routes */}
          <Route
            path="/employee"
            element={
              <ProtectedRoute allowedRoles={['EMPLOYEE', 'MANAGER', 'HR']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<EmployeeDashboardPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="leave" element={<LeavePage />} />
            <Route path="shifts" element={<ShiftsPage />} />
            <Route path="timesheets" element={<TimesheetsPage />} />
            <Route path="performance" element={<PerformancePage />} />
            <Route path="ai-assistant" element={<AIAssistantPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>

          {/* Fallback Catch-All */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
