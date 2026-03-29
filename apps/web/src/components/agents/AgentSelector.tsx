'use client'

import React from 'react'
import AgentCard from './AgentCard'
import type { AgentInfo, AgentSelectorProps } from './types'

export default function AgentSelector({
  availableAgents = [],
  selectedAgentId,
  onAgentSelect
}: AgentSelectorProps) {
  const handleSelect = (agent: AgentInfo) => {
    onAgentSelect(agent)
  }

  if (availableAgents.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>暂无可用智能体</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">选择智能体</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableAgents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            isSelected={agent.id === selectedAgentId}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  )
}
