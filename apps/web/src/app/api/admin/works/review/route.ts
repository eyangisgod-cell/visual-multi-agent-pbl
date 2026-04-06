import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/works/review - 获取待审核作品列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const skip = (page - 1) * limit;

    // 获取待审核的作品（status 为 pending_review）
    const [works, total] = await Promise.all([
      prisma.work.findMany({
        where: {
          status: 'pending_review',
        },
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
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.work.count({
        where: {
          status: 'pending_review',
        },
      }),
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
    console.error('Error fetching pending works:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending works' },
      { status: 500 }
    );
  }
}
