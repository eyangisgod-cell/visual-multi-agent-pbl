/**
 * Agent State Store
 *
 * Centralized state management for AI agents using Zustand.
 * Tracks agent states, selections, and status across the application.
 */

import { create } from 'zustand';
import { AgentType, AgentStatus } from '../components/game/agents';

export interface AgentInstance {
  id: string;
  type: AgentType;
  name: string;
  status: AgentStatus;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  isSelected: boolean;
  isVisible: boolean;
  currentTask?: string;
  dialogQueue: string[];
  currentDialog?: string;
}

export interface AgentState {
  // Map of agent instances by ID
  agents: Map<string, AgentInstance>;

  // Selected agent IDs
  selectedAgentIds: string[];

  // Agent type to instance mapping (for single instance per type)
  agentTypeInstances: Map<AgentType, string>;

  // Global visibility
  isVisible: boolean;

  // Actions
  addAgent: (agent: Omit<AgentInstance, 'dialogQueue'>) => void;
  removeAgent: (agentId: string) => void;
  updateAgentStatus: (agentId: string, status: AgentStatus) => void;
  updateAgentPosition: (agentId: string, x: number, y: number) => void;
  moveAgentTo: (agentId: string, x: number, y: number) => void;
  selectAgent: (agentId: string) => void;
  deselectAgent: (agentId: string) => void;
  toggleAgentSelection: (agentId: string) => void;
  clearSelection: () => void;
  setAgentVisibility: (agentId: string, visible: boolean) => void;
  setGlobalVisibility: (visible: boolean) => void;
  setAgentTask: (agentId: string, task?: string) => void;
  addAgentDialog: (agentId: string, dialog: string) => void;
  clearAgentDialog: (agentId: string) => void;
  getAgentByType: (type: AgentType) => AgentInstance | undefined;
  getAgentsByStatus: (status: AgentStatus) => AgentInstance[];
  getActiveAgents: () => AgentInstance[];
}

const createInitialState = (): Map<string, AgentInstance> => new Map();

