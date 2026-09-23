import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/friends - 获取用户的好友列表
export async function GET(request: NextRequest) {
  try {
    // 从 session cookie 获取用户 ID
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // 从 session 获取用户 ID
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    })

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    const userId = session.userId

    // 获取用户的好友列表（已接受的好友请求）
    const friends = await prisma.friend.findMany({
      where: {
        userId,
        status: 'accepted',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar_url: true,
            points: true,
            level: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // 格式化好友数据
    const friendList = friends.map(f => ({
      id: f.user.id,
      username: f.user.username,
      nickname: f.user.nickname,
      avatar_url: f.user.avatar_url,
      points: f.user.points,
      level: f.user.level,
    }))

    return NextResponse.json({ friends: friendList })
  } catch (error) {
    console.error('Error fetching friends:', error)
    return NextResponse.json({ error: 'Failed to fetch friends' }, { status: 500 })
  }
}

// POST /api/friends - 发送好友请求
export async function POST(request: NextRequest) {
  try {
    // 从 session cookie 获取用户 ID
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    })

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    const userId = session.userId
    const { friendId } = await request.json()

    if (!friendId) {
      return NextResponse.json({ error: 'Friend ID required' }, { status: 400 })
    }

    if (friendId === userId) {
      return NextResponse.json({ error: 'Cannot add yourself as a friend' }, { status: 400 })
    }

    // 检查好友关系是否已存在
    const existingFriend = await prisma.friend.findFirst({
      where: {
        userId,
        friendId,
      },
    })

    if (existingFriend) {
      return NextResponse.json({ error: 'Friend request already sent' }, { status: 400 })
    }

    // 创建好友请求
    const friend = await prisma.friend.create({
      data: {
        userId,
        friendId,
        status: 'pending',
      },
    })

    return NextResponse.json({ friend, message: 'Friend request sent' })
  } catch (error) {
    console.error('Error sending friend request:', error)
    return NextResponse.json({ error: 'Failed to send friend request' }, { status: 500 })
  }
}

// PUT /api/friends - 接受/拒绝好友请求
export async function PUT(request: NextRequest) {
  try {
    const { friendId, status } = await request.json()

    if (!friendId || !status) {
      return NextResponse.json({ error: 'Friend ID and status required' }, { status: 400 })
    }

    if (!['accepted', 'rejected', 'blocked'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // 从 session cookie 获取用户 ID
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    })

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    const userId = session.userId

    // 更新好友状态
    const friend = await prisma.friend.updateMany({
      where: {
        userId: friendId, // 对方是发送者
        friendId: userId, // 当前用户是接收者
        status: 'pending',
      },
      data: {
        status,
      },
    })

    if (friend.count === 0) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 })
    }

    return NextResponse.json({ message: `Friend request ${status}` })
  } catch (error) {
    console.error('Error updating friend status:', error)
    return NextResponse.json({ error: 'Failed to update friend status' }, { status: 500 })
  }
}
