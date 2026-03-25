"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import PostCard from "@/components/feed/PostCard";
import SavedCollections from "@/components/feed/SavedCollections";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bookmark } from "lucide-react";

interface Post {
  id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  profiles: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  post_likes: { user_id: string }[];
  bookmarks: { user_id: string }[];
  _count: {
    comments: number;
    post_likes: number;
    shares: number;
  };
}

export default function BookmarksPage() {
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchBookmarkedPosts();
  }, []);

  const fetchBookmarkedPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("bookmarks")
        .select(`
          post_id,
          posts (
            id,
            content,
            media_url,
            media_type,
            created_at,
            profiles:user_id (
              id,
              username,
              display_name,
              avatar_url
            ),
            post_likes (user_id),
            bookmarks (user_id),
            comments (count),
            shares (count)
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform the data structure
      const posts = data?.map((bookmark: any) => {
        const post = bookmark.posts;
        return {
          ...post,
          _count: {
            comments: post.comments?.[0]?.count || 0,
            post_likes: post.post_likes?.length || 0,
            shares: post.shares?.[0]?.count || 0,
          },
        };
      }) || [];

      setBookmarkedPosts(posts);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
          <Bookmark className="h-8 w-8" />
          Bookmarks
        </h1>
        <p className="text-muted-foreground">
          View and organize your saved posts
        </p>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Bookmarks</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-card rounded-lg p-6 animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : bookmarkedPosts.length === 0 ? (
            <div className="text-center py-12">
              <Bookmark className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No bookmarks yet</h3>
              <p className="text-muted-foreground">
                Posts you bookmark will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookmarkedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onPostDeleted={fetchBookmarkedPosts}
                  onPostUpdated={fetchBookmarkedPosts}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="collections">
          <SavedCollections />
        </TabsContent>
      </Tabs>
    </div>
  );
}
