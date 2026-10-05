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
        notes,
      });
      setShowSubmitModal(false);
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
          <h2 className="text-2xl font-bold tracking-tight text-[#242321]">
            Weekly Timesheets
          </h2>
          <p className="text-xs text-[#78756F] mt-1">
            {role === 'EMPLOYEE'
              ? 'Log and review weekly operational working hours and manager approvals'
              : 'Review, approve, and verify submitted direct report working hours'}
          </p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#46513F] text-white text-xs font-bold rounded-lg hover:bg-[#46513F]/90 transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Timesheet</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[#C8755A]/10 border border-[#C8755A]/30 flex items-center justify-between text-xs text-[#C8755A]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchTimesheets}
            className="px-3 py-1 bg-[#46513F] text-white text-xs font-bold rounded-lg hover:bg-[#46513F]/90 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {notification && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
            notification.type === 'success'
              ? 'bg-[#71806B]/15 border-[#71806B]/30 text-[#46513F]'
              : 'bg-[#C8755A]/15 border-[#C8755A]/30 text-[#C8755A]'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Pending Approvals Table (Manager / HR only) */}
      {role !== 'EMPLOYEE' && (
        <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#D8D4CC] bg-[#F7F5F0]/60 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#242321]">
                Pending Timesheet Reviews ({pendingTimesheets.length})
              </h3>
              <p className="text-[11px] text-[#78756F]">Awaiting verification for payroll generation</p>
            </div>
            <Clock className="w-4 h-4 text-[#C99A52]" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#D8D4CC] text-[#78756F]">
                  <th className="py-3 px-4 font-semibold">Employee</th>
                  <th className="py-3 px-4 font-semibold">Department</th>
                  <th className="py-3 px-4 font-semibold">Week Start</th>
                  <th className="py-3 px-4 font-semibold">Total Hours</th>
                  <th className="py-3 px-4 font-semibold">Notes</th>
                  <th className="py-3 px-4 font-semibold text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8D4CC]/50">
                {pendingTimesheets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#78756F]">
                      No pending timesheets requiring review.
                    </td>
                  </tr>
                ) : (
                  pendingTimesheets.map((ts) => (
                    <tr key={ts.timesheet_id} className="hover:bg-[#EAE6DE]/20">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-[#242321]">{ts.employee_name}</span>
                        <span className="block text-[10px] text-[#78756F] font-mono">{ts.employee_id}</span>
                      </td>
                      <td className="py-3 px-4 text-[#78756F]">{ts.department}</td>
                      <td className="py-3 px-4 text-[#242321]">{ts.week_start_date}</td>
                      <td className="py-3 px-4 font-bold text-[#46513F]">{ts.total_hours} hrs</td>
                      <td className="py-3 px-4 text-[#78756F] max-w-xs truncate">{ts.notes || '—'}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleApprove(ts.timesheet_id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#46513F] text-white text-[11px] font-semibold hover:bg-[#46513F]/90 cursor-pointer"
                          >
                            <Check className="w-3 h-3" /> Approve
                          </button>
                          <button
                            onClick={() => setRejectTarget(ts)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#C8755A]/40 text-[#C8755A] text-[11px] font-semibold hover:bg-[#C8755A]/10 cursor-pointer"
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
      <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#D8D4CC] bg-[#F7F5F0]/60">
          <h3 className="text-sm font-bold text-[#242321]">
            {role === 'EMPLOYEE' ? 'My Timesheet History' : 'All Logged Timesheets'}
          </h3>
          <p className="text-[11px] text-[#78756F]">Historical record of submitted weekly hours</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#D8D4CC] text-[#78756F]">
                {role !== 'EMPLOYEE' && <th className="py-3 px-4 font-semibold">Employee</th>}
                <th className="py-3 px-4 font-semibold">Week Start Date</th>
                <th className="py-3 px-4 font-semibold">Logged Hours</th>
                <th className="py-3 px-4 font-semibold">Submission Date</th>
                <th className="py-3 px-4 font-semibold">Reviewer Notes</th>
                <th className="py-3 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8D4CC]/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#78756F]">
                    Loading timesheets...
                  </td>
                </tr>
              ) : (role === 'EMPLOYEE' ? myTimesheets : allTimesheets).length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#78756F]">
                    No timesheets recorded.
                  </td>
                </tr>
              ) : (
                (role === 'EMPLOYEE' ? myTimesheets : allTimesheets).map((ts) => (
                  <tr key={ts.timesheet_id} className="hover:bg-[#EAE6DE]/20">
                    {role !== 'EMPLOYEE' && (
                      <td className="py-3 px-4">
                        <span className="font-semibold text-[#242321]">{ts.employee_name}</span>
                        <span className="block text-[10px] text-[#78756F] font-mono">{ts.employee_id}</span>
                      </td>
                    )}
                    <td className="py-3 px-4 font-medium text-[#242321]">{ts.week_start_date}</td>
                    <td className="py-3 px-4 font-bold text-[#242321]">{ts.total_hours} hrs</td>
                    <td className="py-3 px-4 text-[#78756F]">{ts.created_at?.split('T')[0]}</td>
                    <td className="py-3 px-4 text-[#78756F] max-w-xs truncate">
                      {ts.manager_comments || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ts.status === 'APPROVED'
                            ? 'bg-[#71806B]/15 text-[#46513F]'
                            : ts.status === 'REJECTED'
                            ? 'bg-[#C8755A]/15 text-[#C8755A]'
                            : 'bg-[#C99A52]/15 text-[#C99A52]'
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#D8D4CC]">
              <h3 className="text-base font-bold text-[#242321]">Log Weekly Timesheet</h3>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="p-1 rounded-lg text-[#78756F] hover:bg-[#EAE6DE] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTimesheet} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-[#242321]">Week Starting (Monday) *</label>
                <input
                  type="date"
                  required
                  value={weekStart}
                  onChange={(e) => setWeekStart(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D8D4CC] rounded-lg bg-[#FFFDF9] outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2 text-[#242321]">Daily Hours Allocation</label>
                <div className="grid grid-cols-5 gap-2 text-center">
                  <div>
                    <span className="text-[10px] text-[#78756F] font-bold block mb-1">Mon</span>
                    <input
                      type="number"
                      min={0}
                      max={24}
                      step={0.5}
                      value={monHours}
                      onChange={(e) => setMonHours(Number(e.target.value))}
                      className="w-full text-center px-1 py-1.5 border border-[#D8D4CC] rounded-lg bg-[#FFFDF9]"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#78756F] font-bold block mb-1">Tue</span>
                    <input
                      type="number"
                      min={0}
                      max={24}
                      step={0.5}
                      value={tueHours}
                      onChange={(e) => setTueHours(Number(e.target.value))}
                      className="w-full text-center px-1 py-1.5 border border-[#D8D4CC] rounded-lg bg-[#FFFDF9]"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#78756F] font-bold block mb-1">Wed</span>
                    <input
                      type="number"
                      min={0}
                      max={24}
                      step={0.5}
                      value={wedHours}
                      onChange={(e) => setWedHours(Number(e.target.value))}
                      className="w-full text-center px-1 py-1.5 border border-[#D8D4CC] rounded-lg bg-[#FFFDF9]"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#78756F] font-bold block mb-1">Thu</span>
                    <input
                      type="number"
                      min={0}
                      max={24}
                      step={0.5}
                      value={thuHours}
                      onChange={(e) => setThuHours(Number(e.target.value))}
                      className="w-full text-center px-1 py-1.5 border border-[#D8D4CC] rounded-lg bg-[#FFFDF9]"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#78756F] font-bold block mb-1">Fri</span>
                    <input
                      type="number"
                      min={0}
                      max={24}
                      step={0.5}
                      value={friHours}
                      onChange={(e) => setFriHours(Number(e.target.value))}
                      className="w-full text-center px-1 py-1.5 border border-[#D8D4CC] rounded-lg bg-[#FFFDF9]"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#F7F5F0] rounded-xl flex items-center justify-between border border-[#D8D4CC]">
                <span className="font-semibold text-[#242321]">Total Logged Hours:</span>
                <span className="font-mono font-extrabold text-sm text-[#46513F]">
                  {totalCalculatedHours} Hours
                </span>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#242321]">Optional Project / Task Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Summary of deliverables..."
                  className="w-full px-3 py-2 border border-[#D8D4CC] rounded-lg bg-[#FFFDF9] outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#D8D4CC] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 border border-[#D8D4CC] rounded-lg font-semibold hover:bg-[#EAE6DE] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-[#46513F] text-white rounded-lg font-bold hover:bg-[#46513F]/90 cursor-pointer disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className="font-bold text-sm text-[#242321] mb-1">
              Reject Timesheet: {rejectTarget.employee_name}
            </h3>
            <p className="text-xs text-[#78756F] mb-3">
              State the reason for rejecting {rejectTarget.total_hours} logged hours.
            </p>

            <textarea
              rows={3}
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Overlapping unapproved overtime, discrepancy in hours..."
              className="w-full px-3 py-2 text-xs border border-[#D8D4CC] rounded-lg bg-[#FFFDF9] outline-none"
            />

            <div className="mt-4 pt-3 border-t border-[#D8D4CC] flex justify-end gap-2">
              <button
                onClick={() => setRejectTarget(null)}
                className="px-3 py-1.5 text-xs text-[#78756F] hover:text-[#242321] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="px-3.5 py-1.5 bg-[#C8755A] text-white text-xs font-bold rounded-lg hover:bg-[#C8755A]/90 disabled:opacity-40 cursor-pointer"
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
