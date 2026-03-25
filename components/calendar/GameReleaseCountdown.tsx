"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  Calendar, 
  Clock, 
  Download, 
  ExternalLink,
  Bell,
  BellRing,
  Play,
  Gamepad2,
  Users,
  TrendingUp,
  Heart,
  Share,
  Steam,
  Monitor
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { gamingCalendarManager, GameRelease } from '@/lib/calendar/gaming-calendar-manager';

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface GameReleaseCountdownProps {
  gameId?: string;
  compact?: boolean;
  showWishlist?: boolean;
}

export default function GameReleaseCountdown({ 
  gameId, 
  compact = false, 
  showWishlist = true 
}: GameReleaseCountdownProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [upcomingReleases, setUpcomingReleases] = useState<GameRelease[]>([]);
  const [selectedRelease, setSelectedRelease] = useState<GameRelease | null>(null);
  const [countdowns, setCountdowns] = useState<Map<string, CountdownTime>>(new Map());
  const [wishlistedGames, setWishlistedGames] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [notificationSettings, setNotificationSettings] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    loadUpcomingReleases();
    loadUserWishlist();
  }, [gameId]);

  useEffect(() => {
    // Update countdowns every second
    const interval = setInterval(updateCountdowns, 1000);
    return () => clearInterval(interval);
  }, [upcomingReleases]);

  const loadUpcomingReleases = async () => {
    setLoading(true);
    try {
      const releases = await gamingCalendarManager.getGameReleases(true);
      
      // Filter by specific game if provided
      const filteredReleases = gameId 
        ? releases.filter(r => r.id === gameId)
        : releases.slice(0, 10); // Show top 10 upcoming releases
      
      setUpcomingReleases(filteredReleases);
      
      // Set first release as selected if none specified
      if (filteredReleases.length > 0 && !selectedRelease) {
        setSelectedRelease(filteredReleases[0]);
      }
    } catch (error) {
      console.error('Error loading upcoming releases:', error);
      toast({
        title: "Error loading game releases",
        description: "Failed to load upcoming game releases.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserWishlist = async () => {
    // Mock implementation - would integrate with user preferences
    const mockWishlist = new Set(['game_1', 'game_2', 'game_3']);
    setWishlistedGames(mockWishlist);
  };

  const updateCountdowns = () => {
    const newCountdowns = new Map<string, CountdownTime>();
    
    upcomingReleases.forEach(release => {
      const now = new Date().getTime();
      const releaseTime = new Date(release.release_date).getTime();
      const difference = releaseTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        newCountdowns.set(release.id, { days, hours, minutes, seconds });
      }
    });

    setCountdowns(newCountdowns);
  };

  const toggleWishlist = async (releaseId: string) => {
    const newWishlist = new Set(wishlistedGames);
    
    if (wishlistedGames.has(releaseId)) {
      newWishlist.delete(releaseId);
      toast({
        title: "Removed from wishlist",
        description: "Game removed from your wishlist.",
      });
    } else {
      newWishlist.add(releaseId);
      toast({
        title: "Added to wishlist",
        description: "Game added to your wishlist with notifications enabled.",
      });
    }
    
    setWishlistedGames(newWishlist);
  };

  const toggleNotifications = (releaseId: string) => {
    const newSettings = new Map(notificationSettings);
    newSettings.set(releaseId, !notificationSettings.get(releaseId));
    setNotificationSettings(newSettings);
    
    toast({
      title: notificationSettings.get(releaseId) ? "Notifications disabled" : "Notifications enabled",
      description: `Release notifications ${notificationSettings.get(releaseId) ? 'disabled' : 'enabled'} for this game.`,
    });
  };

  const getHypeColor = (hypeLevel: number) => {
    if (hypeLevel >= 80) return 'text-red-500';
    if (hypeLevel >= 60) return 'text-orange-500';
    if (hypeLevel >= 40) return 'text-yellow-500';
    return 'text-blue-500';
  };

  const getHypeLabel = (hypeLevel: number) => {
    if (hypeLevel >= 90) return 'Extremely Hyped';
    if (hypeLevel >= 75) return 'Very Hyped';
    if (hypeLevel >= 50) return 'Hyped';
    if (hypeLevel >= 25) return 'Some Interest';
    return 'Low Interest';
  };

  const formatCountdown = (countdown: CountdownTime) => {
    if (countdown.days > 0) {
      return `${countdown.days}d ${countdown.hours}h ${countdown.minutes}m`;
    } else if (countdown.hours > 0) {
      return `${countdown.hours}h ${countdown.minutes}m ${countdown.seconds}s`;
    } else {
      return `${countdown.minutes}m ${countdown.seconds}s`;
    }
  };

  const renderCompactView = () => (
    <Card>
      <CardContent className="p-4">
        {upcomingReleases.slice(0, 3).map((release, index) => {
          const countdown = countdowns.get(release.id);
          const isWishlisted = wishlistedGames.has(release.id);
          
          return (
            <motion.div
              key={release.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/20 transition-colors ${
                index < upcomingReleases.length - 1 ? 'border-b' : ''
              }`}
            >
              <img 
                src={release.cover_image || '/placeholder-game.png'} 
                alt={release.game_name}
                className="w-12 h-12 rounded object-cover"
              />
              
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold truncate">{release.game_name}</h4>
                <p className="text-sm text-muted-foreground">{release.developer}</p>
                {countdown && (
                  <p className="text-sm font-mono text-primary">
                    {formatCountdown(countdown)}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Badge className={getHypeColor(release.hype_level)}>
                  {release.hype_level}%
                </Badge>
                
                {showWishlist && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleWishlist(release.id)}
                  >
                    <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current text-red-500' : ''}`} />
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );

  if (compact) {
    return renderCompactView();
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading upcoming releases...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Upcoming Game Releases
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Release List */}
        <div className="lg:col-span-1 space-y-4">
          {upcomingReleases.map((release, index) => {
            const countdown = countdowns.get(release.id);
            const isSelected = selectedRelease?.id === release.id;
            const isWishlisted = wishlistedGames.has(release.id);
            
            return (
              <motion.div
                key={release.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    isSelected ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedRelease(release)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <img 
                        src={release.cover_image || '/placeholder-game.png'} 
                        alt={release.game_name}
                        className="w-16 h-16 rounded object-cover"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{release.game_name}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{release.developer}</p>
                        
                        {countdown && (
                          <div className="text-sm font-mono text-primary mb-2">
                            {formatCountdown(countdown)}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={getHypeColor(release.hype_level)}>
                              {release.hype_level}%
                            </Badge>
                            
                            <div className="flex gap-1">
                              {release.platforms.slice(0, 3).map((platform) => (
                                <Badge key={platform} variant="outline" className="text-xs">
                                  {platform}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          {showWishlist && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleWishlist(release.id);
                              }}
                            >
                              <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current text-red-500' : ''}`} />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
          
          {upcomingReleases.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-semibold mb-2">No upcoming releases</p>
                <p className="text-muted-foreground">
                  Check back later for new game announcements
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Selected Release Details */}
        {selectedRelease && (
          <motion.div
            key={selectedRelease.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            <Card className="overflow-hidden">
              <div className="relative h-64 bg-gradient-to-r from-gaming-purple/20 to-gaming-pink/20">
                <img 
                  src={selectedRelease.cover_image || '/placeholder-game.png'} 
                  alt={selectedRelease.game_name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                <div className="absolute bottom-6 left-6 right-6">
                  <h2 className="text-3xl font-bold text-white mb-2">{selectedRelease.game_name}</h2>
                  <p className="text-white/90">by {selectedRelease.developer}</p>
                </div>
                
                <div className="absolute top-4 right-4 flex gap-2">
                  <Badge className={`${getHypeColor(selectedRelease.hype_level)} bg-black/50`}>
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {getHypeLabel(selectedRelease.hype_level)}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-6 space-y-6">
                {/* Countdown Timer */}
                {countdowns.get(selectedRelease.id) && (
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-4">Time Until Release</h3>
                    <div className="grid grid-cols-4 gap-4">
                      {['days', 'hours', 'minutes', 'seconds'].map((unit, index) => {
                        const countdown = countdowns.get(selectedRelease.id)!;
                        const value = countdown[unit as keyof CountdownTime];
                        
                        return (
                          <motion.div
                            key={unit}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="text-center p-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg"
                          >
                            <div className="text-2xl font-bold text-primary">
                              {value.toString().padStart(2, '0')}
                            </div>
                            <div className="text-sm text-muted-foreground capitalize">
                              {unit}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Release Information */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Release Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Release Date:</span>
                        <span>{new Date(selectedRelease.release_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Publisher:</span>
                        <span>{selectedRelease.publisher}</span>
                      </div>
                      {selectedRelease.price && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Price:</span>
                          <span>${selectedRelease.price}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pre-order:</span>
                        <span>{selectedRelease.pre_order_available ? 'Available' : 'Not Available'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Platforms & Genres</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Platforms:</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedRelease.platforms.map((platform) => (
                            <Badge key={platform} variant="outline" className="text-xs">
                              {platform}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Genres:</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedRelease.genres.map((genre) => (
                            <Badge key={genre} variant="secondary" className="text-xs">
                              {genre}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-semibold mb-3">About</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedRelease.description}
                  </p>
                </div>

                {/* Hype Meter */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Community Hype</h4>
                    <Badge className={getHypeColor(selectedRelease.hype_level)}>
                      {selectedRelease.hype_level}%
                    </Badge>
                  </div>
                  <Progress value={selectedRelease.hype_level} className="h-3" />
                  <p className="text-sm text-muted-foreground mt-1">
                    {getHypeLabel(selectedRelease.hype_level)} - Based on community interest
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4">
                  <Button 
                    onClick={() => toggleWishlist(selectedRelease.id)}
                    className={wishlistedGames.has(selectedRelease.id) ? "bg-red-500 hover:bg-red-600" : ""}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${wishlistedGames.has(selectedRelease.id) ? 'fill-current' : ''}`} />
                    {wishlistedGames.has(selectedRelease.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => toggleNotifications(selectedRelease.id)}
                  >
                    {notificationSettings.get(selectedRelease.id) ? (
                      <BellRing className="h-4 w-4 mr-2" />
                    ) : (
                      <Bell className="h-4 w-4 mr-2" />
                    )}
                    Notifications
                  </Button>
                  
                  <Button variant="outline">
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  
                  {selectedRelease.steam_id && (
                    <Button variant="outline" asChild>
                      <a 
                        href={`https://store.steampowered.com/app/${selectedRelease.steam_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Steam Page
                      </a>
                    </Button>
                  )}
                  
                  {selectedRelease.trailer_url && (
                    <Button variant="outline" asChild>
                      <a 
                        href={selectedRelease.trailer_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Trailer
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
