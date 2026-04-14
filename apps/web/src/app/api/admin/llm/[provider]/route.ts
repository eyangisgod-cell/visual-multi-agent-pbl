import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/llm/[provider] - 获取指定 LLM 配置
export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const llmConfig = await prisma.llmConfig.findUnique({
      where: { provider: params.provider },
    });

    if (!llmConfig) {
      return NextResponse.json(
        { error: 'LLM config not found' },
        { status: 404 }
      );
    }

    // 隐藏敏感的 API Key
    return NextResponse.json({
      ...llmConfig,
      apiKey: `${llmConfig.apiKey.substring(0, 8)}...`,
    });
  } catch (error) {
    console.error('Error fetching LLM config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch LLM config' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/llm/[provider] - 更新 LLM 配置
export async function PUT(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const body = await request.json();
    const { apiKey, baseUrl, models, isActive } = body;

    const existingConfig = await prisma.llmConfig.findUnique({
      where: { provider: params.provider },
    });

    if (!existingConfig) {
      return NextResponse.json(
        { error: 'LLM config not found' },
        { status: 404 }
      );
    }

    // 如果设置了新的 API Key，使用新的；否则保留原有的
    const updatedData: any = {
      baseUrl,
      models,
      isActive,
    };

    if (apiKey && !apiKey.includes('...')) {
      updatedData.apiKey = apiKey;
    }

    const updatedConfig = await prisma.llmConfig.update({
      where: { provider: params.provider },
      data: updatedData,
    });

    return NextResponse.json({
      ...updatedConfig,
      apiKey: `${updatedConfig.apiKey.substring(0, 8)}...`,
    });
  } catch (error) {
    console.error('Error updating LLM config:', error);
    return NextResponse.json(
      { error: 'Failed to update LLM config' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/llm/[provider] - 删除 LLM 配置
export async function DELETE(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const existingConfig = await prisma.llmConfig.findUnique({
      where: { provider: params.provider },
    });

    if (!existingConfig) {
      return NextResponse.json(
        { error: 'LLM config not found' },
        { status: 404 }
      );
    }

    await prisma.llmConfig.delete({
      where: { provider: params.provider },
    });

    return NextResponse.json({ message: 'LLM config deleted successfully' });
  } catch (error) {
    console.error('Error deleting LLM config:', error);
    return NextResponse.json(
      { error: 'Failed to delete LLM config' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/llm/[provider] - 更新 LLM 配置（部分更新）
export async function PATCH(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const body = await request.json();
    const { isActive } = body;

    const existingConfig = await prisma.llmConfig.findUnique({
      where: { provider: params.provider },
    });

    if (!existingConfig) {
      return NextResponse.json(
        { error: 'LLM config not found' },
        { status: 404 }
      );
    }

    const updatedConfig = await prisma.llmConfig.update({
      where: { provider: params.provider },
      data: { isActive },
    });

    return NextResponse.json({
      ...updatedConfig,
      apiKey: `${updatedConfig.apiKey.substring(0, 8)}...`,
    });
  } catch (error) {
    console.error('Error updating LLM config:', error);
    return NextResponse.json(
      { error: 'Failed to update LLM config' },
      { status: 500 }
    );
  }
}
