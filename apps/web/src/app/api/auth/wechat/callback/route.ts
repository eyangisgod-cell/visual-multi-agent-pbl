import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

const prisma = new PrismaClient()

// JWT secret - should be moved to environment variable in production
const JWT_SECRET = process.env.JWT_SECRET || 'visual-pbl-jwt-secret-key-change-in-production'
const JWT_EXPIRES_IN = '7d'

// Generate session token
function generateSessionToken(): string {
  const randomBytes = require('crypto').randomBytes(32).toString('hex')
  return jwt.sign(
    { type: 'session', random: randomBytes },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

// Schema for wechat callback
const wechatCallbackSchema = z.object({
  sessionKey: z.string(),
  code: z.string(),
  wechatUserInfo: z.object({
    openid: z.string(),
    unionid: z.string().optional(),
    nickname: z.string().optional(),
    headimgurl: z.string().optional(),
    sex: z.number().optional(),
    language: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
    country: z.string().optional()
  }).optional()
})

// Schema for wechat bind
const wechatBindSchema = z.object({
  wechatCode: z.string(),
  wechatUserInfo: z.object({
    openid: z.string(),
    unionid: z.string().optional(),
    nickname: z.string().optional(),
    headimgurl: z.string().optional(),
    sex: z.number().optional(),
    language: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
    country: z.string().optional()
  })
})

// Get current user from JWT token
async function getCurrentUser(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    return await prisma.user.findUnique({
      where: { id: decoded.userId }
    })
  } catch {
    return null
  }
}

// Generate unique username for wechat user
function generateWechatUsername(openid: string): string {
  return `wechat_${openid.substring(0, 16)}`
}

// Generate random invitation code
function generateInvitationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// POST /api/auth/wechat/callback - Handle WeChat OAuth callback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request
    const validationResult = wechatCallbackSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { sessionKey, code, wechatUserInfo } = validationResult.data

    // Verify session
    const session = await prisma.wechatLoginSession.findUnique({
      where: { sessionKey }
    })

    if (!session || session.status === 'expired' || session.status === 'used') {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 400 }
      )
    }

    if (new Date() > session.expiresAt) {
      // Mark session as expired
      await prisma.wechatLoginSession.update({
        where: { sessionKey },
        data: { status: 'expired' }
      })
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 400 }
      )
    }

    if (!wechatUserInfo) {
      return NextResponse.json(
        { error: 'WeChat user info required' },
        { status: 400 }
      )
    }

    const { openid, unionid, nickname, headimgurl, sex, language, city, province, country } = wechatUserInfo

    // Check if WeChat account is already bound
    const existingBinding = await prisma.wechatBinding.findUnique({
      where: { wechatOpenid: openid }
    })

    let user
    if (existingBinding) {
      // Existing user - login
      user = await prisma.user.findUnique({
        where: { id: existingBinding.userId }
      })

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      // Update last login time
      await prisma.wechatBinding.update({
        where: { id: existingBinding.id },
        data: {
          lastLoginAt: new Date(),
          wechatUnionid: unionid || existingBinding.wechatUnionid,
          nickname: nickname || existingBinding.nickname,
          avatarUrl: headimgurl || existingBinding.avatarUrl
        }
      })
    } else {
      // New user - create account
      const username = generateWechatUsername(openid)
      const invitationCode = generateInvitationCode()

      user = await prisma.user.create({
        data: {
          username,
          nickname: nickname || `微信用户${openid.substring(0, 6)}`,
          avatar_url: headimgurl,
          grade: null,
          invitationCode,
          role: 'USER'
        }
      })

      // Create WeChat binding
      await prisma.wechatBinding.create({
        data: {
          userId: user.id,
          wechatOpenid: openid,
          wechatUnionid: unionid,
          nickname,
          avatarUrl: headimgurl,
          gender: sex,
          language,
          city,
          province,
          country
        }
      })
    }

    // Update session status
    await prisma.wechatLoginSession.update({
      where: { sessionKey },
      data: {
        status: 'used',
        wechatOpenid: openid
      }
    })

    // Clean up expired sessions
    await prisma.wechatLoginSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    })

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    // Create session in database
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await prisma.session.deleteMany({
      where: {
        userId: user.id
      }
    })

    const sessionToken = generateSessionToken()
    await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expires_at: expiresAt
      }
    })

    // Create response with cookie
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        grade: user.grade,
        invitationCode: user.invitationCode,
        avatarUrl: user.avatar_url
      },
      token
    })

    // Set HTTP-only cookie for session
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })

    return response
  } catch (error) {
    console.error('WeChat callback error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/auth/wechat/callback - Bind WeChat account to existing user
export async function PUT(request: NextRequest) {
  try {
    // Get auth token from header
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await getCurrentUser(authToken)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validationResult = wechatBindSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { wechatUserInfo } = validationResult.data
    const { openid, unionid, nickname, headimgurl, sex, language, city, province, country } = wechatUserInfo

    // Check if WeChat is already bound
    const existingBinding = await prisma.wechatBinding.findUnique({
      where: { wechatOpenid: openid }
    })

    if (existingBinding && existingBinding.userId !== user.id) {
      return NextResponse.json(
        { error: 'This WeChat account is already bound to another user' },
        { status: 400 }
      )
    }

    if (existingBinding && existingBinding.userId === user.id) {
      return NextResponse.json(
        { message: 'WeChat account already bound' },
        { status: 200 }
      )
    }

    // Create binding
    await prisma.wechatBinding.create({
      data: {
        userId: user.id,
        wechatOpenid: openid,
        wechatUnionid: unionid,
        nickname,
        avatarUrl: headimgurl,
        gender: sex,
        language,
        city,
        province,
        country
      }
    })

    return NextResponse.json({
      message: 'WeChat account bound successfully',
      binding: {
        openid,
        nickname,
        avatarUrl: headimgurl
      }
    })
  } catch (error) {
    console.error('WeChat bind error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
