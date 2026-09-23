import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/points/leaderboard - 获取积分排行榜
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const period = searchParams.get('period'); // daily, weekly, monthly, alltime
    const scope = searchParams.get('scope'); // all, friends

    // 从 session cookie 获取用户 ID（用于好友排行榜）
    const sessionToken = request.cookies.get('session')?.value;
    let currentUserId: string | undefined;

    if (sessionToken) {
      const session = await prisma.session.findUnique({
        where: { token: sessionToken },
      });
      if (session && session.expiresAt > new Date()) {
        currentUserId = session.userId;
      }
    }

    // 基础查询条件
    let whereCondition: any = {
      deleted_at: null, // 排除已删除用户（使用 snake_case）
    };

    // 如果请求的是好友排行榜，需要过滤为好友
    if (scope === 'friends' && currentUserId) {
      // 获取用户的好友 ID 列表
      const friends = await prisma.friend.findMany({
        where: {
          userId: currentUserId,
          status: 'accepted',
        },
        select: {
          friendId: true,
        },
      });

      const friendIds = friends.map(f => f.friendId);

      // 如果没有好友，返回空数组
      if (friendIds.length === 0) {
        return NextResponse.json({
          leaderboard: [],
          total: 0,
          period: period || 'alltime',
          scope: 'friends',
          message: 'No friends yet',
        });
      }

      // 查询好友的积分排名
      whereCondition = {
        id: { in: friendIds },
        deleted_at: null,
      };
    }

    const users = await prisma.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        nickname: true,
        avatar_url: true,
        points: true,
        level: true,
        created_at: true,
      },
      orderBy: {
        points: 'desc',
      },
      skip: offset,
      take: limit,
    });

    // 计算总用户数
    const totalUsers = await prisma.user.count({
      where: whereCondition,
    });

    // 构建排行榜数据
    const leaderboard = users.map((user, index) => ({
      rank: offset + index + 1,
      userId: user.id,
      nickname: user.nickname || '匿名用户',
      avatarUrl: user.avatar_url,
      points: user.points || 0,
      level: user.level || 1,
    }));

    return NextResponse.json({
      leaderboard,
      total: totalUsers,
      period: period || 'alltime',
      scope: scope || 'all',
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
