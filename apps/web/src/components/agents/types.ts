/**
 * Agent Selection Types
 */

export interface AgentInfo {
  id: string
  name: string
  role: string
  description: string
  avatarUrl: string
  status?: 'available' | 'busy' | 'offline'
}

export interface AgentSelectorProps {
  availableAgents: AgentInfo[]
  selectedAgentId?: string
  onAgentSelect: (agent: AgentInfo) => void
}
