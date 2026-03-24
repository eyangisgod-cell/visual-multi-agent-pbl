/**
 * AgentStateVisualizer Component
 *
 * Visual component for displaying and managing agent states.
 * Integrates with PixiJS game scene and React UI.
 */

'use client';

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useAgentStore, type AgentInstance } from '../../stores/agentStore';
import { AgentType, AGENT_CONFIGS, AgentStatus } from '../game/agents';
import SpeechBubble from './SpeechBubble';

export interface AgentStateVisualizerProps {
  className?: string;
  showOnlyActive?: boolean;
  compact?: boolean;
}

const AgentStateVisualizer: React.FC<AgentStateVisualizerProps> = ({
  className,
  showOnlyActive = false,
  compact = false,
}) => {
  const {
    agents,
    selectedAgentIds,
    updateAgentStatus,
    toggleAgentSelection,
    setAgentTask,
    addAgentDialog,
    getAgentByType,
  } = useAgentStore();

  const agentsList = React.useMemo(
    () => Array.from(agents.values()),
    [agents]
  );

  const filteredAgents = React.useMemo(
    () =>
      showOnlyActive
        ? agentsList.filter((agent) => agent.status !== 'idle')
        : agentsList,
    [agentsList, showOnlyActive]
  );

  const getStatusIcon = (status: AgentStatus): JSX.Element => {
    switch (status) {
      case 'idle':
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'thinking':
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'speaking':
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        );
      case 'working':
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
    }
  };

  const getStatusColor = (status: AgentStatus): string => {
    switch (status) {
      case 'idle':
        return 'text-gray-400 bg-gray-100';
      case 'thinking':
        return 'text-purple-600 bg-purple-100';
      case 'speaking':
        return 'text-blue-600 bg-blue-100';
      case 'working':
        return 'text-green-600 bg-green-100';
    }
  };

  const getAgentColor = (type: AgentType): string => {
    const colors: Record<AgentType, string> = {
      mentor: 'border-purple-300 bg-purple-50',
      designer: 'border-orange-300 bg-orange-50',
      analyst: 'border-blue-300 bg-blue-50',
      marketer: 'border-pink-300 bg-pink-50',
      assistant: 'border-green-300 bg-green-50',
    };
    return colors[type];
  };

  const handleAgentClick = useCallback(
    (agentId: string) => {
      toggleAgentSelection(agentId);
    },
    [toggleAgentSelection]
  );

  const handleSimulateDialog = useCallback(
    (agentId: string) => {
      const agent = agents.get(agentId);
      if (!agent) return;

      const dialogs: Record<AgentType, string[]> = {
        mentor: [
          '让我思考一下这个问题...',
          '根据我的分析，建议采用以下方法。',
          '这是一个很好的学习机会。',
        ],
        designer: [
          '我有个创意想法！',
          '这个设计需要更多视觉冲击力。',
          '让我来优化一下配色方案。',
        ],
        analyst: [
          '数据显示这个方案可行。',
          '我正在分析相关指标。',
          '根据数据趋势，建议调整策略。',
        ],
        marketer: [
          '这个功能很有市场潜力！',
          '我们需要加强推广力度。',
          '让我来制定营销策略。',
        ],
        assistant: [
          '我来协调相关资源。',
          '任务已分配，正在跟进进度。',
          '需要我帮忙安排会议吗？',
        ],
      };

      const agentDialogs = dialogs[agent.type as keyof typeof dialogs];
      const randomDialog =
        agentDialogs[Math.floor(Math.random() * agentDialogs.length)];

      addAgentDialog(agentId, randomDialog);
      updateAgentStatus(agentId, 'speaking');

      // Return to idle after delay
      setTimeout(() => {
        updateAgentStatus(agentId, 'idle');
      }, 3000);
    },
    [agents, addAgentDialog, updateAgentStatus]
  );

  if (filteredAgents.length === 0) {
    return (
      <div
        className={clsx(
          'flex items-center justify-center p-8 text-gray-400',
          className
        )}
      >
        <p>暂无智能体</p>
      </div>
    );
  }

  return (
    <div className={clsx('space-y-3', className)}>
      <AnimatePresence>
        {filteredAgents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            isSelected={selectedAgentIds.includes(agent.id)}
            statusColor={getStatusColor(agent.status)}
            statusIcon={getStatusIcon(agent.status)}
            agentColor={getAgentColor(agent.type)}
            onClick={() => handleAgentClick(agent.id)}
            onSimulateDialog={() => handleSimulateDialog(agent.id)}
            compact={compact}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface AgentCardProps {
  agent: AgentInstance;
  isSelected: boolean;
  statusColor: string;
  statusIcon: React.ReactNode;
  agentColor: string;
  onClick: () => void;
  onSimulateDialog: () => void;
  compact: boolean;
}

const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  isSelected,
  statusColor,
  statusIcon,
  agentColor,
  onClick,
  onSimulateDialog,
  compact,
}) => {
  const config = AGENT_CONFIGS[agent.type as keyof typeof AGENT_CONFIGS];
  const [showSpeechBubble, setShowSpeechBubble] = React.useState(false);

  useEffect(() => {
    if (agent.currentDialog) {
      setShowSpeechBubble(true);
      const timer = setTimeout(() => {
        setShowSpeechBubble(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [agent.currentDialog]);

  return (
    <motion.div
      layout
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className={clsx(
        'relative flex items-center gap-3 rounded-xl border-2 p-3 transition-all',
        agentColor,
        isSelected ? 'ring-2 ring-yellow-400 ring-offset-2' : '',
        'cursor-pointer hover:shadow-md'
      )}
      onClick={onClick}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-white">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Avatar */}
      <div
        className={clsx(
          'flex h-10 w-10 items-center justify-center rounded-full text-white font-bold',
          compact ? 'h-8 w-8 text-sm' : '',
          agentColor.includes('purple') ? 'bg-purple-500' :
          agentColor.includes('orange') ? 'bg-orange-500' :
          agentColor.includes('blue') ? 'bg-blue-500' :
          agentColor.includes('pink') ? 'bg-pink-500' :
          'bg-green-500'
        )}
      >
        {config.name.charAt(0)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-gray-800 truncate">{config.name}</h4>
          <span
            className={clsx(
              'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs',
              statusColor
            )}
          >
            {statusIcon}
            <span className="hidden sm:inline">
              {
                { idle: '空闲', thinking: '思考', speaking: '发言', working: '工作' }[
                  agent.status as AgentStatus
                ]
              }
            </span>
          </span>
        </div>

        {agent.currentTask && (
          <p className="mt-1 text-xs text-gray-500 truncate">
            任务：{agent.currentTask}
          </p>
        )}

        {agent.currentDialog && (
          <p className="mt-1 text-xs text-gray-600 italic truncate">
            &ldquo;{agent.currentDialog}&rdquo;
          </p>
        )}
      </div>

      {/* Simulate dialog button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSimulateDialog();
        }}
        className="rounded-full p-2 text-gray-400 hover:bg-white hover:text-blue-500"
        title="模拟对话"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>

      {/* Speech Bubble */}
      {agent.currentDialog && (
        <div className="absolute left-full top-0 ml-2">
          <SpeechBubble
            text={agent.currentDialog}
            isVisible={showSpeechBubble}
            position="left"
            variant={agent.status === 'idle' ? 'default' : agent.status}
            agentName={config.name}
          />
        </div>
      )}
    </motion.div>
  );
};

export default AgentStateVisualizer;
