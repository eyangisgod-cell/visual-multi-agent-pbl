/**
 * Task Panel Component
 * Displays task list and allows creating new tasks
 */

'use client'

import { useState, useEffect } from 'react'

interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'done'
  assignedAgents: string[]
  createdAt: string
}

interface TaskPanelProps {
  onClose: () => void
}

export function TaskPanel({ onClose }: TaskPanelProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks')
      if (response.ok) {
        const data = await response.json()
        const mappedTasks = (data.tasks || []).map((t: any) => {
          return {
            id: t.id,
            title: t.title,
            description: t.description || '',
            status: t.status === 'done' ? 'completed' : t.status === 'in_progress' ? 'in_progress' : 'pending',
            assignedAgents: t.agentType ? [t.agentType] : [],
            createdAt: t.createdAt,
          }
        })
        setTasks(mappedTasks)
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const description = formData.get('description') as string

    // Optimistically add task to local state for demo purposes
    const newTask: Task = {
      id: `temp-${Date.now()}`,
      title,
      description,
      status: 'pending',
      assignedAgents: [],
      createdAt: new Date().toISOString(),
    }

    try {
      // Try to create via API first
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'demo-project-id',
          title,
          description,
          orderIndex: tasks.length,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Replace temp task with real one from API
        const realTask: Task = {
          id: data.task.id,
          title: data.task.title,
          description: data.task.description || '',
          status: data.task.status || 'pending',
          assignedAgents: data.task.agentType ? [data.task.agentType] : [],
          createdAt: data.task.createdAt,
        }
        setTasks(prev => prev.filter(t => t.id !== newTask.id).concat(realTask))
      } else {
        // API failed, keep the local task for demo
        console.warn('API create failed, using local state:', await response.json().catch(() => 'unknown'))
        setTasks([...tasks, newTask])
      }
      setShowCreateForm(false)
    } catch (error) {
      console.error('Failed to create task, using local state:', error)
      // Still add task locally even if API fails
      setTasks([...tasks, newTask])
      setShowCreateForm(false)
    }
  }

  return (
    <div
      data-testid="task-panel"
      className="absolute left-0 top-0 bottom-0 w-80 bg-gray-900 bg-opacity-95 text-white p-4 overflow-y-auto z-50"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">任务列表</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white"
          aria-label="关闭"
        >
          ✕
        </button>
      </div>

      {/* Create Task Button */}
      <button
        data-testid="create-task-btn"
        onClick={() => setShowCreateForm(true)}
        className="w-full mb-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
      >
        + 创建新任务
      </button>

      {/* Create Task Form */}
      {showCreateForm && (
        <form
          data-testid="task-form"
          onSubmit={handleCreateTask}
          className="mb-4 p-4 bg-gray-800 rounded-lg"
        >
          <input
            name="title"
            type="text"
            placeholder="任务标题"
            className="w-full mb-2 px-3 py-2 bg-gray-700 rounded text-white"
            required
          />
          <textarea
            name="description"
            placeholder="任务描述"
            className="w-full mb-2 px-3 py-2 bg-gray-700 rounded text-white"
            rows={3}
            required
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm"
            >
              保存
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded text-sm"
            >
              取消
            </button>
          </div>
        </form>
      )}

      {/* Task List */}
      <div data-testid="task-list" className="space-y-2">
        {loading ? (
          <div className="text-center py-8 text-gray-400">加载中...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-400">暂无任务</div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              data-testid="task-item"
              className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium">{task.title}</h3>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    task.status === 'completed'
                      ? 'bg-green-600'
                      : task.status === 'in_progress'
                        ? 'bg-yellow-600'
                        : 'bg-gray-600'
                  }`}
                >
                  {task.status === 'completed'
                    ? '完成'
                    : task.status === 'in_progress'
                      ? '进行中'
                      : '待处理'}
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-2">{task.description}</p>
              {task.assignedAgents.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {task.assignedAgents.map((agent) => (
                    <span
                      key={agent}
                      className="text-xs px-2 py-1 bg-indigo-600 rounded"
                    >
                      {agent}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
