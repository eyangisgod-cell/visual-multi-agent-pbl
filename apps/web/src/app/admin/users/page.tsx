'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';

interface User {
  id: string;
  username: string;
  nickname: string;
  avatarUrl: string | null;
  grade: number | null;
  points: number;
  level: number;
  role: string;
  invitationCode: string;
  createdAt: string;
  _count: {
    works: number;
    userAgents: number;
  };
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CreateUserPayload {
  username: string;
  passwordHash?: string;
  nickname?: string;
  role?: string;
  grade?: number;
}

interface UpdateUserPayload {
  nickname?: string;
  role?: string;
  grade?: number;
}

const ROLES = ['USER', 'ADMIN', 'SUPER_ADMIN'];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [editForm, setEditForm] = useState<UpdateUserPayload>({});
  const [createForm, setCreateForm] = useState<CreateUserPayload>({
    username: '',
    nickname: '',
    role: 'USER',
    grade: 10,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async (page = 1, search = '') => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
      });
      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data: UsersResponse = await response.json();
      setUsers(data.users);
      setTotalPages(data.pagination.totalPages);
      setTotalUsers(data.pagination.total);
      setCurrentPage(data.pagination.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage, searchTerm);
  }, []);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.trim() === '') {
      fetchUsers(1, '');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1, searchTerm);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchUsers(newPage, searchTerm);
    }
  };

  const handleViewDetail = (user: User) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      nickname: user.nickname,
      role: user.role,
      grade: user.grade ?? 10,
    });
    setShowEditModal(true);
  };

  const handleCreate = () => {
    setCreateForm({
      username: '',
      nickname: '',
      role: 'USER',
      grade: 10,
    });
    setShowCreateModal(true);
  };

  const handleSubmitEdit = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!response.ok) {
        throw new Error('Failed to update user');
      }
      setShowEditModal(false);
      fetchUsers(currentPage, searchTerm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitCreate = async () => {
    if (!createForm.username) {
      setError('Username is required');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create user');
      }
      setShowCreateModal(false);
      fetchUsers(currentPage, searchTerm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setShowCreateModal(false);
    setShowDetailModal(false);
    setSelectedUser(null);
    setError(null);
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">用户管理</h1>
            <p className="text-gray-600">管理用户账户和权限</p>
          </div>
          <Button onClick={handleCreate} variant="primary" size="lg">
            + 创建用户
          </Button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <form onSubmit={handleSearchSubmit} className="flex gap-4">
            <Input
              placeholder="搜索用户名、昵称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="primary">
              搜索
            </Button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <p className="text-red-800">{error}</p>
              <Button onClick={() => fetchUsers(currentPage, searchTerm)} variant="outline" size="sm">
                重试
              </Button>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  角色
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  等级
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  积分
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  作品数
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
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    暂无用户数据
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.avatarUrl ? (
                            <img className="h-10 w-10 rounded-full" src={user.avatarUrl} alt={user.nickname} />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                              {user.nickname.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.nickname}</div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : user.role === 'SUPER_ADMIN'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Lv.{user.level}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.points}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user._count.works}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleViewDetail(user)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          详情
                        </button>
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          编辑
                        </button>
                        <Link
                          href={`/admin/audit-logs?userId=${user.id}`}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          活动日志
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-xl shadow-md p-4 mt-4 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              共 {totalUsers} 条，第 {currentPage} 页 / 共 {totalPages} 页
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
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">编辑用户</h2>
              <div className="space-y-4">
                <Input
                  label="用户名"
                  value={selectedUser.username}
                  disabled
                  placeholder="用户名不可修改"
                />
                <Input
                  label="昵称"
                  value={editForm.nickname || ''}
                  onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                  placeholder="输入昵称"
                />
                <div>
                  <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                  <select
                    id="edit-role"
                    value={editForm.role || selectedUser.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="年级"
                  type="number"
                  value={editForm.grade?.toString() || ''}
                  onChange={(e) => setEditForm({ ...editForm, grade: parseInt(e.target.value) || 0 })}
                  placeholder="输入年级"
                />
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">创建新用户</h2>
              <div className="space-y-4">
                <Input
                  label="用户名"
                  value={createForm.username}
                  onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                  placeholder="输入用户名"
                  error={!createForm.username && error ? '用户名是必填项' : undefined}
                />
                <Input
                  label="昵称"
                  value={createForm.nickname || ''}
                  onChange={(e) => setCreateForm({ ...createForm, nickname: e.target.value })}
                  placeholder="输入昵称"
                />
                <div>
                  <label htmlFor="create-role" className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                  <select
                    id="create-role"
                    value={createForm.role || 'USER'}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="年级"
                  type="number"
                  value={createForm.grade?.toString() || ''}
                  onChange={(e) => setCreateForm({ ...createForm, grade: parseInt(e.target.value) || 0 })}
                  placeholder="输入年级"
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

        {/* Detail Modal */}
        {showDetailModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">用户详情</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 h-20 w-20">
                    {selectedUser.avatarUrl ? (
                      <img className="h-20 w-20 rounded-full" src={selectedUser.avatarUrl} alt={selectedUser.nickname} />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium text-2xl">
                        {selectedUser.nickname.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{selectedUser.nickname}</h3>
                    <p className="text-gray-500">@{selectedUser.username}</p>
                  </div>
                </div>
                <div className="border-t pt-4 space-y-2">
                  <DetailRow label="用户 ID" value={selectedUser.id} />
                  <DetailRow label="角色" value={selectedUser.role} />
                  <DetailRow label="等级" value={`Lv.${selectedUser.level}`} />
                  <DetailRow label="积分" value={selectedUser.points.toString()} />
                  <DetailRow label="年级" value={selectedUser.grade?.toString() || 'N/A'} />
                  <DetailRow label="邀请码" value={selectedUser.invitationCode} />
                  <DetailRow label="作品数" value={selectedUser._count.works.toString()} />
                  <DetailRow label="智能体数" value={selectedUser._count.userAgents.toString()} />
                  <DetailRow
                    label="创建时间"
                    value={new Date(selectedUser.createdAt).toLocaleString('zh-CN')}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button onClick={handleCloseModal} variant="outline">
                  关闭
                </Button>
                <Button onClick={() => { handleCloseModal(); handleEdit(selectedUser); }} variant="primary">
                  编辑
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}
