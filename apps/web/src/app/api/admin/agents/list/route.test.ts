// Mock Prisma - MUST be before importing the route
const mockPrisma = {
  agent: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  }
}
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}))

// Import after mocks
import { GET } from './route'
import { NextRequest } from 'next/server'

describe('GET /api/admin/agents/list', () => {
  const createMockRequest = (url: string) => {
    return {
      url,
      headers: new Headers()
    } as unknown as NextRequest
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return success with agents list', async () => {
    const mockAgents = [
      {
        id: 'agent-1',
        name: '导师智能体',
        agentType: 'mentor',
        description: '帮助学生制定学习计划，提供学习指导和反馈',
        avatarUrl: '/avatars/mentor.png',
        isPlatform: true,
        is_active: true,
        createdAt: new Date('2026-04-10'),
      },
      {
        id: 'agent-2',
        name: '分析师智能体',
        agentType: 'analyst',
        description: '分析项目数据，提供洞察和建议',
        avatarUrl: '/avatars/analyst.png',
        isPlatform: true,
        is_active: true,
        createdAt: new Date('2026-04-11'),
      },
    ]

    mockPrisma.agent.findMany.mockResolvedValue(mockAgents)

    const request = createMockRequest('http://localhost:3000/api/admin/agents/list')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.agents).toHaveLength(2)
    expect(data.agents[0].id).toBe('agent-1')
    expect(data.agents[0].name).toBe('导师智能体')
    expect(data.agents[0].role).toBe('mentor')
  })

  it('should only return active agents', async () => {
    const mockAgents = [
      {
        id: 'agent-1',
        name: 'Active Agent',
        agentType: 'mentor',
        description: 'An active agent',
        avatarUrl: '/avatars/agent1.png',
        isPlatform: true,
        is_active: true,
        createdAt: new Date(),
      },
    ]

    mockPrisma.agent.findMany.mockResolvedValue(mockAgents)

    const request = createMockRequest('http://localhost:3000/api/admin/agents/list')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.agents).toHaveLength(1)
    expect(data.agents[0].status).toBe('available')
  })

  it('should handle agents without avatarUrl', async () => {
    const mockAgents = [
      {
        id: 'agent-3',
        name: 'Agent Without Avatar',
        agentType: 'assistant',
        description: 'No avatar',
        avatarUrl: null,
        isPlatform: false,
        is_active: true,
        createdAt: new Date(),
      },
    ]

    mockPrisma.agent.findMany.mockResolvedValue(mockAgents)

    const request = createMockRequest('http://localhost:3000/api/admin/agents/list')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.agents[0].avatarUrl).toBe('/avatars/default.png')
  })

  it('should return empty array when no agents exist', async () => {
    mockPrisma.agent.findMany.mockResolvedValue([])

    const request = createMockRequest('http://localhost:3000/api/admin/agents/list')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.agents).toEqual([])
  })

  it('should return 500 on database error', async () => {
    mockPrisma.agent.findMany.mockRejectedValue(new Error('Database connection failed'))

    const request = createMockRequest('http://localhost:3000/api/admin/agents/list')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('获取智能体列表失败')
  })
})
