import { NextRequest, NextResponse } from 'next/server'
import { ApiProtection } from '@/lib/security/api-protection'
import { GameAPIManager } from '@/lib/gaming/game-api-manager'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'

const SyncRequestSchema = z.object({
  platform: z.enum(['steam', 'epic', 'xbox', 'playstation', 'riot', 'battle_net']),
  force: z.boolean().default(false)
})

// Sync gaming data from connected accounts
export const POST = ApiProtection.withAuth(
  async ({ user, request }) => {
    try {
      const body = await request.json()
      const { platform, force } = SyncRequestSchema.parse(body)

      const gameAPI = new GameAPIManager()
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

      // Check if user has connected account for this platform
      const { data: account } = await supabase
        .from('user_game_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', platform)
        .eq('is_active', true)
        .single()

      if (!account) {
        return NextResponse.json(
          { error: `No ${platform} account connected` },
          { status: 400 }
        )
      }

      // Check last sync time to prevent too frequent syncing
      if (!force && account.last_sync) {
        const lastSync = new Date(account.last_sync)
        const now = new Date()
        const diffMinutes = (now.getTime() - lastSync.getTime()) / (1000 * 60)
        
        if (diffMinutes < 15) {
          return NextResponse.json(
            { 
              error: 'Sync too frequent. Please wait 15 minutes between syncs',
              next_sync_available: new Date(lastSync.getTime() + 15 * 60 * 1000)
            },
            { status: 429 }
          )
        }
      }

      // Perform platform-specific sync
      let syncResult: any = {}
      
      switch (platform) {
        case 'steam':
          await gameAPI.syncSteamData(user.id, account.platform_user_id)
          syncResult.message = 'Steam data synced successfully'
          break
          
        case 'epic':
          // Epic sync logic would go here
          syncResult.message = 'Epic Games data sync not yet implemented'
          break
          
        case 'xbox':
          // Xbox sync logic would go here
          syncResult.message = 'Xbox Live data sync not yet implemented'
          break
          
        default:
          syncResult.message = `${platform} sync not yet implemented`
      }

      // Update last sync time
      await supabase
        .from('user_game_accounts')
        .update({ last_sync: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('platform', platform)

      return NextResponse.json({
        ...syncResult,
        platform,
        synced_at: new Date().toISOString()
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid input', details: error.errors },
          { status: 400 }
        )
      }
      console.error('Error syncing gaming data:', error)
      return NextResponse.json(
        { error: 'Failed to sync gaming data' },
        { status: 500 }
      )
    }
  },
  {
    rateLimit: { maxRequests: 10, windowMs: 60000 }
  }
)

// Get sync status for all connected accounts
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
      const { data: accounts, error } = await supabase
        .from('user_game_accounts')
        .select(`
          platform,
          platform_username,
          last_sync,
          connected_at,
          is_active
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (error) throw error

      // Calculate sync status for each account
      const accountsWithStatus = accounts?.map(account => {
        const lastSync = account.last_sync ? new Date(account.last_sync) : null
        const now = new Date()
        
        let canSync = true
        let nextSyncAvailable = null
        
        if (lastSync) {
          const diffMinutes = (now.getTime() - lastSync.getTime()) / (1000 * 60)
          if (diffMinutes < 15) {
            canSync = false
            nextSyncAvailable = new Date(lastSync.getTime() + 15 * 60 * 1000)
          }
        }

        return {
          ...account,
          can_sync: canSync,
          next_sync_available: nextSyncAvailable
        }
      }) || []

      return NextResponse.json({
        accounts: accountsWithStatus,
        total_connected: accountsWithStatus.length
      })

    } catch (error) {
      console.error('Error fetching sync status:', error)
      return NextResponse.json(
        { error: 'Failed to fetch sync status' },
        { status: 500 }
      )
    }
  }
)
