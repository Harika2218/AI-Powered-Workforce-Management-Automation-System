import { apiClient } from './client';
import type { NotificationItem } from '../types/api';

export const notificationsApi = {
  getNotifications: async (unreadOnly: boolean = false, limit: number = 50): Promise<{ items: NotificationItem[]; unread_count: number }> => {
    const res = await apiClient.get<{ items: NotificationItem[]; unread_count: number }>('/notifications', {
      params: { unread_only: unreadOnly, limit },
    });
    return res.data;
  },

  markAsRead: async (notificationId: string): Promise<NotificationItem> => {
    const res = await apiClient.patch<NotificationItem>(`/notifications/${notificationId}/read`);
    return res.data;
  },

  markAllAsRead: async (): Promise<{ message: string; modified_count: number }> => {
    const res = await apiClient.patch<{ message: string; modified_count: number }>('/notifications/read-all');
    return res.data;
  },
};
