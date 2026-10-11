import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardsApi } from '../../api/dashboards';
import { attendanceApi } from '../../api/attendance';
import type { EmployeeDashboardData } from '../../types/api';
import {
  LogIn,
  LogOut,
  CalendarDays,
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Bell,
  ArrowRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const EmployeeDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<EmployeeDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await dashboardsApi.getEmployeeDashboard();
      setData(res);
    } catch (err) {
      console.error('Error fetching employee dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      setActionMessage(null);
      await attendanceApi.checkIn({ work_mode: 'office' });
      setActionMessage({ text: 'Checked in successfully!', type: 'success' });
      await fetchDashboard();
    } catch (err: any) {
      setActionMessage({
        text: err.response?.data?.detail || 'Failed to check in. Check-in already recorded or shift error.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      setActionMessage(null);
      await attendanceApi.checkOut();
      setActionMessage({ text: 'Checked out successfully!', type: 'success' });
      await fetchDashboard();
    } catch (err: any) {
      setActionMessage({
        text: err.response?.data?.detail || 'Failed to check out. Please verify check-in status.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-lg w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-44 bg-white border border-[#E2E8F0] rounded-xl"></div>
          <div className="h-44 bg-white border border-[#E2E8F0] rounded-xl"></div>
          <div className="h-44 bg-white border border-[#E2E8F0] rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-white border border-[#E2E8F0] rounded-2xl max-w-lg mx-auto shadow-sm">
        <p className="text-sm text-[#64748B] font-medium">Unable to load employee dashboard data.</p>
        <button
          onClick={fetchDashboard}
          className="mt-4 px-4 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-lg hover:bg-[#1D4ED8] cursor-pointer shadow-xs"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Header with greeting and notification preview */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E2E8F0]">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172033]">
            Welcome, {data.employee_name}
          </h2>
          <p className="text-xs text-[#64748B] mt-1 font-medium">
            Emp ID: <span className="font-mono font-bold text-[#2563EB]">{data.employee_id}</span> • Overview of your daily schedule and requests
          </p>
        </div>
        {data.unread_notifications_count > 0 && (
          <button
            onClick={() => navigate('/employee/notifications')}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-red-200 bg-red-50 text-[#DC2626] text-xs font-semibold hover:bg-red-100 transition-colors cursor-pointer shadow-2xs"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{data.unread_notifications_count} unread notifications</span>
          </button>
        )}
      </div>

      {/* Action feedback message */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-semibold ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-[#16A34A]'
              : 'bg-red-50 border-red-200 text-[#DC2626]'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16A34A]" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* 2. Today's Attendance & Shift Status Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Card with Actions */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Today's Attendance
              </span>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  data.today_status === 'Present'
                    ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
                    : data.today_status === 'Late'
                    ? 'bg-amber-50 text-[#D97706] border border-amber-200'
                    : 'bg-slate-100 text-[#64748B] border border-slate-200'
                }`}
              >
                {data.today_status}
              </span>
            </div>

            <div className="mt-4 space-y-2 text-xs text-[#64748B]">
              <div className="flex justify-between items-center py-1 border-b border-[#E2E8F0]/60">
                <span>Check In:</span>
                <strong className="text-[#172033] font-mono">{data.check_in_time || '—'}</strong>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#E2E8F0]/60">
                <span>Check Out:</span>
                <strong className="text-[#172033] font-mono">{data.check_out_time || '—'}</strong>
              </div>
              <div className="flex justify-between items-center py-1">
                <span>Hours Logged Today:</span>
                <strong className="text-[#2563EB] font-bold">{data.working_hours_today.toFixed(1)} hrs</strong>
              </div>
            </div>
          </div>

          {/* Functional Check-In / Check-Out Buttons */}
          <div className="mt-5 grid grid-cols-2 gap-2 pt-3 border-t border-[#E2E8F0]">
            <button
              onClick={handleCheckIn}
              disabled={data.is_checked_in || actionLoading}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm shadow-blue-500/20 active:scale-[0.98]"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{data.is_checked_in ? 'Checked In' : 'Check In'}</span>
            </button>

            <button
              onClick={handleCheckOut}
              disabled={!data.is_checked_in || data.is_checked_out || actionLoading}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-[#E2E8F0] bg-white text-[#172033] text-xs font-bold hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5 text-[#64748B]" />
              <span>{data.is_checked_out ? 'Checked Out' : 'Check Out'}</span>
            </button>
          </div>
        </div>

        {/* Leave Balances Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Leave Balances
              </span>
              <div className="p-1.5 rounded-lg bg-blue-50 text-[#2563EB]">
                <CalendarDays className="w-4 h-4" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[10px] uppercase font-semibold text-[#64748B]">Annual</span>
                <p className="text-xl font-extrabold text-[#2563EB] mt-1">
                  {data.leave_balances?.annual ?? 0}
                </p>
                <span className="text-[10px] text-[#94A3B8] font-medium">days</span>
              </div>

              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[10px] uppercase font-semibold text-[#64748B]">Sick</span>
                <p className="text-xl font-extrabold text-[#D97706] mt-1">
                  {data.leave_balances?.sick ?? 0}
                </p>
                <span className="text-[10px] text-[#94A3B8] font-medium">days</span>
              </div>

              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[10px] uppercase font-semibold text-[#64748B]">Casual</span>
                <p className="text-xl font-extrabold text-[#16A34A] mt-1">
                  {data.leave_balances?.casual ?? 0}
                </p>
                <span className="text-[10px] text-[#94A3B8] font-medium">days</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
            <span className="text-[11px] text-[#64748B] font-medium">Need time off?</span>
            <button
              onClick={() => navigate('/employee/leave')}
              className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 cursor-pointer transition-colors"
            >
              Apply Leave <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Assigned Shift Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Assigned Shift
              </span>
              <div className="p-1.5 rounded-lg bg-blue-50 text-[#2563EB]">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>

            {data.upcoming_shift ? (
              <div className="space-y-2">
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <p className="text-sm font-bold text-[#172033]">{data.upcoming_shift.name} Shift</p>
                  <p className="text-xs text-[#64748B] mt-1 font-mono">
                    {data.upcoming_shift.start_time} - {data.upcoming_shift.end_time} ({data.upcoming_shift.duration_hours} hrs)
                  </p>
                </div>
                <div className="text-[11px] text-[#64748B] flex justify-between px-1 font-medium">
                  <span>Month Overtime:</span>
                  <span className="font-bold text-[#172033]">{data.overtime_hours_this_month} hrs</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#64748B] py-4 font-medium">Standard 09:00 - 17:00 General Shift</p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
            <span className="text-[11px] text-[#64748B] font-medium">View schedule</span>
            <button
              onClick={() => navigate('/employee/shifts')}
              className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 cursor-pointer transition-colors"
            >
              My Shifts <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Personal Attendance Trend Line Chart */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#172033]">Recent Hours & Attendance Trend</h3>
            <p className="text-[11px] text-[#64748B] font-medium">Personal daily working hours recorded</p>
          </div>
          <div className="p-1.5 rounded-lg bg-emerald-50 text-[#16A34A]">
            <CalendarCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data.personal_attendance_trend || []}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} stroke="#CBD5E1" />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} stroke="#CBD5E1" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="hours"
                stroke="#2563EB"
                strokeWidth={2.5}
                name="Hours Worked"
                dot={{ r: 3, fill: '#2563EB' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Recent Leave Requests Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#172033]">Recent Leave Requests</h3>
            <p className="text-[11px] text-[#64748B] font-medium">Status of recent submissions to your manager</p>
          </div>
          <button
            onClick={() => navigate('/employee/leave')}
            className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
          >
            All Requests
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[#64748B] bg-[#F8FAFC]">
                <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-[11px]">Type</th>
                <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-[11px]">Start Date</th>
                <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-[11px]">End Date</th>
                <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-[11px]">Days</th>
                <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-[11px]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {data.recent_leave_requests?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[#64748B] font-medium">
                    No recent leave requests found.
                  </td>
                </tr>
              ) : (
                data.recent_leave_requests.map((req) => (
                  <tr key={req.request_id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-2.5 px-3 font-medium text-[#172033] capitalize">
                      {req.leave_type}
                    </td>
                    <td className="py-2.5 px-3 text-[#64748B] font-mono">{req.start_date}</td>
                    <td className="py-2.5 px-3 text-[#64748B] font-mono">{req.end_date}</td>
                    <td className="py-2.5 px-3 text-[#172033] font-bold">{req.days_count}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-50 text-[#16A34A] border-emerald-200'
                            : req.status === 'REJECTED'
                            ? 'bg-red-50 text-[#DC2626] border-red-200'
                            : req.status === 'CANCELLED'
                            ? 'bg-slate-100 text-[#64748B] border-slate-200'
                            : 'bg-amber-50 text-[#D97706] border-amber-200'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
