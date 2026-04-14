'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { twMerge } from 'tailwind-merge'
import { clsx } from 'clsx'
import FileUploader from '@/components/Upload/FileUploader'

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs))
}

interface Project {
  id: string
  title: string
  subject?: string
}

interface ProjectsApi {
  projects: Project[]
}

export default function WorkUploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    projectId: ''
  })

  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [coverImageUrl, setCoverImageUrl] = useState<string>('')
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploadedFiles, setUploadedFiles] = useState<{ fileUrl: string; fileName: string; mimeType: string }[]>([])

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects')
      if (res.ok) {
        const data: ProjectsApi = await res.json()
        setProjects(data.projects)
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    }
  }, [])

  // Initial load
  useState(() => {
    fetchProjects()
  })

  // Handle input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Handle cover image change
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle remove cover
  const handleRemoveCover = () => {
    setCoverImage(null)
    setCoverPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = '标题不能为空'
    }

    if (!formData.projectId) {
      newErrors.projectId = '请选择项目'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)

      const res = await fetch('/api/works', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          coverImageUrl: coverImageUrl || undefined,
          status: 'published'
        })
      })

      if (res.ok) {
        const data = await res.json()
        // Redirect to work detail page
        router.push(`/works/${data.work.id}`)
      } else {
        const error = await res.json()
        setErrors({ submit: error.error || '上传失败，请重试' })
      }
    } catch (err) {
      console.error('Failed to create work:', err)
      setErrors({ submit: '上传失败，请重试' })
    } finally {
      setLoading(false)
    }
  }

  // Handle cover upload complete
  const handleCoverUploadComplete = useCallback((result: { fileUrl: string; fileName: string; mimeType: string }) => {
    setCoverImageUrl(result.fileUrl)
    setUploadedFiles(prev => [...prev, result])
  }, [])

  // Handle cover upload error
  const handleCoverUploadError = useCallback((error: string) => {
    setErrors(prev => ({ ...prev, cover: error }))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">上传作品</h1>
          <p className="text-gray-600 mt-1">分享你的学习成果和创意作品</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Title */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              作品标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={cn(
                'w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500',
                errors.title ? 'border-red-500' : 'border-gray-300'
              )}
              placeholder="请输入作品标题"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              作品简介
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="简要介绍你的作品"
            />
          </div>

          {/* Content */}
          <div className="mb-6">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              作品内容
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              rows={10}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono"
              placeholder="请输入作品正文内容..."
            />
          </div>

          {/* Cover Image */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              封面图片
            </label>
            <FileUploader
              multiple={false}
              allowedTypes={['image/*']}
              maxFileSize={10 * 1024 * 1024} // 10MB for cover image
              onUploadComplete={handleCoverUploadComplete}
              onUploadError={handleCoverUploadError}
            />

            {/* Cover Preview */}
            {coverPreview && (
              <div
                data-testid="cover-preview"
                className="mt-4 relative inline-block"
              >
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="h-32 w-auto rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  data-testid="remove-cover"
                  onClick={handleRemoveCover}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Cover upload error */}
            {errors.cover && (
              <p className="mt-2 text-sm text-red-500">{errors.cover}</p>
            )}
          </div>

          {/* Project Selection */}
          <div className="mb-6">
            <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-2">
              所属项目 <span className="text-red-500">*</span>
            </label>
            <select
              id="projectId"
              name="projectId"
              value={formData.projectId}
              onChange={handleInputChange}
              className={cn(
                'w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500',
                errors.projectId ? 'border-red-500' : 'border-gray-300'
              )}
            >
              <option value="">请选择项目</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                  {project.subject ? ` - ${project.subject}` : ''}
                </option>
              ))}
            </select>
            {errors.projectId && (
              <p className="mt-1 text-sm text-red-500">{errors.projectId}</p>
            )}
          </div>

          {/* General Error */}
          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className={cn(
                'px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors',
                loading && 'opacity-50 cursor-not-allowed'
              )}
            >
              {loading ? '上传中...' : '上传作品'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
