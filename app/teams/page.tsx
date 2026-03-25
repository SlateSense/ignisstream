"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users,
  Plus,
  Search,
  Filter,
  Crown,
  Shield,
  Star,
  MapPin,
  Globe,
  Clock,
  Trophy,
  Settings,
  UserPlus,
  Calendar,
  TrendingUp,
  Award,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { TeamManager, Team, TeamRecommendation, MatchmakingCriteria } from "@/lib/teams/team-manager";

interface TeamFilters {
  game: string;
  region: string;
  type: string;
  skillRange: string;
  language: string;
  search: string;
}

export default function TeamsPage() {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [teamManager] = useState(() => new TeamManager());
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [recommendations, setRecommendations] = useState<TeamRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('discover');
  
  const [filters, setFilters] = useState<TeamFilters>({
    game: 'all',
    region: 'all',
    type: 'all',
    skillRange: 'all',
    language: 'all',
    search: ''
  });

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createTeamData, setCreateTeamData] = useState({
    name: '',
    tag: '',
    description: '',
    type: 'casual' as Team['type'],
    game: 'valorant',
    region: 'na',
    maxMembers: 5,
    isPublic: true,
    requiresApplication: false
  });

  useEffect(() => {
    loadTeamsData();
  }, [filters]);

  const loadTeamsData = async () => {
    setLoading(true);
    try {
      // Generate mock teams
      const mockTeams = generateMockTeams();
      setTeams(mockTeams);
      
      if (user) {
        // Get user's teams
        const userTeams = await teamManager.getUserTeams(user.id);
        setUserTeams(userTeams);
        
        // Get team recommendations
        const criteria: Partial<MatchmakingCriteria> = {
          gameMode: filters.game !== 'all' ? filters.game : undefined,
          region: filters.region !== 'all' ? filters.region : undefined,
          skillRange: { min: 1000, max: 2500 }
        };
        
        const recs = await teamManager.findTeams(criteria, user.id);
        setRecommendations(recs);
      }
    } catch (error) {
      console.error('Failed to load teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockTeams = (): Team[] => {
    const games = ['valorant', 'lol', 'csgo', 'fortnite'];
    const regions = ['na', 'eu', 'asia', 'oce'];
    const types: Team['type'][] = ['casual', 'competitive', 'professional'];
    
    return Array.from({ length: 20 }, (_, i) => ({
      id: `team-${i}`,
      name: `Team ${i + 1}`,
      tag: `T${i + 1}`,
      description: `A ${types[i % 3]} gaming team looking for skilled players`,
      type: types[i % 3],
      game: games[i % 4],
      region: regions[i % 4],
      language: ['en'],
      maxMembers: 5,
      currentMembers: 2 + (i % 3),
      isPublic: true,
      requiresApplication: i % 2 === 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      stats: {
        wins: 15 + (i * 2),
        losses: 8 + i,
        draws: 2,
        winRate: 65 + (i % 20),
        averageRating: 1500 + (i * 50),
        tournamentWins: i % 5,
        totalMatches: 25 + (i * 3),
        streak: { type: 'win' as const, count: 3 + (i % 5) },
        ranking: i + 1,
        points: 1000 + (i * 100),
        achievements: []
      },
      settings: {
        autoAcceptApplications: false,
        minimumSkillRating: 1000,
        maximumSkillRating: 3000,
        preferredRoles: [],
        activeHours: [],
        voiceRequired: i % 2 === 0,
        regionLocked: false,
        customRequirements: []
      }
    }));
  };

  const createTeam = async () => {
    if (!user) return;
    
    try {
      const teamId = await teamManager.createTeam(user.id, createTeamData);
      
      toast({
        title: "Team Created!",
        description: `${createTeamData.name} has been successfully created.`,
      });
      
      setShowCreateDialog(false);
      setCreateTeamData({
        name: '',
        tag: '',
        description: '',
        type: 'casual',
        game: 'valorant',
        region: 'na',
        maxMembers: 5,
        isPublic: true,
        requiresApplication: false
      });
      
      loadTeamsData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create team",
        variant: "destructive"
      });
    }
  };

  const joinTeam = async (teamId: string) => {
    if (!user) return;
    
    try {
      const success = await teamManager.joinTeam(user.id, teamId);
      
      if (success) {
        toast({
          title: "Request Sent!",
          description: "Your application has been submitted.",
        });
      } else {
        toast({
          title: "Failed to Join",
          description: "Could not join the team.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join team",
        variant: "destructive"
      });
    }
  };

  const getTeamTypeIcon = (type: Team['type']) => {
    switch (type) {
      case 'professional': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'competitive': return <Trophy className="h-4 w-4 text-blue-500" />;
      default: return <Users className="h-4 w-4 text-green-500" />;
    }
  };

  const getTeamTypeBadge = (type: Team['type']) => {
    const colors = {
      professional: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      competitive: 'bg-blue-100 text-blue-800 border-blue-300',
      casual: 'bg-green-100 text-green-800 border-green-300',
      clan: 'bg-purple-100 text-purple-800 border-purple-300'
    };
    
    return colors[type] || colors.casual;
  };

  const TeamCard = ({ team }: { team: Team }) => (
    <Card className="hover:shadow-lg transition-all cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarFallback className="bg-gradient-to-r from-gaming-purple to-gaming-pink text-white">
                {team.tag}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{team.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getTeamTypeBadge(team.type)} variant="outline">
                  {getTeamTypeIcon(team.type)}
                  {team.type}
                </Badge>
                <Badge variant="secondary">{team.game.toUpperCase()}</Badge>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">
              {team.currentMembers}/{team.maxMembers}
            </div>
            <Progress 
              value={(team.currentMembers / team.maxMembers) * 100} 
              className="h-2 w-16"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {team.description}
        </p>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="uppercase">{team.region}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>{team.stats.winRate}% WR</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              <span>{team.stats.averageRating} SR</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {team.settings.voiceRequired && (
              <Badge variant="outline" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Voice Req
              </Badge>
            )}
            {team.requiresApplication && (
              <Badge variant="outline" className="text-xs">
                Application Required
              </Badge>
            )}
          </div>
          
          <Button
            size="sm"
            onClick={() => joinTeam(team.id)}
            disabled={team.currentMembers >= team.maxMembers}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            {team.requiresApplication ? 'Apply' : 'Join'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-gaming-purple/20 via-gaming-pink/20 to-gaming-blue/20 pb-8">
        <div className="container mx-auto px-4 pt-20">
          <div className="text-center">
            <h1 className="text-4xl font-gaming font-bold mb-4">
              <span className="bg-gradient-to-r from-gaming-purple to-gaming-pink bg-clip-text text-transparent">
                Team Formation
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              Find your perfect squad and dominate the competition
            </p>
            
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Team
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Team</DialogTitle>
                  <DialogDescription>
                    Set up your team and start recruiting players
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Team Name</Label>
                      <Input
                        id="name"
                        value={createTeamData.name}
                        onChange={(e) => setCreateTeamData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter team name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tag">Tag</Label>
                      <Input
                        id="tag"
                        value={createTeamData.tag}
                        onChange={(e) => setCreateTeamData(prev => ({ ...prev, tag: e.target.value.toUpperCase() }))}
                        placeholder="TAG"
                        maxLength={5}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={createTeamData.description}
                      onChange={(e) => setCreateTeamData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your team..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="game">Game</Label>
                      <Select
                        value={createTeamData.game}
                        onValueChange={(value) => setCreateTeamData(prev => ({ ...prev, game: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="valorant">Valorant</SelectItem>
                          <SelectItem value="lol">League of Legends</SelectItem>
                          <SelectItem value="csgo">CS:GO</SelectItem>
                          <SelectItem value="fortnite">Fortnite</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="type">Team Type</Label>
                      <Select
                        value={createTeamData.type}
                        onValueChange={(value: Team['type']) => setCreateTeamData(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="competitive">Competitive</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="public">Public Team</Label>
                    <Switch
                      id="public"
                      checked={createTeamData.isPublic}
                      onCheckedChange={(checked) => setCreateTeamData(prev => ({ ...prev, isPublic: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="application">Require Applications</Label>
                    <Switch
                      id="application"
                      checked={createTeamData.requiresApplication}
                      onCheckedChange={(checked) => setCreateTeamData(prev => ({ ...prev, requiresApplication: checked }))}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createTeam} disabled={!createTeamData.name || !createTeamData.tag}>
                    Create Team
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="font-medium">Filters:</span>
              </div>
              
              <Select value={filters.game} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, game: value }))
              }>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Game" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Games</SelectItem>
                  <SelectItem value="valorant">Valorant</SelectItem>
                  <SelectItem value="lol">League of Legends</SelectItem>
                  <SelectItem value="csgo">CS:GO</SelectItem>
                  <SelectItem value="fortnite">Fortnite</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.region} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, region: value }))
              }>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="na">North America</SelectItem>
                  <SelectItem value="eu">Europe</SelectItem>
                  <SelectItem value="asia">Asia</SelectItem>
                  <SelectItem value="oce">Oceania</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.type} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, type: value }))
              }>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="competitive">Competitive</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex-1 max-w-xs">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search teams..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="discover">
              <Globe className="mr-2 h-4 w-4" />
              Discover Teams
            </TabsTrigger>
            <TabsTrigger value="recommended">
              <Star className="mr-2 h-4 w-4" />
              Recommended
            </TabsTrigger>
            <TabsTrigger value="my-teams">
              <Shield className="mr-2 h-4 w-4" />
              My Teams
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="discover" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <TeamCard key={team.id} team={team} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="recommended" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((rec) => (
                <div key={rec.team.id} className="relative">
                  <TeamCard team={rec.team} />
                  <Badge className="absolute top-2 right-2 bg-green-500">
                    {Math.round(rec.compatibility * 100)}% Match
                  </Badge>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="my-teams" className="mt-6">
            {userTeams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userTeams.map((team) => (
                  <TeamCard key={team.id} team={team} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Teams Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first team or join an existing one to get started
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Team
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
