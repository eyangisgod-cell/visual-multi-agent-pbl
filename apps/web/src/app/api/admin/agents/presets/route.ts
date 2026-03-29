import { NextRequest, NextResponse } from 'next/server'
import { mentor, analyst, designer, marketer, assistant } from '@/components/avatar/presets'

const presets = [mentor, analyst, designer, marketer, assistant]

export async function GET() {
  return NextResponse.json({ presets })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // In a real implementation, this would save to database
    console.log('Saving avatar configuration:', body)
    return NextResponse.json({ success: true, config: body })
  } catch (error) {
    console.error('Error saving avatar:', error)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
