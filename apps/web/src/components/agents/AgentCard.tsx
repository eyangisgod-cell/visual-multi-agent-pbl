'use client'

import React from 'react'
import type { AgentInfo } from './types'

interface AgentCardProps {
  agent: AgentInfo
  isSelected: boolean
  onSelect: (agent: AgentInfo) => void
}

export default function AgentCard({ agent, isSelected, onSelect }: AgentCardProps) {
  return (
    <div
      onClick={() => onSelect(agent)}
      className={`
        cursor-pointer p-4 rounded-xl border-2 transition-all duration-200
        ${isSelected
          ? 'border-indigo-600 bg-indigo-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm'
        }
      `}
    >
      <div className="flex items-start gap-4">
        <img
          src={agent.avatarUrl || '/placeholder-avatar.png'}
          alt={agent.name}
          className="w-16 h-16 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">{agent.name}</h3>
            {agent.status && (
              <span className={`
                text-xs px-2 py-1 rounded-full
                ${agent.status === 'available' ? 'bg-green-100 text-green-800' : ''}
                ${agent.status === 'busy' ? 'bg-yellow-100 text-yellow-800' : ''}
                ${agent.status === 'offline' ? 'bg-gray-100 text-gray-800' : ''}
              `}>
                {agent.status}
              </span>
            )}
          </div>
          <p className="text-sm text-indigo-600 font-medium">{agent.role}</p>
          <p className="text-sm text-gray-600 mt-2">{agent.description}</p>
        </div>
      </div>
      <div className={`mt-3 flex items-center gap-2 ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`}>
        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
          ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'}
        `}>
          {isSelected && (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <span className="text-sm font-medium">{isSelected ? '已选择' : '选择此智能体'}</span>
      </div>
    </div>
  )
}
