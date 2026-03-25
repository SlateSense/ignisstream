"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Target, 
  Zap, 
  TrendingUp, 
  TrendingDown,
  Award,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Clock,
  Crosshair,
  Shield,
  Sword,
  Users,
  Star,
  Flame,
  Eye,
  Headphones
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { gameAPIManager, GameStats } from '@/lib/gaming/game-api-manager';
import { realTimeMatchTracker, LiveMatch, GameSession } from '@/lib/gaming/real-time-match-tracker';

interface GameStatsDashboardProps {
  gameId?: string;
  showComparison?: boolean;
  timeframe?: '24h' | '7d' | '30d' | 'all';
}

interface StatCard {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  color: string;
}

interface PerformanceMetric {
  name: string;
  current: number;
  previous: number;
  max: number;
  color: string;
}

export default function GameStatsDashboard({ 
  gameId, 
  showComparison = true, 
  timeframe = '30d' 
}: GameStatsDashboardProps) {
  const { user } = useAuth();
  
  const [gameStats, setGameStats] = useState<GameStats[]>([]);
  const [selectedGame, setSelectedGame] = useState<string>(gameId || '');
  const [activeMatch, setActiveMatch] = useState<LiveMatch | null>(null);
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'comparison'>('overview');

  useEffect(() => {
    if (user) {
      loadGameStats();
      checkActiveMatch();
    }
  }, [user, selectedGame, timeframe]);

  const loadGameStats = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const stats = await gameAPIManager.getUserGameStats(user.id, selectedGame);
      setGameStats(stats);
    } catch (error) {
      console.error('Error loading game stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkActiveMatch = () => {
    if (!user) return;
    
    const activeMatches = realTimeMatchTracker.getActiveMatches(user.id);
    if (activeMatches.length > 0) {
      setActiveMatch(activeMatches[0]);
      
      // Set up real-time updates
      realTimeMatchTracker.onMatchUpdate(activeMatches[0].id, (match) => {
        setActiveMatch(match);
      });
    }
  };

  const getGameSpecificStats = (stats: GameStats): StatCard[] => {
    const baseStats: StatCard[] = [
      {
        label: 'K/D Ratio',
        value: stats.kd_ratio?.toFixed(2) || '0.00',
        icon: <Crosshair className="h-5 w-5" />,
        trend: 'up',
        trendValue: 5.2,
        color: 'text-green-500'
      },
      {
        label: 'Win Rate',
        value: `${stats.win_rate?.toFixed(1) || 0}%`,
        icon: <Trophy className="h-5 w-5" />,
        trend: 'up',
        trendValue: 3.1,
        color: 'text-blue-500'
      },
      {
        label: 'Matches Played',
        value: stats.matches_played || 0,
        icon: <Activity className="h-5 w-5" />,
        trend: 'up',
        trendValue: 12,
        color: 'text-purple-500'
      },
      {
        label: 'Playtime',
        value: `${Math.round((stats.total_playtime || 0) / 60)}h`,
        icon: <Clock className="h-5 w-5" />,
        trend: 'neutral',
        color: 'text-gray-500'
      }
    ];

    // Add game-specific stats based on game type
    if (selectedGame === 'valorant' || selectedGame === 'csgo') {
      baseStats.push(
        {
          label: 'ADR',
          value: stats.adr?.toFixed(1) || '0.0',
          icon: <Target className="h-5 w-5" />,
          trend: 'up',
          trendValue: 2.8,
          color: 'text-orange-500'
        },
        {
          label: 'Headshot %',
          value: `${stats.headshot_percentage?.toFixed(1) || 0}%`,
          icon: <Crosshair className="h-5 w-5" />,
          trend: 'up',
          trendValue: 1.5,
          color: 'text-red-500'
        }
      );
    }

    if (selectedGame === 'valorant') {
      baseStats.push({
        label: 'Current Rank',
        value: stats.tier || 'Unranked',
        icon: <Award className="h-5 w-5" />,
        color: 'text-yellow-500'
      });
    }

    return baseStats;
  };

  const getPerformanceMetrics = (stats: GameStats): PerformanceMetric[] => {
    return [
      {
        name: 'Aim Consistency',
        current: stats.headshot_percentage || 0,
        previous: (stats.headshot_percentage || 0) - 2,
        max: 100,
        color: 'bg-red-500'
      },
      {
        name: 'Game Sense',
        current: (stats.win_rate || 0),
        previous: (stats.win_rate || 0) - 5,
        max: 100,
        color: 'bg-blue-500'
      },
      {
        name: 'Clutch Factor',
        current: Math.min(((stats.wins || 0) / Math.max(stats.matches_played || 1, 1)) * 100, 100),
        previous: 65,
        max: 100,
        color: 'bg-purple-500'
      },
      {
        name: 'Consistency',
        current: Math.min(((stats.kd_ratio || 0) / 3) * 100, 100),
        previous: 70,
        max: 100,
        color: 'bg-green-500'
      }
    ];
  };

  const renderStatCard = (stat: StatCard, index: number) => (
    <motion.div
      key={stat.label}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
            <div className={`p-3 rounded-full bg-secondary/20 ${stat.color}`}>
              {stat.icon}
            </div>
          </div>
          
          {stat.trend && stat.trendValue && (
            <div className="flex items-center mt-4 text-sm">
              {stat.trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : stat.trend === 'down' ? (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              ) : null}
              <span className={`font-medium ${
                stat.trend === 'up' ? 'text-green-500' : 
                stat.trend === 'down' ? 'text-red-500' : 'text-gray-500'
              }`}>
                {stat.trend === 'up' ? '+' : stat.trend === 'down' ? '-' : ''}
                {stat.trendValue}%
              </span>
              <span className="text-muted-foreground ml-1">vs last {timeframe}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderPerformanceRadar = (metrics: PerformanceMetric[]) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Performance Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {metrics.map((metric, index) => (
          <div key={metric.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{metric.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {metric.previous}%
                </span>
                <span className="text-sm font-bold">
                  {metric.current.toFixed(1)}%
                </span>
                {metric.current > metric.previous ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
              </div>
            </div>
            <div className="relative">
              <Progress value={metric.current} className="h-3" />
              <div 
                className="absolute top-0 left-0 h-3 rounded-full opacity-50"
                style={{
                  width: `${metric.previous}%`,
                  backgroundColor: 'currentColor'
                }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const renderLiveMatch = () => {
    if (!activeMatch) return null;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-6"
      >
        <Card className="border-green-500/50 bg-gradient-to-r from-green-500/10 to-transparent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                Live Match - {activeMatch.game_mode}
              </CardTitle>
              <Badge className="bg-green-500 text-white">
                LIVE
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">
                  {activeMatch.real_time_stats.kills}
                </p>
                <p className="text-sm text-muted-foreground">Kills</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-500">
                  {activeMatch.real_time_stats.deaths}
                </p>
                <p className="text-sm text-muted-foreground">Deaths</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-500">
                  {activeMatch.real_time_stats.assists}
                </p>
                <p className="text-sm text-muted-foreground">Assists</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-500">
                  {activeMatch.real_time_stats.current_streak}
                </p>
                <p className="text-sm text-muted-foreground">Streak</p>
              </div>
            </div>
            
            {activeMatch.current_score && (
              <div className="mt-4 p-3 bg-secondary/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Score</span>
                  <span className="text-lg font-bold">{activeMatch.current_score}</span>
                </div>
                {activeMatch.map && (
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-muted-foreground">Map</span>
                    <span className="text-sm">{activeMatch.map}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const currentStats = gameStats.find(s => !selectedGame || s.game_id === selectedGame) || gameStats[0];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!currentStats) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-semibold mb-2">No Gaming Stats Found</p>
          <p className="text-muted-foreground">
            Connect your gaming accounts to see detailed statistics
          </p>
          <Button className="mt-4">
            Connect Gaming Accounts
          </Button>
        </CardContent>
      </Card>
    );
  }

  const statCards = getGameSpecificStats(currentStats);
  const performanceMetrics = getPerformanceMetrics(currentStats);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gaming Statistics</h1>
          <p className="text-muted-foreground">
            Track your performance across games
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeframe} onValueChange={() => {}}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedGame} onValueChange={setSelectedGame}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Games" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Games</SelectItem>
              {gameStats.map((stat) => (
                <SelectItem key={stat.game_id} value={stat.game_id}>
                  {stat.game_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Live Match */}
      {renderLiveMatch()}

      <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed</TabsTrigger>
          {showComparison && <TabsTrigger value="comparison">Comparison</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.slice(0, 4).map((stat, index) => renderStatCard(stat, index))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Performance Breakdown */}
            {renderPerformanceRadar(performanceMetrics)}

            {/* Recent Achievement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Recent Achievements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-yellow-500/10 rounded-lg">
                  <div className="p-2 bg-yellow-500/20 rounded-full">
                    <Flame className="h-4 w-4 text-yellow-500" />
                  </div>
                  <div>
                    <p className="font-medium">Hot Streak</p>
                    <p className="text-sm text-muted-foreground">5 wins in a row</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg">
                  <div className="p-2 bg-blue-500/20 rounded-full">
                    <Target className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium">Sharpshooter</p>
                    <p className="text-sm text-muted-foreground">70% headshot rate last match</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-purple-500/10 rounded-lg">
                  <div className="p-2 bg-purple-500/20 rounded-full">
                    <Zap className="h-4 w-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="font-medium">Ace</p>
                    <p className="text-sm text-muted-foreground">Team kill in ranked match</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          {/* All Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statCards.map((stat, index) => renderStatCard(stat, index))}
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardContent className="py-12 text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-semibold mb-2">Cross-Game Analysis</p>
              <p className="text-muted-foreground">
                Compare your skills across different games
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
