// Mock Next.js server
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
      ok: !(init?.status && init.status >= 400),
    })),
  },
}))

// Mock Prisma
const mockPrisma = {
  userAgent: {
    count: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn(),
  },
  conversation: {
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  agent: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
}

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}))

// Import after mocks
import { GET } from './route'
import { NextRequest } from 'next/server'

describe('GET /api/admin/analytics/agents', () => {
  const createMockRequest = (url: string) => {
    return {
      url,
      headers: new Headers(),
    } as unknown as NextRequest
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return agent usage statistics', async () => {
    const mockAgentUsage = [
      { agentId: 'agent-1', _count: 100 },
      { agentId: 'agent-2', _count: 80 },
      { agentId: 'agent-3', _count: 60 },
    ]

    mockPrisma.userAgent.count.mockResolvedValue(240)
    mockPrisma.conversation.count.mockResolvedValue(90)
    // First call for topAgents, second call for agentTypeUsage
    mockPrisma.userAgent.groupBy
      .mockResolvedValueOnce(mockAgentUsage)
      .mockResolvedValueOnce(mockAgentUsage)
    mockPrisma.agent.findMany.mockResolvedValue([
      { id: 'agent-1', name: 'Agent 1', agentType: 'tutor' },
      { id: 'agent-2', name: 'Agent 2', agentType: 'mentor' },
      { id: 'agent-3', name: 'Agent 3', agentType: 'evaluator' },
    ])
    mockPrisma.agent.findUnique.mockResolvedValue({ name: 'Test Agent', agentType: 'tutor' })
    mockPrisma.conversation.groupBy.mockResolvedValue([])

    const request = createMockRequest('http://localhost:3000/api/admin/analytics/agents')
    const response = await GET(request as NextRequest)
    const data = await (response as any).json()

    expect((response as any).status).toBe(200)
    expect(data.totalAgentUsage).toBe(240)
    expect(data.totalConversations).toBe(90)
    expect(data.topAgents).toBeDefined()
  })

  it('should return agent usage by type', async () => {
    mockPrisma.userAgent.count.mockResolvedValue(240)
    mockPrisma.conversation.count.mockResolvedValue(90)
    mockPrisma.userAgent.groupBy.mockResolvedValue([])
    mockPrisma.agent.findMany.mockResolvedValue([])
    mockPrisma.conversation.groupBy.mockResolvedValue([])

    const request = createMockRequest('http://localhost:3000/api/admin/analytics/agents')
    const response = await GET(request as NextRequest)
    await (response as any).json()

    expect(mockPrisma.userAgent.groupBy).toHaveBeenCalled()
  })

  it('should return 500 on database error', async () => {
    mockPrisma.userAgent.count.mockRejectedValue(new Error('Database error'))

    const request = createMockRequest('http://localhost:3000/api/admin/analytics/agents')
    const response = await GET(request as NextRequest)
    const data = await (response as any).json()

    expect((response as any).status).toBe(500)
    expect(data.error).toBe('获取智能体使用统计失败')
  })
})
