import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/works/[id]/likes - 获取作品点赞列表
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const likes = await prisma.workLike.findMany({
      where: { workId: params.id },
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
    });

    return NextResponse.json({ likes, total: likes.length });
  } catch (error) {
    console.error('Error fetching work likes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch work likes' },
      { status: 500 }
    );
  }
}

// POST /api/admin/works/[id]/likes - 点赞作品
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { userId } = body;

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

    // Toggle like (create if not exists, delete if exists)
    const existingLike = await prisma.workLike.findUnique({
      where: {
        workId_userId: {
          workId: params.id,
          userId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.workLike.delete({
        where: { id: existingLike.id },
      });

      return NextResponse.json({
        message: 'Unlike successful',
        liked: false,
      });
    } else {
      // Like
      await prisma.workLike.create({
        data: {
          workId: params.id,
          userId,
        },
      });

      return NextResponse.json({
        message: 'Like successful',
        liked: true,
      });
    }
  } catch (error: any) {
    console.error('Error toggling work like:', error);
    return NextResponse.json(
      { error: 'Failed to toggle work like' },
      { status: 500 }
    );
  }
}
