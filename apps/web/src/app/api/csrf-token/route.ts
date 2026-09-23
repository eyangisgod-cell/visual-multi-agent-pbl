import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

/**
 * Generate a secure random CSRF token
 */
function generateCsrfToken(): string {
  return randomBytes(32).toString('hex')
}

export async function GET(request: NextRequest) {
  const token = generateCsrfToken()

  const response = NextResponse.json({ token })

  // Set CSRF token in HTTP-only cookie
  response.cookies.set('csrf-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 3600 // 1 hour
  })

  return response
}
