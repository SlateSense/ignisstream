"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, TrendingUp, Users, Clock } from "lucide-react";
import AuthNavbar from "@/components/layout/AuthNavbar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PostCard from "@/components/feed/PostCard";
import CreatePostDialog from "@/components/feed/CreatePostDialog";
import FeedSkeleton from "@/components/feed/FeedSkeleton";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

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
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("trending");

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    
    loadPosts(activeTab);
  }, [user, router, activeTab]);

  const loadPosts = async (feedType: string = "trending") => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      let query = supabase
        .from("posts")
        .select(`
          *,
          author:profiles!author_id(id, username, display_name, avatar_url),
          game:games(id, name, cover_url),
          assets:post_assets(
            asset:assets(id, type, storage_path)
          )
        `)
        .eq("visibility", "public");

      // Apply different sorting based on feed type
      if (feedType === "trending") {
        query = query.order("created_at", { ascending: false });
      } else if (feedType === "recent") {
        query = query.order("created_at", { ascending: false });
      } else if (feedType === "following") {
        // For following feed, we'd need to join with follows table
        query = query.order("created_at", { ascending: false });
      }

      query = query.limit(20);

      const { data, error } = await query;

      if (error) throw error;

      // Get likes and comments count for each post
      if (data && data.length > 0) {
        const postsWithCounts = await Promise.all(
          data.map(async (post) => {
            // Get likes count
            const { count: likesCount } = await supabase
              .from("likes")
              .select("*", { count: "exact", head: true })
              .eq("post_id", post.id);

            // Get comments count
            const { count: commentsCount } = await supabase
              .from("comments")
              .select("*", { count: "exact", head: true })
              .eq("post_id", post.id);

            // Check if current user liked this post
            const { data: userLike } = await supabase
              .from("likes")
              .select("id")
              .eq("post_id", post.id)
              .eq("user_id", user?.id)
              .single();

            return {
              ...post,
              assets: post.assets?.map((pa: any) => pa.asset) || [],
              likes_count: likesCount || 0,
              comments_count: commentsCount || 0,
              is_liked: !!userLike
            };
          })
        );

        setPosts(postsWithCounts);
      } else {
        setPosts([]);
      }
    } catch (error: any) {
      console.error("Error loading posts:", error);
      toast({
        title: "Error loading feed",
        description: "Unable to load posts. Please try again.",
        variant: "destructive"
      });
      setPosts([]);
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
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending Games */}
            <div className="bg-card rounded-lg p-6">
              <h3 className="font-semibold mb-4">Trending Games</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">GTA V</span>
                  <span className="text-xs text-muted-foreground">2.3k posts</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Valorant</span>
                  <span className="text-xs text-muted-foreground">1.8k posts</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Fortnite</span>
                  <span className="text-xs text-muted-foreground">1.5k posts</span>
                </div>
              </div>
            </div>

            {/* Top Creators */}
            <div className="bg-card rounded-lg p-6">
              <h3 className="font-semibold mb-4">Top Creators</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gaming-purple to-gaming-pink" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">ProGamer123</p>
                    <p className="text-xs text-muted-foreground">15.2k followers</p>
                  </div>
                  <Button size="sm" variant="outline">Follow</Button>
                </div>
              </div>
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
