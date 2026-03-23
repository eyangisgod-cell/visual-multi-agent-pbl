/**
 * AgentScene Integration Hook
 *
 * Connects PixiJS agent rendering with React state management.
 * Synchronizes agent sprites with the agent store.
 */

import { useEffect, useRef, useCallback } from 'react';
import { Application } from 'pixi.js';
import { useAgentStore } from '../stores/agentStore';
import {
  AgentSprite,
  AgentStatus,
  AgentAnimationManager,
  SpeechBubble,
  MentorAgent,
  DesignerAgent,
  AnalystAgent,
  MarketerAgent,
  AssistantAgent,
  AgentType,
} from '../components/game/agents';

export interface AgentSceneConfig {
  canvasId: string;
  width: number;
  height: number;
  backgroundColor?: number;
}

export interface AgentPosition {
  x: number;
  y: number;
}

// Default agent positions in the scene
const DEFAULT_AGENT_POSITIONS: Record<AgentType, AgentPosition> = {
  mentor: { x: 100, y: 300 },
  designer: { x: 300, y: 300 },
  analyst: { x: 500, y: 300 },
  marketer: { x: 700, y: 300 },
  assistant: { x: 900, y: 300 },
};

export function useAgentScene(config: AgentSceneConfig) {
  const appRef = useRef<Application | null>(null);
  const agentsRef = useRef<Map<string, AgentSprite>>(new Map());
  const animationManagersRef = useRef<Map<string, AgentAnimationManager>>(
    new Map()
  );
  const speechBubblesRef = useRef<Map<string, SpeechBubble>>(new Map());
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    agents,
    updateAgentStatus,
    toggleAgentSelection,
    moveAgentTo,
    addAgentDialog,
  } = useAgentStore();

  /**
   * Create agent sprite based on type
   */
  const createAgentSprite = useCallback(
    (type: AgentType, x: number, y: number): AgentSprite => {
      switch (type) {
        case 'mentor':
          return new MentorAgent(x, y);
        case 'designer':
          return new DesignerAgent(x, y);
        case 'analyst':
          return new AnalystAgent(x, y);
        case 'marketer':
          return new MarketerAgent(x, y);
        case 'assistant':
          return new AssistantAgent(x, y);
        default:
          return new AgentSprite({
            id: type,
            name: type,
            role: type,
            description: type,
            primaryColor: 0x888888,
            secondaryColor: 0x666666,
            accessoryColor: 0x444444,
            x,
            y,
          });
      }
    },
    []
  );

  /**
   * Initialize PixiJS application and agent sprites
   */
  useEffect(() => {
    const container = document.getElementById(config.canvasId);
    if (!container) {
      console.error(`Canvas container #${config.canvasId} not found`);
      return;
    }

    containerRef.current = container as HTMLDivElement;

    // Create PixiJS application
    const app = new Application();

    app
      .init({
        width: config.width,
        height: config.height,
        backgroundColor: config.backgroundColor ?? 0xf0f9ff,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true,
      })
      .then(() => {
        container.appendChild(app.canvas as HTMLCanvasElement);

        // Create agent sprites for all existing agents
        agents.forEach((agentState, agentId) => {
          const position =
            DEFAULT_AGENT_POSITIONS[agentState.type] ??
            DEFAULT_AGENT_POSITIONS.mentor;

          const sprite = createAgentSprite(
            agentState.type,
            position.x,
            position.y
          );

          // Setup callbacks
          sprite.onClick = () => {
            toggleAgentSelection(agentId);
          };

          sprite.onStatusChange = (_, newStatus) => {
            updateAgentStatus(agentId, newStatus);
          };

          // Add to scene
          app.stage.addChild(sprite);
          agentsRef.current.set(agentId, sprite);

          // Create animation manager
          const animManager = new AgentAnimationManager(sprite, app.stage);
          animationManagersRef.current.set(agentId, animManager);
        });

        appRef.current = app;
      });

    // Handle resize
    const handleResize = () => {
      if (appRef.current) {
        const { clientWidth, clientHeight } = container;
        appRef.current.renderer.resize(clientWidth, clientHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);

      // Destroy animation managers
      animationManagersRef.current.forEach((manager) => manager.destroy());
      animationManagersRef.current.clear();

      // Destroy speech bubbles
      speechBubblesRef.current.forEach((bubble) => bubble.destroy());
      speechBubblesRef.current.clear();

      // Destroy agent sprites
      agentsRef.current.forEach((sprite) =>
        app.stage.removeChild(sprite)
      );
      agentsRef.current.clear();

      // Destroy app
      app.destroy(true);
      appRef.current = null;
    };
  }, [config.canvasId, config.width, config.height, config.backgroundColor]);

  /**
   * Sync agent store changes with PixiJS sprites
   */
  useEffect(() => {
    if (!appRef.current) return;

    agents.forEach((agentState, agentId) => {
      const sprite = agentsRef.current.get(agentId);
      const animManager = animationManagersRef.current.get(agentId);

      if (!sprite) {
        // Agent was added, create sprite
        const position =
          DEFAULT_AGENT_POSITIONS[agentState.type] ??
          DEFAULT_AGENT_POSITIONS.mentor;

        const newSprite = createAgentSprite(
          agentState.type,
          position.x,
          position.y
        );

        newSprite.onClick = () => {
          toggleAgentSelection(agentId);
        };

        newSprite.onStatusChange = (_, newStatus) => {
          updateAgentStatus(agentId, newStatus);
        };

        appRef.current?.stage.addChild(newSprite);
        agentsRef.current.set(agentId, newSprite);

        const newAnimManager = new AgentAnimationManager(
          newSprite,
          appRef.current!.stage
        );
        animationManagersRef.current.set(agentId, newAnimManager);
      } else {
        // Update existing sprite
        sprite.setSelected(agentState.isSelected);
        sprite.setVisible(agentState.isVisible);

        if (sprite.x !== agentState.targetX || sprite.y !== agentState.targetY) {
          sprite.moveTo(agentState.targetX, agentState.targetY);
        }

        // Update animation based on status
        if (animManager) {
          animManager.playStatusAnimation(agentState.status);
        }

        // Handle dialog
        if (agentState.currentDialog && !speechBubblesRef.current.has(agentId)) {
          const bubble = new SpeechBubble({
            text: agentState.currentDialog,
            position: 'top',
            duration: 3000,
            animated: true,
          });

          sprite.addChild(bubble);
          speechBubblesRef.current.set(agentId, bubble);
          bubble.show();
        } else if (!agentState.currentDialog) {
          const existingBubble = speechBubblesRef.current.get(agentId);
          if (existingBubble) {
            existingBubble.hide();
            sprite.removeChild(existingBubble);
            speechBubblesRef.current.delete(agentId);
          }
        }
      }
    });

    // Remove sprites for agents that no longer exist
    agentsRef.current.forEach((sprite, agentId) => {
      if (!agents.has(agentId)) {
        appRef.current?.stage.removeChild(sprite);
        sprite.destroy();
        agentsRef.current.delete(agentId);

        const animManager = animationManagersRef.current.get(agentId);
        if (animManager) {
          animManager.destroy();
          animationManagersRef.current.delete(agentId);
        }

        const bubble = speechBubblesRef.current.get(agentId);
        if (bubble) {
          bubble.destroy();
          speechBubblesRef.current.delete(agentId);
        }
      }
    });
  }, [agents]);

  /**
   * Move an agent to a new position
   */
  const moveAgent = useCallback(
    (agentId: string, x: number, y: number, duration?: number) => {
      const sprite = agentsRef.current.get(agentId);
      if (sprite) {
        sprite.moveTo(x, y);
        moveAgentTo(agentId, x, y);
      }
    },
    [moveAgentTo]
  );

  /**
   * Make an agent speak with a dialog
   */
  const speak = useCallback(
    (agentId: string, dialog: string, duration: number = 3000) => {
      addAgentDialog(agentId, dialog);
      updateAgentStatus(agentId, 'speaking');

      // Return to idle after dialog
      setTimeout(() => {
        updateAgentStatus(agentId, 'idle');
      }, duration);
    },
    [addAgentDialog, updateAgentStatus]
  );

  /**
   * Set agent status
   */
  const setAgentStatus = useCallback(
    (agentId: string, status: AgentStatus) => {
      updateAgentStatus(agentId, status);
    },
    [updateAgentStatus]
  );

  /**
   * Get agent sprite by ID
   */
  const getAgentSprite = useCallback((agentId: string): AgentSprite | undefined => {
    return agentsRef.current.get(agentId);
  }, []);

  /**
   * Get all agent sprites
   */
  const getAllAgentSprites = useCallback((): Map<string, AgentSprite> => {
    return new Map(agentsRef.current);
  }, []);

  return {
    // PixiJS application
    app: appRef.current,

    // Agent functions
    moveAgent,
    speak,
    setAgentStatus,
    getAgentSprite,
    getAllAgentSprites,

    // Refs
    containerRef,
  };
}

export default useAgentScene;
