"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Gamepad2 } from "lucide-react";

interface TrendingGame {
  id: number;
  name: string;
  post_count: number;
  cover_url?: string;
}

export default function TrendingGames() {
  const [trendingGames, setTrendingGames] = useState<TrendingGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrendingGames();
  }, []);

  const loadTrendingGames = async () => {
    try {
      const supabase = createClient();
      
      // Get games with most posts in the last 7 days
      const { data, error } = await supabase
        .from("posts")
        .select(`
          game_id,
          game:games(id, name, cover_url)
        `)
        .not("game_id", "is", null)
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Count posts per game
      const gameCounts: { [key: number]: { game: any, count: number } } = {};
      
      data?.forEach((post: any) => {
        if (post.game_id && post.game) {
          if (!gameCounts[post.game_id]) {
            gameCounts[post.game_id] = {
              game: post.game,
              count: 0
            };
          }
          gameCounts[post.game_id].count++;
        }
      });

      // Convert to array and sort by count
      const trending = Object.values(gameCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(item => ({
          id: item.game.id,
          name: item.game.name,
          post_count: item.count,
          cover_url: item.game.cover_url
        }));

      setTrendingGames(trending);
    } catch (error) {
      console.error("Error loading trending games:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg p-6">
        <h3 className="font-semibold mb-4">Trending Games</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between animate-pulse">
              <div className="h-4 bg-muted rounded w-20"></div>
              <div className="h-3 bg-muted rounded w-12"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-6">
      <h3 className="font-semibold mb-4 flex items-center">
        <Gamepad2 className="mr-2 h-4 w-4" />
        Trending Games
      </h3>
      <div className="space-y-3">
        {trendingGames.length > 0 ? (
          trendingGames.map((game) => (
            <div key={game.id} className="flex items-center justify-between hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors">
              <span className="text-sm font-medium">{game.name}</span>
              <span className="text-xs text-muted-foreground">
                {game.post_count} post{game.post_count !== 1 ? 's' : ''}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No trending games this week
          </p>
        )}
      </div>
    </div>
  );
}
