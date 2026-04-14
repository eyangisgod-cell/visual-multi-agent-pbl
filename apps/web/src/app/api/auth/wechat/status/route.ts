import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

// JWT secret
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

// GET /api/auth/wechat/status - Check login status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sessionKey = searchParams.get('sessionKey')

    if (!sessionKey) {
      return NextResponse.json(
        { error: 'Session key required' },
        { status: 400 }
      )
    }

    // Get session
    const session = await prisma.wechatLoginSession.findUnique({
      where: { sessionKey }
    })

    if (!session) {
      return NextResponse.json(
        { status: 'invalid', error: 'Session not found' },
        { status: 404 }
      )
    }

    // Check if expired
    if (new Date() > session.expiresAt || session.status === 'expired') {
      return NextResponse.json({
        status: 'expired'
      })
    }

    // Check if confirmed (login completed)
    if (session.status === 'used' && session.wechatOpenid) {
      // Find the WeChat binding
      const binding = await prisma.wechatBinding.findUnique({
        where: { wechatOpenid: session.wechatOpenid }
      })

      if (binding) {
        // Find the user
        const user = await prisma.user.findUnique({
          where: { id: binding.userId }
        })

        if (user) {
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

          return NextResponse.json({
            status: 'confirmed',
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
        }
      }
    }

    // Still pending or scanned
    return NextResponse.json({
      status: session.status,
      message: session.status === 'scanned' ? 'Please confirm on your device' : 'Waiting for scan'
    })
  } catch (error) {
    console.error('WeChat status check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
