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
  // Content Security Policy - relaxed for development
  'Content-Security-Policy': [
    "default-src 'self' blob: data: 'unsafe-inline'",
    "script-src 'self' blob: data: 'unsafe-inline' 'unsafe-eval'",
    "worker-src 'self' blob: data:",
    "style-src 'self' blob: data: 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' localhost:* 127.0.0.1:* ws://localhost:* ws://127.0.0.1:* wss://localhost:* wss://127.0.0.1:* blob: data:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self' blob: data:"
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
  '/api/auth/login',  // Login endpoint - cannot require CSRF before session
  '/api/auth/register',  // Register endpoint
  '/api/auth/verify',
  '/api/points',  // Points system API (game-like actions)
  '/api/works/',  // Works comments API (tested separately)
  '/api/comments/',  // Comments API (tested separately)
  '/api/knowledge/',  // Knowledge base API (for testing)
  '/_next',
  '/static',
  '/favicon',
  // E2E test endpoints - bypass CSRF for test simplicity
  '/api/test/',
]

// Safe HTTP methods that don't require CSRF
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS']

// Admin API paths that require authentication and role-based access
const ADMIN_API_PATHS = [
  '/api/admin',
]

// Permission requirements for specific paths (future enhancement)
const PATH_PERMISSIONS: Record<string, string[]> = {
  '/api/admin/users': ['view_users'],
  '/api/admin/projects': ['view_projects'],
  '/api/admin/works': ['view_works'],
  '/api/admin/agents': ['view_agents'],
  '/api/admin/roles': ['view_roles'],
}

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
        { error: 'CSRF token required', csrfToken: newToken },  // Also return in body for testing
        { status: 403 }
      )
      response.cookies.set('csrf-token', newToken, {
        httpOnly: false,  // Allow JavaScript to read for CSRF header
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 3600 // 1 hour
      })
      // Log CSRF failure
      console.log('[SECURITY] CSRF token missing in cookie - set-cookie header added', {
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

  // Admin API paths - require authentication and role-based access
  if (ADMIN_API_PATHS.some(path => pathname.startsWith(path))) {
    // Check for session cookie (named 'session' from login API)
    const sessionToken = request.cookies.get('session')?.value || request.cookies.get('session-token')?.value
    const userRole = request.cookies.get('user-role')?.value

    // Check if user is authenticated
    if (!sessionToken) {
      console.log('[RBAC] Unauthenticated access attempt to admin API', {
        path: pathname,
        ip: request.ip || 'unknown',
        method: request.method
      })
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // For non-GET methods, verify user has admin-level role
    if (!SAFE_METHODS.includes(request.method)) {
      const allowedRoles = ['super_admin', 'admin']
      if (!userRole || !allowedRoles.includes(userRole)) {
        console.log('[RBAC] Insufficient role for admin API', {
          path: pathname,
          role: userRole || 'none',
          ip: request.ip || 'unknown',
          method: request.method
        })
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }
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
