import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/works/[id]/likes - 获取作品点赞数
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const likeCount = await prisma.workLike.count({
      where: { workId: params.id },
    });

    return NextResponse.json({ likeCount });
  } catch (error) {
    console.error('Error fetching likes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch likes' },
      { status: 500 }
    );
  }
}
