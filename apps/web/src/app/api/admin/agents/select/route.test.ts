// Mock Prisma - MUST be before importing the route
const mockPrisma = {
  agent: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  projectTask: {
    findFirst: jest.fn(),
  },
  userAgent: {
    findFirst: jest.fn(),
  }
}
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}))

// Import after mocks
import { GET, POST } from './route'
import { NextRequest } from 'next/server'

describe('POST /api/admin/agents/select', () => {
  const createMockRequest = (body: Record<string, unknown>, url: string) => {
    return {
      url,
      json: async () => body,
      headers: new Headers()
    } as unknown as NextRequest
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 400 if agentId is missing', async () => {
    const request = createMockRequest({}, 'http://localhost:3000/api/admin/agents/select')
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.message).toBe('智能体 ID 不能为空')
  })

  it('should return 404 if agent does not exist', async () => {
    mockPrisma.agent.findUnique.mockResolvedValue(null)

    const request = createMockRequest({ agentId: 'non-existent-id' }, 'http://localhost:3000/api/admin/agents/select')
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.message).toBe('智能体不存在')
  })

  it('should select agent successfully', async () => {
    const mockAgent = {
      id: 'agent-1',
      name: '导师智能体',
      agentType: 'mentor',
      description: '帮助学生制定学习计划',
      avatarUrl: '/avatars/mentor.png',
      is_active: true,
    }

    mockPrisma.agent.findUnique.mockResolvedValue(mockAgent)

    const request = createMockRequest({ agentId: 'agent-1' }, 'http://localhost:3000/api/admin/agents/select')
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('智能体选择成功')
    expect(data.agent?.id).toBe('agent-1')
    expect(data.agent?.name).toBe('导师智能体')
  })

  it('should handle optional projectId', async () => {
    const mockAgent = {
      id: 'agent-1',
      name: '导师智能体',
      agentType: 'mentor',
      description: null,
      avatarUrl: null,
      is_active: true,
    }

    mockPrisma.agent.findUnique.mockResolvedValue(mockAgent)

    const request = createMockRequest({ agentId: 'agent-1', projectId: 'project-123' }, 'http://localhost:3000/api/admin/agents/select')
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.agent?.avatarUrl).toBe('/avatars/default.png')
  })

  it('should return 500 on database error', async () => {
    mockPrisma.agent.findUnique.mockRejectedValue(new Error('Database error'))

    const request = createMockRequest({ agentId: 'agent-1' }, 'http://localhost:3000/api/admin/agents/select')
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.message).toBe('选择智能体失败')
  })
})

describe('GET /api/admin/agents/select', () => {
  const createMockRequest = (url: string) => {
    return {
      url,
      headers: new Headers()
    } as unknown as NextRequest
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 400 if both projectId and userId are missing', async () => {
    const request = createMockRequest('http://localhost:3000/api/admin/agents/select')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.message).toContain('项目 ID 或用户 ID 不能为空')
  })

  it('should return null agent if no selection found for projectId', async () => {
    mockPrisma.projectTask.findFirst.mockResolvedValue(null)

    const request = createMockRequest('http://localhost:3000/api/admin/agents/select?projectId=project-123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.agent).toBeNull()
  })

  it('should return selected agent for projectId', async () => {
    const mockProjectTask = {
      agentType: 'mentor',
    }

    const mockAgent = {
      id: 'agent-1',
      name: '导师智能体',
      agentType: 'mentor',
      description: '帮助学生制定学习计划',
      avatarUrl: '/avatars/mentor.png',
    }

    mockPrisma.projectTask.findFirst.mockResolvedValue(mockProjectTask)
    mockPrisma.agent.findFirst.mockResolvedValue(mockAgent)

    const request = createMockRequest('http://localhost:3000/api/admin/agents/select?projectId=project-123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.agent?.id).toBe('agent-1')
    expect(data.agent?.role).toBe('mentor')
  })

  it('should return null agent if no selection found for userId', async () => {
    mockPrisma.userAgent.findFirst.mockResolvedValue(null)

    const request = createMockRequest('http://localhost:3000/api/admin/agents/select?userId=user-123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.agent).toBeNull()
  })

  it('should return selected agent for userId', async () => {
    const mockUserAgent = {
      agent: {
        id: 'agent-2',
        name: '分析师智能体',
        agentType: 'analyst',
        description: '数据分析',
        avatarUrl: '/avatars/analyst.png',
      }
    }

    mockPrisma.userAgent.findFirst.mockResolvedValue(mockUserAgent)

    const request = createMockRequest('http://localhost:3000/api/admin/agents/select?userId=user-123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.agent?.id).toBe('agent-2')
    expect(data.agent?.name).toBe('分析师智能体')
  })

  it('should return 500 on database error', async () => {
    mockPrisma.projectTask.findFirst.mockRejectedValue(new Error('Database error'))

    const request = createMockRequest('http://localhost:3000/api/admin/agents/select?projectId=project-123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.message).toBe('获取已选智能体失败')
  })
})
