import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Only apply Supabase session middleware for now
  // Security middleware was causing redirect loops
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/feed/:path*',
    '/messages/:path*',
    '/notifications/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/bookmarks/:path*',
    '/post/:path*',
    '/editor/:path*',
    '/servers/:path*',
    '/teams/:path*',
    '/tournaments/:path*',
    '/matchmaking/:path*',
    '/achievements/:path*',
  ],
}
