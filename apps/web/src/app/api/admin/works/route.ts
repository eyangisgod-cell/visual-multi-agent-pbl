import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createAuditLog, extractIpAddress, extractUserAgent } from '@/lib/audit-logger';

const prisma = new PrismaClient();

// GET /api/admin/works - 获取作品列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const projectId = searchParams.get('projectId');

    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (projectId) {
      where.projectId = projectId;
    }

    const [works, total] = await Promise.all([
      prisma.work.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              nickname: true,
            },
          },
          project: {
            select: {
              id: true,
              title: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.work.count({ where }),
    ]);

    return NextResponse.json({
      works,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching works:', error);
    return NextResponse.json(
      { error: 'Failed to fetch works' },
      { status: 500 }
    );
  }
}

// POST /api/admin/works - 创建新作品
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      coverImageUrl,
      content,
      projectId,
      userId,
      status,
    } = body;

    // 验证必填字段
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const work = await prisma.work.create({
      data: {
        title,
        description,
        coverImageUrl,
        content,
        projectId,
        userId: userId || '',
        status: status || 'draft',
      },
    });

    // 创建审计日志
    await createAuditLog({
      action: 'CREATE_WORK',
      entityType: 'Work',
      entityId: work.id,
      userId: userId || null,
      metadata: {
        title,
        projectId,
        status: status || 'draft',
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    });

    return NextResponse.json(work, { status: 201 });
  } catch (error) {
    console.error('Error creating work:', error);
    return NextResponse.json(
      { error: 'Failed to create work' },
      { status: 500 }
    );
  }
}
