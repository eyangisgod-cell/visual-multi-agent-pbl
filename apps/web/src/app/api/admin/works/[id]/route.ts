import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/works/[id] - 获取作品详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const work = await prisma.work.findUnique({
      where: { id: params.id },
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

    if (!work) {
      return NextResponse.json(
        { error: 'Work not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ work });
  } catch (error) {
    console.error('Error fetching work:', error);
    return NextResponse.json(
      { error: 'Failed to fetch work' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/works/[id] - 更新作品
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      coverImageUrl,
      content,
      status,
      score,
    } = body;

    const work = await prisma.work.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(coverImageUrl !== undefined && { coverImageUrl }),
        ...(content !== undefined && { content }),
        ...(status && { status }),
        ...(score !== undefined && { score }),
      },
    });

    return NextResponse.json({ work });
  } catch (error: any) {
    console.error('Error updating work:', error);
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Work not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update work' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/works/[id] - 删除作品
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.work.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Work deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting work:', error);
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Work not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete work' },
      { status: 500 }
    );
  }
}
