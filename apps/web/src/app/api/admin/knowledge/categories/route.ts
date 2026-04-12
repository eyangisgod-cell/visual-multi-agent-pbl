import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/knowledge/categories - 获取所有分类
// POST /api/admin/knowledge/categories - 创建新分类
export async function GET() {
  try {
    const categories = await prisma.knowledgeCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { children: true },
        },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, parentId } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    // 检查是否已存在
    const existing = await prisma.knowledgeCategory.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Category already exists' },
        { status: 409 }
      );
    }

    const category = await prisma.knowledgeCategory.create({
      data: {
        name: name.trim(),
        description,
        parentId: parentId || null,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
