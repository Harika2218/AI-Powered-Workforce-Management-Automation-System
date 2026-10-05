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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#242321]">
            Compliance & System Audit Logs
          </h2>
          <p className="text-xs text-[#78756F] mt-1">
            Immutable administrative event trail for security, authorizations, and data modifications
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#46513F]/30 bg-[#46513F]/5 text-[#46513F] text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>HR Administrative Clearance Only</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[#C8755A]/10 border border-[#C8755A]/30 flex items-center justify-between text-xs text-[#C8755A]">
          <span>{error}</span>
          <button
            onClick={fetchLogs}
            className="px-3 py-1 bg-[#46513F] text-white text-xs font-bold rounded-lg hover:bg-[#46513F]/90 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter toolbar */}
      <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl p-4 shadow-xs flex flex-wrap items-center gap-3">
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 text-xs border border-[#D8D4CC] rounded-lg bg-[#FFFDF9] text-[#242321] outline-none"
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
          className="px-3 py-1.5 text-xs border border-[#D8D4CC] rounded-lg bg-[#FFFDF9] text-[#242321] outline-none"
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
            className="text-xs text-[#C8755A] hover:underline font-semibold cursor-pointer ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F7F5F0] border-b border-[#D8D4CC] text-[#78756F]">
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">User</th>
                <th className="py-3 px-4 font-semibold">Role</th>
                <th className="py-3 px-4 font-semibold">Action</th>
                <th className="py-3 px-4 font-semibold">Entity</th>
                <th className="py-3 px-4 font-semibold">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8D4CC]/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#78756F]">
                    Loading audit trail records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#78756F]">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.log_id} className="hover:bg-[#EAE6DE]/20 font-mono text-[11px]">
                    <td className="py-3 px-4 text-[#78756F]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#242321]">{log.user_email}</td>
                    <td className="py-3 px-4">
                      <span className="px-1.5 py-0.5 rounded bg-[#EAE6DE] text-[#242321]">
                        {log.user_role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-[#46513F]">{log.action}</td>
                    <td className="py-3 px-4 text-[#78756F]">{log.entity || log.entity_id}</td>
                    <td className="py-3 px-4 text-[#242321] font-sans max-w-sm truncate">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3.5 border-t border-[#D8D4CC] bg-[#F7F5F0]/60 flex items-center justify-between text-xs text-[#78756F]">
          <span>
            Page {page} of {totalPages} ({total} logged events)
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-[#D8D4CC] bg-[#FFFDF9] disabled:opacity-40 hover:bg-[#EAE6DE] cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-[#D8D4CC] bg-[#FFFDF9] disabled:opacity-40 hover:bg-[#EAE6DE] cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
