import React, { useState, useEffect } from 'react';
import { notificationsApi } from '../../api/notifications';
import type { NotificationItem } from '../../types/api';
import { Bell, CheckCheck, Clock } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationsApi.getNotifications(unreadOnly, 50);
      setNotifications(data.items || []);
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#242321]">
            Notification Center
          </h2>
          <p className="text-xs text-[#78756F] mt-1">
            System announcements, leave decisions, timesheet updates, and roster alerts
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#D8D4CC] bg-[#FFFDF9] text-[#46513F] text-xs font-semibold rounded-lg hover:bg-[#EAE6DE] cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center justify-between border-b border-[#D8D4CC] pb-3 text-xs">
        <div className="flex gap-4 font-semibold">
          <button
            onClick={() => setUnreadOnly(false)}
            className={`cursor-pointer ${!unreadOnly ? 'text-[#46513F] underline underline-offset-8 font-bold' : 'text-[#78756F]'}`}
          >
            All Notifications
          </button>
          <button
            onClick={() => setUnreadOnly(true)}
            className={`cursor-pointer ${unreadOnly ? 'text-[#46513F] underline underline-offset-8 font-bold' : 'text-[#78756F]'}`}
          >
            Unread Only ({unreadCount})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-[#FFFDF9] border border-[#D8D4CC] rounded-2xl divide-y divide-[#D8D4CC]/50 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-[#78756F]">Loading notification feed...</div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#78756F]">
            <Bell className="w-8 h-8 mx-auto text-[#D8D4CC] mb-2" />
            <p className="font-semibold text-[#242321]">No notifications to display</p>
            <p className="text-[#78756F] mt-0.5">You're completely up to date.</p>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.notification_id}
              className={`p-4 transition-colors flex items-start justify-between gap-4 ${
                !item.is_read ? 'bg-[#71806B]/5' : 'hover:bg-[#EAE6DE]/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                    !item.is_read ? 'bg-[#C8755A]' : 'bg-[#D8D4CC]'
                  }`}
                />
                <div>
                  <h4 className="text-xs font-bold text-[#242321]">{item.title}</h4>
                  <p className="text-xs text-[#78756F] mt-0.5 leading-relaxed">{item.message}</p>
                  <div className="flex items-center gap-1 text-[10px] text-[#78756F]/80 mt-2">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(item.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {!item.is_read && (
                <button
                  onClick={() => handleMarkAsRead(item.notification_id)}
                  className="px-2.5 py-1 text-xs font-semibold text-[#71806B] hover:text-[#46513F] hover:bg-[#EAE6DE] rounded-md transition-colors cursor-pointer shrink-0"
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
