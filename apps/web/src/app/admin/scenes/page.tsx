'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Scene {
  id: string;
  name: string;
  description: string | null;
  elements: Record<string, unknown> | null;
  resources: string[] | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ScenesResponse {
  scenes: Scene[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CreateScenePayload {
  name: string;
  description?: string;
  elements?: Record<string, unknown>;
  resources?: string[];
  isActive?: boolean;
}

interface UpdateScenePayload {
  name?: string;
  description?: string;
  elements?: Record<string, unknown>;
  resources?: string[];
  isActive?: boolean;
}

export default function ScenesPage() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalScenes, setTotalScenes] = useState(0);
  const [filterActive, setFilterActive] = useState<string>('all');

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);

  // Form states
  const [editForm, setEditForm] = useState<UpdateScenePayload>({});
  const [createForm, setCreateForm] = useState<CreateScenePayload>({
    name: '',
    description: '',
    elements: {},
    resources: [],
  });
  const [elementsText, setElementsText] = useState('');
  const [resourcesText, setResourcesText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchScenes = async (page = 1, search = '', isActiveFilter = 'all') => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(isActiveFilter !== 'all' && { isActive: isActiveFilter === 'true' ? 'true' : 'false' }),
      });
      const response = await fetch(`/api/admin/scenes?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch scenes');
      }
      const data: ScenesResponse = await response.json();
      setScenes(data.scenes);
      setTotalPages(data.pagination.totalPages);
      setTotalScenes(data.pagination.total);
      setCurrentPage(data.pagination.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScenes(currentPage, searchTerm, filterActive);
  }, []);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleFilterChange = (value: string) => {
    setFilterActive(value);
    fetchScenes(1, searchTerm, value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchScenes(1, searchTerm, filterActive);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchScenes(newPage, searchTerm, filterActive);
    }
  };

  const handleViewDetail = (scene: Scene) => {
    setSelectedScene(scene);
    setShowDetailModal(true);
  };

  const handlePreview = (scene: Scene) => {
    setSelectedScene(scene);
    setShowPreviewModal(true);
  };

  const handleEdit = (scene: Scene) => {
    setSelectedScene(scene);
    setEditForm({
      name: scene.name,
      description: scene.description || '',
      elements: scene.elements || {},
      resources: scene.resources || [],
      isActive: scene.isActive,
    });
    setElementsText(scene.elements ? JSON.stringify(scene.elements, null, 2) : '');
    setResourcesText(scene.resources ? scene.resources.join(', ') : '');
    setShowEditModal(true);
  };

  const handleCreate = () => {
    setCreateForm({
      name: '',
      description: '',
      elements: {},
      resources: [],
      isActive: true,
    });
    setElementsText('');
    setResourcesText('');
    setShowCreateModal(true);
  };

  const handleSubmitEdit = async () => {
    if (!selectedScene) return;
    if (!editForm.name) {
      setError('场景名称是必填项');
      return;
    }
    setSubmitting(true);
    try {
      let elements = editForm.elements;
      if (elementsText.trim()) {
        try {
          elements = JSON.parse(elementsText);
        } catch (e) {
          setError('场景元素必须是有效的 JSON 格式');
          setSubmitting(false);
          return;
        }
      }
      const resources = resourcesText
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean);

      const response = await fetch(`/api/admin/scenes/${selectedScene.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          elements,
          resources,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update scene');
      }
      setShowEditModal(false);
      fetchScenes(currentPage, searchTerm, filterActive);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update scene');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitCreate = async () => {
    if (!createForm.name) {
      setError('场景名称是必填项');
      return;
    }
    setSubmitting(true);
    try {
      let elements = createForm.elements;
      if (elementsText.trim()) {
        try {
          elements = JSON.parse(elementsText);
        } catch (e) {
          setError('场景元素必须是有效的 JSON 格式');
          setSubmitting(false);
          return;
        }
      }
      const resources = resourcesText
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean);

      const response = await fetch('/api/admin/scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          elements,
          resources,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create scene');
      }
      setShowCreateModal(false);
      fetchScenes(currentPage, searchTerm, filterActive);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create scene');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setShowCreateModal(false);
    setShowDetailModal(false);
    setShowPreviewModal(false);
    setSelectedScene(null);
    setError(null);
  };

  const handleToggleActive = async (scene: Scene) => {
    try {
      const response = await fetch(`/api/admin/scenes/${scene.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !scene.isActive }),
      });
      if (!response.ok) {
        throw new Error('Failed to update scene status');
      }
      fetchScenes(currentPage, searchTerm, filterActive);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update scene status');
    }
  };

  const handleDelete = async (scene: Scene) => {
    if (!confirm(`确定要删除场景"${scene.name}"吗？此操作不可恢复。`)) {
      return;
    }
    try {
      const response = await fetch(`/api/admin/scenes/${scene.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete scene');
      }
      fetchScenes(currentPage, searchTerm, filterActive);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete scene');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">场景模板</h1>
            <p className="text-gray-600">管理游戏场景模板和配置</p>
          </div>
          <Button onClick={handleCreate} variant="primary" size="lg">
            + 创建场景
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <form onSubmit={handleSearchSubmit} className="flex gap-4 items-center">
            <Input
              placeholder="搜索场景名称、描述..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="primary">
              搜索
            </Button>
            <div className="flex items-center gap-2 ml-auto">
              <label className="text-sm text-gray-600">状态:</label>
              <select
                value={filterActive}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">全部</option>
                <option value="true">已激活</option>
                <option value="false">未激活</option>
              </select>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <p className="text-red-800">{error}</p>
              <Button onClick={() => fetchScenes(currentPage, searchTerm, filterActive)} variant="outline" size="sm">
                重试
              </Button>
            </div>
          </div>
        )}

        {/* Scenes Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  场景名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  描述
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  元素数量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  资源数量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scenes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    暂无场景数据，请创建新场景
                  </td>
                </tr>
              ) : (
                scenes.map((scene) => {
                  const elementCount = scene.elements ? Object.keys(scene.elements).length : 0;
                  const resourceCount = scene.resources?.length || 0;
                  return (
                    <tr key={scene.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{scene.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {scene.description || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {elementCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {resourceCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            scene.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {scene.isActive ? '已激活' : '未激活'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(scene.createdAt).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => handlePreview(scene)}
                            variant="outline"
                            size="sm"
                          >
                            预览
                          </Button>
                          <Button
                            onClick={() => handleEdit(scene)}
                            variant="primary"
                            size="sm"
                          >
                            编辑
                          </Button>
                          <Button
                            onClick={() => handleToggleActive(scene)}
                            variant={scene.isActive ? 'outline' : 'primary'}
                            size="sm"
                          >
                            {scene.isActive ? '停用' : '激活'}
                          </Button>
                          <Button
                            onClick={() => handleDelete(scene)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-900"
                          >
                            删除
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-xl shadow-md p-4 mt-4 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              共 {totalScenes} 条，第 {currentPage} 页 / 共 {totalPages} 页
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                上一页
              </Button>
              <Button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
              >
                下一页
              </Button>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedScene && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl my-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">编辑场景</h2>
              <div className="space-y-4">
                <Input
                  label="场景名称"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="输入场景名称"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                    placeholder="输入场景描述"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">场景元素 (JSON 格式)</label>
                  <textarea
                    value={elementsText}
                    onChange={(e) => setElementsText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={5}
                    placeholder='例如：{"trees": 5, "flowers": 10, "animals": ["rabbit", "deer"]}'
                  />
                  <p className="text-xs text-gray-500 mt-1">定义场景中的元素及其属性</p>
                </div>
                <Input
                  label="资源列表"
                  value={resourcesText}
                  onChange={(e) => setResourcesText(e.target.value)}
                  placeholder="tree.png, flower.png, animal.png"
                  helperText="用逗号分隔多个资源文件名"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-is-active"
                    checked={editForm.isActive ?? true}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="edit-is-active" className="text-sm text-gray-700">启用此场景</label>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button onClick={handleCloseModal} variant="outline">
                  取消
                </Button>
                <Button onClick={handleSubmitEdit} variant="primary" isLoading={submitting}>
                  保存
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl my-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">创建新场景</h2>
              <div className="space-y-4">
                <Input
                  label="场景名称"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="输入场景名称"
                  error={!createForm.name && error ? '场景名称是必填项' : undefined}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                  <textarea
                    value={createForm.description || ''}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                    placeholder="输入场景描述"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">场景元素 (JSON 格式)</label>
                  <textarea
                    value={elementsText}
                    onChange={(e) => setElementsText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={5}
                    placeholder='例如：{"trees": 5, "flowers": 10, "animals": ["rabbit", "deer"]}'
                  />
                  <p className="text-xs text-gray-500 mt-1">定义场景中的元素及其属性</p>
                </div>
                <Input
                  label="资源列表"
                  value={resourcesText}
                  onChange={(e) => setResourcesText(e.target.value)}
                  placeholder="tree.png, flower.png, animal.png"
                  helperText="用逗号分隔多个资源文件名"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="create-is-active"
                    checked={createForm.isActive ?? true}
                    onChange={(e) => setCreateForm({ ...createForm, isActive: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="create-is-active" className="text-sm text-gray-700">启用此场景</label>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button onClick={handleCloseModal} variant="outline">
                  取消
                </Button>
                <Button onClick={handleSubmitCreate} variant="primary" isLoading={submitting}>
                  创建
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedScene && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md my-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">场景详情</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">场景名称</label>
                  <p className="text-gray-900 font-medium">{selectedScene.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">描述</label>
                  <p className="text-gray-900">{selectedScene.description || '无描述'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">状态</label>
                  <p>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        selectedScene.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {selectedScene.isActive ? '已激活' : '未激活'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">创建时间</label>
                  <p className="text-gray-900">{new Date(selectedScene.createdAt).toLocaleString('zh-CN')}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">更新时间</label>
                  <p className="text-gray-900">{new Date(selectedScene.updatedAt).toLocaleString('zh-CN')}</p>
                </div>
                {selectedScene.elements && Object.keys(selectedScene.elements).length > 0 && (
                  <div>
                    <label className="text-sm text-gray-500">场景元素</label>
                    <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto max-h-32">
                      {JSON.stringify(selectedScene.elements, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedScene.resources && selectedScene.resources.length > 0 && (
                  <div>
                    <label className="text-sm text-gray-500">资源列表</label>
                    <ul className="text-sm text-gray-900 mt-1 list-disc list-inside">
                      {selectedScene.resources.map((resource, index) => (
                        <li key={index}>{resource}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button onClick={handleCloseModal} variant="outline">
                  关闭
                </Button>
                <Button onClick={() => { handleCloseModal(); handleEdit(selectedScene); }} variant="primary">
                  编辑
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreviewModal && selectedScene && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg my-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">场景预览</h2>
              <div className="bg-gradient-to-b from-sky-200 to-sky-100 rounded-lg p-6 mb-4 min-h-[200px]">
                <div className="text-center">
                  <div className="text-4xl mb-2">🎬</div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedScene.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedScene.description || '无描述'}</p>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {selectedScene.elements ? (
                    Object.entries(selectedScene.elements).slice(0, 6).map(([key, value]) => (
                      <div key={key} className="bg-white/80 rounded p-2 text-center">
                        <div className="text-xs text-gray-500">{key}</div>
                        <div className="text-sm font-medium text-gray-900">
                          {typeof value === 'number' ? value : Array.isArray(value) ? value.length : String(value)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 text-center text-gray-500 text-sm">暂无场景元素</div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">元素数量:</span>
                  <span className="text-gray-900 font-medium">
                    {selectedScene.elements ? Object.keys(selectedScene.elements).length : 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">资源数量:</span>
                  <span className="text-gray-900 font-medium">{selectedScene.resources?.length || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">状态:</span>
                  <span className={`font-medium ${selectedScene.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                    {selectedScene.isActive ? '已激活' : '未激活'}
                  </span>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button onClick={handleCloseModal} variant="outline">
                  关闭
                </Button>
                <Button onClick={() => { handleCloseModal(); handleEdit(selectedScene); }} variant="primary">
                  编辑场景
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
