import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import {
  getUserPoints,
  getUserPointsLog,
} from '@/lib/pointsService';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'visual-pbl-jwt-secret-key-change-in-production';

// GET /api/users/current/points - 获取当前登录用户的积分
export async function GET(request: NextRequest) {
  try {
    // 从 Authorization header 获取 token
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // 验证 JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string };

    // 验证用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeLogs = searchParams.get('includeLogs') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');

    // 获取积分信息
    const pointsInfo = await getUserPoints(decoded.userId);

    if (!pointsInfo) {
      return NextResponse.json(
        { error: 'Failed to fetch points info' },
        { status: 500 }
      );
    }

    const response: any = {
      userId: decoded.userId,
      points: pointsInfo.points,
      level: pointsInfo.level,
      levelName: pointsInfo.levelName,
      nextLevelMinPoints: pointsInfo.nextLevelMinPoints,
      progressToNextLevel: pointsInfo.progressToNextLevel,
    };

    // 可选返回积分记录
    if (includeLogs) {
      const logsResult = await getUserPointsLog(decoded.userId, { limit });
      response.logs = logsResult.logs;
      response.totalLogs = logsResult.total;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching current user points:', error);
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}
