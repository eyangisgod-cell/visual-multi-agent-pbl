import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * GET /api/works/[id] - 作品详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const work = await prisma.work.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar_url: true
          }
        },
        project: {
          select: {
            id: true,
            title: true,
            subject: true,
            description: true
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                nickname: true,
                avatar_url: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        likes: {
          select: {
            id: true,
            userId: true
          }
        }
      }
    })

    if (!work) {
      return NextResponse.json(
        { error: 'Work not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ work })
  } catch (error) {
    console.error('Error fetching work:', error)
    return NextResponse.json(
      { error: 'Failed to fetch work' },
      { status: 500 }
    )
  }
}
