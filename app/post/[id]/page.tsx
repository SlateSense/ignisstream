"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreHorizontal,
  Send,
  ArrowLeft,
  Flag,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { mockPosts, mockComments, mockUsers } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = parseInt(params.id as string);
  
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    // Find the post
    const foundPost = mockPosts.find(p => p.id === postId);
    if (foundPost) {
      setPost(foundPost);
      setIsLiked(foundPost.isLiked);
      setLikeCount(foundPost.like_count);
      
      // Load comments for this post
      const postComments = mockComments.filter(c => c.post_id === postId);
      setComments(postComments);
    }
  }, [postId]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out this post by ${post?.author?.display_name}`,
          text: post?.caption || "Amazing gaming moment!",
          url: window.location.href
        });
      } catch (error) {
        console.log("Share cancelled");
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleComment = () => {
    if (!newComment.trim()) return;
    
    const newCommentObj = {
      id: comments.length + 10,
      post_id: postId,
      author: mockUsers[0], // Current user
      body: newComment,
      created_at: new Date().toISOString()
    };
    
    setComments([newCommentObj, ...comments]);
    setNewComment("");
    
    // Update comment count
    if (post) {
      setPost({ ...post, comment_count: post.comment_count + 1 });
    }
  };

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Post not found</h1>
          <p className="text-muted-foreground mb-4">This post may have been deleted.</p>
          <Button onClick={() => router.push("/feed")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Feed
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Post</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Post Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Link href={`/profile/${post.author?.username}`}>
                      <Avatar className="h-12 w-12 border-2 border-primary/20">
                        <AvatarImage src={post.author?.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-r from-gaming-purple to-gaming-pink text-white">
                          {post.author?.username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div>
                      <Link href={`/profile/${post.author?.username}`} className="font-semibold hover:underline">
                        {post.author?.display_name}
                      </Link>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {post.game && <span>{post.game.name}</span>}
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="px-0">
                {/* Caption */}
                {post.caption && (
                  <p className="px-6 mb-4 whitespace-pre-wrap">{post.caption}</p>
                )}

                {/* Media */}
                {post.thumbnail && (
                  <div className="relative aspect-video bg-secondary">
                    <img
                      src={post.thumbnail}
                      alt="Post media"
                      className="w-full h-full object-cover"
                    />
                    {post.hasVideo && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="bg-black/50 rounded-full p-4">
                          <svg className="h-12 w-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>

              <CardFooter className="border-t">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLike}
                      className={cn("hover:text-red-500", isLiked && "text-red-500")}
                    >
                      <Heart className={cn("h-5 w-5 mr-1", isLiked && "fill-current")} />
                      {likeCount}
                    </Button>
                    
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="h-5 w-5 mr-1" />
                      {post.comment_count}
                    </Button>

                    <Button variant="ghost" size="sm" onClick={handleShare}>
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBookmark}
                    className={cn("hover:text-primary", isBookmarked && "text-primary")}
                  >
                    <Bookmark className={cn("h-5 w-5", isBookmarked && "fill-current")} />
                  </Button>
                </div>
              </CardFooter>
            </Card>

            {/* Comment Input */}
            <Card className="mt-4">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={mockUsers[0].avatar_url} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        onClick={handleComment}
                        disabled={!newComment.trim()}
                        className="bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Comment
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments List */}
            <div className="mt-4 space-y-4">
              <h3 className="font-semibold text-lg">Comments ({comments.length})</h3>
              {comments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="pt-6">
                    <div className="flex gap-3">
                      <Link href={`/profile/${comment.author.username}`}>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={comment.author.avatar_url} />
                          <AvatarFallback>
                            {comment.author.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <Link href={`/profile/${comment.author.username}`} className="font-semibold hover:underline">
                              {comment.author.display_name}
                            </Link>
                            <span className="text-sm text-muted-foreground ml-2">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="mt-1">{comment.body}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <Heart className="h-4 w-4 mr-1" />
                            Like
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            Reply
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {comments.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No comments yet. Be the first to comment!
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Post Stats */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Post Stats</h3>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Likes</span>
                  <span className="font-semibold">{likeCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Comments</span>
                  <span className="font-semibold">{comments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shares</span>
                  <span className="font-semibold">{post.repost_count}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Engagement</span>
                  <span className="font-semibold text-primary">{post.engagement_score}</span>
                </div>
              </CardContent>
            </Card>

            {/* More from Author */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold">More from {post.author.display_name}</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockPosts
                  .filter(p => p.author.id === post.author.id && p.id !== post.id)
                  .slice(0, 3)
                  .map(p => (
                    <Link key={p.id} href={`/post/${p.id}`}>
                      <div className="flex gap-3 hover:bg-secondary/50 p-2 rounded transition">
                        {p.thumbnail && (
                          <img
                            src={p.thumbnail}
                            alt=""
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-sm line-clamp-2">{p.caption}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {p.like_count} likes • {p.comment_count} comments
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
