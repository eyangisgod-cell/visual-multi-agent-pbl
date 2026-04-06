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

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const res = await fetch('/api/admin/projects');
      const data = await res.json();
      setProjects(data.projects || []);
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

        {loading ? (
          <div className="text-center py-8">加载中...</div>
        ) : (
          <div data-testid="project-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                暂无项目，点击"创建项目"添加第一个项目
              </div>
            ) : (
              projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <a
                    data-testid="project-link"
                    href={`/admin/projects/${project.id}`}
                    className="block"
                  >
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">{project.title}</h2>
                    <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>
                    <div className="flex justify-between items-center">
                      <span className={`px-2 py-1 rounded text-sm ${
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
