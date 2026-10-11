import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardsApi } from '../../api/dashboards';
import type { ManagerDashboardData } from '../../types/api';
import {
  Users,
  UserCheck,
  UserX,
  CalendarDays,
  Clock,
  CheckSquare,
  AlertCircle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export const ManagerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<ManagerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await dashboardsApi.getManagerDashboard();
      setData(res);
    } catch (err: any) {
      console.error('Error fetching manager dashboard:', err);
      setError('Unable to load team management metrics from server.');
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
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-white border border-[#E2E8F0] rounded-2xl max-w-lg mx-auto my-12 shadow-sm">
        <AlertCircle className="w-10 h-10 text-[#DC2626] mx-auto mb-3" />
        <h3 className="text-base font-bold text-[#172033]">Unable to Load Team Data</h3>
        <p className="text-xs text-[#64748B] mt-1 font-medium">{error}</p>
        <button
          onClick={fetchDashboard}
          className="mt-4 px-4 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-lg hover:bg-[#1D4ED8] cursor-pointer shadow-xs"
        >
          Retry
        </button>
      </div>
    );
  }

  const attendanceDonutData = [
    { name: 'Present', value: data.team_attendance_distribution?.present || 0, color: '#16A34A' },
    { name: 'Absent', value: data.team_attendance_distribution?.absent || 0, color: '#DC2626' },
    { name: 'Late', value: data.team_attendance_distribution?.late || 0, color: '#D97706' },
    { name: 'On Leave', value: data.team_attendance_distribution?.on_leave || 0, color: '#64748B' },
  ];

  const leaveColors: Record<string, string> = {
    annual: '#2563EB',
    sick: '#D97706',
    casual: '#16A34A',
  };

  const leaveChartData = (data.team_leave_distribution || []).map((item) => ({
    name: item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'Other',
    value: item.count,
    color: leaveColors[item.type?.toLowerCase()] || '#64748B',
  }));

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E2E8F0]">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172033]">
            Team Management Dashboard
          </h2>
          <p className="text-xs text-[#64748B] mt-1 font-medium">
            Real-time direct report metrics, attendance monitoring, and pending team approvals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/manager/team')}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-colors shadow-sm shadow-blue-500/20 cursor-pointer active:scale-[0.98]"
          >
            View My Team
          </button>
        </div>
      </div>

      {/* Top Team KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              Team Size
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-[#2563EB]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#172033] mt-2">
            {data.team_size}
          </p>
          <span className="text-[10px] text-[#2563EB] font-medium">Direct reports</span>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              Present Today
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-[#16A34A]">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#16A34A] mt-2">
            {data.present_today}
          </p>
          <span className="text-[10px] text-[#64748B] font-medium">Checked in</span>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              Absent
            </span>
            <div className="p-1.5 rounded-lg bg-red-50 text-[#DC2626]">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#DC2626] mt-2">
            {data.absent_today}
          </p>
          <span className="text-[10px] text-[#64748B] font-medium">Not logged in</span>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              On Leave
            </span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-[#D97706]">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#D97706] mt-2">
            {data.on_leave_today}
          </p>
          <span className="text-[10px] text-[#64748B] font-medium">Approved leaves</span>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              Pending Leave
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-[#2563EB]">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#172033] mt-2">
            {data.pending_leave_count}
          </p>
          <span className="text-[10px] text-[#D97706] font-semibold">Requires approval</span>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              Overtime Today
            </span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-[#64748B]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#172033] mt-2">
            {data.overtime_hours_today} <span className="text-xs font-normal text-[#64748B]">hrs</span>
          </p>
          <span className="text-[10px] text-[#64748B] font-medium">Team total</span>
        </div>
      </div>

      {/* Pending Actions Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB]">
              Leave Management
            </span>
            <h4 className="text-base font-bold text-[#172033] mt-1">
              {data.pending_leave_count} Team Leave Requests
            </h4>
            <p className="text-xs text-[#64748B] font-medium">Review and approve or reject submissions</p>
          </div>
          <button
            onClick={() => navigate('/manager/leave')}
            className="px-3.5 py-2 bg-[#2563EB] text-white text-xs font-semibold rounded-lg hover:bg-[#1D4ED8] transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shadow-blue-500/20 active:scale-[0.98]"
          >
            Review <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB]">
              Timesheet Approvals
            </span>
            <h4 className="text-base font-bold text-[#172033] mt-1">
              {data.pending_timesheets_count} Pending Timesheets
            </h4>
            <p className="text-xs text-[#64748B] font-medium">Verify weekly working hours logged by team</p>
          </div>
          <button
            onClick={() => navigate('/manager/timesheets')}
            className="px-3.5 py-2 bg-[#2563EB] text-white text-xs font-semibold rounded-lg hover:bg-[#1D4ED8] transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shadow-blue-500/20 active:scale-[0.98]"
          >
            Review <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Team Productivity & Score Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Average Working Hours / Day</span>
            <Clock className="w-4 h-4 text-[#2563EB]" />
          </div>
          <p className="text-2xl font-bold text-[#172033] mt-2">
            {data.team_avg_working_hours.toFixed(1)} hrs
          </p>
          <div className="w-full bg-[#F1F5F9] h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-[#2563EB] h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, (data.team_avg_working_hours / 8.0) * 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Team Average Performance Score</span>
            <TrendingUp className="w-4 h-4 text-[#16A34A]" />
          </div>
          <p className="text-2xl font-bold text-[#172033] mt-2">
            {data.team_avg_performance.toFixed(2)} <span className="text-xs text-[#64748B] font-normal">/ 5.0</span>
          </p>
          <div className="w-full bg-[#F1F5F9] h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-[#16A34A] h-2 rounded-full transition-all"
              style={{ width: `${(data.team_avg_performance / 5.0) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Visualizations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team Attendance Donut */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-[#172033]">Team Attendance Distribution</h3>
          <p className="text-[11px] text-[#64748B] mb-2 font-medium">Today's direct report check-in status</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendanceDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {attendanceDonutData.map((entry, index) => (
                    <Cell key={`team-att-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  formatter={(val, entry: any) => (
                    <span className="text-xs text-[#172033] font-medium">{val}: {entry.payload.value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Team Leave Distribution */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-[#172033]">Team Leave Distribution</h3>
          <p className="text-[11px] text-[#64748B] mb-2 font-medium">Leave records by category across team</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leaveChartData.length > 0 ? leaveChartData : [{ name: 'None', value: 1, color: '#CBD5E1' }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {leaveChartData.map((entry, index) => (
                    <Cell key={`team-leave-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  formatter={(val, entry: any) => (
                    <span className="text-xs text-[#172033] font-medium">{val}: {entry.payload.value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
