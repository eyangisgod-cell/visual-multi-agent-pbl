// Mock Prisma - MUST be before importing the route
const mockPrisma = {
  work: {
    findUnique: jest.fn()
  },
  workReview: {
    findMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  }
}
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}))

// Mock createAuditLog
jest.mock('@/lib/audit-logger', () => ({
  createAuditLog: jest.fn(),
  extractIpAddress: jest.fn(() => '127.0.0.1'),
  extractUserAgent: jest.fn(() => 'test-agent')
}))

// Mock next/server
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200
    }))
  }
}))

// Import after mocks
import { GET, POST } from './route'
import { NextRequest } from 'next/server'

describe('GET /api/admin/works/[id]/review', () => {
  const createMockRequest = (url: string) => {
    return {
      url,
      headers: new Headers()
    } as unknown as NextRequest
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 400 if work ID is invalid', async () => {
    const request = createMockRequest('http://localhost:3000/api/admin/works/invalid-id/review')
    const response = await GET(request, { params: { id: 'invalid-id' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Invalid work ID')
  })

  it('should return 404 if work does not exist', async () => {
    mockPrisma.work.findUnique.mockResolvedValue(null)

    const workId = '550e8400-e29b-41d4-a716-446655440001'
    const request = createMockRequest(`http://localhost:3000/api/admin/works/${workId}/review`)
    const response = await GET(request, { params: { id: workId } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Work not found')
  })

  it('should return reviews for a work', async () => {
    const workId = '550e8400-e29b-41d4-a716-446655440001'
    const mockReviews = [
      {
        id: 'review-1',
        workId,
        userId: 'user-1',
        rating: 4,
        comment: 'Great work!',
        createdAt: new Date('2026-04-10'),
        updatedAt: new Date('2026-04-10'),
        user: {
          id: 'user-1',
          username: 'reviewer1',
          nickname: 'Reviewer One'
        }
      },
      {
        id: 'review-2',
        workId,
        userId: 'user-2',
        rating: 5,
        comment: 'Excellent!',
        createdAt: new Date('2026-04-11'),
        updatedAt: new Date('2026-04-11'),
        user: {
          id: 'user-2',
          username: 'reviewer2',
          nickname: 'Reviewer Two'
        }
      }
    ]

    mockPrisma.work.findUnique.mockResolvedValue({ id: workId })
    mockPrisma.workReview.findMany.mockResolvedValue(mockReviews)

    const request = createMockRequest(`http://localhost:3000/api/admin/works/${workId}/review`)
    const response = await GET(request, { params: { id: workId } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.reviews).toHaveLength(2)
    expect(data.reviews[0].id).toBe('review-1')
    expect(data.reviews[0].rating).toBe(4)
    expect(data.reviews[0].comment).toBe('Great work!')
  })

  it('should support pagination', async () => {
    const workId = '550e8400-e29b-41d4-a716-446655440002'
    const mockReviews = [
      {
        id: 'review-1',
        workId,
        userId: 'user-1',
        rating: 4,
        comment: 'Review 1',
        createdAt: new Date('2026-04-10'),
        updatedAt: new Date('2026-04-10'),
        user: { id: 'user-1', username: 'reviewer1', nickname: 'Reviewer One' }
      },
      {
        id: 'review-2',
        workId,
        userId: 'user-2',
        rating: 5,
        comment: 'Review 2',
        createdAt: new Date('2026-04-11'),
        updatedAt: new Date('2026-04-11'),
        user: { id: 'user-2', username: 'reviewer2', nickname: 'Reviewer Two' }
      }
    ]

    mockPrisma.work.findUnique.mockResolvedValue({ id: workId })
    mockPrisma.workReview.findMany.mockResolvedValue([mockReviews[0]])

    const request = createMockRequest(`http://localhost:3000/api/admin/works/${workId}/review?page=1&limit=1`)
    const response = await GET(request, { params: { id: workId } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.reviews).toHaveLength(1)
    expect(data.pagination).toBeDefined()
    expect(data.pagination.page).toBe(1)
    expect(data.pagination.limit).toBe(1)
  })

  it('should return empty array when no reviews exist', async () => {
    const workId = '550e8400-e29b-41d4-a716-446655440003'

    mockPrisma.work.findUnique.mockResolvedValue({ id: workId })
    mockPrisma.workReview.findMany.mockResolvedValue([])

    const request = createMockRequest(`http://localhost:3000/api/admin/works/${workId}/review`)
    const response = await GET(request, { params: { id: workId } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.reviews).toEqual([])
  })
})

describe('POST /api/admin/works/[id]/review', () => {
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

  const validWorkId = '550e8400-e29b-41d4-a716-446655440001'

  it('should return 400 if work ID is invalid', async () => {
    const request = createMockRequest({ userId: 'user-1', rating: 5, comment: 'Good!' }, 'http://localhost:3000/api/admin/works/invalid-id/review')
    const response = await POST(request, { params: { id: 'invalid-id' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Invalid work ID')
  })

  it('should return 404 if work does not exist', async () => {
    mockPrisma.work.findUnique.mockResolvedValue(null)

    const workId = '550e8400-e29b-41d4-a716-446655440099'
    const request = createMockRequest({ userId: 'user-1', rating: 5, comment: 'Good!' }, `http://localhost:3000/api/admin/works/${workId}/review`)
    const response = await POST(request, { params: { id: workId } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Work not found')
  })

  it('should return 400 if userId is missing', async () => {
    mockPrisma.work.findUnique.mockResolvedValue({ id: validWorkId })

    const request = createMockRequest({ rating: 5, comment: 'Good!' }, `http://localhost:3000/api/admin/works/${validWorkId}/review`)
    const response = await POST(request, { params: { id: validWorkId } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('userId and comment are required')
  })

  it('should return 400 if comment is missing', async () => {
    mockPrisma.work.findUnique.mockResolvedValue({ id: validWorkId })

    const request = createMockRequest({ userId: 'user-1', rating: 5 }, `http://localhost:3000/api/admin/works/${validWorkId}/review`)
    const response = await POST(request, { params: { id: validWorkId } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('userId and comment are required')
  })

  it('should return 400 if rating is out of range (too low)', async () => {
    mockPrisma.work.findUnique.mockResolvedValue({ id: validWorkId })

    const request = createMockRequest({ userId: 'user-1', rating: 0, comment: 'Good!' }, `http://localhost:3000/api/admin/works/${validWorkId}/review`)
    const response = await POST(request, { params: { id: validWorkId } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Rating must be between 1 and 5')
  })

  it('should return 400 if rating is out of range (too high)', async () => {
    mockPrisma.work.findUnique.mockResolvedValue({ id: validWorkId })

    const request = createMockRequest({ userId: 'user-1', rating: 6, comment: 'Good!' }, `http://localhost:3000/api/admin/works/${validWorkId}/review`)
    const response = await POST(request, { params: { id: validWorkId } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Rating must be between 1 and 5')
  })

  it('should accept rating of 1 (minimum valid)', async () => {
    mockPrisma.work.findUnique.mockResolvedValue({ id: validWorkId })
    mockPrisma.workReview.create.mockResolvedValue({
      id: 'new-review',
      workId: validWorkId,
      userId: 'user-1',
      rating: 1,
      comment: 'Needs improvement',
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const request = createMockRequest({ userId: 'user-1', rating: 1, comment: 'Needs improvement' }, `http://localhost:3000/api/admin/works/${validWorkId}/review`)
    const response = await POST(request, { params: { id: validWorkId } })
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.review.rating).toBe(1)
  })

  it('should accept rating of 5 (maximum valid)', async () => {
    mockPrisma.work.findUnique.mockResolvedValue({ id: validWorkId })
    mockPrisma.workReview.create.mockResolvedValue({
      id: 'new-review',
      workId: validWorkId,
      userId: 'user-1',
      rating: 5,
      comment: 'Excellent!',
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const request = createMockRequest({ userId: 'user-1', rating: 5, comment: 'Excellent!' }, `http://localhost:3000/api/admin/works/${validWorkId}/review`)
    const response = await POST(request, { params: { id: validWorkId } })
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.review.rating).toBe(5)
  })

  it('should accept optional rating (null)', async () => {
    mockPrisma.work.findUnique.mockResolvedValue({ id: validWorkId })
    mockPrisma.workReview.create.mockResolvedValue({
      id: 'new-review',
      workId: validWorkId,
      userId: 'user-1',
      rating: null,
      comment: 'Feedback without rating',
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const request = createMockRequest({ userId: 'user-1', comment: 'Feedback without rating' }, `http://localhost:3000/api/admin/works/${validWorkId}/review`)
    const response = await POST(request, { params: { id: validWorkId } })
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.review.rating).toBeNull()
  })

  it('should create review successfully', async () => {
    mockPrisma.work.findUnique.mockResolvedValue({ id: validWorkId })
    mockPrisma.workReview.create.mockResolvedValue({
      id: 'new-review',
      workId: validWorkId,
      userId: 'user-1',
      rating: 4,
      comment: 'Great work!',
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const request = createMockRequest({ userId: 'user-1', rating: 4, comment: 'Great work!' }, `http://localhost:3000/api/admin/works/${validWorkId}/review`)
    const response = await POST(request, { params: { id: validWorkId } })
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.review.id).toBe('new-review')
    expect(data.review.comment).toBe('Great work!')
  })
})

describe('PUT /api/admin/works/[id]/review/[reviewId]', () => {
  const { PUT } = require('./route')

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

  const validWorkId = '550e8400-e29b-41d4-a716-446655440001'
  const validReviewId = '660e8400-e29b-41d4-a716-446655440002'

  it('should return 400 if work ID is invalid', async () => {
    const request = createMockRequest({ rating: 5, comment: 'Updated!' }, 'http://localhost:3000/api/admin/works/invalid-id/review/123')
    const response = await PUT(request, { params: { id: 'invalid-id', reviewId: validReviewId } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Invalid work ID')
  })

  it('should return 400 if review ID is invalid', async () => {
    mockPrisma.work.findUnique.mockResolvedValue({ id: validWorkId })

    const request = createMockRequest({ rating: 5, comment: 'Updated!' }, `http://localhost:3000/api/admin/works/${validWorkId}/review/invalid-review-id`)
    const response = await PUT(request, { params: { id: validWorkId, reviewId: 'invalid-review-id' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Invalid review ID')
  })

  it('should return 404 if work does not exist', async () => {
    mockPrisma.work.findUnique.mockResolvedValue(null)

    const request = createMockRequest({ rating: 5, comment: 'Updated!' }, `http://localhost:3000/api/admin/works/${validWorkId}/review/${validReviewId}`)
    const response = await PUT(request, { params: { id: validWorkId, reviewId: validReviewId } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Work not found')
  })

  it('should return 404 if review does not exist', async () => {
    mockPrisma.work.findUnique.mockResolvedValue({ id: validWorkId })
    mockPrisma.workReview.findUnique.mockResolvedValue(null)

    const request = createMockRequest({ rating: 5, comment: 'Updated!' }, `http://localhost:3000/api/admin/works/${validWorkId}/review/${validReviewId}`)
    const response = await PUT(request, { params: { id: validWorkId, reviewId: validReviewId } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Review not found')
  })

  it('should return 400 if comment is missing', async () => {
    mockPrisma.work.findUnique.mockResolvedValue({ id: validWorkId })
    mockPrisma.workReview.findUnique.mockResolvedValue({ id: validReviewId, workId: validWorkId, userId: 'user-1', rating: 4, comment: 'Old comment' })

    const request = createMockRequest({ rating: 5 }, `http://localhost:3000/api/admin/works/${validWorkId}/review/${validReviewId}`)
    const response = await PUT(request, { params: { id: validWorkId, reviewId: validReviewId } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Comment is required')
  })

  it('should return 400 if rating is out of range', async () => {
    mockPrisma.work.findUnique.mockResolvedValue({ id: validWorkId })
    mockPrisma.workReview.findUnique.mockResolvedValue({ id: validReviewId, workId: validWorkId, userId: 'user-1', rating: 4, comment: 'Old comment' })

    const request = createMockRequest({ rating: 6, comment: 'Updated!' }, `http://localhost:3000/api/admin/works/${validWorkId}/review/${validReviewId}`)
    const response = await PUT(request, { params: { id: validWorkId, reviewId: validReviewId } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Rating must be between 1 and 5')
  })

  it('should update review successfully', async () => {
    mockPrisma.work.findUnique.mockResolvedValue({ id: validWorkId })
    mockPrisma.workReview.findUnique.mockResolvedValue({ id: validReviewId, workId: validWorkId, userId: 'user-1', rating: 4, comment: 'Old comment' })
    mockPrisma.workReview.update.mockResolvedValue({
      id: validReviewId,
      workId: validWorkId,
      userId: 'user-1',
      rating: 5,
      comment: 'Updated!',
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const request = createMockRequest({ rating: 5, comment: 'Updated!' }, `http://localhost:3000/api/admin/works/${validWorkId}/review/${validReviewId}`)
    const response = await PUT(request, { params: { id: validWorkId, reviewId: validReviewId } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.review.id).toBe(validReviewId)
    expect(data.review.comment).toBe('Updated!')
    expect(data.review.rating).toBe(5)
  })

  it('should update review without rating', async () => {
    mockPrisma.work.findUnique.mockResolvedValue({ id: validWorkId })
    mockPrisma.workReview.findUnique.mockResolvedValue({ id: validReviewId, workId: validWorkId, userId: 'user-1', rating: 4, comment: 'Old comment' })
    mockPrisma.workReview.update.mockResolvedValue({
      id: validReviewId,
      workId: validWorkId,
      userId: 'user-1',
      rating: null,
      comment: 'Updated without rating',
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const request = createMockRequest({ comment: 'Updated without rating' }, `http://localhost:3000/api/admin/works/${validWorkId}/review/${validReviewId}`)
    const response = await PUT(request, { params: { id: validWorkId, reviewId: validReviewId } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.review.rating).toBeNull()
  })
})

describe('DELETE /api/admin/works/[id]/review/[reviewId]', () => {
  const { DELETE } = require('./route')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validWorkId = '550e8400-e29b-41d4-a716-446655440001'
  const validReviewId = '660e8400-e29b-41d4-a716-446655440002'

  it('should return 400 if work ID is invalid', async () => {
    const response = await DELETE({} as NextRequest, { params: { id: 'invalid-id', reviewId: validReviewId } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Invalid work ID')
  })

  it('should return 400 if review ID is invalid', async () => {
    mockPrisma.work.findUnique.mockResolvedValue({ id: validWorkId })

    const response = await DELETE({} as NextRequest, { params: { id: validWorkId, reviewId: 'invalid-review-id' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Invalid review ID')
  })

  it('should return 404 if work does not exist', async () => {
    mockPrisma.work.findUnique.mockResolvedValue(null)

    const response = await DELETE({} as NextRequest, { params: { id: validWorkId, reviewId: validReviewId } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Work not found')
  })

  it('should return 404 if review does not exist', async () => {
    mockPrisma.work.findUnique.mockResolvedValue({ id: validWorkId })
    mockPrisma.workReview.findUnique.mockResolvedValue(null)

    const response = await DELETE({} as NextRequest, { params: { id: validWorkId, reviewId: validReviewId } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Review not found')
  })

  it('should delete review successfully', async () => {
    mockPrisma.work.findUnique.mockResolvedValue({ id: validWorkId })
    mockPrisma.workReview.findUnique.mockResolvedValue({ id: validReviewId, workId: validWorkId })
    mockPrisma.workReview.delete.mockResolvedValue({ id: validReviewId })

    const response = await DELETE({} as NextRequest, { params: { id: validWorkId, reviewId: validReviewId } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('Review deleted successfully')
  })
})
