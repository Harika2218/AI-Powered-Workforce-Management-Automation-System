import React, { useState, useEffect } from 'react';
import { payrollApi } from '../../api/payroll';
import { employeesApi } from '../../api/employees';
import { useAuth } from '../../context/AuthContext';
import type { PayrollRecord, Employee } from '../../types/api';
import {
  CircleDollarSign,
  Calculator,
  Calendar,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const PayrollPage: React.FC = () => {
  const { role } = useAuth();

  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Month filter
  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [month, setMonth] = useState(currentMonthStr);
  const [department, setDepartment] = useState('');

  // Calculate Modal (HR)
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [employeesList, setEmployeesList] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [calcLoading, setCalcLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      setError(null);
      if (role === 'EMPLOYEE') {
        const data = await payrollApi.getMyPayslips();
        setRecords(data || []);
      } else {
        const res = await payrollApi.listPayroll({
          department: department || undefined,
          month: month || undefined,
          page,
          page_size: 20,
        });
        setRecords(res.items || []);
        setTotal(res.total || 0);

        if (role === 'HR') {
          const emps = await employeesApi.getEmployees({ page_size: 100 });
          setEmployeesList(emps.items || []);
        }
      }
    } catch (err: any) {
      console.error('Failed to load payroll records:', err);
      setError('Unable to load payroll statements from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, [month, department, page]);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) return;
    setCalcLoading(true);
    setNotification(null);
    try {
      const res = await payrollApi.calculatePayroll({
        employee_id: selectedEmpId,
        month,
      });
      setNotification(`Payroll calculated: Net Salary of $${res.net_salary.toLocaleString()} computed.`);
      setShowCalcModal(false);
      fetchPayroll();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Payroll calculation failed.');
    } finally {
      setCalcLoading(false);
    }
  };

  const departmentsList = [
    'Engineering',
    'Data Science',
    'Finance',
    'Marketing',
    'Human Resources',
    'Operations',
    'Sales',
    'IT',
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#242321]">
            Payroll & Compensation
          </h2>
          <p className="text-xs text-[#78756F] mt-1">
            {role === 'EMPLOYEE'
              ? 'View and inspect your historical compensation statements and net disbursements'
              : 'Enterprise payroll calculations, overtime reconciliation, and payslip statements'}
          </p>
        </div>

        {role === 'HR' && (
          <button
            onClick={() => setShowCalcModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#46513F] text-white text-xs font-bold rounded-lg hover:bg-[#46513F]/90 transition-colors shadow-xs cursor-pointer"
          >
            <Calculator className="w-4 h-4" />
            <span>Generate Payroll</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[#C8755A]/10 border border-[#C8755A]/30 flex items-center justify-between text-xs text-[#C8755A]">
          <span>{error}</span>
          <button
            onClick={fetchPayroll}
            className="px-3 py-1 bg-[#46513F] text-white text-xs font-bold rounded-lg hover:bg-[#46513F]/90 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {notification && (
        <div className="p-3.5 rounded-xl bg-[#71806B]/15 border border-[#71806B]/30 text-[#46513F] text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter toolbar */}
      {role !== 'EMPLOYEE' && (
        <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl p-4 shadow-xs flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[#78756F]">
            <Calendar className="w-4 h-4 text-[#78756F]" />
            <span>Pay Period:</span>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-2.5 py-1.5 border border-[#D8D4CC] rounded-lg bg-[#FFFDF9] text-[#242321] text-xs outline-none"
            />
          </div>

          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="px-3 py-1.5 text-xs border border-[#D8D4CC] rounded-lg bg-[#FFFDF9] text-[#242321] outline-none"
          >
            <option value="">All Departments</option>
            {departmentsList.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Payroll Table */}
      <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#D8D4CC] bg-[#F7F5F0]/60 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#242321]">
              {role === 'EMPLOYEE' ? 'My Payslips' : 'Organization Payroll Register'}
            </h3>
            <p className="text-[11px] text-[#78756F]">Computed earnings, allowances, deductions, and net salary</p>
          </div>
          <CircleDollarSign className="w-4 h-4 text-[#46513F]" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#D8D4CC] text-[#78756F]">
                {role !== 'EMPLOYEE' && <th className="py-3 px-4 font-semibold">Employee</th>}
                <th className="py-3 px-4 font-semibold">Period</th>
                <th className="py-3 px-4 font-semibold">Basic</th>
                <th className="py-3 px-4 font-semibold">Allowances</th>
                <th className="py-3 px-4 font-semibold">Overtime Pay</th>
                <th className="py-3 px-4 font-semibold">Deductions</th>
                <th className="py-3 px-4 font-semibold">Gross</th>
                <th className="py-3 px-4 font-semibold text-right">Net Salary</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8D4CC]/50">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#78756F]">
                    Loading payroll records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#78756F]">
                    No payroll statements recorded for this selection.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.payroll_id} className="hover:bg-[#EAE6DE]/20">
                    {role !== 'EMPLOYEE' && (
                      <td className="py-3 px-4">
                        <span className="font-semibold text-[#242321]">{r.employee_name}</span>
                        <span className="block text-[10px] text-[#78756F] font-mono">{r.employee_id}</span>
                      </td>
                    )}
                    <td className="py-3 px-4 font-mono font-medium text-[#242321]">{r.month || (r as any).pay_period}</td>
                    <td className="py-3 px-4 text-[#78756F]">${r.basic_salary?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-[#78756F]">+${r.allowances?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-[#C99A52] font-medium">+${(r.overtime_pay ?? (r as any).overtime_amount ?? 0).toLocaleString()}</td>
                    <td className="py-3 px-4 text-[#C8755A]">-${r.deductions?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-[#78756F]">${r.gross_salary?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-sm text-[#46513F]">
                      ${r.net_salary?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#71806B]/15 text-[#46513F]">
                        {r.payment_status || (r as any).status || 'PAID'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {role !== 'EMPLOYEE' && (
          <div className="p-3.5 border-t border-[#D8D4CC] bg-[#F7F5F0]/60 flex items-center justify-between text-xs text-[#78756F]">
            <span>
              Page {page} ({total} total statements)
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
                onClick={() => setPage((p) => p + 1)}
                disabled={records.length < 20}
                className="p-1.5 rounded-lg border border-[#D8D4CC] bg-[#FFFDF9] disabled:opacity-40 hover:bg-[#EAE6DE] cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Calculate Modal (HR Only) */}
      {showCalcModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#D8D4CC]">
              <h3 className="text-base font-bold text-[#242321]">Generate Employee Payroll</h3>
              <button
                onClick={() => setShowCalcModal(false)}
                className="p-1 rounded-lg text-[#78756F] hover:bg-[#EAE6DE] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCalculate} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-[#242321]">Select Employee *</label>
                <select
                  required
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D8D4CC] rounded-lg bg-[#FFFDF9] text-[#242321] outline-none"
                >
                  <option value="">Choose an employee...</option>
                  {employeesList.map((emp) => (
                    <option key={emp.employee_id} value={emp.employee_id}>
                      {emp.full_name} ({emp.employee_id} - {emp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#242321]">Pay Period (Month) *</label>
                <input
                  type="month"
                  required
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D8D4CC] rounded-lg bg-[#FFFDF9] outline-none"
                />
              </div>

              <p className="text-[11px] text-[#78756F] bg-[#F7F5F0] p-3 rounded-lg border border-[#D8D4CC]">
                The backend service will automatically look up the employee's base salary, reconcile approved timesheets & overtime, calculate deductions, and store the certified record.
              </p>

              <div className="pt-3 border-t border-[#D8D4CC] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCalcModal(false)}
                  className="px-4 py-2 border border-[#D8D4CC] rounded-lg font-semibold hover:bg-[#EAE6DE] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={calcLoading}
                  className="px-4 py-2 bg-[#46513F] text-white rounded-lg font-bold hover:bg-[#46513F]/90 cursor-pointer disabled:opacity-50"
                >
                  {calcLoading ? 'Calculating...' : 'Compute & Finalize'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
