"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Play } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import CreateStoryDialog from "./CreateStoryDialog";
import StoryViewer from "./StoryViewer";

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  caption: string;
  created_at: string;
  expires_at: string;
  views_count: number;
  author: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

export default function StoriesBar() {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    loadStories();
  }, [user]);

  const loadStories = async () => {
    if (!user) return;

    try {
      const supabase = createClient();

      // Get stories from users the current user follows (including own stories)
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      const followingIds = follows?.map((f) => f.following_id) || [];
      const userIds = [user.id, ...followingIds];

      // Get active stories (not expired)
      const { data: storiesData, error } = await supabase
        .from("stories")
        .select(`
          id,
          user_id,
          media_url,
          media_type,
          caption,
          created_at,
          expires_at,
          views_count,
          author:profiles!user_id(id, username, display_name, avatar_url)
        `)
        .in("user_id", userIds)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group stories by user
      const groupedStories = storiesData?.reduce((acc: any, story: any) => {
        const userId = story.user_id;
        if (!acc[userId]) {
          acc[userId] = {
            user: story.author,
            stories: []
          };
        }
        acc[userId].stories.push(story);
        return acc;
      }, {});

      setStories(Object.values(groupedStories || {}));
    } catch (error) {
      console.error("Error loading stories:", error);
    } finally {
      setLoading(false);
    }
  };

  const openStoryViewer = (index: number) => {
    setSelectedStoryIndex(index);
    setViewerOpen(true);
  };

  if (!user) return null;

  return (
    <>
      <Card className="p-4 mb-6">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4">
            {/* Create Story Button */}
            <div className="flex flex-col items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-16 w-16 rounded-full border-2 border-dashed hover:border-primary transition-colors"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="h-6 w-6" />
              </Button>
              <span className="text-xs font-medium">Your Story</span>
            </div>

            {/* Stories from followed users */}
            {loading ? (
              <>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className="h-16 w-16 rounded-full bg-secondary animate-pulse" />
                    <div className="h-3 w-12 bg-secondary animate-pulse rounded" />
                  </div>
                ))}
              </>
            ) : (
              stories.map((userStories, index) => (
                <motion.div
                  key={userStories.user.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex flex-col items-center gap-2 cursor-pointer"
                  onClick={() => openStoryViewer(index)}
                >
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-gaming-purple via-gaming-pink to-gaming-blue p-0.5">
                      <div className="h-full w-full rounded-full bg-background p-0.5">
                        <Avatar className="h-full w-full">
                          <AvatarImage src={userStories.user.avatar_url} />
                          <AvatarFallback>
                            {userStories.user.username?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                    <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold">
                      {userStories.stories.length}
                    </div>
                  </div>
                  <span className="text-xs font-medium max-w-[64px] truncate">
                    {userStories.user.username === user.username
                      ? "You"
                      : userStories.user.display_name || userStories.user.username}
                  </span>
                </motion.div>
              ))
            )}

            {!loading && stories.length === 0 && (
              <div className="flex items-center justify-center w-full py-4 text-muted-foreground">
                <p className="text-sm">No stories available. Create one to get started!</p>
              </div>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Card>

      <CreateStoryDialog
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onStoryCreated={loadStories}
      />

      <StoryViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        stories={stories}
        initialIndex={selectedStoryIndex}
      />
    </>
  );
}
