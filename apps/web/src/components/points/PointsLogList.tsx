'use client';

import React, { useState, useEffect } from 'react';

interface PointsLog {
  id: string;
  userId: string;
  points: number;
  balance: number;
  action: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

interface PointsLogListProps {
  userId: string;
  limit?: number;
}

// 积分动作类型映射
const ACTION_LABELS: Record<string, string> = {
  login: '签到登录',
  daily_bonus: '每日奖励',
  submit_work: '提交作品',
  work_approved: '作品通过审核',
  work_rejected: '作品被拒绝',
  manual_adjustment: '手动调整',
  invite_user: '邀请用户',
  complete_task: '完成任务',
  purchase: '消费积分',
  refund: '积分退还',
  admin_bonus: '管理员奖励',
  admin_deduction: '管理员扣除',
};

// 根据积分正负获取样式
const getPointsStyle = (points: number) => {
  if (points > 0) {
    return 'text-green-600 bg-green-50';
  } else if (points < 0) {
    return 'text-red-600 bg-red-50';
  }
  return 'text-gray-600 bg-gray-50';
};

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * 积分明细列表组件
 * 显示用户积分变动记录
 */
export const PointsLogList: React.FC<PointsLogListProps> = ({
  userId,
  limit = 20,
}) => {
  const [logs, setLogs] = useState<PointsLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  // 获取积分记录
  const fetchLogs = async (reset = false) => {
    try {
      setLoading(true);
      const currentOffset = reset ? 0 : offset;
      const response = await fetch(
        `/api/users/${userId}/points?includeLogs=true&limit=${limit}&offset=${currentOffset}`
      );

      if (!response.ok) {
        throw new Error('获取积分记录失败');
      }

      const data = await response.json();

      if (reset) {
        setLogs(data.logs || []);
      } else {
        setLogs((prev) => [...prev, ...(data.logs || [])]);
      }

      setTotal(data.totalLogs || 0);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchLogs(true);
    }
  }, [userId]);

  // 加载更多
  const handleLoadMore = () => {
    setOffset((prev) => prev + limit);
    fetchLogs();
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">积分明细</h3>
        <p className="text-xs text-gray-500 mt-1">共 {total} 条记录</p>
      </div>

      <div className="divide-y divide-gray-100">
        {logs.length === 0 && !loading ? (
          <div className="p-8 text-center text-gray-500">
            暂无积分记录
          </div>
        ) : (
          <>
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-800">
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${getPointsStyle(log.points)}`}
                      >
                        {log.points > 0 ? '+' : ''}{log.points}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">{log.description}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatDate(log.createdAt)} · 余额：{log.balance}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="p-4 text-center">
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-amber-500"></div>
              </div>
            )}

            {!loading && logs.length < total && (
              <div className="p-4 bg-gray-50 text-center">
                <button
                  onClick={handleLoadMore}
                  className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                >
                  加载更多
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PointsLogList;
