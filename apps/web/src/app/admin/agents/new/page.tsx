'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import Link from 'next/link';

export default function NewAgentPage() {
  return (
    <AdminLayout>
      <div>
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin/agents" className="text-indigo-600 hover:text-indigo-800">
              ← 返回智能体管理
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">创建智能体</h1>
          <p className="text-gray-600 mt-2">配置新的 AI 助手</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🤖</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">页面开发中</h2>
            <p className="text-gray-500">智能体创建功能即将上线，敬请期待...</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mt-6">
            <h3 className="font-medium text-gray-900 mb-4">计划功能：</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                配置智能体人格特征
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                设置智能体技能和能力
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                自定义智能体外观
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                配置智能体行为模式
              </li>
              <li className="flex items-center gap-2">
                <span className="text-yellow-500">○</span>
                连接 LLM 服务
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
