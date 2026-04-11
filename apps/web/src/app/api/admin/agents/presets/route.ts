import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { mentor, analyst, designer, marketer, assistant } from '@/components/avatar/presets'

const prisma = new PrismaClient()

const presets = [mentor, analyst, designer, marketer, assistant]

export async function GET() {
  try {
    // Try to get custom presets from database
    const dbPresets = await prisma.agentAvatar.findMany({
      where: {
        agentId: { startsWith: 'preset-' } as any,
      },
    })

    if (dbPresets.length > 0) {
      // Merge database presets with code presets (database takes precedence)
      const codePresetIds: string[] = presets.map(p => p.id)
      const dbPresetIds: string[] = dbPresets.map((p: any) => p.agentId.replace('preset-', ''))

      // Use code presets that don't have database overrides
      const filteredPresets = presets.filter(p => !dbPresetIds.includes(p.id))

      return NextResponse.json({
        presets: [
          ...filteredPresets,
          ...dbPresets.map((dbP: any) => ({
            id: dbP.agentId.replace('preset-', ''),
            name: dbP.agentId,
            description: 'Custom preset',
            config: {
              bodyType: dbP.bodyType,
              bodyColor: dbP.bodyColor,
              headShape: dbP.headShape,
              hairstyle: dbP.hairstyle,
              hairColor: dbP.hairColor,
              eyes: dbP.eyes,
              eyeColor: dbP.eyeColor,
              mouth: dbP.mouth,
              outfit: dbP.outfit,
              outfitColor: dbP.outfitColor,
            },
          })),
        ],
      })
    }
  } catch (error) {
    console.error('Database not available, using code presets')
  }

  // Return code presets as fallback
  return NextResponse.json({ presets })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate preset structure
    if (!body.id || !body.name || !body.config) {
      return NextResponse.json({ error: 'Invalid preset structure' }, { status: 400 })
    }

    // Try to save to database
    try {
      const preset = await prisma.agentAvatar.create({
        data: {
          agentId: `preset-${body.id}`,
          userId: null,
          bodyType: body.config.bodyType,
          bodyColor: body.config.bodyColor,
          headShape: body.config.headShape,
          hairstyle: body.config.hairstyle,
          hairColor: body.config.hairColor,
          eyes: body.config.eyes,
          eyeColor: body.config.eyeColor,
          mouth: body.config.mouth,
          outfit: body.config.outfit,
          outfitColor: body.config.outfitColor,
        },
      })

      return NextResponse.json({ success: true, preset: body }, { status: 201 })
    } catch (dbError) {
      // Database not available, return success but don't persist
      console.error('Database not available, preset not persisted:', dbError)
      return NextResponse.json({ success: true, preset: body, warning: 'Database unavailable' }, { status: 201 })
    }
  } catch (error) {
    console.error('Error saving preset:', error)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
