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
  Search,
  Filter,
  Calendar,
  Layers,
  AlertTriangle,
} from 'lucide-react';

export const ShiftsPage: React.FC = () => {
  const { role } = useAuth();

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [teamShifts, setTeamShifts] = useState<Array<{ employee_id: string; employee_name: string; department: string; shift: Shift; effective_from?: string }>>([]);
  const [myShift, setMyShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters for shift schedule table
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  // Assignment Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [employeesList, setEmployeesList] = useState<Employee[]>([]);
  const [targetEmployeeId, setTargetEmployeeId] = useState('');
  const [targetShiftId, setTargetShiftId] = useState('SHIFT-GEN');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [assignLoading, setAssignLoading] = useState(false);

  // Define Shift Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newShiftName, setNewShiftName] = useState('');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('17:00');
  const [createLoading, setCreateLoading] = useState(false);

  const [message, setMessage] = useState<string | null>(null);

  const fetchShiftsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const shiftDefs = await shiftsApi.getShifts();
      setShifts(shiftDefs || []);

      if (role === 'EMPLOYEE') {
        try {
          const s = await shiftsApi.getMyShift();
          setMyShift(s);
        } catch (e: any) {
          if (e.response?.status === 404) {
            setMyShift(null);
          } else {
            throw e;
          }
        }
      } else {
        const [t, emps] = await Promise.all([
          shiftsApi.getTeamShifts(),
          employeesApi.getEmployees({ page_size: 100 }),
        ]);
        setTeamShifts(t || []);
        setEmployeesList(emps?.items || []);
      }
    } catch (err: any) {
      console.error('Failed to load shifts:', err);
      setError('Unable to load shift schedule data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShiftsData();
  }, [role]);

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
      setMessage('Shift assignment successfully registered in database!');
      setShowAssignModal(false);
      setTargetEmployeeId('');
      fetchShiftsData();
    } catch (err: any) {
      setMessage(err.response?.data?.detail || 'Failed to assign shift.');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShiftName.trim()) return;
    setCreateLoading(true);
    setMessage(null);
    try {
      const created = await shiftsApi.createShift({
        name: newShiftName.trim(),
        start_time: newStartTime,
        end_time: newEndTime,
      });
      setMessage(`Shift "${created.name}" (${created.start_time} - ${created.end_time}, ${created.duration_hours} hrs) created successfully!`);
      setShowCreateModal(false);
      setNewShiftName('');
      setNewStartTime('09:00');
      setNewEndTime('17:00');
      fetchShiftsData();
    } catch (err: any) {
      setMessage(err.response?.data?.detail || 'Failed to create shift definition.');
    } finally {
      setCreateLoading(false);
    }
  };

  const filteredTeamShifts = teamShifts.filter((item) => {
    const matchesSearch =
      !search ||
      item.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.employee_id?.toLowerCase().includes(search.toLowerCase());
    const matchesDept = !selectedDept || item.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const departments = Array.from(new Set(teamShifts.map((t) => t.department).filter(Boolean)));

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-[#64748B]">
        <div className="w-6 h-6 border-2 border-[#E2E8F0] border-t-[#2563EB] rounded-full animate-spin mx-auto mb-2"></div>
        Loading shift catalog and assignments...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-white border border-[#E2E8F0] rounded-2xl max-w-lg mx-auto my-12 shadow-sm">
        <AlertTriangle className="w-10 h-10 text-[#DC2626] mx-auto mb-3" />
        <h3 className="text-base font-bold text-[#172033]">Failed to Load Shifts</h3>
        <p className="text-xs text-[#64748B] mt-1">{error}</p>
        <button
          onClick={fetchShiftsData}
          className="mt-4 px-4 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-lg hover:bg-[#1D4ED8] cursor-pointer shadow-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#172033]">
            Shift Scheduling & Assignments
          </h2>
          <p className="text-xs text-[#64748B] mt-1">
            {role === 'EMPLOYEE'
              ? 'Your current allocated work hours and shift schedule'
              : 'Standard organization working shifts, timings, and employee roster allocations'}
          </p>
        </div>

        {role === 'HR' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#E2E8F0] text-[#172033] text-xs font-bold rounded-lg hover:bg-[#F1F5F9] transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Add Shift</span>
            </button>
            <button
              onClick={() => setShowAssignModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-lg hover:bg-[#1D4ED8] transition-colors shadow-sm shadow-blue-500/20 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Assign Shift</span>
            </button>
          </div>
        )}
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[#16A34A] text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16A34A]" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-[#64748B] hover:text-[#172033]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Employee Personal View */}
      {role === 'EMPLOYEE' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs max-w-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#2563EB]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#172033]">
                {myShift?.name || 'General'} Working Shift
              </h3>
              <p className="text-xs text-[#64748B]">Active assigned work schedule</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-center text-xs">
            <div>
              <span className="text-[10px] text-[#64748B] uppercase font-bold">Start Time</span>
              <p className="font-bold text-sm text-[#172033] mt-0.5">{myShift?.start_time || '09:00'}</p>
            </div>
            <div>
              <span className="text-[10px] text-[#64748B] uppercase font-bold">End Time</span>
              <p className="font-bold text-sm text-[#172033] mt-0.5">{myShift?.end_time || '17:00'}</p>
            </div>
            <div>
              <span className="text-[10px] text-[#64748B] uppercase font-bold">Duration</span>
              <p className="font-bold text-sm text-[#2563EB] mt-0.5">{myShift?.duration_hours || 8} hrs</p>
            </div>
          </div>
        </div>
      )}

      {/* Catalog of Active Shift Definitions */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#2563EB]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
            Organizational Shift Definitions ({shifts.length})
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {shifts.map((s) => (
            <div
              key={s.shift_id}
              className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-blue-200 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    {s.shift_id}
                  </span>
                  <span className="text-[10px] text-[#16A34A] font-semibold">Active</span>
                </div>
                <h4 className="font-bold text-sm text-[#172033] mt-2">{s.name}</h4>
                <p className="text-xs text-[#2563EB] font-semibold mt-1">
                  {s.start_time} - {s.end_time}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                <span className="text-[#64748B]">Standard Duration:</span>
                <strong className="text-[#172033]">{s.duration_hours} Hours</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shift Schedule Table (HR & Manager) */}
      {role !== 'EMPLOYEE' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#172033]">
                {role === 'HR' ? 'Workforce Shift Schedule' : 'Team Shift Schedule'}
              </h3>
              <p className="text-[11px] text-[#64748B]">
                {filteredTeamShifts.length} allocated shift records from database
              </p>
            </div>

            {/* Search & Filter */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                <input
                  type="text"
                  placeholder="Search employee..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#172033] outline-none w-48 focus:border-[#2563EB]"
                />
              </div>

              {departments.length > 0 && (
                <div className="relative">
                  <Filter className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#172033] outline-none focus:border-[#2563EB]"
                  >
                    <option value="">All Departments</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#64748B] bg-[#F8FAFC]">
                  <th className="py-3.5 px-4 font-semibold">Employee</th>
                  <th className="py-3.5 px-4 font-semibold">Department</th>
                  <th className="py-3.5 px-4 font-semibold">Shift Name</th>
                  <th className="py-3.5 px-4 font-semibold">Timings</th>
                  <th className="py-3.5 px-4 font-semibold">Duration</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  {role === 'HR' && <th className="py-3.5 px-4 font-semibold text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]/80">
                {filteredTeamShifts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#64748B]">
                      No employee shift records matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTeamShifts.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#172033]">{item.employee_name}</div>
                        <div className="text-[10px] text-[#64748B] font-mono">{item.employee_id}</div>
                      </td>
                      <td className="py-3.5 px-4 text-[#64748B] font-medium">{item.department}</td>
                      <td className="py-3.5 px-4 font-medium text-[#2563EB]">
                        {item.shift?.name || 'General Shift'}
                      </td>
                      <td className="py-3.5 px-4 text-[#64748B]">
                        {item.shift?.start_time || '09:00'} - {item.shift?.end_time || '17:00'}
                      </td>
                      <td className="py-3.5 px-4 text-[#172033] font-semibold">
                        {item.shift?.duration_hours || 8} hrs
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-[#16A34A] border border-emerald-200">
                          Active
                        </span>
                      </td>
                      {role === 'HR' && (
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setTargetEmployeeId(item.employee_id);
                              if (item.shift?.shift_id) setTargetShiftId(item.shift.shift_id);
                              setShowAssignModal(true);
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold text-[#2563EB] hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                          >
                            Reassign
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assign Shift Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h3 className="text-base font-bold text-[#172033]">Assign Employee Shift</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-1 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#172033] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignShift} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-[#172033]">Select Employee *</label>
                <select
                  required
                  value={targetEmployeeId}
                  onChange={(e) => setTargetEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] outline-none focus:border-[#2563EB]"
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
                <label className="block font-semibold mb-1 text-[#172033]">Select Shift *</label>
                <select
                  value={targetShiftId}
                  onChange={(e) => setTargetShiftId(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] outline-none focus:border-[#2563EB]"
                >
                  {shifts.map((s) => (
                    <option key={s.shift_id} value={s.shift_id}>
                      {s.name} ({s.start_time} - {s.end_time}, {s.duration_hours} hrs)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#172033]">Effective From *</label>
                <input
                  type="date"
                  required
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-lg font-semibold hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#172033] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignLoading}
                  className="px-4 py-2 bg-[#2563EB] text-white rounded-lg font-bold hover:bg-[#1D4ED8] cursor-pointer disabled:opacity-50 shadow-sm shadow-blue-500/20"
                >
                  {assignLoading ? 'Saving...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Define Shift Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h3 className="text-base font-bold text-[#172033]">Define New Shift</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#172033] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShift} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-[#172033]">Shift Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Night Support Shift, Weekend Rotation"
                  value={newShiftName}
                  onChange={(e) => setNewShiftName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-[#172033]">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] outline-none focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#172033]">End Time *</label>
                  <input
                    type="time"
                    required
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-lg font-semibold hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#172033] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 bg-[#2563EB] text-white rounded-lg font-bold hover:bg-[#1D4ED8] cursor-pointer disabled:opacity-50 shadow-sm shadow-blue-500/20"
                >
                  {createLoading ? 'Creating...' : 'Create Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
