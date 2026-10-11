import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarDays,
  Clock,
  FileSpreadsheet,
  CircleDollarSign,
  TrendingUp,
  BarChart3,
  Bot,
  ShieldAlert,
  Bell,
  UserCheck,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { role } = useAuth();

  const getNavItems = () => {
    if (role === 'HR') {
      return [
        { label: 'Overview', to: '/hr', icon: LayoutDashboard },
        { label: 'Workforce', to: '/hr/workforce', icon: Users },
        { label: 'Attendance', to: '/hr/attendance', icon: CalendarCheck },
        { label: 'Leave', to: '/hr/leave', icon: CalendarDays },
        { label: 'Shifts', to: '/hr/shifts', icon: Clock },
        { label: 'Timesheets', to: '/hr/timesheets', icon: FileSpreadsheet },
        { label: 'Payroll', to: '/hr/payroll', icon: CircleDollarSign },
        { label: 'Performance', to: '/hr/performance', icon: TrendingUp },
        { label: 'Analytics', to: '/hr/analytics', icon: BarChart3 },
        { label: 'AI Assistant', to: '/hr/ai-assistant', icon: Bot },
        { label: 'Audit Logs', to: '/hr/audit', icon: ShieldAlert },
        { label: 'Notifications', to: '/hr/notifications', icon: Bell },
      ];
    }

    if (role === 'MANAGER') {
      return [
        { label: 'Dashboard', to: '/manager', icon: LayoutDashboard },
        { label: 'My Team', to: '/manager/team', icon: Users },
        { label: 'Attendance', to: '/manager/attendance', icon: CalendarCheck },
        { label: 'Leave Approvals', to: '/manager/leave', icon: CalendarDays },
        { label: 'Shifts', to: '/manager/shifts', icon: Clock },
        { label: 'Timesheets', to: '/manager/timesheets', icon: FileSpreadsheet },
        { label: 'Performance', to: '/manager/performance', icon: TrendingUp },
        { label: 'AI Assistant', to: '/manager/ai-assistant', icon: Bot },
        { label: 'Notifications', to: '/manager/notifications', icon: Bell },
      ];
    }

    // EMPLOYEE default
    return [
      { label: 'Dashboard', to: '/employee', icon: LayoutDashboard },
      { label: 'My Profile', to: '/employee/profile', icon: UserCheck },
      { label: 'My Attendance', to: '/employee/attendance', icon: CalendarCheck },
      { label: 'My Leave', to: '/employee/leave', icon: CalendarDays },
      { label: 'My Shifts', to: '/employee/shifts', icon: Clock },
      { label: 'My Timesheets', to: '/employee/timesheets', icon: FileSpreadsheet },
      { label: 'Performance', to: '/employee/performance', icon: TrendingUp },
      { label: 'AI Assistant', to: '/employee/ai-assistant', icon: Bot },
      { label: 'Notifications', to: '/employee/notifications', icon: Bell },
    ];
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-[#E2E8F0] flex flex-col min-h-screen">
      {/* Brand logo & title */}
      <div className="p-5 border-b border-[#E2E8F0] flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
          <span className="font-extrabold text-sm tracking-tight">WF</span>
        </div>
        <div>
          <h2 className="font-bold text-sm tracking-tight text-[#172033]">
            Workforce AI
          </h2>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#2563EB]">
            Enterprise Suite
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
          Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/hr' || item.to === '/manager' || item.to === '/employee'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-sm shadow-blue-500/25'
                    : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#172033]'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#64748B]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
            <span className="text-[11px] font-semibold text-[#172033]">System Live</span>
          </div>
          <span className="text-[10px] font-mono text-[#64748B]">v1.0</span>
        </div>
      </div>
    </aside>
  );
};
