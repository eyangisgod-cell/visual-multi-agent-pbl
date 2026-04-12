import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createAuditLog, extractIpAddress, extractUserAgent } from '@/lib/audit-logger';

const prisma = new PrismaClient();

// POST /api/admin/works/[id]/review - 审核作品（批准或拒绝）
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { action, reason } = body;

    // 验证 action 参数
    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // 查找作品
    const existingWork = await prisma.work.findUnique({
      where: { id: params.id },
    });

    if (!existingWork) {
      return NextResponse.json(
        { error: 'Work not found' },
        { status: 404 }
      );
    }

    // 根据 action 更新作品状态
    let newStatus: string;
    let updateData: any = {};

    if (action === 'approve') {
      newStatus = 'published';
    } else {
      // action === 'reject'
      if (!reason || reason.trim() === '') {
        return NextResponse.json(
          { error: 'Reject reason is required' },
          { status: 400 }
        );
      }
      newStatus = 'rejected';
      // 将拒绝原因添加到作品描述中
      updateData.description = `${existingWork.description || ''}\n\n[审核拒绝原因]: ${reason}`;
    }

    updateData.status = newStatus;

    const updatedWork = await prisma.work.update({
      where: { id: params.id },
      data: updateData,
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

    // 创建审计日志
    await createAuditLog({
      action: action === 'approve' ? 'WORK_APPROVED' : 'WORK_REJECTED',
      entityType: 'Work',
      entityId: params.id,
      userId: existingWork.userId,
      username: existingWork.user?.username || null,
      metadata: {
        workTitle: updatedWork.title,
        previousStatus: existingWork.status,
        newStatus,
        reason: reason || null,
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    });

    return NextResponse.json({
      work: updatedWork,
      message: `Work ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
    });
  } catch (error) {
    console.error('Error reviewing work:', error);
    return NextResponse.json(
      { error: 'Failed to review work' },
      { status: 500 }
    );
  }
}
