"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { TrendingUp, Sparkles, Clock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FeedSkeleton from "@/components/feed/FeedSkeleton";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import AuthNavbar from "@/components/layout/AuthNavbar";

// Lazy load heavy components
const PostCard = dynamic(() => import("@/components/feed/PostCard"), {
  ssr: false,
});

export default function ExplorePage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("trending");
  
  const { user } = useAuth();

  useEffect(() => {
    loadPosts();
  }, [selectedTab]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      
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
          assets:post_assets(asset:assets(id, type, storage_path, thumbnail_url))
        `)
        .eq("visibility", "public");

      if (selectedTab === "trending") {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte("created_at", sevenDaysAgo);
      }

      query = query.order("created_at", { ascending: false }).limit(50);

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        const postIds = data.map((p: any) => p.id);
        const [allLikes, allComments, userLikes] = await Promise.all([
          supabase.from("likes").select("post_id").in("post_id", postIds),
          supabase.from("comments").select("post_id").in("post_id", postIds),
          user ? supabase.from("likes").select("post_id").in("post_id", postIds).eq("user_id", user.id) : Promise.resolve({ data: [] })
        ]);

        const likesMap = new Map();
        const commentsMap = new Map();
        const userLikesSet = new Set(userLikes.data?.map((l: any) => l.post_id) || []);

        allLikes.data?.forEach((like: any) => {
          likesMap.set(like.post_id, (likesMap.get(like.post_id) || 0) + 1);
        });

        allComments.data?.forEach((comment: any) => {
          commentsMap.set(comment.post_id, (commentsMap.get(comment.post_id) || 0) + 1);
        });

        const processedPosts = data.map((post: any) => ({
          ...post,
          assets: post.assets?.map((pa: any) => pa.asset).filter(Boolean) || [],
          likes_count: likesMap.get(post.id) || 0,
          comments_count: commentsMap.get(post.id) || 0,
          is_liked: userLikesSet.has(post.id)
        }));

        setPosts(processedPosts);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error("Error loading posts:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = searchQuery.trim()
    ? posts.filter(post =>
        post.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.game?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : posts;

  return (
    <div className="min-h-screen bg-background">
      <AuthNavbar />
      
      <header className="sticky top-16 z-40 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-gaming font-bold bg-gradient-to-r from-gaming-purple to-gaming-pink bg-clip-text text-transparent">
              Explore
            </h1>
            
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts, creators, games..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="w-full max-w-2xl">
            <TabsTrigger value="trending" className="flex-1">
              <TrendingUp className="mr-2 h-4 w-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex-1">
              <Clock className="mr-2 h-4 w-4" />
              Latest
            </TabsTrigger>
            <TabsTrigger value="popular" className="flex-1">
              <Sparkles className="mr-2 h-4 w-4" />
              Popular
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-6">
            {loading ? (
              <FeedSkeleton />
            ) : filteredPosts.length > 0 ? (
              <div className="space-y-6">
                {filteredPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <PostCard post={post} currentUser={user} onUpdate={loadPosts} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-semibold mb-2">No content found</p>
                <p className="text-muted-foreground">
                  {searchQuery ? "Try a different search term" : "Check back later for new content"}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
