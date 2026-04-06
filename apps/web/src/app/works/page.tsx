'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { twMerge } from 'tailwind-merge'
import { clsx } from 'clsx'

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs))
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
  user: {
    id: string
    username: string
    nickname?: string
    avatar_url?: string
  }
  project: {
    id: string
    title: string
    subject?: string
  }
}

interface WorksApi {
  works: Work[]
}

interface Project {
  id: string
  title: string
}

interface ProjectsApi {
  projects: Project[]
}

export default function WorksPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [works, setWorks] = useState<Work[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<string>('')

  // Fetch works
  const fetchWorks = useCallback(async (projectId?: string) => {
    try {
      setLoading(true)
      const url = projectId ? `/api/works?projectId=${projectId}` : '/api/works'
      const res = await fetch(url)
      if (res.ok) {
        const data: WorksApi = await res.json()
        setWorks(data.works)
      }
    } catch (err) {
      console.error('Failed to fetch works:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch projects for filter dropdown
  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects')
      if (res.ok) {
        const data: ProjectsApi = await res.json()
        setProjects(data.projects)
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchWorks()
    fetchProjects()

    // Check URL for project filter
    const projectId = searchParams.get('projectId')
    if (projectId) {
      setSelectedProject(projectId)
      fetchWorks(projectId)
    }
  }, [searchParams, fetchWorks, fetchProjects])

  // Handle project filter change
  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projectId = e.target.value
    setSelectedProject(projectId)
    if (projectId) {
      router.push(`/works?projectId=${projectId}`)
      fetchWorks(projectId)
    } else {
      router.push('/works')
      fetchWorks()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">作品展示</h1>
              <p className="text-gray-600 mt-1">浏览和欣赏同学们的优秀作品</p>
            </div>
          </div>

          {/* Project Filter */}
          <div className="mt-6">
            <label htmlFor="project-filter" className="block text-sm font-medium text-gray-700 mb-2">
              按项目筛选
            </label>
            <select
              id="project-filter"
              data-testid="project-filter"
              value={selectedProject}
              onChange={handleProjectChange}
              className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">全部项目</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
          </div>
        ) : works.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无作品</h3>
            <p className="text-gray-600">
              {selectedProject
                ? '当前项目下暂无作品'
                : '还没有作品，快来创建第一个作品吧！'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {works.map((work) => (
              <Link
                key={work.id}
                href={`/works/${work.id}`}
                data-testid="work-card"
                data-work-id={work.id}
                className="block"
              >
                <div
                  className={cn(
                    'bg-white border border-gray-200 rounded-xl p-6 cursor-pointer',
                    'hover:shadow-lg hover:border-indigo-300 transition-all'
                  )}
                >
                  {/* Cover Image */}
                  {work.coverImageUrl && (
                    <div
                      data-testid="work-cover"
                      className="w-full h-40 bg-gray-100 rounded-lg mb-4 overflow-hidden"
                    >
                      <img
                        src={work.coverImageUrl}
                        alt={work.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Project Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                      {work.project.title}
                    </span>
                    {work.project.subject && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {work.project.subject}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    data-testid="work-title"
                    className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2"
                  >
                    {work.title}
                  </h3>

                  {/* Description */}
                  {work.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {work.description}
                    </p>
                  )}

                  {/* Author Info */}
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    {work.user.avatar_url ? (
                      <img
                        src={work.user.avatar_url}
                        alt={work.user.nickname || work.user.username}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
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
                        {new Date(work.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
