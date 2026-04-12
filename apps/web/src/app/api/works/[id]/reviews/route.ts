import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createAuditLog, extractIpAddress, extractUserAgent } from '@/lib/audit-logger';

const prisma = new PrismaClient();

// GET /api/works/[id]/reviews - 获取作品评价列表
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.workReview.findMany({
        where: { workId: params.id },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              nickname: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.workReview.count({
        where: { workId: params.id },
      }),
    ]);

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/works/[id]/reviews - 创建作品评价
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { userId, rating, comment } = body;

    // 验证必填字段
    if (!comment || comment.trim() === '') {
      return NextResponse.json(
        { error: 'Comment is required' },
        { status: 400 }
      );
    }

    // 验证评分范围（如果提供）
    if (rating !== undefined && rating !== null) {
      const ratingNum = parseInt(rating);
      if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return NextResponse.json(
          { error: 'Rating must be between 1 and 5' },
          { status: 400 }
        );
      }
    }

    // 检查作品是否存在
    const work = await prisma.work.findUnique({
      where: { id: params.id },
    });

    if (!work) {
      return NextResponse.json(
        { error: 'Work not found' },
        { status: 404 }
      );
    }

    // 检查用户是否已经评价过
    const existingReview = await prisma.workReview.findFirst({
      where: {
        workId: params.id,
        userId,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'User has already reviewed this work' },
        { status: 409 }
      );
    }

    const review = await prisma.workReview.create({
      data: {
        workId: params.id,
        userId,
        rating: rating !== undefined && rating !== null ? parseInt(rating) : null,
        comment: comment.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatarUrl: true,
          },
        },
      },
    });

    // 创建审计日志
    await createAuditLog({
      action: 'CREATE_REVIEW',
      entityType: 'WorkReview',
      entityId: review.id,
      userId,
      metadata: {
        workId: params.id,
        workTitle: work.title,
        rating,
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
