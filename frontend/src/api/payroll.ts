import { apiClient } from './client';
import type { PayrollRecord } from '../types/api';

export interface CalculatePayrollPayload {
  employee_id: string;
  month: string; // YYYY-MM
  basic_salary?: number;
  allowances?: number;
  deductions?: number;
}

export interface PaginatedPayrollResponse {
  items: PayrollRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export const payrollApi = {
  calculatePayroll: async (payload: CalculatePayrollPayload): Promise<PayrollRecord> => {
    const res = await apiClient.post<PayrollRecord>('/payroll/calculate', payload);
    return res.data;
  },

  getMyPayslips: async (year?: number, month?: number): Promise<PayrollRecord[]> => {
    const res = await apiClient.get<PayrollRecord[]>('/payroll/my', { params: { year, month } });
    return res.data;
  },

  getEmployeeStatement: async (employeeId: string, year?: number, month?: number): Promise<PayrollRecord[]> => {
    const res = await apiClient.get<PayrollRecord[]>(`/payroll/statement/${employeeId}`, { params: { year, month } });
    return res.data;
  },

  listPayroll: async (params?: { department?: string; month?: string; page?: number; page_size?: number }): Promise<PaginatedPayrollResponse> => {
    const res = await apiClient.get<PaginatedPayrollResponse>('/payroll', { params });
    return res.data;
  },
};
