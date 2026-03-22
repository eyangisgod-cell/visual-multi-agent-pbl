import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/llm - 获取所有 LLM 配置
export async function GET() {
  try {
    const llmConfigs = await prisma.llmConfig.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // 隐藏敏感的 API Key
    const sanitizedConfigs = llmConfigs.map((config) => ({
      ...config,
      apiKey: config.apiKey ? `${config.apiKey.substring(0, 8)}...` : null,
    }));

    return NextResponse.json(sanitizedConfigs);
  } catch (error) {
    console.error('Error fetching LLM configs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch LLM configs' },
      { status: 500 }
    );
  }
}

// POST /api/admin/llm - 创建新的 LLM 配置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, apiKey, baseUrl, models, isActive } = body;

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: 'Provider and API key are required' },
        { status: 400 }
      );
    }

    const existingConfig = await prisma.llmConfig.findUnique({
      where: { provider },
    });

    if (existingConfig) {
      return NextResponse.json(
        { error: 'LLM provider already configured' },
        { status: 409 }
      );
    }

    const llmConfig = await prisma.llmConfig.create({
      data: {
        provider,
        apiKey,
        baseUrl,
        models,
        isActive: isActive || false,
      },
    });

    return NextResponse.json(
      {
        ...llmConfig,
        apiKey: `${llmConfig.apiKey.substring(0, 8)}...`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating LLM config:', error);
    return NextResponse.json(
      { error: 'Failed to create LLM config' },
      { status: 500 }
    );
  }
}
