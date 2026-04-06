'use client';

import AdminLayout from '@/components/admin/AdminLayout';

export default function UsersPage() {
  return (
    <AdminLayout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">用户管理</h1>
        <p className="text-gray-600 mb-6">管理用户账户和权限</p>

        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="text-6xl mb-4">👥</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">页面开发中</h2>
          <p className="text-gray-500">用户管理功能即将上线，敬请期待...</p>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">计划功能：</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 查看用户列表</li>
            <li>• 编辑用户信息</li>
            <li>• 管理用户角色</li>
            <li>• 查看用户活动日志</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
