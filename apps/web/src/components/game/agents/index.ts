/**
 * Agent Sprites Module
 *
 * Exports all agent sprite classes for the AI Agent Rendering System
 */

export {
  AgentSprite,
  type AgentStatus,
  type AgentState,
  type AgentSpriteOptions,
} from './AgentSprite';

export {
  AgentAnimationManager,
  type AnimationConfig,
  type EasingFunction,
  type EmotionState,
} from './AgentAnimationManager';

export {
  SpeechBubble,
  type SpeechBubbleOptions,
  type BubblePosition,
} from './SpeechBubble';

export {
  AgentPanelPixi,
  type AgentPanelOptions,
  type AgentCardData,
} from './AgentPanelPixi';

export { MentorAgent } from './MentorAgent';
export { DesignerAgent } from './DesignerAgent';
export { AnalystAgent } from './AnalystAgent';
export { MarketerAgent } from './MarketerAgent';
export { AssistantAgent } from './AssistantAgent';

/**
 * Agent type mapping for easy instantiation
 */
export const AGENT_TYPES = {
  mentor: 'mentor',
  designer: 'designer',
  analyst: 'analyst',
  marketer: 'marketer',
  assistant: 'assistant',
} as const;

export type AgentType = (typeof AGENT_TYPES)[keyof typeof AGENT_TYPES];

/**
 * Agent configuration for all types
 */
export const AGENT_CONFIGS = {
  mentor: {
    name: '智慧导师',
    role: 'Mentor',
    description: '提供学术指导和知识支持',
  },
  designer: {
    name: '创意设计师',
    role: 'Designer',
    description: '负责创意设计和视觉呈现',
  },
  analyst: {
    name: '数据分析师',
    role: 'Analyst',
    description: '负责数据处理和分析洞察',
  },
  marketer: {
    name: '运营推广师',
    role: 'Marketer',
    description: '负责市场推广和品牌建设',
  },
  assistant: {
    name: 'CEO 助手',
    role: 'Assistant',
    description: '协调资源和任务管理',
  },
} as const;
