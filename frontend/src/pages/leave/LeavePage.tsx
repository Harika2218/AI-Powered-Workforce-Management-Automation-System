import React, { useState, useEffect } from 'react';
import { leaveApi } from '../../api/leave';
import { useAuth } from '../../context/AuthContext';
import type { LeaveRecord } from '../../types/api';
import {
  CalendarDays,
  CheckCircle,
  Plus,
  Clock,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';

export const LeavePage: React.FC = () => {
  const { role, user } = useAuth();

  const [myLeaves, setMyLeaves] = useState<LeaveRecord[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRecord[]>([]);
  const [allLeaves, setAllLeaves] = useState<LeaveRecord[]>([]);
  const [balances, setBalances] = useState<{ annual: number; sick: number; casual: number }>({
    annual: 0,
    sick: 0,
    casual: 0,
  });

  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<LeaveRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Apply Form
  const [leaveType, setLeaveType] = useState<'Annual' | 'Sick' | 'Casual'>('Annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [recordsTab, setRecordsTab] = useState<'all' | 'my'>('all');

  const fetchLeaveData = async () => {
    try {
      setLoading(true);
      // Fetch balances if employee id exists
      if (user?.employee_id) {
        try {
          const bal = await leaveApi.getBalances(user.employee_id);
          setBalances(bal);
        } catch (e) {
          console.error('Failed to load leave balances:', e);
        }
      }

      if (role === 'EMPLOYEE') {
        const myRes = await leaveApi.getMyLeave();
        setMyLeaves(myRes.items || []);
      } else {
        // Manager / HR: fetch pending approvals, organization history, and own leaves
        const [pendingRes, allRes, myRes] = await Promise.all([
          leaveApi.getPendingLeave(),
          leaveApi.listLeave(),
          leaveApi.getMyLeave(),
        ]);
        setPendingLeaves(pendingRes.items || []);
        setAllLeaves(allRes.items || []);
        setMyLeaves(myRes.items || []);
      }
    } catch (err) {
      console.error('Failed to load leave data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveData();
  }, [user?.employee_id, role]);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setNotification(null);
    try {
      await leaveApi.applyLeave({
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason,
        employee_id: user?.employee_id || undefined,
      });
      setShowApplyModal(false);
      setNotification({ text: 'Leave request submitted successfully for approval.', type: 'success' });
      setStartDate('');
      setEndDate('');
      setReason('');
      fetchLeaveData();
    } catch (err: any) {
      console.error('Apply leave error:', err);
      const detail = err.response?.data?.detail;
      const errorMsg = Array.isArray(detail)
        ? detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ')
        : typeof detail === 'string'
        ? detail
        : 'Failed to submit leave. Check leave balance or dates.';
      setNotification({
        text: errorMsg,
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await leaveApi.approveLeave(id, 'Approved by reviewer');
      setNotification({ text: 'Leave request approved successfully.', type: 'success' });
      fetchLeaveData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Approval failed.');
    }
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    const targetId = rejectTarget.leave_id || rejectTarget.request_id;
    if (!targetId) return;
    try {
      await leaveApi.rejectLeave(targetId, rejectReason);
      setNotification({ text: 'Leave request rejected.', type: 'success' });
      setRejectTarget(null);
      setRejectReason('');
      fetchLeaveData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Rejection failed.');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this pending leave request?')) return;
    try {
      await leaveApi.cancelLeave(id);
      setNotification({ text: 'Leave request cancelled.', type: 'success' });
      fetchLeaveData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Cancellation failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#242321]">
            Leave Management
          </h2>
          <p className="text-xs text-[#78756F] mt-1">
            {role === 'EMPLOYEE'
              ? 'Request time off, track approval status, and monitor leave balances'
              : 'Review team time-off requests, enforce balances, and manage leaves'}
          </p>
        </div>

        <button
          onClick={() => setShowApplyModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#46513F] text-white text-xs font-bold rounded-lg hover:bg-[#46513F]/90 transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Apply for Leave</span>
        </button>
      </div>

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

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#78756F]">
              Annual Leave Balance
            </span>
            <p className="text-2xl font-extrabold text-[#46513F] mt-1">{balances.annual} days</p>
          </div>
          <CalendarDays className="w-6 h-6 text-[#46513F]/40" />
        </div>

        <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#78756F]">
              Sick Leave Balance
            </span>
            <p className="text-2xl font-extrabold text-[#C99A52] mt-1">{balances.sick} days</p>
          </div>
          <CalendarDays className="w-6 h-6 text-[#C99A52]/40" />
        </div>

        <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#78756F]">
              Casual Leave Balance
            </span>
            <p className="text-2xl font-extrabold text-[#71806B] mt-1">{balances.casual} days</p>
          </div>
          <CalendarDays className="w-6 h-6 text-[#71806B]/40" />
        </div>
      </div>

      {/* Pending Approvals Table (Manager / HR only) */}
      {role !== 'EMPLOYEE' && (
        <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#D8D4CC] bg-[#F7F5F0]/60 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#242321]">
                Pending Leave Approvals ({pendingLeaves.length})
              </h3>
              <p className="text-[11px] text-[#78756F]">Requires manager / HR review</p>
            </div>
            <Clock className="w-4 h-4 text-[#C99A52]" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#D8D4CC] text-[#78756F]">
                  <th className="py-3 px-4 font-semibold">Employee</th>
                  <th className="py-3 px-4 font-semibold">Department</th>
                  <th className="py-3 px-4 font-semibold">Leave Type</th>
                  <th className="py-3 px-4 font-semibold">Duration</th>
                  <th className="py-3 px-4 font-semibold">Days</th>
                  <th className="py-3 px-4 font-semibold">Reason</th>
                  <th className="py-3 px-4 font-semibold text-right">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8D4CC]/50">
                {pendingLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#78756F]">
                      No pending leave requests requiring action.
                    </td>
                  </tr>
                ) : (
                  pendingLeaves.map((req) => {
                    const reqId = req.leave_id || req.request_id || '';
                    const days = req.days_count ?? req.total_days ?? 0;
                    return (
                      <tr key={reqId} className="hover:bg-[#EAE6DE]/20">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-[#242321]">{req.employee_name}</span>
                          <span className="block text-[10px] text-[#78756F] font-mono">{req.employee_id}</span>
                        </td>
                        <td className="py-3 px-4 text-[#78756F]">{req.department}</td>
                        <td className="py-3 px-4 capitalize font-medium text-[#242321]">{req.leave_type}</td>
                        <td className="py-3 px-4 text-[#78756F]">
                          {req.start_date} → {req.end_date}
                        </td>
                        <td className="py-3 px-4 font-bold text-[#242321]">{days}</td>
                        <td className="py-3 px-4 text-[#78756F] max-w-xs truncate">{req.reason}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleApprove(reqId)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#46513F] text-white text-[11px] font-semibold hover:bg-[#46513F]/90 cursor-pointer"
                            >
                              <Check className="w-3 h-3" /> Approve
                            </button>
                            <button
                              onClick={() => setRejectTarget(req)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#C8755A]/40 text-[#C8755A] text-[11px] font-semibold hover:bg-[#C8755A]/10 cursor-pointer"
                            >
                              <X className="w-3 h-3" /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Leave Records Table */}
      <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#D8D4CC] bg-[#F7F5F0]/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#242321]">
              {role === 'EMPLOYEE'
                ? 'My Leave Applications'
                : recordsTab === 'all'
                ? 'Organization Leave History'
                : 'My Personal Leave Applications'}
            </h3>
            <p className="text-[11px] text-[#78756F]">Comprehensive log of submitted leaves and outcomes</p>
          </div>

          {role !== 'EMPLOYEE' && (
            <div className="flex items-center gap-1 bg-[#EAE6DE]/60 p-1 rounded-lg">
              <button
                onClick={() => setRecordsTab('all')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  recordsTab === 'all'
                    ? 'bg-[#FFFDF9] text-[#242321] shadow-xs'
                    : 'text-[#78756F] hover:text-[#242321]'
                }`}
              >
                All Organization ({allLeaves.length})
              </button>
              <button
                onClick={() => setRecordsTab('my')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  recordsTab === 'my'
                    ? 'bg-[#FFFDF9] text-[#242321] shadow-xs'
                    : 'text-[#78756F] hover:text-[#242321]'
                }`}
              >
                My Requests ({myLeaves.length})
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#D8D4CC] text-[#78756F]">
                {(role !== 'EMPLOYEE' && recordsTab === 'all') && <th className="py-3 px-4 font-semibold">Employee</th>}
                <th className="py-3 px-4 font-semibold">Leave Type</th>
                <th className="py-3 px-4 font-semibold">Start Date</th>
                <th className="py-3 px-4 font-semibold">End Date</th>
                <th className="py-3 px-4 font-semibold">Days</th>
                <th className="py-3 px-4 font-semibold">Reason</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                {(role === 'EMPLOYEE' || recordsTab === 'my') && <th className="py-3 px-4 font-semibold text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8D4CC]/50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#78756F]">
                    Loading leave records...
                  </td>
                </tr>
              ) : (role === 'EMPLOYEE' || recordsTab === 'my' ? myLeaves : allLeaves).length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#78756F]">
                    No leave records found.
                  </td>
                </tr>
              ) : (
                (role === 'EMPLOYEE' || recordsTab === 'my' ? myLeaves : allLeaves).map((req) => {
                  const reqId = req.leave_id || req.request_id || '';
                  const days = req.days_count ?? req.total_days ?? 0;
                  const statusUpper = (req.status || '').toUpperCase();
                  return (
                    <tr key={reqId} className="hover:bg-[#EAE6DE]/20">
                      {(role !== 'EMPLOYEE' && recordsTab === 'all') && (
                        <td className="py-3 px-4">
                          <span className="font-semibold text-[#242321]">{req.employee_name}</span>
                          <span className="block text-[10px] text-[#78756F] font-mono">{req.employee_id}</span>
                        </td>
                      )}
                      <td className="py-3 px-4 capitalize font-semibold text-[#242321]">{req.leave_type}</td>
                      <td className="py-3 px-4 text-[#78756F]">{req.start_date}</td>
                      <td className="py-3 px-4 text-[#78756F]">{req.end_date}</td>
                      <td className="py-3 px-4 font-bold text-[#242321]">{days}</td>
                      <td className="py-3 px-4 text-[#78756F] max-w-xs truncate">{req.reason}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            statusUpper === 'APPROVED'
                              ? 'bg-[#71806B]/15 text-[#46513F]'
                              : statusUpper === 'REJECTED'
                              ? 'bg-[#C8755A]/15 text-[#C8755A]'
                              : statusUpper === 'CANCELLED'
                              ? 'bg-[#78756F]/15 text-[#78756F]'
                              : 'bg-[#C99A52]/15 text-[#C99A52]'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      {(role === 'EMPLOYEE' || recordsTab === 'my') && (
                        <td className="py-3 px-4 text-right">
                          {statusUpper === 'PENDING' && (
                            <button
                              onClick={() => handleCancel(reqId)}
                              className="text-xs text-[#C8755A] hover:underline font-semibold cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#D8D4CC]">
              <h3 className="text-base font-bold text-[#242321]">Apply for Leave</h3>
              <button
                onClick={() => setShowApplyModal(false)}
                className="p-1 rounded-lg text-[#78756F] hover:bg-[#EAE6DE] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-[#242321]">Leave Category *</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-[#D8D4CC] rounded-lg bg-[#FFFDF9] text-[#242321] outline-none"
                >
                  <option value="Annual">Annual Leave (Balance: {balances.annual} days)</option>
                  <option value="Sick">Sick Leave (Balance: {balances.sick} days)</option>
                  <option value="Casual">Casual Leave (Balance: {balances.casual} days)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-[#242321]">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D8D4CC] rounded-lg bg-[#FFFDF9] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#242321]">End Date *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D8D4CC] rounded-lg bg-[#FFFDF9] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#242321]">Reason for Time Off *</label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide context for manager review..."
                  className="w-full px-3 py-2 border border-[#D8D4CC] rounded-lg bg-[#FFFDF9] outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#D8D4CC] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 border border-[#D8D4CC] rounded-lg font-semibold hover:bg-[#EAE6DE] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-[#46513F] text-white rounded-lg font-bold hover:bg-[#46513F]/90 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Submitting...' : 'Submit Leave Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className="font-bold text-sm text-[#242321] mb-1">
              Reject Leave: {rejectTarget.employee_name}
            </h3>
            <p className="text-xs text-[#78756F] mb-3">
              State the reason for rejecting this leave request ({rejectTarget.days_count} days).
            </p>

            <textarea
              rows={3}
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Critical project deadline, overlapping team absence..."
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
