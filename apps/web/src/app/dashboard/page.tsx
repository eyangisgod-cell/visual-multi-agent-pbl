'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  nickname: string | null
  avatarUrl: string | null
  points: number
  level: number
  grade: number | null
  memberSince: string
}

interface Stats {
  totalWorks: number
  completedProjects: number
  learningMinutes: number
  achievements: number
}

interface LevelInfo {
  name: string
  minPoints: number
  maxPoints: number | null
  privileges: any
}

interface PointsActivity {
  id: string
  points: number
  balance: number
  action: string
  description: string
  createdAt: string
}

export default function LearningDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{
    user: User
    stats: Stats
    levelInfo: LevelInfo | null
    recentPointsActivity: PointsActivity[]
  } | null>(null)

  useEffect(() => {
    fetchLearningStats()
  }, [])

  const fetchLearningStats = async () => {
    try {
      const userId = localStorage.getItem('userId')
      if (!userId) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`/api/analytics/learning-stats?userId=${userId}`)
      if (!response.ok) throw new Error('Failed to fetch stats')

      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching learning stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">加载中...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-500">无法加载数据</div>
      </div>
    )
  }

  const { user, stats, levelInfo, recentPointsActivity } = data

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📊 学习数据仪表板</h1>
          <p className="text-gray-600">查看您的学习进度和成就</p>
        </div>

        {/* User Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-4xl">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.nickname || 'User'} className="w-full h-full rounded-full object-cover" />
              ) : (
                '👤'
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{user.nickname || '未设置昵称'}</h2>
              <p className="text-gray-600">
                等级：{levelInfo?.name || `Lv.${user.level}`} | 积分：{user.points}
              </p>
              <p className="text-sm text-gray-500">
                加入时间：{new Date(user.memberSince).toLocaleDateString('zh-CN')}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-indigo-600">Lv.{user.level}</div>
              <div className="text-sm text-gray-500">当前等级</div>
            </div>
          </div>

          {/* Level Progress Bar */}
          {levelInfo && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>进度：{levelInfo.minPoints} - {levelInfo.maxPoints || '∞'} 积分</span>
                <span>{user.points} / {levelInfo.maxPoints || '∞'}</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                  style={{
                    width: levelInfo.maxPoints
                      ? `${Math.min(100, ((user.points - levelInfo.minPoints) / (levelInfo.maxPoints - levelInfo.minPoints)) * 100)}%`
                      : '100%'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            icon="📁"
            title="作品总数"
            value={stats.totalWorks}
            color="from-blue-500 to-cyan-500"
          />
          <StatCard
            icon="✅"
            title="完成项目"
            value={stats.completedProjects}
            color="from-green-500 to-emerald-500"
          />
          <StatCard
            icon="⏱️"
            title="学习时长"
            value={`${stats.learningMinutes} 分钟`}
            color="from-orange-500 to-amber-500"
          />
          <StatCard
            icon="🏆"
            title="成就数量"
            value={stats.achievements}
            color="from-purple-500 to-pink-500"
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📈 积分动态</h3>
            {recentPointsActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无积分记录</p>
            ) : (
              <div className="space-y-3">
                {recentPointsActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{activity.description}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(activity.createdAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    <div
                      className={`text-lg font-bold ${
                        activity.points > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {activity.points > 0 ? '+' : ''}
                      {activity.points}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">🚀 快速操作</h3>
            <div className="space-y-3">
              <QuickActionCard
                icon="📝"
                title="创建新作品"
                description="分享你的项目成果"
                onClick={() => router.push('/works/new')}
              />
              <QuickActionCard
                icon="📚"
                title="浏览项目"
                description="探索更多学习内容"
                onClick={() => router.push('/projects')}
              />
              <QuickActionCard
                icon="🏅"
                title="查看积分规则"
                description="了解如何赚取积分"
                onClick={() => router.push('/points')}
              />
              <QuickActionCard
                icon="🔔"
                title="通知中心"
                description="查看系统通知"
                onClick={() => router.push('/notifications')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  title,
  value,
  color,
}: {
  icon: string
  title: string
  value: number | string
  color: string
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-2xl mb-4`}>
        {icon}
      </div>
      <p className="text-gray-600 text-sm mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

function QuickActionCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: string
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
    >
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </button>
  )
}
