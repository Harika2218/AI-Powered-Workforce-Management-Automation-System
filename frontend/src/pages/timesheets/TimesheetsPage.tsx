import React, { useState, useEffect } from 'react';
import { timesheetsApi } from '../../api/timesheets';
import { useAuth } from '../../context/AuthContext';
import type { TimesheetRecord } from '../../types/api';
import {
  Plus,
  CheckCircle,
  Clock,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';

export const TimesheetsPage: React.FC = () => {
  const { role } = useAuth();

  const [myTimesheets, setMyTimesheets] = useState<TimesheetRecord[]>([]);
  const [pendingTimesheets, setPendingTimesheets] = useState<TimesheetRecord[]>([]);
  const [allTimesheets, setAllTimesheets] = useState<TimesheetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<TimesheetRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Submission Form State (Monday to Friday)
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const mon = new Date(d.setDate(diff));
    return mon.toISOString().split('T')[0];
  });
  const [monHours, setMonHours] = useState<number>(8);
  const [tueHours, setTueHours] = useState<number>(8);
  const [wedHours, setWedHours] = useState<number>(8);
  const [thuHours, setThuHours] = useState<number>(8);
  const [friHours, setFriHours] = useState<number>(8);
  const [workStartNotes, setWorkStartNotes] = useState('');
  const [notes, setNotes] = useState('');

  const fetchTimesheets = async () => {
    try {
      setLoading(true);
      setError(null);
      if (role === 'EMPLOYEE') {
        const res = await timesheetsApi.getMyTimesheets();
        setMyTimesheets(res.items || []);
      } else {
        const [pend, all] = await Promise.all([
          timesheetsApi.getPendingTimesheets(),
          timesheetsApi.listTimesheets({ page_size: 100 }),
        ]);
        setPendingTimesheets(pend.items || []);
        setAllTimesheets(all.items || []);
      }
    } catch (err: any) {
      console.error('Error fetching timesheets:', err);
      setError('Unable to load timesheet records from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimesheets();
  }, []);

  const totalCalculatedHours =
    Number(monHours) + Number(tueHours) + Number(wedHours) + Number(thuHours) + Number(friHours);

  const handleSubmitTimesheet = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setNotification(null);

    const daily = {
      Monday: Number(monHours),
      Tuesday: Number(tueHours),
      Wednesday: Number(wedHours),
      Thursday: Number(thuHours),
      Friday: Number(friHours),
    };

    try {
      await timesheetsApi.submitTimesheet({
        week_start_date: weekStart,
        daily_hours: daily,
        work_start_notes: workStartNotes,
        notes,
      });
      setShowSubmitModal(false);
      setWorkStartNotes('');
      setNotes('');
      setNotification({ text: 'Weekly timesheet submitted successfully!', type: 'success' });
      fetchTimesheets();
    } catch (err: any) {
      setNotification({
        text: err.response?.data?.detail || 'Failed to submit timesheet.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await timesheetsApi.approveTimesheet(id, 'Approved');
      setNotification({ text: 'Timesheet approved.', type: 'success' });
      fetchTimesheets();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to approve.');
    }
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    try {
      await timesheetsApi.rejectTimesheet(rejectTarget.timesheet_id, rejectReason);
      setNotification({ text: 'Timesheet rejected.', type: 'success' });
      setRejectTarget(null);
      setRejectReason('');
      fetchTimesheets();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to reject.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#172033]">
            Weekly Timesheets
          </h2>
          <p className="text-xs text-[#64748B] mt-1">
            {role === 'EMPLOYEE'
              ? 'Log and review weekly operational working hours and manager approvals'
              : 'Review, approve, and verify submitted direct report working hours'}
          </p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-lg hover:bg-[#1D4ED8] transition-colors shadow-sm shadow-blue-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Timesheet</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between text-xs text-[#DC2626]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchTimesheets}
            className="px-3 py-1 bg-[#2563EB] text-white text-xs font-bold rounded-lg hover:bg-[#1D4ED8] cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {notification && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-[#16A34A]'
              : 'bg-red-50 border-red-200 text-[#DC2626]'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0 text-[#16A34A]" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Pending Approvals Table (Manager / HR only) */}
      {role !== 'EMPLOYEE' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#172033]">
                Pending Timesheet Reviews ({pendingTimesheets.length})
              </h3>
              <p className="text-[11px] text-[#64748B]">Awaiting verification for payroll generation</p>
            </div>
            <Clock className="w-4 h-4 text-[#D97706]" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B]">
                  <th className="py-3.5 px-4 font-semibold">Employee</th>
                  <th className="py-3.5 px-4 font-semibold">Department</th>
                  <th className="py-3.5 px-4 font-semibold">Week Start</th>
                  <th className="py-3.5 px-4 font-semibold">Total Hours</th>
                  <th className="py-3.5 px-4 font-semibold">Work Information & Notes</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]/80">
                {pendingTimesheets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#64748B]">
                      No pending timesheets requiring review.
                    </td>
                  </tr>
                ) : (
                  pendingTimesheets.map((ts) => (
                    <tr key={ts.timesheet_id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[#172033]">{ts.employee_name}</span>
                        <span className="block text-[10px] text-[#64748B] font-mono">{ts.employee_id}</span>
                      </td>
                      <td className="py-3.5 px-4 text-[#64748B] font-medium">{ts.department}</td>
                      <td className="py-3.5 px-4 text-[#172033]">{ts.week_start_date}</td>
                      <td className="py-3.5 px-4 font-bold text-[#2563EB]">{ts.total_hours ?? (ts as any).hours_worked} hrs</td>
                      <td className="py-3.5 px-4 text-[#64748B] max-w-xs">
                        <span className="font-semibold text-[#172033] block truncate">{ts.task_name || ts.project_name || 'Operational Tasks'}</span>
                        {ts.work_start_notes && (
                          <span className="text-[10px] text-[#16A34A] block truncate font-medium">Start: {ts.work_start_notes}</span>
                        )}
                        <span className="text-[10px] text-[#64748B] block truncate">{ts.description || ts.notes || '—'}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleApprove(ts.timesheet_id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#16A34A] text-white text-[11px] font-semibold hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs"
                          >
                            <Check className="w-3 h-3" /> Approve
                          </button>
                          <button
                            onClick={() => setRejectTarget(ts)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-red-200 text-[#DC2626] text-[11px] font-semibold hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <X className="w-3 h-3" /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Records Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <h3 className="text-sm font-bold text-[#172033]">
            {role === 'EMPLOYEE' ? 'My Timesheet History' : 'All Logged Timesheets'}
          </h3>
          <p className="text-[11px] text-[#64748B]">Historical record of submitted weekly hours</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B]">
                {role !== 'EMPLOYEE' && <th className="py-3.5 px-4 font-semibold">Employee</th>}
                <th className="py-3.5 px-4 font-semibold">Week Start Date</th>
                <th className="py-3.5 px-4 font-semibold">Work Information</th>
                <th className="py-3.5 px-4 font-semibold">Logged Hours</th>
                <th className="py-3.5 px-4 font-semibold">Submission Date</th>
                <th className="py-3.5 px-4 font-semibold">Reviewer Notes</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]/80">
              {loading ? (
                <tr>
                  <td colSpan={role !== 'EMPLOYEE' ? 7 : 6} className="py-8 text-center text-[#64748B]">
                    Loading timesheets...
                  </td>
                </tr>
              ) : (role === 'EMPLOYEE' ? myTimesheets : allTimesheets).length === 0 ? (
                <tr>
                  <td colSpan={role !== 'EMPLOYEE' ? 7 : 6} className="py-8 text-center text-[#64748B]">
                    No timesheets recorded.
                  </td>
                </tr>
              ) : (
                (role === 'EMPLOYEE' ? myTimesheets : allTimesheets).map((ts) => (
                  <tr key={ts.timesheet_id} className="hover:bg-[#F8FAFC] transition-colors">
                    {role !== 'EMPLOYEE' && (
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[#172033]">{ts.employee_name}</span>
                        <span className="block text-[10px] text-[#64748B] font-mono">{ts.employee_id}</span>
                      </td>
                    )}
                    <td className="py-3.5 px-4 font-medium text-[#172033]">{ts.week_start_date}</td>
                    <td className="py-3.5 px-4 text-[#64748B] max-w-xs">
                      <span className="font-semibold text-[#172033] block truncate">{ts.task_name || ts.project_name || 'Operational Work'}</span>
                      {ts.work_start_notes && (
                        <span className="text-[10px] text-[#16A34A] block truncate font-medium">Start: {ts.work_start_notes}</span>
                      )}
                      <span className="text-[10px] text-[#64748B] block truncate">{ts.description || ts.notes || '—'}</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#172033]">{ts.total_hours ?? (ts as any).hours_worked} hrs</td>
                    <td className="py-3.5 px-4 text-[#64748B]">{ts.created_at?.split('T')[0] || (ts as any).date}</td>
                    <td className="py-3.5 px-4 text-[#64748B] max-w-xs truncate">
                      {ts.manager_comments || (ts as any).comments || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          ts.status?.toUpperCase() === 'APPROVED'
                            ? 'bg-emerald-50 text-[#16A34A] border-emerald-200'
                            : ts.status?.toUpperCase() === 'REJECTED'
                            ? 'bg-red-50 text-[#DC2626] border-red-200'
                            : 'bg-amber-50 text-[#D97706] border-amber-200'
                        }`}
                      >
                        {ts.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit Timesheet Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h3 className="text-base font-bold text-[#172033]">Log Weekly Timesheet</h3>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="p-1 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#172033] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTimesheet} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-[#172033]">Week Starting (Monday) *</label>
                <input
                  type="date"
                  required
                  value={weekStart}
                  onChange={(e) => setWeekStart(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2 text-[#172033]">Daily Hours Allocation</label>
                <div className="grid grid-cols-5 gap-2 text-center">
                  <div>
                    <span className="text-[10px] text-[#64748B] font-bold block mb-1">Mon</span>
                    <input
                      type="number"
                      min={0}
                      max={24}
                      step={0.5}
                      value={monHours}
                      onChange={(e) => setMonHours(Number(e.target.value))}
                      className="w-full text-center px-1 py-1.5 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] focus:border-[#2563EB]"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] font-bold block mb-1">Tue</span>
                    <input
                      type="number"
                      min={0}
                      max={24}
                      step={0.5}
                      value={tueHours}
                      onChange={(e) => setTueHours(Number(e.target.value))}
                      className="w-full text-center px-1 py-1.5 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] focus:border-[#2563EB]"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] font-bold block mb-1">Wed</span>
                    <input
                      type="number"
                      min={0}
                      max={24}
                      step={0.5}
                      value={wedHours}
                      onChange={(e) => setWedHours(Number(e.target.value))}
                      className="w-full text-center px-1 py-1.5 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] focus:border-[#2563EB]"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] font-bold block mb-1">Thu</span>
                    <input
                      type="number"
                      min={0}
                      max={24}
                      step={0.5}
                      value={thuHours}
                      onChange={(e) => setThuHours(Number(e.target.value))}
                      className="w-full text-center px-1 py-1.5 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] focus:border-[#2563EB]"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] font-bold block mb-1">Fri</span>
                    <input
                      type="number"
                      min={0}
                      max={24}
                      step={0.5}
                      value={friHours}
                      onChange={(e) => setFriHours(Number(e.target.value))}
                      className="w-full text-center px-1 py-1.5 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] focus:border-[#2563EB]"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-xl flex items-center justify-between border border-[#E2E8F0]">
                <span className="font-semibold text-[#172033]">Total Logged Hours:</span>
                <span className="font-mono font-extrabold text-sm text-[#2563EB]">
                  {totalCalculatedHours} Hours
                </span>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#172033]">Work-Start Notes / Initial Activity</label>
                <input
                  type="text"
                  value={workStartNotes}
                  onChange={(e) => setWorkStartNotes(e.target.value)}
                  placeholder="e.g. 09:00 AM - Sprint standup & deliverable planning"
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#172033]">Project / Task Work Description</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Summary of deliverables..."
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-lg font-semibold hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#172033] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-[#2563EB] text-white rounded-lg font-bold hover:bg-[#1D4ED8] cursor-pointer disabled:opacity-50 shadow-sm shadow-blue-500/20"
                >
                  {actionLoading ? 'Submitting...' : 'Submit for Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Timesheet Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className="font-bold text-sm text-[#172033] mb-1">
              Reject Timesheet: {rejectTarget.employee_name}
            </h3>
            <p className="text-xs text-[#64748B] mb-3">
              State the reason for rejecting {rejectTarget.total_hours} logged hours.
            </p>

            <textarea
              rows={3}
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Overlapping unapproved overtime, discrepancy in hours..."
              className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#172033] outline-none focus:border-[#2563EB]"
            />

            <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
              <button
                onClick={() => setRejectTarget(null)}
                className="px-3 py-1.5 text-xs text-[#64748B] hover:text-[#172033] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="px-3.5 py-1.5 bg-[#DC2626] text-white text-xs font-bold rounded-lg hover:bg-red-700 disabled:opacity-40 cursor-pointer shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
