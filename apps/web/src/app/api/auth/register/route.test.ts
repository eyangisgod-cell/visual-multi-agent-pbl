import { POST } from './route'
import { NextRequest } from 'next/server'

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn()
  }
}
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}))

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password')
}))

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockRequest = (body: Record<string, unknown>) => {
    return {
      json: async () => body
    } as unknown as NextRequest
  }

  it('should reject invalid username (too short)', async () => {
    const request = createMockRequest({ username: 'ab', password: 'password123' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid input')
  })

  it('should reject invalid username (special characters)', async () => {
    const request = createMockRequest({ username: 'user@name', password: 'password123' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid input')
  })

  it('should reject invalid password (too short)', async () => {
    const request = createMockRequest({ username: 'testuser', password: '12345' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid input')
  })

  it('should reject duplicate username', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: '1',
      username: 'existinguser'
    })

    const request = createMockRequest({ username: 'existinguser', password: 'password123' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error).toBe('Username already exists')
  })

  it('should reject invalid invitation code', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.user.findUnique.mockResolvedValueOnce(null) // First call for username check

    const request = createMockRequest({
      username: 'newuser',
      password: 'password123',
      invitationCode: 'invalid12' // Must be 10 characters
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid input')
  })

  it('should create user successfully', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-123',
      username: 'newuser',
      nickname: 'Test User',
      grade: 5,
      invitationCode: 'ABCD1234',
      createdAt: new Date()
    })

    const request = createMockRequest({
      username: 'newuser',
      password: 'password123',
      nickname: 'Test User',
      grade: 5
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.message).toBe('Registration successful')
    expect(data.user).toBeDefined()
    expect(data.user.id).toBe('user-123')
  })

  it('should create user with valid invitation code', async () => {
    mockPrisma.user.findUnique
      .mockResolvedValueOnce(null) // Username check
      .mockResolvedValueOnce({ id: 'inviter-123' }) // Invitation code check

    mockPrisma.user.create.mockResolvedValue({
      id: 'user-123',
      username: 'newuser',
      nickname: null,
      grade: null,
      invitationCode: 'EFGH5678',
      createdAt: new Date()
    })

    const request = createMockRequest({
      username: 'newuser',
      password: 'password123',
      invitationCode: 'VALID12345'
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.message).toBe('Registration successful')
  })
})
