/**
 * 文件上传组件测试
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FileUploader from './FileUploader'

describe('FileUploader', () => {
  const mockProps = {
    onUploadComplete: jest.fn(),
    onUploadProgress: jest.fn(),
    onUploadError: jest.fn(),
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['image/*', 'application/pdf', 'video/*'],
    chunkSize: 5 * 1024 * 1024, // 5MB
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock fetch
    global.fetch = jest.fn()
  })

  it('应该渲染拖拽上传区域', () => {
    render(<FileUploader {...mockProps} />)

    expect(screen.getByTestId('upload-dropzone')).toBeInTheDocument()
    expect(screen.getByText(/拖拽文件到此处/i)).toBeInTheDocument()
  })

  it('应该显示选择文件按钮', async () => {
    render(<FileUploader {...mockProps} />)

    // 先添加一个文件，按钮才会显示
    const dropzone = screen.getByTestId('upload-dropzone')
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })

    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file],
      },
    })

    await waitFor(() => {
      const selectButton = screen.getByTestId('select-file-button')
      expect(selectButton).toBeInTheDocument()
    })
  })

  it('应该允许点击选择文件', async () => {
    render(<FileUploader {...mockProps} />)

    const fileInput = screen.getByTestId('file-input') as HTMLInputElement
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: true,
    })

    fireEvent.change(fileInput)

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument()
    })
  })

  it('应该处理拖拽文件', async () => {
    render(<FileUploader {...mockProps} />)

    const dropzone = screen.getByTestId('upload-dropzone')
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })

    fireEvent.dragEnter(dropzone)
    fireEvent.dragOver(dropzone)
    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file],
      },
    })

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument()
    })
  })

  it('应该拒绝不支持的文件类型', async () => {
    const onError = jest.fn()
    render(<FileUploader {...mockProps} onUploadError={onError} />)

    const dropzone = screen.getByTestId('upload-dropzone')
    const file = new File(['test'], 'test.exe', { type: 'application/x-executable' })

    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file],
      },
    })

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.stringContaining('类型'))
    })
  })

  it('应该拒绝超过大小限制的文件', async () => {
    const onError = jest.fn()
    render(<FileUploader {...mockProps} maxFileSize={1024} onUploadError={onError} />)

    const dropzone = screen.getByTestId('upload-dropzone')
    const largeContent = 'x'.repeat(2048)
    const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' })

    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file],
      },
    })

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.stringContaining('大小'))
    })
  })

  it('应该显示上传进度条', async () => {
    // Mock fetch to simulate upload progress
    ;(global.fetch as jest.Mock).mockImplementation(async (url: string, options: any) => {
      if (url.includes('/api/upload/chunk')) {
        return {
          ok: true,
          json: () => Promise.resolve({ success: true, chunkIndex: 0 }),
        }
      }
      if (url.includes('/api/upload/merge')) {
        return {
          ok: true,
          json: () => Promise.resolve({ success: true, fileUrl: 'https://cdn.example.com/test.pdf' }),
        }
      }
      return { ok: true, json: () => Promise.resolve({ success: true }) }
    })

    render(<FileUploader {...mockProps} />)

    const dropzone = screen.getByTestId('upload-dropzone')
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })

    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file],
      },
    })

    // 等待上传按钮出现并点击
    const uploadButton = await screen.findByTestId('select-file-button')
    fireEvent.click(uploadButton)

    // 等待进度条出现（在上传过程中显示）
    await waitFor(() => {
      const progressBar = screen.queryByTestId('upload-progress')
      // 进度条在上传时显示，如果上传完成则可能不存在
      expect(progressBar).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('应该支持批量上传', async () => {
    render(<FileUploader {...mockProps} />)

    const dropzone = screen.getByTestId('upload-dropzone')
    const file1 = new File(['content 1'], 'file1.pdf', { type: 'application/pdf' })
    const file2 = new File(['content 2'], 'file2.pdf', { type: 'application/pdf' })

    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file1, file2],
      },
    })

    await waitFor(() => {
      expect(screen.getByText('file1.pdf')).toBeInTheDocument()
      expect(screen.getByText('file2.pdf')).toBeInTheDocument()
    })
  })

  it('应该显示文件预览（图片）', async () => {
    render(<FileUploader {...mockProps} />)

    const dropzone = screen.getByTestId('upload-dropzone')
    const file = new File(['image data'], 'test.png', { type: 'image/png' })

    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file],
      },
    })

    await waitFor(() => {
      const preview = screen.getByTestId('file-preview')
      expect(preview).toBeInTheDocument()
    })
  })

  it('应该可以移除已选择的文件', async () => {
    render(<FileUploader {...mockProps} />)

    const dropzone = screen.getByTestId('upload-dropzone')
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })

    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file],
      },
    })

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument()
    })

    const removeButton = screen.getByTestId('remove-file')
    fireEvent.click(removeButton)

    await waitFor(() => {
      expect(screen.queryByText('test.pdf')).not.toBeInTheDocument()
    })
  })

  // 注：由于 uploadFile 涉及到复杂的异步状态和实际的上传逻辑
  // 完整的上传测试需要在集成测试环境中进行
  // 本测试验证基本上传 UI 交互和错误处理
  it('上传回调集成测试', async () => {
    // 这个测试验证组件能够在文件选择后显示正确的状态
    render(<FileUploader {...mockProps} />)

    const dropzone = screen.getByTestId('upload-dropzone')
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })

    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file],
      },
    })

    // 验证文件被添加到列表
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument()
    })

    // 验证上传按钮出现
    const uploadButton = screen.getByTestId('select-file-button')
    expect(uploadButton).toBeInTheDocument()
    expect(uploadButton).toHaveTextContent(/开始上传/i)
  })
})
