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
      (state) => {
        const agents = state.agents;
        agents.forEach((agent, id) => {
          // Store previous status in a ref for comparison
          const prevStatus = (window as any).__agentPrevStatus?.get(id);
          if (prevStatus && prevStatus !== agent.status) {
            onStatusChange(id, agent.status);
          }
          // Update stored status
          if (!(window as any).__agentPrevStatus) {
            (window as any).__agentPrevStatus = new Map();
          }
          (window as any).__agentPrevStatus.set(id, agent.status);
        });
      }
    );

    return unsubscribe;
  }, [onStatusChange]);

  // Subscribe to dialog completion
  useEffect(() => {
    if (!onDialogComplete) return;

    const unsubscribe = useAgentStore.subscribe(
      (state) => {
        const agents = Array.from(state.agents.values());
        agents.forEach((agent) => {
          const prevDialog = (window as any).__agentPrevDialog?.get(agent.id);
          if (prevDialog && !agent.currentDialog) {
            onDialogComplete(agent.id);
          }
          // Update stored dialog state
          if (!(window as any).__agentPrevDialog) {
            (window as any).__agentPrevDialog = new Map();
          }
          (window as any).__agentPrevDialog.set(agent.id, agent.currentDialog);
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
