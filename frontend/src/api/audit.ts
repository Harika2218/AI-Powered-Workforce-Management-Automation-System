import { apiClient } from './client';
import type { AuditLogItem } from '../types/api';

export interface AuditLogParams {
  action?: string;
  entity_type?: string;
  user_id?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedAuditLogsResponse {
  items: AuditLogItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export const auditApi = {
  getAuditLogs: async (params?: AuditLogParams): Promise<PaginatedAuditLogsResponse> => {
    const res = await apiClient.get<PaginatedAuditLogsResponse>('/audit-logs', { params });
    return res.data;
  },
};
