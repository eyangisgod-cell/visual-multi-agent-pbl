'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function KnowledgePage() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    tags: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await fetch('/api/admin/knowledge/documents');
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const openUploadModal = () => {
    setFormData({ title: '', content: '', category: '', tags: '' });
    setError('');
    setShowUploadModal(true);
  };

  const handleUpload = async () => {
    if (!formData.title.trim()) {
      setError('标题不能为空');
      return;
    }

    if (!formData.content.trim()) {
      setError('内容不能为空');
      return;
    }

    try {
      const response = await fetch('/api/admin/knowledge/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken(),
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          content: formData.content.trim(),
          category: formData.category.trim() || null,
          tags: formData.tags.split(',').map((t) => t.trim()).filter((t) => t),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '上传失败');
      }

      setSuccess('文档上传成功');
      setShowUploadModal(false);
      loadDocuments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (doc: KnowledgeDocument) => {
    if (!confirm(`确定要删除文档 "${doc.title}" 吗？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/knowledge/documents/${doc.id}`, {
        method: 'DELETE',
        headers: {
          'x-csrf-token': getCsrfToken(),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '删除失败');
      }

      setSuccess('文档删除成功');
      loadDocuments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getCsrfToken = () => {
    return document.cookie.split('csrf-token=')[1]?.split(';')[0] || '';
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(documents.map((d) => d.category).filter((c): c is string => !!c)));

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl text-gray-500">加载中...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">知识库管理</h1>
            <p className="text-gray-600">管理 RAG 知识库文档</p>
          </div>
          <button
            onClick={openUploadModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + 上传文档
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        {/* 搜索和过滤 */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="搜索文档..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">全部分类</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* 文档列表 */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">标题</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">分类</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">标签</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="max-w-md">
                      <div className="font-medium text-gray-900 truncate">{doc.title}</div>
                      <div className="text-sm text-gray-500 truncate">
                        {doc.content.substring(0, 80)}...
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {doc.category || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex flex-wrap gap-1">
                      {doc.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                      {doc.tags.length > 3 && (
                        <span className="text-gray-500 text-xs">+{doc.tags.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(doc.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button
                      onClick={() => setSelectedDoc(doc)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      查看
                    </button>
                    <button
                      onClick={() => handleDelete(doc)}
                      className="text-red-600 hover:text-red-800"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 上传文档模态框 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">上传知识文档</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="文档标题"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例如：编程指南、最佳实践"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">标签（用逗号分隔）</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例如：Python, 教程，入门"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={8}
                  placeholder="文档内容..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={handleUpload}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                上传文档
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 查看文档模态框 */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{selectedDoc.title}</h2>

            <div className="mb-4 flex gap-4 text-sm text-gray-600">
              <span>分类：{selectedDoc.category || '未分类'}</span>
              <span>
                创建时间：{new Date(selectedDoc.createdAt).toLocaleDateString('zh-CN')}
              </span>
            </div>

            <div className="mb-4 flex flex-wrap gap-1">
              {selectedDoc.tags.map((tag, i) => (
                <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  {tag}
                </span>
              ))}
            </div>

            <div className="prose max-w-none mb-6">
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
                {selectedDoc.content}
              </pre>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
