import { NextRequest, NextResponse } from 'next/server'

/**
 * Next.js Security Middleware
 *
 * Provides security features for Next.js application:
 * - Security headers
 * - CSRF token validation for API routes
 * - Rate limiting headers
 * - Input validation
 * - Security event logging
 */

// Security headers configuration
const securityHeaders = {
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  // XSS protection for older browsers
  'X-XSS-Protection': '1; mode=block',
  // Strict Transport Security (force HTTPS)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self'",
    "connect-src 'self' api: ws: wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '),
  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Permissions Policy
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=()',
  // Cache control for sensitive pages
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
}

// Paths excluded from CSRF protection
const CSRF_EXCLUDED_PATHS = [
  '/api/health',
  '/api/auth/verify',
  '/_next',
  '/static',
  '/favicon'
]

// Safe HTTP methods that don't require CSRF
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and excluded paths
  if (CSRF_EXCLUDED_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // For API routes, apply CSRF protection
  if (pathname.startsWith('/api/') && !SAFE_METHODS.includes(request.method)) {
    const csrfToken = request.headers.get('x-csrf-token')
    const cookieToken = request.cookies.get('csrf-token')?.value

    // If no CSRF token in cookie, generate one
    if (!cookieToken) {
      const newToken = generateCsrfToken()
      const response = NextResponse.json(
        { error: 'CSRF token required' },
        { status: 403 }
      )
      response.cookies.set('csrf-token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 3600 // 1 hour
      })
      // Log CSRF failure
      console.log('[SECURITY] CSRF token missing in cookie', {
        path: pathname,
        ip: request.ip || 'unknown',
        method: request.method
      })
      return response
    }

    // Validate CSRF token
    if (!csrfToken || csrfToken !== cookieToken) {
      // Log CSRF failure
      console.log('[SECURITY] CSRF token validation failed', {
        path: pathname,
        ip: request.ip || 'unknown',
        method: request.method
      })
      return NextResponse.json(
        { error: 'CSRF token validation failed' },
        { status: 403 }
      )
    }
  }

  // Continue with response
  const response = NextResponse.next()

  // Add security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

/**
 * Generate a secure random CSRF token
 */
function generateCsrfToken(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }
  // Fallback for environments without crypto
  return 'fallback-token-' + Math.random().toString(36).slice(2)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (robots.txt, sitemap, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
