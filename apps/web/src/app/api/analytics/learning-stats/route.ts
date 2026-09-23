import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/analytics/learning-stats - 获取用户学习数据统计
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // 获取用户基本信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        avatar_url: true,
        points: true,
        level: true,
        grade: true,
        created_at: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 获取作品统计
    const workStats = await prisma.work.count({
      where: { userId },
    });

    // 获取项目完成统计
    const completedProjects = await prisma.work.count({
      where: { userId, status: 'completed' },
    });

    // 获取获得的积分
    const pointsLog = await prisma.pointsLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // 获取等级信息
    const userLevel = await prisma.userLevel.findUnique({
      where: { level: user.level || 1 },
    });

    // 计算学习时长（估算）
    const learningMinutes = completedProjects * 30; // 每个项目估算 30 分钟

    // 获取成就/徽章统计
    const achievements = await prisma.notification.count({
      where: {
        userId,
        type: 'achievement',
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        nickname: user.nickname,
        avatarUrl: user.avatar_url,
        points: user.points || 0,
        level: user.level || 1,
        grade: user.grade,
        memberSince: user.created_at,
      },
      stats: {
        totalWorks: workStats,
        completedProjects,
        learningMinutes,
        achievements,
      },
      levelInfo: userLevel
        ? {
            name: userLevel.name,
            minPoints: userLevel.min_points,
            maxPoints: userLevel.max_points,
            privileges: userLevel.privileges,
          }
        : null,
      recentPointsActivity: pointsLog.map((log) => ({
        id: log.id,
        points: log.points,
        balance: log.balance,
        action: log.action,
        description: log.description,
        createdAt: log.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching learning stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learning statistics' },
      { status: 500 }
    );
  }
}
