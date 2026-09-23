import { NextRequest, NextResponse } from 'next/server';
import { getAllPointsRules, getPointsRule, upsertPointsRule } from '@/lib/pointsService';

// GET /api/points/rules - 获取积分规则
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action) {
      // 获取特定动作的规则
      const rule = await getPointsRule(action as any);
      if (!rule) {
        return NextResponse.json(
          { error: 'Rule not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ rules: [rule] });
    } else {
      // 获取所有规则
      const rules = await getAllPointsRules();
      return NextResponse.json({ rules });
    }
  } catch (error) {
    console.error('Error fetching points rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch points rules' },
      { status: 500 }
    );
  }
}

// POST /api/points/rules - 创建/更新积分规则 (Admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, points, description, isActive = true } = body;

    // 验证必填字段
    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    if (typeof points !== 'number') {
      return NextResponse.json(
        { error: 'Points must be a number' },
        { status: 400 }
      );
    }

    // 创建或更新规则
    const rule = await upsertPointsRule(action, points, description, isActive);

    return NextResponse.json({
      message: 'Rule created/updated successfully',
      rule,
    }, { status: 200 });
  } catch (error) {
    console.error('Error creating points rule:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
