import { apiClient } from './client';
import type { Employee } from '../types/api';

export interface GetEmployeesParams {
  search?: string;
  department?: string;
  status?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedEmployeesResponse {
  items: Employee[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export const employeesApi = {
  getEmployees: async (params?: GetEmployeesParams): Promise<PaginatedEmployeesResponse> => {
    const res = await apiClient.get<PaginatedEmployeesResponse>('/employees', { params });
    return res.data;
  },

  getEmployeeById: async (employeeId: string): Promise<Employee> => {
    const res = await apiClient.get<Employee>(`/employees/${employeeId}`);
    return res.data;
  },

  createEmployee: async (data: Partial<Employee>): Promise<Employee> => {
    const res = await apiClient.post<Employee>('/employees', data);
    return res.data;
  },

  updateEmployee: async (employeeId: string, data: Partial<Employee>): Promise<Employee> => {
    const res = await apiClient.put<Employee>(`/employees/${employeeId}`, data);
    return res.data;
  },

  updateStatus: async (employeeId: string, payload: { employment_status: string; reason?: string }): Promise<Employee> => {
    const res = await apiClient.patch<Employee>(`/employees/${employeeId}/status`, payload);
    return res.data;
  },

  updateOwnProfile: async (data: { phone?: string; location?: string; skills?: string[] }): Promise<Employee> => {
    const res = await apiClient.patch<Employee>('/employees/profile/me', data);
    return res.data;
  },
};
