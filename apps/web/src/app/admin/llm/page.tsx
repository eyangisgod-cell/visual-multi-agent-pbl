'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface LlmConfig {
  id: string;
  provider: string;
  apiKey: string;
  baseUrl: string | null;
  models: string[];
  isActive: boolean;
  createdAt: string;
}

interface CreateLlmConfigPayload {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  models?: string[];
  isActive?: boolean;
}

export default function LlmConfigPage() {
  const [configs, setConfigs] = useState<LlmConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateLlmConfigPayload>({
    provider: '',
    apiKey: '',
    baseUrl: '',
    models: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [testStatus, setTestStatus] = useState<{ [key: string]: string }>({});

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/llm');
      if (!response.ok) {
        throw new Error('Failed to fetch LLM configs');
      }
      const data: LlmConfig[] = await response.json();
      setConfigs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleCreate = () => {
    setCreateForm({
      provider: '',
      apiKey: '',
      baseUrl: '',
      models: [],
    });
    setShowCreateModal(true);
  };

  const handleSubmitCreate = async () => {
    if (!createForm.provider || !createForm.apiKey) {
      setError('Provider and API Key are required');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create LLM config');
      }
      setShowCreateModal(false);
      fetchConfigs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create LLM config');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setError(null);
  };

  const handleToggleActive = async (config: LlmConfig) => {
    try {
      const response = await fetch(`/api/admin/llm/${config.provider}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !config.isActive }),
      });
      if (!response.ok) {
        throw new Error('Failed to update LLM config');
      }
      fetchConfigs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update LLM config');
    }
  };

  const handleTestConnection = async (config: LlmConfig) => {
    setTestStatus({ ...testStatus, [config.id]: 'testing' });
    try {
      // 调用测试 API 连接端点
      const response = await fetch(`/api/admin/llm/${config.provider}/test`, {
        method: 'POST',
      });
      if (response.ok) {
        setTestStatus({ ...testStatus, [config.id]: 'success' });
        setTimeout(() => setTestStatus({ ...testStatus, [config.id]: '' }), 3000);
      } else {
        setTestStatus({ ...testStatus, [config.id]: 'error' });
      }
    } catch {
      setTestStatus({ ...testStatus, [config.id]: 'error' });
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">LLM 配置</h1>
            <p className="text-gray-600">管理大模型 API 连接配置</p>
          </div>
          <Button onClick={handleCreate} variant="primary" size="lg">
            + 添加配置
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <p className="text-red-800">{error}</p>
              <Button onClick={fetchConfigs} variant="outline" size="sm">
                重试
              </Button>
            </div>
          </div>
        )}

        {/* Configs Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  API Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Models
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {configs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    暂无 LLM 配置，请添加新配置
                  </td>
                </tr>
              ) : (
                configs.map((config) => (
                  <tr key={config.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{config.provider}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 font-mono">{config.apiKey}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{config.baseUrl || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {config.models?.join(', ') || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          config.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {config.isActive ? '已激活' : '未激活'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => handleTestConnection(config)}
                          variant="outline"
                          size="sm"
                          isLoading={testStatus[config.id] === 'testing'}
                        >
                          {testStatus[config.id] === 'success'
                            ? '连接成功'
                            : testStatus[config.id] === 'error'
                              ? '连接失败'
                              : '测试连接'}
                        </Button>
                        <Button
                          onClick={() => handleToggleActive(config)}
                          variant={config.isActive ? 'outline' : 'primary'}
                          size="sm"
                        >
                          {config.isActive ? '停用' : '激活'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">添加 LLM 配置</h2>
              <div className="space-y-4">
                <Input
                  label="Provider"
                  value={createForm.provider}
                  onChange={(e) => setCreateForm({ ...createForm, provider: e.target.value })}
                  placeholder="例如：anthropic, openai"
                />
                <Input
                  label="API Key"
                  type="password"
                  value={createForm.apiKey}
                  onChange={(e) => setCreateForm({ ...createForm, apiKey: e.target.value })}
                  placeholder="输入 API Key"
                />
                <Input
                  label="Base URL"
                  value={createForm.baseUrl || ''}
                  onChange={(e) => setCreateForm({ ...createForm, baseUrl: e.target.value })}
                  placeholder="https://api.example.com (可选)"
                />
                <Input
                  label="Models"
                  value={createForm.models?.join(', ') || ''}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      models: e.target.value.split(',').map((m) => m.trim()).filter(Boolean),
                    })
                  }
                  placeholder="gpt-4, claude-3 (用逗号分隔)"
                  helperText="用逗号分隔多个模型名称"
                />
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
      </div>
    </AdminLayout>
  );
}
