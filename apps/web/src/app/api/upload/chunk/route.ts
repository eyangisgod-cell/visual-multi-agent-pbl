import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { mkdir, writeFile, readFile, readdir, stat } from 'fs/promises'
import { join } from 'path'
import { createHash } from 'crypto'

const prisma = new PrismaClient()

// 配置常量
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const CHUNK_DIR = join(process.cwd(), 'uploads', 'chunks')
const FINAL_DIR = join(process.cwd(), 'uploads', 'files')

// 允许的文件类型
const ALLOWED_MIME_TYPES = [
  // 图片
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // PDF
  'application/pdf',
  // 视频
  'video/mp4',
  'video/webm',
  'video/quicktime',
  // 文档
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // 文本
  'text/plain',
  'text/markdown',
]

const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
  '.pdf',
  '.mp4', '.webm', '.mov',
  '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.md'
]

/**
 * 验证文件类型
 */
function validateFileType(fileName: string, mimeType: string): { valid: boolean; error?: string } {
  const ext = '.' + fileName.split('.').pop()?.toLowerCase()

  // 检查扩展名
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `不支持的文件类型：${ext}` }
  }

  // 检查 MIME 类型（如果提供）
  if (mimeType && !ALLOWED_MIME_TYPES.includes(mimeType)) {
    // 对于某些浏览器可能不提供准确的 MIME 类型，我们主要依赖扩展名
    console.warn(`Unusual MIME type: ${mimeType}`)
  }

  return { valid: true }
}

/**
 * 计算文件 hash
 */
async function calculateHash(buffer: Buffer): Promise<string> {
  const hash = createHash('sha256')
  hash.update(buffer)
  return hash.digest('hex')
}

/**
 * POST /api/upload/chunk - 上传文件分片
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const file = formData.get('file') as File | null
    const chunkIndexStr = formData.get('chunkIndex') as string
    const totalChunksStr = formData.get('totalChunks') as string
    const fileHash = formData.get('fileHash') as string
    const fileName = formData.get('fileName') as string
    const mimeType = formData.get('mimeType') as string || ''

    // 验证必需字段
    if (!file) {
      return NextResponse.json(
        { error: '文件不能为空' },
        { status: 400 }
      )
    }

    const chunkIndex = parseInt(chunkIndexStr)
    const totalChunks = parseInt(totalChunksStr)

    if (isNaN(chunkIndex) || chunkIndex < 0) {
      return NextResponse.json(
        { error: '无效的分片索引' },
        { status: 400 }
      )
    }

    if (isNaN(totalChunks) || totalChunks < 1) {
      return NextResponse.json(
        { error: '无效的分片总数' },
        { status: 400 }
      )
    }

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

    // 验证文件类型
    const fileTypeValidation = validateFileType(fileName, file.type || mimeType)
    if (!fileTypeValidation.valid) {
      return NextResponse.json(
        { error: fileTypeValidation.error! },
        { status: 400 }
      )
    }

    // 检查文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `文件大小超过限制 (${MAX_FILE_SIZE / 1024 / 1024}MB)` },
        { status: 400 }
      )
    }

    // 确保分片目录存在
    await mkdir(CHUNK_DIR, { recursive: true })

    // 读取文件内容为 Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 保存分片文件
    const chunkFileName = `${fileHash}_chunk_${chunkIndex}`
    const chunkPath = join(CHUNK_DIR, chunkFileName)
    await writeFile(chunkPath, buffer)

    // 记录分片上传信息（用于进度追踪和断点续传）
    try {
      await prisma.uploadChunk.create({
        data: {
          fileHash,
          chunkIndex,
          totalChunks,
          fileName,
          mimeType: file.type || mimeType,
          fileSize: file.size,
        },
      })
    } catch (dbError) {
      // 数据库记录失败不影响文件上传，只记录日志
      console.error('Failed to record chunk in database:', dbError)
    }

    return NextResponse.json({
      success: true,
      chunkIndex,
      totalChunks,
      message: `分片 ${chunkIndex + 1}/${totalChunks} 上传成功`,
    })
  } catch (error) {
    console.error('Error uploading chunk:', error)
    return NextResponse.json(
      { error: '上传失败，请重试' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/upload/chunk - 获取已上传的分片信息（用于断点续传）
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
      select: { chunkIndex: true },
      orderBy: { chunkIndex: 'asc' },
    })

    const uploadedIndices = uploadedChunks.map(c => c.chunkIndex)

    // 获取总片数（从第一个记录中获取）
    let totalChunks = 0
    if (uploadedChunks.length > 0) {
      const firstChunk = uploadedChunks[0]
      totalChunks = firstChunk.totalChunks || 0
    }

    return NextResponse.json({
      uploadedChunks: uploadedIndices,
      totalChunks,
    })
  } catch (error) {
    console.error('Error getting uploaded chunks:', error)
    return NextResponse.json(
      { error: '查询失败' },
      { status: 500 }
    )
  }
}
