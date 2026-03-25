"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Users, 
  MessageCircle,
  Settings,
  Camera,
  Mic,
  MicOff,
  Eye,
  Share,
  Trophy,
  Gamepad2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StreamChat from '@/components/streaming/StreamChat';
import { Tournament, TournamentMatch } from '@/lib/tournaments/tournament-manager';
import { useAuth } from '@/contexts/AuthContext';

interface TournamentStreamProps {
  tournament: Tournament;
  match?: TournamentMatch;
  isOfficial?: boolean; // Official tournament stream vs participant stream
}

export default function TournamentStream({ tournament, match, isOfficial = false }: TournamentStreamProps) {
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState([50]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamQuality, setStreamQuality] = useState('720p');
  
  // Mock viewer data - would come from real streaming service
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount(prev => prev + Math.floor(Math.random() * 5) - 2);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const streamUrl = match?.stream_url || tournament.stream_url;
  const isParticipant = match && (
    match.participant1_id === user?.id || 
    match.participant2_id === user?.id
  );

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value);
    if (value[0] === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const startStream = () => {
    setIsStreaming(true);
    // Integration with existing streaming system would go here
  };

  const stopStream = () => {
    setIsStreaming(false);
  };

  const shareStream = () => {
    const shareUrl = `${window.location.origin}/tournaments/${tournament.id}/stream`;
    navigator.clipboard.writeText(shareUrl);
  };

  return (
    <div className="space-y-6">
      {/* Stream Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-red-500" />
                {isOfficial ? 'Official Tournament Stream' : 'Match Stream'}
                {isStreaming && (
                  <Badge className="bg-red-500 text-white animate-pulse">
                    LIVE
                  </Badge>
                )}
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                {match 
                  ? `${match.participant1?.user?.display_name || 'TBD'} vs ${match.participant2?.user?.display_name || 'TBD'}`
                  : tournament.name
                }
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span>{viewerCount.toLocaleString()}</span>
              </div>
              
              <Button size="sm" variant="outline" onClick={shareStream}>
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
              
              {(isParticipant || user?.id === tournament.organizer_id) && (
                <Button 
                  size="sm" 
                  onClick={isStreaming ? stopStream : startStream}
                  className={isStreaming ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {isStreaming ? 'Stop Stream' : 'Start Stream'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Stream Area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Video Player */}
          <Card className={`overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              {streamUrl ? (
                <div className="w-full h-full flex items-center justify-center">
                  {/* Video player component would go here */}
                  <div className="text-center text-white">
                    <Play className="h-16 w-16 mx-auto mb-4" />
                    <p className="text-lg font-semibold">Tournament Stream</p>
                    <p className="text-sm opacity-75">
                      {match ? `Round ${match.round} Match` : 'Live Tournament Coverage'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <div className="text-center">
                    <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-semibold">Stream Not Available</p>
                    <p className="text-sm opacity-75">
                      {isParticipant ? 'Start streaming to begin broadcast' : 'Waiting for stream to start'}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Video Controls Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handlePlayPause}
                      className="text-white hover:bg-white/20"
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleMuteToggle}
                        className="text-white hover:bg-white/20"
                      >
                        {isMuted ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <div className="w-20">
                        <Slider
                          value={volume}
                          onValueChange={handleVolumeChange}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    </div>
                    
                    <Badge variant="secondary" className="text-xs">
                      {streamQuality}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <select 
                      value={streamQuality}
                      onChange={(e) => setStreamQuality(e.target.value)}
                      className="bg-black/50 text-white text-xs px-2 py-1 rounded"
                    >
                      <option value="1080p">1080p</option>
                      <option value="720p">720p</option>
                      <option value="480p">480p</option>
                      <option value="360p">360p</option>
                    </select>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleFullscreen}
                      className="text-white hover:bg-white/20"
                    >
                      <Maximize className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Stream Status Indicators */}
              {isStreaming && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-red-500 text-white animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                    LIVE
                  </Badge>
                </div>
              )}
              
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <Badge variant="secondary" className="bg-black/50 text-white">
                  <Users className="h-3 w-3 mr-1" />
                  {viewerCount}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Stream Controls (for streamers) */}
          {(isParticipant || user?.id === tournament.organizer_id) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Stream Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Mic className="h-4 w-4 mr-2" />
                        Microphone
                      </Button>
                      <Button size="sm" variant="outline">
                        <Camera className="h-4 w-4 mr-2" />
                        Camera
                      </Button>
                    </div>
                    
                    <select className="px-3 py-1 border rounded text-sm">
                      <option>1080p 60fps</option>
                      <option>720p 60fps</option>
                      <option>720p 30fps</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-green-500' : 'bg-gray-500'}`} />
                      <span>{isStreaming ? 'Streaming' : 'Offline'}</span>
                    </div>
                    <Badge variant="outline">
                      Bitrate: 6000 kbps
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Match Information */}
          {match && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Match Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-secondary/20 rounded-lg">
                    <p className="text-sm text-muted-foreground">Round</p>
                    <p className="font-semibold">{match.round}</p>
                  </div>
                  
                  <div className="text-center p-3 bg-secondary/20 rounded-lg">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className="capitalize">{match.status.replace('_', ' ')}</Badge>
                  </div>
                  
                  <div className="text-center p-3 bg-secondary/20 rounded-lg">
                    <p className="text-sm text-muted-foreground">Score</p>
                    <p className="font-semibold">{match.score}</p>
                  </div>
                </div>
                
                {match.scheduled_time && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      Scheduled: {new Date(match.scheduled_time).toLocaleString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Chat/Commentary */}
          <Card>
            <Tabs defaultValue="chat" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="stats">Stats</TabsTrigger>
              </TabsList>
              
              <TabsContent value="chat" className="mt-4">
                <div className="h-96">
                  <StreamChat 
                    streamId={tournament.id}
                    isModerated={true}
                    showEmotes={true}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="stats" className="mt-4">
                <div className="space-y-4 h-96 overflow-y-auto">
                  <div className="p-3 bg-secondary/20 rounded-lg">
                    <h4 className="font-medium mb-2">Tournament Stats</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Participants</span>
                        <span>{tournament.current_participants}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Prize Pool</span>
                        <span>${tournament.prize_pool.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Format</span>
                        <span className="capitalize">{tournament.format}</span>
                      </div>
                    </div>
                  </div>
                  
                  {match && (
                    <div className="p-3 bg-secondary/20 rounded-lg">
                      <h4 className="font-medium mb-2">Match History</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Duration</span>
                          <span>
                            {match.started_at && match.completed_at
                              ? `${Math.round((new Date(match.completed_at).getTime() - new Date(match.started_at).getTime()) / 60000)} min`
                              : 'In Progress'
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Round</span>
                          <span>{match.round}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Tournament Bracket Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Tournament Bracket
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-4 bg-secondary/20 rounded-lg">
                <Gamepad2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  View full bracket
                </p>
                <Button size="sm" variant="outline" className="mt-2">
                  Open Bracket
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sponsor Showcase */}
          {tournament.sponsors && tournament.sponsors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Sponsors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tournament.sponsors.map((sponsor) => (
                    <div key={sponsor.id} className="flex items-center gap-3">
                      <img 
                        src={sponsor.sponsor_logo} 
                        alt={sponsor.sponsor_name}
                        className="w-8 h-8 rounded object-contain"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{sponsor.sponsor_name}</p>
                        <Badge variant="outline" className="text-xs">
                          {sponsor.sponsor_tier}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
