import { NextRequest, NextResponse } from 'next/server'
import { ApiProtection } from '@/lib/security/api-protection'
import { createServerClient } from '@supabase/ssr'

// Get specific post
export const GET = ApiProtection.withAuth(
  async ({ user, request, params }) => {
    const postId = params?.id

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
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

    try {
      const { data: post, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          media_url,
          media_type,
          created_at,
          updated_at,
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
        .eq('id', postId)
        .single()

      if (error || !post) {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        )
      }

      // Transform post with user-specific data
      const transformedPost = {
        ...post,
        like_count: post._count?.[0]?.count || 0,
        is_liked: post.likes?.some((like: any) => like.user_id === user.id) || false,
        is_bookmarked: post.bookmarks?.some((bookmark: any) => bookmark.user_id === user.id) || false,
        _count: undefined,
        likes: undefined,
        bookmarks: undefined
      }

      return NextResponse.json(transformedPost)
    } catch (error) {
      console.error('Error fetching post:', error)
      return NextResponse.json(
        { error: 'Failed to fetch post' },
        { status: 500 }
      )
    }
  }
)

// Delete post
export const DELETE = ApiProtection.withAuth(
  async ({ user, request, params }) => {
    const postId = params?.id

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
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

    try {
      // Check if user owns the post
      const { data: existingPost } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single()

      if (!existingPost || existingPost.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Post not found or unauthorized' },
          { status: 404 }
        )
      }

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

      if (error) throw error

      return NextResponse.json({ message: 'Post deleted successfully' })
    } catch (error) {
      console.error('Error deleting post:', error)
      return NextResponse.json(
        { error: 'Failed to delete post' },
        { status: 500 }
      )
    }
  },
  {
    rateLimit: { maxRequests: 10, windowMs: 60000 }
  }
)
