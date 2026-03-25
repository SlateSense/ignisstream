"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Gamepad2, Edit3, Trash2, Flag } from "lucide-react";
import Comments from "./Comments";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: any;
  currentUser?: any;
  onUpdate?: () => void;
  onPostDeleted?: () => void | Promise<void>;
  onPostUpdated?: () => void | Promise<void>;
}

export default function PostCard({ post, currentUser, onUpdate, onPostDeleted, onPostUpdated }: PostCardProps) {
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likeCount, setLikeCount] = useState(post.likes_count || 0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Check if current user owns this post
  const isOwner = currentUser && post.author_id === currentUser.id;

  const handleLike = async () => {
    if (!currentUser) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like posts",
        variant: "destructive"
      });
      return;
    }

    // Optimistic update
    const newLikedState = !isLiked;
    const newLikeCount = newLikedState ? likeCount + 1 : likeCount - 1;
    
    setIsLiked(newLikedState);
    setLikeCount(newLikeCount);

    const supabase = createClient();
    
    try {
      if (newLikedState) {
        // Like
        const { error } = await supabase
          .from("likes")
          .insert({
            post_id: post.id,
            user_id: currentUser.id
          });
        
        if (error) throw error;
      } else {
        // Unlike
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", currentUser.id);
        
        if (error) throw error;
      }
    } catch (error: any) {
      // Revert optimistic update on error
      setIsLiked(!newLikedState);
      setLikeCount(likeCount);
      
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

    // Optimistic update
    const newBookmarkedState = !isBookmarked;
    setIsBookmarked(newBookmarkedState);

    const supabase = createClient();
    
    try {
      if (newBookmarkedState) {
        const { error } = await supabase
          .from("bookmarks")
          .insert({
            post_id: post.id,
            user_id: currentUser.id
          });
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", currentUser.id);
        
        if (error) throw error;
      }
      
      toast({
        title: newBookmarkedState ? "Added to bookmarks" : "Removed from bookmarks",
        description: newBookmarkedState ? "Post saved to your collection" : "Post removed from your collection",
      });
    } catch (error: any) {
      // Revert optimistic update on error
      setIsBookmarked(!newBookmarkedState);
      
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

  const handleEdit = () => {
    // Navigate to edit page or open edit dialog
    window.location.href = `/post/${post.id}/edit`;
  };

  const handleDelete = async () => {
    setDeleting(true);
    const supabase = createClient();
    
    try {
      // Delete the post
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id)
        .eq('author_id', currentUser.id); // Ensure only owner can delete
      
      if (error) throw error;
      
      toast({
        title: "Post deleted",
        description: "Your post has been successfully deleted.",
      });
      
      // Refresh the feed
      if (onUpdate) {
        onUpdate();
      }
      if (onPostDeleted) {
        await onPostDeleted();
      }
      if (onPostUpdated) {
        await onPostUpdated();
      }
      
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleReport = () => {
    toast({
      title: "Report submitted",
      description: "Thank you for reporting. We'll review this content.",
    });
  };

  useEffect(() => {
    setIsLiked(post.is_liked || false);
    setLikeCount(post.likes_count || 0);
  }, [post.id, post.is_liked, post.likes_count]);

  const primaryAsset = post.assets?.[0]?.asset || post.assets?.[0] || null;

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwner ? (
                <>
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit Post
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Post
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={handleReport}>
                    <Flag className="mr-2 h-4 w-4" />
                    Report Post
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="px-0 pb-3">
        {/* Caption */}
        {post.caption && (
          <p className="px-6 mb-3 whitespace-pre-wrap">{post.caption}</p>
        )}

        {/* Media */}
        {primaryAsset && (
          <div className="relative aspect-video bg-secondary overflow-hidden">
            {primaryAsset.type === "image" ? (
              <Image
                src={primaryAsset.storage_path || primaryAsset.thumbnail_url || "/placeholder-image.jpg"}
                alt="Gaming moment"
                fill
                className="object-cover transition-opacity duration-300"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={false}
                loading="lazy"
              />
            ) : primaryAsset.type === "video" && primaryAsset.mux_playback_id ? (
              <video
                src={`https://stream.mux.com/${primaryAsset.mux_playback_id}.m3u8`}
                poster={primaryAsset.thumbnail_url}
                controls
                preload="metadata"
                className="w-full h-full object-cover"
              />
            ) : primaryAsset.thumbnail_url ? (
              <Image
                src={primaryAsset.thumbnail_url}
                alt="Gaming moment preview"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                loading="lazy"
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
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setCommentsOpen(true)}
            >
              <MessageCircle className="h-5 w-5 mr-1" />
              {post.comments_count > 0 && post.comments_count}
            </Button>

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
      
      {/* Comments Modal */}
      <Comments 
        postId={post.id}
        postAuthorId={post.author_id}
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        initialCommentsCount={post.comments_count}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
