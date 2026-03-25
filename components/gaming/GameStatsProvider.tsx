"use client";

import { createContext, useContext, useState, ReactNode } from 'react';
import { useToast } from '@/components/ui/use-toast';

export interface GameStats {
  platform: 'steam' | 'xbox' | 'epic' | 'playstation';
  playerId: string;
  playerName: string;
  avatar?: string;
  level?: number;
  achievements: {
    total: number;
    unlocked: number;
    recent: Array<{
      name: string;
      description: string;
      icon: string;
      unlocked_at: string;
      rarity?: number;
    }>;
  };
  games: Array<{
    id: string;
    name: string;
    playtime: number; // in minutes
    lastPlayed: string;
    achievements?: {
      total: number;
      unlocked: number;
    };
    cover?: string;
  }>;
  recentActivity: Array<{
    type: 'achievement' | 'game_played' | 'level_up';
    game?: string;
    description: string;
    timestamp: string;
  }>;
  stats: {
    totalPlaytime: number;
    gamesOwned: number;
    averageCompletion: number;
    favoriteGenre?: string;
  };
}

interface GameStatsContextType {
  connectedPlatforms: GameStats[];
  loading: boolean;
  connectPlatform: (platform: string, credentials: any) => Promise<void>;
  disconnectPlatform: (platform: string) => Promise<void>;
  refreshStats: (platform?: string) => Promise<void>;
  getTopGames: (limit?: number) => GameStats['games'];
  getRecentActivity: (limit?: number) => GameStats['recentActivity'];
}

const GameStatsContext = createContext<GameStatsContextType | undefined>(undefined);

export const useGameStats = () => {
  const context = useContext(GameStatsContext);
  if (!context) {
    throw new Error('useGameStats must be used within a GameStatsProvider');
  }
  return context;
};

interface GameStatsProviderProps {
  children: ReactNode;
}

// Mock data for demonstration - in production, this would connect to real APIs
const MOCK_STEAM_STATS: GameStats = {
  platform: 'steam',
  playerId: '76561198000000000',
  playerName: 'GamerTag123',
  avatar: 'https://avatars.steamstatic.com/default.jpg',
  level: 42,
  achievements: {
    total: 1250,
    unlocked: 892,
    recent: [
      {
        name: "Master Assassin",
        description: "Complete 100 stealth kills",
        icon: "🗡️",
        unlocked_at: "2024-03-15T10:30:00Z",
        rarity: 15
      },
      {
        name: "Speed Demon",
        description: "Finish a race in under 2 minutes",
        icon: "🏎️",
        unlocked_at: "2024-03-14T15:20:00Z",
        rarity: 8
      }
    ]
  },
  games: [
    {
      id: "csgo",
      name: "Counter-Strike 2",
      playtime: 2450, // 40.8 hours
      lastPlayed: "2024-03-16T09:15:00Z",
      achievements: { total: 167, unlocked: 89 },
      cover: "https://cdn.akamai.steamstatic.com/steam/apps/730/header.jpg"
    },
    {
      id: "valorant",
      name: "VALORANT",
      playtime: 1890, // 31.5 hours
      lastPlayed: "2024-03-15T22:30:00Z",
      achievements: { total: 45, unlocked: 32 }
    },
    {
      id: "cyberpunk",
      name: "Cyberpunk 2077",
      playtime: 3200, // 53.3 hours
      lastPlayed: "2024-03-10T18:45:00Z",
      achievements: { total: 44, unlocked: 44 }
    }
  ],
  recentActivity: [
    {
      type: 'achievement',
      game: 'Counter-Strike 2',
      description: 'Unlocked "Master Assassin"',
      timestamp: "2024-03-15T10:30:00Z"
    },
    {
      type: 'game_played',
      game: 'VALORANT',
      description: 'Played for 2.5 hours',
      timestamp: "2024-03-15T22:30:00Z"
    },
    {
      type: 'level_up',
      description: 'Reached Steam Level 42',
      timestamp: "2024-03-14T16:20:00Z"
    }
  ],
  stats: {
    totalPlaytime: 12540, // 209 hours
    gamesOwned: 156,
    averageCompletion: 67,
    favoriteGenre: "FPS"
  }
};

