import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createAuditLog, extractIpAddress, extractUserAgent } from '@/lib/audit-logger';

const prisma = new PrismaClient();

// 预定义权限
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

// 预定义角色
const BUILTIN_ROLES = [
  {
    name: 'super_admin',
    description: '超级管理员 - 拥有全部权限',
    permissions: PERMISSIONS.map(p => p.key),
    isBuiltIn: true,
  },
  {
    name: 'admin',
    description: '管理员 - 用户/项目/作品管理',
    permissions: [
      'view_users', 'create_users', 'edit_users', 'delete_users',
      'view_projects', 'create_projects', 'edit_projects', 'delete_projects',
      'view_works', 'review_works', 'edit_works', 'delete_works',
      'view_agents', 'create_agents', 'edit_agents', 'delete_agents',
    ],
    isBuiltIn: true,
  },
  {
    name: 'editor',
    description: '编辑 - 内容编辑',
    permissions: [
      'view_projects', 'edit_projects',
      'view_works', 'edit_works',
    ],
    isBuiltIn: true,
  },
  {
    name: 'reviewer',
    description: '审核员 - 仅审核权限',
    permissions: [
      'view_works', 'review_works',
    ],
    isBuiltIn: true,
  },
];

// GET /api/admin/roles - 获取角色列表
export async function GET(request: NextRequest) {
  try {
    // 确保内置角色存在
    await ensureBuiltInRoles();

    const roles = await prisma.adminRole.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

// POST /api/admin/roles - 创建新角色
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, permissions } = body;

    // 验证必填字段
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Role name is required' },
        { status: 400 }
      );
    }

    // 检查是否已存在
    const existingRole = await prisma.adminRole.findUnique({
      where: { name },
    });

    if (existingRole) {
      return NextResponse.json(
        { error: 'Role already exists' },
        { status: 409 }
      );
    }

    // 验证权限
    const validPermissions = permissions?.filter((p: string) =>
      PERMISSIONS.some(perm => perm.key === p)
    ) || [];

    const role = await prisma.adminRole.create({
      data: {
        name: name.trim(),
        description,
        permissions: validPermissions,
        isBuiltIn: false,
      },
    });

    // 创建审计日志
    await createAuditLog({
      action: 'CREATE_ROLE',
      entityType: 'AdminRole',
      entityId: role.id,
      metadata: {
        roleName: name,
        permissions: validPermissions,
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    });

    return NextResponse.json({ role }, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    );
  }
}

// 确保内置角色存在
async function ensureBuiltInRoles() {
  for (const roleData of BUILTIN_ROLES) {
    await prisma.adminRole.upsert({
      where: { name: roleData.name },
      update: {
        description: roleData.description,
        permissions: roleData.permissions,
      },
      create: roleData,
    });
  }
}
