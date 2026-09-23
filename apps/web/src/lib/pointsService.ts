import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 积分动作类型
export type PointsAction =
  | 'login'              // 签到登录
  | 'daily_bonus'        // 每日奖励
  | 'submit_work'        // 提交作品
  | 'work_approved'      // 作品通过审核
  | 'work_rejected'      // 作品被拒绝
  | 'manual_adjustment'  // 手动调整
  | 'invite_user'        // 邀请用户
  | 'complete_task'      // 完成任务
  | 'purchase'           // 消费积分
  | 'refund'             // 积分退还
  | 'admin_bonus'        // 管理员奖励
  | 'admin_deduction';   // 管理员扣除

// 积分规则接口
export interface PointsRule {
  action: string;
  points: number;
  description?: string | null;
  isActive: boolean;
}

// 用户等级信息
export interface UserLevelInfo {
  level: number;
  name: string;
  minPoints: number;
  maxPoints: number | null;
  privileges?: Record<string, any> | null;
}

// 用户积分信息
export interface UserPointsInfo {
  userId: string;
  points: number;
  level: number;
  levelName: string;
  nextLevelMinPoints: number | null;
  progressToNextLevel: number; // 0-100 百分比
}

/**
 * 获取积分规则
 */
export async function getPointsRule(action: PointsAction): Promise<PointsRule | null> {
  const rule = await prisma.pointsRule.findUnique({
    where: { action },
  });
  return rule;
}

/**
 * 获取所有积分规则
 */
export async function getAllPointsRules(): Promise<PointsRule[]> {
  const rules = await prisma.pointsRule.findMany({
    orderBy: { action: 'asc' },
  });
  return rules;
}

/**
 * 创建或更新积分规则
 */
export async function upsertPointsRule(
  action: string,
  points: number,
  description?: string,
  isActive: boolean = true
): Promise<PointsRule> {
  return prisma.pointsRule.upsert({
    where: { action },
    update: { points, description, isActive },
    create: { action, points, description, isActive },
  });
}

/**
 * 根据积分计算用户等级
 */
export async function calculateLevelByPoints(points: number): Promise<number> {
  const levels = await prisma.userLevel.findMany({
    orderBy: { minPoints: 'asc' },
  });

  if (levels.length === 0) {
    return 1; // 默认等级
  }

  // 找到最高等级
  const maxLevel = levels.reduce((max, level) => (level.level > max ? level.level : max), 0);

  // 从高等级往低等级查找
  for (let level = maxLevel; level >= 1; level--) {
    const levelInfo = levels.find((l) => l.level === level);
    if (levelInfo && points >= levelInfo.minPoints) {
      // 检查是否有最高分限制
      if (levelInfo.maxPoints !== null && points > levelInfo.maxPoints) {
        continue;
      }
      return level;
    }
  }

  return 1; // 默认返回 1 级
}

/**
 * 获取等级信息
 */
export async function getLevelInfo(level: number): Promise<UserLevelInfo | null> {
  const levelData = await prisma.userLevel.findUnique({
    where: { level },
  });
  if (!levelData) return null;

  return {
    level: levelData.level,
    name: levelData.name,
    minPoints: levelData.minPoints,
    maxPoints: levelData.maxPoints,
    privileges: levelData.privileges,
  };
}

/**
 * 获取所有等级信息
 */
export async function getAllLevels(): Promise<UserLevelInfo[]> {
  const levels = await prisma.userLevel.findMany({
    orderBy: { level: 'asc' },
  });
  return levels.map((l) => ({
    level: l.level,
    name: l.name,
    minPoints: l.minPoints,
    maxPoints: l.maxPoints,
    privileges: l.privileges,
  }));
}

/**
 * 获取用户积分信息
 */
export async function getUserPoints(userId: string): Promise<UserPointsInfo | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, points: true, level: true },
  });

  if (!user) return null;

  const currentPoints = user.points || 0;
  const levels = await prisma.userLevel.findMany({
    orderBy: { minPoints: 'asc' },
  });

  // 计算当前等级
  let currentLevel = 1;
  let levelName = '初学者';
  let nextLevelMinPoints: number | null = null;
  let progressToNextLevel = 0;

  // 找到当前等级和下一级
  for (let i = levels.length - 1; i >= 0; i--) {
    if (currentPoints >= levels[i].minPoints) {
      currentLevel = levels[i].level;
      levelName = levels[i].name;

      // 查找下一级
      const nextLevel = levels.find((l) => l.level === currentLevel + 1);
      if (nextLevel) {
        nextLevelMinPoints = nextLevel.minPoints;
        const prevMinPoints = levels[i].minPoints;
        const range = nextLevelMinPoints - prevMinPoints;
        const progress = currentPoints - prevMinPoints;
        progressToNextLevel = range > 0 ? Math.min(100, Math.max(0, (progress / range) * 100)) : 100;
      } else {
        progressToNextLevel = 100; // 最高等级
      }
      break;
    }
  }

  return {
    userId: user.id,
    points: currentPoints,
    level: currentLevel,
    levelName,
    nextLevelMinPoints,
    progressToNextLevel,
  };
}

