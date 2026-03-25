import { NextRequest, NextResponse } from 'next/server'
import { ApiProtection } from '@/lib/security/api-protection'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'

const CreatePostSchema = z.object({
  content: z.string().min(1).max(5000),
  media_url: z.string().url().optional(),
  media_type: z.enum(['image', 'video']).optional(),
  game_id: z.string().uuid().optional(),
})

const UpdatePostSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1).max(5000),
  media_url: z.string().url().optional(),
  media_type: z.enum(['image', 'video']).optional(),
})

// Get posts with pagination (public-safe; computes user flags when available)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const offset = (page - 1) * limit

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabaseService = createServerClient(url, serviceKey, {
    cookies: {
      get: (name: string) => request.cookies.get(name)?.value,
      set: () => {},
      remove: () => {}
    }
  })

  const supabaseAuth = createServerClient(url, anonKey, {
    cookies: {
      get: (name: string) => request.cookies.get(name)?.value,
      set: () => {},
      remove: () => {}
    }
  })

  try {
    const { data: authData } = await supabaseAuth.auth.getUser()
    const currentUserId = authData?.user?.id || null

    const { data: posts, error } = await supabaseService
      .from('posts')
      .select(`
        id,
        content,
        media_url,
        media_type,
        created_at,
        game_id,
        author:profiles!user_id(
          id,
          username,
          display_name,
          avatar_url
        ),
        game:games(
          id,
          name,
          cover_url
        ),
        _count:post_likes(count),
        likes:post_likes!left(user_id),
        bookmarks:bookmarks!left(user_id)
      `)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    const transformedPosts = (posts || []).map(post => ({
      ...post,
      like_count: post._count?.[0]?.count || 0,
      is_liked: currentUserId ? (post.likes?.some((like: any) => like.user_id === currentUserId) || false) : false,
      is_bookmarked: currentUserId ? (post.bookmarks?.some((bookmark: any) => bookmark.user_id === currentUserId) || false) : false,
      _count: undefined,
      likes: undefined,
      bookmarks: undefined
    }))

    return NextResponse.json({
      posts: transformedPosts,
      pagination: {
        page,
        limit,
        hasMore: transformedPosts.length === limit
      }
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

// Create new post
export const POST = ApiProtection.withAuth(
  async ({ user, request }) => {
    try {
      const body = await request.json()
      const validatedData = CreatePostSchema.parse(body)

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

      const { data: post, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: validatedData.content,
          media_url: validatedData.media_url,
          media_type: validatedData.media_type,
          game_id: validatedData.game_id
        })
        .select(`
          id,
          content,
          media_url,
          media_type,
          created_at,
          game_id,
          author:profiles!user_id(
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
        .single()

      if (error) throw error

      return NextResponse.json(post, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid input', details: error.errors },
          { status: 400 }
        )
      }
      console.error('Error creating post:', error)
      return NextResponse.json(
        { error: 'Failed to create post' },
        { status: 500 }
      )
    }
  },
  {
    rateLimit: { maxRequests: 20, windowMs: 60000 }
  }
)

// Update post
export const PUT = ApiProtection.withAuth(
  async ({ user, request }) => {
    try {
      const body = await request.json()
      const validatedData = UpdatePostSchema.parse(body)

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

      // Check if user owns the post
      const { data: existingPost } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', validatedData.id)
        .single()

      if (!existingPost || existingPost.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Post not found or unauthorized' },
          { status: 404 }
        )
      }

      const { data: post, error } = await supabase
        .from('posts')
        .update({
          content: validatedData.content,
          media_url: validatedData.media_url,
          media_type: validatedData.media_type,
          updated_at: new Date().toISOString()
        })
        .eq('id', validatedData.id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json(post)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid input', details: error.errors },
          { status: 400 }
        )
      }
      console.error('Error updating post:', error)
      return NextResponse.json(
        { error: 'Failed to update post' },
        { status: 500 }
      )
    }
  },
  {
    rateLimit: { maxRequests: 30, windowMs: 60000 }
  }
)
