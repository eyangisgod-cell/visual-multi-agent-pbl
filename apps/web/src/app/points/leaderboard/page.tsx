'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface LeaderboardItem {
  rank: number
  userId: string
  nickname: string
  avatarUrl: string | null
  points: number
  level: number
}

interface LeaderboardResponse {
  leaderboard: LeaderboardItem[]
  total: number
  period: string
  scope: string
  message?: string
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [scope, setScope] = useState<'all' | 'friends'>('all')

  useEffect(() => {
    fetchLeaderboard()
  }, [scope])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/points/leaderboard?scope=${scope}&limit=50`)
      if (res.ok) {
        const data: LeaderboardResponse = await res.json()
        setLeaderboard(data.leaderboard)
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回首页
          </Link>

          <h1
            data-testid="leaderboard-title"
            className="text-2xl font-bold text-gray-900"
          >
            积分排行榜
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Scope Toggle */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setScope('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              scope === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            全站排行榜
          </button>
          <button
            onClick={() => setScope('friends')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              scope === 'friends'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            好友排行榜
          </button>
        </div>

        {/* Leaderboard List */}
        <div
          data-testid="leaderboard-list"
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : leaderboard.length === 0 ? (
            <div
              data-testid="empty-friends-message"
              className="p-8 text-center text-gray-500"
            >
              {scope === 'friends' ? '暂无好友，快去添加好友吧！' : '暂无数据'}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {leaderboard.map((item) => (
                <div
                  key={item.userId}
                  data-testid="leaderboard-item"
                  className={`flex items-center gap-4 p-4 ${
                    item.rank <= 3 ? 'bg-yellow-50' : ''
                  }`}
                >
                  {/* Rank */}
                  <div className="flex-shrink-0 w-12 text-center">
                    {item.rank <= 3 ? (
                      <span className="text-2xl">
                        {item.rank === 1 && '🥇'}
                        {item.rank === 2 && '🥈'}
                        {item.rank === 3 && '🥉'}
                      </span>
                    ) : (
                      <span className="text-lg font-medium text-gray-600">
                        #{item.rank}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {item.avatarUrl ? (
                      <img
                        src={item.avatarUrl}
                        alt={item.nickname}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-indigo-600 font-medium">
                          {item.nickname?.[0] || 'U'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.nickname}</p>
                    <p className="text-sm text-gray-500">等级 {item.level}</p>
                  </div>

                  {/* Points */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-lg font-bold text-indigo-600">
                      {item.points} 积分
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
