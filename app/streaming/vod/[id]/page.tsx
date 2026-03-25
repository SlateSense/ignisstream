"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  SkipBack, 
  SkipForward,
  Maximize, 
  Settings,
  ThumbsUp,
  ThumbsDown,
  Share,
  Bookmark,
  Flag,
  ArrowLeft,
  Calendar,
  Eye,
  Clock,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { streamManager } from '@/lib/streaming/stream-manager';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface VOD {
  id: string;
  stream_id: string;
  title: string;
  description: string;
  streamer_id: string;
  game_id?: string;
  duration: number;
  view_count: number;
  thumbnail_url?: string;
  video_url: string;
  created_at: string;
  category: string;
  tags: string[];
  is_mature: boolean;
  max_viewers: number;
  streamer?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
  };
  game?: {
    id: string;
    name: string;
    cover_url?: string;
  };
}

export default function VODViewerPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [vod, setVod] = useState<VOD | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState([75]);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [relatedVODs, setRelatedVODs] = useState<VOD[]>([]);

  const vodId = params.id as string;

  useEffect(() => {
    if (vodId) {
      loadVOD();
      loadRelatedVODs();
    }
  }, [vodId]);

  const loadVOD = async () => {
    try {
      // Mock VOD data - replace with actual API call
      const mockVOD: VOD = {
        id: vodId,
        stream_id: `stream_${vodId}`,
        title: "Epic Gaming Session - Valorant Ranked Climb",
        description: "Join me as we climb through the ranks in Valorant! Lots of clutch moments and team coordination in this intense session.",
        streamer_id: "streamer_1",
        game_id: "game_valorant",
        duration: 7200, // 2 hours
        view_count: 15420,
        thumbnail_url: "/api/placeholder/1280/720",
        video_url: "https://example.com/vod.m3u8",
        created_at: new Date().toISOString(),
        category: "Gaming",
        tags: ["Valorant", "FPS", "Competitive", "Ranked"],
        is_mature: false,
        max_viewers: 245,
        streamer: {
          id: "streamer_1",
          username: "progamer123",
          display_name: "ProGamer123",
          avatar_url: "/api/placeholder/64/64"
        },
        game: {
          id: "game_valorant",
          name: "Valorant",
          cover_url: "/api/placeholder/128/128"
        }
      };
      
      setVod(mockVOD);
      
      // Increment view count
      // await streamManager.incrementVODViews(vodId);
    } catch (error) {
      console.error('Error loading VOD:', error);
      toast({
        title: "Error loading video",
        description: "Please try refreshing the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedVODs = async () => {
    try {
      // Mock related VODs
      const mockRelated: VOD[] = Array.from({ length: 6 }, (_, i) => ({
        id: `related_${i}`,
        stream_id: `stream_related_${i}`,
        title: `Gaming Highlights #${i + 1}`,
        description: "Another exciting gaming session",
        streamer_id: "streamer_1",
        duration: Math.floor(Math.random() * 10800) + 1800,
        view_count: Math.floor(Math.random() * 50000) + 1000,
        thumbnail_url: "/api/placeholder/320/180",
        video_url: "https://example.com/vod.m3u8",
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        category: "Gaming",
        tags: ["Gaming"],
        is_mature: false,
        max_viewers: Math.floor(Math.random() * 500) + 50,
        streamer: {
          id: "streamer_1",
          username: "progamer123",
          display_name: "ProGamer123",
          avatar_url: "/api/placeholder/64/64"
        }
      }));
      
      setRelatedVODs(mockRelated);
    } catch (error) {
      console.error('Error loading related VODs:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViewCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const handleLike = () => {
    if (disliked) setDisliked(false);
    setLiked(!liked);
    toast({
      title: liked ? "Like removed" : "Video liked!",
      description: liked ? "Removed from liked videos" : "Added to your liked videos",
    });
  };

  const handleDislike = () => {
    if (liked) setLiked(false);
    setDisliked(!disliked);
  };

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    toast({
      title: bookmarked ? "Removed from bookmarks" : "Bookmarked!",
      description: bookmarked ? "Video removed from bookmarks" : "Video saved to bookmarks",
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: vod?.title,
          text: `Check out this gaming video on IgnisStream!`,
          url: url
        });
      } catch (error) {
        navigator.clipboard.writeText(url);
        toast({
          title: "Link copied!",
          description: "Video link copied to clipboard.",
        });
      }
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "Video link copied to clipboard.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="aspect-video bg-muted rounded-lg"></div>
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-8 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
                <div className="h-20 bg-muted rounded"></div>
              </div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!vod) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4">
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-semibold mb-2">Video not found</h3>
              <p className="text-muted-foreground mb-4">
                This video may have been removed or doesn't exist.
              </p>
              <Button onClick={() => router.push('/streaming')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Streams
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Video Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Video Player */}
            <div className="relative bg-black rounded-lg overflow-hidden">
              <div className="aspect-video relative">
                <video
                  className="w-full h-full object-contain"
                  poster={vod.thumbnail_url}
                  controls
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onTimeUpdate={(e) => setCurrentTime((e.target as HTMLVideoElement).currentTime)}
                >
                  <source src={vod.video_url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                
                {/* Custom overlay if needed */}
                <div className="absolute top-4 right-4">
                  <Badge className="bg-black/75 text-white">
                    VOD
                  </Badge>
                </div>
              </div>
            </div>

            {/* Video Info */}
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">{vod.title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {formatViewCount(vod.view_count)} views
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(vod.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDuration(vod.duration)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Peak: {vod.max_viewers} viewers
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{vod.category}</Badge>
                  {vod.game && (
                    <Badge variant="outline">{vod.game.name}</Badge>
                  )}
                  {vod.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLike}
                    className={liked ? "text-blue-500 border-blue-500" : ""}
                  >
                    <ThumbsUp className={cn("h-4 w-4 mr-2", liked && "fill-current")} />
                    Like
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDislike}
                    className={disliked ? "text-red-500 border-red-500" : ""}
                  >
                    <ThumbsDown className={cn("h-4 w-4 mr-2", disliked && "fill-current")} />
                    Dislike
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBookmark}
                    className={bookmarked ? "text-yellow-500 border-yellow-500" : ""}
                  >
                    <Bookmark className={cn("h-4 w-4 mr-2", bookmarked && "fill-current")} />
                    {bookmarked ? "Saved" : "Save"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
                
                <Button variant="outline" size="sm">
                  <Flag className="h-4 w-4 mr-2" />
                  Report
                </Button>
              </div>

              <Separator />

              {/* Streamer Info */}
              <div className="flex items-center justify-between">
                <Link href={`/profile/${vod.streamer?.username}`} className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={vod.streamer?.avatar_url} />
                    <AvatarFallback>
                      {vod.streamer?.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{vod.streamer?.display_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      @{vod.streamer?.username}
                    </p>
                  </div>
                </Link>
                
                <Button className="bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90">
                  Follow
                </Button>
              </div>

              {/* Description */}
              {vod.description && (
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <p className="text-sm whitespace-pre-wrap">{vod.description}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Related Videos Sidebar */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">More Videos</h3>
            <div className="space-y-3">
              {relatedVODs.map((relatedVOD) => (
                <Link
                  key={relatedVOD.id}
                  href={`/streaming/vod/${relatedVOD.id}`}
                  className="group block"
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video relative bg-secondary">
                      <img
                        src={relatedVOD.thumbnail_url}
                        alt={relatedVOD.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
                        {formatDuration(relatedVOD.duration)}
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <h4 className="font-medium line-clamp-2 group-hover:text-primary transition-colors mb-2">
                        {relatedVOD.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatViewCount(relatedVOD.view_count)} views</span>
                        <span>•</span>
                        <span>{new Date(relatedVOD.created_at).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
