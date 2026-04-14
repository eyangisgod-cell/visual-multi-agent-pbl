import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/admin/analytics/learning - 获取学习数据统计
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // 构建日期过滤条件
    const where: Record<string, unknown> = {}
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        (where.createdAt as Record<string, unknown>).gte = new Date(startDate)
      }
      if (endDate) {
        (where.createdAt as Record<string, unknown>).lte = new Date(endDate)
      }
    }

    // 获取基础统计数据
    const [totalUsers, totalWorks, totalProjects, totalConversations, totalAgentUsage] = await Promise.all([
      prisma.user.count(),
      prisma.work.count({ where }),
      prisma.project.count(),
      prisma.conversation.count({ where }),
      prisma.userAgent.count(),
    ])

    // 计算活跃用户数（30 天内有作品提交的用户）
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const activeUsers = await prisma.user.count({
      where: {
        works: {
          some: {
            createdAt: {
              gte: thirtyDaysAgo,
            },
          },
        },
      },
    })

    // 计算项目完成率
    const completedProjects = await prisma.project.count({
      where: {
        status: 'published',
      },
    })

    return NextResponse.json({
      totalUsers,
      activeUsers,
      totalWorks,
      totalProjects,
      completedProjects,
      totalConversations,
      totalAgentUsage,
      completionRate: totalProjects > 0 ? ((completedProjects / totalProjects) * 100).toFixed(2) : 0,
    })
  } catch (error) {
    console.error('Error fetching learning analytics:', error)
    return NextResponse.json(
      { error: '获取学习数据失败' },
      { status: 500 }
    )
  }
}
