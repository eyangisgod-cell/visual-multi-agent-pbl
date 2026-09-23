import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const prisma = new PrismaClient()

// Registration schema with Zod validation
const registerSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string().min(6).max(100),
  nickname: z.string().min(1).max(50).optional(),
  grade: z.number().min(1).max(12).optional(),
  invitationCode: z.string().length(10).optional().nullable()
})

// Generate unique invitation code (8 characters alphanumeric)
function generateInvitationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = registerSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { username, password, nickname, grade, invitationCode } = validationResult.data

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      )
    }

    // Validate invitation code if provided
    let inviterId: string | null = null
    if (invitationCode) {
      const inviter = await prisma.user.findUnique({
        where: { invitation_code: invitationCode }
      })

      if (!inviter) {
        return NextResponse.json(
          { error: 'Invalid invitation code' },
          { status: 400 }
        )
      }
      inviterId = inviter.id
    }

    // Hash password
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Generate unique invitation code for new user
    let newInvitationCode = generateInvitationCode()

    // Ensure uniqueness
    while (true) {
      const existing = await prisma.user.findUnique({
        where: { invitation_code: newInvitationCode }
      })
      if (!existing) break
      newInvitationCode = generateInvitationCode()
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        password_hash: passwordHash,
        nickname: nickname || null,
        grade: grade || null,
        invitation_code: newInvitationCode,
        invited_by: inviterId
      },
      select: {
        id: true,
        username: true,
        nickname: true,
        grade: true,
        invitation_code: true,
        created_at: true
      }
    })

    return NextResponse.json(
      {
        message: 'Registration successful',
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          grade: user.grade,
          invitationCode: user.invitation_code,
          createdAt: user.created_at
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
