'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Work {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  status: string | null;
  score: number | null;
  projectId: string;
  userId: string;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    nickname: string | null;
  };
  project?: {
    id: string;
    title: string;
  };
}

interface WorksResponse {
  works: Work[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function WorkReviewPage() {
  const router = useRouter();
  const [works, setWorks] = useState<Work[]>([]);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; totalPages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 显示 Toast 消息
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 获取待审核作品列表
  const fetchPendingWorks = async (pageNum: number) => {
    try {
      const res = await fetch(`/api/admin/works/review?page=${pageNum}&limit=10`);
      const data = await res.json();
      setWorks(data.works);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch pending works:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingWorks(1);
  }, []);

  // 批准作品
  const handleApprove = async (id: string) => {
    if (!confirm('确定要批准这个作品吗？')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/works/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });

      if (res.ok) {
        showToast('作品已批准', 'success');
        await fetchPendingWorks(page);
      } else {
        const data = await res.json();
        showToast(data.error || '批准失败', 'error');
      }
    } catch (error) {
      console.error('Failed to approve work:', error);
      showToast('批准失败', 'error');
    }
  };

  // 拒绝作品
  const handleReject = (id: string) => {
    setSelectedWorkId(id);
    setRejectReason('');
    setShowRejectModal(true);
  };

  // 提交拒绝
  const submitReject = async () => {
    if (!rejectReason.trim()) {
      showToast('请填写拒绝原因', 'error');
      return;
    }

    if (!selectedWorkId) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/works/${selectedWorkId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason: rejectReason }),
      });

      if (res.ok) {
        showToast('作品已拒绝', 'success');
        setShowRejectModal(false);
        setSelectedWorkId(null);
        setRejectReason('');
        await fetchPendingWorks(page);
      } else {
        const data = await res.json();
        showToast(data.error || '拒绝失败', 'error');
      }
    } catch (error) {
      console.error('Failed to reject work:', error);
      showToast('拒绝失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 刷新列表
  const refreshList = () => {
    fetchPendingWorks(page);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">作品审核</h1>
        <div className="text-sm text-gray-500">
          待审核作品：{pagination?.total || 0} 个
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">加载中...</div>
      ) : works.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          暂无待审核作品
        </div>
      ) : (
        <>
          <div data-testid="pending-works-list" className="bg-white rounded-xl shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">作品标题</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">作者</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">所属项目</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">提交时间</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {works.map((work) => (
                  <tr key={work.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{work.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {work.user?.nickname || work.user?.username || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {work.project?.title || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span data-testid="pending-badge" className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                        待审核
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(work.createdAt).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          data-testid="approve-work-btn"
                          onClick={() => handleApprove(work.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          批准
                        </button>
                        <button
                          data-testid="reject-work-btn"
                          onClick={() => handleReject(work.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          拒绝
                        </button>
                      </div>
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
                第 {pagination.page} 页，共 {pagination.totalPages} 页，总计 {pagination.total} 个作品
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (page > 1) {
                      setPage(page - 1);
                      fetchPendingWorks(page - 1);
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
                      fetchPendingWorks(page + 1);
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

      {/* 拒绝作品对话框 */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">拒绝作品</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                拒绝原因 <span className="text-red-500">*</span>
              </label>
              <textarea
                data-testid="reject-reason-input"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                placeholder="请详细说明拒绝原因，以便作者修改"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedWorkId(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                data-testid="confirm-reject-btn"
                onClick={submitReject}
                disabled={submitting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? '提交中...' : '确认拒绝'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast 通知 */}
      {toast && (
        <div
          data-testid={`${toast.type}-toast`}
          className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg p-4 flex items-center gap-3 animate-slide-in"
        >
          <div className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-gray-800">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
