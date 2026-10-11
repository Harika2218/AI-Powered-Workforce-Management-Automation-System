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
  Search,
  RotateCw,
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

  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchLeaveData = async () => {
    try {
      setLoading(true);
      setError(null);
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
    } catch (err: any) {
      console.error('Failed to load leave data:', err);
      setError('Unable to load leave records from backend. Please verify your connection.');
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
          <h2 className="text-2xl font-bold tracking-tight text-[#172033]">
            Leave Management
          </h2>
          <p className="text-xs text-[#64748B] mt-1">
            {role === 'EMPLOYEE'
              ? 'Request time off, track approval status, and monitor leave balances'
              : 'Review team time-off requests, enforce balances, and manage leaves'}
          </p>
        </div>

        <button
          onClick={() => setShowApplyModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-lg hover:bg-[#1D4ED8] transition-colors shadow-sm shadow-blue-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Apply for Leave</span>
        </button>
      </div>

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

      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[#DC2626] text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchLeaveData}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#2563EB] text-white text-xs font-semibold rounded-lg hover:bg-[#1D4ED8] cursor-pointer shrink-0"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      {role === 'EMPLOYEE' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs flex items-center justify-between hover:border-blue-200 transition-colors">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Annual Leave Balance
              </span>
              <p className="text-2xl font-extrabold text-[#2563EB] mt-1">{balances.annual} days</p>
            </div>
            <CalendarDays className="w-6 h-6 text-[#2563EB]/40" />
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs flex items-center justify-between hover:border-amber-200 transition-colors">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Sick Leave Balance
              </span>
              <p className="text-2xl font-extrabold text-[#D97706] mt-1">{balances.sick} days</p>
            </div>
            <CalendarDays className="w-6 h-6 text-[#D97706]/40" />
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs flex items-center justify-between hover:border-emerald-200 transition-colors">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Casual Leave Balance
              </span>
              <p className="text-2xl font-extrabold text-[#16A34A] mt-1">{balances.casual} days</p>
            </div>
            <CalendarDays className="w-6 h-6 text-[#16A34A]/40" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs hover:border-amber-200 transition-colors">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Pending Approvals
            </span>
            <p className="text-2xl font-extrabold text-[#D97706] mt-1">{pendingLeaves.length}</p>
            <span className="text-[10px] text-[#64748B]">Awaiting review</span>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs hover:border-blue-200 transition-colors">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Approved Requests
            </span>
            <p className="text-2xl font-extrabold text-[#2563EB] mt-1">
              {allLeaves.filter((l) => (l.status || '').toUpperCase() === 'APPROVED').length}
            </p>
            <span className="text-[10px] text-[#16A34A] font-semibold">Organization-wide</span>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs hover:border-emerald-200 transition-colors">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Total Days Approved
            </span>
            <p className="text-2xl font-extrabold text-[#16A34A] mt-1">
              {allLeaves
                .filter((l) => (l.status || '').toUpperCase() === 'APPROVED')
                .reduce((sum, l) => sum + (l.days_count ?? l.total_days ?? 0), 0)}{' '}
              <span className="text-xs font-normal text-[#64748B]">days</span>
            </p>
            <span className="text-[10px] text-[#64748B]">Cumulative time off</span>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs hover:border-blue-200 transition-colors">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              My Annual Balance
            </span>
            <p className="text-2xl font-extrabold text-[#172033] mt-1">
              {balances.annual}{' '}
              <span className="text-xs font-normal text-[#64748B]">days</span>
            </p>
            <span className="text-[10px] text-[#64748B]">Personal quota</span>
          </div>
        </div>
      )}

      {/* Pending Approvals Table (Manager / HR only) */}
      {role !== 'EMPLOYEE' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#172033]">
                Pending Leave Approvals ({pendingLeaves.length})
              </h3>
              <p className="text-[11px] text-[#64748B]">Requires manager / HR review</p>
            </div>
            <Clock className="w-4 h-4 text-[#D97706]" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B]">
                  <th className="py-3.5 px-4 font-semibold">Employee</th>
                  <th className="py-3.5 px-4 font-semibold">Department</th>
                  <th className="py-3.5 px-4 font-semibold">Leave Type</th>
                  <th className="py-3.5 px-4 font-semibold">Duration</th>
                  <th className="py-3.5 px-4 font-semibold">Days</th>
                  <th className="py-3.5 px-4 font-semibold">Reason</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]/80">
                {pendingLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#64748B]">
                      No pending leave requests requiring action.
                    </td>
                  </tr>
                ) : (
                  pendingLeaves.map((req) => {
                    const reqId = req.leave_id || req.request_id || '';
                    const days = req.days_count ?? req.total_days ?? 0;
                    return (
                      <tr key={reqId} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-[#172033]">{req.employee_name}</span>
                          <span className="block text-[10px] text-[#64748B] font-mono">{req.employee_id}</span>
                        </td>
                        <td className="py-3.5 px-4 text-[#64748B] font-medium">{req.department}</td>
                        <td className="py-3.5 px-4 capitalize font-medium text-[#172033]">{req.leave_type}</td>
                        <td className="py-3.5 px-4 text-[#64748B]">
                          {req.start_date} → {req.end_date}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#172033]">{days}</td>
                        <td className="py-3.5 px-4 text-[#64748B] max-w-xs truncate">{req.reason}</td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleApprove(reqId)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#16A34A] text-white text-[11px] font-semibold hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs"
                            >
                              <Check className="w-3 h-3" /> Approve
                            </button>
                            <button
                              onClick={() => setRejectTarget(req)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-red-200 text-[#DC2626] text-[11px] font-semibold hover:bg-red-50 transition-colors cursor-pointer"
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
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#172033]">
              {role === 'EMPLOYEE'
                ? 'My Leave Applications'
                : recordsTab === 'all'
                ? 'Organization Leave History'
                : 'My Personal Leave Applications'}
            </h3>
            <p className="text-[11px] text-[#64748B]">Comprehensive log of submitted leaves and outcomes</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {role !== 'EMPLOYEE' && (
              <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-lg border border-[#E2E8F0]">
                <button
                  onClick={() => setRecordsTab('all')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    recordsTab === 'all'
                      ? 'bg-white text-[#172033] shadow-xs'
                      : 'text-[#64748B] hover:text-[#172033]'
                  }`}
                >
                  All Organization ({allLeaves.length})
                </button>
                <button
                  onClick={() => setRecordsTab('my')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    recordsTab === 'my'
                      ? 'bg-white text-[#172033] shadow-xs'
                      : 'text-[#64748B] hover:text-[#172033]'
                  }`}
                >
                  My Requests ({myLeaves.length})
                </button>
              </div>
            )}

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                type="text"
                placeholder="Search leaves..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs bg-white border border-[#E2E8F0] rounded-lg outline-none w-36 sm:w-44 focus:border-[#2563EB]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1 text-xs bg-white border border-[#E2E8F0] rounded-lg text-[#172033] outline-none focus:border-[#2563EB]"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B]">
                {(role !== 'EMPLOYEE' && recordsTab === 'all') && <th className="py-3.5 px-4 font-semibold">Employee</th>}
                <th className="py-3.5 px-4 font-semibold">Leave Type</th>
                <th className="py-3.5 px-4 font-semibold">Start Date</th>
                <th className="py-3.5 px-4 font-semibold">End Date</th>
                <th className="py-3.5 px-4 font-semibold">Days</th>
                <th className="py-3.5 px-4 font-semibold">Reason</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                {(role === 'EMPLOYEE' || recordsTab === 'my') && <th className="py-3.5 px-4 font-semibold text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]/80">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#64748B]">
                    Loading leave records...
                  </td>
                </tr>
              ) : (() => {
                const targetList = role === 'EMPLOYEE' || recordsTab === 'my' ? myLeaves : allLeaves;
                const filtered = targetList.filter((req) => {
                  const matchSearch =
                    !searchTerm.trim() ||
                    (req.employee_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (req.employee_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (req.reason || '').toLowerCase().includes(searchTerm.toLowerCase());
                  const matchStatus =
                    statusFilter === 'ALL' ||
                    (req.status || '').toUpperCase() === statusFilter;
                  return matchSearch && matchStatus;
                });

                if (filtered.length === 0) {
                  return (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-[#64748B]">
                        {searchTerm || statusFilter !== 'ALL'
                          ? 'No leave records match the selected filters.'
                          : 'No leave records found.'}
                      </td>
                    </tr>
                  );
                }

                return filtered.map((req) => {
                  const reqId = req.leave_id || req.request_id || '';
                  const days = req.days_count ?? req.total_days ?? 0;
                  const statusUpper = (req.status || '').toUpperCase();
                  return (
                    <tr key={reqId} className="hover:bg-[#F8FAFC] transition-colors">
                      {(role !== 'EMPLOYEE' && recordsTab === 'all') && (
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-[#172033]">{req.employee_name}</span>
                          <span className="block text-[10px] text-[#64748B] font-mono">{req.employee_id}</span>
                        </td>
                      )}
                      <td className="py-3.5 px-4 capitalize font-semibold text-[#172033]">{req.leave_type}</td>
                      <td className="py-3.5 px-4 text-[#64748B]">{req.start_date}</td>
                      <td className="py-3.5 px-4 text-[#64748B]">{req.end_date}</td>
                      <td className="py-3.5 px-4 font-bold text-[#172033]">{days}</td>
                      <td className="py-3.5 px-4 text-[#64748B] max-w-xs truncate">{req.reason}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            statusUpper === 'APPROVED'
                              ? 'bg-emerald-50 text-[#16A34A] border-emerald-200'
                              : statusUpper === 'REJECTED'
                              ? 'bg-red-50 text-[#DC2626] border-red-200'
                              : statusUpper === 'CANCELLED'
                              ? 'bg-slate-100 text-[#64748B] border-slate-200'
                              : 'bg-amber-50 text-[#D97706] border-amber-200'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      {(role === 'EMPLOYEE' || recordsTab === 'my') && (
                        <td className="py-3.5 px-4 text-right">
                          {statusUpper === 'PENDING' && (
                            <button
                              onClick={() => handleCancel(reqId)}
                              className="text-xs text-[#DC2626] hover:underline font-semibold cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h3 className="text-base font-bold text-[#172033]">Apply for Leave</h3>
              <button
                onClick={() => setShowApplyModal(false)}
                className="p-1 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#172033] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-[#172033]">Leave Category *</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] outline-none focus:border-[#2563EB]"
                >
                  <option value="Annual">Annual Leave (Balance: {balances.annual} days)</option>
                  <option value="Sick">Sick Leave (Balance: {balances.sick} days)</option>
                  <option value="Casual">Casual Leave (Balance: {balances.casual} days)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-[#172033]">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] outline-none focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#172033]">End Date *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#172033]">Reason for Time Off *</label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide context for manager review..."
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-lg font-semibold hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#172033] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-[#2563EB] text-white rounded-lg font-bold hover:bg-[#1D4ED8] cursor-pointer disabled:opacity-50 shadow-sm shadow-blue-500/20"
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className="font-bold text-sm text-[#172033] mb-1">
              Reject Leave: {rejectTarget.employee_name}
            </h3>
            <p className="text-xs text-[#64748B] mb-3">
              State the reason for rejecting this leave request ({rejectTarget.days_count} days).
            </p>

            <textarea
              rows={3}
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Critical project deadline, overlapping team absence..."
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
