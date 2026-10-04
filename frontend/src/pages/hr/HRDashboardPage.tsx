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
        <div className="h-8 bg-[#EAE6DE] rounded-lg w-1/4"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl"></div>
          <div className="h-72 bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-[#FFFDF9] border border-[#D8D4CC] rounded-2xl max-w-lg mx-auto my-12">
        <AlertTriangle className="w-10 h-10 text-[#C8755A] mx-auto mb-3" />
        <h3 className="text-base font-bold text-[#242321]">Dashboard Loading Error</h3>
        <p className="text-xs text-[#78756F] mt-1">{error || 'Failed to retrieve data.'}</p>
        <button
          onClick={fetchDashboard}
          className="mt-4 px-4 py-2 bg-[#46513F] text-white text-xs font-bold rounded-lg hover:bg-[#46513F]/90 cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  // Attendance Donut Data
  const attendanceDonutData = [
    { name: 'Present', value: data.attendance_distribution.present, color: '#71806B' }, // Muted Sage
    { name: 'Absent', value: data.attendance_distribution.absent, color: '#C8755A' },   // Terracotta
    { name: 'Late', value: data.attendance_distribution.late, color: '#C99A52' },       // Soft Amber
    { name: 'On Leave', value: data.attendance_distribution.on_leave, color: '#78756F' },// Warm Gray
  ];

  // Leave Donut Data
  const leaveDonutColors: Record<string, string> = {
    annual: '#46513F', // Deep Olive
    sick: '#C99A52',   // Soft Amber
    casual: '#71806B', // Muted Sage
  };

  const leaveChartData = data.leave_distribution.map((item) => ({
    name: item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'Other',
    value: item.count,
    color: leaveDonutColors[item.type?.toLowerCase()] || '#78756F',
  }));

  return (
    <div className="space-y-8">
      {/* 1. Header greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#242321]">
            Organization Overview
          </h2>
          <p className="text-xs text-[#78756F] mt-1">
            Real-time workforce metrics, departmental analytics, and pending administrative tasks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/hr/workforce')}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#46513F] text-white hover:bg-[#46513F]/90 transition-colors shadow-xs cursor-pointer"
          >
            Manage Workforce
          </button>
        </div>
      </div>

      {/* 2. Top KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#78756F]">
              Total Staff
            </span>
            <Users className="w-4 h-4 text-[#46513F]" />
          </div>
          <p className="text-2xl font-extrabold text-[#242321] mt-2">
            {data.total_employees}
          </p>
          <span className="text-[10px] text-[#71806B] font-medium">100% database backed</span>
        </div>

        <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#78756F]">
              Present Today
            </span>
            <UserCheck className="w-4 h-4 text-[#71806B]" />
          </div>
          <p className="text-2xl font-extrabold text-[#71806B] mt-2">
            {data.present_today}
          </p>
          <span className="text-[10px] text-[#78756F]">
            {data.total_employees > 0 ? `${Math.round((data.present_today / data.total_employees) * 100)}% attendance` : ''}
          </span>
        </div>

        <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#78756F]">
              Absent Today
            </span>
            <UserX className="w-4 h-4 text-[#C8755A]" />
          </div>
          <p className="text-2xl font-extrabold text-[#C8755A] mt-2">
            {data.absent_today}
          </p>
          <span className="text-[10px] text-[#78756F]">Unplanned absence</span>
        </div>

        <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#78756F]">
              On Leave
            </span>
            <CalendarDays className="w-4 h-4 text-[#C99A52]" />
          </div>
          <p className="text-2xl font-extrabold text-[#C99A52] mt-2">
            {data.on_leave_today}
          </p>
          <span className="text-[10px] text-[#78756F]">Approved leaves</span>
        </div>

        <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#78756F]">
              Overtime Today
            </span>
            <Clock className="w-4 h-4 text-[#46513F]" />
          </div>
          <p className="text-2xl font-extrabold text-[#242321] mt-2">
            {data.overtime_hours_today} <span className="text-xs font-normal text-[#78756F]">hrs</span>
          </p>
          <span className="text-[10px] text-[#78756F]">Beyond shift limit</span>
        </div>

        <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#78756F]">
              Departments
            </span>
            <Building2 className="w-4 h-4 text-[#78756F]" />
          </div>
          <p className="text-2xl font-extrabold text-[#242321] mt-2">
            {data.total_departments}
          </p>
          <span className="text-[10px] text-[#78756F]">Active business units</span>
        </div>
      </div>

      {/* 3. Attention Section (Needs Attention) */}
      <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#D8D4CC]/60 mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#C99A52]" />
            <h3 className="text-sm font-bold text-[#242321]">Needs Attention</h3>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-[#78756F]">
              Pending Approvals:{' '}
              <strong className="text-[#242321]">
                {(data.pending_approvals?.leave || 0) + (data.pending_approvals?.timesheets || 0)}
              </strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pending Leave Card */}
          <div className="p-3.5 rounded-lg bg-[#F7F5F0] border border-[#D8D4CC] flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#242321]">Pending Leave Requests</p>
              <p className="text-lg font-bold text-[#46513F] mt-0.5">
                {data.pending_approvals?.leave || 0} requests
              </p>
            </div>
            <button
              onClick={() => navigate('/hr/leave')}
              className="text-xs font-semibold text-[#46513F] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Review <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Pending Timesheets Card */}
          <div className="p-3.5 rounded-lg bg-[#F7F5F0] border border-[#D8D4CC] flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#242321]">Pending Timesheets</p>
              <p className="text-lg font-bold text-[#46513F] mt-0.5">
                {data.pending_approvals?.timesheets || 0} submissions
              </p>
            </div>
            <button
              onClick={() => navigate('/hr/timesheets')}
              className="text-xs font-semibold text-[#46513F] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Review <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Anomalies Card */}
          <div className="p-3.5 rounded-lg bg-[#F7F5F0] border border-[#D8D4CC] flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#242321]">Recent Anomalies</p>
              <p className="text-lg font-bold text-[#C8755A] mt-0.5">
                {data.recent_anomalies?.length || 0} flagged
              </p>
            </div>
            <button
              onClick={() => navigate('/hr/attendance')}
              className="text-xs font-semibold text-[#C8755A] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Audit <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Core Visualizations Grid (Attendance Donut & Trend) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attendance Distribution Donut */}
        <div className="lg:col-span-5 bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#242321]">Today's Attendance Distribution</h3>
              <p className="text-[11px] text-[#78756F]">Active status across all employees</p>
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
                    backgroundColor: '#FFFDF9',
                    borderColor: '#D8D4CC',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(val, entry: any) => (
                    <span className="text-xs font-medium text-[#242321]">{val}: {entry.payload.value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance Trend Line Chart */}
        <div className="lg:col-span-7 bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#242321]">Attendance Trend</h3>
              <p className="text-[11px] text-[#78756F]">Past 7 days dynamic attendance velocity</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.attendance_trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D8D4CC" opacity={0.6} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#78756F' }} />
                <YAxis tick={{ fontSize: 11, fill: '#78756F' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFDF9',
                    borderColor: '#D8D4CC',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend verticalAlign="top" height={30} />
                <Line type="monotone" dataKey="present" stroke="#71806B" strokeWidth={2.5} name="Present" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="absent" stroke="#C8755A" strokeWidth={2} name="Absent" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="on_leave" stroke="#C99A52" strokeWidth={2} name="On Leave" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. Department Breakdown & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Headcount by Department */}
        <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#242321]">Headcount by Department</h3>
              <p className="text-[11px] text-[#78756F]">Staff distribution across functional business units</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.employees_by_department || []} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D8D4CC" opacity={0.5} />
                <XAxis dataKey="department" tick={{ fontSize: 10, fill: '#78756F' }} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: '#78756F' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFDF9',
                    borderColor: '#D8D4CC',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#46513F" radius={[4, 4, 0, 0]} name="Employees" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Average Performance */}
        <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#242321]">Department Performance</h3>
              <p className="text-[11px] text-[#78756F]">Aggregate review score benchmark (scale 1.0 - 5.0)</p>
            </div>
            <TrendingUp className="w-4 h-4 text-[#71806B]" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={data.department_performance || []}
                margin={{ top: 10, right: 20, left: 30, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#D8D4CC" opacity={0.5} />
                <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11, fill: '#78756F' }} />
                <YAxis dataKey="department" type="category" tick={{ fontSize: 10, fill: '#78756F' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFDF9',
                    borderColor: '#D8D4CC',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="average_score" fill="#71806B" radius={[0, 4, 4, 0]} name="Avg Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 6. Leave Types & Overtime Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Leave Type Donut */}
        <div className="lg:col-span-5 bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#242321]">Leave Allocation by Type</h3>
              <p className="text-[11px] text-[#78756F]">Annual vs Sick vs Casual leave distribution</p>
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
                    backgroundColor: '#FFFDF9',
                    borderColor: '#D8D4CC',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  formatter={(val, entry: any) => (
                    <span className="text-xs text-[#242321]">{val}: {entry.payload.value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Overtime Hours by Department */}
        <div className="lg:col-span-7 bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#242321]">Department Overtime Distribution</h3>
              <p className="text-[11px] text-[#78756F]">Total accrued overtime hours by business unit</p>
            </div>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={data.overtime_distribution || []}
                margin={{ top: 10, right: 20, left: 30, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#D8D4CC" opacity={0.5} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#78756F' }} />
                <YAxis dataKey="department" type="category" tick={{ fontSize: 10, fill: '#78756F' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFDF9',
                    borderColor: '#D8D4CC',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="overtime_hours" fill="#C99A52" radius={[0, 4, 4, 0]} name="Overtime (hrs)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
