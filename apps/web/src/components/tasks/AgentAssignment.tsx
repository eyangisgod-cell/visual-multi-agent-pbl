'use client'

import { useState, useCallback } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs))
}

interface Agent {
  id: string
  name: string
  agentType: string
  description?: string
  personality?: Record<string, unknown>
  skills?: string[]
  avatarUrl?: string
  isPlatform: boolean
}

interface User {
  id: string
  username: string
  nickname?: string
  avatarUrl?: string
}

interface AgentAssignmentProps {
  taskId: string
  currentAgentType?: string
  assignedUser?: User | null
  availableAgents?: Agent[]
  availableUsers?: User[]
  onAgentAssign?: (agentType: string) => void
  onUserAssign?: (userId: string | null) => void
  showAgentAssignment?: boolean
  showUserAssignment?: boolean
}

const AGENT_TYPES: { value: string; label: string; icon: string; description: string }[] = [
  {
    value: 'guide',
    label: 'Guide Agent',
    icon: '🧭',
    description: 'Provides direction and helps students navigate learning paths'
  },
  {
    value: 'tutor',
    label: 'Tutor Agent',
    icon: '📚',
    description: 'Offers personalized tutoring and explains concepts'
  },
  {
    value: 'evaluator',
    label: 'Evaluator Agent',
    icon: '✅',
    description: 'Assesses work quality and provides feedback'
  },
  {
    value: 'collaborator',
    label: 'Collaborator Agent',
    icon: '🤝',
    description: 'Works alongside students as a peer collaborator'
  },
  {
    value: 'creator',
    label: 'Creator Agent',
    icon: '🎨',
    description: 'Helps with creative tasks and content generation'
  }
]

