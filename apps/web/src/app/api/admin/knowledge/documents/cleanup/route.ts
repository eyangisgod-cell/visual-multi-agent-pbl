import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DELETE /api/admin/knowledge/documents/cleanup - 清理所有测试文档
export async function DELETE(request: NextRequest) {
  try {
    // 删除所有知识库文档（用于测试清理）
    const deleted = await prisma.knowledgeDocument.deleteMany({
      where: {},
    });

    return NextResponse.json({
      success: true,
      deleted: deleted.count,
    });
  } catch (error) {
    console.error('Error cleaning up documents:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup documents' },
      { status: 500 }
    );
  }
}
