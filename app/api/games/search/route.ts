import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

type SearchGameResult = {
  id: string
  name: string
  cover_url: string | null
  platforms: string[]
  genre: string | null
  release_date: string | null
  source: 'database' | 'steam' | 'freetogame'
}

const matchesReleaseWindow = (releaseDate: string | null, window: string) => {
  if (!releaseDate || window === 'all') {
    return true
  }

  const releasedAt = new Date(releaseDate)
  if (Number.isNaN(releasedAt.getTime())) {
    return true
  }

  const now = new Date()
  const currentYear = now.getFullYear()

  if (window === 'upcoming') {
    return releasedAt.getTime() > now.getTime()
  }

  if (window === 'recent') {
    const recentCutoff = new Date(now)
    recentCutoff.setFullYear(now.getFullYear() - 2)
    return releasedAt.getTime() >= recentCutoff.getTime()
  }

  if (window === 'classic') {
    return releasedAt.getFullYear() < currentYear - 5
  }

  return true
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 50)
  const genreFilter = (searchParams.get('genre') || '').trim().toLowerCase()
  const platformFilter = (searchParams.get('platform') || '').trim().toLowerCase()
  const releaseWindow = (searchParams.get('releaseWindow') || 'all').trim().toLowerCase()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createServerClient(url, anon, {
    cookies: {
      get: (name: string) => request.cookies.get(name)?.value,
      set: () => {},
      remove: () => {}
    }
  })

  try {
    let query = supabase
      .from('games')
      .select('id, name, cover_url, platforms')
      .order('name', { ascending: true })
      .limit(limit)

    if (q.length >= 1) {
      query = query.ilike('name', `%${q}%`)
    }

    const { data, error } = await query
    const databaseResults: SearchGameResult[] = !error && data
      ? data
          .map((game) => ({
            id: String(game.id),
            name: game.name,
            cover_url: game.cover_url,
            platforms: Array.isArray(game.platforms) ? game.platforms : [],
            genre: null,
            release_date: null,
            source: 'database' as const,
          }))
          .filter((game) =>
            (!platformFilter ||
              game.platforms.some((platform) => platform.toLowerCase().includes(platformFilter))) &&
            matchesReleaseWindow(game.release_date, releaseWindow)
          )
      : []

    if (databaseResults.length >= limit || (databaseResults.length > 0 && q.length < 2)) {
      return NextResponse.json(
        { games: databaseResults.slice(0, limit) },
        {
          headers: {
            'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600'
          }
        }
      )
    }

    const results = new Map<string, SearchGameResult>()
    databaseResults.forEach((game) => results.set(game.id, game))

    if (q.length >= 2) {
      try {
        const steamRes = await fetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(q)}&l=english&cc=us`, { cache: 'no-store' })
        if (steamRes.ok) {
          const steamJson = await steamRes.json()
          const items = Array.isArray(steamJson?.items) ? steamJson.items : []
          for (const item of items.slice(0, limit)) {
            const steamGame: SearchGameResult = {
              id: `steam-${item.id}`,
              name: item.name,
              cover_url: item.tiny_image || null,
              platforms: ['PC'],
              genre: null,
              release_date: item.release_date || null,
              source: 'steam',
            }

            if (
              (!platformFilter || steamGame.platforms.some((platform) => platform.toLowerCase().includes(platformFilter))) &&
              matchesReleaseWindow(steamGame.release_date, releaseWindow)
            ) {
              results.set(steamGame.id, steamGame)
            }
          }
        }
      } catch {}

      try {
        const ftgRes = await fetch('https://www.freetogame.com/api/games', { cache: 'no-store' })
        if (ftgRes.ok) {
          const ftgJson = await ftgRes.json()
          const filtered = (Array.isArray(ftgJson) ? ftgJson : [])
            .filter((game: any) => String(game.title || '').toLowerCase().includes(q.toLowerCase()))
            .filter((game: any) => !genreFilter || String(game.genre || '').toLowerCase().includes(genreFilter))
            .filter((game: any) => !platformFilter || String(game.platform || '').toLowerCase().includes(platformFilter))
            .filter((game: any) => matchesReleaseWindow(game.release_date || null, releaseWindow))
            .slice(0, limit)

          filtered.forEach((game: any) => {
            results.set(`ftg-${game.id}`, {
              id: `ftg-${game.id}`,
              name: game.title,
              cover_url: game.thumbnail || null,
              platforms: String(game.platform || '')
                .split(',')
                .map((platform: string) => platform.trim())
                .filter(Boolean),
              genre: game.genre || null,
              release_date: game.release_date || null,
              source: 'freetogame',
            })
          })
        }
      } catch {}
    }

    const filteredGames = Array.from(results.values())
      .filter((game) => !genreFilter || String(game.genre || '').toLowerCase().includes(genreFilter))
      .filter((game) => !platformFilter || game.platforms.some((platform) => platform.toLowerCase().includes(platformFilter)))
      .filter((game) => matchesReleaseWindow(game.release_date, releaseWindow))
      .slice(0, limit)

    return NextResponse.json(
      { games: filteredGames },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600'
        }
      }
    )
  } catch (e) {
    return NextResponse.json({ games: [] }, { status: 200 })
  }
}
