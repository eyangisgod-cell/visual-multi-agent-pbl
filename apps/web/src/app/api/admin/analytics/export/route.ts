import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/admin/analytics/export - 导出数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const format = searchParams.get('format') || 'json'

    if (!type || !['works', 'users', 'projects', 'agents'].includes(type)) {
      return NextResponse.json(
        { error: '不支持的导出类型' },
        { status: 400 }
      )
    }

    // 构建日期过滤条件
    const dateFilter: Record<string, unknown> = {}
    if (startDate || endDate) {
      dateFilter.createdAt = {}
      if (startDate) {
        (dateFilter.createdAt as Record<string, unknown>).gte = new Date(startDate)
      }
      if (endDate) {
        (dateFilter.createdAt as Record<string, unknown>).lte = new Date(endDate)
      }
    }

    let data: any[] = []
    let filename = ''

    switch (type) {
      case 'works': {
        filename = `works_export_${new Date().toISOString().split('T')[0]}`
        data = await prisma.work.findMany({
          where: dateFilter,
          include: {
            user: {
              select: {
                username: true,
                nickname: true,
              },
            },
            project: {
              select: {
                title: true,
                subject: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 1000,
        })
        break
      }

      case 'users': {
        filename = `users_export_${new Date().toISOString().split('T')[0]}`
        data = await prisma.user.findMany({
          include: {
            works: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 1000,
        })
        break
      }

      case 'projects': {
        filename = `projects_export_${new Date().toISOString().split('T')[0]}`
        data = await prisma.project.findMany({
          where: dateFilter,
          include: {
            works: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
            tasks: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 1000,
        })
        break
      }

      case 'agents': {
        filename = `agents_export_${new Date().toISOString().split('T')[0]}`
        data = await prisma.agent.findMany({
          include: {
            UserAgent: {
              select: {
                userId: true,
                usage_count: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 1000,
        })
        break
      }
    }

    // 根据格式返回数据
    if (format === 'csv') {
      const csvData = convertToCSV(data)
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      })
    }

    // 默认返回 JSON
    return NextResponse.json({
      data,
      exportTime: new Date().toISOString(),
      total: data.length,
    })
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json(
      { error: '导出数据失败' },
      { status: 500 }
    )
  }
}

// 辅助函数：将数据转换为 CSV 格式
function convertToCSV(data: any[]): string {
  if (data.length === 0) return ''

  const headers = Object.keys(data[0])
  const rows = data.map((item) =>
    headers.map((header) => {
      const value = item[header]
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value).replace(/"/g, '""')
      }
      return String(value).replace(/"/g, '""')
    }).join(',')
  )

  return [headers.join(','), ...rows].join('\n')
}
