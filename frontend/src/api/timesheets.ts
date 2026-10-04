import { apiClient } from './client';
import type { TimesheetRecord } from '../types/api';

export interface SubmitTimesheetPayload {
  week_start_date: string;
  daily_hours: Record<string, number>;
  notes?: string;
}

export interface PaginatedTimesheetsResponse {
  items: TimesheetRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export const timesheetsApi = {
  submitTimesheet: async (payload: SubmitTimesheetPayload): Promise<TimesheetRecord> => {
    const res = await apiClient.post<TimesheetRecord>('/timesheets', payload);
    return res.data;
  },

  getMyTimesheets: async (params?: { page?: number; page_size?: number }): Promise<PaginatedTimesheetsResponse> => {
    const res = await apiClient.get<PaginatedTimesheetsResponse>('/timesheets/my', { params });
    return res.data;
  },

  getPendingTimesheets: async (params?: { page?: number; page_size?: number }): Promise<PaginatedTimesheetsResponse> => {
    const res = await apiClient.get<PaginatedTimesheetsResponse>('/timesheets/pending', { params });
    return res.data;
  },

  approveTimesheet: async (timesheetId: string, comments?: string): Promise<TimesheetRecord> => {
    const res = await apiClient.post<TimesheetRecord>(`/timesheets/${timesheetId}/approve`, { comments: comments || '' });
    return res.data;
  },

  rejectTimesheet: async (timesheetId: string, reason: string): Promise<TimesheetRecord> => {
    const res = await apiClient.post<TimesheetRecord>(`/timesheets/${timesheetId}/reject`, { reason });
    return res.data;
  },

  listTimesheets: async (params?: { department?: string; status?: string; page?: number; page_size?: number }): Promise<PaginatedTimesheetsResponse> => {
    const res = await apiClient.get<PaginatedTimesheetsResponse>('/timesheets', { params });
    return res.data;
  },
};
