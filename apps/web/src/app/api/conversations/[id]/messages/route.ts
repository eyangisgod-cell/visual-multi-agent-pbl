import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, MessageRole } from '@prisma/client';
import { createAuditLog, extractIpAddress, extractUserAgent } from '@/lib/audit-logger';

const prisma = new PrismaClient();

// GET /api/conversations/[id]/messages - 获取消息列表
// POST /api/conversations/[id]/messages - 发送新消息
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const cursor = searchParams.get('cursor');

    // 验证对话存在
    const conversation = await prisma.conversation.findUnique({
      where: { id: params.id },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // 构建查询
    const where = { conversationId: params.id };
    const cursorOption = cursor ? { id: cursor } : undefined;

    const messages = await prisma.message.findMany({
      where,
      cursor: cursorOption as any,
      take: limit,
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      messages,
      nextCursor: messages.length > 0 ? messages[messages.length - 1].id : null,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { role, content, metadata } = body;

    // 验证必填字段
    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // 验证角色
    const validRoles: MessageRole[] = ['user', 'assistant', 'system'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be user, assistant, or system' },
        { status: 400 }
      );
    }

    // 验证对话存在
    const conversation = await prisma.conversation.findUnique({
      where: { id: params.id },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // 创建消息
    const message = await prisma.message.create({
      data: {
        conversationId: params.id,
        role,
        content: content.trim(),
        metadata: metadata || null,
      },
    });

    // 更新对话的更新时间
    await prisma.conversation.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}
