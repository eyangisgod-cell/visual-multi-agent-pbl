import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import type { AgentAvatarConfig } from '@/components/avatar/types'

const prisma = new PrismaClient()

// Simple validation for avatar config
function isValidAvatarConfig(config: Partial<AgentAvatarConfig>): config is AgentAvatarConfig {
  return (
    typeof config.bodyType === 'string' &&
    typeof config.bodyColor === 'string' &&
    typeof config.headShape === 'string' &&
    typeof config.hairstyle === 'string' &&
    typeof config.hairColor === 'string' &&
    typeof config.eyes === 'string' &&
    typeof config.eyeColor === 'string' &&
    typeof config.mouth === 'string' &&
    typeof config.outfit === 'string' &&
    typeof config.outfitColor === 'string'
  )
}

export async function GET() {
  try {
    // Try to get default configuration from database
    const avatar = await prisma.agentAvatar.findFirst({
      where: { agentId: 'default', userId: null },
    })

    if (avatar) {
      return NextResponse.json({
        config: {
          bodyType: avatar.bodyType,
          bodyColor: avatar.bodyColor,
          headShape: avatar.headShape,
          hairstyle: avatar.hairstyle,
          hairColor: avatar.hairColor,
          eyes: avatar.eyes,
          eyeColor: avatar.eyeColor,
          mouth: avatar.mouth,
          outfit: avatar.outfit,
          outfitColor: avatar.outfitColor,
        },
      })
    }
  } catch (error) {
    console.error('Database not available, using default config')
  }

  // Return default configuration as fallback
  return NextResponse.json({
    config: {
      bodyType: 'average',
      bodyColor: '#4f46e5',
      headShape: 'oval',
      hairstyle: 'short',
      hairColor: '#4b5563',
      eyes: 'almond',
      eyeColor: '#1e40af',
      mouth: 'smile',
      outfit: 'academic',
      outfitColor: '#6366f1',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!isValidAvatarConfig(body)) {
      return NextResponse.json({ error: 'Invalid avatar configuration' }, { status: 400 })
    }

    // Try to save to database
    try {
      const avatar = await prisma.agentAvatar.upsert({
        where: {
          agentId_userId: {
            agentId: 'default',
            userId: '',
          },
        },
        update: {
          bodyType: body.bodyType,
          bodyColor: body.bodyColor,
          headShape: body.headShape,
          hairstyle: body.hairstyle,
          hairColor: body.hairColor,
          eyes: body.eyes,
          eyeColor: body.eyeColor,
          mouth: body.mouth,
          outfit: body.outfit,
          outfitColor: body.outfitColor,
        },
        create: {
          agentId: 'default',
          userId: '',
          bodyType: body.bodyType,
          bodyColor: body.bodyColor,
          headShape: body.headShape,
          hairstyle: body.hairstyle,
          hairColor: body.hairColor,
          eyes: body.eyes,
          eyeColor: body.eyeColor,
          mouth: body.mouth,
          outfit: body.outfit,
          outfitColor: body.outfitColor,
        },
      })

      return NextResponse.json({ success: true, config: body })
    } catch (dbError) {
      // Database not available, return success but don't persist
      console.error('Database not available, config not persisted:', dbError)
      return NextResponse.json({ success: true, config: body, warning: 'Database unavailable' })
    }
  } catch (error) {
    console.error('Error saving avatar:', error)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
