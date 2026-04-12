import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createAuditLog, extractIpAddress, extractUserAgent } from '@/lib/audit-logger';

const prisma = new PrismaClient();

// PUT /api/messages/[id] - 更新消息
// DELETE /api/messages/[id] - 删除消息
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { content, metadata } = body;

    // 查找消息
    const message = await prisma.message.findUnique({
      where: { id: params.id },
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // 更新消息
    const updatedMessage = await prisma.message.update({
      where: { id: params.id },
      data: {
        content: content !== undefined ? content : message.content,
        metadata: metadata !== undefined ? metadata : message.metadata,
      },
    });

    return NextResponse.json({ message: updatedMessage });
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const message = await prisma.message.findUnique({
      where: { id: params.id },
      include: { conversation: true },
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    await prisma.message.delete({
      where: { id: params.id },
    });

    // 创建审计日志
    await createAuditLog({
      action: 'MESSAGE_DELETED',
      entityType: 'Message',
      entityId: params.id,
      userId: message.conversation.userId,
      metadata: {
        conversationId: message.conversationId,
        messageRole: message.role,
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    });

    return NextResponse.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}
