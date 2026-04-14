'use client'

import React, { useState, useEffect } from 'react'
import AgentSelector from '@/components/agents/AgentSelector'
import type { AgentInfo } from '@/components/agents/types'

interface AgentListApiResponse {
  success: boolean
  agents: AgentInfo[]
  error?: string
}

interface AgentSelectApiResponse {
  success: boolean
  message?: string
}

export default function AgentSelectionPage() {
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null)
  const [availableAgents, setAvailableAgents] = useState<AgentInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch agents from API on mount
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/admin/agents/list')
        const data: AgentListApiResponse = await response.json()

        if (data.success) {
          setAvailableAgents(data.agents)
        } else {
          setError(data.error || '获取智能体列表失败')
        }
      } catch (err) {
        console.error('Failed to fetch agents:', err)
        setError('网络错误，请稍后重试')
      } finally {
        setLoading(false)
      }
    }

    fetchAgents()
  }, [])

  const handleAgentSelect = async (agent: AgentInfo) => {
    try {
      // Call API to save selection
      const response = await fetch('/api/admin/agents/select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: agent.id,
        }),
      })

      const data: AgentSelectApiResponse = await response.json()

      if (data.success) {
        setSelectedAgent(agent)
        console.log('Selected agent:', agent)
      } else {
        setError(data.message || '选择智能体失败')
      }
    } catch (err) {
      console.error('Failed to select agent:', err)
      setError('网络错误，请稍后重试')
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">智能体选择</h1>
          <p className="text-gray-600 mb-8">选择适合您项目的 AI 智能体助手</p>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600">加载智能体列表中...</span>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error && availableAgents.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">智能体选择</h1>
          <p className="text-gray-600 mb-8">选择适合您项目的 AI 智能体助手</p>
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-2 text-red-800">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              重新加载
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">智能体选择</h1>
        <p className="text-gray-600 mb-8">选择适合您项目的 AI 智能体助手</p>

        {error && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-yellow-800 text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-yellow-600 hover:text-yellow-800"
            >
              Dismiss
            </button>
          </div>
        )}

        <AgentSelector
          availableAgents={availableAgents}
          selectedAgentId={selectedAgent?.id}
          onAgentSelect={handleAgentSelect}
        />

        {selectedAgent && (
          <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-xl">
            <h2 className="text-lg font-semibold text-green-900">已选择智能体</h2>
            <div className="mt-2 flex items-center gap-4">
              <img
                src={selectedAgent.avatarUrl}
                alt={selectedAgent.name}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <p className="font-medium text-green-900">{selectedAgent.name}</p>
                <p className="text-sm text-green-700">{selectedAgent.role}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
