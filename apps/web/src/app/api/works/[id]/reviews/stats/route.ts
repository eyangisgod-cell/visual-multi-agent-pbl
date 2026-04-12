import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { WorkReview } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/works/[id]/reviews/stats - 获取作品评分统计
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reviews = await prisma.workReview.findMany({
      where: { workId: params.id },
      select: {
        rating: true,
      },
    });

    const ratingsWithValues = reviews.filter((r: { rating: number | null }) => r.rating !== null);
    const totalReviews = reviews.length;
    const ratedReviews = ratingsWithValues.length;

    // 计算平均分
    const averageRating =
      ratedReviews > 0
        ? ratingsWithValues.reduce((sum: number, r: { rating: number | null }) => sum + (r.rating || 0), 0) / ratedReviews
        : 0;

    // 计算评分分布
    const ratingDistribution = {
      5: ratingsWithValues.filter((r: { rating: number | null }) => r.rating === 5).length,
      4: ratingsWithValues.filter((r: { rating: number | null }) => r.rating === 4).length,
      3: ratingsWithValues.filter((r: { rating: number | null }) => r.rating === 3).length,
      2: ratingsWithValues.filter((r: { rating: number | null }) => r.rating === 2).length,
      1: ratingsWithValues.filter((r: { rating: number | null }) => r.rating === 1).length,
    };

    return NextResponse.json({
      averageRating: Math.round(averageRating * 10) / 10, // 保留一位小数
      totalReviews,
      ratedReviews,
      ratingDistribution,
    });
  } catch (error) {
    console.error('Error fetching review stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review stats' },
      { status: 500 }
    );
  }
}