export default function GameStatsProvider({ children }: GameStatsProviderProps) {
  const [connectedPlatforms, setConnectedPlatforms] = useState<GameStats[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const connectPlatform = async (platform: string, credentials: any) => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In production, this would make actual API calls to:
      // - Steam Web API
      // - Xbox Live API
      // - Epic Games API
      // - PlayStation Network API
      
      let platformStats: GameStats;
      
      switch (platform) {
        case 'steam':
          // Mock Steam connection
          platformStats = { 
            ...MOCK_STEAM_STATS,
            playerId: credentials.steamId || MOCK_STEAM_STATS.playerId
          };
          break;
        case 'xbox':
          platformStats = {
            platform: 'xbox',
            playerId: credentials.gamertag || 'XboxGamer',
            playerName: credentials.gamertag || 'XboxGamer',
            level: 35,
            achievements: { total: 850, unlocked: 445, recent: [] },
            games: [
              {
                id: "halo",
                name: "Halo Infinite",
                playtime: 1800,
                lastPlayed: "2024-03-16T12:00:00Z",
                achievements: { total: 119, unlocked: 67 }
              }
            ],
            recentActivity: [],
            stats: {
              totalPlaytime: 8940,
              gamesOwned: 89,
              averageCompletion: 52,
              favoriteGenre: "Shooter"
            }
          };
          break;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      setConnectedPlatforms(prev => {
        const filtered = prev.filter(p => p.platform !== platform);
        return [...filtered, platformStats];
      });

      toast({
        title: "Platform connected!",
        description: `Successfully connected to ${platform.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Error connecting platform:', error);
      toast({
        title: "Connection failed",
        description: `Failed to connect to ${platform.toUpperCase()}. Please check your credentials.`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const disconnectPlatform = async (platform: string) => {
    setConnectedPlatforms(prev => prev.filter(p => p.platform !== platform));
    
    toast({
      title: "Platform disconnected",
      description: `Disconnected from ${platform.toUpperCase()}`,
    });
  };

  const refreshStats = async (platform?: string) => {
    setLoading(true);
    try {
      // Simulate API refresh
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In production, this would refresh data from the APIs
      if (platform) {
        // Refresh specific platform
        const platformIndex = connectedPlatforms.findIndex(p => p.platform === platform);
        if (platformIndex !== -1) {
          // Update with fresh data
          const updatedPlatform = { ...connectedPlatforms[platformIndex] };
          // Add some mock updates
          updatedPlatform.stats.totalPlaytime += Math.floor(Math.random() * 60);
          
          setConnectedPlatforms(prev => 
            prev.map((p, i) => i === platformIndex ? updatedPlatform : p)
          );
        }
      } else {
        // Refresh all platforms
        const updatedPlatforms = connectedPlatforms.map(platform => ({
          ...platform,
          stats: {
            ...platform.stats,
            totalPlaytime: platform.stats.totalPlaytime + Math.floor(Math.random() * 60)
          }
        }));
        setConnectedPlatforms(updatedPlatforms);
      }
      
      toast({
        title: "Stats refreshed",
        description: "Your gaming statistics have been updated",
      });
    } catch (error) {
      console.error('Error refreshing stats:', error);
      toast({
        title: "Refresh failed",
        description: "Failed to refresh your statistics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getTopGames = (limit = 5) => {
    const allGames = connectedPlatforms.flatMap(platform => platform.games);
    return allGames
      .sort((a, b) => b.playtime - a.playtime)
      .slice(0, limit);
  };

  const getRecentActivity = (limit = 10) => {
    const allActivity = connectedPlatforms.flatMap(platform => platform.recentActivity);
    return allActivity
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  };

  const value = {
    connectedPlatforms,
    loading,
    connectPlatform,
    disconnectPlatform,
    refreshStats,
    getTopGames,
    getRecentActivity,
  };

  return (
    <GameStatsContext.Provider value={value}>
      {children}
    </GameStatsContext.Provider>
  );
}
