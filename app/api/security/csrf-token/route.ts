import { NextRequest } from 'next/server'
import { ApiProtection } from '@/lib/security/api-protection'

export const POST = ApiProtection.withAuth(
  async ({ user, request }) => {
    // Generate CSRF token - this is now handled by the security middleware
    // but we provide an endpoint for client-side token refresh
    const token = crypto.randomUUID()
    
    return Response.json({ 
      token,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    })
  },
  {
    rateLimit: { maxRequests: 10, windowMs: 60000 } // 10 requests per minute
  }
)
