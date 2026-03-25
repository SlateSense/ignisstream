import { NextRequest, NextResponse } from 'next/server'
import { ApiProtection } from '@/lib/security/api-protection'
import { GameAPIManager } from '@/lib/gaming/game-api-manager'
import { createServerClient } from '@supabase/ssr'

// Get user gaming statistics
export const GET = ApiProtection.withAuth(
  async ({ user, request }) => {
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('game_id')
    const platform = searchParams.get('platform')

    const gameAPI = new GameAPIManager()

    try {
      const stats = await gameAPI.getUserGameStats(user.id, gameId || undefined)
      
      // Filter by platform if specified
      let filteredStats = stats
      if (platform) {
        filteredStats = stats.filter(stat => stat.platform === platform)
      }

      return NextResponse.json({
        stats: filteredStats,
        total_games: filteredStats.length,
        platforms: [...new Set(stats.map(s => s.platform))]
      })

    } catch (error) {
      console.error('Error fetching gaming stats:', error)
      return NextResponse.json(
        { error: 'Failed to fetch gaming statistics' },
        { status: 500 }
      )
    }
  }
)

// Record match result
export const POST = ApiProtection.withAuth(
  async ({ user, request }) => {
    try {
      const matchData = await request.json()
      
      // Validate required fields
      if (!matchData.game_id || !matchData.platform || !matchData.result) {
        return NextResponse.json(
          { error: 'Missing required fields: game_id, platform, result' },
          { status: 400 }
        )
      }

      const gameAPI = new GameAPIManager()
      
      // Record the match
      await gameAPI.recordMatch(user.id, {
        ...matchData,
        user_id: user.id,
        date_played: matchData.date_played || new Date().toISOString()
      })

      return NextResponse.json({
        message: 'Match recorded successfully',
        match_id: matchData.match_id
      })

    } catch (error) {
      console.error('Error recording match:', error)
      return NextResponse.json(
        { error: 'Failed to record match' },
        { status: 500 }
      )
    }
  },
  {
    rateLimit: { maxRequests: 100, windowMs: 60000 }
  }
)
