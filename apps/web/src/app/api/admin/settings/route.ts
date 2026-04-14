import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/settings - 获取所有系统设置
// 支持可选的 category 查询参数进行筛选
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const whereClause = category ? { category } : {};

    const settings = await prisma.systemSetting.findMany({
      where: whereClause,
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system settings' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings - 批量更新系统设置
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Settings must be an array' },
        { status: 400 }
      );
    }

    // 批量更新设置
    const updatePromises = body.map((setting: { key: string; value: any; category?: string }) =>
      prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: {
          value: setting.value,
          category: setting.category,
        },
        create: {
          key: setting.key,
          value: setting.value,
          category: setting.category,
        },
      })
    );

    const updatedSettings = await Promise.all(updatePromises);

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Error updating system settings:', error);
    return NextResponse.json(
      { error: 'Failed to update system settings' },
      { status: 500 }
    );
  }
}
