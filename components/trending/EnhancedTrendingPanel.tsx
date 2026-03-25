"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Clock, 
  Fire, 
  Gamepad2, 
  Users, 
  Hash,
  Eye,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useTrending } from './TrendingProvider';
import { useHashtags } from '@/components/hashtags/HashtagProvider';

interface TrendingStats {
  totalViews: number;
  growthRate: number;
  peakHour: string;
  topContributor: any;
}

interface EnhancedTrendingPanelProps {
  showStats?: boolean;
  compact?: boolean;
  maxItems?: number;
}

export default function EnhancedTrendingPanel({ 
  showStats = true, 
  compact = false, 
  maxItems = 10 
}: EnhancedTrendingPanelProps) {
  const { trendingPosts, trendingGames, loading } = useTrending();
  const { trendingHashtags } = useHashtags();
  const [selectedTab, setSelectedTab] = useState('content');
  const [trendingStats, setTrendingStats] = useState<TrendingStats | null>(null);
  const [previousData, setPreviousData] = useState<any>({});

  useEffect(() => {
    // Calculate trending statistics
    if (trendingPosts.length > 0) {
      const totalViews = trendingPosts.reduce((sum, post) => sum + (post.views || 0), 0);
      const totalEngagement = trendingPosts.reduce((sum, post) => 
        sum + post.likes_count + post.comments_count, 0);
      
      // Find peak activity hour (mock calculation)
      const peakHour = "2:00 PM - 3:00 PM";
      
      // Find top contributor
      const contributors: Record<string, number> = {};
      trendingPosts.forEach(post => {
        const authorId = post.author.id;
        contributors[authorId] = (contributors[authorId] || 0) + post.trending_score;
      });
      
      const topContributorId = Object.entries(contributors)
        .sort(([,a], [,b]) => b - a)[0]?.[0];
      
      const topContributor = trendingPosts.find(post => 
        post.author.id === topContributorId)?.author;

      setTrendingStats({
        totalViews,
        growthRate: Math.random() * 40 + 10, // Mock growth rate
        peakHour,
        topContributor
      });
    }
  }, [trendingPosts]);

  const getTrendDirection = (current: number, previous: number) => {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'stable';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <Card className={compact ? 'h-64' : 'h-96'}>
        <CardContent className="p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={compact ? '' : 'h-fit'}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Fire className="h-5 w-5 text-orange-500" />
          Trending Now
          {showStats && trendingStats && (
            <Badge variant="secondary" className="ml-auto">
              +{trendingStats.growthRate.toFixed(1)}% today
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="w-full mx-4 mb-4">
            <TabsTrigger value="content" className="flex-1 text-xs">
              <TrendingUp className="mr-1 h-3 w-3" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="games" className="flex-1 text-xs">
              <Gamepad2 className="mr-1 h-3 w-3" />
              Games
            </TabsTrigger>
            <TabsTrigger value="hashtags" className="flex-1 text-xs">
              <Hash className="mr-1 h-3 w-3" />
              Tags
            </TabsTrigger>
          </TabsList>

          {/* Trending Stats Overview */}
          {showStats && trendingStats && !compact && (
            <div className="px-4 mb-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-center p-2 rounded-lg bg-secondary/50">
                  <p className="text-muted-foreground">Total Views</p>
                  <p className="font-semibold">{formatNumber(trendingStats.totalViews)}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-secondary/50">
                  <p className="text-muted-foreground">Peak Hours</p>
                  <p className="font-semibold text-xs">{trendingStats.peakHour}</p>
                </div>
              </div>
              
              {trendingStats.topContributor && (
                <div className="mt-3 p-2 rounded-lg bg-gradient-to-r from-gaming-purple/20 to-gaming-pink/20">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={trendingStats.topContributor.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {trendingStats.topContributor.username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        🔥 {trendingStats.topContributor.display_name}
                      </p>
                      <p className="text-xs text-muted-foreground">Top contributor today</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <TabsContent value="content" className="mt-0">
            <div className="px-4 pb-4 space-y-3 max-h-80 overflow-y-auto">
              {trendingPosts.slice(0, maxItems).map((post, index) => {
                const trendDirection = getTrendDirection(
                  post.trending_score, 
                  previousData[post.id] || 0
                );
                
                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group"
                  >
                    <Link href={`/post/${post.id}`}>
                      <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-medium text-muted-foreground">
                            #{index + 1}
                          </span>
                          {trendDirection === 'up' && <ArrowUp className="h-3 w-3 text-green-500" />}
                          {trendDirection === 'down' && <ArrowDown className="h-3 w-3 text-red-500" />}
                          {trendDirection === 'stable' && <Minus className="h-3 w-3 text-gray-500" />}
                        </div>
                        
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={post.author.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {post.author.username[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium truncate">
                              {post.author.display_name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {post.game?.name || 'General'}
                            </Badge>
                          </div>
                          
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {post.caption}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3 text-muted-foreground">
                              <span>❤️ {post.likes_count}</span>
                              <span>💬 {post.comments_count}</span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {formatNumber(post.velocity * 100)}
                              </span>
                            </div>
                            <Badge 
                              variant="secondary" 
                              className="bg-gradient-to-r from-orange-500/20 to-red-500/20"
                            >
                              🔥 {post.trending_score.toFixed(1)}
                            </Badge>
                          </div>
                          
                          {/* Trending Progress Bar */}
                          <div className="mt-2">
                            <Progress 
                              value={(post.trending_score / Math.max(...trendingPosts.map(p => p.trending_score))) * 100} 
                              className="h-1"
                            />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="games" className="mt-0">
            <div className="px-4 pb-4 space-y-3 max-h-80 overflow-y-auto">
              {trendingGames.slice(0, maxItems).map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={`/games/${game.id}`}>
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                      <span className="text-xs font-medium text-muted-foreground w-6">
                        #{index + 1}
                      </span>
                      
                      {game.cover_url && (
                        <img 
                          src={game.cover_url} 
                          alt={game.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium truncate">{game.name}</h4>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>{game.post_count} posts</span>
                          <span>{formatNumber(game.total_engagement)} engagement</span>
                        </div>
                      </div>
                      
                      <Badge className="bg-gradient-to-r from-gaming-purple/20 to-gaming-pink/20">
                        {game.trending_score?.toFixed(0) || 0}
                      </Badge>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="hashtags" className="mt-0">
            <div className="px-4 pb-4 space-y-3 max-h-80 overflow-y-auto">
              {trendingHashtags.slice(0, maxItems).map((hashtag, index) => (
                <motion.div
                  key={hashtag.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={`/search?q=%23${hashtag.name}`}>
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                      <span className="text-xs font-medium text-muted-foreground w-6">
                        #{index + 1}
                      </span>
                      
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-gaming-purple/20 to-gaming-pink/20">
                        <Hash className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium">#{hashtag.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {hashtag.usage_count} uses • {hashtag.recent_usage || 0} today
                        </p>
                      </div>
                      
                      <Badge variant="secondary">
                        {hashtag.trending_score?.toFixed(0) || 0}
                      </Badge>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
