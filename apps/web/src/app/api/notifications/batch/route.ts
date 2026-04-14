import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Batch operations schema
const batchMarkReadSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(['mark_all_read', 'mark_all_unread']),
})

const batchDeleteSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(['delete_all_read', 'delete_all']),
})

// PUT /api/notifications/batch - 批量操作（标记已读等）
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = batchMarkReadSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { userId, action } = validationResult.data

    if (action === 'mark_all_read') {
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })

      return NextResponse.json({
        message: 'All notifications marked as read',
        count: result.count,
      })
    }

    if (action === 'mark_all_unread') {
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          isRead: true,
        },
        data: {
          isRead: false,
          readAt: null,
        },
      })

      return NextResponse.json({
        message: 'All notifications marked as unread',
        count: result.count,
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error batch updating notifications:', error)
    return NextResponse.json(
      { error: 'Failed to batch update notifications' },
      { status: 500 }
    )
  }
}

// DELETE /api/notifications/batch - 批量删除
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = batchDeleteSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { userId, action } = validationResult.data

    if (action === 'delete_all_read') {
      const result = await prisma.notification.deleteMany({
        where: {
          userId,
          isRead: true,
        },
      })

      return NextResponse.json({
        message: 'All read notifications deleted',
        count: result.count,
      })
    }

    if (action === 'delete_all') {
      const result = await prisma.notification.deleteMany({
        where: {
          userId,
        },
      })

      return NextResponse.json({
        message: 'All notifications deleted',
        count: result.count,
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error batch deleting notifications:', error)
    return NextResponse.json(
      { error: 'Failed to batch delete notifications' },
      { status: 500 }
    )
  }
}
