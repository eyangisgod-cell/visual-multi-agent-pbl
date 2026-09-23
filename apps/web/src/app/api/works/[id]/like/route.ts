import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createAuditLog, extractIpAddress, extractUserAgent } from '@/lib/audit-logger';

const prisma = new PrismaClient();

// POST /api/works/[id]/like - 点赞/取消点赞
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 从 session cookie 获取当前用户 ID
    const sessionToken = request.cookies.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 验证 session 并获取用户 ID
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }

    const userId = session.userId;

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

    // 检查用户是否已经点赞
    const existingLike = await prisma.workLike.findFirst({
      where: {
        workId: params.id,
        userId,
      },
    });

    let liked: boolean;
    if (existingLike) {
      // 取消点赞
      await prisma.workLike.delete({
        where: { id: existingLike.id },
      });
      liked = false;
    } else {
      // 点赞
      await prisma.workLike.create({
        data: {
          workId: params.id,
          userId,
        },
      });
      liked = true;
    }

    // 获取最新点赞数
    const likeCount = await prisma.workLike.count({
      where: { workId: params.id },
    });

    // 创建审计日志
    await createAuditLog({
      action: liked ? 'LIKE_WORK' : 'UNLIKE_WORK',
      entityType: 'WorkLike',
      entityId: params.id,
      userId,
      metadata: {
        workId: params.id,
        workTitle: work.title,
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    });

    return NextResponse.json({ liked, likeCount });
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    );
  }
}
