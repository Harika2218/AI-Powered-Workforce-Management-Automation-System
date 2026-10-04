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
        <div className="h-8 bg-[#EAE6DE] rounded-lg w-1/4"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-[#FFFDF9] border border-[#D8D4CC] rounded-2xl max-w-lg mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-[#C8755A] mx-auto mb-3" />
        <h3 className="text-base font-bold text-[#242321]">Unable to Load Team Data</h3>
        <p className="text-xs text-[#78756F] mt-1">{error}</p>
        <button
          onClick={fetchDashboard}
          className="mt-4 px-4 py-2 bg-[#46513F] text-white text-xs font-bold rounded-lg hover:bg-[#46513F]/90 cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const attendanceDonutData = [
    { name: 'Present', value: data.team_attendance_distribution?.present || 0, color: '#71806B' },
    { name: 'Absent', value: data.team_attendance_distribution?.absent || 0, color: '#C8755A' },
    { name: 'Late', value: data.team_attendance_distribution?.late || 0, color: '#C99A52' },
    { name: 'On Leave', value: data.team_attendance_distribution?.on_leave || 0, color: '#78756F' },
  ];

  const leaveColors: Record<string, string> = {
    annual: '#46513F',
    sick: '#C99A52',
    casual: '#71806B',
  };

  const leaveChartData = (data.team_leave_distribution || []).map((item) => ({
    name: item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'Other',
    value: item.count,
    color: leaveColors[item.type?.toLowerCase()] || '#78756F',
  }));

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#242321]">
            Team Management Dashboard
          </h2>
          <p className="text-xs text-[#78756F] mt-1">
            Real-time direct report metrics, attendance monitoring, and pending team approvals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/manager/team')}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#46513F] text-white hover:bg-[#46513F]/90 transition-colors shadow-xs cursor-pointer"
          >
            View My Team
          </button>
        </div>
      </div>

      {/* Top Team KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#78756F]">
              Team Size
            </span>
            <Users className="w-4 h-4 text-[#46513F]" />
          </div>
          <p className="text-2xl font-extrabold text-[#242321] mt-2">
            {data.team_size}
          </p>
          <span className="text-[10px] text-[#71806B] font-medium">Direct reports</span>
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
          <span className="text-[10px] text-[#78756F]">Checked in</span>
        </div>

        <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#78756F]">
              Absent
            </span>
            <UserX className="w-4 h-4 text-[#C8755A]" />
          </div>
          <p className="text-2xl font-extrabold text-[#C8755A] mt-2">
            {data.absent_today}
          </p>
          <span className="text-[10px] text-[#78756F]">Not logged in</span>
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
              Pending Leave
            </span>
            <CheckSquare className="w-4 h-4 text-[#46513F]" />
          </div>
          <p className="text-2xl font-extrabold text-[#242321] mt-2">
            {data.pending_leave_count}
          </p>
          <span className="text-[10px] text-[#C99A52] font-semibold">Requires approval</span>
        </div>

        <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#78756F]">
              Overtime Today
            </span>
            <Clock className="w-4 h-4 text-[#78756F]" />
          </div>
          <p className="text-2xl font-extrabold text-[#242321] mt-2">
            {data.overtime_hours_today} <span className="text-xs font-normal text-[#78756F]">hrs</span>
          </p>
          <span className="text-[10px] text-[#78756F]">Team total</span>
        </div>
      </div>

      {/* Pending Actions Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#78756F]">
              Leave Management
            </span>
            <h4 className="text-base font-bold text-[#242321] mt-1">
              {data.pending_leave_count} Team Leave Requests
            </h4>
            <p className="text-xs text-[#78756F]">Review and approve or reject submissions</p>
          </div>
          <button
            onClick={() => navigate('/manager/leave')}
            className="px-3 py-2 bg-[#46513F] text-white text-xs font-semibold rounded-lg hover:bg-[#46513F]/90 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            Review <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#78756F]">
              Timesheet Approvals
            </span>
            <h4 className="text-base font-bold text-[#242321] mt-1">
              {data.pending_timesheets_count} Pending Timesheets
            </h4>
            <p className="text-xs text-[#78756F]">Verify weekly working hours logged by team</p>
          </div>
          <button
            onClick={() => navigate('/manager/timesheets')}
            className="px-3 py-2 bg-[#46513F] text-white text-xs font-semibold rounded-lg hover:bg-[#46513F]/90 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            Review <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Team Productivity & Score Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#78756F]">Average Working Hours / Day</span>
            <Clock className="w-4 h-4 text-[#71806B]" />
          </div>
          <p className="text-2xl font-bold text-[#242321] mt-2">
            {data.team_avg_working_hours.toFixed(1)} hrs
          </p>
          <div className="w-full bg-[#EAE6DE] h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-[#71806B] h-2 rounded-full"
              style={{ width: `${Math.min(100, (data.team_avg_working_hours / 8.0) * 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#78756F]">Team Average Performance Score</span>
            <TrendingUp className="w-4 h-4 text-[#46513F]" />
          </div>
          <p className="text-2xl font-bold text-[#242321] mt-2">
            {data.team_avg_performance.toFixed(2)} <span className="text-xs text-[#78756F] font-normal">/ 5.0</span>
          </p>
          <div className="w-full bg-[#EAE6DE] h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-[#46513F] h-2 rounded-full"
              style={{ width: `${(data.team_avg_performance / 5.0) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Visualizations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team Attendance Donut */}
        <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-[#242321]">Team Attendance Distribution</h3>
          <p className="text-[11px] text-[#78756F] mb-2">Today's direct report check-in status</p>
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

        {/* Team Leave Distribution */}
        <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-[#242321]">Team Leave Distribution</h3>
          <p className="text-[11px] text-[#78756F] mb-2">Leave records by category across team</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leaveChartData.length > 0 ? leaveChartData : [{ name: 'None', value: 1, color: '#D8D4CC' }]}
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
      </div>
    </div>
  );
};
