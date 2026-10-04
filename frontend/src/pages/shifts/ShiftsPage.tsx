import React, { useState, useEffect } from 'react';
import { shiftsApi } from '../../api/shifts';
import { employeesApi } from '../../api/employees';
import { useAuth } from '../../context/AuthContext';
import type { Shift, Employee } from '../../types/api';
import {
  Clock,
  Plus,
  CheckCircle2,
  X,
} from 'lucide-react';

export const ShiftsPage: React.FC = () => {
  const { role } = useAuth();

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [teamShifts, setTeamShifts] = useState<Array<{ employee_id: string; employee_name: string; department: string; shift: Shift }>>([]);
  const [myShift, setMyShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);

  // Assignment Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [employeesList, setEmployeesList] = useState<Employee[]>([]);
  const [targetEmployeeId, setTargetEmployeeId] = useState('');
  const [targetShiftId, setTargetShiftId] = useState('SHIFT-GEN');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchShiftsData = async () => {
    try {
      setLoading(true);
      const shiftDefs = await shiftsApi.getShifts();
      setShifts(shiftDefs || []);

      if (role === 'EMPLOYEE') {
        const s = await shiftsApi.getMyShift();
        setMyShift(s);
      } else if (role === 'MANAGER') {
        const t = await shiftsApi.getTeamShifts();
        setTeamShifts(t || []);
      } else if (role === 'HR') {
        // HR can also load employees for assignment modal
        const emps = await employeesApi.getEmployees({ page_size: 100 });
        setEmployeesList(emps.items || []);
      }
    } catch (err) {
      console.error('Failed to load shifts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShiftsData();
  }, []);

  const handleAssignShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmployeeId) return;
    setAssignLoading(true);
    setMessage(null);
    try {
      await shiftsApi.assignShift({
        employee_id: targetEmployeeId,
        shift_id: targetShiftId,
        effective_from: effectiveDate,
      });
      setMessage('Shift assignment successfully registered!');
      setShowAssignModal(false);
      fetchShiftsData();
    } catch (err: any) {
      setMessage(err.response?.data?.detail || 'Failed to assign shift.');
    } finally {
      setAssignLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-[#78756F]">
        <div className="w-6 h-6 border-2 border-[#D8D4CC] border-t-[#46513F] rounded-full animate-spin mx-auto mb-2"></div>
        Loading shift catalog and assignments...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#242321]">
            Shift Scheduling & Assignments
          </h2>
          <p className="text-xs text-[#78756F] mt-1">
            {role === 'EMPLOYEE'
              ? 'Your current allocated work hours and shift schedule'
              : 'Standard organization working shifts, timings, and employee roster allocations'}
          </p>
        </div>

        {role === 'HR' && (
          <button
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#46513F] text-white text-xs font-bold rounded-lg hover:bg-[#46513F]/90 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Assign Shift</span>
          </button>
        )}
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-[#71806B]/15 border border-[#71806B]/30 text-[#46513F] text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Employee Personal View */}
      {role === 'EMPLOYEE' && (
        <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-2xl p-6 shadow-xs max-w-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#46513F]/10 flex items-center justify-center text-[#46513F]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#242321]">
                {myShift?.name || 'General'} Working Shift
              </h3>
              <p className="text-xs text-[#78756F]">Active assigned work schedule</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 p-4 bg-[#F7F5F0] rounded-xl border border-[#D8D4CC] text-center text-xs">
            <div>
              <span className="text-[10px] text-[#78756F] uppercase font-bold">Start Time</span>
              <p className="font-bold text-sm text-[#242321] mt-0.5">{myShift?.start_time || '09:00'}</p>
            </div>
            <div>
              <span className="text-[10px] text-[#78756F] uppercase font-bold">End Time</span>
              <p className="font-bold text-sm text-[#242321] mt-0.5">{myShift?.end_time || '17:00'}</p>
            </div>
            <div>
              <span className="text-[10px] text-[#78756F] uppercase font-bold">Duration</span>
              <p className="font-bold text-sm text-[#46513F] mt-0.5">{myShift?.duration_hours || 8} hrs</p>
            </div>
          </div>
        </div>
      )}

      {/* Standard Shift Catalog Cards */}
      <div>
        <h3 className="text-sm font-bold text-[#242321] mb-3">Organization Shift Catalog</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {shifts.map((s) => (
            <div
              key={s.shift_id}
              className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl p-5 shadow-xs hover:border-[#46513F]/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] uppercase font-bold text-[#46513F] bg-[#46513F]/10 px-2 py-0.5 rounded-full">
                  {s.shift_id}
                </span>
                <Clock className="w-4 h-4 text-[#78756F]" />
              </div>
              <h4 className="font-bold text-sm text-[#242321]">{s.name} Shift</h4>
              <p className="text-xs text-[#78756F] mt-1">
                {s.start_time} – {s.end_time}
              </p>
              <div className="mt-4 pt-3 border-t border-[#D8D4CC]/60 flex items-center justify-between text-xs">
                <span className="text-[#78756F]">Daily Duration:</span>
                <strong className="text-[#242321]">{s.duration_hours} Hours</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Roster (Manager Only) */}
      {role === 'MANAGER' && (
        <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#D8D4CC] bg-[#F7F5F0]/60">
            <h3 className="text-sm font-bold text-[#242321]">Team Shift Schedule</h3>
            <p className="text-[11px] text-[#78756F]">Direct report active shift allocations</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#D8D4CC] text-[#78756F]">
                  <th className="py-3 px-4 font-semibold">Employee</th>
                  <th className="py-3 px-4 font-semibold">Department</th>
                  <th className="py-3 px-4 font-semibold">Shift Name</th>
                  <th className="py-3 px-4 font-semibold">Timings</th>
                  <th className="py-3 px-4 font-semibold">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8D4CC]/50">
                {teamShifts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#78756F]">
                      No custom team assignments found (Default: General Shift).
                    </td>
                  </tr>
                ) : (
                  teamShifts.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#EAE6DE]/20">
                      <td className="py-3 px-4 font-semibold text-[#242321]">{item.employee_name}</td>
                      <td className="py-3 px-4 text-[#78756F]">{item.department}</td>
                      <td className="py-3 px-4 font-medium text-[#46513F]">{item.shift?.name || 'General'}</td>
                      <td className="py-3 px-4 text-[#78756F]">
                        {item.shift?.start_time} - {item.shift?.end_time}
                      </td>
                      <td className="py-3 px-4 text-[#242321] font-semibold">{item.shift?.duration_hours} hrs</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assign Shift Modal (HR Only) */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#D8D4CC]">
              <h3 className="text-base font-bold text-[#242321]">Assign Employee Shift</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-1 rounded-lg text-[#78756F] hover:bg-[#EAE6DE] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignShift} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-[#242321]">Select Employee *</label>
                <select
                  required
                  value={targetEmployeeId}
                  onChange={(e) => setTargetEmployeeId(e.target.value)}
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
                <label className="block font-semibold mb-1 text-[#242321]">Select Shift *</label>
                <select
                  value={targetShiftId}
                  onChange={(e) => setTargetShiftId(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D8D4CC] rounded-lg bg-[#FFFDF9] text-[#242321] outline-none"
                >
                  {shifts.map((s) => (
                    <option key={s.shift_id} value={s.shift_id}>
                      {s.name} ({s.start_time} - {s.end_time}, {s.duration_hours} hrs)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#242321]">Effective From *</label>
                <input
                  type="date"
                  required
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D8D4CC] rounded-lg bg-[#FFFDF9] outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#D8D4CC] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border border-[#D8D4CC] rounded-lg font-semibold hover:bg-[#EAE6DE] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignLoading}
                  className="px-4 py-2 bg-[#46513F] text-white rounded-lg font-bold hover:bg-[#46513F]/90 cursor-pointer disabled:opacity-50"
                >
                  {assignLoading ? 'Saving...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
