import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationsApi } from '../../api/notifications';
import type { NotificationItem } from '../../types/api';
import {
  Bell,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  CheckCheck,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const { user, employee, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotificationMenu, setShowNotificationMenu] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);

  const fetchNotificationFeed = async () => {
    try {
      const data = await notificationsApi.getNotifications(false, 8);
      setNotifications(data.items || []);
      setUnreadCount(data.unread_count || 0);
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  };

  useEffect(() => {
    fetchNotificationFeed();
    const interval = setInterval(fetchNotificationFeed, 45000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Derive title from route if not explicitly supplied
  const derivePageTitle = () => {
    if (title) return title;
    const path = location.pathname;
    if (path.includes('/workforce') || path.includes('/team')) return 'Workforce Directory';
    if (path.includes('/attendance')) return 'Attendance & Time Tracking';
    if (path.includes('/leave')) return 'Leave Management';
    if (path.includes('/shifts')) return 'Shift Scheduling';
    if (path.includes('/timesheets')) return 'Timesheet Reviews';
    if (path.includes('/payroll')) return 'Payroll & Compensation';
    if (path.includes('/performance')) return 'Performance Evaluations';
    if (path.includes('/analytics')) return 'Workforce Analytics';
    if (path.includes('/ai-assistant')) return 'HR Database Intelligence Assistant';
    if (path.includes('/audit')) return 'Compliance & Audit Logs';
    if (path.includes('/profile')) return 'My Employee Profile';
    if (path.includes('/notifications')) return 'Notification Center';
    return role === 'HR' ? 'Organization Overview' : role === 'MANAGER' ? 'Team Leadership Dashboard' : 'Personal Workspace';
  };

  const roleBadgeStyle = () => {
    if (role === 'HR') return 'bg-[#46513F]/10 text-[#46513F] border-[#46513F]/20';
    if (role === 'MANAGER') return 'bg-[#71806B]/10 text-[#71806B] border-[#71806B]/25';
    return 'bg-[#78756F]/10 text-[#242321] border-[#D8D4CC]';
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FFFDF9]/95 backdrop-blur-md border-b border-[#D8D4CC] px-6 py-3.5 transition-all">
      <div className="flex items-center justify-between">
        {/* Left: Page Title & Breadcrumb */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#242321]">
              {derivePageTitle()}
            </h1>
            <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${roleBadgeStyle()}`}>
              {role || 'USER'}
            </span>
          </div>
          <p className="text-xs text-[#78756F] mt-0.5">
            {subtitle || 'AI-Powered Workforce Automation System'}
          </p>
        </div>

        {/* Right: Actions, Notifications, Profile */}
        <div className="flex items-center gap-3">
          {/* AI Quick Query Button */}
          <button
            onClick={() => navigate(`/${role?.toLowerCase()}/ai-assistant`)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#71806B]/40 bg-[#71806B]/5 text-[#46513F] text-xs font-semibold hover:bg-[#71806B]/15 transition-colors cursor-pointer"
            title="Ask HR AI Assistant"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#71806B]" />
            <span>AI Assistant</span>
          </button>

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotificationMenu(!showNotificationMenu);
                setShowUserMenu(false);
              }}
              className="relative p-2 rounded-lg border border-[#D8D4CC] bg-[#FFFDF9] hover:bg-[#EAE6DE]/50 text-[#242321] transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 text-[#242321]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-[#C8755A] text-[10px] font-bold text-white shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotificationMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-[#D8D4CC] bg-[#FFFDF9] shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <div className="p-3.5 border-b border-[#D8D4CC] flex items-center justify-between bg-[#F7F5F0]/60">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#242321]">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-[#C8755A]/15 text-[#C8755A] font-semibold px-1.5 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-[#71806B] hover:text-[#46513F] font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-[#D8D4CC]/40">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[#78756F]">
                      No notifications at this time
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.notification_id}
                        className={`p-3 text-xs transition-colors hover:bg-[#EAE6DE]/30 flex items-start gap-2.5 ${
                          !item.is_read ? 'bg-[#71806B]/5' : ''
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            !item.is_read ? 'bg-[#C8755A]' : 'bg-[#D8D4CC]'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#242321] truncate">{item.title}</p>
                          <p className="text-[#78756F] line-clamp-2 mt-0.5">{item.message}</p>
                          <p className="text-[10px] text-[#78756F]/80 mt-1">
                            {new Date(item.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        {!item.is_read && (
                          <button
                            onClick={(e) => handleMarkAsRead(item.notification_id, e)}
                            className="text-[11px] text-[#71806B] hover:text-[#46513F] shrink-0 font-medium cursor-pointer"
                          >
                            Read
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-[#D8D4CC] bg-[#F7F5F0]/60 text-center">
                  <button
                    onClick={() => {
                      setShowNotificationMenu(false);
                      navigate(`/${role?.toLowerCase()}/notifications`);
                    }}
                    className="text-xs text-[#46513F] font-semibold hover:underline cursor-pointer"
                  >
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Trigger */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotificationMenu(false);
              }}
              className="flex items-center gap-2 p-1.5 pl-2 rounded-lg border border-[#D8D4CC] bg-[#FFFDF9] hover:bg-[#EAE6DE]/40 transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-[#46513F] text-white flex items-center justify-center text-xs font-bold">
                {employee?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="hidden md:block text-left pr-1">
                <p className="text-xs font-semibold text-[#242321] leading-tight">
                  {employee?.full_name || user?.email?.split('@')[0]}
                </p>
                <p className="text-[10px] text-[#78756F] leading-tight capitalize">
                  {employee?.designation || role}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#78756F]" />
            </button>

            {/* Profile Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#D8D4CC] bg-[#FFFDF9] shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-[#D8D4CC]/60 mb-1">
                  <p className="text-xs font-semibold text-[#242321]">
                    {employee?.full_name || 'Account'}
                  </p>
                  <p className="text-[11px] text-[#78756F] truncate">{user?.email}</p>
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-[#46513F]">
                    <ShieldCheck className="w-3 h-3" />
                    <span className="font-semibold">{role} Portal</span>
                  </div>
                </div>

                {role === 'EMPLOYEE' && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/employee/profile');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#242321] hover:bg-[#EAE6DE]/50 rounded-lg transition-colors cursor-pointer"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-[#78756F]" />
                    <span>My Profile</span>
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#C8755A] hover:bg-[#C8755A]/10 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="font-semibold">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
