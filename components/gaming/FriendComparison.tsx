'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Trophy, 
  Target, 
  Clock, 
  Zap,
  Users,
  BookOpen,
  Medal,
  Star,
  ArrowRight
} from 'lucide-react';
import { FriendComparison as FriendComparisonType } from '@/lib/gaming/game-api-manager';

interface FriendComparisonProps {
  comparison: FriendComparisonType;
  onInviteToTeam?: () => void;
  onSendChallenge?: () => void;
}

export function FriendComparison({ 
  comparison, 
  onInviteToTeam, 
  onSendChallenge 
}: FriendComparisonProps) {
  const [selectedGame, setSelectedGame] = useState(0);

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'invite_to_team': return <Users className="h-4 w-4" />;
      case 'practice_together': return <Target className="h-4 w-4" />;
      case 'learn_from_friend': return <BookOpen className="h-4 w-4" />;
      case 'mentor_friend': return <Medal className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'invite_to_team': return 'bg-green-500';
      case 'practice_together': return 'bg-blue-500';
      case 'learn_from_friend': return 'bg-purple-500';
      case 'mentor_friend': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const formatRecommendation = (recommendation: string) => {
    return recommendation.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getDifferenceIcon = (value: number) => {
    if (value > 5) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (value < -5) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const formatPlaytime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    return hours > 0 ? `${hours}h` : `${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Friend Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={comparison.friend.avatarUrl} />
                <AvatarFallback className="text-lg">
                  {comparison.friend.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">{comparison.friend.username}</CardTitle>
                <p className="text-muted-foreground">
                  {comparison.overallComparison.totalGamesInCommon} games in common
                </p>
              </div>
            </div>
            
            <div className="text-right space-y-2">
              <Badge 
                variant="secondary"
                className={`${getRecommendationColor(comparison.overallComparison.recommendation)} text-white`}
              >
                <div className="flex items-center gap-1">
                  {getRecommendationIcon(comparison.overallComparison.recommendation)}
                  {formatRecommendation(comparison.overallComparison.recommendation)}
                </div>
              </Badge>
              <div className="text-sm text-muted-foreground">
                Avg Skill: {comparison.overallComparison.friendAverageSkill.toFixed(1)}%
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Overall Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Overall Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {comparison.overallComparison.myAverageSkill.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Your Avg Skill</div>
            </div>
            
            <div className="flex items-center justify-center">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>
            
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {comparison.overallComparison.friendAverageSkill.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Friend&apos;s Avg Skill</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game-by-Game Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Game Comparisons</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="0" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              {comparison.games.slice(0, 3).map((game, index) => (
                <TabsTrigger key={index} value={index.toString()}>
                  {game.gameName}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {comparison.games.slice(0, 3).map((game, index) => (
              <TabsContent key={index} value={index.toString()} className="space-y-4">
                <div className="text-lg font-semibold">{game.gameName}</div>
                
                {/* Stats Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <h4 className="font-medium text-blue-600">Your Stats</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Win Rate</span>
                        <span className="font-medium">{game.myStats.win_rate?.toFixed(1) || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">K/D Ratio</span>
                        <span className="font-medium">{game.myStats.kd_ratio?.toFixed(2) || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Playtime</span>
                        <span className="font-medium">{formatPlaytime(game.myStats.total_playtime || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Matches</span>
                        <span className="font-medium">{game.myStats.matches_played || 0}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium text-purple-600">Friend&apos;s Stats</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Win Rate</span>
                        <span className="font-medium">{game.friendStats.win_rate?.toFixed(1) || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">K/D Ratio</span>
                        <span className="font-medium">{game.friendStats.kd_ratio?.toFixed(2) || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Playtime</span>
                        <span className="font-medium">{formatPlaytime(game.friendStats.total_playtime || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Matches</span>
                        <span className="font-medium">{game.friendStats.matches_played || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Differences */}
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium">Performance Analysis</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      {getDifferenceIcon(game.comparison.skillDifference)}
                      <span>Skill Diff: {game.comparison.skillDifference > 0 ? '+' : ''}{game.comparison.skillDifference.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Playtime Diff: {formatPlaytime(Math.abs(game.comparison.playtimeDifference))}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getDifferenceIcon(game.comparison.winRateDifference)}
                      <span>Win Rate Diff: {game.comparison.winRateDifference > 0 ? '+' : ''}{game.comparison.winRateDifference.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                {/* Stronger Areas */}
                {game.comparison.strongerAreas.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-green-600">Your Stronger Areas</h4>
                    <div className="flex flex-wrap gap-2">
                      {game.comparison.strongerAreas.map((area) => (
                        <Badge key={area} variant="secondary" className="bg-green-100 text-green-700">
                          <Zap className="h-3 w-3 mr-1" />
                          {area.replace('_', ' ').toLowerCase()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Improvement Suggestions */}
                {game.comparison.improvementSuggestions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-orange-600">Improvement Suggestions</h4>
                    <div className="space-y-1">
                      {game.comparison.improvementSuggestions.map((suggestion, idx) => (
                        <div key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                          <Target className="h-3 w-3" />
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={onInviteToTeam} className="flex-1">
          <Users className="h-4 w-4 mr-2" />
          Invite to Team
        </Button>
        <Button variant="outline" onClick={onSendChallenge} className="flex-1">
          <Target className="h-4 w-4 mr-2" />
          Send Challenge
        </Button>
      </div>
    </div>
  );
}
