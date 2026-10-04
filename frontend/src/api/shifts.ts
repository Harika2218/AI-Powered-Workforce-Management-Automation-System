import { apiClient } from './client';
import type { Shift } from '../types/api';

export interface ShiftAssignmentPayload {
  employee_id: string;
  shift_id: string;
  effective_from: string;
}

export const shiftsApi = {
  getShifts: async (): Promise<Shift[]> => {
    const res = await apiClient.get<Shift[]>('/shifts');
    return res.data;
  },

  createShift: async (data: Omit<Shift, 'duration_hours'>): Promise<Shift> => {
    const res = await apiClient.post<Shift>('/shifts', data);
    return res.data;
  },

  assignShift: async (payload: ShiftAssignmentPayload): Promise<{ message: string }> => {
    const res = await apiClient.post<{ message: string }>('/shifts/assignments', payload);
    return res.data;
  },

  getMyShift: async (): Promise<Shift | null> => {
    const res = await apiClient.get<Shift | null>('/shifts/my');
    return res.data;
  },

  getTeamShifts: async (): Promise<Array<{ employee_id: string; employee_name: string; department: string; shift: Shift }>> => {
    const res = await apiClient.get<Array<{ employee_id: string; employee_name: string; department: string; shift: Shift }>>('/shifts/team');
    return res.data;
  },
};
