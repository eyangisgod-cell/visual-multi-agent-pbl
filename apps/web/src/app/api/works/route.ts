import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'visual-pbl-jwt-secret-key-change-in-production'

/**
 * 从请求中获取用户 ID
 * 优先从 session cookie 获取，其次从 Authorization header 获取
 */
function getUserIdFromRequest(request: NextRequest): string | null {
  // 尝试从 session cookie 获取
  const sessionToken = request.cookies.get('session')?.value;
  if (sessionToken) {
    try {
      const decoded = jwt.verify(sessionToken, JWT_SECRET) as { userId: string };
      return decoded.userId;
    } catch (error) {
      // Token 无效或过期，继续尝试其他方式
    }
  }

  // 尝试从 Authorization header 获取
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      return decoded.userId;
    } catch (error) {
      // Token 无效或过期
    }
  }

  return null;
}

// Work creation schema
const workCreateSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  content: z.string().max(50000).optional(),
  coverImageUrl: z.string().url().optional(),
  projectId: z.string().uuid(),
  status: z.enum(['draft', 'published', 'submitted']).optional().default('published')
})

/**
 * POST /api/works - 创建作品（学生端）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = workCreateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // 从 session 或 token 获取用户 ID
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const work = await prisma.work.create({
      data: {
        title: data.title,
        description: data.description,
        content: data.content,
        coverImageUrl: data.coverImageUrl,
        projectId: data.projectId,
        userId,
        status: data.status
      },
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
            subject: true
          }
        }
      }
    })

    return NextResponse.json({ work }, { status: 201 })
  } catch (error) {
    console.error('Error creating work:', error)
    return NextResponse.json(
      { error: 'Failed to create work' },
      { status: 500 }
    )
  }
}
