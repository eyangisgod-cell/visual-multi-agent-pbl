import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/projects - 获取项目列表（支持搜索和筛选）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search'); // 搜索关键词

    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};

    // 状态筛选
    if (status) {
      where.status = status;
    }

    // 搜索功能（标题或描述）
    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive', // 不区分大小写
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.project.count({ where }),
    ]);

    return NextResponse.json({
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/admin/projects - 创建新项目
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      gradeMin,
      gradeMax,
      subject,
      difficulty,
      rubricCriteria,
      tags,
    } = body;

    // 验证必填字段
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        title,
        description,
        gradeMin,
        gradeMax,
        subject,
        difficulty: difficulty || 1,
        rubricCriteria,
        tags: tags || [],
        status: 'draft',
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
