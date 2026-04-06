'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { twMerge } from 'tailwind-merge'
import { clsx } from 'clsx'

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs))
}

interface User {
  id: string
  username: string
  nickname?: string
  avatar_url?: string
}

interface Project {
  id: string
  title: string
  subject?: string
  description?: string
}

interface Comment {
  id: string
  content: string
  createdAt: string
  user: User
}

interface Work {
  id: string
  title: string
  description?: string
  coverImageUrl?: string
  content?: string
  status: string
  score: number
  projectId: string
  userId: string
  createdAt: string
  updatedAt: string
  user: User
  project: Project
  comments: Comment[]
  likes: { id: string; userId: string }[]
}

interface WorkApi {
  work: Work
}

export default function WorkDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [work, setWork] = useState<Work | null>(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  const workId = params.id as string

  // Fetch work details
  const fetchWork = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/works/${workId}`)
      if (res.ok) {
        const data: WorkApi = await res.json()
        setWork(data.work)
        setLikeCount(data.work.likes.length)
      } else if (res.status === 404) {
        router.push('/works')
      }
    } catch (err) {
      console.error('Failed to fetch work:', err)
    } finally {
      setLoading(false)
    }
  }, [workId, router])

  useEffect(() => {
    if (workId) {
      fetchWork()
    }
  }, [workId, fetchWork])

  // Handle like
  const handleLike = async () => {
    if (!work) return

    try {
      // TODO: Implement like API
      const newLiked = !liked
      setLiked(newLiked)
      setLikeCount(prev => newLiked ? prev + 1 : prev - 1)
    } catch (err) {
      console.error('Failed to toggle like:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (!work) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link
            href="/works"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回作品列表
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1
                data-testid="work-detail-title"
                className="text-2xl font-bold text-gray-900 mb-2"
              >
                {work.title}
              </h1>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                  {work.project.title}
                </span>
                {work.project.subject && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {work.project.subject}
                  </span>
                )}
              </div>
            </div>

            {/* Like Button */}
            <button
              data-testid="like-work-btn"
              onClick={handleLike}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full transition-colors',
                liked
                  ? 'bg-red-100 text-red-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              <svg
                className="w-5 h-5"
                fill={liked ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span data-testid="like-count">{likeCount}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Cover Image */}
          {work.coverImageUrl && (
            <div className="w-full h-64 bg-gray-100 overflow-hidden">
              <img
                src={work.coverImageUrl}
                alt={work.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-6">
            {/* Author Info */}
            <div
              data-testid="work-detail-author"
              className="flex items-center gap-3 pb-4 border-b border-gray-200 mb-6"
            >
              {work.user.avatar_url ? (
                <img
                  src={work.user.avatar_url}
                  alt={work.user.nickname || work.user.username}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-indigo-600 text-sm font-medium">
                    {work.user.nickname?.[0] || work.user.username[0]}
                  </span>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {work.user.nickname || work.user.username}
                </p>
                <p className="text-xs text-gray-500">
                  发表于 {new Date(work.createdAt).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {/* Description */}
            {work.description && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">作品简介</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{work.description}</p>
              </div>
            )}

            {/* Content */}
            {work.content && (
              <div
                data-testid="work-detail-content"
                className="mb-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-2">作品内容</h2>
                <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                  {work.content}
                </div>
              </div>
            )}

            {/* Score (if available) */}
            {work.score > 0 && (
              <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">作品评分</h2>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-yellow-600">{work.score}</span>
                  <span className="text-gray-600">分</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            评论 ({work.comments.length})
          </h2>

          {work.comments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">暂无评论</p>
          ) : (
            <div className="space-y-4">
              {work.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="flex gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                >
                  {comment.user.avatar_url ? (
                    <img
                      src={comment.user.avatar_url}
                      alt={comment.user.nickname || comment.user.username}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-600 text-xs font-medium">
                        {comment.user.nickname?.[0] || comment.user.username[0]}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {comment.user.nickname || comment.user.username}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comment Input */}
          <div className="mt-6">
            <textarea
              name="comment"
              placeholder="写下你的评论..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              rows={3}
            />
            <button
              className="mt-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
            >
              发表评论
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
