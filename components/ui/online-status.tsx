"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface OnlineStatusProps {
  userId: string;
  showLabel?: boolean;
  className?: string;
}

export default function OnlineStatus({ userId, showLabel = false, className }: OnlineStatusProps) {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<Date | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Check initial status
    checkOnlineStatus();

    // Subscribe to presence changes
    const channel = supabase.channel(`online:${userId}`);
    
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const online = Object.keys(state).length > 0;
        setIsOnline(online);
        
        if (!online) {
          // Get last seen from database
          fetchLastSeen();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const checkOnlineStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("last_seen_at")
        .eq("id", userId)
        .single();

      if (error) throw error;

      if (data?.last_seen_at) {
        const lastSeenDate = new Date(data.last_seen_at);
        const now = new Date();
        const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);
        
        // Consider online if last seen within 5 minutes
        setIsOnline(diffMinutes < 5);
        setLastSeen(lastSeenDate);
      }
    } catch (error) {
      console.error("Error checking online status:", error);
    }
  };

  const fetchLastSeen = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("last_seen_at")
        .eq("id", userId)
        .single();

      if (error) throw error;
      if (data?.last_seen_at) {
        setLastSeen(new Date(data.last_seen_at));
      }
    } catch (error) {
      console.error("Error fetching last seen:", error);
    }
  };

  const getLastSeenText = () => {
    if (!lastSeen) return "Offline";
    
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return "Offline";
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <div
          className={cn(
            "w-3 h-3 rounded-full",
            isOnline ? "bg-green-500" : "bg-gray-400"
          )}
        >
          {isOnline && (
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping opacity-75" />
          )}
        </div>
      </div>
      {showLabel && (
        <span className="text-sm text-muted-foreground">
          {isOnline ? "Online" : getLastSeenText()}
        </span>
      )}
    </div>
  );
}

// Hook to update user's online status
export function useOnlinePresence() {
  const supabase = createClient();
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    let presenceChannel: any;

    const setupPresence = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      presenceChannel = supabase.channel(`online:${user.id}`);
      
      presenceChannel
        .on("presence", { event: "sync" }, () => {
          // Update last_seen_at in database
          supabase
            .from("profiles")
            .update({ last_seen_at: new Date().toISOString() })
            .eq("id", user.id)
            .then();
        })
        .subscribe(async (status: string) => {
          if (status === "SUBSCRIBED") {
            await presenceChannel.track({ online_at: new Date().toISOString() });
          }
        });

      setChannel(presenceChannel);
    };

    setupPresence();

    // Update presence every minute
    const interval = setInterval(async () => {
      if (presenceChannel) {
        await presenceChannel.track({ online_at: new Date().toISOString() });
      }
    }, 60000);

    return () => {
      clearInterval(interval);
      if (presenceChannel) {
        supabase.removeChannel(presenceChannel);
      }
    };
  }, []);

  return null;
}
