import React, { useState, useEffect } from 'react';
import { attendanceApi } from '../../api/attendance';
import { employeesApi } from '../../api/employees';
import { useAuth } from '../../context/AuthContext';
import type { AttendanceRecord, AttendanceAnomaly } from '../../types/api';
import {
  AlertTriangle,
  LogIn,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const { role } = useAuth();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [anomalies, setAnomalies] = useState<AttendanceAnomaly[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [department, setDepartment] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [departmentsList, setDepartmentsList] = useState<string[]>([
    'Engineering',
    'Data Science',
    'Finance',
    'Marketing',
    'Human Resources',
    'Operations',
    'Sales',
    'IT',
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'records' | 'anomalies'>('records');

  // Employee action states
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      if (role === 'EMPLOYEE') {
        const res = await attendanceApi.getMyAttendance({
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          page,
          page_size: pageSize,
        });
        setRecords(res.items || []);
        setTotal(res.total || 0);
        setTotalPages(res.total_pages || 1);
      } else {
        const res = await attendanceApi.listAttendance({
          department: department || undefined,
          status: statusFilter || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          page,
          page_size: pageSize,
        });
        setRecords(res.items || []);
        setTotal(res.total || 0);
        setTotalPages(res.total_pages || 1);

        // Also fetch anomalies for HR / Manager
        const anom = await attendanceApi.getAnomalies(15);
        setAnomalies(anom || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch attendance:', err);
      setError('Unable to load attendance and time tracking records from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [page, department, statusFilter, dateFrom, dateTo]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      await attendanceApi.checkIn();
      setMessage('Check-in logged successfully.');
      fetchAttendance();
    } catch (err: any) {
      setMessage(err.response?.data?.detail || 'Check-in failed. Already checked in today.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      await attendanceApi.checkOut();
      setMessage('Check-out logged successfully.');
      fetchAttendance();
    } catch (err: any) {
      setMessage(err.response?.data?.detail || 'Check-out failed. No active check-in found.');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    employeesApi.getDepartments().then((depts) => {
      if (depts && depts.length > 0) {
        setDepartmentsList(depts);
      }
    }).catch((err) => {
      console.warn('Failed to load dynamic departments for attendance:', err);
    });
  }, []);

  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return '—';
    if (!timeStr.includes('T') && !timeStr.includes('-')) return timeStr;
    try {
      if (timeStr.includes('T')) {
        const timePart = timeStr.split('T')[1];
        const clean = timePart.split('.')[0].replace('Z', '').split('+')[0];
        const [h, m] = clean.split(':');
        if (h !== undefined && m !== undefined) {
          const hour = parseInt(h, 10);
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const hour12 = hour % 12 || 12;
          return `${hour12.toString().padStart(2, '0')}:${m} ${ampm}`;
        }
      }
      const d = new Date(timeStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      }
      return timeStr;
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#172033]">
            Attendance & Time Tracking
          </h2>
          <p className="text-xs text-[#64748B] mt-1">
            {role === 'EMPLOYEE'
              ? 'View personal clock-in records, working hours, and overtime logs'
              : 'Monitor real-time employee presence, late arrivals, and rule-based anomalies'}
          </p>
        </div>

        {/* Employee Check-In / Out Quick Actions */}
        {role === 'EMPLOYEE' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCheckIn}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-lg hover:bg-[#1D4ED8] disabled:opacity-50 cursor-pointer shadow-sm shadow-blue-500/20"
            >
              <LogIn className="w-4 h-4" />
              <span>Clock In</span>
            </button>
            <button
              onClick={handleCheckOut}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-[#E2E8F0] bg-white text-[#172033] text-xs font-bold hover:bg-[#F1F5F9] disabled:opacity-50 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Clock Out</span>
            </button>
          </div>
        )}
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-[#16A34A] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between text-xs text-[#DC2626]">
          <span>{error}</span>
          <button
            onClick={fetchAttendance}
            className="px-3 py-1 bg-[#2563EB] text-white text-xs font-bold rounded-lg hover:bg-[#1D4ED8] cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Attendance Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">Present</span>
          <p className="text-xl font-extrabold text-[#16A34A] mt-1">
            {records.filter((r) => ['Present', 'Late', 'Half Day'].includes(r.status)).length}
          </p>
          <span className="text-[10px] text-[#64748B]">Active in records</span>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">Late Arrivals</span>
          <p className="text-xl font-extrabold text-[#D97706] mt-1">
            {records.filter((r) => r.status === 'Late').length}
          </p>
          <span className="text-[10px] text-[#64748B]">After shift start</span>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">Absent</span>
          <p className="text-xl font-extrabold text-[#DC2626] mt-1">
            {records.filter((r) => r.status === 'Absent').length}
          </p>
          <span className="text-[10px] text-[#64748B]">Unplanned absence</span>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">On Leave</span>
          <p className="text-xl font-extrabold text-[#2563EB] mt-1">
            {records.filter((r) => r.status === 'On Leave').length}
          </p>
          <span className="text-[10px] text-[#64748B]">Approved leaves</span>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">Total Overtime</span>
          <p className="text-xl font-extrabold text-[#172033] mt-1">
            {Math.round(records.reduce((acc, r) => acc + (r.overtime_hours || 0), 0) * 10) / 10} <span className="text-xs font-normal text-[#64748B]">hrs</span>
          </p>
          <span className="text-[10px] text-[#64748B]">Cumulative hours</span>
        </div>
      </div>

      {/* Tabs for HR / Manager (Records vs Anomalies) */}
      {role !== 'EMPLOYEE' && (
        <div className="flex border-b border-[#E2E8F0] gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('records')}
            className={`pb-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'records'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-[#64748B] hover:text-[#172033]'
            }`}
          >
            Attendance Logs ({total})
          </button>
          <button
            onClick={() => setActiveTab('anomalies')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'anomalies'
                ? 'border-[#DC2626] text-[#DC2626]'
                : 'border-transparent text-[#64748B] hover:text-[#172033]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Detected Anomalies ({anomalies.length})</span>
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      {activeTab === 'records' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs flex flex-wrap items-center gap-3">
          {role !== 'EMPLOYEE' && (
            <select
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#172033] outline-none focus:border-[#2563EB]"
            >
              <option value="">All Departments</option>
              {departmentsList.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#172033] outline-none focus:border-[#2563EB]"
          >
            <option value="">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Late">Late</option>
            <option value="Absent">Absent</option>
            <option value="On Leave">On Leave</option>
          </select>

          <div className="flex items-center gap-1 text-xs text-[#64748B]">
            <span>From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] text-xs outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="flex items-center gap-1 text-xs text-[#64748B]">
            <span>To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] text-xs outline-none focus:border-[#2563EB]"
            />
          </div>

          {(department || statusFilter || dateFrom || dateTo) && (
            <button
              onClick={() => {
                setDepartment('');
                setStatusFilter('');
                setDateFrom('');
                setDateTo('');
                setPage(1);
              }}
              className="text-xs text-[#DC2626] hover:underline font-semibold cursor-pointer ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Main Records Table */}
      {activeTab === 'records' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B]">
                  <th className="py-3.5 px-4 font-semibold">Date</th>
                  {role !== 'EMPLOYEE' && (
                    <>
                      <th className="py-3.5 px-4 font-semibold">Employee</th>
                      <th className="py-3.5 px-4 font-semibold">Department</th>
                    </>
                  )}
                  <th className="py-3.5 px-4 font-semibold">Check In</th>
                  <th className="py-3.5 px-4 font-semibold">Check Out</th>
                  <th className="py-3.5 px-4 font-semibold">Working Hours</th>
                  <th className="py-3.5 px-4 font-semibold">Overtime</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]/80">
                {loading ? (
                  <tr>
                    <td colSpan={role !== 'EMPLOYEE' ? 8 : 6} className="py-12 text-center text-[#64748B]">
                      <div className="w-6 h-6 border-2 border-[#E2E8F0] border-t-[#2563EB] rounded-full animate-spin mx-auto mb-2"></div>
                      Loading attendance records...
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={role !== 'EMPLOYEE' ? 8 : 6} className="py-12 text-center text-[#64748B]">
                      No attendance logs recorded for selected period.
                    </td>
                  </tr>
                ) : (
                  records.map((rec) => (
                    <tr key={rec.attendance_id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3.5 px-4 font-medium text-[#172033]">{rec.date}</td>
                      {role !== 'EMPLOYEE' && (
                        <>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-[#172033]">{rec.employee_name}</span>
                            <span className="block text-[10px] text-[#64748B] font-mono">{rec.employee_id}</span>
                          </td>
                          <td className="py-3.5 px-4 text-[#64748B] font-medium">{rec.department}</td>
                        </>
                      )}
                      <td className="py-3.5 px-4 text-[#172033] font-mono font-medium">{formatTime(rec.check_in || rec.check_in_time)}</td>
                      <td className="py-3.5 px-4 text-[#172033] font-mono font-medium">
                        {(rec.check_out || rec.check_out_time)
                          ? formatTime(rec.check_out || rec.check_out_time)
                          : (rec.check_in || rec.check_in_time)
                          ? <span className="text-[11px] font-semibold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">Checkout Pending</span>
                          : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#172033]">
                        {(rec.check_out || rec.check_out_time)
                          ? `${(rec.working_hours ?? 0).toFixed(1)} hrs`
                          : (rec.check_in || rec.check_in_time)
                          ? <span className="text-[11px] font-medium text-[#64748B]">In Progress</span>
                          : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        {(rec.overtime_hours && rec.overtime_hours > 0) ? (
                          <span className="font-semibold text-[#D97706]">+{rec.overtime_hours.toFixed(1)} hrs</span>
                        ) : (
                          <span className="text-[#64748B]">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            rec.status === 'Present'
                              ? 'bg-emerald-50 text-[#16A34A] border-emerald-200'
                              : rec.status === 'Late'
                              ? 'bg-amber-50 text-[#D97706] border-amber-200'
                              : rec.status === 'Absent'
                              ? 'bg-red-50 text-[#DC2626] border-red-200'
                              : 'bg-blue-50 text-[#2563EB] border-blue-200'
                          }`}
                        >
                          ● {rec.status} {rec.status === 'Late' && rec.late_minutes ? `(+${rec.late_minutes}m)` : ''}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-3.5 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between text-xs text-[#64748B]">
            <span>
              Page {page} of {totalPages} ({total} entries)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-[#E2E8F0] bg-white disabled:opacity-40 hover:bg-[#F1F5F9] cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-[#E2E8F0] bg-white disabled:opacity-40 hover:bg-[#F1F5F9] cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Anomalies Table */}
      {activeTab === 'anomalies' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <h3 className="font-bold text-xs text-[#172033] uppercase tracking-wider">
              Rule-Based Anomaly Audit Log
            </h3>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Flagged chronic tardiness, severe overtime spikes, and abnormal short durations
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B]">
                  <th className="py-3.5 px-4 font-semibold">Severity</th>
                  <th className="py-3.5 px-4 font-semibold">Employee</th>
                  <th className="py-3.5 px-4 font-semibold">Department</th>
                  <th className="py-3.5 px-4 font-semibold">Date</th>
                  <th className="py-3.5 px-4 font-semibold">Type</th>
                  <th className="py-3.5 px-4 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]/80">
                {anomalies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#64748B]">
                      No attendance anomalies currently flagged.
                    </td>
                  </tr>
                ) : (
                  anomalies.map((a) => (
                    <tr key={a.anomaly_id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            a.severity === 'high'
                              ? 'bg-red-50 text-[#DC2626] border-red-200'
                              : a.severity === 'medium'
                              ? 'bg-amber-50 text-[#D97706] border-amber-200'
                              : 'bg-slate-100 text-[#64748B] border-slate-200'
                          }`}
                        >
                          {a.severity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#172033]">
                        {a.employee_name}
                      </td>
                      <td className="py-3.5 px-4 text-[#64748B]">{a.department}</td>
                      <td className="py-3.5 px-4 text-[#64748B]">{a.date}</td>
                      <td className="py-3.5 px-4 font-medium text-[#172033]">{a.type}</td>
                      <td className="py-3.5 px-4 text-[#64748B]">{a.description}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