/**
 * 添加积分
 * @param userId 用户 ID
 * @param action 积分动作
 * @param points 积分数量（正数）
 * @param description 描述
 * @param metadata 额外元数据
 * @returns 添加后的总积分
 */
export async function addPoints(
  userId: string,
  action: PointsAction,
  points: number,
  description: string,
  metadata?: Record<string, any>
): Promise<number> {
  if (points <= 0) {
    throw new Error('积分必须为正数');
  }

  // 检查规则是否存在（可选，如果规则不存在仍然可以添加）
  const rule = await getPointsRule(action);
  if (!rule || !rule.isActive) {
    console.warn(`积分规则 "${action}" 不存在或未激活`);
  }

  // 使用事务确保原子性
  const result = await prisma.$transaction(async (tx) => {
    // 获取用户当前积分
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    const currentPoints = user.points || 0;
    const newBalance = currentPoints + points;

    // 更新用户积分
    await tx.user.update({
      where: { id: userId },
      data: { points: newBalance },
    });

    // 创建积分记录
    await tx.pointsLog.create({
      data: {
        userId,
        points,
        balance: newBalance,
        action,
        description,
        metadata,
      },
    });

    // 检查并更新等级
    const newLevel = await calculateLevelByPoints(newBalance);
    if (newLevel !== user.points) {
      await tx.user.update({
        where: { id: userId },
        data: { level: newLevel },
      });
    }

    return newBalance;
  });

  return result;
}

/**
 * 扣除积分
 * @param userId 用户 ID
 * @param action 积分动作
 * @param points 积分数量（正数）
 * @param description 描述
 * @param metadata 额外元数据
 * @returns 扣除后的总积分
 */
export async function deductPoints(
  userId: string,
  action: PointsAction,
  points: number,
  description: string,
  metadata?: Record<string, any>
): Promise<number> {
  if (points <= 0) {
    throw new Error('积分必须为正数');
  }

  const result = await prisma.$transaction(async (tx) => {
    // 获取用户当前积分
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    const currentPoints = user.points || 0;
    if (currentPoints < points) {
      throw new Error('积分不足');
    }

    const newBalance = currentPoints - points;

    // 更新用户积分
    await tx.user.update({
      where: { id: userId },
      data: { points: newBalance },
    });

    // 创建积分记录（负数）
    await tx.pointsLog.create({
      data: {
        userId,
        points: -points,
        balance: newBalance,
        action,
        description,
        metadata,
      },
    });

    // 检查并更新等级
    const newLevel = await calculateLevelByPoints(newBalance);
    if (newLevel !== currentPoints) {
      await tx.user.update({
        where: { id: userId },
        data: { level: newLevel },
      });
    }

    return newBalance;
  });

  return result;
}

/**
 * 获取用户积分明细
 */
export async function getUserPointsLog(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    action?: PointsAction;
  }
) {
  const { limit = 20, offset = 0, action } = options || {};

  const where: { userId: string; action?: PointsAction } = { userId };
  if (action) {
    where.action = action;
  }

  const logs = await prisma.pointsLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: limit,
  });

  const total = await prisma.pointsLog.count({ where });

  return { logs, total };
}

/**
 * 初始化默认积分规则
 */
export async function initializeDefaultRules(): Promise<void> {
  const defaultRules = [
    { action: 'login', points: 1, description: '每日签到' },
    { action: 'daily_bonus', points: 5, description: '每日奖励' },
    { action: 'submit_work', points: 10, description: '提交作品' },
    { action: 'work_approved', points: 50, description: '作品通过审核' },
    { action: 'work_rejected', points: -5, description: '作品被拒绝' },
    { action: 'invite_user', points: 20, description: '邀请新用户' },
    { action: 'complete_task', points: 15, description: '完成任务' },
    { action: 'admin_bonus', points: 100, description: '管理员奖励' },
    { action: 'admin_deduction', points: -50, description: '管理员扣除' },
  ];

  for (const rule of defaultRules) {
    await upsertPointsRule(rule.action, rule.points, rule.description);
  }
}

/**
 * 初始化默认等级配置
 */
export async function initializeDefaultLevels(): Promise<void> {
  const defaultLevels = [
    { level: 1, name: '初学者', minPoints: 0, maxPoints: 99 },
    { level: 2, name: '新手', minPoints: 100, maxPoints: 299 },
    { level: 3, name: '进阶者', minPoints: 300, maxPoints: 599 },
    { level: 4, name: '高手', minPoints: 600, maxPoints: 999 },
    { level: 5, name: '专家', minPoints: 1000, maxPoints: 1999 },
    { level: 6, name: '大师', minPoints: 2000, maxPoints: 4999 },
    { level: 7, name: '宗师', minPoints: 5000, maxPoints: null },
  ];

  for (const level of defaultLevels) {
    await prisma.userLevel.upsert({
      where: { level: level.level },
      update: level,
      create: level,
    });
  }
}

