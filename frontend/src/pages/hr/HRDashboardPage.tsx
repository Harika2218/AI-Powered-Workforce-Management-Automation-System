import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardsApi } from '../../api/dashboards';
import type { HRDashboardData } from '../../types/api';
import {
  Users,
  UserCheck,
  UserX,
  CalendarDays,
  Clock,
  Building2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Calendar,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
} from 'recharts';

export const HRDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<HRDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await dashboardsApi.getHRDashboard();
      setData(res);
    } catch (err: any) {
      console.error('Error fetching HR dashboard:', err);
      setError('Unable to load live HR dashboard data from backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-lg w-1/4"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-white border border-[#E2E8F0] rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-white border border-[#E2E8F0] rounded-xl"></div>
          <div className="h-72 bg-white border border-[#E2E8F0] rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-white border border-[#E2E8F0] rounded-2xl max-w-lg mx-auto my-12 shadow-sm">
        <AlertTriangle className="w-10 h-10 text-[#DC2626] mx-auto mb-3" />
        <h3 className="text-base font-bold text-[#172033]">Dashboard Loading Error</h3>
        <p className="text-xs text-[#64748B] mt-1">{error || 'Failed to retrieve data.'}</p>
        <button
          onClick={fetchDashboard}
          className="mt-4 px-4 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-lg hover:bg-[#1D4ED8] cursor-pointer transition-colors shadow-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  // Attendance Donut Data
  const attendanceDonutData = [
    { name: 'Present', value: data.attendance_distribution.present, color: '#16A34A' }, // Bright Green
    { name: 'Absent', value: data.attendance_distribution.absent, color: '#DC2626' },   // Clear Red
    { name: 'Late', value: data.attendance_distribution.late, color: '#D97706' },       // Clear Amber
    { name: 'On Leave', value: data.attendance_distribution.on_leave, color: '#2563EB' },// Primary Blue
  ];

  // Leave Donut Data
  const leaveDonutColors: Record<string, string> = {
    annual: '#2563EB', // Primary Blue
    sick: '#D97706',   // Clear Amber
    casual: '#16A34A', // Bright Green
  };

  const leaveChartData = data.leave_distribution.map((item) => ({
    name: item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'Other',
    value: item.count,
    color: leaveDonutColors[item.type?.toLowerCase()] || '#64748B',
  }));

  return (
    <div className="space-y-8">
      {/* 1. Header greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#172033]">
            Organization Overview
          </h2>
          <p className="text-xs text-[#64748B] mt-1">
            Real-time workforce metrics, departmental analytics, and pending administrative tasks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/hr/workforce')}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-colors shadow-sm shadow-blue-500/20 cursor-pointer"
          >
            Manage Workforce
          </button>
        </div>
      </div>

      {/* 2. Top KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs hover:border-blue-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              Total Staff
            </span>
            <Users className="w-4 h-4 text-[#2563EB]" />
          </div>
          <p className="text-2xl font-extrabold text-[#172033] mt-2">
            {data.total_employees}
          </p>
          <span className="text-[10px] text-[#16A34A] font-semibold">100% database backed</span>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs hover:border-emerald-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              Present Today
            </span>
            <UserCheck className="w-4 h-4 text-[#16A34A]" />
          </div>
          <p className="text-2xl font-extrabold text-[#16A34A] mt-2">
            {data.present_today}
          </p>
          <span className="text-[10px] text-[#64748B]">
            {data.total_employees > 0 ? `${Math.round((data.present_today / data.total_employees) * 100)}% attendance` : ''}
          </span>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs hover:border-red-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              Absent Today
            </span>
            <UserX className="w-4 h-4 text-[#DC2626]" />
          </div>
          <p className="text-2xl font-extrabold text-[#DC2626] mt-2">
            {data.absent_today}
          </p>
          <span className="text-[10px] text-[#64748B]">Unplanned absence</span>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs hover:border-amber-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              On Leave
            </span>
            <CalendarDays className="w-4 h-4 text-[#D97706]" />
          </div>
          <p className="text-2xl font-extrabold text-[#D97706] mt-2">
            {data.on_leave_today}
          </p>
          <span className="text-[10px] text-[#64748B]">Approved leaves</span>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs hover:border-blue-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              Overtime Today
            </span>
            <Clock className="w-4 h-4 text-[#2563EB]" />
          </div>
          <p className="text-2xl font-extrabold text-[#172033] mt-2">
            {data.overtime_hours_today} <span className="text-xs font-normal text-[#64748B]">hrs</span>
          </p>
          <span className="text-[10px] text-[#64748B]">Beyond shift limit</span>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs hover:border-blue-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              Departments
            </span>
            <Building2 className="w-4 h-4 text-[#64748B]" />
          </div>
          <p className="text-2xl font-extrabold text-[#172033] mt-2">
            {data.total_departments}
          </p>
          <span className="text-[10px] text-[#64748B]">Active business units</span>
        </div>
      </div>

      {/* 3. Attention Section (Needs Attention) */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#D97706]" />
            <h3 className="text-sm font-bold text-[#172033]">Needs Attention</h3>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-[#64748B]">
              Pending Approvals:{' '}
              <strong className="text-[#172033]">
                {(data.pending_approvals?.leave || 0) + (data.pending_approvals?.timesheets || 0)}
              </strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pending Leave Card */}
          <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between hover:border-blue-200 transition-colors">
            <div>
              <p className="text-xs font-semibold text-[#172033]">Pending Leave Requests</p>
              <p className="text-lg font-bold text-[#2563EB] mt-0.5">
                {data.pending_approvals?.leave || 0} requests
              </p>
            </div>
            <button
              onClick={() => navigate('/hr/leave')}
              className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Review <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Pending Timesheets Card */}
          <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between hover:border-blue-200 transition-colors">
            <div>
              <p className="text-xs font-semibold text-[#172033]">Pending Timesheets</p>
              <p className="text-lg font-bold text-[#2563EB] mt-0.5">
                {data.pending_approvals?.timesheets || 0} submissions
              </p>
            </div>
            <button
              onClick={() => navigate('/hr/timesheets')}
              className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Review <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Anomalies Card */}
          <div className="p-3.5 rounded-lg bg-red-50/60 border border-red-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#172033]">Recent Anomalies</p>
              <p className="text-lg font-bold text-[#DC2626] mt-0.5">
                {data.recent_anomalies?.length || 0} flagged
              </p>
            </div>
            <button
              onClick={() => navigate('/hr/attendance')}
              className="text-xs font-semibold text-[#DC2626] hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Audit <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Core Visualizations Grid (Attendance Donut & Trend) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attendance Distribution Donut */}
        <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#172033]">Today's Attendance Distribution</h3>
              <p className="text-[11px] text-[#64748B]">Active status across all employees</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendanceDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {attendanceDonutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(val, entry: any) => (
                    <span className="text-xs font-medium text-[#172033]">{val}: {entry.payload.value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance Trend Line Chart */}
        <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#172033]">Attendance Trend</h3>
              <p className="text-[11px] text-[#64748B]">Past 7 days dynamic attendance velocity</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.attendance_trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.8} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend verticalAlign="top" height={30} />
                <Line type="monotone" dataKey="present" stroke="#16A34A" strokeWidth={2.5} name="Present" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="absent" stroke="#DC2626" strokeWidth={2} name="Absent" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="on_leave" stroke="#2563EB" strokeWidth={2} name="On Leave" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. Department Breakdown & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Headcount by Department */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#172033]">Headcount by Department</h3>
              <p className="text-[11px] text-[#64748B]">Staff distribution across functional business units</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.employees_by_department || []} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.7} />
                <XAxis dataKey="department" tick={{ fontSize: 10, fill: '#64748B' }} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} name="Employees" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Average Performance */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#172033]">Department Performance</h3>
              <p className="text-[11px] text-[#64748B]">Aggregate review score benchmark (scale 1.0 - 5.0)</p>
            </div>
            <TrendingUp className="w-4 h-4 text-[#16A34A]" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={data.department_performance || []}
                margin={{ top: 10, right: 20, left: 30, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.7} />
                <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis dataKey="department" type="category" tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Bar dataKey="average_score" fill="#16A34A" radius={[0, 4, 4, 0]} name="Avg Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 6. Leave Types & Overtime Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Leave Type Donut */}
        <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#172033]">Leave Allocation by Type</h3>
              <p className="text-[11px] text-[#64748B]">Annual vs Sick vs Casual leave distribution</p>
            </div>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leaveChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {leaveChartData.map((entry, index) => (
                    <Cell key={`leave-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  formatter={(val, entry: any) => (
                    <span className="text-xs text-[#172033]">{val}: {entry.payload.value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Overtime Hours by Department */}
        <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#172033]">Department Overtime Distribution</h3>
              <p className="text-[11px] text-[#64748B]">Total accrued overtime hours by business unit</p>
            </div>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={data.overtime_distribution || []}
                margin={{ top: 10, right: 20, left: 30, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.7} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis dataKey="department" type="category" tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Bar dataKey="overtime_hours" fill="#D97706" radius={[0, 4, 4, 0]} name="Overtime (hrs)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 7. Upcoming Corporate Holidays & Quick Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Corporate Holidays */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#172033]">Upcoming Public & Corporate Holidays</h3>
              <p className="text-[11px] text-[#64748B]">Statutory paid holidays observed company-wide</p>
            </div>
            <Calendar className="w-4 h-4 text-[#2563EB]" />
          </div>

          <div className="space-y-2.5">
            {[
              { name: 'Veterans Day', date: 'Nov 11, 2026', type: 'Federal Holiday', daysLeft: '37 days away' },
              { name: 'Thanksgiving Day', date: 'Nov 26, 2026', type: 'National Holiday', daysLeft: '52 days away' },
              { name: 'Day After Thanksgiving', date: 'Nov 27, 2026', type: 'Corporate Holiday', daysLeft: '53 days away' },
              { name: 'Christmas Day', date: 'Dec 25, 2026', type: 'Federal Holiday', daysLeft: '81 days away' },
              { name: "New Year's Day", date: 'Jan 01, 2027', type: 'Federal Holiday', daysLeft: '88 days away' },
            ].map((holiday, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold text-xs">
                    {holiday.date.split(' ')[0]}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#172033]">{holiday.name}</p>
                    <p className="text-[10px] text-[#64748B]">{holiday.date} • {holiday.type}</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-[#16A34A] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  {holiday.daysLeft}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Operations Shortcuts */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#172033]">Administrative Workflows</h3>
                <p className="text-[11px] text-[#64748B]">Direct shortcuts to high-frequency HR actions</p>
              </div>
              <Sparkles className="w-4 h-4 text-[#D97706]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/hr/workforce')}
                className="p-3.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] hover:border-blue-200 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#172033]">Workforce Directory</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#64748B] group-hover:translate-x-0.5 group-hover:text-[#2563EB] transition-all" />
                </div>
                <p className="text-[10px] text-[#64748B]">View employee records, titles, and emergency profiles</p>
              </button>

              <button
                onClick={() => navigate('/hr/payroll')}
                className="p-3.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] hover:border-blue-200 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#172033]">Payroll Processing</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#64748B] group-hover:translate-x-0.5 group-hover:text-[#2563EB] transition-all" />
                </div>
                <p className="text-[10px] text-[#64748B]">Run compensation batch calculations & verify payslips</p>
              </button>

              <button
                onClick={() => navigate('/hr/shifts')}
                className="p-3.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] hover:border-blue-200 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#172033]">Shift Scheduling</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#64748B] group-hover:translate-x-0.5 group-hover:text-[#2563EB] transition-all" />
                </div>
                <p className="text-[10px] text-[#64748B]">Assign roster shifts and configure operational timings</p>
              </button>

              <button
                onClick={() => navigate('/hr/ai-assistant')}
                className="p-3.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] hover:border-blue-200 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#172033]">HR Intelligence</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#64748B] group-hover:translate-x-0.5 group-hover:text-[#2563EB] transition-all" />
                </div>
                <p className="text-[10px] text-[#64748B]">Ask conversational natural language HR & policy questions</p>
              </button>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
              <span className="text-xs font-semibold text-[#2563EB]">All 12 Modules Synchronized with Live MongoDB</span>
            </div>
            <span className="text-[10px] text-[#2563EB] font-mono">v2.4.0 • Enterprise</span>
          </div>
        </div>
      </div>
    </div>
  );
};
