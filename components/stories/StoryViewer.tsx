"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

interface StoryViewerProps {
  isOpen: boolean;
  onClose: () => void;
  stories: any[];
  initialIndex: number;
}

export default function StoryViewer({
  isOpen,
  onClose,
  stories,
  initialIndex
}: StoryViewerProps) {
  const [currentUserIndex, setCurrentUserIndex] = useState(initialIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { user } = useAuth();

  const currentUserStories = stories[currentUserIndex];
  const currentStory = currentUserStories?.stories[currentStoryIndex];
  const storyDuration = 5000; // 5 seconds per story

  useEffect(() => {
    if (!isOpen || isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + (100 / (storyDuration / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, currentUserIndex, currentStoryIndex, isPaused]);

  useEffect(() => {
    if (isOpen && currentStory && user) {
      // Mark story as viewed
      markAsViewed();
    }
  }, [currentStory, isOpen]);

  const markAsViewed = async () => {
    if (!user || !currentStory) return;

    try {
      const supabase = createClient();
      await supabase.from("story_views").insert({
        story_id: currentStory.id,
        user_id: user.id
      });

      // Update views count
      await supabase
        .from("stories")
        .update({ views_count: (currentStory.views_count || 0) + 1 })
        .eq("id", currentStory.id);
    } catch (error) {
      // Ignore duplicate view errors
      console.log("Story view already recorded");
    }
  };

  const handleNext = () => {
    const nextStoryIndex = currentStoryIndex + 1;
    
    if (nextStoryIndex < currentUserStories.stories.length) {
      setCurrentStoryIndex(nextStoryIndex);
      setProgress(0);
    } else {
      // Move to next user's stories
      const nextUserIndex = currentUserIndex + 1;
      if (nextUserIndex < stories.length) {
        setCurrentUserIndex(nextUserIndex);
        setCurrentStoryIndex(0);
        setProgress(0);
      } else {
        onClose();
      }
    }
  };

  const handlePrevious = () => {
    const prevStoryIndex = currentStoryIndex - 1;
    
    if (prevStoryIndex >= 0) {
      setCurrentStoryIndex(prevStoryIndex);
      setProgress(0);
    } else {
      // Move to previous user's stories
      const prevUserIndex = currentUserIndex - 1;
      if (prevUserIndex >= 0) {
        setCurrentUserIndex(prevUserIndex);
        setCurrentStoryIndex(stories[prevUserIndex].stories.length - 1);
        setProgress(0);
      }
    }
  };

  if (!currentUserStories || !currentStory) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[90vh] p-0 bg-black">
        <div className="relative h-full flex flex-col">
          {/* Progress bars */}
          <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2">
            {currentUserStories.stories.map((_, index: number) => (
              <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                {index === currentStoryIndex ? (
                  <motion.div
                    className="h-full bg-white"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                  />
                ) : (
                  <div
                    className="h-full bg-white"
                    style={{ width: index < currentStoryIndex ? "100%" : "0%" }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-4 left-0 right-0 z-10 px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-white">
                <AvatarImage src={currentUserStories.user.avatar_url} />
                <AvatarFallback>
                  {currentUserStories.user.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white font-semibold text-sm">
                  {currentUserStories.user.display_name || currentUserStories.user.username}
                </p>
                <p className="text-white/80 text-xs">
                  {formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Story content */}
          <div
            className="flex-1 relative cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              if (x < rect.width / 2) {
                handlePrevious();
              } else {
                handleNext();
              }
            }}
          >
            {currentStory.media_type === "image" ? (
              <img
                src={currentStory.media_url}
                alt="Story"
                className="w-full h-full object-contain"
              />
            ) : (
              <video
                src={currentStory.media_url}
                className="w-full h-full object-contain"
                autoPlay
                muted
                loop
              />
            )}

            {/* Navigation indicators */}
            <div className="absolute left-0 top-0 bottom-0 w-1/2" />
            <div className="absolute right-0 top-0 bottom-0 w-1/2" />
          </div>

          {/* Caption */}
          {currentStory.caption && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-white text-sm">{currentStory.caption}</p>
            </div>
          )}

          {/* Navigation buttons */}
          {currentUserIndex > 0 && (
            <Button
              size="icon"
              variant="ghost"
              className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                const prevUserIndex = currentUserIndex - 1;
                setCurrentUserIndex(prevUserIndex);
                setCurrentStoryIndex(stories[prevUserIndex].stories.length - 1);
                setProgress(0);
              }}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}

          {currentUserIndex < stories.length - 1 && (
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                const nextUserIndex = currentUserIndex + 1;
                setCurrentUserIndex(nextUserIndex);
                setCurrentStoryIndex(0);
                setProgress(0);
              }}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
