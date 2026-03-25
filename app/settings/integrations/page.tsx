"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Gamepad2, 
  Link, 
  Unlink, 
  RefreshCw, 
  Shield, 
  AlertTriangle,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Trophy,
  BarChart3,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { gameAPIManager, GameStats } from '@/lib/gaming/game-api-manager';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface ConnectedAccount {
  platform: string;
  platform_user_id: string;
  platform_username: string;
  profile_data: any;
  connected_at: string;
  last_sync: string;
  is_active: boolean;
}

const PLATFORMS = [
  {
    id: 'steam',
    name: 'Steam',
    icon: '🎮',
    color: 'bg-blue-500',
    description: 'Connect your Steam account to import games, achievements, and playtime',
    features: ['Game Library', 'Achievements', 'Playtime Tracking', 'Friend Lists'],
    authUrl: 'https://steamcommunity.com/openid/login'
  },
  {
    id: 'epic',
    name: 'Epic Games',
    icon: '🎯',
    color: 'bg-gray-800',
    description: 'Import your Epic Games Store library and achievements',
    features: ['Game Library', 'Achievements', 'Purchase History'],
    authUrl: 'https://www.epicgames.com/id/authorize'
  },
  {
    id: 'xbox',
    name: 'Xbox Live',
    icon: '🎮',
    color: 'bg-green-500',
    description: 'Connect Xbox Live for gamertag, achievements, and game stats',
    features: ['Gamertag', 'Xbox Achievements', 'Game Pass', 'Friends'],
    authUrl: 'https://login.live.com/oauth20_authorize.srf'
  },
  {
    id: 'playstation',
    name: 'PlayStation',
    icon: '🎮',
    color: 'bg-blue-600',
    description: 'Import PlayStation trophies and game data',
    features: ['PSN Profile', 'Trophies', 'Game Library', 'Friends'],
    comingSoon: true
  }
];

