/**
 * AgentPanel React Component
 *
 * Agent selection and management panel for the game.
 * Displays all available AI agents with their status and allows selection.
 */

'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { AgentType, AGENT_CONFIGS, AgentStatus } from '../components/game/agents';

export interface AgentCardProps {
  agentType: AgentType;
  isSelected: boolean;
  status: AgentStatus;
  onClick: (agentType: AgentType) => void;
  disabled?: boolean;
}

export interface AgentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAgents: AgentType[];
  onAgentSelect: (agentType: AgentType) => void;
  onAgentDeselect: (agentType: AgentType) => void;
  agentStatuses?: Record<AgentType, AgentStatus>;
  maxSelection?: number;
  title?: string;
}

const AgentCard: React.FC<AgentCardProps> = ({
  agentType,
  isSelected,
  status,
  onClick,
  disabled = false,
}) => {
  const config = AGENT_CONFIGS[agentType];

  const statusColors: Record<AgentStatus, string> = {
    idle: 'bg-gray-400',
    thinking: 'bg-purple-500',
    speaking: 'bg-blue-500',
    working: 'bg-green-500',
  };

  const statusLabels: Record<AgentStatus, string> = {
    idle: '空闲',
    thinking: '思考中',
    speaking: '发言中',
    working: '工作中',
  };

  const agentColors: Record<AgentType, { bg: string; border: string; accent: string }> = {
    mentor: {
      bg: 'bg-purple-50',
      border: 'border-purple-300',
      accent: 'bg-purple-500',
    },
    designer: {
      bg: 'bg-orange-50',
      border: 'border-orange-300',
      accent: 'bg-orange-500',
    },
    analyst: {
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      accent: 'bg-blue-500',
    },
    marketer: {
      bg: 'bg-pink-50',
      border: 'border-pink-300',
      accent: 'bg-pink-500',
    },
    assistant: {
      bg: 'bg-green-50',
      border: 'border-green-300',
      accent: 'bg-green-500',
    },
  };

  const colors = agentColors[agentType];

  return (
    <motion.button
      layout
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={() => onClick(agentType)}
      disabled={disabled}
      className={clsx(
        'relative flex flex-col items-center rounded-xl border-2 p-4 transition-all',
        colors.bg,
        colors.border,
        isSelected ? 'ring-2 ring-yellow-400 ring-offset-2' : '',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:shadow-lg'
      )}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400 text-white">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Agent avatar placeholder */}
      <div
        className={clsx(
          'mb-3 flex h-16 w-16 items-center justify-center rounded-full',
          colors.accent,
          'text-white text-2xl font-bold'
        )}
      >
        {config.name.charAt(0)}
      </div>

      {/* Agent name */}
      <h3 className="text-sm font-bold text-gray-800">{config.name}</h3>
      <p className="text-xs text-gray-500">{config.role}</p>

      {/* Status indicator */}
      <div className="mt-2 flex items-center gap-1.5">
        <span className={clsx('h-2 w-2 rounded-full', statusColors[status])} />
        <span className="text-xs text-gray-600">{statusLabels[status]}</span>
      </div>

      {/* Description */}
      <p className="mt-2 text-xs text-gray-500 text-center">{config.description}</p>
    </motion.button>
  );
};

const AgentPanel: React.FC<AgentPanelProps> = ({
  isOpen,
  onClose,
  selectedAgents,
  onAgentSelect,
  onAgentDeselect,
  agentStatuses,
  maxSelection = 3,
  title = '选择智能体',
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleAgentClick = useCallback(
    (agentType: AgentType) => {
      if (selectedAgents.includes(agentType)) {
        onAgentDeselect(agentType);
      } else if (selectedAgents.length < maxSelection) {
        onAgentSelect(agentType);
      }
    },
    [selectedAgents, maxSelection, onAgentSelect, onAgentDeselect]
  );

  const filteredAgents = (Object.keys(AGENT_CONFIGS) as AgentType[]).filter(
    (agentType) =>
      AGENT_CONFIGS[agentType].name.includes(searchTerm) ||
      AGENT_CONFIGS[agentType].role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      AGENT_CONFIGS[agentType].description.includes(searchTerm)
  );

  const defaultStatuses: Record<AgentType, AgentStatus> = {
    mentor: 'idle',
    designer: 'idle',
    analyst: 'idle',
    marketer: 'idle',
    assistant: 'idle',
  };

  const statuses = agentStatuses ?? defaultStatuses;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-50 h-full w-96 overflow-y-auto bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 border-b bg-white px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800">{title}</h2>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                  aria-label="Close panel"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Search */}
              <div className="mt-3">
                <input
                  type="text"
                  placeholder="搜索智能体..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Selection counter */}
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>已选择 {selectedAgents.length} / {maxSelection} 个智能体</span>
                {selectedAgents.length > 0 && (
                  <button
                    onClick={() => {
                      selectedAgents.forEach((agent) => onAgentDeselect(agent));
                    }}
                    className="text-blue-500 hover:underline"
                  >
                    清除全部
                  </button>
                )}
              </div>
            </div>

            {/* Agent list */}
            <div className="p-4">
              <div className="grid grid-cols-1 gap-3">
                {filteredAgents.map((agentType) => (
                  <AgentCard
                    key={agentType}
                    agentType={agentType}
                    isSelected={selectedAgents.includes(agentType)}
                    status={statuses[agentType]}
                    onClick={handleAgentClick}
                    disabled={
                      !selectedAgents.includes(agentType) &&
                      selectedAgents.length >= maxSelection
                    }
                  />
                ))}
              </div>

              {filteredAgents.length === 0 && (
                <div className="py-8 text-center text-gray-500">
                  <p>未找到匹配的智能体</p>
                </div>
              )}
            </div>

            {/* Footer help text */}
            <div className="sticky bottom-0 border-t bg-gray-50 px-6 py-4 text-xs text-gray-500">
              <p>点击智能体卡片进行选择或取消选择。最多可选择 {maxSelection} 个智能体参与项目。</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AgentPanel;
