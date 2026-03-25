import { NextRequest, NextResponse } from 'next/server'
import { ApiProtection } from '@/lib/security/api-protection'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'

const CreateStreamSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  game_id: z.string().uuid().optional(),
  category: z.string().min(1).max(50),
  tags: z.array(z.string()).max(10).optional(),
  is_mature: z.boolean().default(false)
})

const UpdateStreamSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  game_id: z.string().uuid().optional(),
  category: z.string().min(1).max(50).optional(),
  tags: z.array(z.string()).max(10).optional(),
  is_mature: z.boolean().optional(),
  status: z.enum(['live', 'offline', 'ended']).optional()
})

// Get live streams with filtering and pagination
export const GET = ApiProtection.withAuth(
  async ({ user, request }) => {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category')
    const gameId = searchParams.get('game_id')
    const status = searchParams.get('status') || 'live'
    const offset = (page - 1) * limit

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

    try {
      let query = supabase
        .from('streams')
        .select(`
          id,
          title,
          description,
          status,
          viewer_count,
          started_at,
          thumbnail_url,
          category,
          tags,
          is_mature,
          streamer:profiles!streamer_id(
            id,
            username,
            display_name,
            avatar_url
          ),
          game:games(
            id,
            name,
            cover_url
          )
        `)
        .eq('status', status)
        .order('viewer_count', { ascending: false })
        .range(offset, offset + limit - 1)

      // Apply filters
      if (category) {
        query = query.eq('category', category)
      }
      
      if (gameId) {
        query = query.eq('game_id', gameId)
      }

      const { data: streams, error } = await query

      if (error) throw error

      return NextResponse.json({
        streams: streams || [],
        pagination: {
          page,
          limit,
          hasMore: (streams?.length || 0) === limit
        }
      })

    } catch (error) {
      console.error('Error fetching streams:', error)
      return NextResponse.json(
        { error: 'Failed to fetch streams' },
        { status: 500 }
      )
    }
  }
)

// Create new stream
export const POST = ApiProtection.withAuth(
  async ({ user, request }) => {
    try {
      const body = await request.json()
      const validatedData = CreateStreamSchema.parse(body)

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

      // Check if user already has an active stream
      const { data: existingStream } = await supabase
        .from('streams')
        .select('id')
        .eq('streamer_id', user.id)
        .in('status', ['live', 'offline'])
        .single()

      if (existingStream) {
        return NextResponse.json(
          { error: 'You already have an active stream. End it before creating a new one.' },
          { status: 400 }
        )
      }

      // Generate unique stream key
      const streamKey = `${user.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`
      
      const { data: stream, error } = await supabase
        .from('streams')
        .insert({
          streamer_id: user.id,
          title: validatedData.title,
          description: validatedData.description,
          game_id: validatedData.game_id,
          category: validatedData.category,
          tags: validatedData.tags || [],
          is_mature: validatedData.is_mature,
          stream_key: streamKey,
          rtmp_url: `${process.env.RTMP_SERVER_URL}/${streamKey}`,
          status: 'offline'
        })
        .select(`
          id,
          title,
          description,
          status,
          stream_key,
          rtmp_url,
          category,
          tags,
          is_mature,
          created_at
        `)
        .single()

      if (error) throw error

      return NextResponse.json(stream, { status: 201 })

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid input', details: error.errors },
          { status: 400 }
        )
      }
      console.error('Error creating stream:', error)
      return NextResponse.json(
        { error: 'Failed to create stream' },
        { status: 500 }
      )
    }
  },
  {
    rateLimit: { maxRequests: 5, windowMs: 60000 }
  }
)

// Update stream
export const PUT = ApiProtection.withAuth(
  async ({ user, request }) => {
    try {
      const body = await request.json()
      const { stream_id, ...updateData } = body
      const validatedData = UpdateStreamSchema.parse(updateData)

      if (!stream_id) {
        return NextResponse.json(
          { error: 'Stream ID is required' },
          { status: 400 }
        )
      }

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

      // Check if user owns the stream
      const { data: existingStream } = await supabase
        .from('streams')
        .select('streamer_id')
        .eq('id', stream_id)
        .single()

      if (!existingStream || existingStream.streamer_id !== user.id) {
        return NextResponse.json(
          { error: 'Stream not found or unauthorized' },
          { status: 404 }
        )
      }

      // Handle status changes
      const updateFields: any = { ...validatedData }
      
      if (validatedData.status === 'live') {
        updateFields.started_at = new Date().toISOString()
      } else if (validatedData.status === 'ended') {
        updateFields.ended_at = new Date().toISOString()
      }

      const { data: stream, error } = await supabase
        .from('streams')
        .update(updateFields)
        .eq('id', stream_id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json(stream)

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid input', details: error.errors },
          { status: 400 }
        )
      }
      console.error('Error updating stream:', error)
      return NextResponse.json(
        { error: 'Failed to update stream' },
        { status: 500 }
      )
    }
  },
  {
    rateLimit: { maxRequests: 30, windowMs: 60000 }
  }
)
