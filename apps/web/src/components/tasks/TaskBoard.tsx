'use client'

import { useState, useCallback } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs))
}

export interface Task {
  id: string
  projectId: string
  title: string
  description?: string
  orderIndex: number
  agentType?: string
  assignedTo?: string
  assignedUserName?: string
  assignedUserAvatar?: string
  status: 'todo' | 'in_progress' | 'review' | 'completed'
  dueDate?: string
  rubricScores?: unknown[]
  submissionContent?: string
  submittedAt?: string
  createdAt: string
  updatedAt: string
}

interface TaskBoardProps {
  tasks: Task[]
  onTaskClick?: (task: Task) => void
  onStatusChange?: (taskId: string, status: Task['status']) => void
  onAssignAgent?: (taskId: string, agentType: string) => void
  canEdit?: boolean
}

const STATUS_COLUMNS: { id: Task['status']; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: 'bg-gray-500' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { id: 'review', label: 'In Review', color: 'bg-yellow-500' },
  { id: 'completed', label: 'Completed', color: 'bg-green-500' }
]

const AGENT_TYPES: { value: string; label: string; icon: string }[] = [
  { value: 'guide', label: 'Guide Agent', icon: '🧭' },
  { value: 'tutor', label: 'Tutor Agent', icon: '📚' },
  { value: 'evaluator', label: 'Evaluator Agent', icon: '✅' },
  { value: 'collaborator', label: 'Collaborator Agent', icon: '🤝' },
  { value: 'creator', label: 'Creator Agent', icon: '🎨' }
]

export function TaskBoard({
  tasks,
  onTaskClick,
  onStatusChange,
  onAssignAgent,
  canEdit = false
}: TaskBoardProps) {
  const [draggedTask, setDraggedTask] = useState<string | null>(null)
  const [agentMenuOpen, setAgentMenuOpen] = useState<string | null>(null)

  const getTasksByStatus = useCallback((status: Task['status']) => {
    return tasks
      .filter(task => task.status === status)
      .sort((a, b) => a.orderIndex - b.orderIndex)
  }, [tasks])

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    if (!canEdit) return
    setDraggedTask(taskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (!canEdit) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, status: Task['status']) => {
    if (!canEdit || !draggedTask) return
    e.preventDefault()

    const task = tasks.find(t => t.id === draggedTask)
    if (task && task.status !== status && onStatusChange) {
      onStatusChange(draggedTask, status)
    }

    setDraggedTask(null)
  }

  const handleAssignAgent = (taskId: string, agentType: string) => {
    if (onAssignAgent) {
      onAssignAgent(taskId, agentType)
    }
    setAgentMenuOpen(null)
  }

  const getAgentIcon = (agentType?: string) => {
    const agent = AGENT_TYPES.find(a => a.value === agentType)
    return agent?.icon || '❓'
  }

  const getAgentLabel = (agentType?: string) => {
    const agent = AGENT_TYPES.find(a => a.value === agentType)
    return agent?.label || 'Unassigned'
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full overflow-x-auto">
      {STATUS_COLUMNS.map((column) => {
        const columnTasks = getTasksByStatus(column.id)

        return (
          <div
            key={column.id}
            className="flex flex-col bg-gray-100 rounded-xl overflow-hidden"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn('w-3 h-3 rounded-full', column.color)} />
                  <h3 className="font-semibold text-gray-700">{column.label}</h3>
                </div>
                <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                  {columnTasks.length}
                </span>
              </div>
            </div>

            {/* Task Cards */}
            <div className="flex-1 p-3 space-y-3 overflow-y-auto min-h-[200px]">
              {columnTasks.map((task) => (
                <div
                  key={task.id}
                  draggable={canEdit}
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onClick={() => onTaskClick?.(task)}
                  className={cn(
                    'bg-white rounded-lg p-4 shadow-sm border border-gray-200',
                    canEdit && 'cursor-grab active:cursor-grabbing',
                    draggedTask === task.id && 'opacity-50',
                    onTaskClick && 'hover:shadow-md hover:border-indigo-300 transition-shadow'
                  )}
                >
                  {/* Agent Type */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full flex items-center gap-1">
                      <span>{getAgentIcon(task.agentType)}</span>
                      {getAgentLabel(task.agentType)}
                    </span>
                    {canEdit && onAssignAgent && (
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setAgentMenuOpen(agentMenuOpen === task.id ? null : task.id)
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>

                        {agentMenuOpen === task.id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                            <div className="p-2">
                              <p className="text-xs font-medium text-gray-500 px-2 py-1">Assign Agent</p>
                              {AGENT_TYPES.map((agent) => (
                                <button
                                  key={agent.value}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleAssignAgent(task.id, agent.value)
                                  }}
                                  className={cn(
                                    'w-full text-left px-2 py-2 rounded-md text-sm flex items-center gap-2 hover:bg-gray-100',
                                    task.agentType === agent.value && 'bg-indigo-50 text-indigo-600'
                                  )}
                                >
                                  <span>{agent.icon}</span>
                                  <span>{agent.label}</span>
                                </button>
                              ))}
                              {task.agentType && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleAssignAgent(task.id, '')
                                  }}
                                  className="w-full text-left px-2 py-2 rounded-md text-sm text-red-600 hover:bg-red-50"
                                >
                                  Remove Agent
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Task Title */}
                  <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
                    {task.title}
                  </h4>

                  {/* Task Description */}
                  {task.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                      {task.description}
                    </p>
                  )}

                  {/* Assigned User */}
                  {task.assignedUserName && (
                    <div className="flex items-center gap-2 mb-2">
                      {task.assignedUserAvatar ? (
                        <img
                          src={task.assignedUserAvatar}
                          alt={task.assignedUserName}
                          className="w-5 h-5 rounded-full"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-xs text-indigo-600">
                            {task.assignedUserName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="text-xs text-gray-600">{task.assignedUserName}</span>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    {task.dueDate && (
                      <span
                        className={cn(
                          'text-xs',
                          isOverdue(task.dueDate)
                            ? 'text-red-600 font-medium'
                            : 'text-gray-500'
                        )}
                      >
                        Due: {formatDate(task.dueDate)}
                      </span>
                    )}

                    {task.submissionContent && (
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        Submitted
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {columnTasks.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No tasks
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
