"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Square, 
  Settings, 
  Users, 
  Eye, 
  Clock, 
  TrendingUp,
  BarChart3,
  Monitor,
  Mic,
  Video,
  Share,
  AlertTriangle,
  CheckCircle,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import StreamChat from '@/components/streaming/StreamChat';
import { Stream, StreamSettings, streamManager } from '@/lib/streaming/stream-manager';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

export default function StreamerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentStream, setCurrentStream] = useState<Stream | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [streamDuration, setStreamDuration] = useState('00:00:00');
  const [loading, setLoading] = useState(true);
  
  // Stream settings
  const [streamSettings, setStreamSettings] = useState<StreamSettings>({
    title: '',
    description: '',
    category: 'Gaming',
    tags: [],
    is_mature: false,
    quality: 'high',
    bitrate: 3000,
    fps: 60
  });

  // Analytics data
  const [analytics, setAnalytics] = useState({
    totalFollowers: 0,
    totalViews: 0,
    averageViewers: 0,
    peakViewers: 0,
    streamTime: 0,
    chatMessages: 0,
    newFollowers: 0,
    engagement: 0
  });

  // Technical status
  const [techStatus, setTechStatus] = useState({
    bitrate: 0,
    fps: 0,
    droppedFrames: 0,
    cpuUsage: 0,
    networkHealth: 'good' as 'good' | 'warning' | 'error'
  });

  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showStreamKeyDialog, setShowStreamKeyDialog] = useState(false);

  useEffect(() => {
    if (user) {
      loadStreamerData();
      startStatusUpdates();
    }
  }, [user]);

  const loadStreamerData = async () => {
    try {
      // Load current active stream
      const streams = await streamManager.getLiveStreams(1);
      const userStream = streams.find(s => s.streamer_id === user!.id);
      
      if (userStream) {
        setCurrentStream(userStream);
        setIsLive(userStream.status === 'live');
        setViewerCount(userStream.viewer_count);
        
        if (userStream.started_at) {
          updateStreamDuration(userStream.started_at);
        }
      }
      
      // Load analytics data (mock for now)
      setAnalytics({
        totalFollowers: Math.floor(Math.random() * 10000) + 500,
        totalViews: Math.floor(Math.random() * 100000) + 5000,
        averageViewers: Math.floor(Math.random() * 500) + 50,
        peakViewers: userStream?.max_viewers || 0,
        streamTime: Math.floor(Math.random() * 1000) + 100,
        chatMessages: Math.floor(Math.random() * 5000) + 200,
        newFollowers: Math.floor(Math.random() * 50) + 5,
        engagement: Math.floor(Math.random() * 100) + 60
      });
    } catch (error) {
      console.error('Error loading streamer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startStatusUpdates = () => {
    // Simulate technical status updates
    setInterval(() => {
      setTechStatus(prev => ({
        ...prev,
        bitrate: streamSettings.bitrate + (Math.random() - 0.5) * 200,
        fps: streamSettings.fps + (Math.random() - 0.5) * 5,
        droppedFrames: Math.floor(Math.random() * 10),
        cpuUsage: Math.floor(Math.random() * 100),
        networkHealth: Math.random() > 0.1 ? 'good' : (Math.random() > 0.5 ? 'warning' : 'error')
      }));
    }, 5000);
  };

  const updateStreamDuration = (startTime: string) => {
    const interval = setInterval(() => {
      const start = new Date(startTime);
      const now = new Date();
      const diff = now.getTime() - start.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setStreamDuration(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);
    
    return () => clearInterval(interval);
  };

  const startStream = async () => {
    if (!streamSettings.title.trim()) {
      toast({
        title: "Stream title required",
        description: "Please set a stream title before going live.",
        variant: "destructive"
      });
      return;
    }

    try {
      let stream = currentStream;
      
      if (!stream) {
        // Create new stream
        stream = await streamManager.createStream(user!.id, streamSettings);
        setCurrentStream(stream);
      }
      
      // Start the stream
      await streamManager.startStream(stream.id);
      setIsLive(true);
      
      toast({
        title: "Stream started!",
        description: "You are now live. Good luck with your stream!",
      });
      
      // Start duration tracking
      updateStreamDuration(new Date().toISOString());
    } catch (error) {
      console.error('Error starting stream:', error);
      toast({
        title: "Failed to start stream",
        description: "Please check your stream settings and try again.",
        variant: "destructive"
      });
    }
  };

  const stopStream = async () => {
    if (!currentStream) return;
    
    try {
      await streamManager.endStream(currentStream.id);
      setIsLive(false);
      
      toast({
        title: "Stream ended",
        description: "Your stream has been successfully ended.",
      });
      
      // Create VOD
      await streamManager.createVOD(currentStream.id);
    } catch (error) {
      console.error('Error stopping stream:', error);
      toast({
        title: "Failed to stop stream",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const updateSettings = async () => {
    if (!currentStream) return;
    
    try {
      await streamManager.updateStreamSettings(currentStream.id, streamSettings);
      toast({
        title: "Settings updated",
        description: "Your stream settings have been saved.",
      });
      setShowSettingsDialog(false);
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Failed to update settings",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const copyStreamKey = () => {
    if (currentStream?.stream_key) {
      navigator.clipboard.writeText(currentStream.stream_key);
      toast({
        title: "Stream key copied!",
        description: "Your stream key has been copied to clipboard.",
      });
    }
  };

  const copyRTMPUrl = () => {
    if (currentStream?.rtmp_url) {
      navigator.clipboard.writeText(currentStream.rtmp_url);
      toast({
        title: "RTMP URL copied!",
        description: "Your RTMP URL has been copied to clipboard.",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-muted rounded-lg"></div>
                <div className="h-32 bg-muted rounded-lg"></div>
              </div>
              <div className="h-96 bg-muted rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Streaming Dashboard</h1>
            <p className="text-muted-foreground">Manage your live stream and track performance</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant={isLive ? "default" : "secondary"} className={isLive ? "bg-red-500" : ""}>
              {isLive ? "LIVE" : "OFFLINE"}
            </Badge>
            
            {isLive ? (
              <Button onClick={stopStream} variant="destructive">
                <Square className="h-4 w-4 mr-2" />
                End Stream
              </Button>
            ) : (
              <Button onClick={startStream} className="bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90">
                <Play className="h-4 w-4 mr-2" />
                Go Live
              </Button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stream Control */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Stream Control
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLive ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-red-500">{viewerCount}</div>
                        <div className="text-sm text-muted-foreground">Viewers</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{streamDuration}</div>
                        <div className="text-sm text-muted-foreground">Uptime</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{analytics.peakViewers}</div>
                        <div className="text-sm text-muted-foreground">Peak Viewers</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{analytics.chatMessages}</div>
                        <div className="text-sm text-muted-foreground">Chat Messages</div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Technical Status */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold">{techStatus.bitrate.toFixed(0)}</div>
                        <div className="text-xs text-muted-foreground">Bitrate (kbps)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">{techStatus.fps.toFixed(0)}</div>
                        <div className="text-xs text-muted-foreground">FPS</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">{techStatus.droppedFrames}</div>
                        <div className="text-xs text-muted-foreground">Dropped Frames</div>
                      </div>
                      <div className="text-center">
                        <div className={cn("text-lg font-semibold", getStatusColor(techStatus.networkHealth))}>
                          {techStatus.networkHealth.toUpperCase()}
                        </div>
                        <div className="text-xs text-muted-foreground">Network</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Monitor className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Ready to Stream</h3>
                    <p className="text-muted-foreground mb-4">
                      Configure your stream settings and click "Go Live" to start
                    </p>
                    
                    <div className="max-w-md mx-auto space-y-4">
                      <div>
                        <Label htmlFor="title">Stream Title</Label>
                        <Input
                          id="title"
                          value={streamSettings.title}
                          onChange={(e) => setStreamSettings(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="What are you streaming today?"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Select
                            value={streamSettings.category}
                            onValueChange={(value) => setStreamSettings(prev => ({ ...prev, category: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Gaming">Gaming</SelectItem>
                              <SelectItem value="Just Chatting">Just Chatting</SelectItem>
                              <SelectItem value="Music">Music</SelectItem>
                              <SelectItem value="Creative">Creative</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="quality">Quality</Label>
                          <Select
                            value={streamSettings.quality}
                            onValueChange={(value: any) => setStreamSettings(prev => ({ ...prev, quality: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low (720p)</SelectItem>
                              <SelectItem value="medium">Medium (1080p)</SelectItem>
                              <SelectItem value="high">High (1080p 60fps)</SelectItem>
                              <SelectItem value="ultra">Ultra (1440p)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stream Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Stream Configuration
                  </span>
                  <div className="flex gap-2">
                    <Dialog open={showStreamKeyDialog} onOpenChange={setShowStreamKeyDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Copy className="h-4 w-4 mr-2" />
                          Stream Key
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Stream Configuration</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              Keep your stream key private! Anyone with this key can stream to your channel.
                            </AlertDescription>
                          </Alert>
                          
                          <div>
                            <Label>RTMP URL</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Input value={currentStream?.rtmp_url || ''} readOnly />
                              <Button size="sm" onClick={copyRTMPUrl}>
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div>
                            <Label>Stream Key</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Input 
                                type="password" 
                                value={currentStream?.stream_key || ''} 
                                readOnly 
                              />
                              <Button size="sm" onClick={copyStreamKey}>
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            <p>Use these settings in your streaming software (OBS, Streamlabs, etc.):</p>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                              <li>Server: {currentStream?.rtmp_url}</li>
                              <li>Bitrate: {streamSettings.bitrate} kbps</li>
                              <li>Framerate: {streamSettings.fps} FPS</li>
                            </ul>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-2" />
                          Advanced
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Advanced Stream Settings</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="desc">Description</Label>
                            <Textarea
                              id="desc"
                              value={streamSettings.description}
                              onChange={(e) => setStreamSettings(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Tell viewers what to expect..."
                              rows={3}
                            />
                          </div>
                          
                          <div>
                            <Label>Bitrate: {streamSettings.bitrate} kbps</Label>
                            <Slider
                              value={[streamSettings.bitrate]}
                              onValueChange={([value]) => setStreamSettings(prev => ({ ...prev, bitrate: value }))}
                              max={8000}
                              min={1000}
                              step={500}
                              className="mt-2"
                            />
                          </div>
                          
                          <div>
                            <Label>FPS: {streamSettings.fps}</Label>
                            <Slider
                              value={[streamSettings.fps]}
                              onValueChange={([value]) => setStreamSettings(prev => ({ ...prev, fps: value }))}
                              max={60}
                              min={30}
                              step={30}
                              className="mt-2"
                            />
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="mature"
                              checked={streamSettings.is_mature}
                              onCheckedChange={(checked) => setStreamSettings(prev => ({ ...prev, is_mature: checked }))}
                            />
                            <Label htmlFor="mature">Mature Content</Label>
                          </div>
                          
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
                              Cancel
                            </Button>
                            <Button onClick={updateSettings}>
                              Save Settings
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="analytics">
                  <TabsList>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="moderation">Moderation</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="analytics" className="mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <Users className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                        <div className="text-xl font-bold">{analytics.totalFollowers}</div>
                        <div className="text-sm text-muted-foreground">Total Followers</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <Eye className="h-6 w-6 mx-auto mb-2 text-green-500" />
                        <div className="text-xl font-bold">{analytics.averageViewers}</div>
                        <div className="text-sm text-muted-foreground">Avg Viewers</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <Clock className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                        <div className="text-xl font-bold">{analytics.streamTime}h</div>
                        <div className="text-sm text-muted-foreground">Stream Time</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <TrendingUp className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                        <div className="text-xl font-bold">{analytics.engagement}%</div>
                        <div className="text-sm text-muted-foreground">Engagement</div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="moderation" className="mt-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Subscriber Only Chat</Label>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Slow Mode (30s)</Label>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Follower Only Chat</Label>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Auto-mod</Label>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Chat Sidebar */}
          <div>
            {currentStream && (
              <StreamChat 
                streamId={currentStream.id} 
                className="h-[calc(100vh-8rem)] sticky top-24"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
