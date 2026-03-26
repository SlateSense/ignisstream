"use client";

import { useEffect, useMemo, useState } from "react";

export interface GameSearchResult {
  id: string;
  name: string;
  cover_url: string | null;
  platforms: string[];
  genre: string | null;
  release_date: string | null;
  source: string;
}

interface GameSearchFilters {
  genre?: string;
  platform?: string;
  releaseWindow?: string;
}

interface UseGameSearchOptions {
  initialQuery?: string;
  debounceMs?: number;
  limit?: number;
  enabled?: boolean;
  filters?: GameSearchFilters;
}

export function useGameSearch({
  initialQuery = "",
  debounceMs = 300,
  limit = 12,
  enabled = true,
  filters,
}: UseGameSearchOptions = {}) {
  const [query, setQuery] = useState(initialQuery);
  const [games, setGames] = useState<GameSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const serializedFilters = useMemo(
    () => JSON.stringify(filters || {}),
    [filters]
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);

      try {
        const searchParams = new URLSearchParams({
          q: query,
          limit: String(limit),
        });

        const parsedFilters: GameSearchFilters = serializedFilters
          ? JSON.parse(serializedFilters)
          : {};

        if (parsedFilters.genre && parsedFilters.genre !== "all") {
          searchParams.set("genre", parsedFilters.genre);
        }

        if (parsedFilters.platform && parsedFilters.platform !== "all") {
          searchParams.set("platform", parsedFilters.platform);
        }

        if (parsedFilters.releaseWindow && parsedFilters.releaseWindow !== "all") {
          searchParams.set("releaseWindow", parsedFilters.releaseWindow);
        }

        const response = await fetch(`/api/games/search?${searchParams.toString()}`, {
          cache: "no-store",
        });
        const payload = await response.json();

        if (!active) {
          return;
        }

        setGames(Array.isArray(payload?.games) ? payload.games : []);
      } catch {
        if (active) {
          setGames([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }, debounceMs);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [debounceMs, enabled, limit, query, serializedFilters]);

  return {
    query,
    setQuery,
    games,
    loading,
  };
}
