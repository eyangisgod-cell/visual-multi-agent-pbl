import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Notification creation schema
const notificationCreateSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(['info', 'success', 'warning', 'error', 'task', 'system', 'achievement']).optional().default('info'),
  title: z.string().min(1).max(255),
  content: z.string(),
  actionUrl: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
})

// Notification update schema
const notificationUpdateSchema = notificationCreateSchema.partial()

// GET /api/notifications - 获取用户通知列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const isRead = searchParams.get('isRead')
    const type = searchParams.get('type')
    const limit = searchParams.get('limit')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = { userId }

    if (isRead !== null && isRead !== undefined) {
      where.isRead = isRead === 'true'
    }

    if (type) {
      where.type = type
    }

    const options: Record<string, unknown> = {
      where,
      orderBy: { createdAt: 'desc' },
    }

    if (limit) {
      const limitNum = parseInt(limit, 10)
      if (!isNaN(limitNum) && limitNum > 0) {
        options.take = limitNum
      }
    }

    const notifications = await prisma.notification.findMany(options)

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// POST /api/notifications - 创建新通知
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate userId first
    if (!body.userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Validate request body
    const validationResult = notificationCreateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        content: data.content,
        actionUrl: data.actionUrl || null,
        metadata: data.metadata || null,
      },
    })

    return NextResponse.json({ notification }, { status: 201 })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}
