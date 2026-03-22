/**
 * useAgent Hook
 *
 * React hook for interacting with agent state and controls.
 * Provides convenient methods for agent management.
 */

import { useCallback, useEffect } from 'react';
import { useAgentStore } from '../stores/agentStore';
import { AgentType, AgentStatus } from '../components/game/agents';

export interface UseAgentOptions {
  autoSelect?: boolean;
  onStatusChange?: (agentId: string, status: AgentStatus) => void;
  onDialogComplete?: (agentId: string) => void;
}

export interface UseAgentReturn {
  // All agents
  agents: Map<string, import('../stores/agentStore').AgentInstance>;
  agentsList: import('../stores/agentStore').AgentInstance[];

  // Selected agents
  selectedAgentIds: string[];
  selectedAgents: import('../stores/agentStore').AgentInstance[];

  // Get specific agent
  getAgentByType: (type: AgentType) => import('../stores/agentStore').AgentInstance | undefined;
  getAgentById: (id: string) => import('../stores/agentStore').AgentInstance | undefined;

  // Actions
  selectAgent: (agentId: string) => void;
  deselectAgent: (agentId: string) => void;
  toggleAgentSelection: (agentId: string) => void;
  clearSelection: () => void;

  // Status management
  updateAgentStatus: (agentId: string, status: AgentStatus) => void;
  setAgentBusy: (agentId: string) => void;
  setAgentIdle: (agentId: string) => void;

  // Dialog management
  addAgentDialog: (agentId: string, dialog: string) => void;
  clearAgentDialog: (agentId: string) => void;

  // Task management
  setAgentTask: (agentId: string, task?: string) => void;

  // Visibility
  setAgentVisibility: (agentId: string, visible: boolean) => void;
  setGlobalVisibility: (visible: boolean) => void;

  // Computed
  isActive: (agentId: string) => boolean;
  getActiveAgents: () => import('../stores/agentStore').AgentInstance[];
  getAgentsByStatus: (status: AgentStatus) => import('../stores/agentStore').AgentInstance[];
}

export function useAgent(options: UseAgentOptions = {}): UseAgentReturn {
  const {
    autoSelect = false,
    onStatusChange,
    onDialogComplete,
  } = options;

  const {
    agents,
    selectedAgentIds,
    updateAgentStatus,
    selectAgent,
    deselectAgent,
    toggleAgentSelection,
    clearSelection,
    setAgentVisibility,
    setGlobalVisibility,
    setAgentTask,
    addAgentDialog,
    clearAgentDialog,
    getAgentByType: getAgentByTypeStore,
    getAgentsByStatus: getAgentsByStatusStore,
    getActiveAgents: getActiveAgentsStore,
  } = useAgentStore();

  const agentsList = Array.from(agents.values());

  const selectedAgents = agentsList.filter((agent) =>
    selectedAgentIds.includes(agent.id)
  );

  const getAgentById = useCallback(
    (id: string) => agents.get(id),
    [agents]
  );

  // Subscribe to status changes
  useEffect(() => {
    if (!onStatusChange) return;

    const unsubscribe = useAgentStore.subscribe(
      (state) => state.agents,
      (newAgents, prevAgents) => {
        newAgents.forEach((agent, id) => {
          const prevAgent = prevAgents.get(id);
          if (prevAgent && prevAgent.status !== agent.status) {
            onStatusChange(id, agent.status);
          }
        });
      }
    );

    return unsubscribe;
  }, [onStatusChange]);

  // Subscribe to dialog completion
  useEffect(() => {
    if (!onDialogComplete) return;

    const unsubscribe = useAgentStore.subscribe(
      (state) =>
        Array.from(state.agents.values()).map((a) => ({
          id: a.id,
          hasDialog: !!a.currentDialog,
        })),
      (newAgents, prevAgents) => {
        newAgents.forEach((agent, index) => {
          const prevAgent = prevAgents[index];
          if (prevAgent?.hasDialog && !agent.hasDialog) {
            onDialogComplete(agent.id);
          }
        });
      }
    );

    return unsubscribe;
  }, [onDialogComplete]);

  // Auto-select first agent
  useEffect(() => {
    if (!autoSelect || selectedAgentIds.length > 0 || agentsList.length === 0)
      return;

    selectAgent(agentsList[0].id);
  }, [autoSelect, agentsList, selectedAgentIds.length, selectAgent]);

  const setAgentBusy = useCallback(
    (agentId: string) => {
      updateAgentStatus(agentId, 'working');
    },
    [updateAgentStatus]
  );

  const setAgentIdle = useCallback(
    (agentId: string) => {
      updateAgentStatus(agentId, 'idle');
    },
    [updateAgentStatus]
  );

  const isActive = useCallback(
    (agentId: string) => {
      const agent = agents.get(agentId);
      return agent ? agent.status !== 'idle' && agent.isVisible : false;
    },
    [agents]
  );

  const getActiveAgents = useCallback(() => {
    return getActiveAgentsStore();
  }, [getActiveAgentsStore]);

  const getAgentsByStatus = useCallback(
    (status: AgentStatus) => {
      return getAgentsByStatusStore(status);
    },
    [getAgentsByStatusStore]
  );

  return {
    // All agents
    agents,
    agentsList,

    // Selected agents
    selectedAgentIds,
    selectedAgents,

    // Get specific agent
    getAgentByType: getAgentByTypeStore,
    getAgentById,

    // Actions
    selectAgent,
    deselectAgent,
    toggleAgentSelection,
    clearSelection,

    // Status management
    updateAgentStatus,
    setAgentBusy,
    setAgentIdle,

    // Dialog management
    addAgentDialog,
    clearAgentDialog,

    // Task management
    setAgentTask,

    // Visibility
    setAgentVisibility,
    setGlobalVisibility,

    // Computed
    isActive,
    getActiveAgents,
    getAgentsByStatus,
  };
}

export default useAgent;
