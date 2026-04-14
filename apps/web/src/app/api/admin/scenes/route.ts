import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createAuditLog, extractIpAddress, extractUserAgent } from '@/lib/audit-logger';

const prisma = new PrismaClient();

// GET /api/admin/scenes - 获取场景列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: Record<string, unknown> = {};
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const [scenes, total] = await Promise.all([
      prisma.scene.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.scene.count({ where }),
    ]);

    return NextResponse.json({
      scenes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching scenes:', error);
    return NextResponse.json(
      { error: '获取场景列表失败' },
      { status: 500 }
    );
  }
}

// POST /api/admin/scenes - 创建新场景
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      elements,
      resources,
      isActive,
    } = body;

    // 验证必填字段
    if (!name) {
      return NextResponse.json(
        { error: '场景名称是必填的' },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: '场景名称不能超过 100 个字符' },
        { status: 400 }
      );
    }

    const scene = await prisma.scene.create({
      data: {
        name,
        description,
        elements,
        resources,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    // 创建审计日志
    await createAuditLog({
      action: 'SCENE_CREATED',
      entityType: 'Scene',
      entityId: scene.id,
      metadata: {
        name,
        description,
        isActive,
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    });

    return NextResponse.json(scene, { status: 201 });
  } catch (error) {
    console.error('Error creating scene:', error);
    return NextResponse.json(
      { error: '创建场景失败' },
      { status: 500 }
    );
  }
}
