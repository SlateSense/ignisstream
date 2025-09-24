"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Gamepad2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: any;
  currentUser: any;
  onUpdate?: () => void;
}

export default function PostCard({ post, currentUser, onUpdate }: PostCardProps) {
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likeCount, setLikeCount] = useState(post.likes_count || 0);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleLike = async () => {
    if (!currentUser) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like posts",
        variant: "destructive"
      });
      return;
    }

    const supabase = createClient();
    
    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", currentUser.id);
        
        if (error) throw error;
        
        setIsLiked(false);
        setLikeCount(likeCount - 1);
      } else {
        // Like
        const { error } = await supabase
          .from("likes")
          .insert({
            post_id: post.id,
            user_id: currentUser.id
          });
        
        if (error) throw error;
        
        setIsLiked(true);
        setLikeCount(likeCount + 1);
      }
    } catch (error: any) {
      console.error("Error toggling like:", error);
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive"
      });
    }
  };

  const handleBookmark = async () => {
    if (!currentUser) {
      toast({
        title: "Sign in required",
        description: "Please sign in to bookmark posts",
        variant: "destructive"
      });
      return;
    }

    const supabase = createClient();
    
    try {
      if (isBookmarked) {
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", currentUser.id);
        
        if (error) throw error;
        setIsBookmarked(false);
      } else {
        const { error } = await supabase
          .from("bookmarks")
          .insert({
            post_id: post.id,
            user_id: currentUser.id
          });
        
        if (error) throw error;
        setIsBookmarked(true);
      }
      
      toast({
        title: isBookmarked ? "Removed from bookmarks" : "Added to bookmarks",
        description: isBookmarked ? "Post removed from your collection" : "Post saved to your collection",
      });
    } catch (error: any) {
      console.error("Error toggling bookmark:", error);
      toast({
        title: "Error",
        description: "Failed to update bookmark status",
        variant: "destructive"
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out this gaming moment by ${post.author?.display_name || post.author?.username}`,
          text: post.caption || "Amazing gaming moment!",
          url: `${window.location.origin}/post/${post.id}`
        });
      } catch (error) {
        console.log("Share cancelled or failed");
      }
    } else {
      // Fallback: copy link to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
      toast({
        title: "Link copied!",
        description: "Post link has been copied to clipboard",
      });
    }
  };

  // Get first asset for preview (if any)
  const primaryAsset = post.assets?.[0]?.asset;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Link href={`/profile/${post.author?.username}`}>
              <Avatar className="h-10 w-10 border-2 border-primary/20 hover:border-primary/50 transition-colors">
                <AvatarImage src={post.author?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-r from-gaming-purple to-gaming-pink text-white">
                  {post.author?.username?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link href={`/profile/${post.author?.username}`} className="font-semibold hover:underline">
                {post.author?.display_name || post.author?.username}
              </Link>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {post.game && (
                  <>
                    <Gamepad2 className="h-3 w-3" />
                    <span>{post.game.name}</span>
                    <span>•</span>
                  </>
                )}
                <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-0 pb-3">
        {/* Caption */}
        {post.caption && (
          <p className="px-6 mb-3 whitespace-pre-wrap">{post.caption}</p>
        )}

        {/* Media */}
        {primaryAsset && (
          <div className="relative aspect-video bg-secondary">
            {primaryAsset.type === "image" ? (
              <img
                src={primaryAsset.storage_path || primaryAsset.thumbnail_url}
                alt="Gaming moment"
                className="w-full h-full object-cover"
              />
            ) : primaryAsset.type === "video" && primaryAsset.mux_playback_id ? (
              <video
                src={`https://stream.mux.com/${primaryAsset.mux_playback_id}.m3u8`}
                poster={primaryAsset.thumbnail_url}
                controls
                className="w-full h-full"
              />
            ) : null}
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t pt-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={cn(
                "hover:text-red-500",
                isLiked && "text-red-500"
              )}
            >
              <Heart className={cn("h-5 w-5 mr-1", isLiked && "fill-current")} />
              {likeCount > 0 && likeCount}
            </Button>
            
            <Link href={`/post/${post.id}`}>
              <Button variant="ghost" size="sm">
                <MessageCircle className="h-5 w-5 mr-1" />
                {post.comment_count > 0 && post.comment_count}
              </Button>
            </Link>

            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleBookmark}
            className={cn(
              "hover:text-primary",
              isBookmarked && "text-primary"
            )}
          >
            <Bookmark className={cn("h-5 w-5", isBookmarked && "fill-current")} />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
