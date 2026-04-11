import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

const prisma = new PrismaClient()

// JWT secret - should be moved to environment variable in production
const JWT_SECRET = process.env.JWT_SECRET || 'visual-pbl-jwt-secret-key-change-in-production'
const JWT_EXPIRES_IN = '7d'

// Login schema with Zod validation
const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100)
})

// Generate session token with crypto random component
function generateSessionToken(): string {
  const randomBytes = require('crypto').randomBytes(32).toString('hex');
  return jwt.sign(
    { type: 'session', random: randomBytes },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = loginSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { username, password } = validationResult.data

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user || !user.password_hash) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash)

    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    // Create session in database with retry logic for token collision
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Clean up expired sessions for this user first
    await prisma.session.deleteMany({
      where: {
        userId: user.id,
        expires_at: {
          lt: new Date()
        }
      }
    })

    // Also clean up any existing sessions for this user to prevent token collision
    await prisma.session.deleteMany({
      where: {
        userId: user.id
      }
    })

    // Create new session with retry logic
    let sessionToken: string = ''
    let session
    let attempts = 0
    const maxAttempts = 3

    while (attempts < maxAttempts) {
      try {
        sessionToken = generateSessionToken()
        session = await prisma.session.create({
          data: {
            userId: user.id,
            token: sessionToken,
            expires_at: expiresAt
          }
        })
        break
      } catch (createError: any) {
        // If unique constraint violation, retry with new token
        if (createError?.code === 'P2002' && createError?.meta?.target?.includes('token')) {
          attempts++
          if (attempts === maxAttempts) {
            throw createError
          }
          continue
        }
        throw createError
      }
    }

    // Create response with cookie
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        grade: user.grade,
        invitationCode: user.invitationCode
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
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
