import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createAuditLog, extractIpAddress, extractUserAgent } from '@/lib/audit-logger';

const prisma = new PrismaClient();

// GET /api/admin/users - 获取用户列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const role = searchParams.get('role');

    const skip = (page - 1) * limit;
    const where = role ? { role: { equals: role } } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          username: true,
          nickname: true,
          avatarUrl: true,
          grade: true,
          points: true,
          level: true,
          role: true,
          invitationCode: true,
          createdAt: true,
          _count: {
            select: {
              works: true,
              userAgents: true,
            },
          },
        },
        orderBy: { created_at: 'desc' } as any,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - 创建新用户（管理员功能）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      username,
      passwordHash,
      nickname,
      role,
      grade,
    } = body;

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    // 生成唯一的邀请码
    const invitationCode = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const user = await prisma.user.create({
      data: {
        username,
        password_hash: passwordHash,
        nickname,
        role: role || 'USER',
        grade,
        invitation_code: invitationCode,
      },
    });

    // 创建审计日志
    await createAuditLog({
      action: 'CREATE_USER',
      entityType: 'User',
      entityId: user.id,
      userId: user.id,
      username: user.username,
      metadata: {
        username,
        nickname,
        role: role || 'USER',
        invitationCode,
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
