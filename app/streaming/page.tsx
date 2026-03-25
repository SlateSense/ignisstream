"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Users, 
  Eye, 
  Heart, 
  TrendingUp,
  Settings,
  Plus,
  Search,
  Filter,
  Clock,
  Trophy,
  Star,
  Video,
  Radio,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import StreamPlayer from '@/components/streaming/StreamPlayer';
import { Stream, StreamSettings, streamManager } from '@/lib/streaming/stream-manager';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

export default function StreamingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [liveStreams, setLiveStreams] = useState<Stream[]>([]);
  const [followedStreams, setFollowedStreams] = useState<Stream[]>([]);
  const [vodStreams, setVodStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGame, setSelectedGame] = useState('all');
  
  // Stream creation
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [streamSettings, setStreamSettings] = useState<StreamSettings>({
    title: '',
    description: '',
    game_id: undefined,
    category: 'Gaming',
    tags: [],
    is_mature: false,
    quality: 'high',
    bitrate: 3000,
    fps: 60
  });

  const categories = [
    'Gaming', 'Just Chatting', 'Music', 'Creative', 'Sports', 'Travel & Outdoors',
    'Science & Technology', 'Food & Drink', 'Beauty & Fashion'
  ];

  const games = [
    { id: '1', name: 'Valorant' },
    { id: '2', name: 'GTA V' },
    { id: '3', name: 'Minecraft' },
    { id: '4', name: 'Fortnite' },
    { id: '5', name: 'League of Legends' }
  ];

  useEffect(() => {
    loadStreams();
  }, []);

  const loadStreams = async () => {
    setLoading(true);
    try {
      const [live, vods, followed] = await Promise.all([
        streamManager.getLiveStreams(20),
        streamManager.getVODs(20),
        user ? streamManager.getFollowedStreams(user.id) : []
      ]);
      
      setLiveStreams(live);
      setVodStreams(vods);
      setFollowedStreams(followed);
    } catch (error) {
      console.error('Error loading streams:', error);
      toast({
        title: "Error loading streams",
        description: "Please try refreshing the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createStream = async () => {
    if (!user || !streamSettings.title.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a stream title.",
        variant: "destructive"
      });
      return;
    }

    try {
      const stream = await streamManager.createStream(user.id, streamSettings);
      
      toast({
        title: "Stream created!",
        description: "Your stream is ready to go live.",
      });
      
      setShowCreateDialog(false);
      // Redirect to stream setup page
      window.location.href = `/streaming/dashboard/${stream.id}`;
    } catch (error) {
      console.error('Error creating stream:', error);
      toast({
        title: "Failed to create stream",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  const filteredStreams = liveStreams.filter(stream => {
    const matchesSearch = 
      stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (stream as any).streamer?.display_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || stream.category === selectedCategory;
    const matchesGame = selectedGame === 'all' || stream.game_id === selectedGame;
    
    return matchesSearch && matchesCategory && matchesGame;
  });

  const StreamCard = ({ stream, isVOD = false }: { stream: Stream | any; isVOD?: boolean }) => (
    <Link href={isVOD ? `/streaming/vod/${stream.id}` : `/streaming/${stream.id}`}>
      <Card className="group cursor-pointer overflow-hidden hover:shadow-xl transition-all duration-300">
        <div className="relative aspect-video bg-secondary">
          <img
            src={stream.thumbnail_url || '/api/placeholder/320/180'}
            alt={stream.title}
            className="w-full h-full object-cover"
          />
          {!isVOD && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-red-500 animate-pulse">
                <Radio className="h-3 w-3 mr-1" />
                LIVE
              </Badge>
            </div>
          )}
          <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
            {isVOD ? formatDuration(stream.duration) : `${stream.viewer_count} viewers`}
          </div>
          
          {/* Hover Play Button */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="h-12 w-12 text-white" />
          </div>
        </div>
        
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={stream.streamer?.avatar_url} />
              <AvatarFallback>
                {stream.streamer?.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                {stream.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {stream.streamer?.display_name}
              </p>
              
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {stream.category}
                </Badge>
                {stream.game && (
                  <Badge variant="outline" className="text-xs">
                    {stream.game.name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}:${mins.toString().padStart(2, '0')}:00` : `${mins}:00`;
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-gaming-purple/20 via-gaming-pink/20 to-gaming-blue/20 pb-8">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-gaming font-bold mb-4">
              <span className="bg-gradient-to-r from-gaming-purple to-gaming-pink bg-clip-text text-transparent">
                Live Streaming
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              Watch, stream, and connect with the gaming community
            </p>
            
            {user && (
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button size="lg" className="bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90">
                    <Video className="mr-2 h-5 w-5" />
                    Start Streaming
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create New Stream</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Stream Title *</Label>
                      <Input
                        id="title"
                        value={streamSettings.title}
                        onChange={(e) => setStreamSettings(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="What are you streaming?"
                        maxLength={100}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={streamSettings.description}
                        onChange={(e) => setStreamSettings(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Tell viewers what to expect..."
                        rows={3}
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
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="game">Game (Optional)</Label>
                        <Select
                          value={streamSettings.game_id}
                          onValueChange={(value) => setStreamSettings(prev => ({ ...prev, game_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select game" />
                          </SelectTrigger>
                          <SelectContent>
                            {games.map((game) => (
                              <SelectItem key={game.id} value={game.id}>
                                {game.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="mature"
                        checked={streamSettings.is_mature}
                        onCheckedChange={(checked) => setStreamSettings(prev => ({ ...prev, is_mature: checked }))}
                      />
                      <Label htmlFor="mature">Mature Content</Label>
                    </div>
                    
                    <div>
                      <Label>Stream Quality</Label>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {['low', 'medium', 'high', 'ultra'].map((quality) => (
                          <Button
                            key={quality}
                            variant={streamSettings.quality === quality ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStreamSettings(prev => ({ ...prev, quality: quality as any }))}
                          >
                            {quality}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createStream} disabled={!streamSettings.title.trim()}>
                      Create Stream
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </motion.div>

          {/* Search & Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto"
          >
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search streams..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedGame} onValueChange={setSelectedGame}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Games</SelectItem>
                  {games.map((game) => (
                    <SelectItem key={game.id} value={game.id}>
                      {game.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="live" className="w-full">
          <TabsList className="w-full max-w-md mx-auto mb-8">
            <TabsTrigger value="live" className="flex-1">
              <Radio className="mr-2 h-4 w-4" />
              Live ({liveStreams.length})
            </TabsTrigger>
            <TabsTrigger value="following" className="flex-1">
              <Heart className="mr-2 h-4 w-4" />
              Following
            </TabsTrigger>
            <TabsTrigger value="vods" className="flex-1">
              <Video className="mr-2 h-4 w-4" />
              VODs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="aspect-video bg-muted"></div>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-muted rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="w-full h-4 bg-muted rounded"></div>
                          <div className="w-2/3 h-3 bg-muted rounded"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredStreams.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {filteredStreams.map((stream, index) => (
                  <motion.div
                    key={stream.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <StreamCard stream={stream} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Radio className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No live streams</h3>
                  <p className="text-muted-foreground">
                    No streamers are currently live. Check back later!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="following">
            {!user ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Sign in to see followed streams</h3>
                  <p className="text-muted-foreground mb-4">
                    Follow your favorite streamers to see when they go live
                  </p>
                  <Button asChild>
                    <Link href="/auth/signin">Sign In</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : followedStreams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {followedStreams.map((stream) => (
                  <StreamCard key={stream.id} stream={stream} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No followed streamers online</h3>
                  <p className="text-muted-foreground">
                    Follow streamers to see when they go live
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="vods">
            {vodStreams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {vodStreams.map((vod) => (
                  <StreamCard key={vod.id} stream={vod} isVOD={true} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Video className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No VODs available</h3>
                  <p className="text-muted-foreground">
                    Past broadcasts will appear here
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
