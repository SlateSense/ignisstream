"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radio, 
  Users, 
  Mic, 
  MicOff, 
  Headphones,
  Settings,
  MapPin,
  Zap,
  Volume2,
  Crown,
  Shield,
  Play,
  Pause,
  PhoneOff,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useVoice } from '@/contexts/VoiceContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import VoiceChannelPanel from '@/components/voice/VoiceChannelPanel';

interface MatchVoiceIntegrationProps {
  matchId?: string;
  gameId?: string;
  teamMembers?: Array<{
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    role?: 'captain' | 'player' | 'substitute';
  }>;
  isInMatch?: boolean;
  spatialEnabled?: boolean;
  onVoiceStateChange?: (connected: boolean) => void;
}

export default function MatchVoiceIntegration({ 
  matchId, 
  gameId, 
  teamMembers = [], 
  isInMatch = false,
  spatialEnabled = false,
  onVoiceStateChange 
}: MatchVoiceIntegrationProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    currentChannel,
    isConnected,
    isMuted,
    isDeafened,
    participants,
    speakingUsers,
    inputLevel,
    connectionQuality,
    autoJoinForMatch,
    leaveChannel,
    toggleMute,
    toggleDeafen,
    setUserVolume,
    updateUserPosition
  } = useVoice();

  const [autoJoinEnabled, setAutoJoinEnabled] = useState(true);
  const [spatialMode, setSpatialMode] = useState(spatialEnabled);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [teamPositions, setTeamPositions] = useState<Map<string, { x: number; y: number; z: number }>>(new Map());
  const [voicePanelMinimized, setVoicePanelMinimized] = useState(false);

  useEffect(() => {
    // Auto-join voice channel when match starts
    if (matchId && gameId && isInMatch && autoJoinEnabled && !isConnected) {
      handleAutoJoinMatch();
    }
  }, [matchId, gameId, isInMatch, autoJoinEnabled, isConnected]);

  useEffect(() => {
    // Notify parent component of voice state changes
    if (onVoiceStateChange) {
      onVoiceStateChange(isConnected);
    }
  }, [isConnected, onVoiceStateChange]);

  useEffect(() => {
    // Set up spatial audio positions for team-based games
    if (spatialMode && teamMembers.length > 0) {
      const positions = new Map();
      
      // Arrange team members in a tactical formation
      teamMembers.forEach((member, index) => {
        const angle = (index / teamMembers.length) * Math.PI * 2;
        const radius = 5; // 5 meter radius
        
        positions.set(member.id, {
          x: Math.cos(angle) * radius,
          y: 0,
          z: Math.sin(angle) * radius
        });
      });
      
      setTeamPositions(positions);
      
      // Update voice positions
      positions.forEach((position, userId) => {
        updateUserPosition(userId, position);
      });
    }
  }, [spatialMode, teamMembers, updateUserPosition]);

  const handleAutoJoinMatch = async () => {
    if (!matchId || !gameId) return;

    try {
      const success = await autoJoinForMatch(matchId, gameId);
      if (success) {
        toast({
          title: "Joined team voice chat",
          description: "You're now connected to your team's voice channel.",
        });
      } else {
        toast({
          title: "Failed to join voice chat",
          description: "Check your microphone permissions and try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to auto-join match voice:', error);
      toast({
        title: "Voice chat unavailable",
        description: "Unable to connect to team voice chat.",
        variant: "destructive"
      });
    }
  };

  const handleLeaveVoice = async () => {
    try {
      await leaveChannel();
      toast({
        title: "Left voice chat",
        description: "You have disconnected from the team voice channel.",
      });
    } catch (error) {
      console.error('Failed to leave voice chat:', error);
    }
  };

  const updateTeamMemberPosition = (userId: string, gamePosition: { x: number; y: number }) => {
    if (!spatialMode) return;
    
    // Convert 2D game coordinates to 3D audio space
    const audioPosition = {
      x: gamePosition.x,
      y: 0,
      z: gamePosition.y
    };
    
    setTeamPositions(prev => new Map(prev.set(userId, audioPosition)));
    updateUserPosition(userId, audioPosition);
  };

  const getConnectionStatusColor = () => {
    if (!isConnected) return 'text-gray-500';
    
    switch (connectionQuality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getParticipantForTeamMember = (teamMemberId: string) => {
    return participants.find(p => p.user_id === teamMemberId);
  };

  if (voicePanelMinimized && isConnected) {
    return (
      <VoiceChannelPanel
        channel={currentChannel || undefined}
        isMinimized={true}
        onMaximize={() => setVoicePanelMinimized(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Voice Status Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Radio className={`h-4 w-4 ${getConnectionStatusColor()}`} />
              Team Voice Chat
              {isConnected && (
                <Badge variant="outline" className="text-xs">
                  {participants.length} connected
                </Badge>
              )}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {spatialEnabled && (
                <Badge variant="outline" className="text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  Spatial
                </Badge>
              )}
              
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              
              {isConnected && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setVoicePanelMinimized(true)}
                >
                  <Pause className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {!isConnected ? (
            <div className="space-y-3">
              {/* Connection Options */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Auto-join voice chat</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically connect when match starts
                  </p>
                </div>
                <Switch
                  checked={autoJoinEnabled}
                  onCheckedChange={setAutoJoinEnabled}
                />
              </div>

              {spatialEnabled && (
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Spatial audio</Label>
                    <p className="text-xs text-muted-foreground">
                      3D positional voice chat
                    </p>
                  </div>
                  <Switch
                    checked={spatialMode}
                    onCheckedChange={setSpatialMode}
                  />
                </div>
              )}

              <Button 
                onClick={handleAutoJoinMatch} 
                disabled={!matchId || !gameId}
                className="w-full"
              >
                <Radio className="h-4 w-4 mr-2" />
                Join Team Voice
              </Button>

              {!isInMatch && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Voice chat will be available when the match begins
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Voice Controls */}
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant={isMuted ? "destructive" : "outline"}
                  onClick={toggleMute}
                  className="flex-1"
                >
                  {isMuted ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                  {isMuted ? 'Unmute' : 'Mute'}
                </Button>
                
                <Button 
                  size="sm" 
                  variant={isDeafened ? "destructive" : "outline"}
                  onClick={toggleDeafen}
                  className="flex-1"
                >
                  <Headphones className="h-4 w-4 mr-2" />
                  {isDeafened ? 'Undeafen' : 'Deafen'}
                </Button>
                
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={handleLeaveVoice}
                >
                  <PhoneOff className="h-4 w-4" />
                </Button>
              </div>

              {/* Input Level */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Microphone Level</span>
                  <span>{Math.round(inputLevel)}%</span>
                </div>
                <Progress value={inputLevel} className="h-2" />
              </div>

              {/* Team Members Voice Status */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Team Members</Label>
                
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {teamMembers.map((member) => {
                    const participant = getParticipantForTeamMember(member.id);
                    const isSpeaking = speakingUsers.has(member.id);
                    const position = teamPositions.get(member.id);
                    
                    return (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-2 bg-secondary/20 rounded-lg"
                      >
                        <div className="relative">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {member.username[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          {/* Speaking indicator */}
                          <AnimatePresence>
                            {isSpeaking && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
                              />
                            )}
                          </AnimatePresence>
                          
                          {/* Role indicator */}
                          {member.role === 'captain' && (
                            <Crown className="absolute -bottom-1 -right-1 w-3 h-3 text-yellow-500" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{member.display_name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>@{member.username}</span>
                            {participant ? (
                              <div className="flex items-center gap-1">
                                {participant.is_muted && <MicOff className="h-3 w-3" />}
                                {participant.is_deafened && <Headphones className="h-3 w-3" />}
                                <span className="text-green-500">Connected</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Offline</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Spatial position indicator */}
                        {spatialMode && position && (
                          <div className="text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 inline mr-1" />
                            {Math.round(position.x)}, {Math.round(position.z)}
                          </div>
                        )}
                        
                        {/* Volume control */}
                        {participant && (
                          <div className="flex items-center gap-2">
                            <Volume2 className="h-3 w-3" />
                            <div className="w-16">
                              <Slider
                                value={[participant.volume]}
                                onValueChange={(value) => setUserVolume(member.id, value[0])}
                                max={200}
                                step={10}
                                className="w-full"
                              />
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Advanced Settings */}
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 border-t pt-3"
              >
                <Label className="text-sm font-medium">Advanced Settings</Label>
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Latency</span>
                    <p className="font-medium">{connectionQuality === 'excellent' ? '< 50ms' : connectionQuality === 'good' ? '< 100ms' : '> 100ms'}</p>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Quality</span>
                    <p className={`font-medium capitalize ${getConnectionStatusColor()}`}>
                      {connectionQuality}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Codec</span>
                    <p className="font-medium">Opus</p>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Bitrate</span>
                    <p className="font-medium">64 kbps</p>
                  </div>
                </div>

                {spatialMode && (
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Spatial Audio Active</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Voice positions synchronized with game coordinates
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Full Voice Panel (when not minimized) */}
      {isConnected && !voicePanelMinimized && (
        <VoiceChannelPanel
          channel={currentChannel || undefined}
          isMinimized={false}
          onMinimize={() => setVoicePanelMinimized(true)}
        />
      )}
    </div>
  );
}
