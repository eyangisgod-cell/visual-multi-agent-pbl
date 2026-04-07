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
  _count?: {
    likes: number;
    comments: number;
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

export default function WorksPage() {
  const router = useRouter();
  const [works, setWorks] = useState<Work[]>([]);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; totalPages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [likedWorks, setLikedWorks] = useState<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // 显示 Toast 消息
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 获取当前用户 ID
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.userId);
      } catch (e) {
        console.error('Failed to parse token');
      }
    }
  }, []);

  // 获取作品列表
  const fetchWorks = async (pageNum: number) => {
    try {
      const res = await fetch(`/api/admin/works?page=${pageNum}&limit=10`);
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

  // 删除作品
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个作品吗？')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/works/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('作品已删除');
        await fetchWorks(page);
      } else {
        showToast('删除失败', 'error');
      }
    } catch (error) {
      console.error('Failed to delete work:', error);
      showToast('删除失败', 'error');
    }
  };

  // 编辑作品
  const handleEdit = (work: Work) => {
    setSelectedWork(work);
    setShowEditModal(true);
  };

  // 刷新列表
  const refreshList = () => {
    fetchWorks(page);
  };

  // 切换点赞状态
  const toggleLike = async (workId: string) => {
    if (!currentUserId) {
      showToast('请先登录', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/admin/works/${workId}/likes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId }),
      });

      if (res.ok) {
        const data = await res.json();
        setLikedWorks(prev => {
          const newSet = new Set(prev);
          if (data.liked) {
            newSet.add(workId);
          } else {
            newSet.delete(workId);
          }
          return newSet;
        });
        showToast(data.liked ? '点赞成功' : '已取消点赞');
        // 刷新作品列表以更新点赞数
        await fetchWorks(page);
      } else {
        showToast('操作失败', 'error');
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
      showToast('操作失败', 'error');
    }
  };

  // 切换评论区域显示
  const toggleComments = (workId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(workId)) {
        newSet.delete(workId);
      } else {
        newSet.add(workId);
        // 加载评论
        fetchComments(workId);
      }
      return newSet;
    });
  };

  // 获取评论列表
  const fetchComments = async (workId: string) => {
    try {
      const res = await fetch(`/api/admin/works/${workId}/comments`);
      const data = await res.json();
      setComments(prev => ({
        ...prev,
        [workId]: data.comments || [],
      }));
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  // 发表评论
  const submitComment = async (workId: string, content: string, parentId?: string) => {
    if (!currentUserId) {
      showToast('请先登录', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/admin/works/${workId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, userId: currentUserId, parentId }),
      });

      if (res.ok) {
        showToast('评论成功');
        // 刷新评论列表
        await fetchComments(workId);
        // 刷新作品列表以更新评论数
        await fetchWorks(page);
      } else {
        const data = await res.json();
        showToast(data.error || '评论失败', 'error');
      }
    } catch (error) {
      console.error('Failed to submit comment:', error);
      showToast('评论失败', 'error');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">作品管理</h1>
        <button
          data-testid="create-work-btn"
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          创建作品
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">加载中...</div>
      ) : (
        <>
          <div data-testid="work-list" className="bg-white rounded-xl shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">作品标题</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">作者</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">所属项目</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">点赞</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">评论</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">得分</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {works.map((work) => (
                  <>
                    <tr key={work.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{work.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {work.user?.nickname || work.user?.username || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {work.project?.title || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            data-testid="like-btn"
                            onClick={() => toggleLike(work.id)}
                            className={`p-1 rounded hover:bg-gray-100 ${
                              likedWorks.has(work.id) ? 'text-red-500' : 'text-gray-400'
                            }`}
                          >
                            <svg className="w-5 h-5" fill={likedWorks.has(work.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </button>
                          <span data-testid="like-count" className="text-sm text-gray-600">
                            {work._count?.likes || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            data-testid="comment-toggle"
                            onClick={() => toggleComments(work.id)}
                            className="p-1 rounded hover:bg-gray-100 text-gray-400"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </button>
                          <span data-testid="comment-count" className="text-sm text-gray-600">
                            {work._count?.comments || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          work.status === 'published' ? 'bg-green-100 text-green-800' :
                          work.status === 'pending_review' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {work.status || 'draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{work.score || 0}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(work.createdAt).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            data-testid="edit-work-btn"
                            onClick={() => handleEdit(work)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            编辑
                          </button>
                          <button
                            data-testid="delete-work-btn"
                            onClick={() => handleDelete(work.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* 评论区域 */}
                    {expandedComments.has(work.id) && (
                      <tr>
                        <td colSpan={9} className="bg-gray-50 p-4">
                          <CommentSection
                            workId={work.id}
                            comments={comments[work.id] || []}
                            onSubmitComment={(content, parentId) => submitComment(work.id, content, parentId)}
                            currentUserId={currentUserId}
                          />
                        </td>
                      </tr>
                    )}
                  </>
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

      {/* 创建作品对话框 */}
      {showCreateModal && (
        <CreateWorkModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            refreshList();
          }}
        />
      )}

      {/* 编辑作品对话框 */}
      {showEditModal && selectedWork && (
        <EditWorkModal
          work={selectedWork}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            showToast('作品已更新');
            refreshList();
          }}
        />
      )}

      {/* Toast 通知 */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg p-4 flex items-center gap-3 animate-slide-in">
          <div className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-gray-800">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

// 创建作品对话框组件
function CreateWorkModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [projects, setProjects] = useState<{ id: string; title: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // 获取项目列表
    fetch('/api/admin/projects?limit=100')
      .then(res => res.json())
      .then(data => {
        setProjects(data.projects || []);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/works', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          projectId,
        }),
      });

      if (res.ok) {
        // 关闭对话框并刷新列表
        onClose();
        onSuccess();
      } else {
        const data = await res.json();
        alert(data.error || '创建失败');
      }
    } catch (error) {
      console.error('Failed to create work:', error);
      alert('创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">创建作品</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">作品标题</label>
            <input
              type="text"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">所属项目</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">请选择项目</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? '创建中...' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 评论区组件
function CommentSection({
  workId,
  comments,
  onSubmitComment,
  currentUserId,
}: {
  workId: string;
  comments: any[];
  onSubmitComment: (content: string, parentId?: string) => void;
  currentUserId: string | null;
}) {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onSubmitComment(newComment.trim());
      setNewComment('');
    }
  };

  const handleReply = (parentId: string) => {
    if (replyContent.trim()) {
      onSubmitComment(replyContent.trim(), parentId);
      setReplyContent('');
      setReplyingTo(null);
    }
  };

  // 获取回复某条评论的评论
  const getReplies = (parentId: string) => {
    return comments.filter(c => c.parentId === parentId);
  };

  // 只渲染顶级评论（没有父级的评论）
  const topLevelComments = comments.filter(c => !c.parentId);

  return (
    <div data-testid="comment-section" className="space-y-4">
      <h3 className="font-semibold text-gray-700">评论 ({comments.length})</h3>

      {/* 发表评论表单 */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          data-testid="comment-input"
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="写下你的评论..."
          className="flex-1 px-3 py-2 border rounded-lg"
        />
        <button
          data-testid="comment-submit"
          type="submit"
          disabled={!newComment.trim()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          发表
        </button>
      </form>

      {/* 评论列表 */}
      <div data-testid="comment-list" className="space-y-3 max-h-64 overflow-y-auto">
        {topLevelComments.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">暂无评论</p>
        ) : (
          topLevelComments.map((comment) => (
            <div key={comment.id} data-testid="comment-item" className="bg-white p-3 rounded border">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-sm">
                  {comment.user?.nickname || comment.user?.username || '匿名用户'}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(comment.createdAt).toLocaleString('zh-CN')}
                </span>
              </div>
              <p className="text-gray-700 text-sm">{comment.content}</p>

              {/* 回复按钮 */}
              {replyingTo === comment.id ? (
                <div className="mt-2 flex gap-2">
                  <input
                    data-testid="reply-input"
                    type="text"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="回复..."
                    className="flex-1 px-2 py-1 border rounded text-sm"
                  />
                  <button
                    data-testid="reply-submit"
                    onClick={() => handleReply(comment.id)}
                    className="px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
                  >
                    回复
                  </button>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="px-2 py-1 border text-xs rounded hover:bg-gray-50"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <button
                  data-testid="reply-btn"
                  onClick={() => setReplyingTo(comment.id)}
                  className="mt-1 text-xs text-indigo-600 hover:text-indigo-900"
                >
                  回复
                </button>
              )}

              {/* 显示回复列表 */}
              {getReplies(comment.id).length > 0 && (
                <div className="mt-2 ml-4 space-y-2 border-l-2 border-gray-200 pl-3">
                  {getReplies(comment.id).map((reply) => (
                    <div key={reply.id} className="bg-gray-50 p-2 rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-xs">
                          {reply.user?.nickname || reply.user?.username || '匿名用户'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(reply.createdAt).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      <p className="text-gray-600 text-xs">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// 编辑作品对话框组件
function EditWorkModal({ work, onClose, onSuccess }: { work: Work; onClose: () => void; onSuccess: () => void }) {
  const [title, setTitle] = useState(work.title);
  const [description, setDescription] = useState(work.description || '');
  const [status, setStatus] = useState(work.status || 'draft');
  const [score, setScore] = useState(work.score?.toString() || '0');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`/api/admin/works/${work.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          status,
          score: parseInt(score) || 0,
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        alert(data.error || '更新失败');
      }
    } catch (error) {
      console.error('Failed to update work:', error);
      alert('更新失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">编辑作品</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">作品标题</label>
            <input
              type="text"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="draft">草稿</option>
              <option value="pending_review">待审核</option>
              <option value="published">已发布</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">得分</label>
            <input
              type="number"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
