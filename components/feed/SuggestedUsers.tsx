"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { Users } from "lucide-react";
import Link from "next/link";

interface SuggestedUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  follower_count: number;
  is_following: boolean;
}

interface SuggestedUsersProps {
  currentUser: any;
}

export default function SuggestedUsers({ currentUser }: SuggestedUsersProps) {
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingStates, setFollowingStates] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();

  useEffect(() => {
    if (currentUser) {
      loadSuggestedUsers();
    }
  }, [currentUser]);

  const loadSuggestedUsers = async () => {
    if (!currentUser) return;

    try {
      const supabase = createClient();
      
      // Get users that the current user is NOT following
      const { data: followingData } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", currentUser.id);

      const followingIds = followingData?.map(f => f.following_id) || [];
      followingIds.push(currentUser.id); // Exclude self

      // Get suggested users (users with most followers that we're not following)
      const { data: usersData, error } = await supabase
        .from("profiles")
        .select(`
          id,
          username,
          display_name,
          avatar_url,
          follower_count:follows!following_id(count)
        `)
        .not("id", "in", `(${followingIds.join(',')})`)
        .limit(5);

      if (error) throw error;

      const processed = usersData?.map((user: any) => ({
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        follower_count: user.follower_count?.[0]?.count || 0,
        is_following: false
      })) || [];

      // Sort by follower count
      processed.sort((a, b) => b.follower_count - a.follower_count);

      setSuggestedUsers(processed);
      
      // Initialize following states
      const states: { [key: string]: boolean } = {};
      processed.forEach(user => {
        states[user.id] = false;
      });
      setFollowingStates(states);

    } catch (error) {
      console.error("Error loading suggested users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId: string, username: string) => {
    if (!currentUser) return;

    const supabase = createClient();
    const isCurrentlyFollowing = followingStates[userId];

    try {
      if (isCurrentlyFollowing) {
        // Unfollow
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUser.id)
          .eq("following_id", userId);

        if (error) throw error;

        setFollowingStates(prev => ({ ...prev, [userId]: false }));
        toast({
          title: "Unfollowed",
          description: `You unfollowed @${username}`,
        });
      } else {
        // Follow
        const { error } = await supabase
          .from("follows")
          .insert({
            follower_id: currentUser.id,
            following_id: userId
          });

        if (error) throw error;

        setFollowingStates(prev => ({ ...prev, [userId]: true }));
        toast({
          title: "Following",
          description: `You are now following @${username}`,
        });
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

  if (!currentUser) return null;

  if (loading) {
    return (
      <div className="bg-card rounded-lg p-6">
        <h3 className="font-semibold mb-4">Suggested Users</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-muted" />
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-20 mb-1"></div>
                <div className="h-3 bg-muted rounded w-16"></div>
              </div>
              <div className="h-8 w-16 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-6">
      <h3 className="font-semibold mb-4 flex items-center">
        <Users className="mr-2 h-4 w-4" />
        Suggested Users
      </h3>
      <div className="space-y-3">
        {suggestedUsers.length > 0 ? (
          suggestedUsers.map((user) => (
            <div key={user.id} className="flex items-center space-x-3">
              <Link href={`/profile/${user.username}`}>
                <Avatar className="h-8 w-8 border border-border hover:border-primary/50 transition-colors">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-r from-gaming-purple to-gaming-pink text-white text-xs">
                    {user.username?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/profile/${user.username}`}>
                  <p className="text-sm font-medium truncate hover:underline">
                    {user.display_name || user.username}
                  </p>
                </Link>
                <p className="text-xs text-muted-foreground">
                  {user.follower_count} follower{user.follower_count !== 1 ? 's' : ''}
                </p>
              </div>
              <Button 
                size="sm" 
                variant={followingStates[user.id] ? "secondary" : "outline"}
                onClick={() => handleFollow(user.id, user.username)}
                className="shrink-0"
              >
                {followingStates[user.id] ? "Following" : "Follow"}
              </Button>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No suggestions available
          </p>
        )}
      </div>
    </div>
  );
}
