"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Video, 
  Heart, 
  Settings, 
  Share2,
  Calendar,
  Trophy,
  Zap,
  Swords
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import PostCard from "@/components/feed/PostCard";
import FeedSkeleton from "@/components/feed/FeedSkeleton";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { toast } = useToast();
  const { user: currentUser, profile: currentProfile, loading: authLoading } = useAuth();
  
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentAchievements, setRecentAchievements] = useState<string[]>([]);
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
    totalLikes: 0
  });

  useEffect(() => {
    if (authLoading) {
      return;
    }

    loadProfile();
  }, [authLoading, currentProfile?.username, currentUser?.id, username]);

  const getProfileByIdentifier = async (supabase: ReturnType<typeof createClient>, identifier: string) => {
    const lookups = [
      () => supabase.from("profiles").select("*").eq("username", identifier).maybeSingle(),
      () => supabase.from("profiles").select("*").eq("id", identifier).maybeSingle(),
      async () => {
        try {
          return await supabase.from("profiles").select("*").eq("user_id", identifier).maybeSingle();
        } catch {
          return { data: null, error: null };
        }
      }
    ];

    for (const lookup of lookups) {
      const result = await lookup();
      if (result.error) {
        continue;
      }

      if (result.data) {
        return result.data;
      }
    }

    return null;
  };

  const getFollowTargetColumn = async (supabase: ReturnType<typeof createClient>, followerId: string, targetId: string) => {
    const modernQuery = await supabase
      .from("follows")
      .select("follower_id", { head: true, count: "exact" })
      .eq("follower_id", followerId)
      .eq("following_id", targetId);

    if (!modernQuery.error) {
      return "following_id" as const;
    }

    const legacyQuery = await supabase
      .from("follows")
      .select("follower_id", { head: true, count: "exact" })
      .eq("follower_id", followerId)
      .eq("followed_id", targetId);

    if (!legacyQuery.error) {
      return "followed_id" as const;
    }

    return null;
  };

  const getFollowCount = async (supabase: ReturnType<typeof createClient>, column: "following_id" | "followed_id" | "follower_id", value: string) => {
    const query = await supabase
      .from("follows")
      .select("follower_id", { count: "exact", head: true })
      .eq(column, value);

    if (query.error) {
      return 0;
    }

    return query.count || 0;
  };

  const loadProfile = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const supabase = createClient();

      const identifier = username === "me" && currentUser ? currentUser.id : username;
      const profileData =
        (currentUser &&
          (identifier === currentUser.id || identifier === currentProfile?.username) &&
          currentProfile) ||
        (await getProfileByIdentifier(supabase, identifier));

      if (!profileData) {
        setProfile(null);
        setPosts([]);
        setRecentAchievements([]);
        setStats({
          posts: 0,
          followers: 0,
          following: 0,
          totalLikes: 0
        });
        setErrorMessage(
          currentUser
            ? "We couldn't find a profile for this account yet."
            : "This profile may be unavailable, private, or no longer exists."
        );
        return;
      }

      setProfile(profileData);

      let postsData: any[] = [];
      const richPostsQuery = await supabase
        .from("posts")
        .select(`
          *,
          author:profiles!author_id(*),
          assets:post_assets(
            asset:assets(*)
          ),
          game:games(*),
          _count:likes(count)
        `)
        .eq("author_id", profileData.id)
        .order("created_at", { ascending: false });

      if (!richPostsQuery.error) {
        postsData = richPostsQuery.data || [];
      } else {
        const fallbackPostsQuery = await supabase
          .from("posts")
          .select("*")
          .eq("author_id", profileData.id)
          .order("created_at", { ascending: false });

        if (!fallbackPostsQuery.error) {
          postsData = (fallbackPostsQuery.data || []).map((post) => ({
            ...post,
            author: profileData,
            assets: [],
            game: null,
            _count: []
          }));
        }
      }

      setPosts(postsData);

      const followTargetColumn = profileData.id
        ? await getFollowTargetColumn(supabase, profileData.id, profileData.id)
        : null;

      const [followers, following, totalLikesQuery, achievementsQuery] = await Promise.all([
        getFollowCount(supabase, followTargetColumn || "following_id", profileData.id),
        getFollowCount(supabase, "follower_id", profileData.id),
        postsData.length > 0
          ? supabase
              .from("likes")
              .select("post_id", { count: "exact", head: true })
              .in("post_id", postsData.map((post) => post.id))
          : Promise.resolve({ count: 0, error: null } as any),
        supabase
          .from("user_achievements")
          .select("achievement:achievements(name)")
          .eq("user_id", profileData.id)
          .not("unlocked_at", "is", null)
          .order("unlocked_at", { ascending: false })
          .limit(4)
      ]);

      setStats({
        posts: postsData.length,
        followers,
        following,
        totalLikes: totalLikesQuery.count || 0
      });

      setRecentAchievements(
        (achievementsQuery.data || [])
          .map((entry: any) => Array.isArray(entry.achievement) ? entry.achievement[0]?.name : entry.achievement?.name)
          .filter(Boolean)
      );

      if (currentUser && profileData.id !== currentUser.id) {
        const targetColumn = await getFollowTargetColumn(supabase, currentUser.id, profileData.id);
        if (targetColumn) {
          const { data: followData } = await supabase
            .from("follows")
            .select("follower_id")
            .eq("follower_id", currentUser.id)
            .eq(targetColumn, profileData.id)
            .maybeSingle();

          setIsFollowing(Boolean(followData));
        } else {
          setIsFollowing(false);
        }
      } else {
        setIsFollowing(false);
      }
    } catch (error: any) {
      console.error("Error loading profile:", error);
      setErrorMessage("We hit a problem while loading this profile. Please try again in a moment.");
      toast({
        title: "Profile unavailable",
        description: "Unable to load this profile right now.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      toast({
        title: "Sign in required",
        description: "Please sign in to follow users",
        variant: "destructive"
      });
      return;
    }

    const supabase = createClient();
    
    try {
      const targetColumn = await getFollowTargetColumn(supabase, currentUser.id, profile.id);
      if (!targetColumn) {
        throw new Error("Follow system unavailable");
      }

      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUser.id)
          .eq(targetColumn, profile.id);
        
        setIsFollowing(false);
        setStats(prev => ({ ...prev, followers: prev.followers - 1 }));
      } else {
        await supabase
          .from("follows")
          .insert({
            follower_id: currentUser.id,
            [targetColumn]: profile.id
          });
        
        setIsFollowing(true);
        setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
      }
    } catch (error: any) {
      console.error("Error toggling follow:", error);
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <FeedSkeleton />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold mb-2">Profile not found</h1>
          <p className="text-muted-foreground">
            {errorMessage || "This user doesn't exist."}
          </p>
          {!currentUser && (
            <div className="mt-4">
              <Button asChild>
                <Link href="/auth/signin">Sign in</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id || currentUser?.id === profile.user_id;
  const gamerTag = profile.username ? `${profile.username}#${profile.id.slice(0, 4).toUpperCase()}` : "Unknown#0000";
  const connectedPlatforms =
    profile?.gaming_accounts && typeof profile.gaming_accounts === "object"
      ? Object.keys(profile.gaming_accounts as Record<string, unknown>)
      : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-gaming-purple/20 via-gaming-pink/20 to-gaming-blue/20 pb-8">
        <div className="container mx-auto px-4 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-lg p-6 -mb-4"
          >
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Avatar */}
              <Avatar className="h-32 w-32 border-4 border-primary/20">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="bg-gradient-to-r from-gaming-purple to-gaming-pink text-white text-3xl">
                  {profile.username?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-1">
                      {profile.display_name || profile.username}
                    </h1>
                    <p className="text-muted-foreground">@{profile.username}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge className="bg-gaming-cyan/20 text-gaming-cyan border border-gaming-cyan/45">
                        Gamer Tag: {gamerTag}
                      </Badge>
                      {profile.premium_status && (
                        <Badge className="bg-gradient-to-r from-gaming-purple to-gaming-pink text-white">
                          Premium
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {isOwnProfile ? (
                      <Button variant="outline" asChild>
                        <Link href="/profile/edit">
                        <Settings className="mr-2 h-4 w-4" />
                        Edit Profile
                        </Link>
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={handleFollow}
                          variant={isFollowing ? "outline" : "default"}
                          className={!isFollowing ? "bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90" : ""}
                        >
                          {isFollowing ? "Following" : "Follow"}
                        </Button>
                        <Button variant="outline" size="icon">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p className="mb-4 whitespace-pre-wrap">{profile.bio}</p>
                )}

                {/* Stats */}
                <div className="flex gap-6 mb-4">
                  <div>
                    <span className="font-bold text-xl">{stats.posts}</span>
                    <span className="text-muted-foreground ml-1">posts</span>
                  </div>
                  <div>
                    <span className="font-bold text-xl">{stats.followers}</span>
                    <span className="text-muted-foreground ml-1">followers</span>
                  </div>
                  <div>
                    <span className="font-bold text-xl">{stats.following}</span>
                    <span className="text-muted-foreground ml-1">following</span>
                  </div>
                  <div>
                    <span className="font-bold text-xl">{stats.totalLikes}</span>
                    <span className="text-muted-foreground ml-1">likes</span>
                  </div>
                  <div>
                    <span className="font-bold text-xl text-gaming-green">{profile.forge_points || 0}</span>
                    <span className="text-muted-foreground ml-1">forge points</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {recentAchievements.length > 0 ? (
                    recentAchievements.map((achievement) => (
                      <Badge key={achievement} variant="outline" className="border-gaming-purple/40">
                        <Trophy className="h-3 w-3 mr-1 text-gaming-cyan" />
                        {achievement}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No achievement highlights available.</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {format(new Date(profile.created_at), "MMMM yyyy")}
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-gaming-green" />
                    {connectedPlatforms.length} linked gaming accounts
                  </div>
                  <Link href="/teams" className="inline-flex items-center gap-1 hover:text-foreground transition">
                    <Swords className="h-4 w-4 text-gaming-cyan" />
                    Join a clan or guild
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full max-w-md">
            <TabsTrigger value="posts" className="flex-1">
              <Video className="mr-2 h-4 w-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="liked" className="flex-1">
              <Heart className="mr-2 h-4 w-4" />
              Liked
            </TabsTrigger>
            <TabsTrigger value="media" className="flex-1">
              Media
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            <div className="grid gap-6 max-w-2xl">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <PostCard post={post} currentUser={currentUser} onUpdate={loadProfile} />
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No posts yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="liked" className="mt-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Liked posts will appear here</p>
            </div>
          </TabsContent>

          <TabsContent value="media" className="mt-6">
            <div className="grid grid-cols-3 gap-2">
              {posts
                .filter(post => post.assets?.length > 0)
                .map((post) => (
                  <div key={post.id} className="aspect-square bg-secondary rounded overflow-hidden">
                    {post.assets[0]?.asset?.thumbnail_url && (
                      <img
                        src={post.assets[0].asset.thumbnail_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
