"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { voiceManager, VoiceChannel, VoiceParticipant, VoiceEvent } from '@/lib/voice/voice-manager';

interface VoiceContextType {
  currentChannel: VoiceChannel | null;
  isConnected: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  participants: VoiceParticipant[];
  speakingUsers: Set<string>;
  inputLevel: number;
  connectionQuality: 'excellent' | 'good' | 'poor';
  
  // Actions
  joinChannel: (channelId: string) => Promise<boolean>;
  leaveChannel: () => Promise<boolean>;
  createChannel: (options: {
    name: string;
    type: VoiceChannel['type'];
    game_id?: string;
    match_id?: string;
    tournament_id?: string;
    max_participants?: number;
    is_spatial?: boolean;
    is_private?: boolean;
  }) => Promise<VoiceChannel | null>;
  
  toggleMute: () => void;
  toggleDeafen: () => void;
  setUserVolume: (userId: string, volume: number) => void;
  updateUserPosition: (userId: string, position: { x: number; y: number; z: number }) => void;
  
  // Auto-join for matches/tournaments
  autoJoinForMatch: (matchId: string, gameId: string) => Promise<boolean>;
  autoJoinForTournament: (tournamentId: string, gameId: string) => Promise<boolean>;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
};

interface VoiceProviderProps {
  children: ReactNode;
}

