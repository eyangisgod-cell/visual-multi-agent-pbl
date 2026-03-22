'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '../../../components/ui/button'
import { TaskBoard, type Task } from '../../../components/tasks/TaskBoard'
import { AgentAssignment } from '../../../components/tasks/AgentAssignment'
import { ProgressDashboard } from '../../../components/projects/ProgressDashboard'
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
  rubricCriteria?: { id: string; name: string; description: string; maxScore: number }[]
  createdAt: string
  updatedAt: string
}

interface ProjectApi {
  project: Project
}

interface TaskApi {
  tasks: (Task & { assignedUserName?: string; assignedUserAvatar?: string })[]
}

type Tab = 'tasks' | 'progress' | 'settings'

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('tasks')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')

  // Fetch project and tasks
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        const [projectRes, tasksRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/tasks?projectId=${projectId}`)
        ])

        if (!projectRes.ok) {
          throw new Error('Failed to load project')
        }

        if (!tasksRes.ok) {
          throw new Error('Failed to load tasks')
        }

        const projectData: ProjectApi = await projectRes.json()
        const tasksData: TaskApi = await tasksRes.json()

        setProject(projectData.project)
        setTasks(tasksData.tasks)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      fetchData()
    }
  }, [projectId])

  // Handle task status change
  const handleStatusChange = useCallback(async (taskId: string, status: Task['status']) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (res.ok) {
        const data = await res.json()
        setTasks(prev => prev.map(t => t.id === taskId ? data.task : t))
      }
    } catch (err) {
      console.error('Failed to update task status:', err)
    }
  }, [])

  // Handle agent assignment
  const handleAgentAssign = useCallback(async (taskId: string, agentType: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentType: agentType || null })
      })

      if (res.ok) {
        const data = await res.json()
        setTasks(prev => prev.map(t => t.id === taskId ? {
          ...t,
          agentType: data.task.agentType
        } : t))
      }
    } catch (err) {
      console.error('Failed to assign agent:', err)
    }
  }, [])

  // Handle create task
  const handleCreateTask = useCallback(async () => {
    if (!newTaskTitle.trim() || !projectId) return

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          title: newTaskTitle,
          description: newTaskDescription || undefined,
          orderIndex: tasks.length,
          status: 'todo'
        })
      })

      if (res.ok) {
        const data = await res.json()
        setTasks(prev => [...prev, data.task])
        setNewTaskTitle('')
        setNewTaskDescription('')
        setIsCreatingTask(false)
      }
    } catch (err) {
      console.error('Failed to create task:', err)
    }
  }, [newTaskTitle, newTaskDescription, projectId, tasks.length])

  // Handle task click
  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task)
    setIsTaskModalOpen(true)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Project not found'}</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium',
                  project.status === 'active' ? 'bg-green-100 text-green-700' :
                  project.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                )}>
                  {project.status.toUpperCase()}
                </span>
                {project.subject && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                    {project.subject}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
              {project.description && (
                <p className="text-gray-600 mt-2">{project.description}</p>
              )}
            </div>

            <div className="flex items-center gap-4">
              {project.gradeMin && project.gradeMax && (
                <div className="text-right">
                  <p className="text-xs text-gray-500">Grade Level</p>
                  <p className="font-medium text-gray-900">{project.gradeMin} - {project.gradeMax}</p>
                </div>
              )}
              <div className="text-right">
                <p className="text-xs text-gray-500">Difficulty</p>
                <p className="font-medium text-gray-900">{'📊'.repeat(project.difficulty)}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-6 border-t border-gray-200">
            <button
              onClick={() => setActiveTab('tasks')}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'tasks'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              📋 Tasks ({tasks.length})
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'progress'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              📈 Progress
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'settings'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              ⚙️ Settings
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            {/* Add Task Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Task Board</h2>
              <Button
                onClick={() => setIsCreatingTask(true)}
                variant="primary"
                size="sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Task
              </Button>
            </div>

            {/* Create Task Inline Form */}
            {isCreatingTask && (
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="font-medium text-gray-900 mb-3">Create New Task</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Task title"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <textarea
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="Task description (optional)"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex gap-3">
                    <Button onClick={handleCreateTask} variant="primary">
                      Create Task
                    </Button>
                    <Button onClick={() => setIsCreatingTask(false)} variant="ghost">
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Task Board */}
            <TaskBoard
              tasks={tasks}
              onTaskClick={handleTaskClick}
              onStatusChange={handleStatusChange}
              onAssignAgent={handleAgentAssign}
              canEdit={true}
            />
          </div>
        )}

        {activeTab === 'progress' && (
          <ProgressDashboard
            tasks={tasks}
            projectName={project.title}
            rubricCriteria={project.rubricCriteria}
          />
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Title
                  </label>
                  <input
                    type="text"
                    defaultValue={project.title}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    defaultValue={project.description}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Grade
                    </label>
                    <select
                      defaultValue={project.gradeMin}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                        <option key={grade} value={grade}>{grade} Grade</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum Grade
                    </label>
                    <select
                      defaultValue={project.gradeMax}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                        <option key={grade} value={grade}>{grade} Grade</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    defaultValue={project.status}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="pt-4">
                  <Button variant="primary">Save Changes</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Task Detail Modal */}
      {isTaskModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Task Details</h2>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Task Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedTask.title}</h3>
                {selectedTask.description && (
                  <p className="text-gray-600 mt-2">{selectedTask.description}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={selectedTask.status}
                  onChange={(e) => {
                    handleStatusChange(selectedTask.id, e.target.value as Task['status'])
                    setSelectedTask({ ...selectedTask, status: e.target.value as Task['status'] })
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">In Review</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Agent Assignment */}
              <AgentAssignment
                taskId={selectedTask.id}
                currentAgentType={selectedTask.agentType}
                onAgentAssign={(agentType) => {
                  handleAgentAssign(selectedTask.id, agentType)
                  setSelectedTask({ ...selectedTask, agentType: agentType || undefined })
                }}
                showUserAssignment={false}
              />

              {/* Submission */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Submission
                </label>
                <textarea
                  defaultValue={selectedTask.submissionContent}
                  rows={4}
                  placeholder="Enter your submission content..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                {selectedTask.submittedAt && (
                  <p className="text-sm text-gray-500 mt-2">
                    Submitted on {new Date(selectedTask.submittedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsTaskModalOpen(false)}>
                Close
              </Button>
              <Button variant="primary">Save Changes</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
