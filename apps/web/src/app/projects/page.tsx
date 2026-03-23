'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../../componen../ui/Button'
import { ProjectWizard } from '../../components/projects/ProjectWizard'
import { ProgressDashboard } from '../../components/projects/ProgressDashboard'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs))
}

interface Project {
  id: string
  title: string
  description?: string
  gradeMin?: number
  gradeMax?: number
  subject?: string
  difficulty: number
  status: string
  createdAt: string
  _count?: {
    tasks: number
    works: number
  }
}

interface ProjectsApi {
  projects: Project[]
}

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [filter, setFilter] = useState<string>('all')

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/projects')
      if (res.ok) {
        const data: ProjectsApi = await res.json()
        setProjects(data.projects)
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useState(() => {
    fetchProjects()
  })

  // Handle create project
  const handleCreateProject = useCallback(async (data: {
    title: string
    description?: string
    gradeMin?: number
    gradeMax?: number
    subject?: string
    difficulty?: number
    rubricCriteria?: { id: string; name: string; description: string; maxScore: number }[]
  }) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (res.ok) {
        const projectData = await res.json()
        setProjects(prev => [projectData.project, ...prev])
        setIsWizardOpen(false)
        router.push(`/projects/${projectData.project.id}`)
      } else {
        throw new Error('Failed to create project')
      }
    } catch (err) {
      console.error('Failed to create project:', err)
      throw err
    }
  }, [router])

  const filteredProjects = filter === 'all'
    ? projects
    : projects.filter(p => p.status === filter)

  const statusCounts = {
    all: projects.length,
    draft: projects.filter(p => p.status === 'draft').length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    archived: projects.filter(p => p.status === 'archived').length
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
              <p className="text-gray-600 mt-1">Manage your project-based learning activities</p>
            </div>
            <Button
              onClick={() => setIsWizardOpen(true)}
              variant="primary"
              size="lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Project
            </Button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mt-6 overflow-x-auto">
            {[
              { value: 'all', label: 'All' },
              { value: 'draft', label: 'Draft' },
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
              { value: 'archived', label: 'Archived' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                  filter === option.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {option.label} ({statusCounts[option.value as keyof typeof statusCounts]})
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? "Get started by creating your first project"
                : `No ${filter} projects yet`}
            </p>
            {filter === 'all' && (
              <Button onClick={() => setIsWizardOpen(true)} variant="primary">
                Create Your First Project
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                className="bg-white border border-gray-200 rounded-xl p-6 cursor-pointer hover:shadow-lg hover:border-indigo-300 transition-all"
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium',
                      project.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : project.status === 'completed'
                        ? 'bg-blue-100 text-blue-700'
                        : project.status === 'archived'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-yellow-100 text-yellow-700'
                    )}
                  >
                    {project.status}
                  </span>
                  {project.subject && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {project.subject}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {project.title}
                </h3>

                {/* Description */}
                {project.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}

                {/* Meta Info */}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {project.gradeMin && project.gradeMax && (
                    <span>Grades {project.gradeMin}-{project.gradeMax}</span>
                  )}
                  <span className="flex items-center gap-1">
                    {'📊'.repeat(Math.min(project.difficulty, 5))}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900">{project._count?.tasks || 0}</p>
                    <p className="text-xs text-gray-500">Tasks</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900">{project._count?.works || 0}</p>
                    <p className="text-xs text-gray-500">Submissions</p>
                  </div>
                  <div className="text-center ml-auto">
                    <p className="text-xs text-gray-500">
                      Created {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Project Wizard */}
      <ProjectWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  )
}
