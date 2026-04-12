import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/works/[id]/like/status - 检查用户点赞状态
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const existingLike = await prisma.workLike.findFirst({
      where: {
        workId: params.id,
        userId,
      },
    });

    const likeCount = await prisma.workLike.count({
      where: { workId: params.id },
    });

    return NextResponse.json({
      liked: !!existingLike,
      likeCount,
    });
  } catch (error) {
    console.error('Error fetching like status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch like status' },
      { status: 500 }
    );
  }
}
