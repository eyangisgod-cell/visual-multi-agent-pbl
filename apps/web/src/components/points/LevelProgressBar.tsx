'use client';

import React from 'react';

interface LevelProgressBarProps {
  currentLevel: number;
  currentPoints: number;
  nextLevelMinPoints?: number | null;
  levelName?: string;
  nextLevelName?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

/**
 * 等级进度条组件
 * 单独使用或嵌入到其他组件中
 */
export const LevelProgressBar: React.FC<LevelProgressBarProps> = ({
  currentLevel,
  currentPoints,
  nextLevelMinPoints,
  levelName = '初学者',
  nextLevelName = '下一级',
  size = 'md',
  showLabels = true,
}) => {
  // 计算进度百分比
  const calculateProgress = () => {
    if (!nextLevelMinPoints || nextLevelMinPoints <= currentPoints) {
      return 100;
    }

    // 假设当前等级的最低积分是上一级的最低积分 + 等级差
    // 这里简化处理，直接用当前积分除以下一级最低积分
    const prevLevelMinPoints = currentLevel === 1 ? 0 : nextLevelMinPoints * 0.5; // 简化估算
    const range = nextLevelMinPoints - prevLevelMinPoints;
    const progress = currentPoints - prevLevelMinPoints;

    if (range <= 0) return 100;

    return Math.min(100, Math.max(0, (progress / range) * 100));
  };

  const progress = calculateProgress();
  const isMaxLevel = nextLevelMinPoints === null || progress >= 100;

  const sizeClasses = {
    sm: {
      bar: 'h-1.5',
      label: 'text-xs',
    },
    md: {
      bar: 'h-2.5',
      label: 'text-sm',
    },
    lg: {
      bar: 'h-4',
      label: 'text-base',
    },
  };

  return (
    <div className="w-full">
      {showLabels && (
        <div className="flex justify-between mb-1">
          <span className={`${sizeClasses[size].label} text-gray-600`}>
            Lv.{currentLevel} {levelName}
          </span>
          {isMaxLevel ? (
            <span className={`${sizeClasses[size].label} text-amber-600 font-medium`}>
              最高等级
            </span>
          ) : (
            <span className={`${sizeClasses[size].label} text-gray-600`}>
              {Math.round(progress)}%
            </span>
          )}
        </div>
      )}

      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size].bar} overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isMaxLevel
              ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500'
              : 'bg-gradient-to-r from-amber-400 to-orange-500'
          }`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>

      {showLabels && !isMaxLevel && nextLevelMinPoints && (
        <div className="text-xs text-gray-500 mt-1">
          还需 {nextLevelMinPoints - currentPoints} 积分达到 Lv.{currentLevel + 1} {nextLevelName}
        </div>
      )}
    </div>
  );
};

export default LevelProgressBar;
