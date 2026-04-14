import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import {
  getUserPoints,
  getUserPointsLog,
  addPoints,
  deductPoints,
  type PointsAction,
} from '@/lib/pointsService';

const prisma = new PrismaClient();

// GET /api/users/[id]/points - 获取用户积分
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const { searchParams } = new URL(request.url);
    const includeLogs = searchParams.get('includeLogs') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');

    // 验证用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 获取积分信息
    const pointsInfo = await getUserPoints(userId);

    if (!pointsInfo) {
      return NextResponse.json(
        { error: 'Failed to fetch points info' },
        { status: 500 }
      );
    }

    const response: any = {
      userId,
      points: pointsInfo.points,
      level: pointsInfo.level,
      levelName: pointsInfo.levelName,
      nextLevelMinPoints: pointsInfo.nextLevelMinPoints,
      progressToNextLevel: pointsInfo.progressToNextLevel,
    };

    // 可选返回积分记录
    if (includeLogs) {
      const logsResult = await getUserPointsLog(userId, { limit });
      response.logs = logsResult.logs;
      response.totalLogs = logsResult.total;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching user points:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user points' },
      { status: 500 }
    );
  }
}

// POST /api/users/[id]/points - 添加/扣除积分
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    // 验证用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { points, action, description, metadata } = body;

    // 验证必填字段
    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    if (typeof points !== 'number' || points === 0) {
      return NextResponse.json(
        { error: 'Points must be a non-zero number' },
        { status: 400 }
      );
    }

    // 根据 points 正负决定添加还是扣除
    let newBalance: number;
    if (points > 0) {
      newBalance = await addPoints(
        userId,
        action as PointsAction,
        points,
        description,
        metadata
      );
    } else {
      newBalance = await deductPoints(
        userId,
        action as PointsAction,
        Math.abs(points),
        description,
        metadata
      );
    }

    return NextResponse.json({
      userId,
      points: newBalance,
      action,
      pointsChanged: points,
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating user points:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
