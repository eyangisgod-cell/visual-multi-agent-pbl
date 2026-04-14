'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface SystemSetting {
  id: string;
  key: string;
  value: any;
  category: string | null;
  updatedAt: string;
}

interface EmailConfig {
  smtpHost?: string;
  smtpPort?: string;
  smtpUser?: string;
  smtpPassword?: string;
  smtpSecure?: boolean;
  fromEmail?: string;
  fromName?: string;
}

interface StorageConfig {
  provider?: string;
  awsAccessKey?: string;
  awsSecretKey?: string;
  awsRegion?: string;
  awsBucket?: string;
  aliyunAccessKey?: string;
  aliyunSecretKey?: string;
  aliyunBucket?: string;
  aliyunRegion?: string;
  localPath?: string;
  baseUrl?: string;
}

interface GeneralConfig {
  siteName?: string;
  siteDescription?: string;
  siteUrl?: string;
  logoUrl?: string;
  faviconUrl?: string;
  maxUploadSize?: number;
  allowedFileTypes?: string[];
}

type TabType = 'general' | 'email' | 'storage';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 系统设置状态
  const [settings, setSettings] = useState<SystemSetting[]>([]);

  // 表单状态
  const [generalConfig, setGeneralConfig] = useState<GeneralConfig>({});
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({});
  const [storageConfig, setStorageConfig] = useState<StorageConfig>({});

  // 测试状态
  const [emailTestStatus, setEmailTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [storageTestStatus, setStorageTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testEmail, setTestEmail] = useState('');

  // 加载系统设置
  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch system settings');
      }
      const data: SystemSetting[] = await response.json();
      setSettings(data);

      // 解析各类配置
      parseSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const parseSettings = (data: SystemSetting[]) => {
    // 解析通用设置
    const general: GeneralConfig = {};
    // 解析邮件设置
    const email: EmailConfig = {};
    // 解析存储设置
    const storage: StorageConfig = {};

    data.forEach((setting) => {
      if (setting.category === 'general') {
        switch (setting.key) {
          case 'site_name':
            general.siteName = setting.value;
            break;
          case 'site_description':
            general.siteDescription = setting.value;
            break;
          case 'site_url':
            general.siteUrl = setting.value;
            break;
          case 'logo_url':
            general.logoUrl = setting.value;
            break;
          case 'favicon_url':
            general.faviconUrl = setting.value;
            break;
          case 'max_upload_size':
            general.maxUploadSize = setting.value;
            break;
          case 'allowed_file_types':
            general.allowedFileTypes = setting.value;
            break;
        }
      } else if (setting.category === 'email') {
        switch (setting.key) {
          case 'smtp_host':
            email.smtpHost = setting.value;
            break;
          case 'smtp_port':
            email.smtpPort = setting.value;
            break;
          case 'smtp_user':
            email.smtpUser = setting.value;
            break;
          case 'smtp_password':
            email.smtpPassword = setting.value;
            break;
          case 'smtp_secure':
            email.smtpSecure = setting.value;
            break;
          case 'from_email':
            email.fromEmail = setting.value;
            break;
          case 'from_name':
            email.fromName = setting.value;
            break;
        }
      } else if (setting.category === 'storage') {
        switch (setting.key) {
          case 'storage_provider':
            storage.provider = setting.value;
            break;
          case 'aws_access_key':
            storage.awsAccessKey = setting.value;
            break;
          case 'aws_secret_key':
            storage.awsSecretKey = setting.value;
            break;
          case 'aws_region':
            storage.awsRegion = setting.value;
            break;
          case 'aws_bucket':
            storage.awsBucket = setting.value;
            break;
          case 'aliyun_access_key':
            storage.aliyunAccessKey = setting.value;
            break;
          case 'aliyun_secret_key':
            storage.aliyunSecretKey = setting.value;
            break;
          case 'aliyun_bucket':
            storage.aliyunBucket = setting.value;
            break;
          case 'aliyun_region':
            storage.aliyunRegion = setting.value;
            break;
          case 'local_path':
            storage.localPath = setting.value;
            break;
          case 'base_url':
            storage.baseUrl = setting.value;
            break;
        }
      }
    });

    setGeneralConfig(general);
    setEmailConfig(email);
    setStorageConfig(storage);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // 清除消息
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // 保存通用设置
  const handleSaveGeneral = async () => {
    setSaving(true);
    try {
      const settingsToUpdate = [
        { key: 'site_name', value: generalConfig.siteName, category: 'general' },
        { key: 'site_description', value: generalConfig.siteDescription, category: 'general' },
        { key: 'site_url', value: generalConfig.siteUrl, category: 'general' },
        { key: 'logo_url', value: generalConfig.logoUrl, category: 'general' },
        { key: 'favicon_url', value: generalConfig.faviconUrl, category: 'general' },
        { key: 'max_upload_size', value: generalConfig.maxUploadSize, category: 'general' },
        { key: 'allowed_file_types', value: generalConfig.allowedFileTypes, category: 'general' },
      ].filter((s) => s.value !== undefined && s.value !== '');

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsToUpdate),
      });

      if (!response.ok) {
        throw new Error('Failed to save general settings');
      }

      setSuccessMessage('通用设置已保存');
      fetchSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save general settings');
    } finally {
      setSaving(false);
    }
  };

  // 保存邮件设置
  const handleSaveEmail = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings/email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpHost: emailConfig.smtpHost,
          smtpPort: emailConfig.smtpPort ? String(emailConfig.smtpPort) : undefined,
          smtpUser: emailConfig.smtpUser,
          smtpPassword: emailConfig.smtpPassword,
          smtpSecure: emailConfig.smtpSecure,
          fromEmail: emailConfig.fromEmail,
          fromName: emailConfig.fromName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save email settings');
      }

      setSuccessMessage('邮件服务设置已保存');
      fetchSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save email settings');
    } finally {
      setSaving(false);
    }
  };

  // 测试邮件发送
  const handleTestEmail = async () => {
    if (!testEmail) {
      setError('请输入测试邮箱地址');
      return;
    }

    setEmailTestStatus('testing');
    try {
      const response = await fetch('/api/admin/settings/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setEmailTestStatus('success');
        setSuccessMessage(data.message);
      } else {
        setEmailTestStatus('error');
        setError(data.message || '测试失败');
      }
    } catch (err) {
      setEmailTestStatus('error');
      setError('Failed to test email settings');
    } finally {
      setTimeout(() => setEmailTestStatus('idle'), 3000);
    }
  };

  // 保存存储设置
  const handleSaveStorage = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings/storage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: storageConfig.provider,
          awsAccessKey: storageConfig.awsAccessKey,
          awsSecretKey: storageConfig.awsSecretKey,
          awsRegion: storageConfig.awsRegion,
          awsBucket: storageConfig.awsBucket,
          aliyunAccessKey: storageConfig.aliyunAccessKey,
          aliyunSecretKey: storageConfig.aliyunSecretKey,
          aliyunBucket: storageConfig.aliyunBucket,
          aliyunRegion: storageConfig.aliyunRegion,
          localPath: storageConfig.localPath,
          baseUrl: storageConfig.baseUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save storage settings');
      }

      setSuccessMessage('存储服务设置已保存');
      fetchSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save storage settings');
    } finally {
      setSaving(false);
    }
  };

  // 测试存储连接
  const handleTestStorage = async () => {
    setStorageTestStatus('testing');
    try {
      const response = await fetch('/api/admin/settings/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: storageConfig.provider }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStorageTestStatus('success');
        setSuccessMessage(data.message);
      } else {
        setStorageTestStatus('error');
        setError(data.message || '测试失败');
      }
    } catch (err) {
      setStorageTestStatus('error');
      setError('Failed to test storage settings');
    } finally {
      setTimeout(() => setStorageTestStatus('idle'), 3000);
    }
  };

  const tabs = [
    { id: 'general' as TabType, label: '通用设置' },
    { id: 'email' as TabType, label: '邮件服务' },
    { id: 'storage' as TabType, label: '存储服务' },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600">加载设置中...</p>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">系统设置</h1>
            <p className="text-gray-600">管理系统配置和参数</p>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <p className="text-red-800">{error}</p>
              <Button onClick={() => setError(null)} variant="outline" size="sm">
                关闭
              </Button>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* General Settings Tab */}
        {activeTab === 'general' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">通用设置</h2>
            <div className="space-y-4">
              <Input
                label="网站名称"
                value={generalConfig.siteName || ''}
                onChange={(e) => setGeneralConfig({ ...generalConfig, siteName: e.target.value })}
                placeholder="输入网站名称"
              />
              <Input
                label="网站描述"
                value={generalConfig.siteDescription || ''}
                onChange={(e) => setGeneralConfig({ ...generalConfig, siteDescription: e.target.value })}
                placeholder="输入网站描述"
              />
              <Input
                label="网站 URL"
                value={generalConfig.siteUrl || ''}
                onChange={(e) => setGeneralConfig({ ...generalConfig, siteUrl: e.target.value })}
                placeholder="https://example.com"
              />
              <Input
                label="Logo URL"
                value={generalConfig.logoUrl || ''}
                onChange={(e) => setGeneralConfig({ ...generalConfig, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
              <Input
                label="Favicon URL"
                value={generalConfig.faviconUrl || ''}
                onChange={(e) => setGeneralConfig({ ...generalConfig, faviconUrl: e.target.value })}
                placeholder="https://example.com/favicon.ico"
              />
              <Input
                label="最大上传大小 (MB)"
                type="number"
                value={generalConfig.maxUploadSize?.toString() || ''}
                onChange={(e) => setGeneralConfig({ ...generalConfig, maxUploadSize: parseInt(e.target.value) })}
                placeholder="10"
              />
              <Input
                label="允许的文件类型"
                value={generalConfig.allowedFileTypes?.join(', ') || ''}
                onChange={(e) => setGeneralConfig({
                  ...generalConfig,
                  allowedFileTypes: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                })}
                placeholder="jpg, png, pdf, doc"
                helperText="用逗号分隔文件扩展名"
              />
            </div>
            <div className="mt-6">
              <Button onClick={handleSaveGeneral} variant="primary" isLoading={saving}>
                保存设置
              </Button>
            </div>
          </div>
        )}

        {/* Email Settings Tab */}
        {activeTab === 'email' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">邮件服务配置</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="SMTP 服务器"
                  value={emailConfig.smtpHost || ''}
                  onChange={(e) => setEmailConfig({ ...emailConfig, smtpHost: e.target.value })}
                  placeholder="smtp.gmail.com"
                />
                <Input
                  label="SMTP 端口"
                  type="number"
                  value={emailConfig.smtpPort || ''}
                  onChange={(e) => setEmailConfig({ ...emailConfig, smtpPort: e.target.value })}
                  placeholder="587"
                />
              </div>
              <Input
                label="SMTP 用户名"
                value={emailConfig.smtpUser || ''}
                onChange={(e) => setEmailConfig({ ...emailConfig, smtpUser: e.target.value })}
                placeholder="your@gmail.com"
              />
              <Input
                label="SMTP 密码"
                type="password"
                value={emailConfig.smtpPassword || ''}
                onChange={(e) => setEmailConfig({ ...emailConfig, smtpPassword: e.target.value })}
                placeholder="输入密码"
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="smtpSecure"
                  checked={emailConfig.smtpSecure || false}
                  onChange={(e) => setEmailConfig({ ...emailConfig, smtpSecure: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="smtpSecure" className="text-sm text-gray-700">
                  使用 SSL/TLS 加密连接
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="发件人邮箱"
                  value={emailConfig.fromEmail || ''}
                  onChange={(e) => setEmailConfig({ ...emailConfig, fromEmail: e.target.value })}
                  placeholder="noreply@example.com"
                />
                <Input
                  label="发件人名称"
                  value={emailConfig.fromName || ''}
                  onChange={(e) => setEmailConfig({ ...emailConfig, fromName: e.target.value })}
                  placeholder="网站名称"
                />
              </div>
            </div>

            {/* Test Email Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">测试邮件发送</h3>
              <div className="flex gap-4">
                <Input
                  label=""
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="输入测试邮箱地址"
                  className="flex-1"
                />
                <Button
                  onClick={handleTestEmail}
                  variant="outline"
                  isLoading={emailTestStatus === 'testing'}
                  className="mt-6"
                >
                  {emailTestStatus === 'success' ? '发送成功' : emailTestStatus === 'error' ? '发送失败' : '发送测试邮件'}
                </Button>
              </div>
            </div>

            <div className="mt-6">
              <Button onClick={handleSaveEmail} variant="primary" isLoading={saving}>
                保存设置
              </Button>
            </div>
          </div>
        )}

        {/* Storage Settings Tab */}
        {activeTab === 'storage' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">存储服务配置</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  存储提供商
                </label>
                <select
                  value={storageConfig.provider || 'local'}
                  onChange={(e) => setStorageConfig({ ...storageConfig, provider: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="local">本地存储</option>
                  <option value="aws-s3">AWS S3</option>
                  <option value="aliyun-oss">阿里云 OSS</option>
                </select>
              </div>

              {/* AWS S3 Settings */}
              {storageConfig.provider === 'aws-s3' && (
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <h3 className="text-md font-medium text-gray-900">AWS S3 配置</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Access Key"
                      value={storageConfig.awsAccessKey || ''}
                      onChange={(e) => setStorageConfig({ ...storageConfig, awsAccessKey: e.target.value })}
                      placeholder="AKIAIOSFODNN7EXAMPLE"
                    />
                    <Input
                      label="Secret Key"
                      type="password"
                      value={storageConfig.awsSecretKey || ''}
                      onChange={(e) => setStorageConfig({ ...storageConfig, awsSecretKey: e.target.value })}
                      placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Region"
                      value={storageConfig.awsRegion || ''}
                      onChange={(e) => setStorageConfig({ ...storageConfig, awsRegion: e.target.value })}
                      placeholder="us-east-1"
                    />
                    <Input
                      label="Bucket 名称"
                      value={storageConfig.awsBucket || ''}
                      onChange={(e) => setStorageConfig({ ...storageConfig, awsBucket: e.target.value })}
                      placeholder="my-bucket"
                    />
                  </div>
                </div>
              )}

              {/* Aliyun OSS Settings */}
              {storageConfig.provider === 'aliyun-oss' && (
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <h3 className="text-md font-medium text-gray-900">阿里云 OSS 配置</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Access Key ID"
                      value={storageConfig.aliyunAccessKey || ''}
                      onChange={(e) => setStorageConfig({ ...storageConfig, aliyunAccessKey: e.target.value })}
                      placeholder="LTAI5t..."
                    />
                    <Input
                      label="Access Key Secret"
                      type="password"
                      value={storageConfig.aliyunSecretKey || ''}
                      onChange={(e) => setStorageConfig({ ...storageConfig, aliyunSecretKey: e.target.value })}
                      placeholder="输入密钥"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Region"
                      value={storageConfig.aliyunRegion || ''}
                      onChange={(e) => setStorageConfig({ ...storageConfig, aliyunRegion: e.target.value })}
                      placeholder="oss-cn-hangzhou"
                    />
                    <Input
                      label="Bucket 名称"
                      value={storageConfig.aliyunBucket || ''}
                      onChange={(e) => setStorageConfig({ ...storageConfig, aliyunBucket: e.target.value })}
                      placeholder="my-bucket"
                    />
                  </div>
                </div>
              )}

              {/* Local Storage Settings */}
              {storageConfig.provider === 'local' && (
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <h3 className="text-md font-medium text-gray-900">本地存储配置</h3>
                  <Input
                    label="存储路径"
                    value={storageConfig.localPath || ''}
                    onChange={(e) => setStorageConfig({ ...storageConfig, localPath: e.target.value })}
                    placeholder="/var/uploads"
                    helperText="文件上传的本地路径"
                  />
                  <Input
                    label="基础 URL"
                    value={storageConfig.baseUrl || ''}
                    onChange={(e) => setStorageConfig({ ...storageConfig, baseUrl: e.target.value })}
                    placeholder="https://example.com/uploads"
                    helperText="用于访问上传文件的公开 URL"
                  />
                </div>
              )}
            </div>

            {/* Test Storage Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <Button
                onClick={handleTestStorage}
                variant="outline"
                isLoading={storageTestStatus === 'testing'}
              >
                {storageTestStatus === 'success' ? '测试成功' : storageTestStatus === 'error' ? '测试失败' : '测试连接'}
              </Button>
            </div>

            <div className="mt-6">
              <Button onClick={handleSaveStorage} variant="primary" isLoading={saving}>
                保存设置
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
