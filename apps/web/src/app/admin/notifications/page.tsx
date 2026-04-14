'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { NotificationCenter, Notification, NotificationType } from '@/components/notifications/NotificationCenter';

interface User {
  id: string;
  username: string;
  nickname: string;
}

const notificationTypes: NotificationType[] = ['info', 'success', 'warning', 'error', 'task', 'system', 'achievement'];

export default function NotificationsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    userId: '',
    type: 'info' as NotificationType,
    title: '',
    content: '',
    actionUrl: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users?limit=100');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.userId || !form.title || !form.content) {
      setMessage({ type: 'error', text: '请填写必填项' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: form.userId,
          type: form.type,
          title: form.title,
          content: form.content,
          actionUrl: form.actionUrl || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '发送失败');
      }

      setMessage({ type: 'success', text: '通知发送成功！' });
      setForm({ userId: '', type: 'info', title: '', content: '', actionUrl: '' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : '发送失败' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenUserNotifications = () => {
    if (!selectedUserId) {
      setMessage({ type: 'error', text: '请先选择用户' });
      return;
    }
    setShowNotificationCenter(true);
  };

  return (
    <AdminLayout>
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">通知管理</h1>
          <p className="text-gray-600">发送系统通知给用户</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Send Notification Form */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">发送通知</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-1">
                  选择用户 <span className="text-red-500">*</span>
                </label>
                <select
                  id="user"
                  value={form.userId}
                  onChange={(e) => {
                    setForm({ ...form, userId: e.target.value });
                    setSelectedUserId(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">请选择用户</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.nickname} (@{user.username})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  通知类型
                </label>
                <select
                  id="type"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as NotificationType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {notificationTypes.map((type) => (
                    <option key={type} value={type}>
                      {type === 'info' && 'ℹ️'}
                      {type === 'success' && '✅'}
                      {type === 'warning' && '⚠️'}
                      {type === 'error' && '❌'}
                      {type === 'task' && '📋'}
                      {type === 'system' && '⚙️'}
                      {type === 'achievement' && '🏆'}
                      {' '}{type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="标题"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="输入通知标题"
                required
              />

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                  内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="content"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="输入通知内容"
                  required
                />
              </div>

              <Input
                label="行动链接（可选）"
                value={form.actionUrl}
                onChange={(e) => setForm({ ...form, actionUrl: e.target.value })}
                placeholder="/tasks/task-123 或 https://..."
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={submitting}
                className="w-full"
              >
                发送通知
              </Button>
            </form>
          </div>

          {/* View User Notifications */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">查看用户通知</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="view-user" className="block text-sm font-medium text-gray-700 mb-1">
                  选择用户
                </label>
                <select
                  id="view-user"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">请选择用户</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.nickname} (@{user.username})
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-sm text-gray-600">
                选择用户后点击下方按钮，可以在通知中心查看该用户的所有通知。
              </p>

              <Button
                onClick={handleOpenUserNotifications}
                variant="primary"
                size="lg"
                className="w-full"
                disabled={!selectedUserId}
              >
                打开通知中心
              </Button>
            </div>

            {/* Notification Types Reference */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">通知类型说明</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span>ℹ️</span>
                  <span className="text-gray-600">信息 - 普通通知</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>✅</span>
                  <span className="text-gray-600">成功 - 操作成功</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>⚠️</span>
                  <span className="text-gray-600">警告 - 需要注意</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>❌</span>
                  <span className="text-gray-600">错误 - 错误信息</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📋</span>
                  <span className="text-gray-600">任务 - 任务相关</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>⚙️</span>
                  <span className="text-gray-600">系统 - 系统通知</span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <span>🏆</span>
                  <span className="text-gray-600">成就 - 成就/奖励</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Center Modal */}
      {showNotificationCenter && selectedUserId && (
        <NotificationCenter
          userId={selectedUserId}
          isOpen={showNotificationCenter}
          onClose={() => setShowNotificationCenter(false)}
        />
      )}
    </AdminLayout>
  );
}
