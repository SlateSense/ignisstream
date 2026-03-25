import { NextRequest, NextResponse } from 'next/server'
import { ApiProtection } from '@/lib/security/api-protection'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'

const UpdateProfileSchema = z.object({
  display_name: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  avatar_url: z.string().url().optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().optional(),
  twitter: z.string().max(50).optional(),
  discord: z.string().max(50).optional(),
  twitch: z.string().max(50).optional(),
  youtube: z.string().max(50).optional(),
  steam: z.string().max(50).optional(),
  privacy_settings: z.object({
    show_email: z.boolean().optional(),
    show_real_name: z.boolean().optional(),
    show_location: z.boolean().optional(),
    allow_friend_requests: z.boolean().optional(),
    show_activity_status: z.boolean().optional(),
    show_game_stats: z.boolean().optional(),
  }).optional(),
})

// Get current user profile
export const GET = ApiProtection.withAuth(
  async ({ user, request }) => {
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
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          display_name,
          email,
          bio,
          avatar_url,
          location,
          website,
          twitter,
          discord,
          twitch,
          youtube,
          steam,
          privacy_settings,
          created_at,
          updated_at,
          follower_count:follows!following_id(count),
          following_count:follows!follower_id(count),
          post_count:posts(count)
        `)
        .eq('id', user.id)
        .single()

      if (error) throw error

      if (!profile) {
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404 }
        )
      }

      // Transform counts
      const transformedProfile = {
        ...profile,
        follower_count: profile.follower_count?.[0]?.count || 0,
        following_count: profile.following_count?.[0]?.count || 0,
        post_count: profile.post_count?.[0]?.count || 0,
      }

      return NextResponse.json(transformedProfile)
    } catch (error) {
      console.error('Error fetching profile:', error)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }
  }
)

// Update user profile
export const PUT = ApiProtection.withAuth(
  async ({ user, request }) => {
    try {
      const body = await request.json()
      const validatedData = UpdateProfileSchema.parse(body)

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

      const { data: profile, error } = await supabase
        .from('profiles')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json(profile)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid input', details: error.errors },
          { status: 400 }
        )
      }
      console.error('Error updating profile:', error)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }
  },
  {
    rateLimit: { maxRequests: 10, windowMs: 60000 }
  }
)
