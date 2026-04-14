import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/admin/analytics/works - 获取作品提交趋势
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const groupBy = searchParams.get('groupBy') || 'date'

    // 计算起始日期
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // 获取作品总数
    const totalWorks = await prisma.work.count({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    })

    // 按日期分组统计（趋势数据）
    const trendData = await prisma.work.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      _count: true,
    })

    // 按状态分组统计
    const statusDistribution = await prisma.work.groupBy({
      by: ['status'],
      _count: true,
    })

    // 按科目分组统计
    const projectWorks = await prisma.work.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        project: {
          select: {
            subject: true,
          },
        },
      },
    })

    // 按科目聚合
    const subjectDistribution: Record<string, number> = {}
    projectWorks.forEach((work) => {
      const subject = work.project.subject || '未分类'
      subjectDistribution[subject] = (subjectDistribution[subject] || 0) + 1
    })

    // 按评分分组统计
    const scoreDistribution = await prisma.work.groupBy({
      by: ['score'],
      _count: true,
    })

    // 获取点赞和评论统计
    const [totalLikes, totalReviews] = await Promise.all([
      prisma.workLike.count(),
      prisma.workReview.count(),
    ])

    // 处理趋势数据，按日期聚合
    const dailyTrend: Record<string, number> = {}
    trendData.forEach((item) => {
      const date = new Date(item.createdAt).toISOString().split('T')[0]
      dailyTrend[date] = (dailyTrend[date] || 0) + item._count
    })

    return NextResponse.json({
      totalWorks,
      trendData: dailyTrend,
      statusDistribution: statusDistribution.reduce(
        (acc, item) => ({ ...acc, [item.status || 'unknown']: item._count }),
        {}
      ),
      subjectDistribution,
      scoreDistribution: scoreDistribution.reduce(
        (acc, item) => ({ ...acc, [item.score || 0]: item._count }),
        {}
      ),
      totalLikes,
      totalReviews,
    })
  } catch (error) {
    console.error('Error fetching works analytics:', error)
    return NextResponse.json(
      { error: '获取作品统计失败' },
      { status: 500 }
    )
  }
}
