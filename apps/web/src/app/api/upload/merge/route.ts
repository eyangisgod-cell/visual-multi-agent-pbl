import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { readFile, writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'

const prisma = new PrismaClient()

const CHUNK_DIR = join(process.cwd(), 'uploads', 'chunks')
const FINAL_DIR = join(process.cwd(), 'uploads', 'files')

/**
 * POST /api/upload/merge - 合并已上传的分片
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const fileHash = formData.get('fileHash') as string
    const fileName = formData.get('fileName') as string
    const totalChunksStr = formData.get('totalChunks') as string
    const mimeType = formData.get('mimeType') as string || ''

    if (!fileHash) {
      return NextResponse.json(
        { error: '缺少文件哈希' },
        { status: 400 }
      )
    }

    if (!fileName) {
      return NextResponse.json(
        { error: '缺少文件名' },
        { status: 400 }
      )
    }

    const totalChunks = parseInt(totalChunksStr)
    if (isNaN(totalChunks) || totalChunks < 1) {
      return NextResponse.json(
        { error: '无效的分片总数' },
        { status: 400 }
      )
    }

    // 验证所有分片都已上传
    const uploadedChunks = await prisma.uploadChunk.findMany({
      where: { fileHash },
      select: { chunkIndex: true },
      orderBy: { chunkIndex: 'asc' },
    })

    if (uploadedChunks.length !== totalChunks) {
      return NextResponse.json(
        {
          error: '分片未上传完成',
          uploaded: uploadedChunks.length,
          total: totalChunks,
        },
        { status: 400 }
      )
    }

    // 验证分片完整性
    const uploadedIndices = uploadedChunks.map(c => c.chunkIndex)
    for (let i = 0; i < totalChunks; i++) {
      if (!uploadedIndices.includes(i)) {
        return NextResponse.json(
          { error: `分片 ${i + 1} 未上传` },
          { status: 400 }
        )
      }
    }

    // 确保最终目录存在
    await mkdir(FINAL_DIR, { recursive: true })

    // 合并分片文件
    const finalPath = join(FINAL_DIR, `${fileHash}_${fileName}`)
    const writeStream = createWriteStream(finalPath)

    try {
      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = join(CHUNK_DIR, `${fileHash}_chunk_${i}`)
        const chunkData = await readFile(chunkPath)
        writeStream.write(chunkData)
      }

      writeStream.end()

      // 等待写入完成
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve)
        writeStream.on('error', reject)
      })

      // 删除分片文件
      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = join(CHUNK_DIR, `${fileHash}_chunk_${i}`)
        try {
          await unlink(chunkPath)
        } catch (e) {
          console.error(`Failed to delete chunk ${i}:`, e)
        }
      }

      // 删除数据库记录
      await prisma.uploadChunk.deleteMany({
        where: { fileHash },
      })

      // 生成文件 URL
      const fileUrl = `/uploads/files/${fileHash}_${fileName}`

      return NextResponse.json({
        success: true,
        fileUrl,
        fileName,
        mimeType,
        message: '文件合并成功',
      })
    } catch (error) {
      // 如果合并失败，尝试删除已创建的文件
      try {
        await unlink(finalPath)
      } catch (e) {
        // 忽略删除错误
      }
      throw error
    }
  } catch (error) {
    console.error('Error merging chunks:', error)
    return NextResponse.json(
      { error: '合并失败，请重试' },
      { status: 500 }
    )
  }
}
