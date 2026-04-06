import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/audit-logs - 获取审计日志列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const actionType = searchParams.get('actionType');
    const entityType = searchParams.get('entityType');
    const userId = searchParams.get('userId');

    const skip = (page - 1) * limit;

    const where: any = {};

    if (actionType) {
      where.action = actionType;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (userId) {
      where.userId = userId;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

// POST /api/admin/audit-logs - 创建审计日志（内部使用）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      action,
      entityType,
      entityId,
      userId,
      username,
      metadata,
      ipAddress,
      userAgent,
    } = body;

    // 验证必填字段
    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    const log = await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        userId,
        username,
        metadata,
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    console.error('Error creating audit log:', error);
    return NextResponse.json(
      { error: 'Failed to create audit log' },
      { status: 500 }
    );
  }
}
