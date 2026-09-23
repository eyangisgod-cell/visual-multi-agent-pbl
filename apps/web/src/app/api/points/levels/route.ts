import { NextRequest, NextResponse } from 'next/server';
import { getAllLevels, getLevelInfo, calculateLevelByPoints } from '@/lib/pointsService';

// GET /api/points/levels - 获取所有等级配置
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const points = searchParams.get('points');

    if (level) {
      // 获取特定等级信息
      const levelInfo = await getLevelInfo(parseInt(level));
      if (!levelInfo) {
        return NextResponse.json(
          { error: 'Level not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ level: levelInfo });
    }

    if (points) {
      // 根据积分计算等级
      const pointsNum = parseInt(points);
      const level = await calculateLevelByPoints(pointsNum);
      const levelInfo = await getLevelInfo(level);
      return NextResponse.json({
        level: levelInfo?.level || 1,
        levelName: levelInfo?.name || '初学者',
        minPoints: levelInfo?.minPoints || 0,
        maxPoints: levelInfo?.maxPoints,
      });
    }

    // 获取所有等级
    const levels = await getAllLevels();
    return NextResponse.json({ levels });
  } catch (error) {
    console.error('Error fetching points levels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch points levels' },
      { status: 500 }
    );
  }
}
