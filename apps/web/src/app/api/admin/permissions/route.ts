import { NextResponse } from 'next/server';

// 预定义权限（与 roles/route.ts 保持一致）
const PERMISSIONS = [
  // 用户管理
  { key: 'view_users', name: '查看用户', category: '用户管理', description: '查看用户列表和详情' },
  { key: 'create_users', name: '创建用户', category: '用户管理', description: '创建新用户' },
  { key: 'edit_users', name: '编辑用户', category: '用户管理', description: '编辑用户信息' },
  { key: 'delete_users', name: '删除用户', category: '用户管理', description: '删除用户' },

  // 项目管理
  { key: 'view_projects', name: '查看项目', category: '项目管理', description: '查看项目列表和详情' },
  { key: 'create_projects', name: '创建项目', category: '项目管理', description: '创建新项目' },
  { key: 'edit_projects', name: '编辑项目', category: '项目管理', description: '编辑项目信息' },
  { key: 'delete_projects', name: '删除项目', category: '项目管理', description: '删除项目' },

  // 作品管理
  { key: 'view_works', name: '查看作品', category: '作品管理', description: '查看作品列表和详情' },
  { key: 'review_works', name: '审核作品', category: '作品管理', description: '批准或拒绝作品' },
  { key: 'edit_works', name: '编辑作品', category: '作品管理', description: '编辑作品信息' },
  { key: 'delete_works', name: '删除作品', category: '作品管理', description: '删除作品' },

  // 智能体管理
  { key: 'view_agents', name: '查看智能体', category: '智能体管理', description: '查看智能体列表' },
  { key: 'create_agents', name: '创建智能体', category: '智能体管理', description: '创建新智能体' },
  { key: 'edit_agents', name: '编辑智能体', category: '智能体管理', description: '编辑智能体配置' },
  { key: 'delete_agents', name: '删除智能体', category: '智能体管理', description: '删除智能体' },

  // 系统设置
  { key: 'view_settings', name: '查看设置', category: '系统设置', description: '查看系统设置' },
  { key: 'edit_settings', name: '编辑设置', category: '系统设置', description: '修改系统设置' },

  // 角色管理
  { key: 'view_roles', name: '查看角色', category: '角色管理', description: '查看角色和权限' },
  { key: 'manage_roles', name: '管理角色', category: '角色管理', description: '创建和编辑角色' },
];

// GET /api/admin/permissions - 获取权限定义列表
export async function GET() {
  return NextResponse.json({ permissions: PERMISSIONS });
}
