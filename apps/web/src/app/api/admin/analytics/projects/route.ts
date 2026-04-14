import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/admin/analytics/projects - 获取项目完成统计
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // 获取项目列表及其关联数据
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              works: true,
              tasks: true,
            },
          },
        },
      }),
      prisma.project.count(),
    ])

    // 计算每个项目的完成率
    const projectsWithRates = projects.map((project) => {
      const taskCount = project._count.tasks || 1
      const completionRate = project.completed_count
        ? ((project.completed_count / taskCount) * 100).toFixed(2)
        : 0
      return {
        ...project,
        completionRate: parseFloat(completionRate),
      }
    })

    // 计算总体完成率
    const totalCompleted = projects.reduce((sum, p) => sum + (p.completed_count || 0), 0)
    const totalTasks = projects.reduce((sum, p) => sum + (p._count?.tasks || 0), 0)
    const overallCompletionRate = totalTasks > 0
      ? ((totalCompleted / totalTasks) * 100).toFixed(2)
      : 0

    return NextResponse.json({
      projects: projectsWithRates,
      overallCompletionRate: parseFloat(overallCompletionRate),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching project analytics:', error)
    return NextResponse.json(
      { error: '获取项目统计失败' },
      { status: 500 }
    )
  }
}
