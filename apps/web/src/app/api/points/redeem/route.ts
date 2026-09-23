import { NextRequest, NextResponse } from 'next/server';
import { redeemReward } from '@/lib/pointsService';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'visual-pbl-jwt-secret-key-change-in-production';

/**
 * 从请求中获取用户 ID
 * 优先从 session cookie 获取，其次从 Authorization header 获取
 */
function getUserIdFromRequest(request: NextRequest): string | null {
  // 尝试从 session cookie 获取
  const sessionToken = request.cookies.get('session')?.value;
  if (sessionToken) {
    try {
      const decoded = jwt.verify(sessionToken, JWT_SECRET) as { userId: string };
      return decoded.userId;
    } catch (error) {
      // Token 无效或过期，继续尝试其他方式
    }
  }

  // 尝试从 Authorization header 获取
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      return decoded.userId;
    } catch (error) {
      // Token 无效或过期
    }
  }

  return null;
}

// POST /api/points/redeem - 兑换积分
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rewardId, quantity = 1, metadata } = body;

    // 验证必填字段
    if (!rewardId) {
      return NextResponse.json(
        { error: 'Reward ID is required' },
        { status: 400 }
      );
    }

    if (typeof quantity !== 'number' || quantity < 1) {
      return NextResponse.json(
        { error: 'Quantity must be a positive number' },
        { status: 400 }
      );
    }

    // 从 session 或 token 获取用户 ID
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 执行兑换
    const result = await redeemReward(userId, rewardId, quantity, metadata);

    return NextResponse.json({
      message: 'Redemption successful',
      redemptionId: result.redemptionId,
      pointsDeducted: result.pointsDeducted,
      newBalance: result.newBalance,
    }, { status: 200 });
  } catch (error) {
    console.error('Error redeeming reward:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // 处理特定错误
    if (errorMessage.includes('Insufficient points')) {
      return NextResponse.json(
        { error: 'Insufficient points for redemption' },
        { status: 400 }
      );
    }
    if (errorMessage.includes('Insufficient stock')) {
      return NextResponse.json(
        { error: 'Insufficient stock' },
        { status: 400 }
      );
    }
    if (errorMessage.includes('not found')) {
      return NextResponse.json(
        { error: 'Reward not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
