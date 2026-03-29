import { NextRequest, NextResponse } from 'next/server'
import type { AgentAvatarConfig } from '@/components/avatar/types'

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
  // Return default configuration
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

    // In a real implementation, this would save to database
    console.log('Saving avatar configuration:', body)

    return NextResponse.json({ success: true, config: body })
  } catch (error) {
    console.error('Error saving avatar:', error)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
