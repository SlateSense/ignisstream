"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, TrendingUp, Users, Clock, Loader2 } from "lucide-react";
import { useInView } from "react-intersection-observer";
import AuthNavbar from "@/components/layout/AuthNavbar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PostCard from "@/components/feed/PostCard";
import CreatePostDialog from "@/components/feed/CreatePostDialog";
import FeedSkeleton from "@/components/feed/FeedSkeleton";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
// import TrendingGames from "@/components/feed/TrendingGames";
// import SuggestedUsers from "@/components/feed/SuggestedUsers";

interface Post {
  id: number;
  caption: string;
  author_id: string;
  game_id: number | null;
  visibility: string;
  created_at: string;
  author: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
  game: {
    id: number;
    name: string;
    cover_url: string;
  } | null;
  assets: Array<{
    id: number;
    type: string;
    storage_path: string;
  }>;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

export default function FeedPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("trending");
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: "100px",
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    
    // Reset pagination when tab changes
    setCurrentPage(0);
    setHasMore(true);
    loadPosts(activeTab, 0);
  }, [user, router, activeTab]);

  // Infinite scroll effect
  useEffect(() => {
    if (inView && hasMore && !loading && !loadingMore) {
      loadMorePosts();
    }
  }, [inView, hasMore, loading, loadingMore]);

  const loadMorePosts = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    setLoadingMore(true);
    
    try {
      await loadPosts(activeTab, nextPage);
    } finally {
      setLoadingMore(false);
    }
  }, [activeTab, currentPage, loadingMore, hasMore]);

  const loadPosts = async (feedType: string = "trending", page: number = 0) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const pageSize = 10;
      const offset = page * pageSize;
      
      // Single optimized query with all required data and counts
      let query = supabase
        .from("posts")
        .select(`
          id,
          caption,
          author_id,
          game_id,
          visibility,
          created_at,
          author:profiles!author_id(id, username, display_name, avatar_url),
          game:games(id, name, cover_url),
          assets:post_assets(
            asset:assets(id, type, storage_path, thumbnail_url, mux_playback_id)
          ),
          likes_count:likes(count),
          comments_count:comments(count),
          user_liked:likes!inner(user_id)
        `)
        .eq("visibility", "public");

      // Apply different sorting and filtering based on feed type
      if (feedType === "trending") {
        // Order by engagement metrics (likes + comments) and recency
        query = query.order("created_at", { ascending: false });
      } else if (feedType === "recent") {
        query = query.order("created_at", { ascending: false });
      } else if (feedType === "following" && user) {
        // Get posts from followed users only
        const { data: followedUsers } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id);
        
        const followedIds = followedUsers?.map(f => f.following_id) || [];
        if (followedIds.length > 0) {
          query = query.in("author_id", followedIds);
        } else {
          // If not following anyone, show empty state
          setPosts([]);
          setLoading(false);
          return;
        }
        query = query.order("created_at", { ascending: false });
      }

      query = query.range(offset, offset + pageSize - 1);

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        // Process the data to get proper counts and user interactions
        const processedPosts = await Promise.all(
          data.map(async (post: any) => {
            // Get actual counts and user interactions in a single query
            const [likesResult, commentsResult, userLikeResult] = await Promise.all([
              supabase
                .from("likes")
                .select("id", { count: "exact", head: true })
                .eq("post_id", post.id),
              supabase
                .from("comments")
                .select("id", { count: "exact", head: true })
                .eq("post_id", post.id),
              user ? supabase
                .from("likes")
                .select("id")
                .eq("post_id", post.id)
                .eq("user_id", user.id)
                .maybeSingle() : Promise.resolve({ data: null })
            ]);

            return {
              ...post,
              assets: post.assets?.map((pa: any) => pa.asset).filter(Boolean) || [],
              likes_count: likesResult.count || 0,
              comments_count: commentsResult.count || 0,
              is_liked: !!userLikeResult.data
            };
          })
        );

        // Check if there are more posts
        setHasMore(data.length === pageSize);

        if (page === 0) {
          setPosts(processedPosts);
        } else {
          setPosts(prev => [...prev, ...processedPosts]);
        }
      } else {
        if (page === 0) {
          setPosts([]);
        }
        setHasMore(false);
      }
    } catch (error: any) {
      console.error("Error loading posts:", error);
      toast({
        title: "Error loading feed",
        description: "Unable to load posts. Please try again.",
        variant: "destructive"
      });
      if (page === 0) {
        setPosts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = (newPost: any) => {
    // Add the new post to the beginning of the feed
    const postWithCounts = {
      ...newPost,
      likes_count: 0,
      comments_count: 0,
      is_liked: false,
      assets: []
    };
    setPosts([postWithCounts, ...posts]);
    setCreatePostOpen(false);
    toast({
      title: "Post created!",
      description: "Your gaming moment has been shared.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <AuthNavbar />
      {/* Header */}
      <header className="sticky top-16 z-40 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-gaming font-bold bg-gradient-to-r from-gaming-purple to-gaming-pink bg-clip-text text-transparent">
              Gaming Feed
            </h1>
            <Button 
              onClick={() => setCreatePostOpen(true)}
              className="bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Share Moment
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Feed Column */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="trending" className="flex-1">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Trending
                </TabsTrigger>
                <TabsTrigger value="following" className="flex-1">
                  <Users className="mr-2 h-4 w-4" />
                  Following
                </TabsTrigger>
                <TabsTrigger value="recent" className="flex-1">
                  <Clock className="mr-2 h-4 w-4" />
                  Recent
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6 space-y-6">
                {loading ? (
                  <FeedSkeleton />
                ) : posts.length > 0 ? (
                  posts.map((post) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <PostCard post={post} currentUser={user} onUpdate={loadPosts} />
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">No posts yet. Be the first to share!</p>
                    <Button onClick={() => setCreatePostOpen(true)}>
                      Create First Post
                    </Button>
                  </div>
                )}
                
                {/* Load more indicator */}
                {posts.length > 0 && hasMore && (
                  <div ref={loadMoreRef} className="flex justify-center py-6">
                    {loadingMore && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading more posts...</span>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending Games - Placeholder removed, components created but commented out for now */}
            <div className="bg-card rounded-lg p-6">
              <h3 className="font-semibold mb-4">Trending Games</h3>
              <p className="text-sm text-muted-foreground text-center py-4">
                Real data loading implemented - activate components when ready
              </p>
            </div>

            {/* Suggested Users - Placeholder removed, components created but commented out for now */}
            <div className="bg-card rounded-lg p-6">
              <h3 className="font-semibold mb-4">Suggested Users</h3>
              <p className="text-sm text-muted-foreground text-center py-4">
                Real data loading implemented - activate components when ready
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Create Post Dialog */}
      <CreatePostDialog 
        open={createPostOpen} 
        onOpenChange={setCreatePostOpen}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
}
