"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Users, TrendingUp, Star, Filter } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockGames } from "@/lib/mock-data";

const categories = [
  "All", "Action", "Adventure", "RPG", "FPS", "Strategy", "Sports", "Racing", "Simulation", "Indie"
];

const platforms = ["All", "PC", "PlayStation", "Xbox", "Nintendo", "Mobile"];

export default function GamesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPlatform, setSelectedPlatform] = useState("All");
  const [sortBy, setSortBy] = useState("popular");

  // Extended games data with more details
  const gamesWithDetails = mockGames.map(game => ({
    ...game,
    category: ["Action", "FPS", "RPG"][Math.floor(Math.random() * 3)],
    platforms: ["PC", "PlayStation", "Xbox"],
    rating: (4 + Math.random()).toFixed(1),
    players: Math.floor(Math.random() * 50000) + 10000,
    posts: Math.floor(Math.random() * 10000) + 1000,
    trending: Math.random() > 0.5
  }));

  const filteredGames = gamesWithDetails.filter(game => {
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
                      {game.platforms.map(platform => (
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
                      <div>{(game.posts / 1000).toFixed(1)}k posts</div>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {sortedGames.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No games found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
