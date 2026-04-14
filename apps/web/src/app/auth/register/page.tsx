'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'

export default function RegisterPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [csrfToken, setCsrfToken] = useState('')
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    grade: '' as string,
    invitationCode: ''
  })

  // Fetch CSRF token on component mount
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch('/api/csrf-token')
        const data = await response.json()
        setCsrfToken(data.token)
      } catch (err) {
        console.error('Failed to fetch CSRF token:', err)
      }
    }
    fetchCsrfToken()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致')
      setIsLoading(false)
      return
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('密码长度至少为 6 位')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          nickname: formData.nickname || undefined,
          grade: formData.grade ? parseInt(formData.grade) : undefined,
          invitationCode: formData.invitationCode || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '注册失败')
        return
      }

      // Auto login after registration
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        })
      })

      const loginData = await loginResponse.json()

      if (loginData.token) {
        localStorage.setItem('token', loginData.token)
        login(loginData.user)
      }

      // Redirect to home page
      router.push('/')
    } catch (err) {
      setError('网络错误，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-purple-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              创建新账号
            </h1>
            <p className="text-gray-600">
              加入可视项目式学习平台，开始你的学习旅程
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Register form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="用户名"
              name="username"
              type="text"
              placeholder="3-50 位，只能包含字母、数字和下划线"
              value={formData.username}
              onChange={handleChange}
              required
              autoComplete="username"
            />

            <Input
              label="昵称"
              name="nickname"
              type="text"
              placeholder="显示在个人资料中的名称（可选）"
              value={formData.nickname}
              onChange={handleChange}
              autoComplete="nickname"
            />

            <Input
              label="年级"
              name="grade"
              type="number"
              placeholder="1-12"
              value={formData.grade}
              onChange={handleChange}
              min="1"
              max="12"
            />

            <Input
              label="密码"
              name="password"
              type="password"
              placeholder="至少 6 位"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />

            <Input
              label="确认密码"
              name="confirmPassword"
              type="password"
              placeholder="再次输入密码"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />

            <Input
              label="邀请码"
              name="invitationCode"
              type="text"
              placeholder="8 位邀请码（可选）"
              value={formData.invitationCode}
              onChange={handleChange}
              maxLength={8}
              helperText="有邀请码可以获得额外积分奖励"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-6"
              isLoading={isLoading}
            >
              {isLoading ? '注册中...' : '注册'}
            </Button>
          </form>

          {/* Footer links */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              已有账号？{' '}
              <Link
                href="/auth/login"
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                立即登录
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