export function AgentAssignment({
  taskId,
  currentAgentType,
  assignedUser,
  availableAgents = [],
  availableUsers = [],
  onAgentAssign,
  onUserAssign,
  showAgentAssignment = true,
  showUserAssignment = true
}: AgentAssignmentProps) {
  const [agentDropdownOpen, setAgentDropdownOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const handleAgentSelect = useCallback((agentType: string) => {
    if (onAgentAssign) {
      onAgentAssign(agentType)
    }
    setAgentDropdownOpen(false)
  }, [onAgentAssign])

  const handleUserSelect = useCallback((userId: string | null) => {
    if (onUserAssign) {
      onUserAssign(userId)
    }
    setUserDropdownOpen(false)
  }, [onUserAssign])

  const filteredUsers = availableUsers.filter(user => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      user.username.toLowerCase().includes(search) ||
      user.nickname?.toLowerCase().includes(search)
    )
  })

  const currentAgent = AGENT_TYPES.find(a => a.value === currentAgentType)

  return (
    <div className="space-y-4">
      {/* Agent Assignment */}
      {showAgentAssignment && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            AI Agent Assignment
          </h3>

          <div className="relative">
            <button
              onClick={() => setAgentDropdownOpen(!agentDropdownOpen)}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3 border rounded-lg',
                'hover:border-indigo-400 transition-colors',
                currentAgent ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300 bg-white'
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{currentAgent?.icon || '❓'}</span>
                <div className="text-left">
                  <p className="font-medium text-gray-900">
                    {currentAgent?.label || 'No Agent Assigned'}
                  </p>
                  {currentAgent && (
                    <p className="text-sm text-gray-500">{currentAgent.description}</p>
                  )}
                </div>
              </div>
              <svg
                className={cn('w-5 h-5 text-gray-400 transition-transform', agentDropdownOpen && 'rotate-180')}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {agentDropdownOpen && (
              <div className="absolute z-20 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
                <div className="p-2">
                  {AGENT_TYPES.map((agent) => (
                    <button
                      key={agent.value}
                      onClick={() => handleAgentSelect(agent.value)}
                      className={cn(
                        'w-full text-left px-3 py-3 rounded-lg transition-colors',
                        currentAgentType === agent.value
                          ? 'bg-indigo-100 border border-indigo-300'
                          : 'hover:bg-gray-50 border border-transparent'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{agent.icon}</span>
                        <div>
                          <p className="font-medium text-gray-900">{agent.label}</p>
                          <p className="text-sm text-gray-500">{agent.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}

                  {currentAgentType && (
                    <button
                      onClick={() => handleAgentSelect('')}
                      className="w-full text-left px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors mt-2 border-t border-gray-100"
                    >
                      Remove Agent Assignment
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Agent Info */}
          {currentAgent && (
            <div className="mt-3 p-3 bg-indigo-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{currentAgent.icon}</span>
                <span className="font-medium text-indigo-900">{currentAgent.label}</span>
              </div>
              <p className="text-sm text-indigo-700">{currentAgent.description}</p>

              <div className="mt-3 pt-3 border-t border-indigo-200">
                <p className="text-xs font-medium text-indigo-600 mb-2">Capabilities:</p>
                <div className="flex flex-wrap gap-2">
                  {currentAgentType === 'guide' && (
                    <>
                      <span className="text-xs bg-white text-indigo-600 px-2 py-1 rounded">Learning Path Navigation</span>
                      <span className="text-xs bg-white text-indigo-600 px-2 py-1 rounded">Resource Recommendations</span>
                    </>
                  )}
                  {currentAgentType === 'tutor' && (
                    <>
                      <span className="text-xs bg-white text-indigo-600 px-2 py-1 rounded">Concept Explanation</span>
                      <span className="text-xs bg-white text-indigo-600 px-2 py-1 rounded">Practice Problems</span>
                    </>
                  )}
                  {currentAgentType === 'evaluator' && (
                    <>
                      <span className="text-xs bg-white text-indigo-600 px-2 py-1 rounded">Rubric Assessment</span>
                      <span className="text-xs bg-white text-indigo-600 px-2 py-1 rounded">Feedback Generation</span>
                    </>
                  )}
                  {currentAgentType === 'collaborator' && (
                    <>
                      <span className="text-xs bg-white text-indigo-600 px-2 py-1 rounded">Brainstorming</span>
                      <span className="text-xs bg-white text-indigo-600 px-2 py-1 rounded">Peer Feedback</span>
                    </>
                  )}
                  {currentAgentType === 'creator' && (
                    <>
                      <span className="text-xs bg-white text-indigo-600 px-2 py-1 rounded">Content Generation</span>
                      <span className="text-xs bg-white text-indigo-600 px-2 py-1 rounded">Creative Assistance</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* User Assignment */}
      {showUserAssignment && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            User Assignment
          </h3>

          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3 border rounded-lg',
                'hover:border-indigo-400 transition-colors',
                assignedUser ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300 bg-white'
              )}
            >
              <div className="flex items-center gap-3">
                {assignedUser ? (
                  <>
                    {assignedUser.avatarUrl ? (
                      <img
                        src={assignedUser.avatarUrl}
                        alt={assignedUser.username}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-indigo-600">
                          {assignedUser.nickname?.charAt(0).toUpperCase() || assignedUser.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="text-left">
                      <p className="font-medium text-gray-900">
                        {assignedUser.nickname || assignedUser.username}
                      </p>
                      <p className="text-sm text-gray-500">@{assignedUser.username}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="text-gray-500">Unassigned</span>
                  </>
                )}
              </div>
              <svg
                className={cn('w-5 h-5 text-gray-400 transition-transform', userDropdownOpen && 'rotate-180')}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {userDropdownOpen && (
              <div className="absolute z-20 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
                <div className="p-3 border-b border-gray-100 sticky top-0 bg-white">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="p-2">
                  <button
                    onClick={() => handleUserSelect(null)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg transition-colors',
                      !assignedUser ? 'bg-gray-100' : 'hover:bg-gray-50'
                    )}
                  >
                    <span className="text-sm text-gray-500">Unassigned</span>
                  </button>

                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleUserSelect(user.id)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-3',
                        assignedUser?.id === user.id
                          ? 'bg-indigo-100 border border-indigo-300'
                          : 'hover:bg-gray-50 border border-transparent'
                      )}
                    >
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.username}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-xs font-medium text-indigo-600">
                            {user.nickname?.charAt(0).toUpperCase() || user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user.nickname || user.username}
                        </p>
                        <p className="text-xs text-gray-500">@{user.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
