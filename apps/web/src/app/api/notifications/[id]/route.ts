import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/notifications/[id] - 获取单个通知
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: params.id },
    })

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ notification })
  } catch (error) {
    console.error('Error fetching notification:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification' },
      { status: 500 }
    )
  }
}

// PUT /api/notifications/[id] - 更新通知（包括标记已读）
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { isRead, title, content, actionUrl, metadata } = body

    // Check if notification exists
    const existingNotification = await prisma.notification.findUnique({
      where: { id: params.id },
    })

    if (!existingNotification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}

    if (isRead !== undefined) {
      updateData.isRead = isRead
      if (isRead) {
        updateData.readAt = new Date()
      } else {
        updateData.readAt = null
      }
    }

    if (title !== undefined) {
      updateData.title = title
    }

    if (content !== undefined) {
      updateData.content = content
    }

    if (actionUrl !== undefined) {
      updateData.actionUrl = actionUrl
    }

    if (metadata !== undefined) {
      updateData.metadata = metadata
    }

    const notification = await prisma.notification.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({ notification })
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    )
  }
}

// DELETE /api/notifications/[id] - 删除通知
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: params.id },
    })

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    await prisma.notification.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Notification deleted successfully' })
  } catch (error) {
    console.error('Error deleting notification:', error)
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    )
  }
}
