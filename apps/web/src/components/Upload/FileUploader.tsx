'use client'

import React from 'react'
import { useState, useCallback, useRef } from 'react'
import { twMerge } from 'tailwind-merge'
import { clsx } from 'clsx'

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs))
}

interface FileUploaderProps {
  onUploadComplete?: (result: { fileUrl: string; fileName: string; mimeType: string }) => void
  onUploadProgress?: (progress: number) => void
  onUploadError?: (error: string) => void
  maxFileSize?: number // bytes
  allowedTypes?: string[]
  chunkSize?: number // bytes
  multiple?: boolean
  disabled?: boolean
  className?: string
}

interface UploadedFile {
  id: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
  fileUrl?: string
}

const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024 // 5MB
const DEFAULT_MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

export default function FileUploader({
  onUploadComplete,
  onUploadProgress,
  onUploadError,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  allowedTypes = ['image/*', 'application/pdf', 'video/*', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.*'],
  chunkSize = DEFAULT_CHUNK_SIZE,
  multiple = true,
  disabled = false,
  className,
}: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)

  /**
   * 计算文件 hash
   */
  const calculateFileHash = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  /**
   * 验证文件类型
   */
  const validateFileType = (file: File): { valid: boolean; error?: string } => {
    const fileType = file.type
    const fileName = file.name

    // 检查允许的类型
    const isAllowed = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        // 通配符匹配，如 image/*
        const prefix = type.slice(0, -2)
        return fileType.startsWith(prefix)
      }
      if (type.includes('*')) {
        // 如 application/vnd.openxmlformats-officedocument.*
        const pattern = type.replace(/\./g, '\\.').replace('*', '.*')
        const regex = new RegExp(`^${pattern}$`)
        return regex.test(fileType)
      }
      return fileType === type
    })

    if (!isAllowed) {
      return { valid: false, error: `不支持的文件类型：${fileType || fileName.split('.').pop()}` }
    }

    return { valid: true }
  }

  /**
   * 验证文件大小
   */
  const validateFileSize = (file: File): { valid: boolean; error?: string } => {
    if (file.size > maxFileSize) {
      const maxSizeMB = (maxFileSize / 1024 / 1024).toFixed(1)
      return { valid: false, error: `文件大小超过限制 (${maxSizeMB}MB)` }
    }
    return { valid: true }
  }

  /**
   * 上传单个分片
   */
  const uploadChunk = async (
    file: File,
    chunkIndex: number,
    totalChunks: number,
    fileHash: string
  ): Promise<void> => {
    const start = chunkIndex * chunkSize
    const end = Math.min(start + chunkSize, file.size)
    const chunk = file.slice(start, end)

    const formData = new FormData()
    formData.append('file', chunk)
    formData.append('chunkIndex', chunkIndex.toString())
    formData.append('totalChunks', totalChunks.toString())
    formData.append('fileHash', fileHash)
    formData.append('fileName', file.name)
    formData.append('mimeType', file.type)

    const response = await fetch('/api/upload/chunk', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '上传失败')
    }
  }

  /**
   * 合并文件分片
   */
  const mergeChunks = async (
    fileHash: string,
    fileName: string,
    totalChunks: number,
    mimeType: string
  ): Promise<{ fileUrl: string }> => {
    const formData = new FormData()
    formData.append('fileHash', fileHash)
    formData.append('fileName', fileName)
    formData.append('totalChunks', totalChunks.toString())
    formData.append('mimeType', mimeType)

    const response = await fetch('/api/upload/merge', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '合并失败')
    }

    return response.json()
  }

  /**
   * 上传单个文件
   */
  const uploadFile = async (fileId: string, file: File) => {
    try {
      setFiles(prev => prev.map(f =>
        f.id === fileId ? { ...f, status: 'uploading', progress: 0 } : f
      ))

      // 计算文件 hash
      const fileHash = await calculateFileHash(file)

      // 计算分片数
      const totalChunks = Math.ceil(file.size / chunkSize)

      // 上传每个分片
      for (let i = 0; i < totalChunks; i++) {
        await uploadChunk(file, i, totalChunks, fileHash)

        // 更新进度
        const progress = ((i + 1) / totalChunks) * 100
        setFiles(prev => prev.map(f =>
          f.id === fileId ? { ...f, progress } : f
        ))
        onUploadProgress?.(progress)
      }

      // 合并分片
      const result = await mergeChunks(fileHash, file.name, totalChunks, file.type)

      // 更新状态为完成
      setFiles(prev => prev.map(f =>
        f.id === fileId
          ? { ...f, status: 'completed', progress: 100, fileUrl: result.fileUrl }
          : f
      ))

      onUploadComplete?.({
        fileUrl: result.fileUrl,
        fileName: file.name,
        mimeType: file.type,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '上传失败'
      setFiles(prev => prev.map(f =>
        f.id === fileId ? { ...f, status: 'error', error: errorMessage } : f
      ))
      onUploadError?.(errorMessage)
    }
  }

  /**
   * 处理文件选择
   */
  const handleFiles = useCallback((selectedFiles: File[]) => {
    const newFiles: UploadedFile[] = []
    const errors: string[] = []

    for (const file of selectedFiles) {
      // 验证文件类型
      const typeValidation = validateFileType(file)
      if (!typeValidation.valid) {
        errors.push(typeValidation.error!)
        continue
      }

      // 验证文件大小
      const sizeValidation = validateFileSize(file)
      if (!sizeValidation.valid) {
        errors.push(sizeValidation.error!)
        continue
      }

      const newFile: UploadedFile = {
        id: Math.random().toString(36).substring(2),
        file,
        progress: 0,
        status: 'pending',
      }
      newFiles.push(newFile)
    }

    if (errors.length > 0) {
      errors.forEach(err => onUploadError?.(err))
    }

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles])
    }
  }, [onUploadError])

  /**
   * 处理拖拽进入
   */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setDragOver(true)
    }
  }, [disabled])

  /**
   * 处理拖拽离开
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }, [])

  /**
   * 处理拖拽放置
   */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)

    if (disabled) return

    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }, [disabled, handleFiles])

  /**
   * 处理文件输入变化
   */
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    handleFiles(selectedFiles)

    // 重置 input 以允许重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFiles])

  /**
   * 开始上传
   */
  const startUpload = useCallback(async () => {
    const pendingFiles = files.filter(f => f.status === 'pending')
    if (pendingFiles.length === 0) return

    setUploading(true)

    // 依次上传每个文件
    for (const file of pendingFiles) {
      await uploadFile(file.id, file.file)
    }

    setUploading(false)
  }, [files])

  /**
   * 移除文件
   */
  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }, [])

  /**
   * 格式化文件大小
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  }

  /**
   * 获取文件图标
   */
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return (
        <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    }
    if (file.type === 'application/pdf') {
      return (
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    }
    if (file.type.startsWith('video/')) {
      return (
        <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    }
    return (
      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  }

  /**
   * 渲染文件预览
   */
  const renderFilePreview = (file: UploadedFile) => {
    if (file.file.type.startsWith('image/')) {
      return (
        <img
          src={URL.createObjectURL(file.file)}
          alt={file.file.name}
          className="w-full h-full object-cover rounded-lg"
          data-testid="file-preview"
        />
      )
    }
    return getFileIcon(file.file)
  }

  return (
    <div className={cn('w-full', className)}>
      {/* 拖拽上传区域 */}
      <div
        data-testid="upload-dropzone"
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center transition-colors',
          dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400',
          disabled && 'opacity-50 cursor-not-allowed',
          'cursor-pointer'
        )}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center gap-4">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <div>
            <p className="text-lg font-medium text-gray-700">
              拖拽文件到此处
            </p>
            <p className="text-sm text-gray-500 mt-1">
              或点击选择文件，支持批量上传
            </p>
            <p className="text-xs text-gray-400 mt-2">
              最大文件大小：{(maxFileSize / 1024 / 1024).toFixed(0)}MB
            </p>
          </div>
        </div>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        data-testid="file-input"
        type="file"
        multiple={multiple}
        className="hidden"
        onChange={handleFileInputChange}
        disabled={disabled}
      />

      {/* 文件列表 */}
      {files.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="text-sm font-medium text-gray-700">
            已选择 {files.length} 个文件
          </h3>

          {files.map((fileItem) => (
            <div
              key={fileItem.id}
              className={cn(
                'flex items-center gap-4 p-4 bg-gray-50 rounded-lg border',
                fileItem.status === 'error' && 'border-red-200 bg-red-50',
                fileItem.status === 'completed' && 'border-green-200 bg-green-50'
              )}
            >
              {/* 文件预览/图标 */}
              <div className="w-12 h-12 flex-shrink-0">
                {renderFilePreview(fileItem)}
              </div>

              {/* 文件信息 */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {fileItem.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(fileItem.file.size)}
                </p>

                {/* 进度条 */}
                {fileItem.status === 'uploading' && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>上传中...</span>
                      <span>{fileItem.progress.toFixed(0)}%</span>
                    </div>
                    <div
                      data-testid="upload-progress"
                      className="w-full h-2 bg-gray-200 rounded-full overflow-hidden"
                    >
                      <div
                        className="h-full bg-indigo-600 transition-all duration-300"
                        style={{ width: `${fileItem.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* 状态消息 */}
                {fileItem.status === 'completed' && (
                  <p className="text-xs text-green-600 mt-1">上传成功</p>
                )}
                {fileItem.status === 'error' && (
                  <p className="text-xs text-red-600 mt-1">{fileItem.error}</p>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center gap-2">
                {fileItem.status === 'pending' && (
                  <button
                    type="button"
                    data-testid="remove-file"
                    onClick={() => removeFile(fileItem.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
                {fileItem.status === 'completed' && (
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 上传按钮 */}
      {files.some(f => f.status === 'pending') && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            data-testid="select-file-button"
            onClick={startUpload}
            disabled={uploading}
            className={cn(
              'px-8 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors',
              uploading && 'opacity-50 cursor-not-allowed'
            )}
          >
            {uploading ? '上传中...' : `开始上传 (${files.filter(f => f.status === 'pending').length} 个文件)`}
          </button>
        </div>
      )}
    </div>
  )
}
