import { NextRequest } from 'next/server'

// Use globalThis to share mock between factory and tests
// (avoids jest.mock hoisting issues)

jest.mock('@prisma/client', () => {
  const shared = {
    projectTask: { findMany: jest.fn(), create: jest.fn() },
    project: { findUnique: jest.fn() },
  }
  // Store globally for test access
  ;(globalThis as any).__PRISMA_MOCK = shared
  return {
    PrismaClient: jest.fn(() => shared),
  }
})

import { GET, POST } from './route'

const mock = (globalThis as any).__PRISMA_MOCK as {
  projectTask: { findMany: jest.Mock; create: jest.Mock }
  project: { findUnique: jest.Mock }
}

const createMockRequest = (
  searchParams: Record<string, string> = {},
  body?: Record<string, unknown>
) => {
  const params = new URLSearchParams(searchParams)
  return {
    nextUrl: { searchParams: params },
    json: async () => body,
  } as unknown as NextRequest
}

describe('GET /api/tasks', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should fetch all tasks', async () => {
    mock.projectTask.findMany.mockResolvedValue([])
    const response = await GET(createMockRequest())
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.tasks).toEqual([])
  })

  it('should filter by projectId', async () => {
    mock.projectTask.findMany.mockResolvedValue([])
    await GET(createMockRequest({ projectId: 'p-123' }))
    expect(mock.projectTask.findMany).toHaveBeenCalled()
  })

  it('should filter by status', async () => {
    mock.projectTask.findMany.mockResolvedValue([])
    await GET(createMockRequest({ status: 'in_progress' }))
    expect(mock.projectTask.findMany).toHaveBeenCalled()
  })

  it('should filter by agentType', async () => {
    mock.projectTask.findMany.mockResolvedValue([])
    await GET(createMockRequest({ agentType: 'guide' }))
    expect(mock.projectTask.findMany).toHaveBeenCalled()
  })
})

describe('POST /api/tasks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(global, 'fetch' as never).mockResolvedValue(
      new Response(null, { status: 200 }) as never
    )
  })

  afterEach(() => jest.restoreAllMocks())

  it('should reject without projectId', async () => {
    const response = await POST(createMockRequest({}, { title: 'T', orderIndex: 0 }))
    const data = await response.json()
    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid input')
  })

  it('should reject without title', async () => {
    const response = await POST(createMockRequest({}, { projectId: 'p', orderIndex: 0 }))
    const data = await response.json()
    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid input')
  })

  it('should reject if project not found', async () => {
    mock.project.findUnique.mockResolvedValue(null)
    const response = await POST(createMockRequest({}, {
      projectId: '00000000-0000-0000-0000-000000000001', title: 'T', orderIndex: 0,
    }))
    const data = await response.json()
    expect(response.status).toBe(404)
    expect(data.error).toBe('Project not found')
  })

  it('should create task successfully', async () => {
    const task = {
      id: '00000000-0000-0000-0000-000000000010',
      projectId: '00000000-0000-0000-0000-000000000001',
      title: 'New Task',
      description: null, orderIndex: 0, agentType: null,
      assignedTo: null, dueDate: null, status: 'todo',
      createdAt: new Date(), updatedAt: new Date(),
      project: { id: '00000000-0000-0000-0000-000000000001', title: 'P' },
      assignedUser: null,
    }
    mock.project.findUnique.mockResolvedValue({ id: '00000000-0000-0000-0000-000000000001' })
    mock.projectTask.create.mockResolvedValue(task)

    const response = await POST(createMockRequest({}, {
      projectId: '00000000-0000-0000-0000-000000000001', title: 'New Task', orderIndex: 0,
    }))
    const data = await response.json()
    expect(response.status).toBe(201)
    expect(data.task.title).toBe('New Task')
    expect(data.task.status).toBe('todo')
  })

  it('should launch AI agent when agentType is specified', async () => {
    const task = {
      id: '00000000-0000-0000-0000-000000000010',
      projectId: '00000000-0000-0000-0000-000000000001',
      title: 'Agent Task',
      description: 'Desc', orderIndex: 0, agentType: 'guide',
      assignedTo: null, dueDate: null, status: 'todo',
      createdAt: new Date(), updatedAt: new Date(),
      project: { id: '00000000-0000-0000-0000-000000000001', title: 'P' },
      assignedUser: null,
    }
    mock.project.findUnique.mockResolvedValue({ id: '00000000-0000-0000-0000-000000000001' })
    mock.projectTask.create.mockResolvedValue(task)

    await POST(createMockRequest({}, {
      projectId: '00000000-0000-0000-0000-000000000001',
      title: 'Agent Task',
      description: 'Desc', orderIndex: 0, agentType: 'guide',
    }))

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/agents/launch'),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType: 'guide',
          taskId: '00000000-0000-0000-0000-000000000010',
          taskTitle: 'Agent Task', taskDescription: 'Desc',
        }),
      }
    )
  })

  it('should not launch AI agent without agentType', async () => {
    mock.project.findUnique.mockResolvedValue({ id: '00000000-0000-0000-0000-000000000001' })
    mock.projectTask.create.mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000010',
      projectId: '00000000-0000-0000-0000-000000000001',
      title: 'Simple',
      orderIndex: 0, agentType: null, status: 'todo',
      project: { id: '00000000-0000-0000-0000-000000000001', title: 'P' },
      assignedUser: null,
    })

    await POST(createMockRequest({}, {
      projectId: '00000000-0000-0000-0000-000000000001',
      title: 'Simple', orderIndex: 0,
    }))

    expect(global.fetch).not.toHaveBeenCalled()
  })
})
