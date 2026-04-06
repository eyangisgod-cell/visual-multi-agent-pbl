'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import Link from 'next/link';

export default function NewProjectPage() {
  return (
    <AdminLayout>
      <div>
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin/projects" className="text-indigo-600 hover:text-indigo-800">
              ← 返回项目管理
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">创建新项目</h1>
          <p className="text-gray-600 mt-2">设计新的项目式学习任务</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">📁</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">页面开发中</h2>
            <p className="text-gray-500">项目管理功能即将上线，敬请期待...</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mt-6">
            <h3 className="font-medium text-gray-900 mb-4">计划功能：</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                创建和编辑项目任务
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                分配学生到项目
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                跟踪项目进度
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                查看项目统计数据
              </li>
              <li className="flex items-center gap-2">
                <span className="text-yellow-500">○</span>
                配置项目评估标准
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
