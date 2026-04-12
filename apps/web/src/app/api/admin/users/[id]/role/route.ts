import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createAuditLog, extractIpAddress, extractUserAgent } from '@/lib/audit-logger';

const prisma = new PrismaClient();

// POST /api/admin/users/[id]/role - 给用户分配角色
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { role } = body;

    // 验证必填字段
    if (!role || typeof role !== 'string' || role.trim() === '') {
      return NextResponse.json(
        { error: 'Role is required' },
        { status: 400 }
      );
    }

    const trimmedRole = role.trim();

    // 验证角色是否存在
    const existingRole = await prisma.adminRole.findUnique({
      where: { name: trimmedRole },
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: 'Role does not exist' },
        { status: 400 }
      );
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 更新用户角色
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { role: trimmedRole },
    });

    // 创建审计日志
    await createAuditLog({
      action: 'USER_ROLE_ASSIGNED',
      entityType: 'User',
      entityId: user.id,
      userId: user.id,
      username: user.username,
      metadata: {
        previousRole: user.role,
        newRole: trimmedRole,
        roleName: existingRole.name,
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    });

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error('Error assigning user role:', error);
    return NextResponse.json(
      { error: 'Failed to assign user role' },
      { status: 500 }
    );
  }
}
