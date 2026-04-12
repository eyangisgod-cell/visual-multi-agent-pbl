import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createAuditLog, extractIpAddress, extractUserAgent } from '@/lib/audit-logger';

const prisma = new PrismaClient();

// GET /api/reviews/[id] - 获取评价详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const review = await prisma.workReview.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatarUrl: true,
          },
        },
        work: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review' },
      { status: 500 }
    );
  }
}

// PUT /api/reviews/[id] - 更新评价
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { userId, rating, comment } = body;

    // 查找现有评价
    const existingReview = await prisma.workReview.findUnique({
      where: { id: params.id },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // 验证只能修改自己的评价
    if (existingReview.userId !== userId) {
      return NextResponse.json(
        { error: 'Only the review author can update this review' },
        { status: 403 }
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

    const updatedReview = await prisma.workReview.update({
      where: { id: params.id },
      data: {
        rating: rating !== undefined && rating !== null ? parseInt(rating) : existingReview.rating,
        comment: comment !== undefined && comment !== null ? comment.trim() : existingReview.comment,
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
      action: 'UPDATE_REVIEW',
      entityType: 'WorkReview',
      entityId: params.id,
      userId,
      metadata: {
        workId: existingReview.workId,
        changes: {
          rating: rating !== undefined && rating !== null ? rating : null,
          comment: comment !== undefined && comment !== null,
        },
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    });

    return NextResponse.json({ review: updatedReview });
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

// DELETE /api/reviews/[id] - 删除评价
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { userId } = body;

    // 查找现有评价
    const existingReview = await prisma.workReview.findUnique({
      where: { id: params.id },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // 验证只能删除自己的评价
    if (existingReview.userId !== userId) {
      return NextResponse.json(
        { error: 'Only the review author can delete this review' },
        { status: 403 }
      );
    }

    await prisma.workReview.delete({
      where: { id: params.id },
    });

    // 创建审计日志
    await createAuditLog({
      action: 'DELETE_REVIEW',
      entityType: 'WorkReview',
      entityId: params.id,
      userId,
      metadata: {
        workId: existingReview.workId,
        reviewId: params.id,
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    });

    return NextResponse.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}
