import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * GET /api/upload/progress - 获取上传进度
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileHash = searchParams.get('fileHash')

    if (!fileHash) {
      return NextResponse.json(
        { error: '缺少文件哈希' },
        { status: 400 }
      )
    }

    // 查询已上传的分片
    const uploadedChunks = await prisma.uploadChunk.findMany({
      where: { fileHash },
      select: {
        chunkIndex: true,
        totalChunks: true,
        fileSize: true,
      },
      orderBy: { chunkIndex: 'asc' },
    })

    if (uploadedChunks.length === 0) {
      return NextResponse.json({
        fileHash,
        uploadedChunks: 0,
        totalChunks: 0,
        progress: 0,
        uploadedBytes: 0,
        totalBytes: 0,
      })
    }

    const totalChunks = uploadedChunks[0]?.totalChunks || 0
    const uploadedIndices = uploadedChunks.map(c => c.chunkIndex)

    // 计算已上传的字节数
    const uploadedBytes = uploadedChunks.reduce((sum, c) => sum + (c.fileSize || 0), 0)

    // 估算总字节数（假设分片大小相似）
    const avgChunkSize = uploadedBytes / uploadedChunks.length
    const totalBytes = avgChunkSize * totalChunks

    const progress = totalChunks > 0 ? (uploadedChunks.length / totalChunks) * 100 : 0

    return NextResponse.json({
      fileHash,
      uploadedChunks: uploadedIndices.length,
      totalChunks,
      progress: Math.round(progress * 100) / 100,
      uploadedBytes,
      totalBytes: Math.round(totalBytes),
    })
  } catch (error) {
    console.error('Error getting upload progress:', error)
    return NextResponse.json(
      { error: '查询进度失败' },
      { status: 500 }
    )
  }
}
