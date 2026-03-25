import { NextRequest } from 'next/server'
import { ApiProtection, apiSchemas } from '@/lib/security/api-protection'
import { z } from 'zod'
import { createServerClient } from '@supabase/ssr'

const securityReportSchema = z.object({
  type: z.enum(['xss_attempt', 'csrf_attempt', 'suspicious_activity', 'data_breach']),
  description: z.string().min(1).max(1000),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  metadata: z.record(z.any()).optional(),
  timestamp: z.string().datetime(),
  userAgent: z.string().max(500),
  url: z.string().url()
})

export const POST = ApiProtection.withAuth(
  async ({ user, request }) => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!url || !serviceKey) {
      throw new Error('Supabase not configured')
    }

    const supabase = createServerClient(url, serviceKey, {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set() {},
        remove() {}
      }
    })

    const body = await request.json()
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    'unknown'

    // Log the security report
    const { error } = await supabase
      .from('security_logs')
      .insert({
        event_type: body.type,
        user_id: user.id,
        ip_address: clientIP,
        user_agent: body.userAgent,
        details: {
          description: body.description,
          severity: body.severity,
          metadata: body.metadata || {},
          reported_url: body.url,
          timestamp: body.timestamp
        }
      })

    if (error) {
      console.error('Failed to log security report:', error)
      throw new Error('Failed to record security report')
    }

    // For critical security issues, send immediate alerts
    if (body.severity === 'critical') {
      console.error('CRITICAL SECURITY ALERT:', {
        type: body.type,
        description: body.description,
        userId: user.id,
        ip: clientIP,
        url: body.url,
        timestamp: body.timestamp
      })

      // In a production environment, you would send alerts to:
      // - Security team via email/Slack
      // - Monitoring system (Sentry, DataDog, etc.)
      // - Incident management system
    }

    return Response.json({ 
      success: true,
      message: 'Security report recorded',
      reportId: crypto.randomUUID(), // In real system, use the actual DB ID
      severity: body.severity
    })
  },
  {
    validateBody: securityReportSchema,
    rateLimit: { maxRequests: 50, windowMs: 60000 } // 50 reports per minute
  }
)
