import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Fetch counts from database with error handling for missing tables
    const [totalProjects, totalUsers, totalAgents, activeLlmConfigs] = await Promise.all([
      prisma.project.count().catch(() => 0),
      prisma.user.count().catch(() => 0),
      prisma.agent.count().catch(() => 0),
      prisma.llmConfig.count({ where: { isActive: true } }).catch(() => 0),
    ])

    return NextResponse.json({
      totalProjects,
      totalUsers,
      totalAgents,
      activeLlmConfigs,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    // Return default values on error
    return NextResponse.json({
      totalProjects: 0,
      totalUsers: 0,
      totalAgents: 0,
      activeLlmConfigs: 0,
    })
  }
}
