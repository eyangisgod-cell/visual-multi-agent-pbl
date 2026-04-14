'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

// 通知类型定义
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'task' | 'system' | 'achievement';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  isRead: boolean;
  actionUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  readAt?: string | null;
}

export interface NotificationsResponse {
  notifications: Notification[];
}

// 格式化相对时间
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return date.toLocaleDateString('zh-CN');
}

// 通知类型对应的图标和样式
const notificationStyles: Record<NotificationType, { bg: string; icon: string; color: string }> = {
  info: { bg: 'bg-blue-50', icon: 'ℹ️', color: 'text-blue-600' },
  success: { bg: 'bg-green-50', icon: '✅', color: 'text-green-600' },
  warning: { bg: 'bg-yellow-50', icon: '⚠️', color: 'text-yellow-600' },
  error: { bg: 'bg-red-50', icon: '❌', color: 'text-red-600' },
  task: { bg: 'bg-purple-50', icon: '📋', color: 'text-purple-600' },
  system: { bg: 'bg-gray-50', icon: '⚙️', color: 'text-gray-600' },
  achievement: { bg: 'bg-amber-50', icon: '🏆', color: 'text-amber-600' },
};

interface NotificationCardProps {
  notification: Notification;
  onMarkRead: (id: string, isRead: boolean) => void;
  onDelete: (id: string) => void;
}

/**
 * 单个通知卡片组件
 */
export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onMarkRead,
  onDelete,
}) => {
  const style = notificationStyles[notification.type];

  return (
    <div
      className={`p-4 rounded-lg border ${
        notification.isRead ? 'bg-white border-gray-200' : `${style.bg} border-${style.color.split('-')[1]}-300`
      } transition-all duration-200 hover:shadow-md`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{style.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className={`font-semibold ${style.color} truncate`}>
              {notification.title}
            </h3>
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {formatRelativeTime(notification.createdAt)}
            </span>
          </div>
          <p className="text-gray-700 text-sm mb-2">{notification.content}</p>

          {notification.actionUrl && (
            <a
              href={notification.actionUrl}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium inline-flex items-center gap-1"
            >
              查看详情 →
            </a>
          )}

          <div className="flex items-center gap-2 mt-3">
            {!notification.isRead ? (
              <Button
                onClick={() => onMarkRead(notification.id, true)}
                variant="outline"
                size="sm"
              >
                标记已读
              </Button>
            ) : (
              <Button
                onClick={() => onMarkRead(notification.id, false)}
                variant="ghost"
                size="sm"
              >
                标记未读
              </Button>
            )}
            <Button
              onClick={() => onDelete(notification.id)}
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-800"
            >
              删除
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
}

/**
 * 通知铃铛图标组件（用于导航栏）
 */
export const NotificationBell: React.FC<NotificationBellProps> = ({ unreadCount, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      aria-label="查看通知"
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

interface NotificationCenterProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 通知中心主组件
 */
export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  userId,
  isOpen,
  onClose,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');

  const fetchNotifications = async () => {
    try {
      const params = new URLSearchParams({ userId });
      if (filter === 'unread') params.append('isRead', 'false');
      if (filter === 'read') params.append('isRead', 'true');
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const response = await fetch(`/api/notifications?${params}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data: NotificationsResponse = await response.json();
      setNotifications(data.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, filter, typeFilter, userId]);

  const handleMarkRead = async (id: string, isRead: boolean) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead }),
      });
      if (!response.ok) throw new Error('Failed to update notification');
      setNotifications(prev =>
        prev.map(n =>
          n.id === id ? { ...n, isRead, readAt: isRead ? new Date().toISOString() : null } : n
        )
      );
    } catch (error) {
      console.error('Error updating notification:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete notification');
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const response = await fetch('/api/notifications/batch', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'mark_all_read' }),
      });
      if (!response.ok) throw new Error('Failed to mark all as read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDeleteAllRead = async () => {
    try {
      const response = await fetch('/api/notifications/batch', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'delete_all_read' }),
      });
      if (!response.ok) throw new Error('Failed to delete read notifications');
      setNotifications(prev => prev.filter(n => !n.isRead));
    } catch (error) {
      console.error('Error deleting read notifications:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      <div
        className="relative w-full max-w-md bg-white h-full shadow-xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">通知中心</h2>
            <Button onClick={onClose} variant="ghost" size="sm">
              ✕
            </Button>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>未读：{unreadCount}</span>
            <div className="flex gap-2">
              <Button onClick={handleMarkAllRead} variant="outline" size="sm" disabled={unreadCount === 0}>
                全部已读
              </Button>
              <Button onClick={handleDeleteAllRead} variant="ghost" size="sm" disabled={unreadCount === notifications.length}>
                删除已读
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          <div className="flex gap-2">
            <Button
              onClick={() => setFilter('all')}
              variant={filter === 'all' ? 'primary' : 'outline'}
              size="sm"
            >
              全部
            </Button>
            <Button
              onClick={() => setFilter('unread')}
              variant={filter === 'unread' ? 'primary' : 'outline'}
              size="sm"
            >
              未读
            </Button>
            <Button
              onClick={() => setFilter('read')}
              variant={filter === 'read' ? 'primary' : 'outline'}
              size="sm"
            >
              已读
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as NotificationType | 'all')}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">所有类型</option>
              <option value="info">ℹ️ 信息</option>
              <option value="success">✅ 成功</option>
              <option value="warning">⚠️ 警告</option>
              <option value="error">❌ 错误</option>
              <option value="task">📋 任务</option>
              <option value="system">⚙️ 系统</option>
              <option value="achievement">🏆 成就</option>
            </select>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <span className="text-4xl mb-4 block">🔔</span>
              暂无通知
            </div>
          ) : (
            notifications.map(notification => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkRead}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
