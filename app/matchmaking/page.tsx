"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Gamepad2, 
  Search,
  Settings,
  MapPin,
  Clock,
  Star,
  Shield,
  Zap,
  Play,
  MessageCircle,
  UserPlus,
  Filter,
  RefreshCw,
  Target,
  Trophy
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import AuthNavbar from "@/components/layout/AuthNavbar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface MatchmakingPlayer {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  skill_rating: number;
  rank: string;
  location: string;
  game: string;
  playstyle: string[];
  availability: 'online' | 'busy' | 'away';
  languages: string[];
  preferred_roles: string[];
  recent_achievements: string[];
  compatibility_score: number;
}

interface MatchmakingSession {
  id: string;
  game: string;
  mode: string;
  skill_range: [number, number];
  location_filter: string;
  max_players: number;
  current_players: number;
  estimated_wait: string;
  status: 'searching' | 'found' | 'joining';
}

export default function MatchmakingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("quick-match");
  const [players, setPlayers] = useState<MatchmakingPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<MatchmakingSession | null>(null);
  const [searchProgress, setSearchProgress] = useState(0);
  
  // Filters
  const [selectedGame, setSelectedGame] = useState("valorant");
  const [skillRange, setSkillRange] = useState([1500, 2500]);
  const [locationFilter, setLocationFilter] = useState("any");
  const [rolePreference, setRolePreference] = useState("any");
  const [voiceChatOnly, setVoiceChatOnly] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadPlayers();
  }, [user]);

  const loadPlayers = async () => {
    try {
      const supabase = createClient();
      
      // Get online players looking for matches
      const { data: playersData, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id) // Exclude current user
        .limit(20);

      if (error) throw error;

      // Process players data to match interface
      const processedPlayers = playersData?.map((player: any) => ({
        id: player.id,
        username: player.username || 'anonymous',
        display_name: player.display_name || 'Anonymous Gamer',
        avatar_url: player.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.id}`,
        skill_rating: player.forge_points || 1000, // Use forge points as skill rating
        rank: getRankFromPoints(player.forge_points || 1000),
        location: "Online", // Default location
        game: "Multi-Game", // Default game
        playstyle: ["Team Player", "Competitive"],
        availability: "online" as const,
        languages: ["English"],
        preferred_roles: ["Flexible"],
        recent_achievements: [`${player.forge_points || 0} Forge Points`],
        compatibility_score: Math.floor(Math.random() * 30) + 70 // Random compatibility
      })) || [];

      setPlayers(processedPlayers);
    } catch (error) {
      console.error('Error loading players:', error);
      toast({
        title: "Error loading players",
        description: "Please try refreshing the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRankFromPoints = (points: number) => {
    if (points >= 5000) return "Legendary";
    if (points >= 3000) return "Master";
    if (points >= 2000) return "Diamond";
    if (points >= 1500) return "Platinum";
    if (points >= 1000) return "Gold";
    if (points >= 500) return "Silver";
    return "Bronze";
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (session && session.status === "searching") {
      interval = setInterval(() => {
        setSearchProgress(prev => {
          if (prev >= 100) {
            // Simulate match found
            setSession({ ...session, status: "found" });
            toast({
              title: "Match Found!",
              description: "Players found. Preparing to connect...",
            });
            return 100;
          }
          return prev + Math.random() * 10;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [session, toast]);

  // Mock session data for quick match
  const mockSession: MatchmakingSession = {
    id: crypto.randomUUID(),
    game: selectedGame,
    mode: "ranked",
    skill_range: skillRange as [number, number],
    location_filter: locationFilter,
    max_players: 5,
    current_players: 1,
    estimated_wait: "1-2 min",
    status: "searching"
  };

  const startQuickMatch = () => {
    setSession(mockSession);
    setSearchProgress(0);
    toast({
      title: "Searching for players...",
      description: "Finding teammates with similar skill level.",
    });
  };

  const cancelSearch = () => {
    setSession(null);
    setSearchProgress(0);
    toast({
      title: "Search cancelled",
      description: "Returned to matchmaking lobby.",
    });
  };

  const invitePlayer = (playerId: string) => {
    toast({
      title: "Invitation sent!",
      description: `Invitation sent to ${players.find(p => p.id === playerId)?.display_name}`,
    });
  };

  const messagePlayer = (playerId: string) => {
    toast({
      title: "Opening chat...",
      description: `Starting conversation with ${players.find(p => p.id === playerId)?.display_name}`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <AuthNavbar />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-gaming-purple/20 via-gaming-pink/20 to-gaming-blue/20 pt-20 pb-8">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-gaming font-bold mb-2">
              <span className="bg-gradient-to-r from-gaming-purple to-gaming-pink bg-clip-text text-transparent">
                Smart Matchmaking
              </span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Find teammates who match your skill, style, and schedule
            </p>
          </motion.div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">2,847</p>
                <p className="text-sm text-muted-foreground">Players Online</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">1:23</p>
                <p className="text-sm text-muted-foreground">Avg Match Time</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">96%</p>
                <p className="text-sm text-muted-foreground">Match Quality</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-2xl font-bold">573</p>
                <p className="text-sm text-muted-foreground">Games Today</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Panel */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full mb-6">
                <TabsTrigger value="quick-match" className="flex-1">
                  <Zap className="mr-2 h-4 w-4" />
                  Quick Match
                </TabsTrigger>
                <TabsTrigger value="browse-players" className="flex-1">
                  <Search className="mr-2 h-4 w-4" />
                  Browse Players
                </TabsTrigger>
                <TabsTrigger value="create-lobby" className="flex-1">
                  <Users className="mr-2 h-4 w-4" />
                  Create Lobby
                </TabsTrigger>
              </TabsList>

              <TabsContent value="quick-match">
                <AnimatePresence mode="wait">
                  {!session ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Gamepad2 className="h-5 w-5" />
                            Quick Match Settings
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label>Game</Label>
                              <Select value={selectedGame} onValueChange={setSelectedGame}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="valorant">Valorant</SelectItem>
                                  <SelectItem value="gta-v">GTA V</SelectItem>
                                  <SelectItem value="minecraft">Minecraft</SelectItem>
                                  <SelectItem value="fortnite">Fortnite</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Region</Label>
                              <Select value={locationFilter} onValueChange={setLocationFilter}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="any">Any Region</SelectItem>
                                  <SelectItem value="na-west">NA West</SelectItem>
                                  <SelectItem value="na-east">NA East</SelectItem>
                                  <SelectItem value="eu">Europe</SelectItem>
                                  <SelectItem value="asia">Asia</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div>
                            <Label>Skill Range: {skillRange[0]} - {skillRange[1]} SR</Label>
                            <Slider
                              value={skillRange}
                              onValueChange={setSkillRange}
                              max={3000}
                              min={500}
                              step={50}
                              className="mt-2"
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <Label htmlFor="voice-chat">Voice Chat Only</Label>
                            <Switch
                              id="voice-chat"
                              checked={voiceChatOnly}
                              onCheckedChange={setVoiceChatOnly}
                            />
                          </div>

                          <Button 
                            onClick={startQuickMatch}
                            className="w-full bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90"
                            size="lg"
                          >
                            <Play className="mr-2 h-5 w-5" />
                            Find Match
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <Card className="text-center">
                        <CardContent className="p-8">
                          <div className="mb-6">
                            <div className="h-20 w-20 mx-auto bg-gradient-to-r from-gaming-purple to-gaming-pink rounded-full flex items-center justify-center mb-4">
                              <Search className="h-10 w-10 text-white animate-pulse" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">
                              {session.status === "searching" ? "Finding Players..." : "Match Found!"}
                            </h3>
                            <p className="text-muted-foreground mb-4">
                              {session.status === "searching" 
                                ? `Searching for ${session.game} players in your skill range`
                                : "Perfect match found! Connecting you now..."
                              }
                            </p>
                          </div>

                          <div className="mb-6">
                            <div className="flex justify-between text-sm text-muted-foreground mb-2">
                              <span>Progress</span>
                              <span>{Math.round(searchProgress)}%</span>
                            </div>
                            <Progress value={searchProgress} className="h-2" />
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                            <div>
                              <p className="text-muted-foreground">Players Found</p>
                              <p className="font-semibold">{session.current_players}/{session.max_players}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Estimated Wait</p>
                              <p className="font-semibold">{session.estimated_wait}</p>
                            </div>
                          </div>

                          <Button 
                            onClick={cancelSearch}
                            variant="outline"
                            disabled={session.status === "found"}
                          >
                            Cancel Search
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </TabsContent>

              <TabsContent value="browse-players">
                <div className="space-y-6">
                  {/* Filters */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Player Filters
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-4">
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Game" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Games</SelectItem>
                            <SelectItem value="valorant">Valorant</SelectItem>
                            <SelectItem value="gta-v">GTA V</SelectItem>
                            <SelectItem value="minecraft">Minecraft</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Skill Level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any Skill</SelectItem>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                            <SelectItem value="pro">Professional</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Availability" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="online">Online Now</SelectItem>
                            <SelectItem value="looking">Looking for Team</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Player List */}
                  <div className="space-y-4">
                    {players.map((player, index) => (
                      <motion.div
                        key={player.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-4">
                                <div className="relative">
                                  <Avatar className="h-16 w-16">
                                    <AvatarImage src={player.avatar_url} />
                                    <AvatarFallback>{player.username[0]?.toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <div className={cn(
                                    "absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-background",
                                    player.availability === "online" ? "bg-green-500" : "bg-gray-500"
                                  )}></div>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <h3 className="text-lg font-semibold">{player.display_name}</h3>
                                    <Badge variant="secondary">{player.rank}</Badge>
                                    <div className="flex items-center text-sm text-muted-foreground">
                                      <Star className="h-4 w-4 mr-1 text-yellow-500" />
                                      {player.compatibility_score}% match
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                                    <div className="flex items-center">
                                      <Gamepad2 className="h-4 w-4 mr-1" />
                                      {player.game}
                                    </div>
                                    <div className="flex items-center">
                                      <MapPin className="h-4 w-4 mr-1" />
                                      {player.location}
                                    </div>
                                    <div className="flex items-center">
                                      <Shield className="h-4 w-4 mr-1" />
                                      {player.skill_rating} SR
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    {player.playstyle.map((style) => (
                                      <Badge key={style} variant="outline" className="text-xs">
                                        {style}
                                      </Badge>
                                    ))}
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {player.recent_achievements.map((achievement) => (
                                      <Badge key={achievement} className="text-xs bg-gradient-to-r from-gaming-purple/20 to-gaming-pink/20">
                                        <Trophy className="h-3 w-3 mr-1" />
                                        {achievement}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col space-y-2">
                                <Button 
                                  size="sm"
                                  onClick={() => invitePlayer(player.id)}
                                  className="bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90"
                                >
                                  <UserPlus className="mr-2 h-4 w-4" />
                                  Invite
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => messagePlayer(player.id)}
                                >
                                  <MessageCircle className="mr-2 h-4 w-4" />
                                  Message
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="create-lobby">
                <Card>
                  <CardHeader>
                    <CardTitle>Create Custom Lobby</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Custom lobby creation coming soon!</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Your Match Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Your Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Matches Today</span>
                  <span className="font-semibold">7</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Win Rate</span>
                  <span className="font-semibold text-green-500">68%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Team Rating</span>
                  <span className="font-semibold">★ 4.7</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Forge Points</span>
                  <span className="font-semibold text-yellow-600">2,847 FP</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Teammates */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Teammates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {players.slice(0, 3).map((player) => (
                    <div key={player.id} className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={player.avatar_url} />
                        <AvatarFallback>{player.username[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{player.display_name}</p>
                        <p className="text-xs text-muted-foreground">{player.game}</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => invitePlayer(player.id)}>
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle>Matchmaking Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Complete your profile for better matches</li>
                  <li>• Use voice chat to improve team coordination</li>
                  <li>• Rate teammates after games</li>
                  <li>• Join servers for consistent groups</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
