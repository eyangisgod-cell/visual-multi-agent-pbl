/**
 * Agent Selector Component
 * Allows selecting agents for task assignment
 */

'use client'

import { useState } from 'react'

interface Agent {
  id: string
  name: string
  role: string
  available: boolean
}

interface AgentSelectorProps {
  onSelect?: (agentId: string) => void
  selectedAgent?: string | null
  onAssignTask?: (agentIds: string[]) => void
}

const AGENTS: Agent[] = [
  { id: 'mentor', name: '智慧导师', role: 'Mentor', available: true },
  { id: 'designer', name: '创意设计师', role: 'Designer', available: true },
  { id: 'analyst', name: '数据分析师', role: 'Analyst', available: true },
  { id: 'marketer', name: '运营推广师', role: 'Marketer', available: true },
  { id: 'assistant', name: 'CEO 助手', role: 'Assistant', available: true },
]

export function AgentSelector({ onSelect, selectedAgent, onAssignTask }: AgentSelectorProps) {
  const [expanded, setExpanded] = useState(false)
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [isAssigning, setIsAssigning] = useState(false)

  const handleSelectAgent = (agentId: string) => {
    // Toggle selection for multi-select
    setSelectedAgents(prev => {
      if (prev.includes(agentId)) {
        return prev.filter(id => id !== agentId)
      }
      return [...prev, agentId]
    })
    onSelect?.(agentId)
  }

  const handleAssignTask = async () => {
    if (selectedAgents.length === 0) return

    setIsAssigning(true)
    try {
      // Fetch CSRF token first
      const csrfResponse = await fetch('/api/csrf-token')
      const csrfData = await csrfResponse.json()
      const csrfToken = csrfData.token

      const response = await fetch('/api/agents/scheduler/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        body: JSON.stringify({
          taskId: 'demo-task', // In production, this would be a real task ID
          agentIds: selectedAgents,
          instructions: `请${selectedAgents.map(id => AGENTS.find(a => a.id === id)?.name).join('和')}协作完成此任务。`
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`任务已成功分配给 ${selectedAgents.length} 个智能体！`)
        onAssignTask?.(selectedAgents)
        setSelectedAgents([])
      } else {
        const error = await response.json()
        alert(`分配失败：${error.error}`)
      }
    } catch (error) {
      console.error('Failed to assign task:', error)
      alert('分配任务时出错，请重试')
    } finally {
      setIsAssigning(false)
    }
  }

  return (
    <div
      data-testid="agent-selector"
      className="absolute right-4 top-20 w-64 bg-gray-900 bg-opacity-95 text-white rounded-lg overflow-hidden z-50"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 font-medium transition-colors flex items-center justify-between"
      >
        <span>选择智能体</span>
        <span>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="p-2 space-y-1">
          {AGENTS.map((agent) => (
            <button
              key={agent.id}
              data-testid={`agent-option-${agent.id}`}
              onClick={() => handleSelectAgent(agent.id)}
              className={`w-full px-3 py-2 rounded text-left transition-colors ${
                selectedAgents.includes(agent.id)
                  ? 'bg-indigo-600 ring-2 ring-indigo-400'
                  : 'bg-gray-800 hover:bg-gray-700'
              } ${!agent.available ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!agent.available}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{agent.name}</div>
                  <div className="text-xs text-gray-400">{agent.role}</div>
                </div>
                {selectedAgents.includes(agent.id) && (
                  <span className="text-green-400">✓</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Assign Task Button */}
      {selectedAgents.length > 0 && (
        <div className="p-2 border-t border-gray-700">
          <div className="text-xs text-gray-400 mb-2">
            已选择 {selectedAgents.length} 个智能体
          </div>
          <button
            data-testid="assign-task-btn"
            onClick={handleAssignTask}
            disabled={isAssigning}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-medium transition-colors disabled:opacity-50"
          >
            {isAssigning ? '分配中...' : `分配任务给 ${selectedAgents.length} 个智能体`}
          </button>
        </div>
      )}
    </div>
  )
}
