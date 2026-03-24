'use client'

import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs))
}

interface TaskProgress {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'review' | 'completed'
  agentType?: string
  assignedUserName?: string
  submittedAt?: string
  rubricScores?: unknown[]
}

interface ProjectProgress {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  reviewTasks: number
  todoTasks: number
  submissionRate: number
  averageScore?: number
}

interface ProgressDashboardProps {
  tasks: TaskProgress[]
  projectName?: string
  rubricCriteria?: { id: string; name: string; maxScore: number }[]
  className?: string
}

const STATUS_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  todo: { color: 'bg-gray-500', icon: '📋', label: 'To Do' },
  in_progress: { color: 'bg-blue-500', icon: '🔄', label: 'In Progress' },
  review: { color: 'bg-yellow-500', icon: '👀', label: 'In Review' },
  completed: { color: 'bg-green-500', icon: '✅', label: 'Completed' }
}

const AGENT_ICONS: Record<string, string> = {
  guide: '🧭',
  tutor: '📚',
  evaluator: '✅',
  collaborator: '🤝',
  creator: '🎨'
}

export function ProgressDashboard({
  tasks,
  projectName,
  rubricCriteria,
  className
}: ProgressDashboardProps) {
  // Calculate progress metrics
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length
  const reviewTasks = tasks.filter(t => t.status === 'review').length
  const todoTasks = tasks.filter(t => t.status === 'todo').length

  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const submissionRate = totalTasks > 0
    ? Math.round(((completedTasks + reviewTasks) / totalTasks) * 100)
    : 0

  // Calculate average score from completed tasks
  const averageScore = tasks
    .filter(t => t.rubricScores && Array.isArray(t.rubricScores))
    .reduce((acc, task) => {
      const scores = task.rubricScores as { score: number }[]
      const taskTotal = scores.reduce((s, r) => s + (r.score || 0), 0)
      return acc + taskTotal
    }, 0) / (tasks.filter(t => t.rubricScores).length || 1)

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      {projectName && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">{projectName}</h2>
          <p className="text-sm text-gray-500 mt-1">Project Progress Dashboard</p>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalTasks}</p>
              <p className="text-xs text-gray-500">Total Tasks</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-xl">✅</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{completedTasks}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <span className="text-xl">👀</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{reviewTasks}</p>
              <p className="text-xs text-gray-500">In Review</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-xl">📈</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{progressPercentage}%</p>
              <p className="text-xs text-gray-500">Progress</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-900">Overall Progress</h3>
          <span className="text-sm text-gray-500">{completedTasks} of {totalTasks} tasks completed</span>
        </div>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Progress Segments */}
        <div className="flex items-center gap-2 mt-4">
          {todoTasks > 0 && (
            <div className="flex-1 h-2 bg-gray-400 rounded-full" title={`${todoTasks} To Do`} />
          )}
          {inProgressTasks > 0 && (
            <div className="flex-1 h-2 bg-blue-500 rounded-full" title={`${inProgressTasks} In Progress`} />
          )}
          {reviewTasks > 0 && (
            <div className="flex-1 h-2 bg-yellow-500 rounded-full" title={`${reviewTasks} In Review`} />
          )}
          {completedTasks > 0 && (
            <div className="flex-1 h-2 bg-green-500 rounded-full" title={`${completedTasks} Completed`} />
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-3 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <span className="text-xs text-gray-600">To Do ({todoTasks})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs text-gray-600">In Progress ({inProgressTasks})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-xs text-gray-600">In Review ({reviewTasks})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-gray-600">Completed ({completedTasks})</span>
          </div>
        </div>
      </div>

      {/* Task Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status Distribution */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-medium text-gray-900 mb-4">Task Status Distribution</h3>
          <div className="space-y-3">
            {Object.entries(STATUS_CONFIG).map(([status, config]) => {
              const count = tasks.filter(t => t.status === status).length
              const percentage = totalTasks > 0 ? (count / totalTasks) * 100 : 0

              return (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-lg">{config.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">{config.label}</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full transition-all duration-500', config.color)}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Agent Assignment Stats */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-medium text-gray-900 mb-4">Agent Assignments</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(AGENT_ICONS).map(([agentType, icon]) => {
              const count = tasks.filter(t => t.agentType === agentType).length

              return (
                <div
                  key={agentType}
                  className="bg-gray-50 rounded-lg p-3 flex items-center gap-3"
                >
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{count}</p>
                    <p className="text-xs text-gray-500 capitalize">{agentType}s</p>
                  </div>
                </div>
              )
            })}
          </div>
          {(() => {
            const unassigned = tasks.filter(t => !t.agentType).length
            return unassigned > 0 && (
              <p className="text-xs text-gray-500 mt-3 text-center">
                {unassigned} task{unassigned !== 1 ? 's' : ''} without agent assignment
              </p>
            )
          })()}
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="font-medium text-gray-900 mb-4">Recent Submissions</h3>
        <div className="space-y-3">
          {tasks
            .filter(t => t.submittedAt)
            .sort((a, b) => new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime())
            .slice(0, 5)
            .map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {task.agentType ? AGENT_ICONS[task.agentType] : '📋'}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{task.title}</p>
                    <p className="text-xs text-gray-500">
                      Submitted {new Date(task.submittedAt!).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    task.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : task.status === 'review'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  )}
                >
                  {STATUS_CONFIG[task.status]?.label || task.status}
                </span>
              </div>
            ))}

          {tasks.filter(t => t.submittedAt).length === 0 && (
            <p className="text-center text-gray-500 py-8">No submissions yet</p>
          )}
        </div>
      </div>

      {/* Rubric Score Summary */}
      {rubricCriteria && rubricCriteria.length > 0 && averageScore && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-medium text-gray-900 mb-4">Rubric Assessment</h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-indigo-600">{averageScore.toFixed(1)}</p>
              <p className="text-xs text-gray-500">Average Score</p>
            </div>
            <div className="flex-1">
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-indigo-500"
                  style={{
                    width: `${(averageScore / rubricCriteria.reduce((a, c) => a + c.maxScore, 0)) * 100}%`
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {rubricCriteria.map((criterion) => (
              <div key={criterion.id} className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-900 mb-1">{criterion.name}</p>
                <p className="text-xs text-gray-500">Max: {criterion.maxScore} points</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
