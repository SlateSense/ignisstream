"use client";

import { useState, useEffect } from "react";
import { Trophy, Medal, Crown, Star, Users, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LeaderboardPlayer {
  id: number;
  rank: number;
  username: string;
  displayName: string;
  score: number;
  kdr: string;
  accuracy: number;
  skillRating: number;
  trend: 'up' | 'down' | 'stable';
}

export default function LeaderboardsPage() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate mock leaderboard data
    const mockData: LeaderboardPlayer[] = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      rank: i + 1,
      username: `Player${i + 1}`,
      displayName: `Pro Gamer ${i + 1}`,
      score: 2500 - (i * 25),
      kdr: (1.8 - (i * 0.02)).toFixed(2),
      accuracy: Math.floor(75 - (i * 0.5)),
      skillRating: 2500 - (i * 25),
      trend: (['up', 'down', 'stable'] as const)[Math.floor(Math.random() * 3)]
    }));
    
    setLeaderboardData(mockData);
    setLoading(false);
  }, []);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Trophy className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-bold">#{rank}</span>;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <div className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-gaming-purple/20 via-gaming-pink/20 to-gaming-blue/20 pb-8">
        <div className="container mx-auto px-4 pt-20">
          <div className="text-center">
            <h1 className="text-4xl font-gaming font-bold mb-4">
              <span className="bg-gradient-to-r from-gaming-purple to-gaming-pink bg-clip-text text-transparent">
                Global Leaderboards
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              Compete with the best players worldwide
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex gap-4 mb-8">
          <Select defaultValue="all">
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Game" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Games</SelectItem>
              <SelectItem value="valorant">Valorant</SelectItem>
              <SelectItem value="lol">League of Legends</SelectItem>
            </SelectContent>
          </Select>
          
          <Select defaultValue="weekly">
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Top Players
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboardData.map((player) => (
                <div
                  key={player.id}
                  className={`p-4 rounded-lg border transition-all hover:shadow-lg ${
                    player.rank <= 3 
                      ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
                      : 'bg-card border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getRankIcon(player.rank)}
                        {getTrendIcon(player.trend)}
                      </div>
                      
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-r from-gaming-purple to-gaming-pink text-white">
                          {player.username[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <h3 className="font-semibold">{player.displayName}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{player.kdr} K/D</span>
                          <span>•</span>
                          <span>{player.accuracy}% Acc</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xl font-bold text-primary">
                        {player.score.toLocaleString()}
                      </div>
                      <Badge variant="secondary">{player.skillRating} SR</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