export const useAgentStore = create<AgentState>((set, get) => ({
  // Initial state
  agents: createInitialState(),
  selectedAgentIds: [],
  agentTypeInstances: new Map(),
  isVisible: true,

  // Add a new agent instance
  addAgent: (agent) => {
    const newAgent: AgentInstance = {
      ...agent,
      dialogQueue: [],
    };

    set((state) => {
      const newAgents = new Map(state.agents);
      newAgents.set(agent.id, newAgent);

      const newTypeInstances = new Map(state.agentTypeInstances);
      newTypeInstances.set(agent.type, agent.id);

      return {
        agents: newAgents,
        agentTypeInstances: newTypeInstances,
      };
    });
  },

  // Remove an agent instance
  removeAgent: (agentId) => {
    set((state) => {
      const agent = state.agents.get(agentId);
      if (!agent) return state;

      const newAgents = new Map(state.agents);
      newAgents.delete(agentId);

      const newTypeInstances = new Map(state.agentTypeInstances);
      newTypeInstances.delete(agent.type);

      const newSelectedIds = state.selectedAgentIds.filter((id) => id !== agentId);

      return {
        agents: newAgents,
        agentTypeInstances: newTypeInstances,
        selectedAgentIds: newSelectedIds,
      };
    });
  },

  // Update agent status
  updateAgentStatus: (agentId, status) => {
    set((state) => {
      const agent = state.agents.get(agentId);
      if (!agent) return state;

      const newAgents = new Map(state.agents);
      newAgents.set(agentId, { ...agent, status });

      return { agents: newAgents };
    });
  },

  // Update agent position (immediate)
  updateAgentPosition: (agentId, x, y) => {
    set((state) => {
      const agent = state.agents.get(agentId);
      if (!agent) return state;

      const newAgents = new Map(state.agents);
      newAgents.set(agentId, {
        ...agent,
        x,
        y,
        targetX: x,
        targetY: y,
      });

      return { agents: newAgents };
    });
  },

  // Move agent to target position
  moveAgentTo: (agentId, x, y) => {
    set((state) => {
      const agent = state.agents.get(agentId);
      if (!agent) return state;

      const newAgents = new Map(state.agents);
      newAgents.set(agentId, {
        ...agent,
        targetX: x,
        targetY: y,
      });

      return { agents: newAgents };
    });
  },

  // Select an agent
  selectAgent: (agentId) => {
    set((state) => {
      const agent = state.agents.get(agentId);
      if (!agent) return state;

      const newAgents = new Map(state.agents);
      newAgents.set(agentId, { ...agent, isSelected: true });

      return {
        agents: newAgents,
        selectedAgentIds: [...state.selectedAgentIds, agentId],
      };
    });
  },

  // Deselect an agent
  deselectAgent: (agentId) => {
    set((state) => {
      const agent = state.agents.get(agentId);
      if (!agent) return state;

      const newAgents = new Map(state.agents);
      newAgents.set(agentId, { ...agent, isSelected: false });

      return {
        agents: newAgents,
        selectedAgentIds: state.selectedAgentIds.filter((id) => id !== agentId),
      };
    });
  },

  // Toggle agent selection
  toggleAgentSelection: (agentId) => {
    const agent = get().agents.get(agentId);
    if (!agent) return;

    if (agent.isSelected) {
      get().deselectAgent(agentId);
    } else {
      get().selectAgent(agentId);
    }
  },

  // Clear all selections
  clearSelection: () => {
    set((state) => {
      const newAgents = new Map(state.agents);

      state.selectedAgentIds.forEach((id) => {
        const agent = newAgents.get(id);
        if (agent) {
          newAgents.set(id, { ...agent, isSelected: false });
        }
      });

      return {
        agents: newAgents,
        selectedAgentIds: [],
      };
    });
  },

  // Set agent visibility
  setAgentVisibility: (agentId, visible) => {
    set((state) => {
      const agent = state.agents.get(agentId);
      if (!agent) return state;

      const newAgents = new Map(state.agents);
      newAgents.set(agentId, { ...agent, isVisible: visible });

      return { agents: newAgents };
    });
  },

  // Set global visibility
  setGlobalVisibility: (visible) => {
    set((state) => {
      const newAgents = new Map(state.agents);

      state.agents.forEach((agent, id) => {
        newAgents.set(id, { ...agent, isVisible: visible });
      });

      return {
        agents: newAgents,
        isVisible: visible,
      };
    });
  },

  // Set agent current task
  setAgentTask: (agentId, task) => {
    set((state) => {
      const agent = state.agents.get(agentId);
      if (!agent) return state;

      const newAgents = new Map(state.agents);
      newAgents.set(agentId, { ...agent, currentTask: task });

      return { agents: newAgents };
    });
  },

  // Add dialog to agent queue
  addAgentDialog: (agentId, dialog) => {
    set((state) => {
      const agent = state.agents.get(agentId);
      if (!agent) return state;

      const newAgents = new Map(state.agents);
      const updatedAgent = {
        ...agent,
        dialogQueue: [...agent.dialogQueue, dialog],
        currentDialog: agent.currentDialog ?? dialog,
      };
      newAgents.set(agentId, updatedAgent);

      return { agents: newAgents };
    });

    // Auto-clear dialog after delay
    setTimeout(() => {
      get().clearAgentDialog(agentId);
    }, 3000);
  },

  // Clear agent dialog
  clearAgentDialog: (agentId) => {
    set((state) => {
      const agent = state.agents.get(agentId);
      if (!agent) return state;

      const newAgents = new Map(state.agents);
      const [, ...remainingDialogs] = agent.dialogQueue;

      newAgents.set(agentId, {
        ...agent,
        dialogQueue: remainingDialogs,
        currentDialog: remainingDialogs[0],
      });

      return { agents: newAgents };
    });
  },

  // Get agent by type
  getAgentByType: (type) => {
    const agentId = get().agentTypeInstances.get(type);
    if (!agentId) return undefined;
    return get().agents.get(agentId);
  },

  // Get agents by status
  getAgentsByStatus: (status) => {
    return Array.from(get().agents.values()).filter(
      (agent) => agent.status === status
    );
  },

  // Get active (non-idle) agents
  getActiveAgents: () => {
    return Array.from(get().agents.values()).filter(
      (agent) => agent.status !== 'idle' && agent.isVisible
    );
  },
}));

export default useAgentStore;
