import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/admin/works/[id]/review - 审核作品（批准/拒绝）
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { action, reason } = body;

    // 验证操作类型
    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // 拒绝操作需要填写原因
    if (action === 'reject' && !reason) {
      return NextResponse.json(
        { error: 'Reject reason is required' },
        { status: 400 }
      );
    }

    // 检查作品是否存在
    const existingWork = await prisma.work.findUnique({
      where: { id: params.id },
    });

    if (!existingWork) {
      return NextResponse.json(
        { error: 'Work not found' },
        { status: 404 }
      );
    }

    // 执行审核操作
    const newStatus = action === 'approve' ? 'published' : 'rejected';

    const updatedWork = await prisma.work.update({
      where: { id: params.id },
      data: {
        status: newStatus,
        ...(action === 'reject' && { description: reason }), // 将拒绝原因存储在 description 中
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

    // TODO: 创建审计日志
    // await prisma.auditLog.create({
    //   data: {
    //     action: action === 'approve' ? 'WORK_APPROVED' : 'WORK_REJECTED',
    //     entityId: params.id,
    //     entityType: 'WORK',
    //     metadata: { reason, previousStatus: existingWork.status },
    //     ...
    //   }
    // });

    return NextResponse.json({
      work: updatedWork,
      message: `Work ${action}ed successfully`,
    });
  } catch (error: any) {
    console.error('Error reviewing work:', error);
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Work not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to review work' },
      { status: 500 }
    );
  }
}
