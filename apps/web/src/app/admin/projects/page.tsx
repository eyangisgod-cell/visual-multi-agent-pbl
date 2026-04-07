'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Project {
  id: number;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'completed';
  createdAt: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // 搜索和筛选状态
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  useEffect(() => {
    loadProjects(1);
  }, []);

  // 搜索和筛选改变时重新加载
  useEffect(() => {
    const timer = setTimeout(() => {
      loadProjects(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter]);

  async function loadProjects(pageNum: number) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '10',
      });
      if (searchQuery) params.set('search', searchQuery);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/projects?${params.toString()}`);
      const data = await res.json();
      setProjects(data.projects || []);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProject(formData: FormData) {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    try {
      const res = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });

      if (res.ok) {
        setMessage({ text: '项目创建成功', type: 'success' });
        setShowCreateModal(false);
        loadProjects();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ text: '项目创建失败', type: 'error' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      setMessage({ text: '项目创建失败', type: 'error' });
      setTimeout(() => setMessage(null), 3000);
    }
  }

  async function handleDeleteProject() {
    if (!projectToDelete) return;

    try {
      const res = await fetch(`/api/admin/projects/${projectToDelete}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMessage({ text: '项目已删除', type: 'success' });
        setShowDeleteConfirm(false);
        setProjectToDelete(null);
        loadProjects();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ text: '项目删除失败', type: 'error' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      setMessage({ text: '项目删除失败', type: 'error' });
      setTimeout(() => setMessage(null), 3000);
    }
  }

  return (
    <AdminLayout>
      <div>
        {/* 消息提示 */}
        {message && (
          <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
            message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {message.text}
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">项目管理</h1>
            <p className="text-gray-600">管理所有项目式学习任务</p>
          </div>
          <button
            data-testid="create-project-btn"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + 创建项目
          </button>
        </div>

        {/* 搜索和筛选栏 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 搜索框 */}
            <div className="flex-1">
              <div className="relative">
                <input
                  data-testid="search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索项目名称或描述..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {/* 搜索图标 */}
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {/* 清除按钮 */}
                {searchQuery && (
                  <button
                    data-testid="clear-search-btn"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* 状态筛选 */}
            <div className="md:w-48">
              <select
                data-testid="status-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">全部状态</option>
                <option value="draft">草稿</option>
                <option value="active">进行中</option>
                <option value="completed">已完成</option>
              </select>
            </div>
          </div>

          {/* 搜索结果数量 */}
          <div className="mt-3 flex justify-between items-center">
            <p data-testid="search-result-count" className="text-sm text-gray-600">
              {searchQuery || statusFilter !== 'all' ? (
                <>找到 <span className="font-medium">{pagination.total}</span> 个结果</>
              ) : (
                <>共 <span className="font-medium">{pagination.total}</span> 个项目</>
              )}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">加载中...</div>
        ) : (
          <>
            <div data-testid="project-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.length === 0 ? (
                <div data-testid="no-results-message" className="col-span-full text-center py-8 text-gray-500">
                  {searchQuery || statusFilter !== 'all' ? (
                    <>
                      <p className="mb-2">没有找到匹配的项目</p>
                      <p className="text-sm">请尝试其他搜索条件</p>
                    </>
                  ) : (
                    <>暂无项目，点击"创建项目"添加第一个项目</>
                  )}
                </div>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    data-testid="project-item"
                    className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <a
                      data-testid="project-link"
                      href={`/admin/projects/${project.id}`}
                      className="block"
                    >
                      <h2 data-testid="project-title" className="text-xl font-semibold text-gray-900 mb-2">{project.title}</h2>
                      <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>
                      <div className="flex justify-between items-center">
                        <span data-testid="project-status" className={`px-2 py-1 rounded text-sm ${
                          project.status === 'active' ? 'bg-green-100 text-green-800' :
                          project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {project.status === 'active' ? '进行中' :
                           project.status === 'completed' ? '已完成' : '草稿'}
                        </span>
                      </div>
                    </a>
                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <button
                        data-testid="edit-project-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          setEditingProject(project);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        编辑
                      </button>
                      <button
                        data-testid="delete-project-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          setProjectToDelete(project.id);
                          setShowDeleteConfirm(true);
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 分页 */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                <button
                  onClick={() => loadProjects(page - 1)}
                  disabled={page <= 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  上一页
                </button>
                <span className="px-4 py-2">
                  第 {page} / {pagination.totalPages} 页
                </span>
                <button
                  onClick={() => loadProjects(page + 1)}
                  disabled={page >= pagination.totalPages}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}

        {/* 创建项目对话框 */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">创建新项目</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);
                const title = formData.get('title') as string;
                const description = formData.get('description') as string;

                try {
                  const res = await fetch('/api/admin/projects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, description }),
                  });

                  if (res.ok) {
                    setMessage({ text: '项目创建成功', type: 'success' });
                    setShowCreateModal(false);
                    loadProjects();
                    setTimeout(() => setMessage(null), 3000);
                  } else {
                    setMessage({ text: '项目创建失败', type: 'error' });
                    setTimeout(() => setMessage(null), 3000);
                  }
                } catch (error) {
                  console.error('Failed to create project:', error);
                  setMessage({ text: '项目创建失败', type: 'error' });
                  setTimeout(() => setMessage(null), 3000);
                }
              }}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    项目标题
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    项目描述
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    创建项目
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 删除确认对话框 */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">确认删除</h2>
              <p className="text-gray-600 mb-6">确定要删除这个项目吗？此操作无法撤销。</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setProjectToDelete(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  取消
                </button>
                <button
                  onClick={handleDeleteProject}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  确认删除
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 编辑项目对话框 */}
        {editingProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">编辑项目</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);
                const title = formData.get('title') as string;
                const description = formData.get('description') as string;

                try {
                  const res = await fetch(`/api/admin/projects/${editingProject.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, description }),
                  });

                  if (res.ok) {
                    setMessage({ text: '项目已更新', type: 'success' });
                    setEditingProject(null);
                    loadProjects();
                    setTimeout(() => setMessage(null), 3000);
                  } else {
                    setMessage({ text: '项目更新失败', type: 'error' });
                    setTimeout(() => setMessage(null), 3000);
                  }
                } catch (error) {
                  console.error('Failed to update project:', error);
                  setMessage({ text: '项目更新失败', type: 'error' });
                  setTimeout(() => setMessage(null), 3000);
                }
              }}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    项目标题
                  </label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={editingProject.title}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    项目描述
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={editingProject.description}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingProject(null)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    保存修改
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
