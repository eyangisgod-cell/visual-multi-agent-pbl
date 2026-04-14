'use client';

import React from 'react';

interface PointsDisplayProps {
  points: number;
  level: number;
  levelName?: string;
  nextLevelMinPoints?: number | null;
  progressToNextLevel?: number;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
}

/**
 * 积分展示组件
 * 显示用户积分、等级和等级进度条
 */
export const PointsDisplay: React.FC<PointsDisplayProps> = ({
  points,
  level,
  levelName = '初学者',
  nextLevelMinPoints,
  progressToNextLevel = 0,
  size = 'md',
  showProgress = true,
}) => {
  const sizeClasses = {
    sm: {
      points: 'text-lg',
      level: 'text-xs',
      label: 'text-xs',
    },
    md: {
      points: 'text-2xl',
      level: 'text-sm',
      label: 'text-sm',
    },
    lg: {
      points: 'text-4xl',
      level: 'text-base',
      label: 'text-base',
    },
  };

  const isMaxLevel = nextLevelMinPoints === null || progressToNextLevel >= 100;

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className={`${sizeClasses[size].label} text-amber-600 font-medium mb-1`}>
            我的积分
          </div>
          <div className={`${sizeClasses[size].points} font-bold text-amber-800`}>
            {points}
          </div>
        </div>
        <div className="text-right">
          <div className={`${sizeClasses[size].label} text-amber-600 font-medium mb-1`}>
            等级
          </div>
          <div className="flex items-center gap-2">
            <span className={`${sizeClasses[size].level} bg-amber-500 text-white px-2 py-1 rounded-full font-bold`}>
              Lv.{level}
            </span>
            <span className={`${sizeClasses[size].level} text-amber-700`}>
              {levelName}
            </span>
          </div>
        </div>
      </div>

      {showProgress && !isMaxLevel && nextLevelMinPoints !== null && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-amber-600 mb-1">
            <span>等级进度</span>
            <span>{Math.round(progressToNextLevel)}%</span>
          </div>
          <div className="w-full bg-amber-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progressToNextLevel))}%` }}
            />
          </div>
          <div className="text-xs text-amber-500 mt-1">
            还需 {Math.max(0, nextLevelMinPoints - points)} 积分升级到下一级
          </div>
        </div>
      )}

      {showProgress && isMaxLevel && (
        <div className="mt-3 text-xs text-amber-600 text-center">
          🎉 已达到最高等级！
        </div>
      )}
    </div>
  );
};

export default PointsDisplay;
