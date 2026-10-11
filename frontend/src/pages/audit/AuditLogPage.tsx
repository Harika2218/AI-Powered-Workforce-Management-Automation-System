import React, { useState, useEffect } from 'react';
import { auditApi } from '../../api/audit';
import type { AuditLogItem } from '../../types/api';
import { ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await auditApi.getAuditLogs({
        action: actionFilter || undefined,
        entity_type: entityFilter || undefined,
        page,
        page_size: pageSize,
      });
      setLogs(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
      setError('Unable to load compliance audit logs from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, entityFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E2E8F0]">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172033]">
            Compliance & System Audit Logs
          </h2>
          <p className="text-xs text-[#64748B] mt-1 font-medium">
            Immutable administrative event trail for security, authorizations, and data modifications
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-[#2563EB] text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>HR Administrative Clearance Only</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between text-xs text-[#DC2626] font-medium">
          <span>{error}</span>
          <button
            onClick={fetchLogs}
            className="px-3 py-1 bg-[#2563EB] text-white text-xs font-bold rounded-lg hover:bg-[#1D4ED8] cursor-pointer shadow-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter toolbar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs flex flex-wrap items-center gap-3">
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#172033] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none shadow-2xs font-medium cursor-pointer"
        >
          <option value="">All Actions</option>
          <option value="USER_LOGIN">USER_LOGIN</option>
          <option value="ACCOUNT_ACTIVATED">ACCOUNT_ACTIVATED</option>
          <option value="EMPLOYEE_CREATED">EMPLOYEE_CREATED</option>
          <option value="LEAVE_APPROVED">LEAVE_APPROVED</option>
          <option value="LEAVE_REJECTED">LEAVE_REJECTED</option>
          <option value="PAYROLL_CALCULATED">PAYROLL_CALCULATED</option>
          <option value="PERFORMANCE_REVIEW_SUBMITTED">PERFORMANCE_REVIEW_SUBMITTED</option>
        </select>

        <select
          value={entityFilter}
          onChange={(e) => {
            setEntityFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#172033] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none shadow-2xs font-medium cursor-pointer"
        >
          <option value="">All Entities</option>
          <option value="USER">USER</option>
          <option value="EMPLOYEE">EMPLOYEE</option>
          <option value="LEAVE">LEAVE</option>
          <option value="ATTENDANCE">ATTENDANCE</option>
          <option value="PAYROLL">PAYROLL</option>
          <option value="PERFORMANCE">PERFORMANCE</option>
        </select>

        {(actionFilter || entityFilter) && (
          <button
            onClick={() => {
              setActionFilter('');
              setEntityFilter('');
              setPage(1);
            }}
            className="text-xs text-[#DC2626] hover:underline font-semibold cursor-pointer ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B]">
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Timestamp</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">User</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Role</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Action</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Entity</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#64748B] font-medium">
                    Loading audit trail records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#64748B] font-medium">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.log_id} className="hover:bg-[#F8FAFC] font-mono text-[11px] transition-colors">
                    <td className="py-3 px-4 text-[#64748B]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#172033] font-sans">{log.user_email}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[#172033] font-sans font-medium text-[10px] border border-[#E2E8F0]">
                        {log.user_role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-[#2563EB]">{log.action}</td>
                    <td className="py-3 px-4 text-[#64748B]">{log.entity || log.entity_id}</td>
                    <td className="py-3 px-4 text-[#172033] font-sans max-w-sm truncate">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3.5 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between text-xs text-[#64748B] font-medium">
          <span>
            Page {page} of {totalPages} ({total} logged events)
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-[#E2E8F0] bg-white disabled:opacity-40 hover:bg-[#F8FAFC] cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-[#E2E8F0] bg-white disabled:opacity-40 hover:bg-[#F8FAFC] cursor-pointer shadow-2xs"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
