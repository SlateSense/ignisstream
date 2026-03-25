"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Gamepad2, 
  Users, 
  TrendingUp, 
  Calendar, 
  Trophy,
  Heart,
  MessageSquare,
  Share2,
  Filter,
  Search,
  Plus,
  Bookmark
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useTrending } from "@/components/trending/TrendingProvider";
import { useHashtags } from "@/components/hashtags/HashtagProvider";
import PostCard from "@/components/feed/PostCard";
import AuthNavbar from "@/components/layout/AuthNavbar";
import { cn } from "@/lib/utils";

interface GameData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  cover_url?: string;
  background_url?: string;
  developer?: string;
  publisher?: string;
  release_date?: string;
  platforms?: string[];
  genres?: string[];
  followers_count: number;
  posts_count: number;
  trending_score: number;
}

export default function GameFeedPage() {
  const params = useParams();
  const gameSlug = params?.slug as string;
  
  const [game, setGame] = useState<GameData | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [following, setFollowing] = useState(false);
  const [sortBy, setSortBy] = useState("recent");
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { getTrendingByGame } = useTrending();
  const { getPostsByHashtag } = useHashtags();

  useEffect(() => {
    if (gameSlug) {
      loadGameData();
      loadGamePosts();
    }
  }, [gameSlug]);

  useEffect(() => {
    if (game) {
      loadGamePosts();
    }
  }, [sortBy, filterType, game]);

  const loadGameData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('games')
        .select(`
          id,
          name,
          slug,
          description,
          cover_url,
          background_url,
          developer,
          publisher,
          release_date,
          platforms,
          genres
        `)
        .eq('slug', gameSlug)
        .single();

      if (error) throw error;

      // Get additional stats
      const [
        { count: postsCount },
        { count: followersCount }
      ] = await Promise.all([
        supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('game_id', data.id),
        supabase
          .from('game_follows')
          .select('id', { count: 'exact', head: true })
          .eq('game_id', data.id)
      ]);

      // Check if user is following this game
      if (user) {
        const { data: followData } = await supabase
          .from('game_follows')
          .select('id')
          .eq('game_id', data.id)
          .eq('user_id', user.id)
          .single();
        
        setFollowing(!!followData);
      }

      const gameWithStats = {
        ...data,
        posts_count: postsCount || 0,
        followers_count: followersCount || 0,
        trending_score: calculateGameTrendingScore(postsCount || 0, followersCount || 0)
      };

      setGame(gameWithStats);
    } catch (error) {
      console.error('Error loading game:', error);
      toast({
        title: "Game not found",
        description: "The requested game could not be found.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadGamePosts = async () => {
    if (!game) return;
    
    setPostsLoading(true);
    try {
      const supabase = createClient();
      let query = supabase
        .from('posts')
        .select(`
          id,
          caption,
          created_at,
          visibility,
          author:profiles!author_id(id, username, display_name, avatar_url),
          game:games(id, name, cover_url),
          assets:post_assets(asset:assets(id, type, storage_path, thumbnail_url)),
          likes_count:likes(count),
          comments_count:comments(count)
        `)
        .eq('game_id', game.id)
        .eq('visibility', 'public');

      // Apply filters
      if (filterType === 'images') {
        query = query.eq('assets.asset.type', 'image');
      } else if (filterType === 'videos') {
        query = query.eq('assets.asset.type', 'video');
      }

      // Apply search
      if (searchQuery.trim()) {
        query = query.ilike('caption', `%${searchQuery}%`);
      }

      // Apply sorting
      if (sortBy === 'recent') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'popular') {
        // This would need a more complex query for engagement-based sorting
        query = query.order('created_at', { ascending: false }); // Fallback for now
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;

      // If sorting by trending, get trending posts instead
      if (sortBy === 'trending') {
        const trendingPosts = await getTrendingByGame(game.id);
        setPosts(trendingPosts);
      } else {
        setPosts(data || []);
      }
    } catch (error) {
      console.error('Error loading game posts:', error);
      toast({
        title: "Failed to load posts",
        description: "Unable to load posts for this game.",
        variant: "destructive"
      });
    } finally {
      setPostsLoading(false);
    }
  };

  const calculateGameTrendingScore = (posts: number, followers: number) => {
    return posts * 5 + followers * 2;
  };

  const handleFollowGame = async () => {
    if (!user || !game) return;

    try {
      const supabase = createClient();
      
      if (following) {
        await supabase
          .from('game_follows')
          .delete()
          .eq('game_id', game.id)
          .eq('user_id', user.id);
        
        setFollowing(false);
        setGame(prev => prev ? { ...prev, followers_count: prev.followers_count - 1 } : null);
        
        toast({
          title: "Unfollowed game",
          description: `You're no longer following ${game.name}`,
        });
      } else {
        await supabase
          .from('game_follows')
          .insert({
            game_id: game.id,
            user_id: user.id
          });
        
        setFollowing(true);
        setGame(prev => prev ? { ...prev, followers_count: prev.followers_count + 1 } : null);
        
        toast({
          title: "Following game",
          description: `You're now following ${game.name}`,
        });
      }
    } catch (error) {
      console.error('Error following/unfollowing game:', error);
      toast({
        title: "Error",
        description: "Unable to update follow status",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AuthNavbar />
        <div className="container mx-auto px-4 pt-32">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background">
        <AuthNavbar />
        <div className="container mx-auto px-4 pt-32">
          <div className="text-center">
            <Gamepad2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h1 className="text-2xl font-bold mb-2">Game Not Found</h1>
            <p className="text-muted-foreground">The requested game could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthNavbar />
      
      {/* Game Header */}
      <div 
        className="relative bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: game.background_url ? `url(${game.background_url})` : 'none',
          backgroundColor: game.background_url ? 'transparent' : '#1a1a1a'
        }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative container mx-auto px-4 pt-20 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row gap-8 items-start"
          >
            {/* Game Cover */}
            <div className="flex-shrink-0">
              <div className="w-48 h-64 rounded-lg overflow-hidden bg-muted">
                {game.cover_url ? (
                  <img 
                    src={game.cover_url} 
                    alt={game.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Gamepad2 className="h-16 w-16 opacity-50" />
                  </div>
                )}
              </div>
            </div>

            {/* Game Info */}
            <div className="flex-1 text-white">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{game.name}</h1>
              
              {game.description && (
                <p className="text-lg mb-6 max-w-2xl text-white/80">
                  {game.description}
                </p>
              )}

              {/* Game Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {game.developer && (
                  <div>
                    <p className="text-sm text-white/60">Developer</p>
                    <p className="font-medium">{game.developer}</p>
                  </div>
                )}
                {game.publisher && (
                  <div>
                    <p className="text-sm text-white/60">Publisher</p>
                    <p className="font-medium">{game.publisher}</p>
                  </div>
                )}
                {game.release_date && (
                  <div>
                    <p className="text-sm text-white/60">Release Date</p>
                    <p className="font-medium">
                      {new Date(game.release_date).getFullYear()}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-white/60">Followers</p>
                  <p className="font-medium">{game.followers_count.toLocaleString()}</p>
                </div>
              </div>

              {/* Genres */}
              {game.genres && game.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {game.genres.map((genre) => (
                    <Badge key={genre} variant="secondary" className="bg-white/20 text-white">
                      {genre}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span>{game.followers_count.toLocaleString()} followers</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>{game.posts_count.toLocaleString()} posts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  <span>Trending Score: {game.trending_score}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <Button
                  onClick={handleFollowGame}
                  variant={following ? "secondary" : "default"}
                  className={cn(
                    "bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90",
                    following && "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  {following ? (
                    <>
                      <Bookmark className="h-4 w-4 mr-2" />
                      Following
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Follow Game
                    </>
                  )}
                </Button>
                <Button variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts in this game..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    loadGamePosts();
                  }
                }}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="trending">Trending</SelectItem>
                <SelectItem value="popular">Popular</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Posts</SelectItem>
                <SelectItem value="images">Images</SelectItem>
                <SelectItem value="videos">Videos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Posts Feed */}
        {postsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Gamepad2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
              <p className="text-muted-foreground">
                Be the first to share content about {game.name}!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} currentUser={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
