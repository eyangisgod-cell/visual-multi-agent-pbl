import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

// WeChat OAuth config (should be moved to environment variables in production)
const WECHAT_APP_ID = process.env.WECHAT_APP_ID || ''
const WECHAT_APP_SECRET = process.env.WECHAT_APP_SECRET || ''

// Generate unique session key
function generateSessionKey(): string {
  return `wx_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`
}

// GET /api/auth/wechat/login - Get QR code URL for WeChat login
export async function GET(request: NextRequest) {
  try {
    // Get or create WeChat config
    let wechatConfig = await prisma.wechatConfig.findFirst({
      where: { isActive: true }
    })

    if (!wechatConfig) {
      // Use environment variables if no config in database
      if (!WECHAT_APP_ID || !WECHAT_APP_SECRET) {
        return NextResponse.json(
          { error: 'WeChat OAuth not configured. Please contact administrator.' },
          { status: 400 }
        )
      }
      wechatConfig = {
        appId: WECHAT_APP_ID,
        appSecret: WECHAT_APP_SECRET
      } as any
    }

    // Create login session
    const sessionKey = generateSessionKey()
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 5) // 5 minutes expiry

    await prisma.wechatLoginSession.create({
      data: {
        sessionKey,
        status: 'pending',
        expiresAt
      }
    })

    // Build QR code URL
    // For website OAuth, we use WeChat Open Platform's OAuth URL
    const redirectUri = encodeURIComponent(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/wechat/callback`)
    const qrCodeUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=${wechatConfig.appId}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_login&state=${sessionKey}#wechat_redirect`

    return NextResponse.json({
      sessionKey,
      qrCodeUrl,
      expiresIn: 300 // 5 minutes in seconds
    })
  } catch (error) {
    console.error('WeChat login GET error:', error)
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    )
  }
}
