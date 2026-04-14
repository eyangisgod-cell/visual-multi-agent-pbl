'use client';

import React, { useState, useEffect } from 'react';
import { PointsDisplay, PointsLogList, LevelProgressBar } from '@/components/points';

interface PointsData {
  userId: string;
  points: number;
  level: number;
  levelName: string;
  nextLevelMinPoints: number | null;
  progressToNextLevel: number;
}

/**
 * 用户积分页面
 * 显示用户积分、等级和积分明细
 */
export default function UserPointsPage() {
  const [pointsData, setPointsData] = useState<PointsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取用户积分数据
  const fetchPointsData = async () => {
    try {
      setLoading(true);
      // 这里假设从当前登录用户获取，实际使用时可能需要从 context 或 auth 获取 userId
      const response = await fetch('/api/users/current/points');

      if (!response.ok) {
        if (response.status === 404) {
          // 如果没有当前用户 endpoint，尝试从 URL 或其他地方获取
          throw new Error('无法获取用户积分信息');
        }
        throw new Error('获取积分信息失败');
      }

      const data = await response.json();
      setPointsData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPointsData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mb-4"></div>
          <div className="text-gray-600">加载中...</div>
        </div>
      </div>
    );
  }

  if (error || !pointsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error || '无法加载积分信息'}</div>
          <button
            onClick={fetchPointsData}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">我的积分</h1>
          <p className="text-amber-100">查看积分余额和积分明细</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-6">
        {/* 积分卡片 */}
        <div className="mb-6">
          <PointsDisplay
            points={pointsData.points}
            level={pointsData.level}
            levelName={pointsData.levelName}
            nextLevelMinPoints={pointsData.nextLevelMinPoints}
            progressToNextLevel={pointsData.progressToNextLevel}
            size="lg"
          />
        </div>

        {/* 等级进度条单独展示 */}
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">等级进度</h2>
          <LevelProgressBar
            currentLevel={pointsData.level}
            currentPoints={pointsData.points}
            nextLevelMinPoints={pointsData.nextLevelMinPoints}
            levelName={pointsData.levelName}
            size="lg"
          />
        </div>

        {/* 积分等级说明 */}
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">积分等级</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <LevelBadge level={1} name="初学者" points="0+" color="bg-gray-100" />
            <LevelBadge level={2} name="新手" points="100+" color="bg-green-100" />
            <LevelBadge level={3} name="进阶者" points="300+" color="bg-blue-100" />
            <LevelBadge level={4} name="高手" points="600+" color="bg-purple-100" />
            <LevelBadge level={5} name="专家" points="1000+" color="bg-indigo-100" />
            <LevelBadge level={6} name="大师" points="2000+" color="bg-pink-100" />
            <LevelBadge level={7} name="宗师" points="5000+" color="bg-amber-100" />
          </div>
        </div>

        {/* 积分明细 */}
        <div className="mb-6">
          <PointsLogList userId="current" limit={10} />
        </div>
      </div>
    </div>
  );
}

// 等级徽章组件
function LevelBadge({ level, name, points, color }: { level: number; name: string; points: string; color: string }) {
  return (
    <div className={`${color} rounded-lg p-3 text-center`}>
      <div className="text-xs text-gray-600 mb-1">Lv.{level}</div>
      <div className="font-medium text-gray-800">{name}</div>
      <div className="text-xs text-gray-500 mt-1">{points}</div>
    </div>
  );
}
