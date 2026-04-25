import { GET, POST } from './route'
import { NextRequest } from 'next/server'

// Mock Prisma
const mockPrisma = {
  projectTask: {
    findMany: jest.fn(),
    create: jest.fn()
  },
  project: {
    findUnique: jest.fn()
  }
}
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}))

describe('GET /api/tasks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockRequest = (searchParams: Record<string, string> = {}) => {
    const params = new URLSearchParams(searchParams)
    return {
      nextUrl: {
        searchParams: params
      }
    } as unknown as NextRequest
  }

  it('should fetch all tasks without filters', async () => {
    mockPrisma.projectTask.findMany.mockResolvedValue([])

    const request = createMockRequest()
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.tasks).toEqual([])
    expect(mockPrisma.projectTask.findMany).toHaveBeenCalledWith({
      where: {},
      include: expect.any(Object),
      orderBy: expect.any(Array)
    })
  })

  it('should fetch tasks filtered by projectId', async () => {
    mockPrisma.projectTask.findMany.mockResolvedValue([])

    const request = createMockRequest({ projectId: 'project-123' })
    await GET(request)

    expect(mockPrisma.projectTask.findMany).toHaveBeenCalledWith({
      where: { projectId: 'project-123' },
      include: expect.any(Object),
      orderBy: expect.any(Array)
    })
  })

  it('should fetch tasks filtered by assignedTo', async () => {
    mockPrisma.projectTask.findMany.mockResolvedValue([])

    const request = createMockRequest({ assignedTo: 'user-123' })
    await GET(request)

    expect(mockPrisma.projectTask.findMany).toHaveBeenCalledWith({
      where: { assignedTo: 'user-123' },
      include: expect.any(Object),
      orderBy: expect.any(Array)
    })
  })

  it('should fetch tasks filtered by status', async () => {
    mockPrisma.projectTask.findMany.mockResolvedValue([])

    const request = createMockRequest({ status: 'in_progress' })
    await GET(request)

    expect(mockPrisma.projectTask.findMany).toHaveBeenCalledWith({
      where: { status: 'in_progress' },
      include: expect.any(Object),
      orderBy: expect.any(Array)
    })
  })

  it('should fetch tasks filtered by agentType', async () => {
    mockPrisma.projectTask.findMany.mockResolvedValue([])

    const request = createMockRequest({ agentType: 'guide' })
    await GET(request)

    expect(mockPrisma.projectTask.findMany).toHaveBeenCalledWith({
      where: { agentType: 'guide' },
      include: expect.any(Object),
      orderBy: expect.any(Array)
    })
  })

  it('should include related project and assignedUser data', async () => {
    mockPrisma.projectTask.findMany.mockResolvedValue([
      {
        id: 'task-123',
        title: 'Test Task',
        project: { id: 'project-123', title: 'Test Project' },
        assignedUser: { id: 'user-123', username: 'testuser' }
      }
    ])

    const request = createMockRequest()
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.tasks[0].project).toBeDefined()
    expect(data.tasks[0].assignedUser).toBeDefined()
  })
})

describe('POST /api/tasks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 200 }))
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const createMockRequest = (body: Record<string, unknown>) => {
    return {
      json: async () => body
    } as unknown as NextRequest
  }

  it('should reject request without projectId', async () => {
    const request = createMockRequest({ title: 'Test Task', orderIndex: 0 })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid input')
  })

  it('should reject request without title', async () => {
    const request = createMockRequest({ projectId: 'project-123', orderIndex: 0 })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid input')
  })

  it('should reject request with title too long', async () => {
    const request = createMockRequest({
      projectId: 'project-123',
      title: 'a'.repeat(256),
      orderIndex: 0
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid input')
  })

  it('should reject request with negative orderIndex', async () => {
    const request = createMockRequest({
      projectId: 'project-123',
      title: 'Test Task',
      orderIndex: -1
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid input')
  })

  it('should reject request if project not found', async () => {
    mockPrisma.project.findUnique.mockResolvedValue(null)

    const request = createMockRequest({
      projectId: 'non-existent',
      title: 'Test Task',
      orderIndex: 0
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Project not found')
  })

  it('should create task successfully with minimal data', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({ id: 'project-123' })
    mockPrisma.projectTask.create.mockResolvedValue({
      id: 'task-123',
      projectId: 'project-123',
      title: 'New Task',
      description: null,
      orderIndex: 0,
      agentType: null,
      assignedTo: null,
      dueDate: null,
      status: 'todo',
      createdAt: new Date(),
      updatedAt: new Date(),
      project: { id: 'project-123', title: 'Test Project' },
      assignedUser: null
    })

    const request = createMockRequest({
      projectId: 'project-123',
      title: 'New Task',
      orderIndex: 0
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.task).toBeDefined()
    expect(data.task.title).toBe('New Task')
    expect(data.task.status).toBe('todo')
  })

  it('should create task with all optional fields', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({ id: 'project-123' })
    mockPrisma.projectTask.create.mockResolvedValue({
      id: 'task-123',
      projectId: 'project-123',
      title: 'Advanced Task',
      description: 'Task description',
      orderIndex: 1,
      agentType: 'coach',
      assignedTo: 'user-123',
      dueDate: new Date('2026-12-31'),
      status: 'todo',
      createdAt: new Date(),
      updatedAt: new Date(),
      project: { id: 'project-123', title: 'Test Project' },
      assignedUser: { id: 'user-123', username: 'testuser', nickname: 'Test' }
    })

    const request = createMockRequest({
      projectId: 'project-123',
      title: 'Advanced Task',
      description: 'Task description',
      orderIndex: 1,
      agentType: 'coach',
      assignedTo: 'user-123',
      dueDate: '2026-12-31T00:00:00Z'
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.task).toBeDefined()
    expect(data.task.agentType).toBe('coach')
  })

  it('should launch AI agent when agentType is specified', async () => {
    const mockTask = {
      id: 'task-123',
      projectId: 'project-123',
      title: 'Agent Task',
      description: 'Task with agent',
      orderIndex: 0,
      agentType: 'guide',
      assignedTo: null,
      dueDate: null,
      status: 'todo',
      createdAt: new Date(),
      updatedAt: new Date(),
      project: { id: 'project-123', title: 'Test Project' },
      assignedUser: null
    }

    mockPrisma.project.findUnique.mockResolvedValue({ id: 'project-123' })
    mockPrisma.projectTask.create.mockResolvedValue(mockTask)

    const request = createMockRequest({
      projectId: 'project-123',
      title: 'Agent Task',
      description: 'Task with agent',
      orderIndex: 0,
      agentType: 'guide'
    })
    const response = await POST(request)

    expect(response.status).toBe(201)
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/agents/launch'),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType: 'guide',
          taskId: 'task-123',
          taskTitle: 'Agent Task',
          taskDescription: 'Task with agent'
        })
      }
    )
  })

  it('should not launch AI agent when agentType is not specified', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({ id: 'project-123' })
    mockPrisma.projectTask.create.mockResolvedValue({
      id: 'task-123',
      projectId: 'project-123',
      title: 'Simple Task',
      orderIndex: 0,
      agentType: null,
      status: 'todo',
      project: { id: 'project-123', title: 'Test Project' },
      assignedUser: null
    })

    const request = createMockRequest({
      projectId: 'project-123',
      title: 'Simple Task',
      orderIndex: 0
    })
    const response = await POST(request)

    expect(response.status).toBe(201)
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
