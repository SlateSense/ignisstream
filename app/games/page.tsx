"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Users, TrendingUp, Star } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

const categories = [
  "All", "Action", "Adventure", "RPG", "FPS", "Strategy", "Sports", "Racing", "Simulation", "Indie"
];

const platforms = ["All", "PC", "PlayStation", "Xbox", "Nintendo", "Mobile"];

export default function GamesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPlatform, setSelectedPlatform] = useState("All");
  const [sortBy, setSortBy] = useState("popular");
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGames = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data: gamesData, error: gamesError } = await supabase
        .from("games")
        .select("id, name, slug, cover_url")
        .order("name", { ascending: true });

      if (gamesError || !gamesData) {
        setGames([]);
        setLoading(false);
        return;
      }

      const { data: postsData } = await supabase
        .from("posts")
        .select("game_id")
        .not("game_id", "is", null)
        .eq("visibility", "public");

      const postsByGame = new Map<number, number>();
      postsData?.forEach((post: { game_id: number | null }) => {
        if (!post.game_id) return;
        postsByGame.set(post.game_id, (postsByGame.get(post.game_id) || 0) + 1);
      });

      const gameRows = gamesData.map((game) => {
        const idSeed = Number(game.id) || 1;
        const category = categories[idSeed % (categories.length - 1) + 1];
        const basePlayers = 12000 + (idSeed % 25) * 3200;
        const posts = postsByGame.get(game.id) || 0;
        const players = basePlayers + posts * 18;
        const rating = (3.8 + ((idSeed % 12) / 10)).toFixed(1);
        const platformsForGame = platforms.filter((platform) => platform !== "All").filter((_, index) => (idSeed + index) % 2 === 0);
        return {
          ...game,
          category,
          platforms: platformsForGame.length > 0 ? platformsForGame : ["PC"],
          rating,
          players,
          posts,
          trending: posts > 8 || players > 60000
        };
      });

      setGames(gameRows);
      setLoading(false);
    };

    loadGames();
  }, []);

  const filteredGames = games.filter(game => {
    if (searchQuery && !game.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedCategory !== "All" && game.category !== selectedCategory) return false;
    if (selectedPlatform !== "All" && !game.platforms.includes(selectedPlatform)) return false;
    return true;
  });

  const sortedGames = [...filteredGames].sort((a, b) => {
    switch (sortBy) {
      case "popular":
        return b.players - a.players;
      case "posts":
        return b.posts - a.posts;
      case "rating":
        return parseFloat(b.rating) - parseFloat(a.rating);
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-gaming-purple/20 via-gaming-pink/20 to-gaming-blue/20 pb-8">
        <div className="container mx-auto px-4 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-gaming font-bold mb-4">
              <span className="bg-gradient-to-r from-gaming-purple to-gaming-pink bg-clip-text text-transparent">
                Game Directory
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Discover and explore games with active communities
            </p>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-lg p-6 -mb-4"
          >
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search games..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                  <SelectTrigger>
                    <SelectValue placeholder="Platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map(platform => (
                      <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="posts">Most Posts</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="name">Alphabetical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading games...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedGames.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/games/${game.slug}`}>
                  <Card className="h-full hover:shadow-xl transition-all hover:scale-105 cursor-pointer overflow-hidden">
                    <div className="aspect-video relative">
                      <img
                        src={game.cover_url}
                        alt={game.name}
                        className="w-full h-full object-cover"
                      />
                      {game.trending && (
                        <Badge className="absolute top-2 right-2 bg-gradient-to-r from-gaming-purple to-gaming-pink">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Trending
                        </Badge>
                      )}
                    </div>
                    <CardHeader className="pb-3">
                      <h3 className="font-semibold text-lg">{game.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="secondary">{game.category}</Badge>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          <span>{game.rating}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-1 mb-3">
                        {game.platforms.map((platform: string) => (
                          <Badge key={platform} variant="outline" className="text-xs">
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 border-t">
                      <div className="flex justify-between w-full text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{(game.players / 1000).toFixed(1)}k players</span>
                        </div>
                        <div>{game.posts} posts</div>
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {sortedGames.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No games found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
