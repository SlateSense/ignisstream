import { NextRequest } from 'next/server'
import { ApiProtection } from '@/lib/security/api-protection'

export const POST = ApiProtection.withAuth(
  async ({ user, request }) => {
    // Session validation logic
    const userAgent = request.headers.get('user-agent')
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    'unknown'

    // Log successful session validation for security monitoring
    console.info('Session validated', {
      userId: user.id,
      userAgent,
      clientIP,
      timestamp: new Date().toISOString()
    })

    return Response.json({ 
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      sessionInfo: {
        validatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
      }
    })
  },
  {
    rateLimit: { maxRequests: 30, windowMs: 60000 } // 30 requests per minute
  }
)
