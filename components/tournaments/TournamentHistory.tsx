"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Medal, 
  Award, 
  Crown,
  TrendingUp, 
  Calendar, 
  Users, 
  DollarSign,
  Target,
  Zap,
  Filter,
  Download,
  ExternalLink,
  Star,
  BarChart3,
  Gamepad2,
  Clock,
  ChevronRight,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';

interface TournamentHistoryEntry {
  id: string;
  tournament_name: string;
  game: {
    id: string;
    name: string;
    cover_url?: string;
  };
  placement: number;
  total_participants: number;
  prize_won: number;
  date_completed: string;
  tournament_format: string;
  bracket_type: string;
  organizer: {
    name: string;
    avatar_url?: string;
  };
}

interface RankingEntry {
  rank: number;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  tournament_points: number;
  tournaments_played: number;
  tournaments_won: number;
  total_prize_money: number;
  win_rate: number;
  avg_placement: number;
  recent_form: number[]; // Last 5 tournament placements
}

interface TournamentHistoryProps {
  userId?: string;
  gameId?: string;
  showGlobalRankings?: boolean;
}

export default function TournamentHistory({ userId, gameId, showGlobalRankings = true }: TournamentHistoryProps) {
  const { user } = useAuth();
  const [userHistory, setUserHistory] = useState<TournamentHistoryEntry[]>([]);
  const [globalRankings, setGlobalRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(gameId || 'all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [currentUser, setCurrentUser] = useState<RankingEntry | null>(null);

  const targetUserId = userId || user?.id;

  useEffect(() => {
    loadTournamentHistory();
    if (showGlobalRankings) {
      loadGlobalRankings();
    }
  }, [targetUserId, selectedGame, timeFilter]);

  const loadTournamentHistory = async () => {
    if (!targetUserId) return;
    
    setLoading(true);
    try {
      // Mock data - would fetch from database
      const mockHistory: TournamentHistoryEntry[] = [
        {
          id: '1',
          tournament_name: 'Valorant Champions Series',
          game: { id: '1', name: 'Valorant', cover_url: '/games/valorant.jpg' },
          placement: 1,
          total_participants: 64,
          prize_won: 5000,
          date_completed: '2024-01-15',
          tournament_format: 'team',
          bracket_type: 'single_elimination',
          organizer: { name: 'ESL Gaming', avatar_url: '/orgs/esl.png' }
        },
        {
          id: '2',
          tournament_name: 'CS:GO Major Qualifier',
          game: { id: '2', name: 'CS:GO', cover_url: '/games/csgo.jpg' },
          placement: 3,
          total_participants: 32,
          prize_won: 1500,
          date_completed: '2024-01-10',
          tournament_format: 'team',
          bracket_type: 'double_elimination',
          organizer: { name: 'FACEIT', avatar_url: '/orgs/faceit.png' }
        },
        {
          id: '3',
          tournament_name: 'Fortnite Solo Championship',
          game: { id: '3', name: 'Fortnite', cover_url: '/games/fortnite.jpg' },
          placement: 12,
          total_participants: 100,
          prize_won: 250,
          date_completed: '2024-01-05',
          tournament_format: 'solo',
          bracket_type: 'round_robin',
          organizer: { name: 'Epic Games', avatar_url: '/orgs/epic.png' }
        }
      ];
      
      setUserHistory(mockHistory);
    } catch (error) {
      console.error('Error loading tournament history:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGlobalRankings = async () => {
    try {
      // Mock data - would fetch from database
      const mockRankings: RankingEntry[] = Array.from({ length: 50 }, (_, i) => ({
        rank: i + 1,
        user_id: `user_${i + 1}`,
        username: `player${i + 1}`,
        display_name: `Pro Player ${i + 1}`,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=player${i + 1}`,
        tournament_points: 5000 - (i * 50),
        tournaments_played: 15 + Math.floor(Math.random() * 10),
        tournaments_won: Math.max(0, 5 - i),
        total_prize_money: 25000 - (i * 400),
        win_rate: Math.max(10, 80 - (i * 2)),
        avg_placement: 1 + (i * 0.5),
        recent_form: Array.from({ length: 5 }, () => Math.floor(Math.random() * 10) + 1)
      }));
      
      setGlobalRankings(mockRankings);
      
      // Find current user in rankings
      if (targetUserId) {
        const userRanking = mockRankings.find(r => r.user_id === targetUserId) || {
          rank: 156,
          user_id: targetUserId,
          username: user?.user_metadata?.username || 'You',
          display_name: user?.user_metadata?.display_name || 'You',
          avatar_url: user?.user_metadata?.avatar_url,
          tournament_points: 2340,
          tournaments_played: 12,
          tournaments_won: 2,
          total_prize_money: 8500,
          win_rate: 45,
          avg_placement: 8.2,
          recent_form: [3, 12, 1, 8, 5]
        };
        setCurrentUser(userRanking);
      }
    } catch (error) {
      console.error('Error loading global rankings:', error);
    }
  };

  const getPlacementIcon = (placement: number) => {
    switch (placement) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-orange-500" />;
      default:
        return <Trophy className="h-5 w-5 text-blue-500" />;
    }
  };

  const getPlacementColor = (placement: number) => {
    if (placement === 1) return 'text-yellow-500';
    if (placement <= 3) return 'text-orange-500';
    if (placement <= 10) return 'text-blue-500';
    return 'text-muted-foreground';
  };

  const calculatePerformanceScore = (entry: RankingEntry) => {
    return Math.round(
      (entry.win_rate * 0.4) + 
      ((10 - entry.avg_placement) * 10) * 0.3 +
      (entry.tournaments_won * 5) * 0.3
    );
  };

  const getFormTrend = (form: number[]) => {
    if (form.length < 2) return 'neutral';
    const recent = form.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const older = form.slice(0, -3).reduce((a, b) => a + b, 0) / (form.length - 3 || 1);
    
    if (recent < older * 0.8) return 'improving';
    if (recent > older * 1.2) return 'declining';
    return 'stable';
  };

  const totalPrizeMoney = userHistory.reduce((sum, entry) => sum + entry.prize_won, 0);
  const tournamentsWon = userHistory.filter(entry => entry.placement === 1).length;
  const avgPlacement = userHistory.length > 0 
    ? userHistory.reduce((sum, entry) => sum + entry.placement, 0) / userHistory.length
    : 0;

  return (
    <div className="space-y-6">
      {/* User Stats Overview */}
      {targetUserId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Tournament Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-5 gap-4">
              <div className="text-center p-3 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg">
                <Trophy className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                <p className="text-lg font-bold">{tournamentsWon}</p>
                <p className="text-sm text-muted-foreground">Tournaments Won</p>
              </div>
              
              <div className="text-center p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg">
                <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-500" />
                <p className="text-lg font-bold">${totalPrizeMoney.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Prize Money</p>
              </div>
              
              <div className="text-center p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg">
                <Users className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <p className="text-lg font-bold">{userHistory.length}</p>
                <p className="text-sm text-muted-foreground">Tournaments</p>
              </div>
              
              <div className="text-center p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
                <Target className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                <p className="text-lg font-bold">{avgPlacement.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Avg Placement</p>
              </div>
              
              <div className="text-center p-3 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                <p className="text-lg font-bold">
                  {currentUser ? `#${currentUser.rank}` : '--'}
                </p>
                <p className="text-sm text-muted-foreground">Global Rank</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">Tournament History</TabsTrigger>
          <TabsTrigger value="rankings">Global Rankings</TabsTrigger>
        </TabsList>

        {/* Tournament History Tab */}
        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Tournament History</h3>
            <div className="flex items-center gap-2">
              <Select value={selectedGame} onValueChange={setSelectedGame}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Games</SelectItem>
                  <SelectItem value="valorant">Valorant</SelectItem>
                  <SelectItem value="csgo">CS:GO</SelectItem>
                  <SelectItem value="fortnite">Fortnite</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 3 Months</SelectItem>
                  <SelectItem value="1y">Last Year</SelectItem>
                </SelectContent>
              </Select>
              
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }, (_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-secondary rounded w-3/4" />
                      <div className="h-3 bg-secondary rounded w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : userHistory.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-semibold mb-2">No tournament history</p>
                <p className="text-muted-foreground mb-4">
                  Start participating in tournaments to build your competitive history
                </p>
                <Link href="/tournaments">
                  <Button>
                    Find Tournaments
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {userHistory.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col items-center">
                            {getPlacementIcon(entry.placement)}
                            <Badge variant="outline" className="mt-1">
                              #{entry.placement}
                            </Badge>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <img 
                              src={entry.game.cover_url || '/placeholder-game.png'} 
                              alt={entry.game.name}
                              className="w-12 h-12 rounded object-cover"
                            />
                            
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">{entry.tournament_name}</h4>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <Gamepad2 className="h-3 w-3" />
                                  {entry.game.name}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(entry.date_completed).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {entry.total_participants} players
                                </span>
                                <span className="capitalize">
                                  {entry.tournament_format} • {entry.bracket_type.replace('_', ' ')}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2 mt-2">
                                <Badge 
                                  className={`${getPlacementColor(entry.placement)}`}
                                  variant="outline"
                                >
                                  {entry.placement === 1 ? '🥇 Champion' :
                                   entry.placement === 2 ? '🥈 Runner-up' :
                                   entry.placement === 3 ? '🥉 3rd Place' :
                                   `${entry.placement}th Place`}
                                </Badge>
                                
                                {entry.prize_won > 0 && (
                                  <Badge className="bg-green-500/20 text-green-700 dark:text-green-300">
                                    +${entry.prize_won.toLocaleString()}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={entry.organizer.avatar_url} />
                              <AvatarFallback>
                                {entry.organizer.name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span>by {entry.organizer.name}</span>
                          </div>
                          
                          <Link href={`/tournaments/${entry.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Global Rankings Tab */}
        <TabsContent value="rankings" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Global Tournament Rankings</h3>
            <div className="flex items-center gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Games</SelectItem>
                  <SelectItem value="valorant">Valorant</SelectItem>
                  <SelectItem value="csgo">CS:GO</SelectItem>
                  <SelectItem value="fortnite">Fortnite</SelectItem>
                </SelectContent>
              </Select>
              
              <Select defaultValue="points">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="points">Tournament Points</SelectItem>
                  <SelectItem value="winnings">Prize Money</SelectItem>
                  <SelectItem value="winrate">Win Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Current User Ranking */}
          {currentUser && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="text-sm">Your Ranking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold text-primary">
                      #{currentUser.rank}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={currentUser.avatar_url} />
                      <AvatarFallback>
                        {currentUser.username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{currentUser.display_name}</p>
                      <p className="text-sm text-muted-foreground">
                        @{currentUser.username}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Points</p>
                      <p className="font-bold">{currentUser.tournament_points.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tournaments</p>
                      <p className="font-bold">{currentUser.tournaments_played}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Wins</p>
                      <p className="font-bold">{currentUser.tournaments_won}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Win Rate</p>
                      <p className="font-bold">{currentUser.win_rate.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Rankings */}
          <div className="space-y-2">
            {globalRankings.slice(0, 50).map((ranking, index) => (
              <motion.div
                key={ranking.user_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <Card className={`hover:shadow-md transition-shadow ${
                  ranking.user_id === targetUserId ? 'border-primary' : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 text-center ${
                          ranking.rank <= 3 ? 'text-lg font-bold' : ''
                        }`}>
                          {ranking.rank <= 3 ? (
                            ranking.rank === 1 ? '🥇' :
                            ranking.rank === 2 ? '🥈' : '🥉'
                          ) : (
                            `#${ranking.rank}`
                          )}
                        </div>
                        
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={ranking.avatar_url} />
                          <AvatarFallback>
                            {ranking.username[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <p className="font-semibold">{ranking.display_name}</p>
                          <p className="text-sm text-muted-foreground">
                            @{ranking.username}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1 ml-2">
                          {ranking.recent_form.slice(-3).map((placement, i) => (
                            <div 
                              key={i}
                              className={`w-6 h-6 rounded text-xs flex items-center justify-center text-white ${
                                placement <= 3 ? 'bg-green-500' :
                                placement <= 10 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                            >
                              {placement}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-8 text-sm">
                        <div className="text-center">
                          <p className="font-bold text-blue-500">
                            {ranking.tournament_points.toLocaleString()}
                          </p>
                          <p className="text-muted-foreground">Points</p>
                        </div>
                        
                        <div className="text-center">
                          <p className="font-bold">
                            {ranking.tournaments_won}/{ranking.tournaments_played}
                          </p>
                          <p className="text-muted-foreground">W/T</p>
                        </div>
                        
                        <div className="text-center">
                          <p className="font-bold text-green-500">
                            ${ranking.total_prize_money.toLocaleString()}
                          </p>
                          <p className="text-muted-foreground">Earned</p>
                        </div>
                        
                        <div className="text-center">
                          <p className="font-bold">
                            {ranking.win_rate.toFixed(1)}%
                          </p>
                          <p className="text-muted-foreground">Win Rate</p>
                        </div>
                        
                        <Badge variant="outline">
                          Score: {calculatePerformanceScore(ranking)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
