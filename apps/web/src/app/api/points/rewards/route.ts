import { NextRequest, NextResponse } from 'next/server';
import { getAllRewards } from '@/lib/pointsService';

// GET /api/points/rewards - 获取可用奖励列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const maxPoints = searchParams.get('maxPoints');
    const type = searchParams.get('type');

    const options: any = {};
    if (maxPoints) {
      options.maxPoints = parseInt(maxPoints);
    }

    const rewards = await getAllRewards(options);

    // 如果指定了类型，过滤结果
    let filteredRewards = rewards;
    if (type) {
      filteredRewards = rewards.filter((r) => r.type === type);
    }

    return NextResponse.json({ rewards: filteredRewards });
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rewards' },
      { status: 500 }
    );
  }
}
