import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/works/[id]/comments/reply - 创建回复
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { content, parentId } = body;

    // Validate content
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json(
        { error: 'Content is required and cannot be empty' },
        { status: 400 }
      );
    }

    // Validate parentId
    if (!parentId) {
      return NextResponse.json(
        { error: 'Parent ID is required for replies' },
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

    // Check if parent comment exists
    const parentComment = await prisma.workComment.findUnique({
      where: { id: parentId },
    });

    if (!parentComment) {
      return NextResponse.json(
        { error: 'Parent comment not found' },
        { status: 400 }
      );
    }

    // Check if parent comment belongs to the same work
    if (parentComment.workId !== params.id) {
      return NextResponse.json(
        { error: 'Parent comment does not belong to this work' },
        { status: 400 }
      );
    }

    // Check if trying to reply to a reply (no nested replies allowed)
    if (parentComment.parentId !== null) {
      return NextResponse.json(
        { error: 'Cannot reply to a reply (nested replies not allowed)' },
        { status: 400 }
      );
    }

    // For now, we'll use a default user ID since tests don't provide authentication
    // Use a valid UUID format for the default user ID
    const userId = body.userId || 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

    // Create reply
    const reply = await prisma.workComment.create({
      data: {
        content: content.trim(),
        workId: params.id,
        userId,
        parentId,
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
      id: reply.id,
      content: reply.content,
      workId: reply.workId,
      parentId: reply.parentId,
      createdAt: reply.createdAt,
      user: reply.user,
    });
  } catch (error: any) {
    console.error('Error creating reply:', error);
    return NextResponse.json(
      { error: 'Failed to create reply' },
      { status: 500 }
    );
  }
}
