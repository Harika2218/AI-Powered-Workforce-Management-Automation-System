import { apiClient } from './client';
import type { HRDashboardData, ManagerDashboardData, EmployeeDashboardData } from '../types/api';

export const dashboardsApi = {
  getHRDashboard: async (): Promise<HRDashboardData> => {
    const res = await apiClient.get<HRDashboardData>('/dashboards/hr');
    return res.data;
  },

  getManagerDashboard: async (): Promise<ManagerDashboardData> => {
    const res = await apiClient.get<ManagerDashboardData>('/dashboards/manager');
    return res.data;
  },

  getEmployeeDashboard: async (): Promise<EmployeeDashboardData> => {
    const res = await apiClient.get<EmployeeDashboardData>('/dashboards/employee');
    return res.data;
  },
};
