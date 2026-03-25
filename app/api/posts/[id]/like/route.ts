import { NextRequest, NextResponse } from 'next/server'
import { ApiProtection } from '@/lib/security/api-protection'
import { createServerClient } from '@supabase/ssr'

// Toggle like on post
export const POST = ApiProtection.withAuth(
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
      // Check if post exists
      const { data: post } = await supabase
        .from('posts')
        .select('id')
        .eq('id', postId)
        .single()

      if (!post) {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        )
      }

      // Check if already liked
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single()

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)

        if (error) throw error

        return NextResponse.json({
          message: 'Post unliked successfully',
          is_liked: false
        })
      } else {
        // Like
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id
          })

        if (error) throw error

        return NextResponse.json({
          message: 'Post liked successfully',
          is_liked: true
        })
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      return NextResponse.json(
        { error: 'Failed to toggle like' },
        { status: 500 }
      )
    }
  },
  {
    rateLimit: { maxRequests: 60, windowMs: 60000 }
  }
)
