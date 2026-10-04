import { apiClient } from './client';
import type { LeaveRecord } from '../types/api';

export interface ApplyLeavePayload {
  leave_type: 'Annual' | 'Sick' | 'Casual' | 'annual' | 'sick' | 'casual';
  start_date: string;
  end_date: string;
  reason: string;
  employee_id?: string;
}

export interface PaginatedLeaveResponse {
  items: LeaveRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export const leaveApi = {
  applyLeave: async (payload: ApplyLeavePayload): Promise<LeaveRecord> => {
    const res = await apiClient.post<LeaveRecord>('/leave', payload);
    return res.data;
  },

  getMyLeave: async (params?: { status?: string; page?: number; page_size?: number }): Promise<PaginatedLeaveResponse> => {
    const res = await apiClient.get<PaginatedLeaveResponse>('/leave/my', { params });
    return res.data;
  },

  getPendingLeave: async (params?: { page?: number; page_size?: number }): Promise<PaginatedLeaveResponse> => {
    const res = await apiClient.get<PaginatedLeaveResponse>('/leave/pending', { params });
    return res.data;
  },

  approveLeave: async (requestId: string, comments?: string): Promise<LeaveRecord> => {
    const res = await apiClient.post<LeaveRecord>(`/leave/${requestId}/approve`, { comments: comments || '' });
    return res.data;
  },

  rejectLeave: async (requestId: string, reason: string): Promise<LeaveRecord> => {
    const res = await apiClient.post<LeaveRecord>(`/leave/${requestId}/reject`, { reason });
    return res.data;
  },

  cancelLeave: async (requestId: string): Promise<LeaveRecord> => {
    const res = await apiClient.post<LeaveRecord>(`/leave/${requestId}/cancel`);
    return res.data;
  },

  listLeave: async (params?: { department?: string; status?: string; leave_type?: string; page?: number; page_size?: number }): Promise<PaginatedLeaveResponse> => {
    const res = await apiClient.get<PaginatedLeaveResponse>('/leave', { params });
    return res.data;
  },

  getBalances: async (employeeId: string): Promise<{ annual: number; sick: number; casual: number }> => {
    const res = await apiClient.get<{ annual: number; sick: number; casual: number }>(`/leave/balances/${employeeId}`);
    return res.data;
  },
};