export default function VoiceProvider({ children }: VoiceProviderProps) {
  const { user } = useAuth();
  
  const [currentChannel, setCurrentChannel] = useState<VoiceChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  const [speakingUsers, setSpeakingUsers] = useState<Set<string>>(new Set());
  const [inputLevel, setInputLevel] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('excellent');

  useEffect(() => {
    // Set up voice event listeners
    const handleUserJoined = (event: VoiceEvent) => {
      if (event.user_id && event.user_id !== user?.id) {
        // Mock participant data - would come from real user data
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
        
        // Update participant speaking state
        setParticipants(prev => 
          prev.map(p => p.user_id === event.user_id ? { ...p, is_speaking: true } : p)
        );
      }
    };

    const handleUserStoppedSpeaking = (event: VoiceEvent) => {
      if (event.user_id) {
        setSpeakingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(event.user_id);
          return newSet;
        });
        
        // Update participant speaking state
        setParticipants(prev => 
          prev.map(p => p.user_id === event.user_id ? { ...p, is_speaking: false } : p)
        );
      }
    };

    const handleUserMuted = (event: VoiceEvent) => {
      if (event.user_id === user?.id) {
        setIsMuted(true);
      } else {
        setParticipants(prev => 
          prev.map(p => p.user_id === event.user_id ? { ...p, is_muted: true } : p)
        );
      }
    };

    const handleUserUnmuted = (event: VoiceEvent) => {
      if (event.user_id === user?.id) {
        setIsMuted(false);
      } else {
        setParticipants(prev => 
          prev.map(p => p.user_id === event.user_id ? { ...p, is_muted: false } : p)
        );
      }
    };

    // Register event listeners
    voiceManager.addEventListener('user-joined', handleUserJoined);
    voiceManager.addEventListener('user-left', handleUserLeft);
    voiceManager.addEventListener('user-speaking', handleUserSpeaking);
    voiceManager.addEventListener('user-stopped-speaking', handleUserStoppedSpeaking);
    voiceManager.addEventListener('user-muted', handleUserMuted);
    voiceManager.addEventListener('user-unmuted', handleUserUnmuted);

    return () => {
      voiceManager.removeEventListener('user-joined', handleUserJoined);
      voiceManager.removeEventListener('user-left', handleUserLeft);
      voiceManager.removeEventListener('user-speaking', handleUserSpeaking);
      voiceManager.removeEventListener('user-stopped-speaking', handleUserStoppedSpeaking);
      voiceManager.removeEventListener('user-muted', handleUserMuted);
      voiceManager.removeEventListener('user-unmuted', handleUserUnmuted);
    };
  }, [user?.id]);

  useEffect(() => {
    // Monitor audio stats
    const interval = setInterval(() => {
      const stats = voiceManager.getAudioStats();
      setInputLevel(stats.inputLevel);
      
      // Update connection quality
      if (stats.packetLoss > 5 || stats.latency > 200) {
        setConnectionQuality('poor');
      } else if (stats.packetLoss > 1 || stats.latency > 100) {
        setConnectionQuality('good');
      } else {
        setConnectionQuality('excellent');
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isConnected]);

  const joinChannel = async (channelId: string): Promise<boolean> => {
    try {
      const success = await voiceManager.joinChannel(channelId);
      if (success) {
        setIsConnected(true);
        // Would fetch channel data from database
        setCurrentChannel({
          id: channelId,
          name: `Channel ${channelId.slice(0, 8)}`,
          type: 'match',
          max_participants: 10,
          current_participants: 1,
          is_spatial: false,
          is_private: false,
          created_by: user?.id || '',
          created_at: new Date().toISOString(),
          participants: []
        });
      }
      return success;
    } catch (error) {
      console.error('Failed to join voice channel:', error);
      return false;
    }
  };

  const leaveChannel = async (): Promise<boolean> => {
    try {
      const success = await voiceManager.leaveChannel();
      if (success) {
        setIsConnected(false);
        setCurrentChannel(null);
        setParticipants([]);
        setSpeakingUsers(new Set());
        setIsMuted(false);
        setIsDeafened(false);
      }
      return success;
    } catch (error) {
      console.error('Failed to leave voice channel:', error);
      return false;
    }
  };

  const createChannel = async (options: {
    name: string;
    type: VoiceChannel['type'];
    game_id?: string;
    match_id?: string;
    tournament_id?: string;
    max_participants?: number;
    is_spatial?: boolean;
    is_private?: boolean;
  }): Promise<VoiceChannel | null> => {
    try {
      const channel = await voiceManager.createChannel(options);
      if (channel) {
        // Auto-join the created channel
        await joinChannel(channel.id);
      }
      return channel;
    } catch (error) {
      console.error('Failed to create voice channel:', error);
      return null;
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    voiceManager.setMuted(newMuted);
    setIsMuted(newMuted);
  };

  const toggleDeafen = () => {
    const newDeafened = !isDeafened;
    voiceManager.setDeafened(newDeafened);
    setIsDeafened(newDeafened);
    
    // Auto-mute when deafening
    if (newDeafened && !isMuted) {
      voiceManager.setMuted(true);
      setIsMuted(true);
    }
  };

  const setUserVolume = (userId: string, volume: number) => {
    voiceManager.setVolume(userId, volume);
    setParticipants(prev => 
      prev.map(p => p.user_id === userId ? { ...p, volume } : p)
    );
  };

  const updateUserPosition = (userId: string, position: { x: number; y: number; z: number }) => {
    voiceManager.updateUserPosition(userId, position);
  };

  // Auto-join functionality for matches and tournaments
  const autoJoinForMatch = async (matchId: string, gameId: string): Promise<boolean> => {
    try {
      // Check if there's already a voice channel for this match
      // In a real implementation, you'd query the database for existing channels
      
      const channelName = `Match ${matchId.slice(0, 8)} Voice`;
      const channel = await createChannel({
        name: channelName,
        type: 'match',
        match_id: matchId,
        game_id: gameId,
        max_participants: 10,
        is_spatial: isGameSpatialCompatible(gameId),
        is_private: true
      });

      return channel !== null;
    } catch (error) {
      console.error('Failed to auto-join match voice channel:', error);
      return false;
    }
  };

  const autoJoinForTournament = async (tournamentId: string, gameId: string): Promise<boolean> => {
    try {
      const channelName = `Tournament ${tournamentId.slice(0, 8)} Voice`;
      const channel = await createChannel({
        name: channelName,
        type: 'tournament',
        tournament_id: tournamentId,
        game_id: gameId,
        max_participants: 50,
        is_spatial: false, // Usually not spatial for tournament-wide channels
        is_private: false
      });

      return channel !== null;
    } catch (error) {
      console.error('Failed to auto-join tournament voice channel:', error);
      return false;
    }
  };

  // Helper function to determine if a game supports spatial audio
  const isGameSpatialCompatible = (gameId: string): boolean => {
    const spatialCompatibleGames = [
      'valorant',
      'csgo',
      'rainbow-six-siege',
      'overwatch',
      'apex-legends',
      'pubg',
      'call-of-duty'
    ];
    
    return spatialCompatibleGames.includes(gameId.toLowerCase());
  };

  const value: VoiceContextType = {
    currentChannel,
    isConnected,
    isMuted,
    isDeafened,
    participants,
    speakingUsers,
    inputLevel,
    connectionQuality,
    
    joinChannel,
    leaveChannel,
    createChannel,
    toggleMute,
    toggleDeafen,
    setUserVolume,
    updateUserPosition,
    autoJoinForMatch,
    autoJoinForTournament,
  };

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  );
}
