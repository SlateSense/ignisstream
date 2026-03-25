import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'
import { validateApiRequest, validationSchemas } from './input-validation'

export interface AuthenticatedUser {
  id: string
  email: string
  role?: string
}

export interface ApiContext {
  user: AuthenticatedUser
  request: NextRequest
  params?: Record<string, string | string[]>
}

// API rate limiting per user/endpoint
const apiRateLimits = new Map<string, { count: number; resetTime: number }>()

export class ApiProtection {
  // Authenticate API request
  static async authenticateRequest(request: NextRequest): Promise<AuthenticatedUser> {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!url || !key) {
      throw new Error('Supabase not configured')
    }

    const supabase = createServerClient(url, key, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set() {},
        remove() {}
      },
    })

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      throw new Error('Authentication required')
    }

    return {
      id: user.id,
      email: user.email || '',
      role: user.app_metadata?.role || 'user'
    }
  }

  // Check user permissions
  static checkPermissions(user: AuthenticatedUser, requiredRole: string = 'user'): boolean {
    const roleHierarchy = {
      'user': 0,
      'moderator': 1,
      'admin': 2,
      'super_admin': 3
    }

    const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0

    return userLevel >= requiredLevel
  }

  // Rate limiting for API endpoints
  static checkApiRateLimit(userId: string, endpoint: string, maxRequests: number = 60, windowMs: number = 60000): boolean {
    const key = `${userId}:${endpoint}`
    const now = Date.now()
    const rateLimitData = apiRateLimits.get(key)

    if (!rateLimitData || now > rateLimitData.resetTime) {
      apiRateLimits.set(key, {
        count: 1,
        resetTime: now + windowMs
      })
      return false
    }

    if (rateLimitData.count >= maxRequests) {
      return true
    }

    rateLimitData.count++
    return false
  }

  // Validate request body against schema
  static validateRequestBody<T>(request: NextRequest, schema: z.ZodSchema<T>): Promise<T> {
    return request.json().then(data => validateApiRequest(schema, data))
  }

  // Secure API wrapper
  static withAuth<T = any>(
    handler: (context: ApiContext) => Promise<Response>,
    options: {
      requiredRole?: string
      rateLimit?: { maxRequests: number; windowMs: number }
      validateBody?: z.ZodSchema<T>
    } = {}
  ) {
    return async (
      request: NextRequest,
      routeContext?: { params?: Record<string, string | string[]> }
    ) => {
      try {
        // 1. Authentication
        const user = await this.authenticateRequest(request)

        // 2. Permission check
        if (options.requiredRole && !this.checkPermissions(user, options.requiredRole)) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          )
        }

        // 3. Rate limiting
        if (options.rateLimit) {
          const endpoint = new URL(request.url).pathname
          const isRateLimited = this.checkApiRateLimit(
            user.id,
            endpoint,
            options.rateLimit.maxRequests,
            options.rateLimit.windowMs
          )

          if (isRateLimited) {
            return NextResponse.json(
              { error: 'Rate limit exceeded' },
              { status: 429 }
            )
          }
        }

        // 4. Request body validation
        if (options.validateBody && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
          try {
            await this.validateRequestBody(request, options.validateBody)
          } catch (error) {
            if (error instanceof z.ZodError) {
              return NextResponse.json(
                { 
                  error: 'Validation failed', 
                  details: error.errors.map(e => ({ 
                    field: e.path.join('.'),
                    message: e.message 
                  }))
                },
                { status: 400 }
              )
            }
            throw error
          }
        }

        // 5. Call the handler
        const context: ApiContext = { user, request, params: routeContext?.params }
        return await handler(context)

      } catch (error) {
        console.error('API Error:', error)

        // Don't expose internal errors in production
        const isDevelopment = process.env.NODE_ENV === 'development'
        const errorMessage = error instanceof Error && isDevelopment 
          ? error.message 
          : 'Internal server error'

        return NextResponse.json(
          { error: errorMessage },
          { 
            status: error instanceof Error && error.message === 'Authentication required' ? 401 : 500 
          }
        )
      }
    }
  }

  // Public API wrapper (no auth required)
  static withValidation<T = any>(
    handler: (request: NextRequest, validatedData?: T) => Promise<Response>,
    options: {
      validateBody?: z.ZodSchema<T>
      rateLimit?: { maxRequests: number; windowMs: number }
    } = {}
  ) {
    return async (request: NextRequest) => {
      try {
        // 1. Rate limiting (IP-based for public endpoints)
        if (options.rateLimit) {
          const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                          request.headers.get('x-real-ip') || 
                          'unknown'
          const endpoint = new URL(request.url).pathname
          
          const isRateLimited = this.checkApiRateLimit(
            clientIp,
            endpoint,
            options.rateLimit.maxRequests,
            options.rateLimit.windowMs
          )

          if (isRateLimited) {
            return NextResponse.json(
              { error: 'Rate limit exceeded' },
              { status: 429 }
            )
          }
        }

        // 2. Request body validation
        let validatedData: T | undefined
        if (options.validateBody && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
          try {
            validatedData = await this.validateRequestBody(request, options.validateBody)
          } catch (error) {
            if (error instanceof z.ZodError) {
              return NextResponse.json(
                { 
                  error: 'Validation failed', 
                  details: error.errors.map(e => ({ 
                    field: e.path.join('.'),
                    message: e.message 
                  }))
                },
                { status: 400 }
              )
            }
            throw error
          }
        }

        // 3. Call the handler
        return await handler(request, validatedData)

      } catch (error) {
        console.error('API Error:', error)

        const isDevelopment = process.env.NODE_ENV === 'development'
        const errorMessage = error instanceof Error && isDevelopment 
          ? error.message 
          : 'Internal server error'

        return NextResponse.json(
          { error: errorMessage },
          { status: 500 }
        )
      }
    }
  }

  // Clean up expired rate limit entries
  static cleanupRateLimits() {
    const now = Date.now()
    for (const [key, data] of apiRateLimits.entries()) {
      if (now > data.resetTime) {
        apiRateLimits.delete(key)
      }
    }
  }
}

