'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

export default function WechatLoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [sessionKey, setSessionKey] = useState('')
  const [scanStatus, setScanStatus] = useState<'pending' | 'scanned' | 'confirmed' | 'expired'>('pending')
  const [countdown, setCountdown] = useState(300) // 5 minutes in seconds

  // Fetch QR code on component mount
  useEffect(() => {
    fetchQrCode()
  }, [])

  // Poll for login status
  useEffect(() => {
    if (!sessionKey) return

    const interval = setInterval(() => {
      checkLoginStatus()
    }, 2000) // Check every 2 seconds

    return () => clearInterval(interval)
  }, [sessionKey])

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      setScanStatus('expired')
      return
    }

    const timer = setInterval(() => {
      setCountdown(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [countdown])

  const fetchQrCode = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch('/api/auth/wechat/login')
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to load QR code')
        return
      }

      setQrCodeUrl(data.qrCodeUrl)
      setSessionKey(data.sessionKey)
      setCountdown(data.expiresIn || 300)
      setScanStatus('pending')
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const checkLoginStatus = async () => {
    if (!sessionKey) return

    try {
      const response = await fetch(`/api/auth/wechat/status?sessionKey=${sessionKey}`)
      const data = await response.json()

      if (response.ok && data.status === 'confirmed') {
        // Login successful
        if (data.token) {
          localStorage.setItem('token', data.token)
        }
        login(data.user)
        router.push('/game')
      } else if (data.status === 'scanned') {
        setScanStatus('scanned')
      } else if (data.status === 'expired') {
        setScanStatus('expired')
      }
    } catch (err) {
      console.error('Status check error:', err)
    }
  }

  const handleRefresh = () => {
    if (countdown > 0) {
      // Force refresh
      fetchQrCode()
    } else {
      // QR code expired, fetch new one
      fetchQrCode()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-purple-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              微信登录
            </h1>
            <p className="text-gray-600">
              使用微信扫码登录，安全便捷
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-gray-600">加载中...</p>
            </div>
          )}

          {/* QR Code display */}
          {!isLoading && qrCodeUrl && (
            <div className="space-y-6">
              {/* QR Code */}
              <div className="flex flex-col items-center">
                <div className="w-64 h-64 bg-gray-100 rounded-lg overflow-hidden mb-4 border-2 border-indigo-200">
                  {/* Use WeChat's QR code URL directly */}
                  <img
                    src={qrCodeUrl}
                    alt="WeChat Login QR Code"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // If image fails to load, show a placeholder
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjEyOCIgeT0iMTI4IiBmb250LWZhbWlseT0iYXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5XZUNoYXQgUVIgQ29kZTwvdGV4dD48L3N2Zz4='
                    }}
                  />
                </div>

                {/* Status indicator */}
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                  scanStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  scanStatus === 'scanned' ? 'bg-green-100 text-green-800' :
                  scanStatus === 'expired' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {scanStatus === 'pending' && '请使用微信扫描二维码'}
                  {scanStatus === 'scanned' && '已扫描，请在手机上确认登录'}
                  {scanStatus === 'expired' && '二维码已过期'}
                  {scanStatus === 'confirmed' && '登录成功，跳转中...'}
                </div>

                {/* Countdown timer */}
                {scanStatus !== 'expired' && (
                  <p className="mt-2 text-sm text-gray-500">
                    剩余时间：{formatTime(countdown)}
                  </p>
                )}
              </div>

              {/* Refresh button */}
              {scanStatus === 'expired' && (
                <Button
                  onClick={handleRefresh}
                  variant="primary"
                  size="lg"
                  className="w-full"
                >
                  刷新二维码
                </Button>
              )}

              {/* Instructions */}
              <div className="bg-indigo-50 rounded-lg p-4">
                <h3 className="font-medium text-indigo-900 mb-2">登录步骤：</h3>
                <ol className="text-sm text-indigo-700 space-y-1 list-decimal list-inside">
                  <li>打开微信</li>
                  <li>使用"扫一扫"功能</li>
                  <li>扫描上方二维码</li>
                  <li>在手机上确认登录</li>
                </ol>
              </div>
            </div>
          )}

          {/* Alternative login methods */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-gray-600 mb-4">或使用其他方式登录</p>
            <div className="space-y-3">
              <Link
                href="/auth/login"
                className="block w-full py-3 px-4 text-center border border-indigo-200 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                账号密码登录
              </Link>
              <Link
                href="/auth/register"
                className="block w-full py-3 px-4 text-center border border-indigo-200 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                注册新账号
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
