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
        <div className="h-8 bg-[#EAE6DE] rounded-lg w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-44 bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl"></div>
          <div className="h-44 bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl"></div>
          <div className="h-44 bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-[#FFFDF9] border border-[#D8D4CC] rounded-2xl max-w-lg mx-auto">
        <p className="text-sm text-[#78756F]">Unable to load employee dashboard data.</p>
        <button
          onClick={fetchDashboard}
          className="mt-4 px-4 py-2 bg-[#46513F] text-white text-xs font-bold rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Header with greeting and notification preview */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#242321]">
            Welcome, {data.employee_name}
          </h2>
          <p className="text-xs text-[#78756F] mt-1">
            Emp ID: <span className="font-mono font-semibold text-[#46513F]">{data.employee_id}</span> • Overview of your daily schedule and requests
          </p>
        </div>
        {data.unread_notifications_count > 0 && (
          <button
            onClick={() => navigate('/employee/notifications')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#C8755A]/30 bg-[#C8755A]/10 text-[#C8755A] text-xs font-semibold hover:bg-[#C8755A]/20 transition-colors cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{data.unread_notifications_count} unread notifications</span>
          </button>
        )}
      </div>

      {/* Action feedback message */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-medium ${
            actionMessage.type === 'success'
              ? 'bg-[#71806B]/15 border-[#71806B]/30 text-[#46513F]'
              : 'bg-[#C8755A]/15 border-[#C8755A]/30 text-[#C8755A]'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* 2. Today's Attendance & Shift Status Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Card with Actions */}
        <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#78756F]">
                Today's Attendance
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  data.today_status === 'Present'
                    ? 'bg-[#71806B]/15 text-[#46513F]'
                    : data.today_status === 'Late'
                    ? 'bg-[#C99A52]/15 text-[#C99A52]'
                    : 'bg-[#78756F]/15 text-[#78756F]'
                }`}
              >
                {data.today_status}
              </span>
            </div>

            <div className="mt-4 space-y-1.5 text-xs text-[#78756F]">
              <div className="flex justify-between">
                <span>Check In:</span>
                <strong className="text-[#242321]">{data.check_in_time || '—'}</strong>
              </div>
              <div className="flex justify-between">
                <span>Check Out:</span>
                <strong className="text-[#242321]">{data.check_out_time || '—'}</strong>
              </div>
              <div className="flex justify-between">
                <span>Hours Logged Today:</span>
                <strong className="text-[#46513F]">{data.working_hours_today.toFixed(1)} hrs</strong>
              </div>
            </div>
          </div>

          {/* Functional Check-In / Check-Out Buttons */}
          <div className="mt-5 grid grid-cols-2 gap-2 pt-3 border-t border-[#D8D4CC]/60">
            <button
              onClick={handleCheckIn}
              disabled={data.is_checked_in || actionLoading}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#46513F] text-white text-xs font-bold hover:bg-[#46513F]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{data.is_checked_in ? 'Checked In' : 'Check In'}</span>
            </button>

            <button
              onClick={handleCheckOut}
              disabled={!data.is_checked_in || data.is_checked_out || actionLoading}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-[#D8D4CC] bg-[#FFFDF9] text-[#242321] text-xs font-bold hover:bg-[#EAE6DE]/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{data.is_checked_out ? 'Checked Out' : 'Check Out'}</span>
            </button>
          </div>
        </div>

        {/* Leave Balances Card */}
        <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#78756F]">
                Leave Balances
              </span>
              <CalendarDays className="w-4 h-4 text-[#71806B]" />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-lg bg-[#F7F5F0] border border-[#D8D4CC]/80">
                <span className="text-[10px] uppercase font-semibold text-[#78756F]">Annual</span>
                <p className="text-xl font-bold text-[#46513F] mt-1">
                  {data.leave_balances?.annual ?? 0}
                </p>
                <span className="text-[10px] text-[#78756F]">days</span>
              </div>

              <div className="p-3 rounded-lg bg-[#F7F5F0] border border-[#D8D4CC]/80">
                <span className="text-[10px] uppercase font-semibold text-[#78756F]">Sick</span>
                <p className="text-xl font-bold text-[#C99A52] mt-1">
                  {data.leave_balances?.sick ?? 0}
                </p>
                <span className="text-[10px] text-[#78756F]">days</span>
              </div>

              <div className="p-3 rounded-lg bg-[#F7F5F0] border border-[#D8D4CC]/80">
                <span className="text-[10px] uppercase font-semibold text-[#78756F]">Casual</span>
                <p className="text-xl font-bold text-[#71806B] mt-1">
                  {data.leave_balances?.casual ?? 0}
                </p>
                <span className="text-[10px] text-[#78756F]">days</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#D8D4CC]/60 flex items-center justify-between">
            <span className="text-[11px] text-[#78756F]">Need time off?</span>
            <button
              onClick={() => navigate('/employee/leave')}
              className="text-xs font-semibold text-[#46513F] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Apply Leave <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Assigned Shift Card */}
        <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#78756F]">
                Assigned Shift
              </span>
              <Briefcase className="w-4 h-4 text-[#46513F]" />
            </div>

            {data.upcoming_shift ? (
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-[#F7F5F0] border border-[#D8D4CC]">
                  <p className="text-sm font-bold text-[#242321]">{data.upcoming_shift.name} Shift</p>
                  <p className="text-xs text-[#78756F] mt-1">
                    {data.upcoming_shift.start_time} - {data.upcoming_shift.end_time} ({data.upcoming_shift.duration_hours} hrs)
                  </p>
                </div>
                <div className="text-[11px] text-[#78756F] flex justify-between px-1">
                  <span>Month Overtime:</span>
                  <span className="font-semibold text-[#242321]">{data.overtime_hours_this_month} hrs</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#78756F] py-4">Standard 09:00 - 17:00 General Shift</p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#D8D4CC]/60 flex items-center justify-between">
            <span className="text-[11px] text-[#78756F]">View schedule</span>
            <button
              onClick={() => navigate('/employee/shifts')}
              className="text-xs font-semibold text-[#46513F] hover:underline flex items-center gap-1 cursor-pointer"
            >
              My Shifts <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Personal Attendance Trend Line Chart */}
      <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#242321]">Recent Hours & Attendance Trend</h3>
            <p className="text-[11px] text-[#78756F]">Personal daily working hours recorded</p>
          </div>
          <CalendarCheck className="w-4 h-4 text-[#71806B]" />
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data.personal_attendance_trend || []}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
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
              <Line
                type="monotone"
                dataKey="hours"
                stroke="#46513F"
                strokeWidth={2.5}
                name="Hours Worked"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Recent Leave Requests Table */}
      <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#242321]">Recent Leave Requests</h3>
            <p className="text-[11px] text-[#78756F]">Status of recent submissions to your manager</p>
          </div>
          <button
            onClick={() => navigate('/employee/leave')}
            className="text-xs font-semibold text-[#46513F] hover:underline cursor-pointer"
          >
            All Requests
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#D8D4CC] text-[#78756F]">
                <th className="pb-2 font-semibold">Type</th>
                <th className="pb-2 font-semibold">Start Date</th>
                <th className="pb-2 font-semibold">End Date</th>
                <th className="pb-2 font-semibold">Days</th>
                <th className="pb-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8D4CC]/50">
              {data.recent_leave_requests?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[#78756F]">
                    No recent leave requests found.
                  </td>
                </tr>
              ) : (
                data.recent_leave_requests.map((req) => (
                  <tr key={req.request_id} className="hover:bg-[#EAE6DE]/20">
                    <td className="py-2.5 font-medium text-[#242321] capitalize">
                      {req.leave_type}
                    </td>
                    <td className="py-2.5 text-[#78756F]">{req.start_date}</td>
                    <td className="py-2.5 text-[#78756F]">{req.end_date}</td>
                    <td className="py-2.5 text-[#242321] font-semibold">{req.days_count}</td>
                    <td className="py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          req.status === 'APPROVED'
                            ? 'bg-[#71806B]/15 text-[#46513F]'
                            : req.status === 'REJECTED'
                            ? 'bg-[#C8755A]/15 text-[#C8755A]'
                            : req.status === 'CANCELLED'
                            ? 'bg-[#78756F]/15 text-[#78756F]'
                            : 'bg-[#C99A52]/15 text-[#C99A52]'
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
