'use client';

import AdminLayout from '@/components/admin/AdminLayout';

export default function LlmConfigPage() {
  return (
    <AdminLayout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">LLM 配置</h1>
        <p className="text-gray-600 mb-6">管理大模型 API 连接配置</p>

        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="text-6xl mb-4">🧠</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">页面开发中</h2>
          <p className="text-gray-500">LLM 配置功能即将上线，敬请期待...</p>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">计划功能：</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 配置 Anthropic/Claude API</li>
            <li>• 配置 OpenAI API</li>
            <li>• 配置本地大模型服务</li>
            <li>• 测试 API 连接</li>
            <li>• 管理 API 密钥</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
