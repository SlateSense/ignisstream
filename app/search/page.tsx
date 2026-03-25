"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Users, Gamepad2, FileText, TrendingUp, Loader2, Hash } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import PostCard from "@/components/feed/PostCard";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useHashtags } from "@/components/hashtags/HashtagProvider";
import { useTrending } from "@/components/trending/TrendingProvider";
import TrendingProvider from "@/components/trending/TrendingProvider";

export const dynamic = "force-dynamic";

interface SearchResult {
  posts: any[];
  users: any[];
  games: any[];
}

function SearchPageContent() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult>({
    posts: [],
    users: [],
    games: []
  });
  const [loading, setLoading] = useState(false);
  const [hashtagResults, setHashtagResults] = useState<any[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const { searchHashtags, getPostsByHashtag } = useHashtags();
  const { trendingPosts, trendingHashtags } = useTrending();

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) {
      setQuery(q);
      performSearch(q);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchResults({ posts: [], users: [], games: [] });
      setHashtagResults([]);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();

      // Check if search term is a hashtag
      const isHashtagSearch = searchTerm.startsWith('#');
      const cleanSearchTerm = isHashtagSearch ? searchTerm.slice(1) : searchTerm;

      // Search posts
      const { data: posts } = await supabase
        .from('posts')
        .select(`
          id, caption, created_at, visibility,
          author:profiles!author_id(id, username, display_name, avatar_url),
          game:games(id, name, cover_url),
          assets:post_assets(asset:assets(id, type, storage_path, thumbnail_url)),
          likes_count:likes(count),
          comments_count:comments(count)
        `)
        .or(`caption.ilike.%${searchTerm}%`)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(20);

      // Search users
      const { data: users } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, bio')
        .or(`display_name.ilike.%${cleanSearchTerm}%,username.ilike.%${cleanSearchTerm}%,bio.ilike.%${cleanSearchTerm}%`)
        .limit(20);

      // Search games
      const { data: games } = await supabase
        .from('games')
        .select('id, name, description, cover_url')
        .or(`name.ilike.%${cleanSearchTerm}%,description.ilike.%${cleanSearchTerm}%`)
        .limit(20);

      // Search hashtags
      const hashtags = await searchHashtags(cleanSearchTerm);
      setHashtagResults(hashtags);

      // If hashtag search, also get posts for that hashtag
      let hashtagPosts: any[] = [];
      if (isHashtagSearch && hashtags.length > 0) {
        const topHashtag = hashtags[0];
        hashtagPosts = await getPostsByHashtag(topHashtag.name);
      }

      setSearchResults({
        posts: isHashtagSearch && hashtagPosts.length > 0 ? hashtagPosts : (posts || []),
        users: users || [],
        games: games || []
      });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: "Unable to perform search. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const { posts: filteredPosts, users: filteredUsers, games: filteredGames } = searchResults;
  const allResultsCount = filteredPosts.length + filteredUsers.length + filteredGames.length + hashtagResults.length;

  // Show trending content when no search is performed
  const showTrending = !query.trim();
  const displayPosts = showTrending ? trendingPosts : filteredPosts;

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Search */}
      <div className="bg-gradient-to-r from-gaming-purple/20 via-gaming-pink/20 to-gaming-blue/20 pb-8">
        <div className="container mx-auto px-4 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-gaming font-bold mb-4">
              <span className="bg-gradient-to-r from-gaming-purple to-gaming-pink bg-clip-text text-transparent">
                Search IgnisStream
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Find posts, creators, and games
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-2xl mx-auto"
          >
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for posts, users, games..."
                className="pl-10 pr-20"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Button 
                type="submit" 
                className="absolute right-2 top-1 bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">
              All ({allResultsCount})
            </TabsTrigger>
            <TabsTrigger value="posts">
              <FileText className="mr-2 h-4 w-4" />
              Posts ({displayPosts.length})
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="mr-2 h-4 w-4" />
              Users ({filteredUsers.length})
            </TabsTrigger>
            <TabsTrigger value="games">
              <Gamepad2 className="mr-2 h-4 w-4" />
              Games ({filteredGames.length})
            </TabsTrigger>
            <TabsTrigger value="hashtags">
              <TrendingUp className="mr-2 h-4 w-4" />
              Tags ({hashtagResults.length})
            </TabsTrigger>
          </TabsList>

          {/* All Results Tab */}
          <TabsContent value="all" className="mt-8">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Searching...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Posts Section */}
                {filteredPosts.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Posts
                    </h2>
                    <div className="max-w-2xl space-y-4">
                      {filteredPosts.slice(0, 3).map((post: any) => (
                        <PostCard key={post.id} post={post} currentUser={user} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Users Section */}
                {filteredUsers.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Users
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredUsers.slice(0, 6).map((user: any) => (
                        <Link key={user.id} href={`/profile/${user.username}`}>
                          <Card className="hover:shadow-lg transition-all">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12">
                                  <AvatarImage src={user.avatar_url} />
                                  <AvatarFallback>
                                    {user.username[0]?.toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <p className="font-semibold">{user.display_name}</p>
                                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                                </div>
                                <Button size="sm">Follow</Button>
                              </div>
                              {user.bio && (
                                <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                                  {user.bio}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Games Section */}
                {filteredGames.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Gamepad2 className="h-5 w-5" />
                      Games
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {filteredGames.slice(0, 8).map((game: any) => (
                        <Link key={game.id} href={`/games/${game.slug || game.id}`}>
                          <Card className="hover:shadow-lg transition-all overflow-hidden">
                            <div className="aspect-video relative bg-secondary">
                              {game.cover_url && (
                                <img
                                  src={game.cover_url}
                                  alt={game.name}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <CardContent className="p-4">
                              <p className="font-semibold">{game.name}</p>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {game.description}
                              </p>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hashtags Section */}
                {hashtagResults.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Hash className="h-5 w-5" />
                      Hashtags
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {hashtagResults.slice(0, 8).map((hashtag: any) => (
                        <Link key={hashtag.id} href={`/search?q=%23${hashtag.name}`}>
                          <Card className="hover:shadow-lg transition-all">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gaming-purple/20 to-gaming-pink/20 flex items-center justify-center">
                                  <Hash className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold truncate">#{hashtag.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {hashtag.usage_count} posts
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Results */}
                {allResultsCount === 0 && !loading && (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-semibold mb-2">No results found</p>
                      <p className="text-muted-foreground mb-4">
                        Try searching with different keywords or hashtags
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {trendingHashtags.slice(0, 6).map((hashtag) => (
                          <Link key={hashtag.id} href={`/search?q=%23${hashtag.name}`}>
                            <Badge variant="outline" className="hover:bg-secondary cursor-pointer">
                              #{hashtag.name}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts" className="mt-8">
            <div className="max-w-2xl mx-auto space-y-4">
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post: any) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <PostCard post={post} currentUser={user} />
                  </motion.div>
                ))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No posts found</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user: any) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Link href={`/profile/${user.username}`}>
                      <Card className="hover:shadow-lg transition-all">
                        <CardContent className="p-6">
                          <div className="text-center">
                            <Avatar className="h-20 w-20 mx-auto mb-4">
                              <AvatarImage src={user.avatar_url} />
                              <AvatarFallback>
                                {user.username[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <h3 className="font-semibold">{user.display_name}</h3>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                            {user.bio && (
                              <p className="text-sm mt-2 line-clamp-3">{user.bio}</p>
                            )}
                            <Button className="mt-4" size="sm">
                              Follow
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <Card className="col-span-full">
                  <CardContent className="py-12 text-center">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No users found</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Games Tab */}
          <TabsContent value="games" className="mt-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredGames.length > 0 ? (
                filteredGames.map((game: any) => (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Link href={`/games/${game.slug || game.id}`}>
                      <Card className="hover:shadow-lg transition-all overflow-hidden">
                        <div className="aspect-video relative bg-secondary">
                          {game.cover_url && (
                            <img
                              src={game.cover_url}
                              alt={game.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold">{game.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {game.description}
                          </p>
                          <div className="flex items-center gap-2 mt-3">
                            <Badge variant="secondary">Gaming</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <Card className="col-span-full">
                  <CardContent className="py-12 text-center">
                    <Gamepad2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No games found</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Hashtags Tab */}
          <TabsContent value="hashtags" className="mt-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {hashtagResults.length > 0 ? (
                hashtagResults.map((hashtag: any, index: number) => (
                  <motion.div
                    key={hashtag.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link href={`/search?q=%23${hashtag.name}`}>
                      <Card className="hover:shadow-lg transition-all group">
                        <CardContent className="p-6">
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-gaming-purple/20 to-gaming-pink/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Hash className="h-8 w-8" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">#{hashtag.name}</h3>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p>{hashtag.usage_count} total posts</p>
                              {hashtag.recent_usage && (
                                <p>{hashtag.recent_usage} posts this week</p>
                              )}
                              {hashtag.trending_score && (
                                <Badge className="bg-gradient-to-r from-orange-500/20 to-red-500/20 mt-2">
                                  🔥 Trending: {hashtag.trending_score.toFixed(0)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <Card className="col-span-full">
                  <CardContent className="py-12 text-center">
                    <Hash className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">No hashtags found</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <p className="text-sm text-muted-foreground mb-2">Try these trending tags:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {trendingHashtags.slice(0, 8).map((hashtag) => (
                          <Link key={hashtag.id} href={`/search?q=%23${hashtag.name}`}>
                            <Badge 
                              variant="outline" 
                              className="hover:bg-secondary cursor-pointer transition-colors"
                            >
                              #{hashtag.name}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <TrendingProvider>
      <SearchPageContent />
    </TrendingProvider>
  );
}
