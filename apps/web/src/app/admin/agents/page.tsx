'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import Link from 'next/link';

export default function AgentsPage() {
  return (
    <AdminLayout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">智能体管理</h1>
        <p className="text-gray-600 mb-6">配置和管理 AI 智能体</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/admin/agents/select"
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border-2 border-transparent hover:border-indigo-500"
          >
            <div className="text-4xl mb-4">🤖</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">智能体选择</h2>
            <p className="text-gray-600">
              查看和选择可用的智能体，为项目分配合适的 AI 助手
            </p>
            <div className="mt-4 text-indigo-600 font-medium">
              进入 →
            </div>
          </Link>

          <Link
            href="/admin/agents/configurator"
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border-2 border-transparent hover:border-purple-500"
          >
            <div className="text-4xl mb-4">⚙️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">智能体配置</h2>
            <p className="text-gray-600">
              配置智能体参数、人格特征和技能
            </p>
            <div className="mt-4 text-purple-600 font-medium">
              进入 →
            </div>
          </Link>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">智能体管理功能</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 智能体选择 - 为学生和项目选择合适的 AI 智能体</li>
            <li>• 智能体配置 - 自定义智能体的人格和行为</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
