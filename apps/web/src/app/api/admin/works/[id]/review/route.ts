import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createAuditLog, extractIpAddress, extractUserAgent } from '@/lib/audit-logger';

const prisma = new PrismaClient();

// UUID 格式验证
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// GET /api/admin/works/[id]/review - 获取作品的评价列表
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const workId = params.id;

    // 验证作品 ID 格式
    if (!isValidUUID(workId)) {
      return NextResponse.json({ error: 'Invalid work ID format' }, { status: 400 });
    }

    // 验证作品 ID 是否存在
    const work = await prisma.work.findUnique({
      where: { id: workId },
    });

    if (!work) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.workReview.findMany({
        where: { workId },
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
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.workReview.count({
        where: { workId },
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
    console.error('Error fetching work reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch work reviews' },
      { status: 500 }
    );
  }
}

// POST /api/admin/works/[id]/review - 添加新的评价 或 审核作品
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const workId = params.id;

    // 验证作品 ID 格式
    if (!isValidUUID(workId)) {
      return NextResponse.json({ error: 'Invalid work ID format' }, { status: 400 });
    }

    // 验证作品 ID 是否存在
    const work = await prisma.work.findUnique({
      where: { id: workId },
    });

    if (!work) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 });
    }

    const body = await request.json();
    const { userId, rating, comment, action, reason } = body;

    // 检查是否是作品审核操作（action: 'approve' 或 'reject'）
    if (action === 'approve' || action === 'reject') {
      return handleWorkReview(request, workId, action, reason);
    }

    // 否则是作品评价操作
    if (!userId || !comment) {
      return NextResponse.json(
        { error: 'userId and comment are required' },
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

    const review = await prisma.workReview.create({
      data: {
        workId,
        userId,
        rating: rating !== undefined && rating !== null ? parseInt(rating) : null,
        comment,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            nickname: true,
          },
        },
      },
    });

    // 创建审计日志
    await createAuditLog({
      action: 'WORK_REVIEW_CREATED',
      entityType: 'WorkReview',
      entityId: review.id,
      metadata: {
        workId,
        userId,
        rating: review.rating,
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error('Error creating work review:', error);
    return NextResponse.json(
      { error: 'Failed to create work review' },
      { status: 500 }
    );
  }
}

// 处理作品审核（批准/拒绝）
async function handleWorkReview(
  request: NextRequest,
  workId: string,
  action: string,
  reason?: string
) {
  try {
    // 验证 action 参数
    if (!action || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // 拒绝作品时必须提供原因
    if (action === 'reject' && (!reason || !reason.trim())) {
      return NextResponse.json(
        { error: 'Reason is required when rejecting a work' },
        { status: 400 }
      );
    }

    // 更新作品状态
    const newStatus = action === 'approve' ? 'published' : 'rejected';

    const updatedWork = await prisma.work.update({
      where: { id: workId },
      data: {
        status: newStatus,
        // 如果是拒绝，可以在 metadata 中记录原因
      },
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
    });

    // 创建审计日志
    await createAuditLog({
      action: action === 'approve' ? 'WORK_APPROVED' : 'WORK_REJECTED',
      entityType: 'Work',
      entityId: workId,
      metadata: {
        action,
        reason: reason || null,
        previousStatus: 'pending_review',
        newStatus,
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    });

    // 如果作品被批准，给用户奖励积分
    if (action === 'approve') {
      // 这里可以调用积分服务
      // await awardPointsForWorkApproved(workId);
    }

    return NextResponse.json({
      work: updatedWork,
      message: action === 'approve' ? '作品已批准' : '作品已拒绝',
    });
  } catch (error) {
    console.error('Error handling work review:', error);
    return NextResponse.json(
      { error: 'Failed to handle work review' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/works/[id]/review/[reviewId] - 更新评价
export async function PUT(request: NextRequest, { params }: { params: { id: string; reviewId: string } }) {
  try {
    const workId = params.id;
    const reviewId = params.reviewId;

    // 验证作品 ID 格式
    if (!isValidUUID(workId)) {
      return NextResponse.json({ error: 'Invalid work ID format' }, { status: 400 });
    }

    // 验证评价 ID 格式
    if (!isValidUUID(reviewId)) {
      return NextResponse.json({ error: 'Invalid review ID format' }, { status: 400 });
    }

    // 验证作品 ID 是否存在
    const work = await prisma.work.findUnique({
      where: { id: workId },
    });

    if (!work) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 });
    }

    // 验证评价 ID 是否存在
    const existingReview = await prisma.workReview.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const body = await request.json();
    const { rating, comment } = body;

    if (!comment) {
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

    const review = await prisma.workReview.update({
      data: {
        rating: rating !== undefined && rating !== null ? parseInt(rating) : existingReview.rating,
        comment,
      },
      where: { id: reviewId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            nickname: true,
          },
        },
      },
    });

    // 创建审计日志
    await createAuditLog({
      action: 'WORK_REVIEW_UPDATED',
      entityType: 'WorkReview',
      entityId: review.id,
      metadata: {
        workId,
        reviewId,
        rating: review.rating,
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    });

    return NextResponse.json({ review }, { status: 200 });
  } catch (error) {
    console.error('Error updating work review:', error);
    return NextResponse.json(
      { error: 'Failed to update work review' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/works/[id]/review/[reviewId] - 删除评价
export async function DELETE(request: NextRequest, { params }: { params: { id: string; reviewId: string } }) {
  try {
    const workId = params.id;
    const reviewId = params.reviewId;

    // 验证作品 ID 格式
    if (!isValidUUID(workId)) {
      return NextResponse.json({ error: 'Invalid work ID format' }, { status: 400 });
    }

    // 验证评价 ID 格式
    if (!isValidUUID(reviewId)) {
      return NextResponse.json({ error: 'Invalid review ID format' }, { status: 400 });
    }

    // 验证作品 ID 是否存在
    const work = await prisma.work.findUnique({
      where: { id: workId },
    });

    if (!work) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 });
    }

    // 验证评价 ID 是否存在
    const existingReview = await prisma.workReview.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    await prisma.workReview.delete({
      where: { id: reviewId },
    });

    // 创建审计日志
    await createAuditLog({
      action: 'WORK_REVIEW_DELETED',
      entityType: 'WorkReview',
      entityId: reviewId,
      metadata: {
        workId,
        reviewId,
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    });

    return NextResponse.json({ message: 'Review deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting work review:', error);
    return NextResponse.json(
      { error: 'Failed to delete work review' },
      { status: 500 }
    );
  }
}
