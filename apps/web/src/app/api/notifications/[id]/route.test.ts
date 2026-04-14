import { NextRequest } from 'next/server'

// Mock Next.js server
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
    })),
  },
}))

// Mock Prisma
const mockPrisma = {
  notification: {
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
  },
}
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}))

// Import after mocks
const { PUT, DELETE } = require('./route')

describe('PUT /api/notifications/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockRequest = (body: Record<string, unknown>) => {
    return {
      json: async () => body,
    } as unknown as NextRequest
  }

  it('should return 404 if notification not found', async () => {
    mockPrisma.notification.findUnique.mockResolvedValue(null)

    const request = createMockRequest({ isRead: true })
    const response = await PUT(request, { params: { id: 'notif-123' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Notification not found')
  })

  it('should mark notification as read', async () => {
    mockPrisma.notification.findUnique.mockResolvedValue({ id: 'notif-123', isRead: false })
    mockPrisma.notification.update.mockResolvedValue({
      id: 'notif-123',
      isRead: true,
      readAt: new Date('2026-01-01'),
    })

    const request = createMockRequest({ isRead: true })
    const response = await PUT(request, { params: { id: 'notif-123' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.notification.isRead).toBe(true)
    expect(data.notification.readAt).toBeDefined()
    expect(mockPrisma.notification.update).toHaveBeenCalledWith({
      where: { id: 'notif-123' },
      data: {
        isRead: true,
        readAt: expect.any(Date),
      },
    })
  })

  it('should mark notification as unread', async () => {
    mockPrisma.notification.findUnique.mockResolvedValue({ id: 'notif-123', isRead: true })
    mockPrisma.notification.update.mockResolvedValue({
      id: 'notif-123',
      isRead: false,
      readAt: null,
    })

    const request = createMockRequest({ isRead: false })
    const response = await PUT(request, { params: { id: 'notif-123' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.notification.isRead).toBe(false)
    expect(data.notification.readAt).toBe(null)
  })

  it('should update notification title', async () => {
    mockPrisma.notification.findUnique.mockResolvedValue({ id: 'notif-123' })
    mockPrisma.notification.update.mockResolvedValue({
      id: 'notif-123',
      title: 'Updated Title',
    })

    const request = createMockRequest({ title: 'Updated Title' })
    const response = await PUT(request, { params: { id: 'notif-123' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.notification.title).toBe('Updated Title')
  })

  it('should update multiple fields at once', async () => {
    mockPrisma.notification.findUnique.mockResolvedValue({ id: 'notif-123' })
    mockPrisma.notification.update.mockResolvedValue({
      id: 'notif-123',
      title: 'Updated Title',
      content: 'Updated content',
      isRead: true,
      readAt: new Date(),
    })

    const request = createMockRequest({
      title: 'Updated Title',
      content: 'Updated content',
      isRead: true,
    })
    const response = await PUT(request, { params: { id: 'notif-123' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.notification.title).toBe('Updated Title')
    expect(data.notification.content).toBe('Updated content')
    expect(data.notification.isRead).toBe(true)
  })
})

describe('DELETE /api/notifications/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 404 if notification not found', async () => {
    mockPrisma.notification.findUnique.mockResolvedValue(null)

    const request = {} as NextRequest
    const response = await DELETE(request, { params: { id: 'notif-123' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Notification not found')
  })

  it('should delete notification successfully', async () => {
    mockPrisma.notification.findUnique.mockResolvedValue({ id: 'notif-123' })
    mockPrisma.notification.delete.mockResolvedValue({ id: 'notif-123' })

    const request = {} as NextRequest
    const response = await DELETE(request, { params: { id: 'notif-123' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('Notification deleted successfully')
    expect(mockPrisma.notification.delete).toHaveBeenCalledWith({
      where: { id: 'notif-123' },
    })
  })
})
