'use client';

import { useEffect, useState } from 'react';

interface DashboardStats {
  totalProjects: number;
  totalUsers: number;
  totalAgents: number;
  activeLlmConfigs: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 获取统计数据
    fetch('/api/admin/dashboard')
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const statCards = [
    { title: '项目总数', value: stats?.totalProjects ?? '-', icon: '📁', color: 'bg-blue-500' },
    { title: '用户总数', value: stats?.totalUsers ?? '-', icon: '👥', color: 'bg-green-500' },
    { title: '智能体数量', value: stats?.totalAgents ?? '-', icon: '🤖', color: 'bg-purple-500' },
    { title: 'LLM 配置', value: stats?.activeLlmConfigs ?? '-', icon: '🧠', color: 'bg-orange-500' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">管理后台仪表盘</h1>
        <p className="text-gray-600 mt-2">欢迎来到管理后台，查看系统概览和数据统计</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                </div>
                <div className={`text-4xl ${card.color} bg-white rounded-full p-4 shadow-md`}>
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">快速操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/projects/new"
            className="p-4 border-2 border-indigo-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
          >
            <div className="text-2xl mb-2">📁</div>
            <div className="font-medium text-gray-900">创建新项目</div>
            <div className="text-sm text-gray-500 mt-1">添加新的项目式学习任务</div>
          </a>
          <a
            href="/admin/agents/new"
            className="p-4 border-2 border-purple-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <div className="text-2xl mb-2">🤖</div>
            <div className="font-medium text-gray-900">创建智能体</div>
            <div className="text-sm text-gray-500 mt-1">配置新的 AI 助手</div>
          </a>
          <a
            href="/admin/llm"
            className="p-4 border-2 border-orange-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
          >
            <div className="text-2xl mb-2">🧠</div>
            <div className="font-medium text-gray-900">配置 LLM</div>
            <div className="text-sm text-gray-500 mt-1">管理大模型连接</div>
          </a>
        </div>
      </div>
    </div>
  );
}
