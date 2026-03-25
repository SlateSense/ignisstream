import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Health check endpoint for monitoring
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Check database connection
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get: (name: string) => request.cookies.get(name)?.value,
          set: () => {},
          remove: () => {}
        }
      }
    )

    // Simple query to test database connectivity
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    const dbStatus = error ? 'error' : 'healthy'
    const responseTime = Date.now() - startTime

    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'IgnisStream API',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      response_time_ms: responseTime,
      checks: {
        database: {
          status: dbStatus,
          response_time_ms: responseTime
        },
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB'
        }
      }
    }

    // Return appropriate status code
    const statusCode = dbStatus === 'healthy' ? 200 : 503

    return NextResponse.json(healthCheck, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('Health check failed:', error)
    
    const failedHealthCheck = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'IgnisStream API',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      error: 'Service unavailable',
      response_time_ms: Date.now() - startTime
    }

    return NextResponse.json(failedHealthCheck, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  }
}
