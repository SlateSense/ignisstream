import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// CSRF token store
const csrfTokens = new Map<string, { token: string; expires: number }>()

interface SecurityConfig {
  rateLimit: {
    windowMs: number
    maxRequests: number
  }
  csrf: {
    tokenExpiry: number
  }
}

const defaultConfig: SecurityConfig = {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100 // requests per window
  },
  csrf: {
    tokenExpiry: 24 * 60 * 60 * 1000 // 24 hours
  }
}

export class SecurityMiddleware {
  private config: SecurityConfig

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  // Rate limiting
  private isRateLimited(identifier: string): boolean {
    const now = Date.now()
    const rateLimitData = rateLimitStore.get(identifier)

    if (!rateLimitData || now > rateLimitData.resetTime) {
      // Reset window
      rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + this.config.rateLimit.windowMs
      })
      return false
    }

    if (rateLimitData.count >= this.config.rateLimit.maxRequests) {
      return true
    }

    rateLimitData.count++
    return false
  }

  // Get client identifier for rate limiting
  private getClientIdentifier(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = forwarded?.split(',')[0] || realIp || 'unknown'
    
    // Include user agent for more specific limiting
    const userAgent = request.headers.get('user-agent') || 'unknown'
    return `${ip}-${userAgent.slice(0, 100)}`
  }

  // CSRF token generation and validation
  generateCSRFToken(): string {
    const token = crypto.randomUUID()
    const expires = Date.now() + this.config.csrf.tokenExpiry
    csrfTokens.set(token, { token, expires })
    return token
  }

  validateCSRFToken(token: string): boolean {
    const tokenData = csrfTokens.get(token)
    if (!tokenData || Date.now() > tokenData.expires) {
      if (tokenData) csrfTokens.delete(token)
      return false
    }
    return true
  }

  // Security headers
  private addSecurityHeaders(response: NextResponse): NextResponse {
    // Prevent clickjacking
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('Content-Security-Policy', 
      "frame-ancestors 'none'; " +
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "img-src 'self' data: blob: https: http:; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "connect-src 'self' https: wss:; " +
      "media-src 'self' blob: https:; " +
      "object-src 'none'; " +
      "base-uri 'self';"
    )

    // Prevent MIME sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff')
    
    // XSS Protection (legacy but still useful)
    response.headers.set('X-XSS-Protection', '1; mode=block')
    
    // Referrer policy
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    // HSTS for HTTPS
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    }

    // Permissions policy
    response.headers.set('Permissions-Policy', 
      'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
    )

    return response
  }

  // Main middleware function
  async handle(request: NextRequest): Promise<NextResponse> {
    const { pathname, searchParams } = request.nextUrl
    
    // Skip security checks for static files and Next.js internals  
    if (this.shouldSkipSecurity(pathname)) {
      return NextResponse.next()
    }

    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    try {
      // 1. Rate limiting
      const clientId = this.getClientIdentifier(request)
      if (this.isRateLimited(clientId)) {
        return new NextResponse('Too Many Requests', { 
          status: 429,
          headers: {
            'Retry-After': '900' // 15 minutes
          }
        })
      }

      // 2. CSRF protection for state-changing operations
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
        const contentType = request.headers.get('content-type') || ''
        
        // Skip CSRF for API calls with proper authorization
        if (!pathname.startsWith('/api/') || !contentType.includes('application/json')) {
          const csrfToken = request.headers.get('x-csrf-token') || 
                           searchParams.get('csrf_token')
          
          if (!csrfToken || !this.validateCSRFToken(csrfToken)) {
            return new NextResponse('CSRF token missing or invalid', { status: 403 })
          }
        }
      }

      // 3. Validate Origin header for API requests
      if (pathname.startsWith('/api/')) {
        const origin = request.headers.get('origin')
        const host = request.headers.get('host')
        
        if (origin && host && !this.isValidOrigin(origin, host)) {
          return new NextResponse('Invalid origin', { status: 403 })
        }
      }

      // 4. Authentication check for protected routes
      const isProtectedRoute = this.isProtectedRoute(pathname)
      if (isProtectedRoute) {
        const isAuthenticated = await this.checkAuthentication(request)
        if (!isAuthenticated) {
          // Redirect to login for web routes, return 401 for API routes
          if (pathname.startsWith('/api/')) {
            return new NextResponse('Unauthorized', { status: 401 })
          } else {
            const loginUrl = new URL('/auth/login', request.url)
            loginUrl.searchParams.set('redirect', pathname)
            return NextResponse.redirect(loginUrl)
          }
        }
      }

      // 5. Add security headers
      response = this.addSecurityHeaders(response)

      return response

    } catch (error) {
      console.error('Security middleware error:', error)
      
      // Don't expose internal errors
      return new NextResponse('Internal Server Error', { status: 500 })
    }
  }

  private shouldSkipSecurity(pathname: string): boolean {
    const skipPatterns = [
      /^\/_next\/static/,
      /^\/_next\/image/,
      /^\/favicon\.ico$/,
      /^\/api\/webhooks/,
      /\.(svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$/
    ]
    
    return skipPatterns.some(pattern => pattern.test(pathname))
  }

  private isValidOrigin(origin: string, host: string): boolean {
    const allowedOrigins = [
      `https://${host}`,
      `http://${host}`, // Only for development
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ]
    
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:3000', 'http://127.0.0.1:3000')
    }
    
    return allowedOrigins.includes(origin)
  }

  private isProtectedRoute(pathname: string): boolean {
    const protectedPatterns = [
      /^\/profile/,
      /^\/settings/,
      /^\/messages/,
      /^\/notifications/,
      /^\/streaming\/dashboard/,
      /^\/post\/create/,
      /^\/post\/edit/,
      /^\/api\/(?!auth)/,
      /^\/tournaments\/create/,
      /^\/teams/
    ]
    
    return protectedPatterns.some(pattern => pattern.test(pathname))
  }

  private async checkAuthentication(request: NextRequest): Promise<boolean> {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!url || !key) return false

      const supabase = createServerClient(url, key, {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set() {},
          remove() {}
        },
      })

      const { data: { user } } = await supabase.auth.getUser()
      return !!user
    } catch {
      return false
    }
  }

  // Clean up expired tokens periodically
  static cleanupExpiredTokens() {
    const now = Date.now()
    
    // Clean rate limit store
    for (const [key, data] of rateLimitStore.entries()) {
      if (now > data.resetTime) {
        rateLimitStore.delete(key)
      }
    }
    
    // Clean CSRF tokens
    for (const [key, data] of csrfTokens.entries()) {
      if (now > data.expires) {
        csrfTokens.delete(key)
      }
    }
  }
}

// Export singleton instance
export const securityMiddleware = new SecurityMiddleware()

// Schedule cleanup every hour
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    SecurityMiddleware.cleanupExpiredTokens()
  }, 60 * 60 * 1000)
}