/**
 * 获取所有可用奖励
 */
export async function getAllRewards(options?: {
  maxPoints?: number;
  isActive?: boolean;
}): Promise<any[]> {
  const { maxPoints, isActive = true } = options || {};

  const where: any = {};
  if (isActive !== undefined) {
    where.isActive = isActive;
  }
  if (maxPoints !== undefined) {
    where.cost = { lte: maxPoints };
  }

  const rewards = await prisma.pointsReward.findMany({
    where,
    orderBy: { cost: 'asc' },
  });

  return rewards;
}

/**
 * 获取单个奖励详情
 */
export async function getReward(rewardId: string): Promise<any | null> {
  const reward = await prisma.pointsReward.findUnique({
    where: { id: rewardId },
  });
  return reward;
}

/**
 * 创建奖励
 */
export async function createReward(data: {
  name: string;
  description?: string;
  cost: number;
  type?: string;
  stock?: number;
  imageUrl?: string;
  metadata?: Record<string, any>;
  isActive?: boolean;
}): Promise<any> {
  return prisma.pointsReward.create({
    data,
  });
}

/**
 * 兑换奖励
 */
export async function redeemReward(
  userId: string,
  rewardId: string,
  quantity: number = 1,
  metadata?: Record<string, any>
): Promise<{ redemptionId: string; pointsDeducted: number; newBalance: number }> {
  // 使用事务确保原子性
  return prisma.$transaction(async (tx) => {
    // 获取奖励信息
    const reward = await tx.pointsReward.findUnique({
      where: { id: rewardId },
    });

    if (!reward) {
      throw new Error('Reward not found');
    }

    if (!reward.isActive) {
      throw new Error('Reward is not active');
    }

    // 检查库存
    if (reward.stock !== null && reward.stock < quantity) {
      throw new Error('Insufficient stock');
    }

    // 计算总消耗积分
    const totalCost = reward.cost * quantity;

    // 获取用户当前积分
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const currentPoints = user.points || 0;
    if (currentPoints < totalCost) {
      throw new Error('Insufficient points');
    }

    // 更新用户积分
    const newBalance = currentPoints - totalCost;
    await tx.user.update({
      where: { id: userId },
      data: { points: newBalance },
    });

    // 更新库存
    if (reward.stock !== null) {
      await tx.pointsReward.update({
        where: { id: rewardId },
        data: { stock: reward.stock - quantity },
      });
    }

    // 创建兑换记录
    const redemption = await tx.pointsRedemption.create({
      data: {
        userId,
        rewardId,
        quantity,
        pointsCost: totalCost,
        status: 'pending',
        metadata,
      },
    });

    // 创建积分扣除记录
    await tx.pointsLog.create({
      data: {
        userId,
        points: -totalCost,
        balance: newBalance,
        action: 'purchase',
        description: `兑换奖励：${reward.name}`,
        metadata: { redemptionId: redemption.id, rewardId, quantity },
      },
    });

    // 检查并更新等级
    const newLevel = await calculateLevelByPoints(newBalance);
    if (newLevel !== currentPoints) {
      await tx.user.update({
        where: { id: userId },
        data: { level: newLevel },
      });
    }

    return {
      redemptionId: redemption.id,
      pointsDeducted: totalCost,
      newBalance,
    };
  });
}

/**
 * 获取用户兑换记录
 */
export async function getUserRedemptions(
  userId: string,
  options?: { limit?: number; offset?: number; status?: string }
) {
  const { limit = 20, offset = 0, status } = options || {};

  const where: any = { userId };
  if (status) {
    where.status = status;
  }

  const redemptions = await prisma.pointsRedemption.findMany({
    where,
    include: {
      reward: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: limit,
  });

  const total = await prisma.pointsRedemption.count({ where });

  return { redemptions, total };
}

/**
 * 初始化默认奖励
 */
export async function initializeDefaultRewards(): Promise<void> {
  const defaultRewards = [
    {
      name: '头像框 - 金牌',
      description: '金色头像框，展示尊贵身份',
      cost: 500,
      type: 'virtual',
      stock: null,
      metadata: { itemType: 'avatar_frame', itemId: 'gold_frame' },
    },
    {
      name: '专属表情',
      description: '解锁专属表情包',
      cost: 200,
      type: 'virtual',
      stock: null,
      metadata: { itemType: 'emoji_pack', itemId: 'exclusive_emojis' },
    },
    {
      name: '7 天 VIP',
      description: '7 天 VIP 特权体验',
      cost: 1000,
      type: 'privilege',
      stock: null,
      metadata: { privilegeType: 'vip', duration: 7 },
    },
  ];

  for (const reward of defaultRewards) {
    await createReward(reward);
  }
}