// Common API validation schemas
export const apiSchemas = {
  // Profile update
  updateProfile: z.object({
    display_name: validationSchemas.displayName.optional(),
    bio: validationSchemas.bio.optional(),
    avatar_url: validationSchemas.url.optional(),
  }),

  // Post creation/update
  createPost: z.object({
    title: validationSchemas.postTitle,
    content: validationSchemas.postContent,
    game_id: z.string().uuid().optional(),
    tags: z.array(z.string().max(30)).max(10).optional(),
    is_public: z.boolean().optional(),
  }),

  updatePost: z.object({
    title: validationSchemas.postTitle.optional(),
    content: validationSchemas.postContent.optional(),
    tags: z.array(z.string().max(30)).max(10).optional(),
    is_public: z.boolean().optional(),
  }),

  // Stream management
  createStream: z.object({
    title: validationSchemas.streamTitle,
    description: validationSchemas.streamDescription.optional(),
    game_id: z.string().uuid().optional(),
    category: z.string().min(1).max(50),
    tags: z.array(z.string().max(30)).max(10).optional(),
    is_mature: z.boolean().optional(),
  }),

  // Chat message
  sendMessage: z.object({
    message: validationSchemas.chatMessage,
    stream_id: z.string().uuid(),
  }),

  // Search
  search: z.object({
    query: validationSchemas.searchQuery,
    type: z.enum(['posts', 'users', 'games', 'streams']).optional(),
    limit: z.number().min(1).max(50).optional(),
    offset: z.number().min(0).optional(),
  }),

  // Team/Tournament
  createTeam: z.object({
    name: validationSchemas.teamName,
    description: z.string().max(500).optional(),
    game_id: z.string().uuid(),
    is_public: z.boolean().optional(),
  }),

  createTournament: z.object({
    name: validationSchemas.tournamentName,
    description: z.string().max(1000).optional(),
    game_id: z.string().uuid(),
    max_participants: z.number().min(2).max(1000),
    start_date: z.string().datetime(),
    registration_deadline: z.string().datetime(),
    prize_pool: z.number().min(0).optional(),
  }),
}

// Cleanup interval
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    ApiProtection.cleanupRateLimits()
  }, 5 * 60 * 1000) // Every 5 minutes
}
