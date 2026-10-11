import React, { useState, useEffect } from 'react';
import { notificationsApi } from '../../api/notifications';
import type { NotificationItem } from '../../types/api';
import { Bell, CheckCheck, Clock } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await notificationsApi.getNotifications(unreadOnly, 50);
      setNotifications(data.items || []);
      setUnreadCount(data.unread_count || 0);
    } catch (err: any) {
      console.error('Failed to load notifications:', err);
      setError('Unable to load notification feed from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [unreadOnly]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E2E8F0]">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172033]">
            Notification Center
          </h2>
          <p className="text-xs text-[#64748B] mt-1 font-medium">
            System announcements, leave decisions, timesheet updates, and roster alerts
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E2E8F0] bg-white text-[#2563EB] hover:bg-blue-50 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between text-xs text-[#DC2626] font-medium">
          <span>{error}</span>
          <button
            onClick={fetchNotifications}
            className="px-3 py-1 bg-[#2563EB] text-white text-xs font-bold rounded-lg hover:bg-[#1D4ED8] cursor-pointer shadow-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2 text-xs">
        <div className="flex gap-4 font-semibold">
          <button
            onClick={() => setUnreadOnly(false)}
            className={`cursor-pointer pb-2 transition-all font-medium ${
              !unreadOnly
                ? 'text-[#2563EB] border-b-2 border-[#2563EB] font-bold'
                : 'text-[#64748B] hover:text-[#172033]'
            }`}
          >
            All Notifications
          </button>
          <button
            onClick={() => setUnreadOnly(true)}
            className={`cursor-pointer pb-2 transition-all font-medium flex items-center gap-1.5 ${
              unreadOnly
                ? 'text-[#2563EB] border-b-2 border-[#2563EB] font-bold'
                : 'text-[#64748B] hover:text-[#172033]'
            }`}
          >
            <span>Unread Only</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 text-[#DC2626] font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl divide-y divide-[#E2E8F0] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-[#64748B] font-medium">Loading notification feed...</div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#64748B]">
            <Bell className="w-10 h-10 mx-auto text-[#CBD5E1] mb-2" />
            <p className="font-bold text-[#172033]">No notifications to display</p>
            <p className="text-[#64748B] mt-0.5">You're completely up to date.</p>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.notification_id}
              className={`p-4 transition-colors flex items-start justify-between gap-4 ${
                !item.is_read ? 'bg-blue-50/30 border-l-4 border-l-[#2563EB]' : 'hover:bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    !item.is_read ? 'bg-[#2563EB]' : 'bg-[#CBD5E1]'
                  }`}
                />
                <div>
                  <h4 className="text-xs font-bold text-[#172033]">{item.title}</h4>
                  <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed font-medium">{item.message}</p>
                  <div className="flex items-center gap-1 text-[10px] text-[#94A3B8] mt-2 font-medium">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(item.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {!item.is_read && (
                <button
                  onClick={() => handleMarkAsRead(item.notification_id)}
                  className="px-2.5 py-1 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:bg-blue-50 rounded-md transition-colors cursor-pointer shrink-0"
                >
                  Mark as read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
