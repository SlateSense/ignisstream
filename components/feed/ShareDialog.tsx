"use client";

import { useState } from "react";
import { Share2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";

interface ShareDialogProps {
  post: any;
  currentUser: any;
  isOpen: boolean;
  onClose: () => void;
  onShare?: () => void;
}

export default function ShareDialog({
  post,
  currentUser,
  isOpen,
  onClose,
  onShare
}: ShareDialogProps) {
  const [comment, setComment] = useState("");
  const [sharing, setSharing] = useState(false);
  const { toast } = useToast();

  const handleShare = async () => {
    if (!currentUser) {
      toast({
        title: "Sign in required",
        description: "Please sign in to share posts",
        variant: "destructive"
      });
      return;
    }

    setSharing(true);
    try {
      const supabase = createClient();

      // Insert share record
      const { error: shareError } = await supabase
        .from("shares")
        .insert({
          post_id: post.id,
          user_id: currentUser.id,
          comment: comment.trim() || null
        });

      if (shareError) throw shareError;

      // Update post shares count
      const { error: updateError } = await supabase
        .from("posts")
        .update({ shares_count: (post.shares_count || 0) + 1 })
        .eq("id", post.id);

      if (updateError) throw updateError;

      // Create notification for post author
      if (post.author_id !== currentUser.id) {
        await supabase.from("notifications").insert({
          user_id: post.author_id,
          type: "share",
          actor_id: currentUser.id,
          post_id: post.id,
          content: comment.trim() || null
        });
      }

      toast({
        title: "Post shared!",
        description: "The post has been shared to your profile"
      });

      onShare?.();
      onClose();
      setComment("");
    } catch (error: any) {
      console.error("Error sharing post:", error);
      toast({
        title: "Share failed",
        description: error.message || "Failed to share post",
        variant: "destructive"
      });
    } finally {
      setSharing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Post
          </DialogTitle>
          <DialogDescription>
            Add your thoughts about this post (optional)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* User comment */}
          {currentUser && (
            <div className="flex gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={currentUser.avatar_url} />
                <AvatarFallback>
                  {currentUser.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-[80px] resize-none"
                  maxLength={500}
                />
                <div className="text-xs text-muted-foreground mt-1 text-right">
                  {comment.length}/500
                </div>
              </div>
            </div>
          )}

          {/* Original post preview */}
          <Card className="border-2">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={post.author?.avatar_url} />
                  <AvatarFallback>
                    {post.author?.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">
                      {post.author?.display_name || post.author?.username}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      @{post.author?.username}
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm mt-1 line-clamp-3">{post.content}</p>
                  {post.media_url && (
                    <div className="mt-2 rounded-lg overflow-hidden bg-secondary">
                      {post.media_type === "image" ? (
                        <img
                          src={post.media_url}
                          alt=""
                          className="w-full h-32 object-cover"
                        />
                      ) : (
                        <video
                          src={post.media_url}
                          className="w-full h-32 object-cover"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={sharing}>
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={sharing}
            className="bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90"
          >
            {sharing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Sharing...
              </>
            ) : (
              <>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
