"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Heart, MoreHorizontal, Reply, Flag, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  post_id: string;
  likes_count: number;
  is_liked: boolean;
  author: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

interface CommentsProps {
  postId: string;
  postAuthorId: string;
  isOpen: boolean;
  onClose: () => void;
  initialCommentsCount?: number;
}

export default function Comments({ postId, postAuthorId, isOpen, onClose, initialCommentsCount = 0 }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load comments when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, postId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          author_id,
          post_id,
          author:profiles!author_id(id, username, display_name, avatar_url),
          likes_count:comment_likes(count),
          user_liked:comment_likes!inner(user_id)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Process comments to get like status
      const processedComments = await Promise.all(
        (data || []).map(async (comment: any) => {
          const [likesResult, userLikeResult] = await Promise.all([
            supabase
              .from('comment_likes')
              .select('id', { count: 'exact', head: true })
              .eq('comment_id', comment.id),
            user ? supabase
              .from('comment_likes')
              .select('id')
              .eq('comment_id', comment.id)
              .eq('user_id', user.id)
              .maybeSingle() : Promise.resolve({ data: null })
          ]);

          return {
            ...comment,
            author: Array.isArray(comment.author) ? comment.author[0] : comment.author,
            likes_count: likesResult.count || 0,
            is_liked: !!userLikeResult.data
          };
        })
      );

      setComments(processedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast({
        title: "Error loading comments",
        description: "Unable to load comments. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    try {
      const supabase = createClient();
      
      // Insert comment
      const { data: comment, error } = await supabase
        .from('comments')
        .insert({
          content: newComment.trim(),
          author_id: user.id,
          post_id: postId
        })
        .select(`
          id,
          content,
          created_at,
          author_id,
          post_id,
          author:profiles!author_id(id, username, display_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      // Add to local state
      const newCommentWithDefaults = {
        ...comment,
        author: Array.isArray(comment.author) ? comment.author[0] : comment.author,
        likes_count: 0,
        is_liked: false
      };

      setComments(prev => [...prev, newCommentWithDefaults]);
      setNewComment("");

      // Create notification for post author (if not commenting on own post)
      if (postAuthorId !== user.id) {
        await supabase
          .from('notifications')
          .insert({
            type: 'comment',
            actor_id: user.id,
            recipient_id: postAuthorId,
            post_id: postId,
            comment_id: comment.id
          });
      }

      toast({
        title: "Comment posted!",
        description: "Your comment has been added."
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: "Failed to post comment",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) return;

    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    const wasLiked = comment.is_liked;

    // Optimistic update
    setComments(prev =>
      prev.map(c =>
        c.id === commentId
          ? {
              ...c,
              is_liked: !wasLiked,
              likes_count: wasLiked ? c.likes_count - 1 : c.likes_count + 1
            }
          : c
      )
    );

    try {
      const supabase = createClient();

      if (wasLiked) {
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id
          });

        // Create notification for comment author (if not liking own comment)
        if (comment.author_id !== user.id) {
          await supabase
            .from('notifications')
            .insert({
              type: 'comment_like',
              actor_id: user.id,
              recipient_id: comment.author_id,
              post_id: postId,
              comment_id: commentId
            });
        }
      }
    } catch (error) {
      // Revert optimistic update
      setComments(prev =>
        prev.map(c =>
          c.id === commentId
            ? {
                ...c,
                is_liked: wasLiked,
                likes_count: wasLiked ? c.likes_count + 1 : c.likes_count - 1
              }
            : c
        )
      );

      console.error('Error toggling comment like:', error);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('author_id', user?.id); // Ensure user can only delete their own comments

      if (error) throw error;

      setComments(prev => prev.filter(c => c.id !== commentId));
      
      toast({
        title: "Comment deleted",
        description: "Your comment has been removed."
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete comment.",
        variant: "destructive"
      });
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <h3 className="font-semibold">Comments ({comments.length})</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            ×
          </Button>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden flex flex-col">
          {/* Comments List */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              <AnimatePresence>
                {comments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex gap-3"
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={comment.author.avatar_url} />
                      <AvatarFallback>
                        {comment.author.username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {comment.author.display_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          @{comment.author.username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                        {comment.author_id === postAuthorId && (
                          <Badge variant="secondary" className="text-xs px-1 py-0">
                            Author
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm">{comment.content}</p>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-6 px-2 text-xs",
                            comment.is_liked && "text-red-500"
                          )}
                          onClick={() => handleLikeComment(comment.id)}
                        >
                          <Heart className={cn("h-3 w-3 mr-1", comment.is_liked && "fill-current")} />
                          {comment.likes_count > 0 && comment.likes_count}
                        </Button>

                        {/* Comment Actions Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {comment.author_id === user?.id ? (
                              <DropdownMenuItem 
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem>
                                <Flag className="h-4 w-4 mr-2" />
                                Report
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Comment Input */}
          {user && (
            <>
              <Separator className="my-4" />
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback>
                    {user.email?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[60px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitComment();
                      }
                    }}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      Press Enter to send, Shift+Enter for new line
                    </p>
                    <Button
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || submitting}
                      size="sm"
                      className="bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90"
                    >
                      {submitting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-1" />
                          Comment
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
