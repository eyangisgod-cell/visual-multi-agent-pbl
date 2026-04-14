/**
 * @jest-environment node
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  pointsLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  userLevel: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn((fn) => fn(mockPrisma)),
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

// Mock pointsService
const mockAddPoints = jest.fn();
const mockDeductPoints = jest.fn();

jest.mock('@/lib/pointsService', () => ({
  getUserPoints: jest.fn(),
  getUserPointsLog: jest.fn(),
  addPoints: mockAddPoints,
  deductPoints: mockDeductPoints,
}));

describe('Points API', () => {
  let GET: any;
  let POST: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();

    const route = await require('./route');
    GET = route.GET;
    POST = route.POST;
  });

  describe('GET /api/users/[id]/points', () => {
    it('should return 404 when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest(new URL('http://localhost:3000/api/users/user-123/points'));
      const response = await GET(request, { params: { id: 'user-123' } });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('User not found');
    });

    it('should return user points info', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-123', points: 100 });
      const mockGetUserPoints = jest.requireMock('@/lib/pointsService').getUserPoints;
      mockGetUserPoints.mockResolvedValue({
        points: 100,
        level: 2,
        levelName: '新手',
        nextLevelMinPoints: 300,
        progressToNextLevel: 50,
      });

      const request = new NextRequest(new URL('http://localhost:3000/api/users/user-123/points'));
      const response = await GET(request, { params: { id: 'user-123' } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.userId).toBe('user-123');
      expect(data.points).toBe(100);
      expect(data.level).toBe(2);
      expect(data.levelName).toBe('新手');
    });

    it('should include logs when includeLogs=true', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-123', points: 100 });
      const mockGetUserPoints = jest.requireMock('@/lib/pointsService').getUserPoints;
      mockGetUserPoints.mockResolvedValue({
        points: 100,
        level: 2,
        levelName: '新手',
        nextLevelMinPoints: 300,
        progressToNextLevel: 50,
      });

      const mockGetUserPointsLog = jest.requireMock('@/lib/pointsService').getUserPointsLog;
      mockGetUserPointsLog.mockResolvedValue({
        logs: [{ id: 'log-1', points: 10, action: 'login' }],
        total: 1,
      });

      const request = new NextRequest(
        new URL('http://localhost:3000/api/users/user-123/points?includeLogs=true&limit=5')
      );
      const response = await GET(request, { params: { id: 'user-123' } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.logs).toBeDefined();
      expect(data.logs).toHaveLength(1);
      expect(data.totalLogs).toBe(1);
    });

    it('should return 500 when getUserPoints fails', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-123', points: 100 });
      const mockGetUserPoints = jest.requireMock('@/lib/pointsService').getUserPoints;
      mockGetUserPoints.mockResolvedValue(null);

      const request = new NextRequest(new URL('http://localhost:3000/api/users/user-123/points'));
      const response = await GET(request, { params: { id: 'user-123' } });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to fetch points info');
    });
  });

  describe('POST /api/users/[id]/points', () => {
    it('should return 404 when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest(new URL('http://localhost:3000/api/users/user-123/points'), {
        method: 'POST',
        body: JSON.stringify({ points: 10, action: 'login', description: 'Daily login' }),
      });
      const response = await POST(request, { params: { id: 'user-123' } });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('User not found');
    });

    it('should return 400 when action is missing', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-123' });

      const request = new NextRequest(new URL('http://localhost:3000/api/users/user-123/points'), {
        method: 'POST',
        body: JSON.stringify({ points: 10, description: 'Daily login' }),
      });
      const response = await POST(request, { params: { id: 'user-123' } });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Action is required');
    });

    it('should return 400 when description is missing', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-123' });

      const request = new NextRequest(new URL('http://localhost:3000/api/users/user-123/points'), {
        method: 'POST',
        body: JSON.stringify({ points: 10, action: 'login' }),
      });
      const response = await POST(request, { params: { id: 'user-123' } });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Description is required');
    });

    it('should return 400 when points is zero', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-123' });

      const request = new NextRequest(new URL('http://localhost:3000/api/users/user-123/points'), {
        method: 'POST',
        body: JSON.stringify({ points: 0, action: 'login', description: 'Daily login' }),
      });
      const response = await POST(request, { params: { id: 'user-123' } });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Points must be a non-zero number');
    });

    it('should add points when points is positive', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-123' });
      mockAddPoints.mockResolvedValue(110);

      const request = new NextRequest(new URL('http://localhost:3000/api/users/user-123/points'), {
        method: 'POST',
        body: JSON.stringify({ points: 10, action: 'login', description: 'Daily login' }),
      });
      const response = await POST(request, { params: { id: 'user-123' } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.points).toBe(110);
      expect(data.action).toBe('login');
      expect(data.pointsChanged).toBe(10);
    });

    it('should deduct points when points is negative', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-123' });
      mockDeductPoints.mockResolvedValue(80);

      const request = new NextRequest(new URL('http://localhost:3000/api/users/user-123/points'), {
        method: 'POST',
        body: JSON.stringify({ points: -20, action: 'admin_deduction', description: 'Penalty' }),
      });
      const response = await POST(request, { params: { id: 'user-123' } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.points).toBe(80);
      expect(data.action).toBe('admin_deduction');
      expect(data.pointsChanged).toBe(-20);
    });

    it('should handle service errors', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-123' });
      mockAddPoints.mockRejectedValue(new Error('积分不足'));

      const request = new NextRequest(new URL('http://localhost:3000/api/users/user-123/points'), {
        method: 'POST',
        body: JSON.stringify({ points: 1000, action: 'login', description: 'Large points' }),
      });
      const response = await POST(request, { params: { id: 'user-123' } });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('积分不足');
    });
  });
});
