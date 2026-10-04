import { apiClient } from './client';

export const analyticsApi = {
  getAttendanceAnalytics: async (params?: { date_from?: string; date_to?: string; department?: string }) => {
    const res = await apiClient.get('/analytics/attendance', { params });
    return res.data;
  },

  getLeaveAnalytics: async () => {
    const res = await apiClient.get('/analytics/leave');
    return res.data;
  },

  getWorkforceAnalytics: async () => {
    const res = await apiClient.get('/analytics/workforce');
    return res.data;
  },

  getOvertimeAnalytics: async () => {
    const res = await apiClient.get('/analytics/overtime');
    return res.data;
  },

  getPerformanceAnalytics: async () => {
    const res = await apiClient.get('/analytics/performance');
    return res.data;
  },
};
