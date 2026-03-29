'use client'

import React, { useState } from 'react'
import AgentSelector from '@/components/agents/AgentSelector'
import type { AgentInfo } from '@/components/agents/types'

export default function AgentSelectionPage() {
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null)

  // Mock agent list - will be replaced with API call
  const availableAgents: AgentInfo[] = [
    {
      id: 'agent-1',
      name: '导师智能体',
      role: '学习导师',
      description: '帮助学生制定学习计划，提供学习指导和反馈',
      avatarUrl: '/avatars/mentor.png',
      status: 'available'
    },
    {
      id: 'agent-2',
      name: '分析师智能体',
      role: '数据分析师',
      description: '分析项目数据，提供洞察和建议',
      avatarUrl: '/avatars/analyst.png',
      status: 'available'
    },
    {
      id: 'agent-3',
      name: '设计师智能体',
      role: 'UI/UX 设计师',
      description: '协助设计用户界面和体验',
      avatarUrl: '/avatars/designer.png',
      status: 'busy'
    },
    {
      id: 'agent-4',
      name: '市场智能体',
      role: '市场营销专家',
      description: '提供市场推广和品牌建设建议',
      avatarUrl: '/avatars/marketer.png',
      status: 'available'
    },
    {
      id: 'agent-5',
      name: '助手智能体',
      role: '通用助手',
      description: '处理日常任务和协调工作',
      avatarUrl: '/avatars/assistant.png',
      status: 'offline'
    }
  ]

  const handleAgentSelect = (agent: AgentInfo) => {
    setSelectedAgent(agent)
    // TODO: Call API to save selection
    console.log('Selected agent:', agent)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">智能体选择</h1>
        <p className="text-gray-600 mb-8">选择适合您项目的 AI 智能体助手</p>

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
