'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuditLog {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  userId: string | null;
  username: string | null;
  metadata: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AuditLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; totalPages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionType, setActionType] = useState('');

  // 获取审计日志列表
  const fetchLogs = async (pageNum: number, type?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
        ...(type && { actionType: type }),
      });

      const res = await fetch(`/api/admin/audit-logs?${params}`);
      const data = await res.json();
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, []);

  // 筛选日志
  const handleFilter = () => {
    setPage(1);
    fetchLogs(1, actionType || undefined);
  };

  // 重置筛选
  const handleReset = () => {
    setActionType('');
    setPage(1);
    fetchLogs(1);
  };

  // 获取操作类型显示名称
  const getActionName = (action: string) => {
    const actionMap: Record<string, string> = {
      WORK_APPROVED: '作品批准',
      WORK_REJECTED: '作品拒绝',
      USER_LOGIN: '用户登录',
      USER_LOGOUT: '用户登出',
      PROJECT_CREATED: '项目创建',
      PROJECT_UPDATED: '项目更新',
      PROJECT_DELETED: '项目删除',
      AGENT_CREATED: '智能体创建',
      AGENT_UPDATED: '智能体更新',
      AGENT_DELETED: '智能体删除',
    };
    return actionMap[action] || action;
  };

  // 获取操作类型样式
  const getActionBadgeStyle = (action: string) => {
    if (action.includes('APPROVED')) return 'bg-green-100 text-green-800';
    if (action.includes('REJECTED')) return 'bg-red-100 text-red-800';
    if (action.includes('DELETED')) return 'bg-gray-100 text-gray-800';
    if (action.includes('CREATED')) return 'bg-blue-100 text-blue-800';
    if (action.includes('UPDATED')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">审计日志</h1>
        <div className="text-sm text-gray-500">
          总记录数：{pagination?.total || 0}
        </div>
      </div>

      {/* 筛选器 */}
      <div className="mb-4 flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            操作类型
          </label>
          <select
            data-testid="action-type-filter"
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            className="px-3 py-2 border rounded-lg min-w-[200px]"
          >
            <option value="">全部</option>
            <option value="WORK_APPROVED">作品批准</option>
            <option value="WORK_REJECTED">作品拒绝</option>
            <option value="USER_LOGIN">用户登录</option>
            <option value="USER_LOGOUT">用户登出</option>
            <option value="PROJECT_CREATED">项目创建</option>
            <option value="PROJECT_UPDATED">项目更新</option>
            <option value="PROJECT_DELETED">项目删除</option>
            <option value="AGENT_CREATED">智能体创建</option>
            <option value="AGENT_UPDATED">智能体更新</option>
            <option value="AGENT_DELETED">智能体删除</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            data-testid="reset-filter-btn"
            onClick={handleReset}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            重置
          </button>
          <button
            onClick={handleFilter}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            筛选
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">加载中...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          暂无审计日志
        </div>
      ) : (
        <>
          <div data-testid="audit-logs-table" className="bg-white rounded-xl shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作类型</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">实体类型</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">实体 ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作人</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP 地址</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作时间</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${getActionBadgeStyle(log.action)}`}>
                        {getActionName(log.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {log.entityType || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                      {log.entityId?.substring(0, 8) || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {log.username || log.userId?.substring(0, 8) || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                      {log.ipAddress || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(log.createdAt).toLocaleString('zh-CN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          {pagination && (
            <div className="mt-4 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                第 {pagination.page} 页，共 {pagination.totalPages} 页，总计 {pagination.total} 条记录
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (page > 1) {
                      setPage(page - 1);
                      fetchLogs(page - 1, actionType || undefined);
                    }
                  }}
                  disabled={page <= 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  上一页
                </button>
                <button
                  onClick={() => {
                    if (page < pagination.totalPages) {
                      setPage(page + 1);
                      fetchLogs(page + 1, actionType || undefined);
                    }
                  }}
                  disabled={page >= pagination.totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