export default function IntegrationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [gameStats, setGameStats] = useState<GameStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  
  // Connection dialogs
  const [showSteamDialog, setShowSteamDialog] = useState(false);
  const [steamId, setSteamId] = useState('');
  const [showEpicDialog, setShowEpicDialog] = useState(false);
  const [showXboxDialog, setShowXboxDialog] = useState(false);
  const [xboxGamertag, setXboxGamertag] = useState('');
  
  // Settings
  const [autoSync, setAutoSync] = useState(true);
  const [syncFrequency, setSyncFrequency] = useState('daily');
  const [shareStats, setShareStats] = useState(true);

  useEffect(() => {
    if (user) {
      loadConnectedAccounts();
      loadGameStats();
    }
  }, [user]);

  const loadConnectedAccounts = async () => {
    try {
      const accounts = await gameAPIManager.getConnectedAccounts(user!.id);
      setConnectedAccounts(accounts);
    } catch (error) {
      console.error('Error loading connected accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGameStats = async () => {
    try {
      const stats = await gameAPIManager.getUserGameStats(user!.id);
      setGameStats(stats);
    } catch (error) {
      console.error('Error loading game stats:', error);
    }
  };

  const connectSteam = async () => {
    if (!steamId.trim()) {
      toast({
        title: "Steam ID required",
        description: "Please enter your Steam ID or profile URL.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSyncing('steam');
      
      // Extract Steam ID from URL if needed
      let cleanSteamId = steamId;
      if (steamId.includes('steamcommunity.com')) {
        // Extract from URL - simplified version
        const match = steamId.match(/\/id\/([^\/]+)/);
        if (match) {
          cleanSteamId = match[1];
        }
      }

      const success = await gameAPIManager.connectSteamAccount(user!.id, cleanSteamId);
      
      if (success) {
        toast({
          title: "Steam Connected!",
          description: "Your Steam account has been connected successfully.",
        });
        setShowSteamDialog(false);
        setSteamId('');
        await loadConnectedAccounts();
        await loadGameStats();
      } else {
        toast({
          title: "Connection Failed",
          description: "Unable to connect Steam account. Please check your Steam ID.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error connecting Steam:', error);
      toast({
        title: "Connection Error",
        description: "An error occurred while connecting your Steam account.",
        variant: "destructive"
      });
    } finally {
      setSyncing(null);
    }
  };

  const connectEpic = async () => {
    try {
      // Redirect to Epic Games OAuth
      const clientId = process.env.NEXT_PUBLIC_EPIC_CLIENT_ID;
      const redirectUri = encodeURIComponent(`${window.location.origin}/settings/integrations/epic/callback`);
      const authUrl = `https://www.epicgames.com/id/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=basic_profile`;
      
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error connecting Epic Games:', error);
      toast({
        title: "Connection Error",
        description: "Unable to connect Epic Games account.",
        variant: "destructive"
      });
    }
  };

  const connectXbox = async () => {
    if (!xboxGamertag.trim()) {
      toast({
        title: "Gamertag required",
        description: "Please enter your Xbox gamertag.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSyncing('xbox');
      
      const success = await gameAPIManager.connectXboxAccount(
        user!.id,
        `xbox_${xboxGamertag}`, // Simplified ID generation
        xboxGamertag
      );
      
      if (success) {
        toast({
          title: "Xbox Connected!",
          description: "Your Xbox Live account has been connected successfully.",
        });
        setShowXboxDialog(false);
        setXboxGamertag('');
        await loadConnectedAccounts();
      } else {
        toast({
          title: "Connection Failed",
          description: "Unable to connect Xbox Live account.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error connecting Xbox:', error);
      toast({
        title: "Connection Error",
        description: "An error occurred while connecting your Xbox account.",
        variant: "destructive"
      });
    } finally {
      setSyncing(null);
    }
  };

  const disconnectAccount = async (platform: string) => {
    try {
      const success = await gameAPIManager.disconnectAccount(user!.id, platform);
      
      if (success) {
        toast({
          title: "Account Disconnected",
          description: `Your ${platform} account has been disconnected.`,
        });
        await loadConnectedAccounts();
      } else {
        toast({
          title: "Disconnection Failed",
          description: "Unable to disconnect account.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error disconnecting account:', error);
      toast({
        title: "Disconnection Error",
        description: "An error occurred while disconnecting your account.",
        variant: "destructive"
      });
    }
  };

  const syncAccount = async (platform: string) => {
    try {
      setSyncing(platform);
      
      await gameAPIManager.syncAllUserData(user!.id);
      
      toast({
        title: "Sync Complete",
        description: `Your ${platform} data has been synchronized.`,
      });
      
      await loadGameStats();
    } catch (error) {
      console.error('Error syncing account:', error);
      toast({
        title: "Sync Failed",
        description: "Unable to sync account data.",
        variant: "destructive"
      });
    } finally {
      setSyncing(null);
    }
  };

  const isConnected = (platform: string) => {
    return connectedAccounts.some(acc => acc.platform === platform && acc.is_active);
  };

  const getConnectedAccount = (platform: string) => {
    return connectedAccounts.find(acc => acc.platform === platform && acc.is_active);
  };

  const formatLastSync = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getTotalStats = () => {
    const totalGames = gameStats.length;
    const totalPlaytime = gameStats.reduce((sum, stat) => sum + (stat.total_playtime || 0), 0);
    const totalAchievements = gameStats.reduce((sum, stat) => sum + (stat.achievements_unlocked || 0), 0);
    
    return {
      totalGames,
      totalPlaytime: Math.floor(totalPlaytime / 60), // Convert to hours
      totalAchievements
    };
  };

  const stats = getTotalStats();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Game Integrations</h1>
        <p className="text-muted-foreground">
          Connect your gaming accounts to automatically import stats, achievements, and game libraries
        </p>
      </div>

      <Tabs defaultValue="accounts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="accounts">Connected Accounts</TabsTrigger>
          <TabsTrigger value="stats">Game Statistics</TabsTrigger>
          <TabsTrigger value="settings">Sync Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts">
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <Gamepad2 className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <div className="text-2xl font-bold">{stats.totalGames}</div>
                  <div className="text-sm text-muted-foreground">Connected Games</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="h-8 w-8 mx-auto mb-3 text-blue-500" />
                  <div className="text-2xl font-bold">{stats.totalPlaytime}h</div>
                  <div className="text-sm text-muted-foreground">Total Playtime</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Trophy className="h-8 w-8 mx-auto mb-3 text-yellow-500" />
                  <div className="text-2xl font-bold">{stats.totalAchievements}</div>
                  <div className="text-sm text-muted-foreground">Achievements</div>
                </CardContent>
              </Card>
            </div>

            {/* Platform Connections */}
            <div className="grid gap-6">
              {PLATFORMS.map((platform) => {
                const connected = isConnected(platform.id);
                const account = getConnectedAccount(platform.id);
                const isSyncing = syncing === platform.id;

                return (
                  <Card key={platform.id} className={cn("relative", platform.comingSoon && "opacity-60")}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center text-2xl", platform.color)}>
                            {platform.icon}
                          </div>
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {platform.name}
                              {connected && <CheckCircle className="h-5 w-5 text-green-500" />}
                              {platform.comingSoon && <Badge variant="outline">Coming Soon</Badge>}
                            </CardTitle>
                            <CardDescription>{platform.description}</CardDescription>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {connected ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => syncAccount(platform.id)}
                                disabled={isSyncing || platform.comingSoon}
                              >
                                {isSyncing ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                                    Syncing...
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Sync
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => disconnectAccount(platform.id)}
                                disabled={isSyncing}
                              >
                                <Unlink className="h-4 w-4 mr-2" />
                                Disconnect
                              </Button>
                            </>
                          ) : (
                            <div className="flex gap-2">
                              {platform.id === 'steam' && (
                                <Dialog open={showSteamDialog} onOpenChange={setShowSteamDialog}>
                                  <DialogTrigger asChild>
                                    <Button disabled={platform.comingSoon}>
                                      <Link className="h-4 w-4 mr-2" />
                                      Connect
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Connect Steam Account</DialogTitle>
                                      <DialogDescription>
                                        Enter your Steam ID or profile URL to connect your account
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label htmlFor="steamId">Steam ID / Profile URL</Label>
                                        <Input
                                          id="steamId"
                                          value={steamId}
                                          onChange={(e) => setSteamId(e.target.value)}
                                          placeholder="76561198000000000 or https://steamcommunity.com/id/username"
                                        />
                                      </div>
                                      <Alert>
                                        <Shield className="h-4 w-4" />
                                        <AlertDescription>
                                          Your Steam profile must be public to import data.
                                        </AlertDescription>
                                      </Alert>
                                      <div className="flex justify-end gap-2">
                                        <Button variant="outline" onClick={() => setShowSteamDialog(false)}>
                                          Cancel
                                        </Button>
                                        <Button onClick={connectSteam} disabled={!steamId.trim()}>
                                          Connect Steam
                                        </Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                              
                              {platform.id === 'epic' && (
                                <Button onClick={connectEpic} disabled={platform.comingSoon}>
                                  <Link className="h-4 w-4 mr-2" />
                                  Connect
                                </Button>
                              )}
                              
                              {platform.id === 'xbox' && (
                                <Dialog open={showXboxDialog} onOpenChange={setShowXboxDialog}>
                                  <DialogTrigger asChild>
                                    <Button disabled={platform.comingSoon}>
                                      <Link className="h-4 w-4 mr-2" />
                                      Connect
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Connect Xbox Live</DialogTitle>
                                      <DialogDescription>
                                        Enter your Xbox gamertag to connect your account
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label htmlFor="gamertag">Xbox Gamertag</Label>
                                        <Input
                                          id="gamertag"
                                          value={xboxGamertag}
                                          onChange={(e) => setXboxGamertag(e.target.value)}
                                          placeholder="YourGamertag"
                                        />
                                      </div>
                                      <div className="flex justify-end gap-2">
                                        <Button variant="outline" onClick={() => setShowXboxDialog(false)}>
                                          Cancel
                                        </Button>
                                        <Button onClick={connectXbox} disabled={!xboxGamertag.trim()}>
                                          Connect Xbox
                                        </Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    {connected && account && (
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Connected as:</span>
                            <span className="font-medium">{account.platform_username}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Last sync:</span>
                            <span>{account.last_sync ? formatLastSync(account.last_sync) : 'Never'}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Connected on:</span>
                            <span>{formatLastSync(account.connected_at)}</span>
                          </div>
                        </div>
                        
                        <Separator className="my-4" />
                        
                        <div>
                          <div className="text-sm font-medium mb-2">Available Features:</div>
                          <div className="flex flex-wrap gap-2">
                            {platform.features.map((feature) => (
                              <Badge key={feature} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="stats">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Game Statistics Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {gameStats.length > 0 ? (
                  <div className="space-y-4">
                    {gameStats.slice(0, 10).map((stat) => (
                      <div key={stat.game_id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={(stat as any).game?.cover_url} />
                            <AvatarFallback>
                              <Gamepad2 className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{(stat as any).game?.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {Math.floor((stat.total_playtime || 0) / 60)}h played
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right text-sm">
                          <div className="font-medium">
                            {stat.achievements_unlocked || 0}/{stat.total_achievements || 0} achievements
                          </div>
                          <div className="text-muted-foreground">
                            {stat.win_rate ? `${stat.win_rate.toFixed(1)}% win rate` : 'No matches recorded'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Gamepad2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Game Data</h3>
                    <p className="text-muted-foreground">
                      Connect your gaming accounts to see detailed statistics
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sync Settings</CardTitle>
                <CardDescription>
                  Configure how your gaming data is synchronized and shared
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-sync" className="text-base">Auto-sync</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically sync your gaming data in the background
                    </p>
                  </div>
                  <Switch
                    id="auto-sync"
                    checked={autoSync}
                    onCheckedChange={setAutoSync}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="share-stats" className="text-base">Share Statistics</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow others to see your gaming statistics and achievements
                    </p>
                  </div>
                  <Switch
                    id="share-stats"
                    checked={shareStats}
                    onCheckedChange={setShareStats}
                  />
                </div>

                <Separator />

                <div>
                  <Label className="text-base">Sync Frequency</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    How often should we sync your gaming data?
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {['hourly', 'daily', 'weekly'].map((freq) => (
                      <Button
                        key={freq}
                        variant={syncFrequency === freq ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSyncFrequency(freq)}
                      >
                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <Alert>
                  <Zap className="h-4 w-4" />
                  <AlertDescription>
                    More frequent syncing provides up-to-date stats but may impact API rate limits on some platforms.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
