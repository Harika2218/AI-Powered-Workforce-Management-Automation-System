import React, { useState, useEffect } from 'react';
import { employeesApi } from '../../api/employees';
import { useAuth } from '../../context/AuthContext';
import type { Employee } from '../../types/api';
import {
  Search,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
  X,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  Calendar,
} from 'lucide-react';

export const WorkforcePage: React.FC = () => {
  const { role } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusUpdateTarget, setStatusUpdateTarget] = useState<Employee | null>(null);

  // Form states
  const initialFormData = {
    employee_id: '',
    first_name: '',
    last_name: '',
    email: '',
    department: 'Engineering',
    designation: 'Software Engineer',
    employment_type: 'Full-Time',
    salary: 85000,
    phone: '',
    location: 'New York, NY',
    skills: 'Python, React, SQL',
  };
  const [formData, setFormData] = useState(initialFormData);
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
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  useEffect(() => {
    employeesApi.getDepartments().then((depts) => {
      if (depts && depts.length > 0) {
        setDepartmentsList(depts);
      }
    }).catch((err) => {
      console.warn('Failed to load dynamic departments:', err);
    });
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await employeesApi.getEmployees({
        search: search.trim() || undefined,
        department: department || undefined,
        status: status || undefined,
        page,
        page_size: pageSize,
      });
      setEmployees(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch (err: any) {
      console.error('Error fetching employees:', err);
      setError('Unable to load employee workforce directory from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [page, department, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEmployees();
  };

  const handleOpenDetail = async (empId: string) => {
    try {
      const data = await employeesApi.getEmployeeById(empId);
      setSelectedEmployee(data);
      setShowDetailModal(true);
    } catch (err) {
      console.error('Failed to get employee details:', err);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      const created = await employeesApi.createEmployee({
        employee_id: formData.employee_id.trim() || undefined,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        department: formData.department,
        designation: formData.designation.trim(),
        employment_type: formData.employment_type as any,
        salary: Number(formData.salary) || 60000,
        phone: formData.phone.trim() || '+1 (555) 000-0000',
        location: formData.location.trim() || 'New York, NY',
        skills: formData.skills.split(',').map((s) => s.trim()).filter(Boolean),
        date_of_joining: new Date().toISOString().split('T')[0],
      });
      setShowAddModal(false);
      setFormData(initialFormData);
      setNotificationMsg(`Employee ${created.full_name || formData.first_name + ' ' + formData.last_name} (${created.employee_id}) created successfully! Activation token generated.`);
      fetchEmployees();
    } catch (err: any) {
      console.error('Create employee error:', err);
      setFormError(err.response?.data?.detail || 'Failed to create employee profile.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (empId: string, newStatus: string) => {
    try {
      await employeesApi.updateStatus(empId, { employment_status: newStatus });
      setNotificationMsg(`Employee status updated to ${newStatus}`);
      setStatusUpdateTarget(null);
      fetchEmployees();
    } catch (err: any) {
      console.error('Status update error:', err);
      alert(err.response?.data?.detail || 'Failed to update employee status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#172033]">
            Workforce Directory
          </h2>
          <p className="text-xs text-[#64748B] mt-1">
            Displaying {employees.length} of {total} registered personnel records
          </p>
        </div>

        {role === 'HR' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-lg hover:bg-[#1D4ED8] transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between text-xs text-[#DC2626]">
          <span>{error}</span>
          <button
            onClick={fetchEmployees}
            className="px-3 py-1 bg-[#2563EB] text-white text-xs font-bold rounded-lg hover:bg-[#1D4ED8] cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Flash message */}
      {notificationMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[#16A34A] text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16A34A]" />
            <span>{notificationMsg}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="cursor-pointer text-[#64748B] hover:text-[#172033]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters & Search Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#64748B]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, designation, or ID..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#172033] focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] outline-none placeholder:text-[#94A3B8]"
            />
          </div>

          <div className="flex gap-2">
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

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#172033] outline-none focus:border-[#2563EB]"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-[#2563EB] text-white text-xs font-semibold rounded-lg hover:bg-[#1D4ED8] transition-colors cursor-pointer shadow-xs"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Employee Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B]">
                <th className="py-3.5 px-4 font-semibold">ID</th>
                <th className="py-3.5 px-4 font-semibold">Name & Email</th>
                <th className="py-3.5 px-4 font-semibold">Department</th>
                <th className="py-3.5 px-4 font-semibold">Designation</th>
                <th className="py-3.5 px-4 font-semibold">Employment</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#64748B]">
                    <div className="w-6 h-6 border-2 border-[#E2E8F0] border-t-[#2563EB] rounded-full animate-spin mx-auto mb-2"></div>
                    Loading employee directory...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#64748B]">
                    No employees matching the search filters found.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.employee_id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#2563EB]">
                      {emp.employee_id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#172033]">{emp.full_name}</div>
                      <div className="text-[11px] text-[#64748B]">{emp.email}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[#172033] font-medium">{emp.department}</td>
                    <td className="py-3.5 px-4 text-[#64748B]">{emp.designation}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-[#F1F5F9] text-[#172033] font-medium border border-[#E2E8F0]">
                        {emp.employment_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          emp.employment_status === 'Active'
                            ? 'bg-emerald-50 text-[#16A34A] border-emerald-200'
                            : emp.employment_status === 'On Leave'
                            ? 'bg-amber-50 text-[#D97706] border-amber-200'
                            : 'bg-red-50 text-[#DC2626] border-red-200'
                        }`}
                      >
                        {emp.employment_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDetail(emp.employee_id)}
                          className="p-1.5 text-[#2563EB] hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                          title="View Profile Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {role === 'HR' && (
                          <button
                            onClick={() => setStatusUpdateTarget(emp)}
                            className="p-1.5 text-[#64748B] hover:text-[#172033] hover:bg-[#F1F5F9] rounded-md transition-colors cursor-pointer"
                            title="Update Status"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3.5 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between text-xs text-[#64748B]">
          <span>
            Page {page} of {totalPages} ({total} total records)
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

      {/* Employee Detail Modal */}
      {showDetailModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
              <div>
                <h3 className="text-lg font-bold text-[#172033]">{selectedEmployee.full_name}</h3>
                <p className="text-xs text-[#64748B]">
                  {selectedEmployee.designation} • {selectedEmployee.department}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#172033] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-5 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                  <span className="text-[10px] uppercase font-bold text-[#64748B]">Employee ID</span>
                  <p className="font-mono font-bold text-sm text-[#2563EB] mt-0.5">
                    {selectedEmployee.employee_id}
                  </p>
                </div>
                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                  <span className="text-[10px] uppercase font-bold text-[#64748B]">Status</span>
                  <p className="font-bold text-sm text-[#172033] mt-0.5">
                    {selectedEmployee.employment_status}
                  </p>
                </div>
                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                  <span className="text-[10px] uppercase font-bold text-[#64748B]">Employment</span>
                  <p className="font-bold text-sm text-[#172033] mt-0.5">
                    {selectedEmployee.employment_type}
                  </p>
                </div>
              </div>

              {/* Contact info */}
              <div className="border border-[#E2E8F0] rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#64748B]">
                  Contact & Location
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 text-[#172033]">
                    <Mail className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>{selectedEmployee.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#172033]">
                    <Phone className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>{selectedEmployee.phone || 'Not recorded'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#172033]">
                    <MapPin className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>{selectedEmployee.location || 'Remote/Office'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#172033]">
                    <Calendar className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>Joined: {selectedEmployee.date_of_joining}</span>
                  </div>
                </div>
              </div>

              {/* Leave Balances */}
              {selectedEmployee.leave_balances && (
                <div className="border border-[#E2E8F0] rounded-xl p-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#64748B] mb-2">
                    Available Leave Balance
                  </h4>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-2.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                      <span className="text-[10px] text-[#64748B]">Annual</span>
                      <p className="font-bold text-base text-[#2563EB]">
                        {selectedEmployee.leave_balances.annual}
                      </p>
                    </div>
                    <div className="p-2.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                      <span className="text-[10px] text-[#64748B]">Sick</span>
                      <p className="font-bold text-base text-[#D97706]">
                        {selectedEmployee.leave_balances.sick}
                      </p>
                    </div>
                    <div className="p-2.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                      <span className="text-[10px] text-[#64748B]">Casual</span>
                      <p className="font-bold text-base text-[#16A34A]">
                        {selectedEmployee.leave_balances.casual}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Skills */}
              {selectedEmployee.skills && selectedEmployee.skills.length > 0 && (
                <div className="border border-[#E2E8F0] rounded-xl p-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#64748B] mb-2">
                    Professional Skills
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedEmployee.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-[#F1F5F9] text-[#172033] rounded-md font-medium text-[11px] border border-[#E2E8F0]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sensitive Salary info only if visible by role */}
              {selectedEmployee.salary && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                  <span className="font-semibold text-[#2563EB]">Base Compensation</span>
                  <span className="font-mono font-bold text-sm text-[#2563EB]">
                    ${selectedEmployee.salary.toLocaleString()} / year
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal (HR Only) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h3 className="text-base font-bold text-[#172033]">Provision New Employee Profile</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#172033] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-[#DC2626] text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateEmployee} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-[#172033]">Employee ID (Optional)</label>
                <input
                  type="text"
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value.toUpperCase() })}
                  placeholder="Leave blank for auto-generated sequential ID (e.g. EMP0186)"
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] outline-none font-mono focus:border-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-[#172033]">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] outline-none focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#172033]">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#172033]">Corporate Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="employee@company.com"
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-[#172033]">Department *</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] outline-none focus:border-[#2563EB]"
                  >
                    {departmentsList.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#172033]">Designation *</label>
                  <input
                    type="text"
                    required
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-[#172033]">Base Salary ($/yr)</label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] outline-none focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#172033]">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#172033]">Skills (Comma separated)</label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  placeholder="Python, React, SQL..."
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white text-[#172033] outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-xs font-semibold hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#172033] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-xs font-bold hover:bg-[#1D4ED8] cursor-pointer disabled:opacity-50 shadow-sm shadow-blue-500/20"
                >
                  {formLoading ? 'Creating...' : 'Provision Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Update Quick Modal (HR Only) */}
      {statusUpdateTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className="font-bold text-sm text-[#172033] mb-1">
              Update Status: {statusUpdateTarget.full_name}
            </h3>
            <p className="text-xs text-[#64748B] mb-4">
              Select new employment status to synchronize account access.
            </p>

            <div className="space-y-2">
              {['Active', 'On Leave', 'Inactive'].map((st) => (
                <button
                  key={st}
                  onClick={() => handleStatusChange(statusUpdateTarget.employee_id, st)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                    statusUpdateTarget.employment_status === st
                      ? 'border-[#2563EB] bg-blue-50 text-[#2563EB]'
                      : 'border-[#E2E8F0] text-[#172033] hover:bg-[#F1F5F9]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex justify-end">
              <button
                onClick={() => setStatusUpdateTarget(null)}
                className="px-3 py-1.5 text-xs text-[#64748B] hover:text-[#172033] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
