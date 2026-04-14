/**
 * @jest-environment node
 */

// Mock Prisma before any imports
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
  pointsRule: {
    findUnique: jest.fn(),
  },
  userLevel: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  $transaction: jest.fn((fn) => fn(mockPrisma)),
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

describe('Points Service', () => {
  let pointsService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('getUserPoints', () => {
    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      pointsService = await require('@/lib/pointsService');
      const result = await pointsService.getUserPoints('user-123');

      expect(result).toBeNull();
    });

    it('should return user points info', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-123', points: 100, level: 1 });
      mockPrisma.userLevel.findMany.mockResolvedValue([
        { level: 1, name: '初学者', minPoints: 0, maxPoints: 99 },
        { level: 2, name: '新手', minPoints: 100, maxPoints: 299 },
        { level: 3, name: '进阶者', minPoints: 300, maxPoints: 599 },
      ]);

      pointsService = await require('@/lib/pointsService');
      const result = await pointsService.getUserPoints('user-123');

      expect(result).toBeDefined();
      expect(result?.points).toBe(100);
      expect(result?.level).toBe(2);
      expect(result?.levelName).toBe('新手');
    });

    it('should calculate progress to next level', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-123', points: 200, level: 2 });
      mockPrisma.userLevel.findMany.mockResolvedValue([
        { level: 1, name: '初学者', minPoints: 0, maxPoints: 99 },
        { level: 2, name: '新手', minPoints: 100, maxPoints: 299 },
        { level: 3, name: '进阶者', minPoints: 300, maxPoints: 599 },
      ]);

      pointsService = await require('@/lib/pointsService');
      const result = await pointsService.getUserPoints('user-123');

      expect(result?.progressToNextLevel).toBeCloseTo(50, 0); // 200 is 50% from 100 to 300
    });
  });

  describe('addPoints', () => {
    it('should throw error when points is not positive', async () => {
      pointsService = await require('@/lib/pointsService');

      await expect(
        pointsService.addPoints('user-123', 'login', 0, 'Test')
      ).rejects.toThrow('积分必须为正数');
    });

    it('should throw error when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      pointsService = await require('@/lib/pointsService');

      await expect(
        pointsService.addPoints('user-123', 'login', 10, 'Test')
      ).rejects.toThrow('用户不存在');
    });

    it('should add points successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ points: 100 });
      mockPrisma.userLevel.findMany.mockResolvedValue([]);

      const mockUpdate = jest.fn();
      const mockCreate = jest.fn();
      mockPrisma.user.update = mockUpdate;
      mockPrisma.pointsLog.create = mockCreate;

      pointsService = await require('@/lib/pointsService');
      const result = await pointsService.addPoints('user-123', 'login', 10, 'Daily login');

      expect(result).toBe(110);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-123' },
          data: { points: 110 },
        })
      );
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-123',
            points: 10,
            balance: 110,
            action: 'login',
            description: 'Daily login',
          }),
        })
      );
    });
  });

  describe('deductPoints', () => {
    it('should throw error when points is not positive', async () => {
      pointsService = await require('@/lib/pointsService');

      await expect(
        pointsService.deductPoints('user-123', 'admin_deduction', 0, 'Test')
      ).rejects.toThrow('积分必须为正数');
    });

    it('should throw error when insufficient points', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ points: 5 });

      pointsService = await require('@/lib/pointsService');

      await expect(
        pointsService.deductPoints('user-123', 'admin_deduction', 10, 'Test')
      ).rejects.toThrow('积分不足');
    });

    it('should deduct points successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ points: 100 });
      mockPrisma.userLevel.findMany.mockResolvedValue([]);

      const mockUpdate = jest.fn();
      const mockCreate = jest.fn();
      mockPrisma.user.update = mockUpdate;
      mockPrisma.pointsLog.create = mockCreate;

      pointsService = await require('@/lib/pointsService');
      const result = await pointsService.deductPoints('user-123', 'admin_deduction', 20, 'Penalty');

      expect(result).toBe(80);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-123' },
          data: { points: 80 },
        })
      );
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-123',
            points: -20,
            balance: 80,
            action: 'admin_deduction',
            description: 'Penalty',
          }),
        })
      );
    });
  });

  describe('getUserPointsLog', () => {
    it('should return user points logs with default options', async () => {
      mockPrisma.pointsLog.findMany.mockResolvedValue([
        { id: 'log-1', userId: 'user-123', points: 10, balance: 100, action: 'login' },
      ]);
      mockPrisma.pointsLog.count.mockResolvedValue(1);

      pointsService = await require('@/lib/pointsService');
      const result = await pointsService.getUserPointsLog('user-123');

      expect(result.logs).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockPrisma.pointsLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-123' },
          skip: 0,
          take: 20,
        })
      );
    });

    it('should support custom limit and offset', async () => {
      mockPrisma.pointsLog.findMany.mockResolvedValue([]);
      mockPrisma.pointsLog.count.mockResolvedValue(0);

      pointsService = await require('@/lib/pointsService');
      await pointsService.getUserPointsLog('user-123', { limit: 50, offset: 10 });

      expect(mockPrisma.pointsLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 50,
        })
      );
    });

    it('should filter by action', async () => {
      mockPrisma.pointsLog.findMany.mockResolvedValue([]);
      mockPrisma.pointsLog.count.mockResolvedValue(0);

      pointsService = await require('@/lib/pointsService');
      await pointsService.getUserPointsLog('user-123', { action: 'login' });

      expect(mockPrisma.pointsLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-123', action: 'login' },
        })
      );
    });
  });
});
