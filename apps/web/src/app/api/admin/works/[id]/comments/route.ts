import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/works/[id]/comments - 获取作品评论列表
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const comments = await prisma.workComment.findMany({
      where: { workId: params.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar_url: true,
          },
        },
        parent: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                nickname: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ comments, total: comments.length });
  } catch (error) {
    console.error('Error fetching work comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch work comments' },
      { status: 500 }
    );
  }
}

// POST /api/admin/works/[id]/comments - 发表评论
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { content, userId, parentId } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
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

    // If parentId provided, check if parent comment exists
    if (parentId) {
      const parentComment = await prisma.workComment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        );
      }

      // Ensure parent comment belongs to the same work
      if (parentComment.workId !== params.id) {
        return NextResponse.json(
          { error: 'Invalid parent comment' },
          { status: 400 }
        );
      }
    }

    // Create comment
    const comment = await prisma.workComment.create({
      data: {
        content,
        workId: params.id,
        userId,
        parentId: parentId || null,
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
      message: 'Comment created successfully',
      comment,
    });
  } catch (error: any) {
    console.error('Error creating work comment:', error);
    return NextResponse.json(
      { error: 'Failed to create work comment' },
      { status: 500 }
    );
  }
}
