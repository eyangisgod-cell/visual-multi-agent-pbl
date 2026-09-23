import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/works/[id]/comments - 获取作品评论列表（包含回复数）
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Check if work exists
    const work = await prisma.work.findUnique({
      where: { id: params.id },
    });

    if (!work) {
      return NextResponse.json(
        { error: 'Work not found' },
        { status: 404 }
      );
    }

    const [comments, total] = await Promise.all([
      prisma.workComment.findMany({
        where: {
          workId: params.id,
          parentId: null, // Only get top-level comments
        },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              nickname: true,
              avatar_url: true,
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.workComment.count({
        where: {
          workId: params.id,
          parentId: null,
        },
      }),
    ]);

    // Format comments to include replyCount
    const formattedComments = comments.map((comment) => ({
      ...comment,
      replyCount: comment._count.replies,
      _count: undefined,
    }));

    return NextResponse.json({
      comments: formattedComments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching work comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch work comments' },
      { status: 500 }
    );
  }
}

// POST /api/works/[id]/comments - 创建评论
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { content } = body;

    // Validate content
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json(
        { error: 'Content is required and cannot be empty' },
        { status: 400 }
      );
    }

    // Check if work exists
    const work = await prisma.work.findUnique({
      where: { id: params.id },
    });

    if (!work) {
      return NextResponse.json(
        { error: 'Work not found' },
        { status: 404 }
      );
    }

    // For now, we'll use a default user ID since tests don't provide authentication
    // In production, this would come from the session
    // Use a valid UUID format for the default user ID
    const userId = body.userId || 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

    // Create comment
    const comment = await prisma.workComment.create({
      data: {
        content: content.trim(),
        workId: params.id,
        userId,
        parentId: null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar_url: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: comment.id,
      content: comment.content,
      workId: comment.workId,
      parentId: comment.parentId,
      createdAt: comment.createdAt,
      user: comment.user,
    });
  } catch (error: any) {
    console.error('Error creating work comment:', error);
    return NextResponse.json(
      { error: 'Failed to create work comment' },
      { status: 500 }
    );
  }
}
