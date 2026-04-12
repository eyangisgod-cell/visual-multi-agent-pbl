'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Work {
  id: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: string;
  user: {
    id: string;
    username: string | null;
    nickname: string | null;
  };
  project: {
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

export default function WorkReviewQueuePage() {
  const router = useRouter();
  const [works, setWorks] = useState<Work[]>([]);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; totalPages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // 获取待审核作品列表
  const fetchWorks = async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/works/review?page=${pageNum}&limit=10`);
      const data = await res.json();
      setWorks(data.works);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch works:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorks(1);
  }, []);

  // 批准作品
  const handleApprove = async (workId: string) => {
    if (!confirm('确定要批准这个作品吗？')) return;

    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/works/${workId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': document.cookie.split('csrf-token=')[1]?.split(';')[0] || '',
        },
        body: JSON.stringify({ action: 'approve' }),
      });

      if (res.ok) {
        alert('作品已批准');
        fetchWorks(page);
      } else {
        const data = await res.json();
        alert(`审核失败：${data.error}`);
      }
    } catch (error) {
      console.error('Error approving work:', error);
      alert('审核失败，请重试');
    } finally {
      setProcessing(false);
    }
  };

  // 拒绝作品
  const handleReject = async (workId: string) => {
    if (!rejectReason.trim()) {
      alert('请填写拒绝原因');
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/works/${workId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': document.cookie.split('csrf-token=')[1]?.split(';')[0] || '',
        },
        body: JSON.stringify({
          action: 'reject',
          reason: rejectReason,
        }),
      });

      if (res.ok) {
        alert('作品已拒绝');
        setRejectReason('');
        setSelectedWork(null);
        fetchWorks(page);
      } else {
        const data = await res.json();
        alert(`审核失败：${data.error}`);
      }
    } catch (error) {
      console.error('Error rejecting work:', error);
      alert('审核失败，请重试');
    } finally {
      setProcessing(false);
    }
  };

  // 查看作品详情
  const handleViewDetails = async (workId: string) => {
    try {
      const res = await fetch(`/api/admin/works/${workId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedWork(data.work);
      }
    } catch (error) {
      console.error('Error fetching work details:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">作品审核队列</h1>
        <div className="text-sm text-gray-500">
          待审核：{pagination?.total || 0} 个作品
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">加载中...</div>
      ) : works.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <p className="text-gray-500">暂无待审核作品</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">作品标题</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">作者</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">所属项目</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">提交时间</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {works.map((work) => (
                  <tr key={work.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {work.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {work.user.nickname || work.user.username || '匿名用户'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {work.project.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(work.createdAt).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetails(work.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          查看
                        </button>
                        <button
                          onClick={() => handleApprove(work.id)}
                          disabled={processing}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        >
                          批准
                        </button>
                        <button
                          onClick={() => setSelectedWork(work)}
                          className="text-red-600 hover:text-red-900"
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
                第 {pagination.page} 页，共 {pagination.totalPages} 页，总计 {pagination.total} 条记录
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (page > 1) {
                      setPage(page - 1);
                      fetchWorks(page - 1);
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
                      fetchWorks(page + 1);
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

      {/* 作品详情模态框 */}
      {selectedWork && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{selectedWork.title}</h2>
                <button
                  onClick={() => {
                    setSelectedWork(null);
                    setRejectReason('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">作品描述</label>
                  <p className="mt-1 text-gray-600 whitespace-pre-wrap">
                    {selectedWork.description || '无描述'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">作者</label>
                  <p className="mt-1 text-gray-600">
                    {selectedWork.user.nickname || selectedWork.user.username || '匿名用户'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">所属项目</label>
                  <p className="mt-1 text-gray-600">
                    {selectedWork.project.title}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">提交时间</label>
                  <p className="mt-1 text-gray-600">
                    {new Date(selectedWork.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">拒绝原因</label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="请输入拒绝原因..."
                    rows={4}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => handleApprove(selectedWork.id)}
                    disabled={processing}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    批准
                  </button>
                  <button
                    onClick={() => handleReject(selectedWork.id)}
                    disabled={processing || !rejectReason.trim()}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    拒绝
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
