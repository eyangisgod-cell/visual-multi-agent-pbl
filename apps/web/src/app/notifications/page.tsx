'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error' | 'task' | 'system' | 'achievement'
  title: string
  content: string
  isRead: boolean
  actionUrl?: string | null
  createdAt: string
  readAt?: string | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [unreadOnly, setUnreadOnly] = useState(false)

  useEffect(() => {
    fetchNotifications()
  }, [unreadOnly])

  const fetchNotifications = async () => {
    try {
      const userId = localStorage.getItem('userId')
      if (!userId) {
        router.push('/auth/login')
        return
      }

      const params = new URLSearchParams({
        userId,
        unreadOnly: unreadOnly.toString(),
      })

      const response = await fetch(`/api/notifications?${params}`)
      if (!response.ok) throw new Error('Failed to fetch notifications')

      const data = await response.json()
      setNotifications(data.notifications)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
        )
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const userId = localStorage.getItem('userId')
      const response = await fetch('/api/notifications/batch', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'mark_all_read' }),
      })

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })))
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getTypeStyles = (type: string) => {
    const styles: Record<string, string> = {
      info: 'bg-blue-100 border-blue-500',
      success: 'bg-green-100 border-green-500',
      warning: 'bg-yellow-100 border-yellow-500',
      error: 'bg-red-100 border-red-500',
      task: 'bg-purple-100 border-purple-500',
      system: 'bg-gray-100 border-gray-500',
      achievement: 'bg-amber-100 border-amber-500',
    }
    return styles[type] || styles.info
  }

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      task: '📋',
      system: '⚙️',
      achievement: '🏆',
    }
    return icons[type] || icons.info
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">通知中心</h1>
            <p className="text-gray-600 mt-1">查看您的所有通知和消息</p>
          </div>
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 text-sm text-indigo-600 hover:text-indigo-800"
          >
            全部已读
          </button>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded"
            />
            <span className="text-gray-700">只显示未读</span>
          </label>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔔</div>
              <p className="text-gray-500 text-lg">暂无通知</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border-l-4 ${getTypeStyles(notification.type)} ${
                  !notification.isRead ? 'shadow-md' : 'opacity-75'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{getTypeIcon(notification.type)}</span>
                      <span className="text-sm font-medium text-gray-500 uppercase">{notification.type}</span>
                      {!notification.isRead && (
                        <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">新</span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{notification.title}</h3>
                    <p className="text-gray-700">{notification.content}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span>{new Date(notification.createdAt).toLocaleString('zh-CN')}</span>
                      {notification.actionUrl && (
                        <a
                          href={notification.actionUrl}
                          className="text-indigo-600 hover:text-indigo-800"
                          onClick={(e) => {
                            e.preventDefault()
                            router.push(notification.actionUrl!)
                          }}
                        >
                          查看详情 →
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded"
                      >
                        标记为已读
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              上一页
            </button>
            <span className="px-4 py-2 text-gray-600">
              第 {pagination.page} / {pagination.totalPages} 页
            </span>
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
