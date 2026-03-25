"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Headphones, 
  HeadphonesIcon,
  Volume2, 
  VolumeX, 
  Settings, 
  Users, 
  Phone, 
  PhoneOff,
  Radio,
  Zap,
  MapPin,
  Crown,
  Shield,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { voiceManager, VoiceChannel, VoiceParticipant, VoiceEvent } from '@/lib/voice/voice-manager';

interface VoiceChannelPanelProps {
  channel?: VoiceChannel;
  isMinimized?: boolean;
  onMinimize?: () => void;
  onMaximize?: () => void;
}

export default function VoiceChannelPanel({ 
  channel, 
  isMinimized = false, 
  onMinimize, 
  onMaximize 
}: VoiceChannelPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [inputLevel, setInputLevel] = useState(0);
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  const [speakingUsers, setSpeakingUsers] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [pushToTalkActive, setPushToTalkActive] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('excellent');
  
  const inputLevelRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    // Set up voice event listeners
    const handleUserJoined = (event: VoiceEvent) => {
      if (event.user_id) {
        // Add user to participants (mock implementation)
        const newParticipant: VoiceParticipant = {
          user_id: event.user_id,
          username: `user_${event.user_id.slice(-4)}`,
          display_name: `User ${event.user_id.slice(-4)}`,
          is_muted: false,
          is_deafened: false,
          is_speaking: false,
          volume: 100,
          role: 'member',
          joined_at: new Date().toISOString()
        };
        
        setParticipants(prev => [...prev, newParticipant]);
        
        toast({
          title: "User joined",
          description: `${newParticipant.display_name} joined the voice channel`,
        });
      }
    };

    const handleUserLeft = (event: VoiceEvent) => {
      if (event.user_id) {
        setParticipants(prev => prev.filter(p => p.user_id !== event.user_id));
        setSpeakingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(event.user_id);
          return newSet;
        });
      }
    };

    const handleUserSpeaking = (event: VoiceEvent) => {
      if (event.user_id) {
        setSpeakingUsers(prev => new Set([...prev, event.user_id]));
      }
    };

    const handleUserStoppedSpeaking = (event: VoiceEvent) => {
      if (event.user_id) {
        setSpeakingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(event.user_id);
          return newSet;
        });
      }
    };

    voiceManager.addEventListener('user-joined', handleUserJoined);
    voiceManager.addEventListener('user-left', handleUserLeft);
    voiceManager.addEventListener('user-speaking', handleUserSpeaking);
    voiceManager.addEventListener('user-stopped-speaking', handleUserStoppedSpeaking);

    return () => {
      voiceManager.removeEventListener('user-joined', handleUserJoined);
      voiceManager.removeEventListener('user-left', handleUserLeft);
      voiceManager.removeEventListener('user-speaking', handleUserSpeaking);
      voiceManager.removeEventListener('user-stopped-speaking', handleUserStoppedSpeaking);
    };
  }, [toast]);

  useEffect(() => {
    // Monitor input level
    const updateInputLevel = () => {
      const stats = voiceManager.getAudioStats();
      inputLevelRef.current = stats.inputLevel;
      setInputLevel(stats.inputLevel);
      
      // Update connection quality based on stats
      if (stats.packetLoss > 5 || stats.latency > 200) {
        setConnectionQuality('poor');
      } else if (stats.packetLoss > 1 || stats.latency > 100) {
        setConnectionQuality('good');
      } else {
        setConnectionQuality('excellent');
      }
      
      animationFrameRef.current = requestAnimationFrame(updateInputLevel);
    };

    if (isConnected) {
      animationFrameRef.current = requestAnimationFrame(updateInputLevel);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isConnected]);

  const handleJoinChannel = async () => {
    if (!channel) return;

    try {
      const success = await voiceManager.joinChannel(channel.id);
      if (success) {
        setIsConnected(true);
        toast({
          title: "Connected to voice channel",
          description: `Joined ${channel.name}`,
        });
      }
    } catch (error) {
      toast({
        title: "Failed to connect",
        description: "Unable to join voice channel. Check your microphone permissions.",
        variant: "destructive"
      });
    }
  };

  const handleLeaveChannel = async () => {
    try {
      await voiceManager.leaveChannel();
      setIsConnected(false);
      setParticipants([]);
      setSpeakingUsers(new Set());
      
      toast({
        title: "Disconnected",
        description: "Left voice channel",
      });
    } catch (error) {
      toast({
        title: "Error leaving channel",
        description: "An error occurred while leaving the channel",
        variant: "destructive"
      });
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    voiceManager.setMuted(newMuted);
  };

  const toggleDeafen = () => {
    const newDeafened = !isDeafened;
    setIsDeafened(newDeafened);
    voiceManager.setDeafened(newDeafened);
    
    // If deafening, also mute
    if (newDeafened && !isMuted) {
      setIsMuted(true);
      voiceManager.setMuted(true);
    }
  };

  const adjustUserVolume = (userId: string, volume: number) => {
    voiceManager.setVolume(userId, volume);
    setParticipants(prev => 
      prev.map(p => p.user_id === userId ? { ...p, volume } : p)
    );
  };

  const getConnectionQualityColor = () => {
    switch (connectionQuality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getConnectionQualityIcon = () => {
    switch (connectionQuality) {
      case 'excellent': return '●●●';
      case 'good': return '●●○';
      case 'poor': return '●○○';
      default: return '○○○';
    }
  };

  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Card className="w-64 bg-background/95 backdrop-blur border-primary/20">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-500'} animate-pulse`} />
                <span className="text-sm font-medium truncate">
                  {channel?.name || 'Voice Channel'}
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={toggleMute}>
                  {isMuted ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={onMaximize}>
                  <Maximize2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            {isConnected && (
              <div className="flex items-center gap-1 mt-2">
                {participants.slice(0, 4).map(participant => (
                  <Avatar key={participant.user_id} className="h-6 w-6">
                    <AvatarImage src={participant.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {participant.username[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {participants.length > 4 && (
                  <span className="text-xs text-muted-foreground ml-1">
                    +{participants.length - 4}
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (!channel) {
    return (
      <Card className="w-80">
        <CardContent className="py-12 text-center">
          <Radio className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No voice channel selected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className="w-80 bg-background/95 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <Radio className="h-4 w-4" />
                {channel.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {channel.type}
                </Badge>
                {channel.is_spatial && (
                  <Badge variant="outline" className="text-xs">
                    <MapPin className="h-3 w-3 mr-1" />
                    Spatial
                  </Badge>
                )}
                <span className={`text-xs ${getConnectionQualityColor()}`}>
                  {getConnectionQualityIcon()}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="ghost" onClick={() => setShowSettings(!showSettings)}>
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Voice Settings</TooltipContent>
              </Tooltip>
              
              {onMinimize && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="ghost" onClick={onMinimize}>
                      <Minimize2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Minimize</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Connection Controls */}
          <div className="flex items-center gap-2">
            {!isConnected ? (
              <Button onClick={handleJoinChannel} className="flex-1">
                <Phone className="h-4 w-4 mr-2" />
                Join Channel
              </Button>
            ) : (
              <Button onClick={handleLeaveChannel} variant="destructive" className="flex-1">
                <PhoneOff className="h-4 w-4 mr-2" />
                Leave Channel
              </Button>
            )}
          </div>

          {isConnected && (
            <>
              {/* Voice Controls */}
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={isMuted ? "destructive" : "outline"}
                      onClick={toggleMute}
                      className="flex-1"
                    >
                      {isMuted ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                      {isMuted ? 'Unmute' : 'Mute'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Toggle Microphone</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={isDeafened ? "destructive" : "outline"}
                      onClick={toggleDeafen}
                      className="flex-1"
                    >
                      {isDeafened ? <HeadphonesIcon className="h-4 w-4 mr-2" /> : <Headphones className="h-4 w-4 mr-2" />}
                      {isDeafened ? 'Undeafen' : 'Deafen'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Toggle Audio Output</TooltipContent>
                </Tooltip>
              </div>

              {/* Input Level Meter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Input Level</span>
                  <span className={`text-xs ${inputLevel > 50 ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {Math.round(inputLevel)}%
                  </span>
                </div>
                <Progress 
                  value={inputLevel} 
                  className="h-2"
                  // @ts-ignore
                  style={{
                    '--progress-foreground': inputLevel > 80 ? '#ef4444' : inputLevel > 50 ? '#eab308' : '#22c55e'
                  }}
                />
              </div>

              {/* Push-to-Talk Indicator */}
              <AnimatePresence>
                {pushToTalkActive && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center justify-center p-2 bg-primary/20 rounded-lg"
                  >
                    <Zap className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-sm font-medium">Push-to-Talk Active</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Participants List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Participants ({participants.length}/{channel.max_participants})
                  </span>
                </div>
                
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {participants.map((participant) => (
                    <motion.div
                      key={participant.user_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-3 p-2 rounded-lg bg-secondary/20 hover:bg-secondary/40 transition-colors"
                    >
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={participant.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {participant.username[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        {/* Speaking Indicator */}
                        {speakingUsers.has(participant.user_id) && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                        )}
                        
                        {/* Role Indicator */}
                        {participant.role === 'leader' && (
                          <Crown className="absolute -bottom-1 -right-1 w-3 h-3 text-yellow-500" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{participant.display_name}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {participant.is_muted && <MicOff className="h-3 w-3" />}
                          {participant.is_deafened && <HeadphonesIcon className="h-3 w-3" />}
                          <span className="truncate">@{participant.username}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {/* Volume Control */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="w-12">
                              <Slider
                                value={[participant.volume]}
                                onValueChange={(value) => adjustUserVolume(participant.user_id, value[0])}
                                max={200}
                                step={10}
                                className="w-full"
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Volume: {participant.volume}%</TooltipContent>
                        </Tooltip>
                        
                        <Button size="sm" variant="ghost">
                          {participant.volume > 0 ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
