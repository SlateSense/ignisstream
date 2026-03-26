"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Plus, TrendingUp, Users, Clock, Loader2 } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { Button } from "@/components/ui/button";

// Lazy load navbar to prevent blocking
const AuthNavbar = dynamic(() => import("@/components/layout/AuthNavbar"), {
  ssr: false,
});
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FeedSkeleton from "@/components/feed/FeedSkeleton";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// Lazy load heavy components
const PostCard = dynamic(() => import("@/components/feed/PostCard"), {
  ssr: false,
});
const CreatePostDialog = dynamic(() => import("@/components/feed/CreatePostDialog"), {
  ssr: false,
});
const TrendingGames = dynamic(() => import("@/components/feed/TrendingGames"), {
  ssr: false,
});
const SuggestedUsers = dynamic(() => import("@/components/feed/SuggestedUsers"), {
  ssr: false,
});

interface Post {
  id: number | string;
  caption: string | null;
  author_id: string;
  game_id: number | string | null;
  visibility?: string;
  created_at: string;
  author: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  game: {
    id: number | string;
    name: string;
    cover_url: string | null;
  } | null;
  assets: Array<{
    asset?: {
      id: number | string;
      type: string;
      storage_path: string | null;
      thumbnail_url?: string | null;
      mux_playback_id?: string | null;
    };
  }>;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

export default function FeedPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("trending");
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const requestIdRef = useRef(0);
  
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: "100px",
  });

  const normalizeApiPost = (post: any): Post => {
    const author = Array.isArray(post.author) ? post.author[0] : post.author;
    const game = Array.isArray(post.game) ? post.game[0] : post.game;
    const mediaUrl = post.media_url || post.image_url || post.thumbnail_url || null;
    const mediaType = post.media_type || "image";

    return {
      id: post.id,
      caption: post.caption || post.content || post.title || "",
      author_id: post.author_id || post.user_id || author?.id || "",
      game_id: post.game_id || game?.id || null,
      visibility: post.visibility,
      created_at: post.created_at,
      author: {
        id: author?.id || "",
        username: author?.username || "unknown",
        display_name: author?.display_name || author?.username || "Unknown",
        avatar_url: author?.avatar_url || null,
      },
      game: game
        ? {
            id: game.id,
            name: game.name,
            cover_url: game.cover_url || null,
          }
        : null,
      assets: mediaUrl
        ? [
            {
              asset: {
                id: `media-${post.id}`,
                type: mediaType,
                storage_path: mediaUrl,
                thumbnail_url: post.thumbnail_url || null,
                mux_playback_id: post.mux_playback_id || null,
              },
            },
          ]
        : [],
      likes_count: Number(post.likes_count ?? post.like_count ?? 0),
      comments_count: Number(post.comments_count ?? post.comment_count ?? 0),
      is_liked: Boolean(post.is_liked),
    };
  };

  const fetchPostsFromApi = async (page: number, limit: number) => {
    const response = await fetch(`/api/posts?page=${page + 1}&limit=${limit}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload?.error || "Failed to fetch feed posts");
    }

    const payload = await response.json();
    const apiPosts = Array.isArray(payload?.posts) ? payload.posts : [];
    const hasMoreFromApi = Boolean(payload?.pagination?.hasMore);
    return { apiPosts, hasMoreFromApi };
  };

  const loadPosts = useCallback(async (feedType: string = "trending", page: number = 0) => {
    const requestId = ++requestIdRef.current;
    if (page === 0) {
      setIsLoading(true);
    }

    try {
      const pageSize = 10;
      const apiLimit = feedType === "following" ? 30 : pageSize;
      const { apiPosts, hasMoreFromApi } = await fetchPostsFromApi(page, apiLimit);
      let normalizedRows = apiPosts.map(normalizeApiPost);

      if (feedType === "following") {
        if (!user) {
          if (requestId === requestIdRef.current) {
            if (page === 0) setPosts([]);
            setHasMore(false);
          }
          return true;
        }

        const supabase = createClient();
        const { data: followedUsers } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id);

        const followedIds = new Set((followedUsers || []).map((f: any) => f.following_id));
        normalizedRows = normalizedRows
          .filter((post: Post) => followedIds.has(post.author_id))
          .slice(0, pageSize);
      }

      if (requestId === requestIdRef.current) {
        setHasMore(feedType === "following" ? hasMoreFromApi : hasMoreFromApi);
        if (page === 0) {
          setPosts(normalizedRows);
          try {
            const cacheKey = `feed_cache_${feedType}`;
            const payload = { ts: Date.now(), posts: normalizedRows };
            localStorage.setItem(cacheKey, JSON.stringify(payload));
          } catch {}
        } else {
          setPosts((prev) => [...prev, ...normalizedRows]);
        }
      }

      return true;
    } catch (error: any) {
      const supabase = createClient();
      const pageSize = 10;
      const offset = page * pageSize;

      const authorProbe = await supabase.from("posts").select("author_id").limit(1);
      const authorColumn: "author_id" | "user_id" = authorProbe.error ? "user_id" : "author_id";

      let followedIds: string[] = [];
      if (feedType === "following" && user) {
        const { data: followedUsers } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id);
        followedIds = followedUsers?.map((f: any) => f.following_id) || [];
        if (followedIds.length === 0) {
          if (requestId === requestIdRef.current) {
            if (page === 0) setPosts([]);
            setHasMore(false);
          }
          return true;
        }
      }

      let query = supabase
        .from("posts")
        .select(`id, caption, ${authorColumn}, visibility, created_at, game_id`)
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (feedType === "following" && followedIds.length > 0) {
        query = query.in(authorColumn, followedIds);
      }

      let { data: rows, error: rowsError } = await query;
      if (rowsError) {
        return false;
      }
      const normalizedRows = (rows || []).map((row: any) => ({
        id: row.id,
        caption: row.caption || "",
        author_id: row[authorColumn],
        game_id: row.game_id || null,
        visibility: row.visibility,
        created_at: row.created_at,
        author: null,
        game: null,
        assets: [],
        likes_count: 0,
        comments_count: 0,
        is_liked: false,
      }));

      const authorIds = Array.from(new Set(normalizedRows.map((p: any) => p.author_id).filter(Boolean)));
      const gameIds = Array.from(new Set(normalizedRows.map((p: any) => p.game_id).filter(Boolean)));

      let authorsMap = new Map<string, any>();
      if (authorIds.length > 0) {
        const { data: authors } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", authorIds);
        (authors || []).forEach((a: any) => authorsMap.set(a.id, a));
      }

      let gamesMap = new Map<string, any>();
      if (gameIds.length > 0) {
        const { data: games } = await supabase
          .from("games")
          .select("id, name, cover_url")
          .in("id", gameIds as any[]);
        (games || []).forEach((g: any) => gamesMap.set(String(g.id), g));
      }

      const postIds = normalizedRows.map((p: any) => p.id);
      const tryCounts = async (table: string) => {
        const { data } = await supabase.from(table).select("post_id").in("post_id", postIds);
        return data || [];
      };
      const likesRows = (await tryCounts("likes")).length > 0 ? await tryCounts("likes") : await tryCounts("post_likes");
      const { data: commentsRows } = await supabase.from("comments").select("post_id").in("post_id", postIds);
      const userLikesRows = user
        ? ((await supabase
            .from("likes")
            .select("post_id")
            .in("post_id", postIds)
            .eq("user_id", user.id)).data ||
          ((await supabase
            .from("post_likes")
            .select("post_id")
            .in("post_id", postIds)
            .eq("user_id", user.id)).data || []))
        : [];

      const likesMap = new Map<string, number>();
      likesRows.forEach((row: any) => {
        const k = String(row.post_id);
        likesMap.set(k, (likesMap.get(k) || 0) + 1);
      });
      const commentsMap = new Map<string, number>();
      (commentsRows || []).forEach((row: any) => {
        const k = String(row.post_id);
        commentsMap.set(k, (commentsMap.get(k) || 0) + 1);
      });
      const userLikesSet = new Set((userLikesRows || []).map((r: any) => String(r.post_id)));

      const processed = normalizedRows.map((post: any) => ({
        ...post,
        author: authorsMap.get(post.author_id) || {
          id: post.author_id,
          username: "unknown",
          display_name: "Unknown",
          avatar_url: null,
        },
        game: post.game_id ? gamesMap.get(String(post.game_id)) || null : null,
        likes_count: likesMap.get(String(post.id)) || 0,
        comments_count: commentsMap.get(String(post.id)) || 0,
        is_liked: userLikesSet.has(String(post.id)),
      }));

      if (requestId === requestIdRef.current) {
        setHasMore(processed.length === pageSize);
        if (page === 0) {
          setPosts(processed);
        } else {
          setPosts((prev) => [...prev, ...processed]);
        }
      }

      return true;
    } finally {
      if (page === 0 && requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [toast, user]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    try {
      const cacheKey = `feed_cache_${activeTab}`;
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const payload = JSON.parse(raw);
        if (Array.isArray(payload?.posts)) {
          setPosts(payload.posts);
          setIsLoading(false);
        }
      }
    } catch {}
    setCurrentPage(0);
    setHasMore(true);
    loadPosts(activeTab, 0);
  }, [user, loading, router, activeTab, loadPosts]);

  const loadMorePosts = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    const nextPage = currentPage + 1;
    setLoadingMore(true);

    try {
      const success = await loadPosts(activeTab, nextPage);
      if (success) {
        setCurrentPage(nextPage);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [activeTab, currentPage, hasMore, loadPosts, loadingMore]);

  useEffect(() => {
    if (inView && hasMore && !isLoading && !loadingMore) {
      loadMorePosts();
    }
  }, [inView, hasMore, isLoading, loadingMore, loadMorePosts]);

  const handlePostCreated = (newPost: any) => {
    // Add the new post to the beginning of the feed
    const postWithCounts = {
      ...newPost,
      likes_count: 0,
      comments_count: 0,
      is_liked: false
    };
    setPosts([postWithCounts, ...posts]);
    setCreatePostOpen(false);
    toast({
      title: "Post created!",
      description: "Your gaming moment has been shared.",
    });
  };

  return (
    <div className="min-h-screen bg-background pt-20 overflow-x-hidden">
      <AuthNavbar />
      {/* Header */}
      <header className="relative bg-background/80 backdrop-blur-md border-b">
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
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          {/* Feed Column */}
          <div className="lg:col-span-2 min-w-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full overflow-x-auto">
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

              <div className="mt-6 space-y-6">
                {isLoading ? (
                  <FeedSkeleton />
                ) : posts.length > 0 ? (
                  posts.map((post: Post) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="relative"
                    >
                      <PostCard post={post} currentUser={user} onUpdate={() => loadPosts(activeTab, 0)} />
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
              </div>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 min-w-0 lg:sticky lg:top-24">
            <TrendingGames />
            <SuggestedUsers currentUser={user} />
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
