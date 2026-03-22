'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed')
        return
      }

      // Store token in localStorage
      if (data.token) {
        localStorage.setItem('token', data.token)
      }

      // Update auth context
      login(data.user)

      // Redirect to game page
      router.push('/game')
    } catch (err) {
      setError('Network error. Please try again.')
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
              欢迎回来
            </h1>
            <p className="text-gray-600">
              登录你的账号，继续学习旅程
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="用户名"
              name="username"
              type="text"
              placeholder="请输入用户名"
              value={formData.username}
              onChange={handleChange}
              required
              autoComplete="username"
            />

            <Input
              label="密码"
              name="password"
              type="password"
              placeholder="请输入密码"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              {isLoading ? '登录中...' : '登录'}
            </Button>
          </form>

          {/* Footer links */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              还没有账号？{' '}
              <Link
                href="/auth/register"
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                立即注册
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
