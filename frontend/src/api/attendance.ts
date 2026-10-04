import { apiClient } from './client';
import type { AttendanceRecord, AttendanceAnomaly } from '../types/api';

export interface AttendanceFilterParams {
  employee_id?: string;
  department?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedAttendanceResponse {
  items: AttendanceRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export const attendanceApi = {
  checkIn: async (payload?: { work_mode?: 'office' | 'remote' | 'hybrid'; notes?: string }) => {
    const res = await apiClient.post('/attendance/check-in', payload || {});
    return res.data;
  },

  checkOut: async (payload?: { notes?: string }) => {
    const res = await apiClient.post('/attendance/check-out', payload || {});
    return res.data;
  },

  getMyAttendance: async (params?: { date_from?: string; date_to?: string; page?: number; page_size?: number }): Promise<PaginatedAttendanceResponse> => {
    const res = await apiClient.get<PaginatedAttendanceResponse>('/attendance/my', { params });
    return res.data;
  },

  getAnomalies: async (limit: number = 20): Promise<AttendanceAnomaly[]> => {
    const res = await apiClient.get<AttendanceAnomaly[]>('/attendance/anomalies', { params: { limit } });
    return res.data;
  },

  getEmployeeAttendance: async (employeeId: string, params?: { date_from?: string; date_to?: string; page?: number; page_size?: number }): Promise<PaginatedAttendanceResponse> => {
    const res = await apiClient.get<PaginatedAttendanceResponse>(`/attendance/${employeeId}`, { params });
    return res.data;
  },

  listAttendance: async (params?: AttendanceFilterParams): Promise<PaginatedAttendanceResponse> => {
    const res = await apiClient.get<PaginatedAttendanceResponse>('/attendance', { params });
    return res.data;
  },
};
