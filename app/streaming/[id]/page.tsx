"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Users, 
  Heart, 
  Share, 
  Flag, 
  Crown,
  Shield,
  Gift,
  Bell,
  Settings,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import StreamPlayer from '@/components/streaming/StreamPlayer';
import StreamChat from '@/components/streaming/StreamChat';
import { Stream, streamManager } from '@/lib/streaming/stream-manager';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

export default function StreamViewerPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [stream, setStream] = useState<Stream | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDonateDialog, setShowDonateDialog] = useState(false);
  const [donationAmount, setDonationAmount] = useState('5');
  const [donationMessage, setDonationMessage] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [streamStats, setStreamStats] = useState({
    uptime: '0:00:00',
    followers: 0,
    totalViews: 0
  });

  const streamId = params.id as string;

  useEffect(() => {
    if (streamId) {
      loadStream();
    }
  }, [streamId]);

  const loadStream = async () => {
    try {
      const streamData = await streamManager.getStream(streamId);
      if (!streamData) {
        toast({
          title: "Stream not found",
          description: "This stream may have ended or doesn't exist.",
          variant: "destructive"
        });
        router.push('/streaming');
        return;
      }
      
      setStream(streamData);
      setViewerCount(streamData.viewer_count);
      
      // Calculate uptime
      if (streamData.started_at) {
        const uptime = calculateUptime(streamData.started_at);
        setStreamStats(prev => ({ ...prev, uptime }));
      }
      
      // TODO: Check if user is following/subscribed
      if (user) {
        // checkFollowStatus();
        // checkSubscriptionStatus();
      }
    } catch (error) {
      console.error('Error loading stream:', error);
      toast({
        title: "Error loading stream",
        description: "Please try refreshing the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateUptime = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleFollow = async () => {
    if (!user || !stream) {
      toast({
        title: "Sign in required",
        description: "Please sign in to follow streamers.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (isFollowing) {
        await streamManager.unfollowStreamer(user.id, stream.streamer_id);
        setIsFollowing(false);
        toast({
          title: "Unfollowed",
          description: `You unfollowed ${(stream as any).streamer?.display_name}.`,
        });
      } else {
        await streamManager.followStreamer(user.id, stream.streamer_id);
        setIsFollowing(true);
        toast({
          title: "Following!",
          description: `You're now following ${(stream as any).streamer?.display_name}.`,
        });
      }
      
      setStreamStats(prev => ({
        ...prev,
        followers: prev.followers + (isFollowing ? -1 : 1)
      }));
    } catch (error) {
      console.error('Error following/unfollowing:', error);
      toast({
        title: "Error",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  const handleSubscribe = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to subscribe.",
        variant: "destructive"
      });
      return;
    }
    
    // TODO: Implement subscription logic
    setIsSubscribed(!isSubscribed);
    toast({
      title: isSubscribed ? "Unsubscribed" : "Subscribed!",
      description: isSubscribed 
        ? "You've unsubscribed from this channel." 
        : "Welcome to the subscriber club!",
    });
  };

  const handleDonate = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to send donations.",
        variant: "destructive"
      });
      return;
    }

    // TODO: Implement donation logic
    toast({
      title: "Donation sent!",
      description: `Thank you for donating $${donationAmount}!`,
    });
    setShowDonateDialog(false);
    setDonationAmount('5');
    setDonationMessage('');
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: stream?.title,
          text: `Watch ${(stream as any)?.streamer?.display_name} live on IgnisStream!`,
          url: url
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(url);
        toast({
          title: "Link copied!",
          description: "Stream link copied to clipboard.",
        });
      }
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "Stream link copied to clipboard.",
      });
    }
  };

  const onViewerJoin = () => {
    setViewerCount(prev => prev + 1);
  };

  const onViewerLeave = () => {
    setViewerCount(prev => Math.max(0, prev - 1));
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
              </div>
              <div className="h-96 bg-muted rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4">
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-semibold mb-2">Stream not found</h3>
              <p className="text-muted-foreground mb-4">
                This stream may have ended or doesn't exist.
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
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Video Player */}
            <div className="relative">
              <StreamPlayer
                stream={stream}
                autoplay={true}
                onViewerJoin={onViewerJoin}
                onViewerLeave={onViewerLeave}
              />
            </div>

            {/* Stream Info */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-2">{stream.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {viewerCount.toLocaleString()} viewers
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge className="bg-red-500">LIVE</Badge>
                      <span>{streamStats.uptime}</span>
                    </div>
                    <Badge variant="secondary">{stream.category}</Badge>
                    {(stream as any).game && (
                      <Badge variant="outline">{(stream as any).game.name}</Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="outline" size="sm">
                    <Flag className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Streamer Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-primary/20">
                    <AvatarImage src={(stream as any).streamer?.avatar_url} />
                    <AvatarFallback>
                      {(stream as any).streamer?.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">
                        {(stream as any).streamer?.display_name}
                      </h3>
                      <Crown className="h-4 w-4 text-yellow-500" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      @{(stream as any).streamer?.username}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span>{streamStats.followers.toLocaleString()} followers</span>
                      <span>{streamStats.totalViews.toLocaleString()} total views</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleFollow}
                    variant={isFollowing ? "outline" : "default"}
                    className={!isFollowing ? "bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90" : ""}
                  >
                    <Heart className={cn("h-4 w-4 mr-2", isFollowing && "fill-current")} />
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                  
                  <Button
                    onClick={handleSubscribe}
                    variant={isSubscribed ? "outline" : "default"}
                    className={!isSubscribed ? "bg-gradient-to-r from-blue-500 to-purple-500" : ""}
                  >
                    <Crown className={cn("h-4 w-4 mr-2", isSubscribed && "fill-current")} />
                    {isSubscribed ? 'Subscribed' : 'Subscribe'}
                  </Button>
                  
                  <Dialog open={showDonateDialog} onOpenChange={setShowDonateDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Gift className="h-4 w-4 mr-2" />
                        Donate
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Send Donation</DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="amount">Amount ($)</Label>
                          <Input
                            id="amount"
                            type="number"
                            value={donationAmount}
                            onChange={(e) => setDonationAmount(e.target.value)}
                            min="1"
                            max="500"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="message">Message (Optional)</Label>
                          <Input
                            id="message"
                            value={donationMessage}
                            onChange={(e) => setDonationMessage(e.target.value)}
                            placeholder="Say something nice..."
                            maxLength={200}
                          />
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowDonateDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleDonate}>
                            Send ${donationAmount}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Description */}
              {stream.description && (
                <div>
                  <h4 className="font-semibold mb-2">About this stream</h4>
                  <p className="text-muted-foreground">{stream.description}</p>
                </div>
              )}
            </div>

            {/* Stream Analytics (for streamers) */}
            {user && user.id === stream.streamer_id && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Stream Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{viewerCount}</div>
                      <div className="text-sm text-muted-foreground">Current Viewers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-500">{stream.max_viewers}</div>
                      <div className="text-sm text-muted-foreground">Peak Viewers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500">{streamStats.followers}</div>
                      <div className="text-sm text-muted-foreground">New Followers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-500">{streamStats.uptime}</div>
                      <div className="text-sm text-muted-foreground">Uptime</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Chat Sidebar */}
          <div className="lg:col-span-1">
            <StreamChat streamId={streamId} className="h-[calc(100vh-8rem)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
