"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";

interface TypingIndicatorProps {
  conversationId: string;
  currentUserId: string;
}

export default function TypingIndicator({ conversationId, currentUserId }: TypingIndicatorProps) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase.channel(`typing:${conversationId}`);

    // Subscribe to typing events
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const typing = Object.values(state)
          .flat()
          .filter((user: any) => user.user_id !== currentUserId)
          .map((user: any) => user.display_name);
        
        setTypingUsers(typing);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  if (typingUsers.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-2 text-sm text-muted-foreground px-4 py-2"
    >
      <div className="flex gap-1">
        <motion.span
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 0.8, delay: 0 }}
          className="w-2 h-2 bg-primary rounded-full"
        />
        <motion.span
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
          className="w-2 h-2 bg-primary rounded-full"
        />
        <motion.span
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
          className="w-2 h-2 bg-primary rounded-full"
        />
      </div>
      <span>
        {typingUsers.length === 1
          ? `${typingUsers[0]} is typing...`
          : `${typingUsers.slice(0, 2).join(", ")}${typingUsers.length > 2 ? ` and ${typingUsers.length - 2} others` : ""} are typing...`
        }
      </span>
    </motion.div>
  );
}

// Hook to send typing indicators
export function useTypingIndicator(conversationId: string, userId: string, displayName: string) {
  const supabase = createClient();
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    const ch = supabase.channel(`typing:${conversationId}`);
    ch.subscribe();
    setChannel(ch);

    return () => {
      supabase.removeChannel(ch);
    };
  }, [conversationId]);

  const startTyping = () => {
    if (channel) {
      channel.track({ user_id: userId, display_name: displayName });
    }
  };

  const stopTyping = () => {
    if (channel) {
      channel.untrack();
    }
  };

  return { startTyping, stopTyping };
}
