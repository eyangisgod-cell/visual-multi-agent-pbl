import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createAuditLog, extractIpAddress, extractUserAgent } from '@/lib/audit-logger';

const prisma = new PrismaClient();

// PUT /api/admin/roles/[id] - 更新角色
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { description, permissions } = body;

    // 查找现有角色
    const existingRole = await prisma.adminRole.findUnique({
      where: { id: params.id },
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    // 不允许修改内置角色
    if (existingRole.isBuiltIn) {
      return NextResponse.json(
        { error: 'Cannot modify built-in role' },
        { status: 403 }
      );
    }

    // 验证权限
    const validPermissions = permissions?.filter((p: string) =>
      PERMISSIONS.some(perm => perm.key === p)
    ) || existingRole.permissions;

    const updatedRole = await prisma.adminRole.update({
      where: { id: params.id },
      data: {
        description: description !== undefined ? description : existingRole.description,
        permissions: validPermissions,
      },
    });

    // 创建审计日志
    await createAuditLog({
      action: 'UPDATE_ROLE',
      entityType: 'AdminRole',
      entityId: params.id,
      metadata: {
        roleName: existingRole.name,
        changes: {
          description: description !== undefined,
          permissions: permissions !== undefined,
        },
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    });

    return NextResponse.json({ role: updatedRole });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/roles/[id] - 删除角色
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existingRole = await prisma.adminRole.findUnique({
      where: { id: params.id },
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    // 不允许删除内置角色
    if (existingRole.isBuiltIn) {
      return NextResponse.json(
        { error: 'Cannot delete built-in role' },
        { status: 403 }
      );
    }

    await prisma.adminRole.delete({
      where: { id: params.id },
    });

    // 创建审计日志
    await createAuditLog({
      action: 'DELETE_ROLE',
      entityType: 'AdminRole',
      entityId: params.id,
      metadata: {
        roleName: existingRole.name,
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    });

    return NextResponse.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    );
  }
}

// 预定义权限（引用）
const PERMISSIONS = [
  { key: 'view_users', name: '查看用户', category: '用户管理', description: '查看用户列表和详情' },
  { key: 'create_users', name: '创建用户', category: '用户管理', description: '创建新用户' },
  { key: 'edit_users', name: '编辑用户', category: '用户管理', description: '编辑用户信息' },
  { key: 'delete_users', name: '删除用户', category: '用户管理', description: '删除用户' },
  { key: 'view_projects', name: '查看项目', category: '项目管理', description: '查看项目列表和详情' },
  { key: 'create_projects', name: '创建项目', category: '项目管理', description: '创建新项目' },
  { key: 'edit_projects', name: '编辑项目', category: '项目管理', description: '编辑项目信息' },
  { key: 'delete_projects', name: '删除项目', category: '项目管理', description: '删除项目' },
  { key: 'view_works', name: '查看作品', category: '作品管理', description: '查看作品列表和详情' },
  { key: 'review_works', name: '审核作品', category: '作品管理', description: '批准或拒绝作品' },
  { key: 'edit_works', name: '编辑作品', category: '作品管理', description: '编辑作品信息' },
  { key: 'delete_works', name: '删除作品', category: '作品管理', description: '删除作品' },
  { key: 'view_agents', name: '查看智能体', category: '智能体管理', description: '查看智能体列表' },
  { key: 'create_agents', name: '创建智能体', category: '智能体管理', description: '创建新智能体' },
  { key: 'edit_agents', name: '编辑智能体', category: '智能体管理', description: '编辑智能体配置' },
  { key: 'delete_agents', name: '删除智能体', category: '智能体管理', description: '删除智能体' },
  { key: 'view_settings', name: '查看设置', category: '系统设置', description: '查看系统设置' },
  { key: 'edit_settings', name: '编辑设置', category: '系统设置', description: '修改系统设置' },
  { key: 'view_roles', name: '查看角色', category: '角色管理', description: '查看角色和权限' },
  { key: 'manage_roles', name: '管理角色', category: '角色管理', description: '创建和编辑角色' },
];
